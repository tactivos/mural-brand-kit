# Prompt for the other session: recover lost brand guide content

**Copy everything below the line into the other agent chat (or a new chat in this project) and send it.**

---

We need to recover content that was lost from `mural-brand-guidelines.html`. This project has **no git**, so we can’t revert via version control. You need to use this project’s **agent transcripts** to figure out what was removed and put it back.

**Your tasks:**

1. **Read the conversation history**  
   Open and read the agent transcript(s) for this project. They live at:  
   `~/.cursor/projects/Users-jmoore-Desktop-mural-brand-kit/agent-transcripts/`  
   (or the equivalent path under your Cursor project). Look at the **parent** session JSONL file(s) (not subagent files). The transcripts are one JSON object per line; focus on the `assistant` messages that **summarize what was added or removed** (e.g. “Summary of changes”, “Removed”, “Added”).

2. **Identify what was lost**  
   From the transcript, determine:
   - What was the state of the brand guide **before** the user asked to “remove” form-related content or sections?
   - Specifically look for:
     - **Form elements:** “Text inputs” subsection (e.g. First Name, Email examples, light and dark), “Select dropdowns” subsection (e.g. Location select, light and dark). The transcript mentions these being **removed**.
     - **Form patterns:** Contact Us (Full name, Email, Phone, Message) and Log In (Email, Password, Remember me, Forgot password) — these were **added** earlier to match Figma; if they’re missing now, they need to be restored.
     - Any **captions or intro text** that was removed from Form Checkbox, Form Radio, or Filter Button (the user asked to remove specific descriptive text; we may want that back or a cleaner version).
     - **Navbar** and **Footer** under Page components — the transcript says these subsections were removed; restore them if the user wants the guide to include them again.
   - List clearly what you found in the transcript as “removed” or “added” so we know what to restore.

3. **Compare with the current file**  
   Open `mural-brand-guidelines.html` in this workspace. For each item you identified as lost:
   - Check if it’s actually missing (e.g. no “Text inputs” or “Select dropdowns” under Form elements, no Form patterns, no Navbar/Footer under Page components).
   - Note any other sections or content that the transcript says were removed and are absent from the current file.

4. **Restore the lost content**  
   Re-add the missing pieces into `mural-brand-guidelines.html` so the guide is back to the state it was in **before** the user asked to remove form elements (and before any other removals that caused unintended loss). Use the transcript’s summaries to reconstruct:
   - **Structure:** Same section order and headings as before (e.g. Form elements → Text inputs, Select dropdowns, then Checkboxes & radios, Filter buttons & switches; Form patterns if they existed; Page components → Navbar, Footer, Application header, Content cards, etc.).
   - **Content:** Restore the actual demos (inputs, selects, light/dark), Form patterns (Contact Us, Log In) if they were added earlier, and Navbar/Footer blocks if they were removed. Match the existing style and CSS patterns in the file (e.g. same class names, same layout patterns).
   - If the transcript doesn’t give enough detail to recreate exact markup, infer from the rest of the file and the transcript descriptions (e.g. “form grid with First Name / Email examples (light and dark)”).

5. **Summarize what you did**  
   After editing, list exactly what you restored (e.g. “Text inputs subsection with light and dark demos”, “Select dropdowns subsection”, “Form patterns: Contact Us and Log In”, “Navbar and Footer under Page components”) and where in the file each piece lives (section IDs or headings).

Work step by step: read transcript → list what was lost → check current file → restore → summarize. If something in the transcript is ambiguous, say so and make a reasonable choice so we don’t lose content again.
