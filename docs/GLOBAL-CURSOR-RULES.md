# Global Cursor rules (spec-driven, safe editing)

Copy the content below into **Cursor Settings → Rules → Rules for AI** (or User Rules) so it applies across all your projects. These rules reduce overwrites, drift, and lost work by putting spec and repo first.

---

## Paste this into Cursor global Rules for AI

```
## Repo and spec first
- Prefer starting new work with a repo (git init) and a minimal spec before writing code or content. No repo = no history; no spec = no single source of truth.
- For design systems, style guides, or content-heavy projects: maintain a canonical section/list (e.g. SPEC.md, BRAND-SPEC.md) that defines what should exist. Treat it as the source of truth.

## Work in the spec before code
- When adding or changing features/sections: update the spec first (add/rename/remove entries), then implement to match. When removing something, remove it from the spec so future sessions don’t re-add it.
- Before large refactors or “revert”/“remove section” requests: suggest the user commit current state first, so they can restore with git if needed.

## Always check against the spec
- Before deleting a section, component, or file: check if it’s listed in the project’s spec or section list. If it is, confirm with the user and update the spec when removing.
- When the user says something “was there and is gone” or “we lost work”: use git history or project agent transcripts (if available) to see what changed; restore from spec or last good commit.

## Align spec with user needs
- When the user asks for a new section, feature, or removal: update the spec/list to reflect the desired state, then implement. Keep spec and implementation in sync.
- If the user’s request contradicts the current spec, update the spec to match their intent (and confirm if it’s a big change).
```

---

*To use: Cursor menu → Settings → General (or Rules) → Rules for AI → paste the block above. These rules apply globally; project rules in `.cursor/rules/` still override when they conflict.*
