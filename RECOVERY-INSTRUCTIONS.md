# Recovery instructions for lost brand guide content

Use this file when content was removed from `mural-brand-guidelines.html` and you need to restore it using this project’s agent transcripts (no git history available).

---

## Prompt to copy-paste (other session)

```
Read @RECOVERY-INSTRUCTIONS.md and do what it says: use this project’s agent transcripts to find what was removed from mural-brand-guidelines.html and restore it.
```

---

## What to do

1. **Read the agent transcripts**  
   Path: `~/.cursor/projects/Users-jmoore-Desktop-mural-brand-kit/agent-transcripts/`  
   Open the **parent** session JSONL (not subagent). Scan `assistant` messages for “Summary of changes”, “Removed”, “Added”.

2. **Identify what was removed**  
   Look for: Text inputs subsection, Select dropdowns subsection, Form patterns (Contact Us, Log In), Navbar, Footer, or any other sections the transcript says were removed.

3. **Check the current file**  
   Open `mural-brand-guidelines.html`. For each item above, confirm it’s missing.

4. **Restore the content**  
   Re-add missing subsections and demos into the right places. Match existing section order, headings, and CSS/class names. Use the transcript summaries and the rest of the file to reconstruct markup.

5. **Summarize**  
   List what you restored and where (section IDs or headings).

Work in order: read transcript → list what’s lost → check current file → restore → summarize.
