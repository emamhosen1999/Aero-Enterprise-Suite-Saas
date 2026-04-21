---
name: advanced-word-document-assistant
description: 'Full-featured Word document assistant: create, read, edit, validate, and convert .docx files using Claude-style multi-tool workflow (npm docx, pandoc, extract-text, Python XML, LibreOffice, Poppler). Use for advanced document automation, round-trip editing, and format conversion.'
argument-hint: 'Describe the document goal, audience, format, and specify if you want to create, read, edit, validate, or convert a .docx.'
user-invocable: true
---


# Advanced Word Document Assistant (Claude Workflow)

## What This Skill Produces
This skill enables full-cycle Word document automation:
- Create new .docx files from structured data or Markdown
- Read/extract content from .docx to Markdown/text for analysis
- Edit existing .docx (including XML-level edits)
- Validate and auto-repair .docx files
- Convert between .doc, .docx, .pdf, and images

## When To Use
Use this skill for any advanced .docx workflow:
- Create new .docx (from scratch or template)
- Read/extract content from .docx
- Edit/annotate existing .docx (including XML)
- Validate/fix .docx files
- Convert .doc/.docx to PDF or images

## Toolchain Overview (Claude Workflow)

| Task                | Tool/Script                      |
|---------------------|----------------------------------|
| Create `.docx`      | `docx` npm library (JavaScript)  |
| Read content        | `pandoc`, `extract-text`         |
| Edit existing       | Python XML scripts (`unpack.py`, `pack.py`, `comment.py`), `str_replace` |
| Validate            | `validate.py`                    |
| Convert formats     | LibreOffice (`soffice.py`), Poppler (`pdftoppm`) |

### Install core tools
- `npm install -g docx`
- `pip install python-docx lxml`
- `brew install pandoc poppler` (or use your OS package manager)
- LibreOffice (for `soffice` CLI)

## Inputs To Collect
Specify:
- Task: create, read, edit, validate, or convert
- Input file(s) and desired output format
- Document structure, template, or transformation rules

## Workflow Steps

### 1. Create new .docx (from Markdown or template)
- Use `docx` npm library (JavaScript)
	- Example: `node create_docx.js`

### 2. Read/extract content from .docx
- Use `pandoc`:
	- `pandoc input.docx -t markdown -o output.md`
- Or use `extract-text` for plain extraction

### 3. Edit existing .docx
- Use Python XML scripts:
	- `unpack.py` to unzip .docx to XML
	- Edit XML directly or with `str_replace`
	- `pack.py` to rezip into .docx
	- `comment.py` to add comments/annotations

### 4. Validate .docx
- Use `validate.py` to check and auto-repair schema issues

### 5. Convert formats
- Use LibreOffice CLI (`soffice.py`) for .doc/.docx <-> PDF
- Use Poppler (`pdftoppm`) for PDF to image

## Example Commands

### Create new .docx
```sh
node create_docx.js
```

### Extract content from .docx
```sh
pandoc input.docx -t markdown -o output.md
# or
extract-text input.docx > output.txt
```

### Edit existing .docx
```sh
python unpack.py input.docx temp_dir/
# ...edit XML in temp_dir/word/document.xml...
python pack.py temp_dir/ output.docx
```

### Validate .docx
```sh
python validate.py output.docx
```

### Convert .docx to PDF
```sh
soffice --headless --convert-to pdf output.docx
```

### Convert PDF to images
```sh
pdftoppm output.pdf page -png
```

## Recommended Document Structure
1. Title Page
2. Executive Summary
3. Context and Problem Statement
4. Objectives and Success Metrics
5. Current State Analysis
6. Options and Trade-offs
7. Recommended Approach
8. Implementation Plan (phases, timeline, owners)
9. Risks, Assumptions, Dependencies
10. Budget/Resource Considerations (if needed)
11. Governance and Decision Requests
12. Appendices (definitions, references, evidence tables)

## Quality Criteria (Completion Checks)
A draft is complete only when:
1. Every section has a clear purpose and no placeholder text.
2. Recommendations are specific, testable, and time-bound.
3. Risks include mitigation and owner suggestions.
4. Assumptions are explicit and labeled.
5. The requested audience can make a decision from the document without extra context.

## Output Modes
- .docx (Word)
- Markdown
- PDF
- Images (for visual QA)

## Advanced Enhancements
- XML-level editing for advanced automation
- Add comments/annotations programmatically
- Validate and auto-repair broken .docx
- Visual QA via PDF/image conversion

## Reusable Prompt Patterns
- "Create a new .docx report from this outline."
- "Extract all text from this .docx for review."
- "Edit this .docx to add a comment on page 2."
- "Validate and repair this .docx file."
- "Convert this .docx to PDF and PNG images."

## Guardrails
- Do not invent factual citations.
- Mark unverified claims as assumptions.
- Ask for missing critical data when confidence is low.
- Prefer clarity over stylistic complexity.
- Always validate .docx before sharing externally.

## Resources
- [docx npm library](https://www.npmjs.com/package/docx)
- [pandoc](https://pandoc.org/)
- [extract-text](https://www.npmjs.com/package/extract-text)
- [python-docx](https://python-docx.readthedocs.io/)
- [LibreOffice CLI](https://wiki.documentfoundation.org/Documentation/DevGuide/LibreOffice_Basic_Guide/Command_Line_Arguments)
- [Poppler](https://poppler.freedesktop.org/)
- Example Python XML scripts: `unpack.py`, `pack.py`, `comment.py`, `validate.py` (add to ./scripts/ as needed)
