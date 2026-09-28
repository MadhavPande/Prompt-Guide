// Prompt assembly engine. Mirrors build_prompt() in prompt_builder.py. Keep them in sync.

const SKELETON_FOR = { simple: "rtf", moderate: "structured", complex: "create" };
const LONG_SOURCE_CHARS = 1500;

const SECTION_META = {
  // key: [xml tag, heading, CREATE heading]
  role: ["role", "Role", "Character"],
  context: ["context", "Context", "Context"],
  task: ["task", "Task", "Request"],
  document: ["document", "Source Material", "Source Material"],
  examples: ["examples", "Examples", "Examples"],
  focus: ["focus", "Focus", "Focus"],
  constraints: ["constraints", "Constraints", "Adjustments"],
  approach: ["approach", "Approach", "Approach"],
  output_format: ["output_format", "Output Format", "Type of Output"],
  extras: ["before_you_start", "Before You Start", "Extras"],
};

function buildPrompt(K, input) {
  const a = K.activities.find((x) => x.id === input.activity) || K.activities[0];
  const txt = (v) => (v || "").trim();
  const task = txt(input.task);
  const context = txt(input.context);
  const audience = txt(input.audience);
  const source = txt(input.source);
  const examples = txt(input.examples);
  const focus = txt(input.focus);
  const userConstraints = txt(input.constraints);
  const style = input.style === "markdown" ? "markdown" : "xml";

  const complexity = input.complexity && input.complexity !== "auto" ? input.complexity : a.complexity;
  const skeleton = SKELETON_FOR[complexity];
  const fmt = input.format && input.format !== "auto" ? input.format : a.format;

  const selected = [];
  const pick = (id, reason) => selected.push({ id, reason });
  const tips = [];
  const sections = [];
  const add = (key, body, label, intro) => sections.push({ key, body, label, intro });

  pick(skeleton, {
    rtf: "Simple task: Role, Task and Format are enough. Extra scaffolding would only add noise.",
    structured: "Moderate task: full Role, Context, Task, Constraints and Format anatomy.",
    create: "Complex task: CREATE adds examples, adjustments and extras on top of the core structure.",
  }[skeleton]);

  const longSource = source.length > LONG_SOURCE_CHARS;
  const sourceLabel = a.sourceLabel || "Source material";
  if (source && longSource) add("document", source, sourceLabel);

  add("role", `You are ${a.role}.`);

  const ctx = [];
  if (context) ctx.push(context);
  if (audience) ctx.push(`The audience is: ${audience}.`);
  if (ctx.length) add("context", ctx.join("\n"));
  else if (skeleton !== "rtf") tips.push("Add context (who it's for, why it matters). It's the cheapest way to improve the output.");

  add("task", task || `[Describe your task, e.g. "${a.placeholder}"]`);

  if (source && !longSource) add("document", source, sourceLabel);

  if (examples) {
    add("examples", examples, null, "Follow the pattern of these examples exactly:");
    pick("few_shot", "You supplied examples, so the model will copy their pattern and format.");
  } else if (a.wantsExamples) {
    pick("zero_shot", "No examples given. Adding 2-3 input -> output examples would upgrade this to few-shot and tighten the format.");
    tips.push("Add 2-3 examples in the Examples box to switch from zero-shot to few-shot.");
  }

  if (source || examples) {
    pick("delimiters", style === "xml"
      ? "Pasted material is wrapped in XML tags so instructions and data can't blur together."
      : "Pasted material is fenced with triple quotes so instructions and data can't blur together.");
  }

  if (focus) {
    const keys = focus.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    add("focus", `Focus specifically on: ${keys.join(", ")}. Give these the most weight and mention other points only if essential.`);
    pick("dsp", "Focus keywords steer the model toward the angles you care about.");
  } else if (a.suggestFocus) {
    tips.push("Add focus keywords (e.g. \"financial impact, future growth\") to steer what gets emphasised.");
  }

  const cons = [];
  if (skeleton !== "rtf") cons.push(...a.constraints);
  if (userConstraints) cons.push(...userConstraints.split("\n").map((s) => s.trim().replace(/^[-*]\s*/, "")).filter(Boolean));
  if (input.tone && K.tones[input.tone]) cons.push(K.tones[input.tone]);
  if (input.length && K.lengths[input.length] && fmt !== "json" && fmt !== "code") cons.push(K.lengths[input.length]);
  if (cons.length) add("constraints", cons.map((c) => `- ${c}`).join("\n"));

  const approach = [];
  if (source) {
    approach.push(`Base your answer on the ${sourceLabel.toLowerCase()} provided${a.id === "doc_qa" ? "" : " and say so if something you need is missing from it"}.`);
    if (longSource) approach.push("The material is long: first pull out the passages most relevant to the task, then answer using them.");
    pick("grounding", longSource
      ? "Long source: it's placed at the top and the model extracts relevant passages before answering."
      : "Source material grounds the answer in your data instead of the model's memory.");
  }
  if (input.liveInfo) {
    approach.push("Work in a Thought -> Action -> Observation loop: state what you need to find (Thought), search or use a tool to get it (Action), then summarise what you found (Observation). Repeat until you have enough evidence, then give your final answer.");
    pick("react", "The task needs current information, so the model alternates reasoning with searching.");
  }
  const useTot = !!input.compare;
  if (useTot) {
    approach.push("Before answering, imagine three independent experts. Each proposes a distinct approach. They critique each other's ideas for risks, costs and weaknesses. Discard the weakest ideas, combine the best elements, and present the single optimized result.");
    pick("tot", "Several viable paths exist, so the model explores and prunes branches instead of committing to the first idea.");
  }
  if (!useTot && (a.reasoning || complexity === "complex")) {
    approach.push(style === "xml"
      ? "Think through the problem step by step before answering. Put your reasoning in <thinking> tags and your final answer in <answer> tags."
      : "Think through the problem step by step before answering. Show your reasoning, then give the result under a \"Final Answer\" heading.");
    pick("cot", a.reasoning
      ? "Multi-step logic: reasoning before answering cuts errors and hallucinations."
      : "Complex task: step-by-step reasoning keeps the model from jumping to conclusions.");
  }
  if (approach.length) add("approach", approach.join("\n"));

  let fmtText = K.formats[fmt] || fmt;
  if (fmt === "json") {
    fmtText += " If there are multiple items, return an array of objects with identical keys.";
    pick("structured_output", "JSON output is machine-readable, so it can go straight into code or a spreadsheet.");
  }
  add("output_format", fmtText);

  if (input.clarify) {
    add("extras", "Before you begin, ask me up to 3 clarifying questions about anything important that is unclear or missing. Wait for my answers before producing the final output.");
    pick("clarify", "The model checks in first instead of guessing at missing details.");
  }

  pick("iterative", "No prompt is perfect first time. Use the refinement tips below after your first run.");
  tips.push(...(a.tips || []));
  tips.push("If the result is off, change one thing (role, a constraint or the format) and re-run.");
  tips.push("Paste the output back and ask: \"Critique this against the constraints above, then give an improved version.\"");

  const prompt = sections.map((s) => renderSection(s, style, skeleton)).join("\n\n");
  return { prompt, selected, tips, complexity, skeleton, format: fmt, approxTokens: Math.ceil(prompt.length / 4) };
}

function renderSection(s, style, skeleton) {
  const [tag, heading, createHeading] = SECTION_META[s.key];
  const intro = s.intro ? `${s.intro}\n` : "";
  if (style === "xml") return `<${tag}>\n${intro}${s.body}\n</${tag}>`;
  const title = s.label || (skeleton === "create" ? createHeading : heading);
  const body = s.key === "document" || s.key === "examples" ? `"""\n${s.body}\n"""` : s.body;
  return `### ${title}\n${intro}${body}`;
}
