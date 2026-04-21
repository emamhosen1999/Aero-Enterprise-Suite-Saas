# DOCX Workflow Reference

## Goal
Accept a Word file (`.docx`) as input, transform content with advanced writing workflow, and produce a Word file (`.docx`) as output.

## Setup
Install dependency once:

```bash
pip install -r ./.github/skills/advanced-word-document-assistant/scripts/requirements.txt
```

## Step 1: Extract input DOCX

```bash
python ./.github/skills/advanced-word-document-assistant/scripts/docx_io.py extract --input ./input.docx --output ./work/input.md
```

## Step 2: Transform content
Use the extracted markdown as source. Apply the skill's decision flow:
- Select document class
- Select complexity tier (Quick/Standard/Advanced)
- Run quality checks

Write the transformed result to `./work/final.md`.

## Step 3: Render final DOCX

```bash
python ./.github/skills/advanced-word-document-assistant/scripts/docx_io.py render --input ./work/final.md --output ./output.docx --title "Final Report"
```

## Notes
- Converter supports headings (`#` to `######`), bullets (`-`), numbered items (`1.`), and paragraphs.
- For advanced Word layout (custom styles, TOC, headers/footers), extend the render step in `docx_io.py`.
