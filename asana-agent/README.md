# Asana Agent MVP

This is a small local script that generates a daily Markdown summary and visual dashboard of your Asana work.

## What it does

- pulls your open assigned tasks from Asana
- tries to pull tasks you are following or involved in
- groups tasks into useful buckets like Focus now, Coming up this week, Triage later, and Watching
- writes a report to `asana-agent/output/daily-asana-summary.md`
- writes a visual dashboard to `asana-agent/output/daily-asana-dashboard.html`

## Setup

1. Copy `asana-agent/.env.example` to `asana-agent/.env`
2. Add your Asana personal access token
3. Add `ASANA_WORKSPACE_GID` if you belong to more than one workspace
4. Run:

```bash
python3 asana-agent/asana_daily_summary.py
```

## Notes

- The script uses only Python standard library modules.
- Follower or involved task search depends on Asana workspace search access. If that API is unavailable, the report still works for assigned tasks.
- The script reads from Asana only. It does not modify tasks.
- Open `asana-agent/output/daily-asana-dashboard.html` in your browser after each run for the visual view.

## Next useful upgrades

- schedule it daily with `cron` or `launchd`
- add project-level prioritization rules
- publish the summary to Slack or email
