// Single source of truth for the web app (index.html) and the CLI (prompt_builder.py).
// The object literal assigned below must stay strict JSON:
// double quotes only, no comments, no trailing commas. Python parses it directly.
const KNOWLEDGE = {
  "techniques": {
    "rtf": {
      "name": "RTF",
      "group": "Skeleton",
      "what": "Role, Task, Format. The simplest professional framework.",
      "when": "Quick, well-defined tasks where extra context adds little.",
      "trigger": "You are an expert X. Do Y. Present it as Z."
    },
    "structured": {
      "name": "5-Part Structure",
      "group": "Skeleton",
      "what": "Role, Context, Task, Constraints, Output Format: the anatomy of a perfect prompt.",
      "when": "Most real-world tasks. The default workhorse.",
      "trigger": "Role / Context / Task / Constraints / Format"
    },
    "create": {
      "name": "CREATE",
      "group": "Skeleton",
      "what": "Character, Request, Examples, Adjustments, Type of output, Extras.",
      "when": "Complex or high-stakes work where you want the model to check in before starting.",
      "trigger": "... Ask me clarifying questions before starting."
    },
    "zero_shot": {
      "name": "Zero-Shot",
      "group": "Technique",
      "what": "A direct instruction with no examples; relies on the model's pre-trained knowledge.",
      "when": "Common tasks the model already understands well.",
      "trigger": "Classify the sentiment of this review: ..."
    },
    "few_shot": {
      "name": "Few-Shot",
      "group": "Technique",
      "what": "Show 2-5 input/output examples so the model copies the pattern.",
      "when": "You need a specific format, style or labelling scheme.",
      "trigger": "Example 1: ... -> ...  Example 2: ... -> ..."
    },
    "cot": {
      "name": "Chain of Thought",
      "group": "Reasoning",
      "what": "Ask the model to reason step by step before answering.",
      "when": "Math, logic, debugging, multi-step analysis. Reduces errors and hallucinations.",
      "trigger": "Think step by step."
    },
    "tot": {
      "name": "Tree of Thoughts",
      "group": "Reasoning",
      "what": "Explore several independent approaches, critique them, keep the best.",
      "when": "Strategy, brainstorming, decisions with multiple viable paths.",
      "trigger": "Imagine 3 experts brainstorming..."
    },
    "react": {
      "name": "ReAct",
      "group": "Reasoning",
      "what": "Reason + Act: a Thought -> Action (search/tool) -> Observation loop.",
      "when": "Research needing current information or tool use.",
      "trigger": "Use a Thought, Action, Observation loop."
    },
    "dsp": {
      "name": "Directional Stimulus",
      "group": "Technique",
      "what": "Add hint keywords that steer what the model focuses on.",
      "when": "Summaries or analyses where only certain angles matter.",
      "trigger": "Focus specifically on these keywords..."
    },
    "grounding": {
      "name": "Grounding (RAG-style)",
      "group": "Technique",
      "what": "Give the model a reference document and restrict answers to it.",
      "when": "Questions about your own notes, policies, contracts or data.",
      "trigger": "Based ONLY on the provided document..."
    },
    "delimiters": {
      "name": "Delimiters",
      "group": "Technique",
      "what": "Separate instructions from data with XML tags, ### or triple quotes.",
      "when": "Any time you paste text, code, data or examples into a prompt.",
      "trigger": "<document> ... </document>"
    },
    "structured_output": {
      "name": "Structured Output",
      "group": "Technique",
      "what": "Specify an exact machine-readable schema (JSON/CSV) for the answer.",
      "when": "Turning unstructured text into data, or feeding output to code.",
      "trigger": "Return a valid JSON array with keys: ..."
    },
    "clarify": {
      "name": "Clarifying Questions",
      "group": "Technique",
      "what": "Let the model ask what it needs before it starts (CREATE's 'Extras').",
      "when": "Ambiguous or personal tasks where a wrong guess wastes a round-trip.",
      "trigger": "Ask me clarifying questions before starting."
    },
    "iterative": {
      "name": "Iterative Refinement",
      "group": "Process",
      "what": "Draft -> Test -> Analyze -> Refine -> Repeat. Tune the prompt rather than start over.",
      "when": "Always. No prompt is perfect on the first run.",
      "trigger": "Refine the persona and constraints."
    }
  },

  "formats": {
    "prose": "Well-structured prose with short paragraphs and Markdown headings where helpful.",
    "bullets": "Concise bullet points grouped under clear headings.",
    "table": "A Markdown table, followed by a 2-3 sentence takeaway.",
    "json": "Valid JSON only. No prose before or after it and no code fences.",
    "numbered": "Numbered steps, one idea per step.",
    "code": "Complete, runnable code in a fenced code block, followed by a short explanation of key decisions.",
    "email": "An email with a subject line, greeting, body and sign-off.",
    "spec": "A structured specification document with numbered Markdown sections."
  },

  "lengths": {
    "short": "Keep it brief: roughly 150 words or fewer.",
    "medium": "Aim for roughly 300-500 words.",
    "long": "Be thorough. Depth matters more than brevity here."
  },

  "tones": {
    "professional": "Use a professional, confident tone.",
    "friendly": "Use a warm, friendly, conversational tone.",
    "persuasive": "Use a persuasive tone that builds toward a clear call to action.",
    "academic": "Use a precise, academic tone and define technical terms.",
    "simple": "Use plain language a 12-year-old could follow, and explain any jargon."
  },

  "activities": [
    {
      "id": "writing",
      "name": "Write Content",
      "blurb": "Blog posts, articles, social posts, scripts",
      "role": "an experienced content writer and editor who writes clear, engaging, audience-aware copy",
      "placeholder": "Write a blog post introducing our organic coffee brand",
      "format": "prose",
      "complexity": "moderate",
      "constraints": [
        "Avoid clichés and filler such as \"in today's fast-paced world\" or \"best-in-class\".",
        "Open with a hook that makes the reader want to continue."
      ],
      "tips": ["If it sounds generic, add a concrete audience (age, job, pain point) to the context."]
    },
    {
      "id": "email",
      "name": "Email & Messages",
      "blurb": "Cold emails, replies, announcements",
      "role": "a professional communication specialist",
      "placeholder": "Write a cold email to a Google recruiter for a Data Science internship",
      "format": "email",
      "complexity": "simple",
      "constraints": [
        "Keep it concise and skimmable.",
        "End with exactly one clear call to action."
      ],
      "tips": ["Paste a previous email you liked into Examples to lock in your voice."]
    },
    {
      "id": "code_write",
      "name": "Write Code",
      "blurb": "Functions, scripts, features",
      "role": "a senior software engineer who writes clean, well-tested, production-quality code",
      "placeholder": "Write a Python function that parses a CSV of transactions and returns monthly totals",
      "format": "code",
      "complexity": "moderate",
      "reasoning": true,
      "constraints": [
        "Handle edge cases and invalid input explicitly.",
        "Name the language, version and any libraries you rely on."
      ],
      "tips": ["Run the code, then paste any error back with: \"Here is the error. Find the root cause before fixing.\""]
    },
    {
      "id": "code_debug",
      "name": "Debug / Review Code",
      "blurb": "Find bugs and security issues",
      "role": "a senior engineer performing a careful code review",
      "placeholder": "Review this login logic for bugs and security vulnerabilities",
      "format": "numbered",
      "complexity": "moderate",
      "reasoning": true,
      "wantsSource": true,
      "sourceLabel": "Code",
      "constraints": [
        "Identify the root cause before proposing any fix.",
        "Provide the corrected code with a comment explaining each change."
      ],
      "tips": ["Include the exact error message and what you expected to happen."]
    },
    {
      "id": "code_refactor",
      "name": "Refactor Code",
      "blurb": "Cleaner, faster, same behaviour",
      "role": "a senior software engineer specialising in readable, maintainable code",
      "placeholder": "Refactor this nested if-else function into a lookup object",
      "format": "code",
      "complexity": "moderate",
      "wantsSource": true,
      "sourceLabel": "Code",
      "constraints": [
        "Preserve existing behaviour exactly; do not change the public interface.",
        "Explain each structural change in one line."
      ],
      "tips": ["Ask for a before/after list of behaviours to confirm nothing changed."]
    },
    {
      "id": "data_analysis",
      "name": "Analyze Data",
      "blurb": "Trends, KPIs, business insights",
      "role": "a data analyst who turns raw numbers into clear business decisions",
      "placeholder": "Find the top 3 products, the month with the highest growth, and 2 strategies for the weakest category",
      "format": "table",
      "complexity": "moderate",
      "reasoning": true,
      "wantsSource": true,
      "sourceLabel": "Data",
      "constraints": [
        "State your assumptions explicitly.",
        "Never invent numbers that are not in the data."
      ],
      "tips": ["Ask the model to show the calculation behind each headline number."]
    },
    {
      "id": "extraction",
      "name": "Extract Structured Data",
      "blurb": "Messy text into JSON or CSV",
      "role": "a data processing expert",
      "placeholder": "Extract name, years of experience, current role and primary skills from these candidate bios",
      "format": "json",
      "complexity": "simple",
      "wantsSource": true,
      "wantsExamples": true,
      "sourceLabel": "Raw text",
      "constraints": [
        "Use null for any field that is missing; never guess a value.",
        "Keep field names exactly as specified."
      ],
      "tips": ["Two worked examples in the Examples box will fix most formatting inconsistencies."]
    },
    {
      "id": "summarize",
      "name": "Summarize",
      "blurb": "Articles, notes, meetings, papers",
      "role": "an expert analyst who writes crisp, faithful summaries",
      "placeholder": "Summarize this article for a busy executive",
      "format": "bullets",
      "complexity": "simple",
      "wantsSource": true,
      "suggestFocus": true,
      "sourceLabel": "Text to summarize",
      "constraints": [
        "Stay faithful to the source; do not add outside information.",
        "Lead with the single most important takeaway."
      ],
      "tips": ["Use Focus keywords to steer the summary toward the angles you care about."]
    },
    {
      "id": "research",
      "name": "Research",
      "blurb": "Current info, market trends, fact-finding",
      "role": "a meticulous research analyst",
      "placeholder": "Analyze NVIDIA's stock performance versus competitors over the last 7 days",
      "format": "bullets",
      "complexity": "moderate",
      "liveInfo": true,
      "constraints": [
        "Cite a source for every factual claim.",
        "Clearly flag anything uncertain, outdated or unverified."
      ],
      "tips": ["ReAct only works if the model can actually browse. Otherwise paste sources into the source box."]
    },
    {
      "id": "strategy",
      "name": "Brainstorm & Strategy",
      "blurb": "Plans, growth ideas, problem solving",
      "role": "a senior strategy consultant",
      "placeholder": "How can a small local bakery increase sales by 50% in 3 months with a $500 budget?",
      "format": "bullets",
      "complexity": "complex",
      "compare": true,
      "constraints": [
        "Respect the stated budget, timeline and resources.",
        "Make every recommendation specific and actionable."
      ],
      "tips": ["Ask for the risks of the winning plan and how to detect early that it is failing."]
    },
    {
      "id": "decision",
      "name": "Compare & Decide",
      "blurb": "Weigh options, pick the best",
      "role": "an impartial decision analyst",
      "placeholder": "Should I learn Rust or Go next as a Python backend developer?",
      "format": "table",
      "complexity": "moderate",
      "compare": true,
      "reasoning": true,
      "constraints": [
        "Evaluate every option against the same explicit criteria.",
        "End with a clear recommendation and the conditions under which it would change."
      ],
      "tips": ["List your criteria and their weights in the Context box for a sharper verdict."]
    },
    {
      "id": "learn",
      "name": "Learn a Concept",
      "blurb": "Explanations, tutoring, study help",
      "role": "a patient expert tutor",
      "placeholder": "Explain how transformers and the attention mechanism work",
      "format": "prose",
      "complexity": "simple",
      "constraints": [
        "Start from intuition, then add technical detail.",
        "Include one concrete worked example.",
        "End with 3 short questions to check my understanding."
      ],
      "tips": ["Say what you already know in Context so it doesn't re-explain the basics."]
    },
    {
      "id": "math",
      "name": "Math & Logic",
      "blurb": "Problems, puzzles, calculations",
      "role": "a careful mathematician",
      "placeholder": "A farmer has 15 sheep. All but 8 die. How many are left?",
      "format": "numbered",
      "complexity": "simple",
      "reasoning": true,
      "constraints": [
        "Double-check the final answer by an independent method where possible."
      ],
      "tips": ["If the answer is wrong, ask it to find the first incorrect step rather than re-solve."]
    },
    {
      "id": "classify",
      "name": "Classify / Sentiment",
      "blurb": "Label reviews, tickets, messages",
      "role": "a precise text classifier",
      "placeholder": "Classify the sentiment of each review as positive, negative or neutral",
      "format": "json",
      "complexity": "simple",
      "wantsSource": true,
      "wantsExamples": true,
      "sourceLabel": "Items to classify",
      "constraints": [
        "Use only the allowed labels.",
        "If an item is genuinely ambiguous, label it and add a one-line reason."
      ],
      "tips": ["Include at least one tricky, borderline example so the model learns your edge cases."]
    },
    {
      "id": "doc_qa",
      "name": "Ask About a Document",
      "blurb": "Q&A over notes, policies, PDFs",
      "role": "an analyst who answers strictly from the provided material",
      "placeholder": "What are the most important concepts and exam-specific points in these lecture notes?",
      "format": "bullets",
      "complexity": "moderate",
      "wantsSource": true,
      "sourceLabel": "Document",
      "constraints": [
        "Answer ONLY from the document. If the answer is not there, say so plainly.",
        "Quote the relevant passage for each key point."
      ],
      "tips": ["For long documents, put the document first and your question last. Models attend better that way."]
    },
    {
      "id": "interview",
      "name": "Mock Interviewer",
      "blurb": "Practice interviews with feedback",
      "role": "a demanding but fair interviewer at a top company",
      "placeholder": "Interview me for a Junior Data Analyst role (SQL, Python, statistics)",
      "format": "prose",
      "complexity": "moderate",
      "clarify": true,
      "constraints": [
        "Ask one question at a time and wait for my answer before continuing.",
        "After each answer, score it out of 10 and give one specific improvement.",
        "Increase difficulty gradually."
      ],
      "tips": ["Paste the real job description into Context for questions that match the role."]
    },
    {
      "id": "legal_risk",
      "name": "Contract Risk Finder",
      "blurb": "Spot risky clauses in agreements",
      "role": "an experienced contract lawyer reviewing on behalf of the signing party",
      "placeholder": "Review this freelance agreement and flag clauses that are risky for me",
      "format": "table",
      "complexity": "complex",
      "reasoning": true,
      "wantsSource": true,
      "sourceLabel": "Contract",
      "constraints": [
        "Rate each risk High, Medium or Low and quote the exact clause.",
        "Suggest safer replacement wording for every High risk.",
        "Note that this is not a substitute for professional legal advice."
      ],
      "tips": ["Tell it which side you are on and your jurisdiction in Context."]
    },
    {
      "id": "app_spec",
      "name": "Build an App / Product",
      "blurb": "Full product specs for AI builders",
      "role": "a senior product architect and full-stack engineer",
      "placeholder": "Build a Food & Grocery Delivery app connecting customers, stores and delivery partners",
      "format": "spec",
      "complexity": "complex",
      "constraints": [
        "Cover: user roles and permissions, onboarding and auth, core features, admin dashboard, AI-powered features, notifications, security and privacy, scalability and performance, UX and accessibility, and a modular future-ready architecture.",
        "Keep the UI mobile-first and optimised for non-technical users."
      ],
      "tips": ["Build in phases: ask for the MVP first, then add modules one prompt at a time."]
    },
    {
      "id": "career",
      "name": "Resume & Career",
      "blurb": "Resume audits, cover letters, LinkedIn",
      "role": "a senior tech recruiter at a top-tier company",
      "placeholder": "Audit my resume for a Python/Cloud engineering role",
      "format": "numbered",
      "complexity": "moderate",
      "wantsSource": true,
      "sourceLabel": "Resume",
      "constraints": [
        "Score ATS-friendliness from 0 to 100.",
        "List critical missing keywords for the target role.",
        "Rewrite weak bullet points with quantified achievements."
      ],
      "tips": ["Paste the target job description into Context to get role-specific keywords."]
    }
  ],

  "guide": {
    "components": [
      ["Role / Persona", "Tell the AI who it is. \"Act as a senior data scientist.\""],
      ["Context", "The background and the why. \"I'm launching a coffee brand for Gen-Z.\""],
      ["Task", "A clear, verb-driven instruction. Summarize, Calculate, Draft."],
      ["Constraints", "What not to do. \"No jargon. Under 200 words.\""],
      ["Output Format", "The structure you want back: table, JSON, bullets."]
    ],
    "rules": [
      ["Be specific and explicit", "Vague prompts get vague results. \"Write a 500-word suspenseful story about a stray cat in London who finds a portal\" beats \"write a story about a cat\"."],
      ["Use delimiters", "Separate instructions from data with <tags>, ### or triple quotes so the model never confuses the two."],
      ["Show examples", "Models are pattern matchers. Two or three good examples (few-shot) beat a paragraph of description."],
      ["Ask for reasoning", "For logic, math and multi-step work, ask the model to think step by step before answering."],
      ["Garbage in, garbage out", "The output can only be as good as the context you give. Missing context forces the model to guess."],
      ["Iterate, don't restart", "Draft, test, analyze what's off, refine one thing, repeat."]
    ],
    "claude": [
      "Wrap each part of the prompt in XML tags (<document>, <examples>, <constraints>). Claude is trained to pay attention to them.",
      "Put long documents at the top and your question at the end.",
      "Explain why a constraint exists (\"no ellipses, this is read by a text-to-speech engine\"). Claude generalises from the reason.",
      "Say what to do, not only what to avoid: \"write in flowing paragraphs\" works better than \"no bullet points\".",
      "Ask for reasoning in <thinking> tags and the answer in <answer> tags so you can separate them.",
      "Context windows are large (~200K+ tokens), but instructions buried in a very long chat can still drift. Restate key rules when a thread gets long."
    ]
  }
};
