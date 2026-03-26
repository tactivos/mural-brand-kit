# Asana Agent Spec

This folder contains a local MVP that generates a daily Asana briefing for one user.

## Goal

Produce a concise daily summary of the user's work in Asana, with emphasis on:
- what needs attention today
- what is overdue
- what is blocked
- what is due soon
- what is stale and likely needs follow-up

## Inputs

- `ASANA_ACCESS_TOKEN`
- `ASANA_WORKSPACE_GID` optional if the user belongs to exactly one workspace
- `ASANA_REPORT_DAYS_AHEAD` optional, default `7`
- `ASANA_STALE_DAYS` optional, default `10`
- `ASANA_OUTPUT_PATH` optional, default `asana-agent/output/daily-asana-summary.md`

## Output

The script writes a Markdown report with:
- a headline summary
- a streamlined daily brief with Focus now, Coming up this week, Triage later, and Watching sections
- involved tasks the user is following when available
- grouped parent-task and subtask clusters that keep both visible
- inferred work-type subgroups inside each section, such as Blog, Event, Email, Webinar, and Template
- a visual HTML dashboard that presents the same daily brief in a cleaner card-based layout

## MVP Behavior

1. Discover the current Asana user via the API.
2. Resolve the workspace automatically when possible.
3. Fetch incomplete tasks assigned to the user.
4. Attempt to fetch follower or involved tasks via workspace search.
5. If workspace search is unavailable, continue with assigned tasks only.
6. Classify tasks into daily-summary buckets using simple date and dependency heuristics.
7. Render the result as a readable Markdown briefing.
8. When a parent task and its subtasks appear in the same section, group them together and sort the items by due date so earlier due items appear first.
9. Within each section, infer a work-type category from the task, parent, and project text and render subgroup headings to provide context for review.
10. Reduce redundant sections by combining urgent work into a single Focus now section and moving lower-priority review work into Triage later.
11. Generate a browser-friendly dashboard file from the same report data so the user can review work in a visual format instead of raw task lists.
12. Exclude non-real work items that contain `TEST` in the task title or parent task title.
13. Pull recent task comments for the most actionable sections and infer thread state, prioritizing signals like waiting on answer, answered your question, needs your response, and active thread over raw mention detection.
14. Use thread-state signals to influence task ranking so items with unresolved or newly answered discussion rise within actionable sections, especially Focus now.
15. In the visual dashboard, render `Triage later` and every section below it collapsed by default so the initial view keeps attention on the day-to-week execution sections.
16. For grouped parent-task clusters, treat the parent thread as the primary status source when available, generate a concise rollup at the group level, and avoid repeating the same parent comment summaries on every subtask card.
17. Format displayed due dates in a reader-friendly `Month day, year` style and phrase group rollups like plain-language project status updates rather than raw system summaries.
## Non-Goals For MVP

- no task mutation
- no comment posting
- no webhook server
- no background daemon
- no database

## Future Enhancements

- per-project rules
- task scoring tuned to the user's working style
- Slack or email delivery
- recurring scheduled runs via `launchd` or `cron`
- richer blocked and waiting-on analysis from task comments and status signals
