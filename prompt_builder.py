#!/usr/bin/env python3
"""
prompt_builder.py
=================

Command-line version of the Prompt Forge web app. Pick what you want an AI
(Claude, ChatGPT, Gemini...) to do, answer a few questions, and get a prompt
back. It picks the prompting frameworks (RTF, 5-part structure, CREATE,
few-shot, chain of thought, tree of thoughts, ReAct, directional stimulus,
grounding...) that suit your answers.

Uses the same knowledge base as the web app (knowledge.js) and mirrors
engine.js, so both produce identical prompts for identical input.

Usage
-----
Interactive wizard::

    python prompt_builder.py

One-shot from flags::

    python prompt_builder.py --activity summarize --task "Summarize this for my manager" \\
        --source-file article.txt --focus "costs, risks" --copy

List activities::

    python prompt_builder.py --list

No third-party dependencies. --copy uses tkinter's clipboard.
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKELETON_FOR = {"simple": "rtf", "moderate": "structured", "complex": "create"}
LONG_SOURCE_CHARS = 1500

SECTION_META = {
    "role": ("role", "Role", "Character"),
    "context": ("context", "Context", "Context"),
    "task": ("task", "Task", "Request"),
    "document": ("document", "Source Material", "Source Material"),
    "examples": ("examples", "Examples", "Examples"),
    "focus": ("focus", "Focus", "Focus"),
    "constraints": ("constraints", "Constraints", "Adjustments"),
    "approach": ("approach", "Approach", "Approach"),
    "output_format": ("output_format", "Output Format", "Type of Output"),
    "extras": ("before_you_start", "Before You Start", "Extras"),
}


def load_knowledge(path=HERE / "knowledge.js"):
    """knowledge.js is `const KNOWLEDGE = {...};`, and the object literal is strict JSON."""
    text = path.read_text(encoding="utf-8")
    start = text.index("{", text.index("KNOWLEDGE ="))
    return json.loads(text[start: text.rindex("}") + 1])


def build_prompt(K, inp):
    """Python mirror of buildPrompt() in engine.js."""
    a = next((x for x in K["activities"] if x["id"] == inp.get("activity")), K["activities"][0])
    txt = lambda k: (inp.get(k) or "").strip()
    task, context, audience = txt("task"), txt("context"), txt("audience")
    source, examples, focus = txt("source"), txt("examples"), txt("focus")
    user_constraints = txt("constraints")
    style = "markdown" if inp.get("style") == "markdown" else "xml"

    complexity = inp.get("complexity") if inp.get("complexity") not in (None, "", "auto") else a["complexity"]
    skeleton = SKELETON_FOR[complexity]
    fmt = inp.get("format") if inp.get("format") not in (None, "", "auto") else a["format"]

    selected, tips, sections = [], [], []
    pick = lambda i, reason: selected.append({"id": i, "reason": reason})
    add = lambda key, body, label=None, intro=None: sections.append(
        {"key": key, "body": body, "label": label, "intro": intro})

    pick(skeleton, {
        "rtf": "Simple task: Role, Task and Format are enough. Extra scaffolding would only add noise.",
        "structured": "Moderate task: full Role, Context, Task, Constraints and Format anatomy.",
        "create": "Complex task: CREATE adds examples, adjustments and extras on top of the core structure.",
    }[skeleton])

    long_source = len(source) > LONG_SOURCE_CHARS
    source_label = a.get("sourceLabel") or "Source material"
    if source and long_source:
        add("document", source, source_label)

    add("role", f"You are {a['role']}.")

    ctx = []
    if context:
        ctx.append(context)
    if audience:
        ctx.append(f"The audience is: {audience}.")
    if ctx:
        add("context", "\n".join(ctx))
    elif skeleton != "rtf":
        tips.append("Add context (who it's for, why it matters). It's the cheapest way to improve the output.")

    add("task", task or f'[Describe your task, e.g. "{a["placeholder"]}"]')

    if source and not long_source:
        add("document", source, source_label)

    if examples:
        add("examples", examples, None, "Follow the pattern of these examples exactly:")
        pick("few_shot", "You supplied examples, so the model will copy their pattern and format.")
    elif a.get("wantsExamples"):
        pick("zero_shot", "No examples given. Adding 2-3 input -> output examples would upgrade this "
                          "to few-shot and tighten the format.")
        tips.append("Add 2-3 examples in the Examples box to switch from zero-shot to few-shot.")

    if source or examples:
        pick("delimiters",
             "Pasted material is wrapped in XML tags so instructions and data can't blur together."
             if style == "xml" else
             "Pasted material is fenced with triple quotes so instructions and data can't blur together.")

    if focus:
        keys = [s.strip() for s in re.split(r"[,\n]", focus) if s.strip()]
        add("focus", f"Focus specifically on: {', '.join(keys)}. Give these the most weight and "
                     "mention other points only if essential.")
        pick("dsp", "Focus keywords steer the model toward the angles you care about.")
    elif a.get("suggestFocus"):
        tips.append('Add focus keywords (e.g. "financial impact, future growth") to steer what gets emphasised.')

    cons = []
    if skeleton != "rtf":
        cons.extend(a["constraints"])
    if user_constraints:
        cons.extend(re.sub(r"^[-*]\s*", "", s.strip()) for s in user_constraints.split("\n") if s.strip())
    if inp.get("tone") in K["tones"]:
        cons.append(K["tones"][inp["tone"]])
    if inp.get("length") in K["lengths"] and fmt not in ("json", "code"):
        cons.append(K["lengths"][inp["length"]])
    if cons:
        add("constraints", "\n".join(f"- {c}" for c in cons))

    approach = []
    if source:
        missing = "" if a["id"] == "doc_qa" else " and say so if something you need is missing from it"
        approach.append(f"Base your answer on the {source_label.lower()} provided{missing}.")
        if long_source:
            approach.append("The material is long: first pull out the passages most relevant to the task, "
                            "then answer using them.")
        pick("grounding",
             "Long source: it's placed at the top and the model extracts relevant passages before answering."
             if long_source else
             "Source material grounds the answer in your data instead of the model's memory.")
    if inp.get("liveInfo"):
        approach.append("Work in a Thought -> Action -> Observation loop: state what you need to find (Thought), "
                        "search or use a tool to get it (Action), then summarise what you found (Observation). "
                        "Repeat until you have enough evidence, then give your final answer.")
        pick("react", "The task needs current information, so the model alternates reasoning with searching.")
    use_tot = bool(inp.get("compare"))
    if use_tot:
        approach.append("Before answering, imagine three independent experts. Each proposes a distinct approach. "
                        "They critique each other's ideas for risks, costs and weaknesses. Discard the weakest "
                        "ideas, combine the best elements, and present the single optimized result.")
        pick("tot", "Several viable paths exist, so the model explores and prunes branches instead of "
                    "committing to the first idea.")
    if not use_tot and (a.get("reasoning") or complexity == "complex"):
        approach.append(
            "Think through the problem step by step before answering. Put your reasoning in <thinking> tags "
            "and your final answer in <answer> tags." if style == "xml" else
            'Think through the problem step by step before answering. Show your reasoning, then give the '
            'result under a "Final Answer" heading.')
        pick("cot", "Multi-step logic: reasoning before answering cuts errors and hallucinations."
             if a.get("reasoning") else
             "Complex task: step-by-step reasoning keeps the model from jumping to conclusions.")
    if approach:
        add("approach", "\n".join(approach))

    fmt_text = K["formats"].get(fmt, fmt)
    if fmt == "json":
        fmt_text += " If there are multiple items, return an array of objects with identical keys."
        pick("structured_output", "JSON output is machine-readable, so it can go straight into code or a spreadsheet.")
    add("output_format", fmt_text)

    if inp.get("clarify"):
        add("extras", "Before you begin, ask me up to 3 clarifying questions about anything important that is "
                      "unclear or missing. Wait for my answers before producing the final output.")
        pick("clarify", "The model checks in first instead of guessing at missing details.")

    pick("iterative", "No prompt is perfect first time. Use the refinement tips below after your first run.")
    tips.extend(a.get("tips", []))
    tips.append("If the result is off, change one thing (role, a constraint or the format) and re-run.")
    tips.append('Paste the output back and ask: "Critique this against the constraints above, then give an '
                'improved version."')

    prompt = "\n\n".join(render_section(s, style, skeleton) for s in sections)
    return {"prompt": prompt, "selected": selected, "tips": tips, "complexity": complexity,
            "skeleton": skeleton, "format": fmt, "approxTokens": math.ceil(len(prompt) / 4)}


def render_section(s, style, skeleton):
    tag, heading, create_heading = SECTION_META[s["key"]]
    intro = f"{s['intro']}\n" if s.get("intro") else ""
    if style == "xml":
        return f"<{tag}>\n{intro}{s['body']}\n</{tag}>"
    title = s.get("label") or (create_heading if skeleton == "create" else heading)
    body = f'"""\n{s["body"]}\n"""' if s["key"] in ("document", "examples") else s["body"]
    return f"### {title}\n{intro}{body}"


# ---------------------------------------------------------------- terminal UI

def ask(label, default=""):
    hint = f" [{default}]" if default else ""
    val = input(f"{label}{hint}: ").strip()
    return val or default


def ask_multiline(label):
    print(f"{label} (finish with an empty line; press Enter straight away to skip):")
    lines = []
    while True:
        line = input()
        if not line and (not lines or lines[-1] == ""):
            break
        lines.append(line)
    return "\n".join(lines).strip()


def ask_yes(label, default):
    val = ask(f"{label} (y/n)", "y" if default else "n").lower()
    return val.startswith("y")


def ask_choice(label, options, default):
    print(f"{label}: " + ", ".join(options))
    while True:
        val = ask("  choose", default)
        if val in options:
            return val
        print(f"  pick one of: {', '.join(options)}")


def wizard(K):
    acts = K["activities"]
    print("\nWhat do you want the AI to do?\n")
    for i, a in enumerate(acts, 1):
        print(f"  {i:2}. {a['name']:<24} {a['blurb']}")
    while True:
        raw = ask("\nNumber")
        if raw.isdigit() and 1 <= int(raw) <= len(acts):
            a = acts[int(raw) - 1]
            break
        print("Enter a number from the list.")

    print(f"\n{a['name']}: answer what you can, press Enter to skip.\n")
    inp = {"activity": a["id"]}
    inp["task"] = ask("Task (what exactly should it do?)") or ""
    if not inp["task"]:
        print(f'  (tip: e.g. "{a["placeholder"]}")')
        inp["task"] = ask("Task")
    inp["context"] = ask("Context / background (why, constraints of the situation)")
    inp["audience"] = ask("Audience (who is the output for?)")
    if a.get("wantsSource") or ask_yes("Paste source material (document, code, data)?", False):
        path = ask(f"{a.get('sourceLabel', 'Source material')}: path to a file (or Enter to paste)")
        inp["source"] = Path(path).read_text(encoding="utf-8") if path else ask_multiline("Paste it")
    if a.get("wantsExamples") or ask_yes("Add few-shot examples?", False):
        inp["examples"] = ask_multiline("Examples (e.g.  \"I loved it\" -> positive)")
    inp["focus"] = ask("Focus keywords, comma-separated")
    inp["constraints"] = ask("Extra constraints (separate with ';')").replace(";", "\n")
    inp["format"] = ask_choice("Output format", ["auto"] + list(K["formats"]), "auto")
    inp["tone"] = ask_choice("Tone", ["none"] + list(K["tones"]), "none")
    inp["length"] = ask_choice("Length", ["any"] + list(K["lengths"]), "any")
    inp["complexity"] = ask_choice("Complexity", ["auto", "simple", "moderate", "complex"], "auto")
    inp["liveInfo"] = ask_yes("Needs current/web information?", bool(a.get("liveInfo")))
    inp["compare"] = ask_yes("Explore & compare multiple approaches?", bool(a.get("compare")))
    inp["clarify"] = ask_yes("Let the AI ask clarifying questions first?",
                             bool(a.get("clarify")) or a["complexity"] == "complex")
    inp["style"] = ask_choice("Prompt style", ["xml", "markdown"], "xml")
    return inp


def show(K, result, explain=True):
    bar = "=" * 72
    print(f"\n{bar}\nYOUR PROMPT  (~{result['approxTokens']} tokens, {result['complexity']} task)\n{bar}\n")
    print(result["prompt"])
    if explain:
        print(f"\n{bar}\nFRAMEWORKS SELECTED\n{bar}")
        for s in result["selected"]:
            print(f"  * {K['techniques'][s['id']]['name']}: {s['reason']}")
        print("\nNEXT ITERATION TIPS")
        for t in result["tips"]:
            print(f"  - {t}")


def copy_to_clipboard(text):
    try:
        import tkinter
        root = tkinter.Tk()
        root.withdraw()
        root.clipboard_clear()
        root.clipboard_append(text)
        root.update()
        root.destroy()
        return True
    except Exception:
        return False


def main():
    K = load_knowledge()
    ids = [a["id"] for a in K["activities"]]
    p = argparse.ArgumentParser(description="Build an engineered prompt for any AI task.")
    p.add_argument("--list", action="store_true", help="list activities and exit")
    p.add_argument("--activity", choices=ids)
    p.add_argument("--task")
    p.add_argument("--context")
    p.add_argument("--audience")
    p.add_argument("--source-file", type=Path, help="file with source material (document, code, data)")
    p.add_argument("--examples-file", type=Path, help="file with few-shot examples")
    p.add_argument("--focus", help="comma-separated focus keywords")
    p.add_argument("--constraints", help="extra constraints, separated by ';'")
    p.add_argument("--format", choices=["auto"] + list(K["formats"]), default="auto")
    p.add_argument("--tone", choices=list(K["tones"]))
    p.add_argument("--length", choices=list(K["lengths"]))
    p.add_argument("--complexity", choices=["auto", "simple", "moderate", "complex"], default="auto")
    p.add_argument("--live", action=argparse.BooleanOptionalAction, help="needs current info (ReAct)")
    p.add_argument("--compare", action=argparse.BooleanOptionalAction, help="compare approaches (Tree of Thoughts)")
    p.add_argument("--clarify", action=argparse.BooleanOptionalAction, help="ask clarifying questions first")
    p.add_argument("--style", choices=["xml", "markdown"], default="xml",
                   help="xml tags (best for Claude) or markdown headings (any model)")
    p.add_argument("--out", type=Path, help="also save the prompt to this file")
    p.add_argument("--copy", action="store_true", help="copy the prompt to the clipboard")
    p.add_argument("--quiet", action="store_true", help="print only the prompt")
    args = p.parse_args()

    if args.list:
        for a in K["activities"]:
            print(f"{a['id']:<14} {a['name']:<24} {a['blurb']}")
        return

    if args.activity:
        a = next(x for x in K["activities"] if x["id"] == args.activity)
        pick = lambda v, d: d if v is None else v
        inp = {
            "activity": args.activity, "task": args.task, "context": args.context,
            "audience": args.audience, "focus": args.focus,
            "source": args.source_file.read_text(encoding="utf-8") if args.source_file else "",
            "examples": args.examples_file.read_text(encoding="utf-8") if args.examples_file else "",
            "constraints": (args.constraints or "").replace(";", "\n"),
            "format": args.format, "tone": args.tone, "length": args.length,
            "complexity": args.complexity, "style": args.style,
            "liveInfo": pick(args.live, bool(a.get("liveInfo"))),
            "compare": pick(args.compare, bool(a.get("compare"))),
            "clarify": pick(args.clarify, bool(a.get("clarify")) or a["complexity"] == "complex"),
        }
    else:
        try:
            inp = wizard(K)
        except (KeyboardInterrupt, EOFError):
            print("\nCancelled.")
            sys.exit(1)

    result = build_prompt(K, inp)
    if args.quiet:
        print(result["prompt"])
    else:
        show(K, result)
    if args.out:
        args.out.write_text(result["prompt"], encoding="utf-8")
        print(f"\nSaved to {args.out}")
    if args.copy or (not args.activity and not args.quiet and ask_yes("\nCopy prompt to clipboard?", True)):
        print("Copied." if copy_to_clipboard(result["prompt"]) else "Clipboard unavailable; use --out instead.")


if __name__ == "__main__":
    main()
