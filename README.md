# Prompt Forge

Pick what you want an AI to do. Prompt Forge builds the prompt, chooses the
prompting frameworks that suit your input, and tells you why it chose each one.

## Run it

- **Web:** open `index.html` in a browser. No server or build step is needed.
- **CLI:** `python prompt_builder.py` runs an interactive wizard. Run `--help` to see all flags.

```
python prompt_builder.py --activity doc_qa --task "Key exam points?" --source-file notes.txt --copy
python prompt_builder.py --list
```

## How frameworks are selected

| Signal | Framework added |
|---|---|
| Complexity simple / moderate / complex | Skeleton: **RTF** / **5-part** (Role, Context, Task, Constraints, Format) / **CREATE** |
| You paste examples | **Few-shot**. Without examples, activities that benefit from them are marked **zero-shot** with a tip. |
| You paste source material | **Grounding (RAG-style)** + **Delimiters**. Long sources move to the top, and the model is told to extract quotes first. |
| Activity needs reasoning, or the task is complex | **Chain of Thought** |
| "Explore multiple approaches" | **Tree of Thoughts** (replaces CoT) |
| "Needs current information" | **ReAct** loop |
| Focus keywords | **Directional Stimulus** |
| JSON format | **Structured Output** |
| "Ask questions first" | **Clarifying questions** (CREATE's *Extras*) |
| Always | **Iterative refinement**: tips for your next run |

Output style is either **XML tags** (best for Claude) or **Markdown headings** (any model).

## Files

- `knowledge.js`: activities, techniques, formats and guide content. The object is strict JSON so Python can parse it too. **Add new activities here.**
- `engine.js`: prompt assembly for the web app.
- `prompt_builder.py`: CLI. `build_prompt()` mirrors `engine.js`, so if you change one, change the other.
- `index.html`: UI and the guide tab.
