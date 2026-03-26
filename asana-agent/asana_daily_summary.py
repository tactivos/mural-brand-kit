#!/usr/bin/env python3
"""Generate a daily Asana summary in Markdown and HTML."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from urllib import error, parse, request


API_BASE = "https://app.asana.com/api/1.0"
CATEGORY_ORDER = [
    "Event",
    "Presentation",
    "Blog",
    "Case Study",
    "Email",
    "Newsletter",
    "Webinar",
    "Social",
    "Podcast",
    "Template",
    "Other",
]
TASK_FIELDS = ",".join(
    [
        "gid",
        "name",
        "resource_subtype",
        "permalink_url",
        "created_at",
        "modified_at",
        "completed",
        "completed_at",
        "due_on",
        "due_at",
        "notes",
        "num_subtasks",
        "assignee.gid",
        "assignee.name",
        "parent.gid",
        "parent.name",
        "projects.name",
        "memberships.project.name",
        "memberships.section.name",
        "dependencies.gid",
        "dependencies.name",
        "dependencies.completed",
        "dependents.gid",
        "dependents.name",
        "followers.gid",
        "followers.name",
    ]
)
STORY_FIELDS = ",".join(
    [
        "created_at",
        "created_by.gid",
        "created_by.name",
        "html_text",
        "resource_subtype",
        "text",
    ]
)


class AsanaApiError(RuntimeError):
    """Raised when the Asana API returns an error."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


@dataclass
class Config:
    token: str
    workspace_gid: Optional[str]
    output_path: Path
    report_days_ahead: int
    stale_days: int


def load_dotenv(dotenv_path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not dotenv_path.exists():
        return values

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        values[key.strip()] = value
    return values


def env_value(name: str, dotenv_values: Dict[str, str], default: Optional[str] = None) -> Optional[str]:
    return os.environ.get(name) or dotenv_values.get(name) or default


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a daily Asana summary.")
    parser.add_argument(
        "--output",
        help="Optional output path override for the Markdown report.",
    )
    return parser.parse_args()


def build_config(args: argparse.Namespace, repo_root: Path) -> Config:
    dotenv_values = load_dotenv(repo_root / "asana-agent" / ".env")
    token = env_value("ASANA_ACCESS_TOKEN", dotenv_values)
    if not token:
        raise SystemExit(
            "Missing ASANA_ACCESS_TOKEN. Add it to asana-agent/.env or export it in your shell."
        )

    output_override = args.output or env_value("ASANA_OUTPUT_PATH", dotenv_values)
    output_path = Path(output_override) if output_override else repo_root / "asana-agent" / "output" / "daily-asana-summary.md"
    if not output_path.is_absolute():
        output_path = repo_root / output_path

    return Config(
        token=token,
        workspace_gid=env_value("ASANA_WORKSPACE_GID", dotenv_values),
        output_path=output_path,
        report_days_ahead=int(env_value("ASANA_REPORT_DAYS_AHEAD", dotenv_values, "7") or "7"),
        stale_days=int(env_value("ASANA_STALE_DAYS", dotenv_values, "10") or "10"),
    )


def api_get(config: Config, path: str, params: Optional[Dict[str, str]] = None) -> Dict:
    url = f"{API_BASE}{path}"
    if params:
        url = f"{url}?{parse.urlencode(params)}"

    req = request.Request(
        url,
        headers={
            "Authorization": f"Bearer {config.token}",
            "Accept": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        message = body
        try:
            parsed = json.loads(body)
            errors = parsed.get("errors", [])
            if errors:
                message = "; ".join(item.get("message", "Unknown Asana API error") for item in errors)
        except json.JSONDecodeError:
            pass
        raise AsanaApiError(exc.code, message) from exc
    except error.URLError as exc:
        raise SystemExit(f"Unable to reach Asana API: {exc}") from exc

    return payload


def paginate(config: Config, path: str, params: Dict[str, str]) -> List[Dict]:
    items: List[Dict] = []
    offset: Optional[str] = None
    while True:
        page_params = dict(params)
        page_params["limit"] = "100"
        if offset:
            page_params["offset"] = offset
        payload = api_get(config, path, page_params)
        items.extend(payload.get("data", []))
        next_page = payload.get("next_page") or {}
        offset = next_page.get("offset")
        if not offset:
            return items


def parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def task_due_date(task: Dict) -> Optional[date]:
    if task.get("due_on"):
        try:
            return date.fromisoformat(task["due_on"])
        except ValueError:
            return None
    due_at = parse_iso_datetime(task.get("due_at"))
    return due_at.date() if due_at else None


def task_modified_at(task: Dict) -> Optional[datetime]:
    return parse_iso_datetime(task.get("modified_at"))


def task_is_blocked(task: Dict) -> bool:
    dependencies = task.get("dependencies") or []
    return any(not dependency.get("completed", False) for dependency in dependencies)


def task_location(task: Dict) -> str:
    memberships = task.get("memberships") or []
    if memberships:
        first = memberships[0]
        project = (first.get("project") or {}).get("name")
        section = (first.get("section") or {}).get("name")
        if project and section:
            return f"{project} / {section}"
        if project:
            return project

    projects = task.get("projects") or []
    if projects:
        return projects[0].get("name", "Unknown project")
    return "No project"


def task_context_text(task: Dict) -> str:
    parts = [task.get("name", ""), task_location(task)]
    parent = task.get("parent") or {}
    if parent.get("name"):
        parts.append(parent["name"])
    return " ".join(parts).lower()


def contains_any(text: str, terms: List[str]) -> bool:
    return any(term in text for term in terms)


def infer_task_category(task: Dict) -> str:
    parent = task.get("parent") or {}
    parent_text = parent.get("name", "").lower()
    location_text = task_location(task).lower()
    primary_text = " ".join([parent_text, location_text]).strip()
    full_text = task_context_text(task)

    if contains_any(primary_text, ["case study", "customer story"]):
        return "Case Study"
    if contains_any(primary_text, ["podcast", "seeing is how"]):
        return "Podcast"
    if contains_any(primary_text, ["blog", "article"]):
        return "Blog"
    if contains_any(primary_text, ["template", "statement starters", "affinity diagram"]):
        return "Template"
    if contains_any(primary_text, ["presentation", "deck", "slides"]):
        return "Presentation"
    if contains_any(
        primary_text,
        ["event", "booth", "gartner", "dinner", "summit", "conference", "sko", "field marketing"],
    ):
        return "Event"
    if contains_any(primary_text, ["newsletter"]):
        return "Newsletter"
    if contains_any(primary_text, ["webinar", "wbr", "on demand video"]):
        return "Webinar"
    if contains_any(primary_text, ["email", "abandon cart", "product updates"]):
        return "Email"

    if contains_any(full_text, ["case study", "customer story"]):
        return "Case Study"
    if contains_any(full_text, ["podcast", "seeing is how"]):
        return "Podcast"
    if contains_any(full_text, ["blog", "article"]):
        return "Blog"
    if contains_any(full_text, ["template", "statement starters", "affinity diagram"]):
        return "Template"
    if contains_any(full_text, ["presentation", "deck", "slides"]):
        return "Presentation"
    if contains_any(
        full_text,
        ["event", "booth", "gartner", "dinner", "summit", "conference", "sko", "field marketing"],
    ):
        return "Event"
    if contains_any(full_text, ["newsletter"]):
        return "Newsletter"
    if contains_any(full_text, ["webinar", "wbr", "on demand video"]):
        return "Webinar"
    if contains_any(full_text, ["email", "abandon cart", "product updates"]):
        return "Email"
    if contains_any(full_text, ["social", "linkedin", "gif", "video"]):
        return "Social"
    return "Other"


def task_group_key(task: Dict) -> str:
    parent = task.get("parent") or {}
    return parent.get("gid") or task["gid"]


def task_group_name(task: Dict) -> str:
    parent = task.get("parent") or {}
    return parent.get("name") or task["name"]


def signal_rank_value(label: str) -> int:
    ranks = {
        "Needs your response": 0,
        "Waiting on answer": 1,
        "Active thread": 2,
        "Answered your question": 3,
    }
    return ranks.get(label, 4)


def effective_thread_signals(task: Dict) -> List[Dict]:
    signals: List[Dict] = []
    seen_pairs = set()
    for source in [task.get("thread_signals") or [], task.get("parent_thread_signals") or []]:
        for signal in source:
            pair = (signal.get("label", ""), signal.get("summary", ""))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            signals.append(signal)
    return signals


def thread_signal_rank(task: Dict) -> int:
    signals = effective_thread_signals(task)
    if not signals:
        return 4
    return min(signal_rank_value(signal.get("label", "")) for signal in signals)


def primary_thread_signal(task: Dict) -> Optional[Dict]:
    signals = effective_thread_signals(task)
    if not signals:
        return None
    return min(signals, key=lambda signal: signal_rank_value(signal.get("label", "")))


def thread_badge_class(label: str) -> str:
    if label == "Needs your response":
        return "badge badge-thread-response"
    if label == "Waiting on answer":
        return "badge badge-thread-waiting"
    if label == "Answered your question":
        return "badge badge-thread-answered"
    if label == "Active thread":
        return "badge badge-thread-active"
    if label == "Blocked":
        return "badge badge-blocked"
    if label == "At risk":
        return "badge badge-thread-waiting"
    return "badge badge-thread-neutral"


def group_sort_key(task: Dict, today: date) -> tuple:
    due = task_due_date(task)
    due_rank = 9999 if due is None else (due - today).days
    is_subtask_rank = 1 if (task.get("parent") or {}).get("gid") else 0
    modified = task_modified_at(task) or datetime(1970, 1, 1, tzinfo=timezone.utc)
    signal_rank = thread_signal_rank(task)
    return (signal_rank, due_rank, is_subtask_rank, -modified.timestamp(), task["name"].lower())


def summarize_task(task: Dict, today: date) -> str:
    due = task_due_date(task)
    location = task_location(task)
    parent = task.get("parent") or {}
    notes = task.get("notes", "").strip()
    note_hint = ""
    if notes:
        single_line = " ".join(notes.split())
        note_hint = f" - {single_line[:100]}{'...' if len(single_line) > 100 else ''}"

    pieces = [f"[{task['name']}]({task.get('permalink_url', '')})", f"`{location}`"]
    if due:
        label = "overdue" if due < today else "due"
        pieces.append(f"{label} {format_display_date(due)}")
    if task_is_blocked(task):
        pieces.append("blocked")
    if parent.get("name"):
        pieces.append(f"subtask of {parent['name']}")
    return " - ".join(pieces) + note_hint


def task_note_excerpt(task: Dict, limit: int = 140) -> str:
    notes = task.get("notes", "").strip()
    if not notes:
        return ""
    single_line = " ".join(notes.split())
    return f"{single_line[:limit]}{'...' if len(single_line) > limit else ''}"


def format_display_date(value: date) -> str:
    return f"{value.strftime('%B')} {value.day}, {value.year}"


def due_label(task: Dict, today: date) -> str:
    due = task_due_date(task)
    if due is None:
        return "No due date"
    if due < today:
        return f"Overdue {format_display_date(due)}"
    if due == today:
        return "Due today"
    return f"Due {format_display_date(due)}"


def is_real_task(task: Dict) -> bool:
    return "TEST" not in task_context_text(task).upper()


def normalize_whitespace(value: str) -> str:
    return " ".join(re.sub(r"https?://\S+", "", value).split())


def comment_mentions_me(comment: Dict, me: Dict) -> bool:
    text = " ".join(
        [
            comment.get("text", "") or "",
            comment.get("html_text", "") or "",
        ]
    ).lower()
    email = (me.get("email") or "").lower()
    first_name = (me.get("name") or "").split(" ")[0].lower() if me.get("name") else ""
    candidates = [
        (me.get("name") or "").lower(),
        email,
        email.split("@")[0] if email else "",
        f"@{first_name}" if first_name else "",
    ]
    return any(candidate and candidate in text for candidate in candidates)


def comment_requests_response(text: str, mentions_me: bool) -> bool:
    lowered = text.lower()
    ask_phrases = [
        "let us know",
        "please let us know",
        "can you",
        "could you",
        "would you",
        "will you",
        "are you",
        "do you",
        "need you",
        "waiting on you",
        "your input",
        "please review",
        "please confirm",
    ]
    if any(phrase in lowered for phrase in ask_phrases):
        return True
    if mentions_me and "?" in lowered:
        return True
    return False


def summarize_comment_text(text: str) -> str:
    return f"{text[:140]}{'...' if len(text) > 140 else ''}"


def merge_recent_comments(*comment_lists: Iterable[Dict]) -> List[Dict]:
    by_key: Dict[tuple, Dict] = {}
    for comments in comment_lists:
        for comment in comments:
            key = (
                comment.get("author", ""),
                comment.get("created_at", ""),
                comment.get("text", ""),
            )
            by_key[key] = comment
    return sorted(
        by_key.values(),
        key=lambda comment: comment.get("created_at_dt") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )


def merge_thread_signals(*signal_lists: Iterable[Dict]) -> List[Dict]:
    signals: List[Dict] = []
    seen_pairs = set()
    for signal_list in signal_lists:
        for signal in signal_list:
            pair = (signal.get("label", ""), signal.get("summary", ""))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            signals.append(signal)
    return signals


def fetch_recent_comments(config: Config, me: Dict, task_gid: str) -> List[Dict]:
    payload = api_get(
        config,
        f"/tasks/{task_gid}/stories",
        {
            "limit": "20",
            "opt_fields": STORY_FIELDS,
        },
    )
    comments = []
    for story in payload.get("data", []):
        subtype = (story.get("resource_subtype") or "").lower()
        text = normalize_whitespace(story.get("text", "") or "")
        if "comment" not in subtype or not text:
            continue
        author = story.get("created_by") or {}
        if text.lower().startswith("reminder:"):
            continue
        if "liked your comment" in text.lower():
            continue
        from_me = author.get("gid") == me.get("gid")
        mentions_me = comment_mentions_me(story, me) and not from_me
        is_question = "?" in text
        created_at = story.get("created_at", "")
        needs_response_candidate = (not from_me) and comment_requests_response(text, mentions_me)
        comments.append(
            {
                "author": author.get("name", "Unknown"),
                "created_at": created_at,
                "created_at_dt": parse_iso_datetime(created_at),
                "text": text,
                "summary": summarize_comment_text(text),
                "from_me": from_me,
                "mentions_me": mentions_me,
                "is_question": is_question,
                "needs_response_candidate": needs_response_candidate,
            }
        )

    comments.sort(key=lambda comment: comment.get("created_at_dt") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return comments[:8]


def build_thread_signals(task: Dict, me: Dict) -> List[Dict]:
    comments_desc = task.get("recent_comments") or []
    if not comments_desc:
        return []

    now = datetime.now(timezone.utc)
    signal_window = now - timedelta(days=14)
    active_window = now - timedelta(days=5)
    comments = [
        comment
        for comment in reversed(comments_desc)
        if comment.get("created_at_dt") and comment["created_at_dt"] >= signal_window
    ]
    if not comments:
        return []

    signals: List[Dict] = []

    my_questions = [comment for comment in comments if comment.get("from_me") and comment.get("is_question")]
    if my_questions:
        last_my_question = my_questions[-1]
        later_replies = [
            comment
            for comment in comments
            if not comment.get("from_me") and comment["created_at_dt"] > last_my_question["created_at_dt"]
        ]
        if later_replies:
            latest_reply = later_replies[-1]
            signals.append(
                {
                    "label": "Answered your question",
                    "summary": f"{latest_reply['author']}: {latest_reply['summary']}",
                    "attention": False,
                }
            )
        else:
            signals.append(
                {
                    "label": "Waiting on answer",
                    "summary": last_my_question["summary"],
                    "attention": True,
                }
            )

    response_candidates = [
        comment
        for comment in comments
        if comment.get("needs_response_candidate")
    ]
    if response_candidates:
        latest_response_candidate = response_candidates[-1]
        my_follow_up = [
            comment
            for comment in comments
            if comment.get("from_me") and comment["created_at_dt"] > latest_response_candidate["created_at_dt"]
        ]
        if not my_follow_up:
            signals.append(
                {
                    "label": "Needs your response",
                    "summary": f"{latest_response_candidate['author']}: {latest_response_candidate['summary']}",
                    "attention": True,
                }
            )

    active_comments = [
        comment
        for comment in comments
        if comment["created_at_dt"] >= active_window
    ]
    active_non_me_authors = sorted({comment["author"] for comment in active_comments if not comment.get("from_me")})
    if len(active_comments) >= 3 and len(active_non_me_authors) >= 2:
        latest_active = active_comments[-1]
        author_list = ", ".join(active_non_me_authors[:3])
        signals.append(
            {
                "label": "Active thread",
                "summary": f"{len(active_comments)} recent comments across {author_list}. Latest: {latest_active['author']}: {latest_active['summary']}",
                "attention": False,
            }
        )

    deduped: List[Dict] = []
    seen_pairs = set()
    for signal in signals:
        pair = (signal["label"], signal["summary"])
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        deduped.append(signal)
    return deduped[:2]


def build_group_rollup(tasks: List[Dict], today: date) -> Dict:
    parent_name = ""
    parent_comments: List[Dict] = []
    parent_signals: List[Dict] = []
    own_comments: List[Dict] = []
    own_signals: List[Dict] = []

    for task in tasks:
        parent = task.get("parent") or {}
        if parent.get("name") and not parent_name:
            parent_name = parent["name"]
        parent_comments.extend(task.get("parent_recent_comments") or [])
        parent_signals.extend(task.get("parent_thread_signals") or [])
        own_comments.extend(task.get("recent_comments") or [])
        own_signals.extend(task.get("thread_signals") or [])

    context_comments = merge_recent_comments(parent_comments) if parent_comments else merge_recent_comments(own_comments)
    context_signals = merge_thread_signals(parent_signals) if parent_signals else merge_thread_signals(own_signals)
    context_signal_task = {
        "thread_signals": context_signals,
    }
    strongest_signal = primary_thread_signal(context_signal_task)
    latest_comment = context_comments[0] if context_comments else None

    blocked_tasks = [task for task in tasks if task_is_blocked(task)]
    due_tasks = sorted(
        [task for task in tasks if task_due_date(task) is not None],
        key=lambda task: (task_due_date(task) or today, task["name"].lower()),
    )
    overdue_tasks = [task for task in due_tasks if (task_due_date(task) or today) < today]
    next_due_task = due_tasks[0] if due_tasks else None

    if strongest_signal:
        signal_label = strongest_signal["label"]
        status_label = strongest_signal["label"]
        if signal_label == "Needs your response":
            overview = f"Waiting on your reply before this work can move forward. {strongest_signal['summary']}"
        elif signal_label == "Waiting on answer":
            overview = f"You are waiting on an answer before the next step. {strongest_signal['summary']}"
        elif signal_label == "Answered your question":
            overview = f"You got an answer in the latest thread. {strongest_signal['summary']}"
        elif signal_label == "Active thread":
            overview = f"This project has an active discussion right now. {strongest_signal['summary']}"
        else:
            overview = strongest_signal["summary"]
    elif blocked_tasks:
        focus_task = blocked_tasks[0]
        if len(blocked_tasks) == 1:
            overview = f"This project is blocked right now. The first blocker is {focus_task['name']}."
        else:
            overview = f"This project has {len(blocked_tasks)} blocked items. Start with {focus_task['name']}."
        status_label = "Blocked"
    elif overdue_tasks:
        focus_task = overdue_tasks[0]
        if len(overdue_tasks) == 1:
            overview = f"This project is slipping. {focus_task['name']} is overdue."
        else:
            overview = f"This project is at risk. {len(overdue_tasks)} items are overdue, starting with {focus_task['name']}."
        status_label = "At risk"
    elif next_due_task:
        overview = f"On track for now. The next milestone is {next_due_task['name']}, due {format_display_date(task_due_date(next_due_task) or today)}."
        status_label = "In progress"
    else:
        overview = "This project looks quiet right now. Review the task details to confirm what should move next."
        status_label = "In progress"

    if blocked_tasks:
        next_focus = f"Work the blocker on {blocked_tasks[0]['name']}."
    elif strongest_signal and strongest_signal["label"] == "Needs your response":
        next_focus = "Reply in the latest thread before moving the task work forward."
    elif next_due_task:
        next_focus = f"Move {next_due_task['name']} next."
    elif tasks:
        next_focus = f"Review {tasks[0]['name']} and confirm the next concrete step."
    else:
        next_focus = ""

    latest_summary = ""
    if latest_comment:
        latest_summary = f"{latest_comment['author']}: {latest_comment['summary']}"

    badges = [{"label": status_label, "class": thread_badge_class(status_label)}]
    if parent_comments:
        badges.append({"label": "Parent thread", "class": "badge badge-context"})
    if next_due_task:
        badges.append({"label": due_label(next_due_task, today), "class": "badge badge-due"})
    if blocked_tasks:
        blocked_label = f"{len(blocked_tasks)} blocked" if len(blocked_tasks) > 1 else "Blocked"
        badges.append({"label": blocked_label, "class": "badge badge-blocked"})

    show = len(tasks) > 1 or bool(parent_comments) or bool(latest_summary) or bool(strongest_signal)
    return {
        "show": show,
        "source_name": parent_name or task_group_name(tasks[0]),
        "has_parent_context": bool(parent_comments),
        "overview": overview,
        "latest": latest_summary,
        "next_focus": next_focus,
        "badges": badges,
    }


def attach_recent_comments(config: Config, me: Dict, sections: List[Dict]) -> Optional[str]:
    actionable_prefixes = ("Focus now", "Coming up", "Watching")
    tasks_by_gid: Dict[str, Dict] = {}
    for section in sections:
        heading = section["heading"]
        if not any(heading.startswith(prefix) for prefix in actionable_prefixes):
            continue
        for task in section["items"]:
            tasks_by_gid[task["gid"]] = task

    gids_to_fetch = set(tasks_by_gid.keys())
    for task in tasks_by_gid.values():
        parent_gid = ((task.get("parent") or {}).get("gid") or "").strip()
        if parent_gid:
            gids_to_fetch.add(parent_gid)

    recent_comment_cache: Dict[str, List[Dict]] = {}
    thread_signal_cache: Dict[str, List[Dict]] = {}
    unavailable_note: Optional[str] = None
    for task_gid in gids_to_fetch:
        try:
            recent_comments = fetch_recent_comments(config, me, task_gid)
            recent_comment_cache[task_gid] = recent_comments
            thread_signal_cache[task_gid] = build_thread_signals({"recent_comments": recent_comments}, me)
        except AsanaApiError as exc:
            if exc.status in {402, 403, 404}:
                unavailable_note = "Recent comment summaries are unavailable with the current Asana access."
                break
            raise

    for task in tasks_by_gid.values():
        task_gid = task["gid"]
        task["recent_comments"] = recent_comment_cache.get(task_gid, [])
        task["thread_signals"] = thread_signal_cache.get(task_gid, [])
        parent_gid = ((task.get("parent") or {}).get("gid") or "").strip()
        task["parent_recent_comments"] = recent_comment_cache.get(parent_gid, []) if parent_gid else []
        task["parent_thread_signals"] = thread_signal_cache.get(parent_gid, []) if parent_gid else []

    return unavailable_note


def markdown_comment_lines(task: Dict, indent_level: int = 0) -> List[str]:
    signals = task.get("thread_signals") or []
    if not signals:
        return []

    lines: List[str] = []
    for signal in signals:
        prefix = "  " * (indent_level + 1) + "- "
        lines.append(f"{prefix}{signal['label']}: {signal['summary']}")
    return lines


def dedupe_tasks(tasks: Iterable[Dict]) -> List[Dict]:
    by_gid: Dict[str, Dict] = {}
    for task in tasks:
        by_gid[task["gid"]] = task
    return list(by_gid.values())


def sort_key(task: Dict, today: date) -> tuple:
    due = task_due_date(task)
    no_due_rank = 1 if due is None else 0
    signal_rank = thread_signal_rank(task)
    overdue_days = (today - due).days if due and due < today else 0
    due_rank = 9999 if due is None else (due - today).days
    blocked_rank = 1 if task_is_blocked(task) else 0
    milestone_rank = 0 if task.get("resource_subtype") == "milestone" else 1
    modified = task_modified_at(task) or datetime(1970, 1, 1, tzinfo=timezone.utc)
    return (no_due_rank, signal_rank, -overdue_days, due_rank, blocked_rank, milestone_rank, -modified.timestamp())


def fetch_me(config: Config) -> Dict:
    payload = api_get(
        config,
        "/users/me",
        {
            "opt_fields": "gid,name,email,workspaces.gid,workspaces.name",
        },
    )
    return payload["data"]


def resolve_workspace_gid(config: Config, me: Dict) -> str:
    if config.workspace_gid:
        return config.workspace_gid

    workspaces = me.get("workspaces") or []
    if len(workspaces) == 1:
        return workspaces[0]["gid"]

    options = ", ".join(f"{ws['name']} ({ws['gid']})" for ws in workspaces)
    raise SystemExit(
        "Set ASANA_WORKSPACE_GID in asana-agent/.env. Available workspaces: "
        + options
    )


def fetch_assigned_tasks(config: Config, workspace_gid: str, user_gid: str) -> List[Dict]:
    return paginate(
        config,
        "/tasks",
        {
            "assignee": user_gid,
            "workspace": workspace_gid,
            "completed_since": datetime.now(timezone.utc).isoformat(),
            "opt_fields": TASK_FIELDS,
        },
    )


def fetch_following_tasks(config: Config, workspace_gid: str, user_gid: str) -> tuple[List[Dict], Optional[str]]:
    try:
        payload = api_get(
            config,
            f"/workspaces/{workspace_gid}/tasks/search",
            {
                "followers.any": user_gid,
                "completed": "false",
                "sort_by": "modified_at",
                "limit": "100",
                "opt_fields": TASK_FIELDS,
            },
        )
        return payload.get("data", []), None
    except AsanaApiError as exc:
        if exc.status in {402, 403, 404}:
            return [], f"Follower task search unavailable: {exc}"
        raise


def split_buckets(tasks: List[Dict], report_days_ahead: int, stale_days: int) -> Dict[str, List[Dict]]:
    today = date.today()
    soon_cutoff = today + timedelta(days=report_days_ahead)
    stale_cutoff = datetime.now(timezone.utc) - timedelta(days=stale_days)
    follow_up_cutoff = datetime.now(timezone.utc) - timedelta(days=max(4, stale_days // 2))

    buckets = {
        "overdue": [],
        "due_today": [],
        "due_soon": [],
        "blocked": [],
        "stale": [],
        "follow_up": [],
    }

    for task in tasks:
        due = task_due_date(task)
        modified = task_modified_at(task)
        blocked = task_is_blocked(task)

        if blocked:
            buckets["blocked"].append(task)
        if due and due < today:
            buckets["overdue"].append(task)
        elif due == today:
            buckets["due_today"].append(task)
        elif due and due <= soon_cutoff:
            buckets["due_soon"].append(task)

        if modified and modified <= stale_cutoff and not due:
            buckets["stale"].append(task)
        if modified and modified <= follow_up_cutoff and due and due <= soon_cutoff:
            buckets["follow_up"].append(task)

    return buckets


def build_section_groups(items: List[Dict], today: date) -> List[Dict]:
    categorized: Dict[str, List[Dict]] = {}
    for task in dedupe_tasks(items):
        categorized.setdefault(infer_task_category(task), []).append(task)

    def category_sort_key(category: str) -> tuple:
        category_tasks = categorized[category]
        order_rank = CATEGORY_ORDER.index(category) if category in CATEGORY_ORDER else len(CATEGORY_ORDER)
        earliest_rank = min(sort_key(task, today) for task in category_tasks)
        return (earliest_rank, order_rank, category)

    sections: List[Dict] = []
    for category in sorted(categorized.keys(), key=category_sort_key):
        grouped: Dict[str, List[Dict]] = {}
        for task in categorized[category]:
            key = task_group_key(task)
            grouped.setdefault(key, []).append(task)

        ordered_groups = sorted(
            grouped.items(),
            key=lambda pair: min(group_sort_key(task, today) for task in pair[1]),
        )

        category_groups: List[Dict] = []
        for _, group_items in ordered_groups:
            sorted_group_items = sorted(group_items, key=lambda task: group_sort_key(task, today))
            category_groups.append(
                {
                    "name": task_group_name(sorted_group_items[0]),
                    "tasks": sorted_group_items,
                    "rollup": build_group_rollup(sorted_group_items, today),
                }
            )

        sections.append({"name": category, "groups": category_groups})

    return sections


def render_section(lines: List[str], heading: str, items: List[Dict], today: date) -> None:
    lines.extend(["", f"## {heading}"])
    if not items:
        lines.append("- None")
        return

    for category in build_section_groups(items, today):
        lines.extend(["", f"### {category['name']}"])
        for group in category["groups"]:
            if len(group["tasks"]) == 1:
                lines.append(f"- {summarize_task(group['tasks'][0], today)}")
                lines.extend(markdown_comment_lines(group["tasks"][0], 0))
                continue

            lines.append(f"- **{group['name']}**")
            for task in group["tasks"]:
                lines.append(f"  - {summarize_task(task, today)}")
                lines.extend(markdown_comment_lines(task, 1))


def render_dashboard_html(
    me: Dict,
    workspace_gid: str,
    snapshot: Dict[str, int],
    sections: List[Dict],
    today: date,
    search_note: Optional[str],
) -> str:
    nav_links = "".join(
        f'<a class="nav-link" href="#section-{index}">{html.escape(section["heading"])}</a>'
        for index, section in enumerate(sections)
    )

    stat_cards = "".join(
        f"""
        <div class="stat-card">
          <div class="stat-label">{html.escape(label)}</div>
          <div class="stat-value">{value}</div>
        </div>
        """
        for label, value in snapshot.items()
    )

    section_markup: List[str] = []
    collapse_remaining_sections = False
    for index, section in enumerate(sections):
        items = section["items"]
        if section["heading"].startswith("Triage later"):
            collapse_remaining_sections = True
        grouped_categories = build_section_groups(items, today) if items else []
        category_markup: List[str] = []

        if not grouped_categories:
            category_markup.append('<div class="empty-state">Nothing here right now.</div>')
        else:
            for category in grouped_categories:
                group_markup: List[str] = []
                for group in category["groups"]:
                    group_rollup = group.get("rollup") or {}
                    task_cards: List[str] = []
                    for task in group["tasks"]:
                        is_blocked = task_is_blocked(task)
                        due = task_due_date(task)
                        location = task_location(task)
                        parent = task.get("parent") or {}
                        note_excerpt = task_note_excerpt(task)
                        thread_signals = task.get("thread_signals") or []
                        inherited_parent_context = bool(group_rollup.get("has_parent_context") and parent.get("gid"))
                        effective_signal = primary_thread_signal(task)
                        comment_markup = []
                        for signal in thread_signals:
                            comment_class = "comment-item comment-attention" if signal.get("attention") else "comment-item"
                            comment_markup.append(
                                f'''
                                <div class="{comment_class}">
                                  <div class="comment-label">{html.escape(signal["label"])}</div>
                                  <div class="comment-text">{html.escape(signal["summary"])}</div>
                                </div>
                                '''
                            )
                        badges = [
                            f'<span class="badge badge-due">{html.escape(due_label(task, today))}</span>'
                        ]
                        if is_blocked:
                            badges.append('<span class="badge badge-blocked">Blocked</span>')
                        if parent.get("name"):
                            badges.append('<span class="badge badge-subtask">Subtask</span>')
                        if effective_signal:
                            signal_label = effective_signal["label"]
                            signal_class = thread_badge_class(signal_label)
                            badges.append(f'<span class="{signal_class}">{html.escape(signal_label)}</span>')
                        if inherited_parent_context and not thread_signals:
                            badges.append('<span class="badge badge-context">Parent context</span>')

                        task_cards.append(
                            f"""
                            <a class="task-card" href="{html.escape(task.get('permalink_url', ''))}" target="_blank" rel="noreferrer noopener">
                              {f'<div class="task-parent task-parent-top">Parent: {html.escape(parent.get("name", ""))}</div>' if parent.get("name") else ""}
                              <div class="task-title-row">
                                <div class="task-title">{html.escape(task.get("name", "Untitled task"))}</div>
                                <div class="badge-row">{''.join(badges)}</div>
                              </div>
                              <div class="task-meta">{html.escape(location)}</div>
                              {f'<div class="task-notes">{html.escape(note_excerpt)}</div>' if note_excerpt else ""}
                              {f'<div class="comment-list">{"".join(comment_markup)}</div>' if comment_markup and not inherited_parent_context else ""}
                            </a>
                            """
                        )

                    group_header = ""
                    if group_rollup.get("show"):
                        rollup_badges = "".join(
                            f'<span class="{badge["class"]}">{html.escape(badge["label"])}</span>'
                            for badge in group_rollup.get("badges", [])
                        )
                        latest_markup = (
                            f'''
                            <div class="group-summary-item">
                              <div class="group-summary-label">Latest</div>
                              <div class="group-summary-text">{html.escape(group_rollup["latest"])}</div>
                            </div>
                            '''
                            if group_rollup.get("latest")
                            else ""
                        )
                        next_focus_markup = (
                            f'''
                            <div class="group-summary-item">
                              <div class="group-summary-label">Next focus</div>
                              <div class="group-summary-text">{html.escape(group_rollup["next_focus"])}</div>
                            </div>
                            '''
                            if group_rollup.get("next_focus")
                            else ""
                        )
                        group_header = f"""
                        <div class="group-summary">
                          <div class="group-summary-top">
                            <div class="group-title">{html.escape(group["name"])}</div>
                            <div class="badge-row">{rollup_badges}</div>
                          </div>
                          <div class="group-summary-item">
                            <div class="group-summary-label">Overview</div>
                            <div class="group-summary-text">{html.escape(group_rollup["overview"])}</div>
                          </div>
                          {latest_markup}
                          {next_focus_markup}
                        </div>
                        """
                    elif len(group["tasks"]) > 1:
                        group_header = f'<div class="group-title">{html.escape(group["name"])}</div>'
                    group_markup.append(
                        f"""
                        <div class="task-group">
                          {group_header}
                          <div class="task-grid">
                            {''.join(task_cards)}
                          </div>
                        </div>
                        """
                    )

                category_markup.append(
                    f"""
                    <div class="category-card">
                      <div class="category-heading">{html.escape(category["name"])}</div>
                      {''.join(group_markup)}
                    </div>
                    """
                )

        if collapse_remaining_sections:
            section_markup.append(
                f"""
                <details class="dashboard-section dashboard-section-collapsible" id="section-{index}">
                  <summary class="section-heading-row">
                    <div class="section-heading-main">
                      <h2>{html.escape(section["heading"])}</h2>
                    </div>
                    <div class="section-heading-meta">
                      <span class="section-toggle-text" aria-hidden="true"></span>
                      <span class="section-toggle-icon" aria-hidden="true"></span>
                      <span class="section-count">{len(items)}</span>
                    </div>
                  </summary>
                  <div class="section-body">
                    {''.join(category_markup)}
                  </div>
                </details>
                """
            )
        else:
            section_markup.append(
                f"""
                <section class="dashboard-section" id="section-{index}">
                  <div class="section-heading-row">
                    <h2>{html.escape(section["heading"])}</h2>
                    <span class="section-count">{len(items)}</span>
                  </div>
                  <div class="section-body">
                    {''.join(category_markup)}
                  </div>
                </section>
                """
            )

    note_markup = f'<div class="notice">{html.escape(search_note)}</div>' if search_note else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Asana Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap" rel="stylesheet">
  <style>
    :root {{
      color-scheme: light;
      --mural-red: #FF4B4B;
      --mural-green: #00843F;
      --mural-blue: #5887FF;
      --mural-pink: #FC83FF;
      --mural-yellow: #FFAA00;
      --jade: #00C27A;
      --spring: #9FEC7F;
      --mint: #B4F5C0;
      --natural: #EDEDD8;
      --white: #FFFFFF;
      --black: #000000;
      --text: #000000;
      --muted: rgba(0, 0, 0, 0.62);
      --border: rgba(0, 0, 0, 0.12);
      --surface: #ffffff;
      --surface-alt: #f7f7f0;
      --focus: var(--jade);
      --blocked: #ffe2e2;
      --blocked-text: #a4262c;
      --subtask: #e5fff0;
      --subtask-text: #006b43;
      --shadow: 0 4px 4px rgba(0,0,0,0.08);
      --shadow-hover: 0 12px 12px rgba(0,0,0,0.12);
      --radius: 16px;
      --radius-xl: 24px;
      --font-headline: 'Merriweather', Georgia, serif;
      --font-body: Arial, Helvetica, sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: var(--font-body);
      background:
        radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1.5px) 0 0 / 18px 18px,
        linear-gradient(180deg, #ffffff 0%, var(--natural) 100%);
      color: var(--text);
    }}
    a {{ color: inherit; text-decoration: none; }}
    .page {{
      max-width: 1560px;
      margin: 0 auto;
      padding: 24px;
    }}
    .hero {{
      background: linear-gradient(135deg, var(--mural-green) 0%, var(--jade) 24%, var(--spring) 55%, var(--mint) 100%);
      border: 0;
      border-radius: 0;
      width: 100vw;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
      padding: 0;
      box-shadow: none;
      margin-top: -24px;
      margin-bottom: 40px;
      overflow: visible;
    }}
    .hero-inner {{
      max-width: 1560px;
      margin: 0 auto;
      padding: 32px 24px 28px;
    }}
    .hero-top {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }}
    .hero h1 {{
      margin: 0 0 6px;
      font-family: var(--font-headline);
      font-size: 32px;
      line-height: 1.1;
      font-weight: 300;
    }}
    .hero-meta {{
      color: rgba(0, 0, 0, 0.72);
      font-size: 14px;
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }}
    .stat-card {{
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: var(--radius);
      padding: 14px 16px;
    }}
    .stat-label {{
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 4px;
    }}
    .stat-value {{
      font-size: 28px;
      font-weight: 700;
    }}
    .notice {{
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(255,255,255,0.92);
      border-left: 3px solid var(--jade);
      color: var(--text);
      font-size: 14px;
    }}
    .nav {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 18px 0 0;
    }}
    .nav-link {{
      background: rgba(255,255,255,0.94);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 14px;
      color: var(--muted);
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }}
    .nav-link:hover {{
      background: var(--jade);
      color: var(--black);
      border-color: var(--jade);
    }}
    .dashboard-section {{
      margin-bottom: 22px;
    }}
    .dashboard-section:first-of-type {{
      margin-top: 0;
    }}
    .dashboard-section-collapsible {{
      border: 0;
    }}
    .dashboard-section-collapsible summary {{
      list-style: none;
    }}
    .dashboard-section-collapsible summary::-webkit-details-marker {{
      display: none;
    }}
    .section-heading-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }}
    .dashboard-section-collapsible .section-heading-row {{
      cursor: pointer;
      margin-bottom: 0;
    }}
    .dashboard-section-collapsible[open] .section-heading-row {{
      margin-bottom: 12px;
    }}
    .section-heading-row h2 {{
      margin: 0;
      font-family: var(--font-headline);
      font-size: 22px;
      font-weight: 300;
    }}
    .section-heading-meta {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .section-toggle-text {{
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }}
    .section-toggle-text::before {{
      content: "Show";
    }}
    .dashboard-section-collapsible[open] .section-toggle-text::before {{
      content: "Hide";
    }}
    .section-toggle-icon {{
      width: 10px;
      height: 10px;
      border-right: 2px solid rgba(0, 0, 0, 0.48);
      border-bottom: 2px solid rgba(0, 0, 0, 0.48);
      transform: rotate(45deg) translateY(-1px);
      transition: transform 0.18s ease;
      flex: 0 0 auto;
    }}
    .dashboard-section-collapsible[open] .section-toggle-icon {{
      transform: rotate(225deg) translateY(-1px);
    }}
    .section-count {{
      min-width: 34px;
      text-align: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--mint);
      color: var(--black);
      font-weight: 700;
      font-size: 14px;
    }}
    .section-body {{
      display: grid;
      gap: 14px;
    }}
    .category-card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 18px;
    }}
    .category-heading {{
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: rgba(0, 0, 0, 0.48);
      margin-bottom: 14px;
    }}
    .task-group + .task-group {{
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }}
    .group-summary {{
      margin-bottom: 12px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(180, 245, 192, 0.18);
      border: 1px solid rgba(0, 132, 63, 0.12);
    }}
    .group-summary-top {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }}
    .group-title {{
      font-weight: 700;
      font-size: 16px;
    }}
    .group-summary-item + .group-summary-item {{
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }}
    .group-summary-label {{
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}
    .group-summary-text {{
      font-size: 14px;
      line-height: 1.45;
    }}
    .task-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }}
    .task-card {{
      display: block;
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
    }}
    .task-card:hover {{
      transform: translateY(-1px);
      box-shadow: var(--shadow-hover);
      border-color: var(--jade);
    }}
    .task-title-row {{
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 10px;
    }}
    .task-title {{
      font-weight: 700;
      line-height: 1.35;
    }}
    .badge-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      background: var(--mint);
      color: var(--black);
    }}
    .badge-blocked {{
      background: var(--blocked);
      color: var(--blocked-text);
    }}
    .badge-attention {{
      background: #fff0c2;
      color: #6b5600;
    }}
    .badge-thread-response {{
      background: #ffe2e2;
      color: #a4262c;
    }}
    .badge-thread-waiting {{
      background: #fff0c2;
      color: #6b5600;
    }}
    .badge-thread-answered {{
      background: #e5fff0;
      color: #006b43;
    }}
    .badge-thread-active {{
      background: #e8edff;
      color: #3451b2;
    }}
    .badge-thread-neutral {{
      background: #f1f3f5;
      color: #4f5b67;
    }}
    .badge-subtask {{
      background: var(--subtask);
      color: var(--subtask-text);
    }}
    .badge-context {{
      background: #f1f3f5;
      color: #4f5b67;
    }}
    .task-meta,
    .task-parent,
    .task-notes {{
      font-size: 13px;
      line-height: 1.45;
    }}
    .task-meta,
    .task-parent {{
      color: var(--muted);
      margin-bottom: 8px;
    }}
    .task-parent-top {{
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--jade);
      margin-bottom: 10px;
    }}
    .task-notes {{
      color: var(--text);
    }}
    .comment-list {{
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }}
    .comment-item {{
      border-top: 1px solid var(--border);
      padding-top: 8px;
    }}
    .comment-attention {{
      border-left: 3px solid var(--mural-yellow);
      padding-left: 8px;
    }}
    .comment-label {{
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}
    .comment-text {{
      font-size: 13px;
      line-height: 1.45;
    }}
    .empty-state {{
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      padding: 18px;
      color: var(--muted);
    }}
    @media (max-width: 760px) {{
      .page {{ padding: 16px; }}
      .hero {{ margin-top: -16px; margin-bottom: 32px; }}
      .hero-inner {{ padding: 28px 16px 24px; }}
      .hero h1 {{ font-size: 26px; }}
      .group-summary-top {{ flex-direction: column; }}
      .section-heading-row h2 {{ font-size: 20px; }}
    }}
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-top">
          <div>
            <h1>Mural Task Dashboard</h1>
            <div class="hero-meta">Prepared for {html.escape(me["name"])} on {format_display_date(today)}</div>
            <div class="hero-meta">Workspace GID: {html.escape(workspace_gid)}</div>
          </div>
        </div>
        <div class="stats">{stat_cards}</div>
        {note_markup}
        <nav class="nav">{nav_links}</nav>
      </div>
    </section>
    {''.join(section_markup)}
  </main>
</body>
</html>
"""


def render_markdown(
    config: Config,
    me: Dict,
    workspace_gid: str,
    assigned_tasks: List[Dict],
    following_tasks: List[Dict],
    search_note: Optional[str],
    report_days_ahead: int,
    stale_days: int,
) -> tuple[str, Dict[str, int], List[Dict]]:
    today = date.today()
    assigned_tasks = [task for task in dedupe_tasks(assigned_tasks) if is_real_task(task)]
    following_tasks = [task for task in dedupe_tasks(following_tasks) if is_real_task(task)]
    assigned_tasks = sorted(assigned_tasks, key=lambda task: sort_key(task, today))
    following_tasks = sorted(following_tasks, key=lambda task: sort_key(task, today))
    following_tasks = [task for task in following_tasks if (task.get("assignee") or {}).get("gid") != me["gid"]]

    buckets = split_buckets(assigned_tasks, report_days_ahead, stale_days)
    blocked = dedupe_tasks(buckets["blocked"])
    overdue = dedupe_tasks(buckets["overdue"])
    due_today = dedupe_tasks(buckets["due_today"])
    due_soon = dedupe_tasks(buckets["due_soon"])
    stale = dedupe_tasks(buckets["stale"])
    focus_window_days = min(2, report_days_ahead)
    focus_cutoff = today + timedelta(days=focus_window_days)
    focus_soon = [
        task
        for task in due_soon
        if task_due_date(task) is not None and task_due_date(task) <= focus_cutoff
    ]
    focus_now = dedupe_tasks(overdue + due_today + blocked + focus_soon)
    focus_ids = {task["gid"] for task in focus_now}

    coming_up = [task for task in due_soon if task["gid"] not in focus_ids]
    coming_up_ids = {task["gid"] for task in coming_up}
    triage_later = [
        task for task in stale if task["gid"] not in focus_ids and task["gid"] not in coming_up_ids
    ]

    snapshot = {
        "Assigned open tasks": len(assigned_tasks),
        "Focus now": len(focus_now),
        "Blocked tasks": len(blocked),
        "Coming up this week": len(coming_up),
        "Triage later": len(triage_later),
        "Watching": len(following_tasks),
    }

    lines = [
        f"# Daily Asana Summary - {format_display_date(today)}",
        "",
        f"User: **{me['name']}**",
        f"Workspace GID: `{workspace_gid}`",
        "",
        "## Snapshot",
        f"- Assigned open tasks: **{snapshot['Assigned open tasks']}**",
        f"- Focus now: **{snapshot['Focus now']}**",
        f"- Blocked tasks: **{snapshot['Blocked tasks']}**",
        f"- Coming up this week: **{snapshot['Coming up this week']}**",
        f"- Triage later: **{snapshot['Triage later']}**",
    ]

    if search_note:
        lines.extend(["", f"> {search_note}"])
    else:
        lines.append(f"- Watching: **{snapshot['Watching']}**")

    sections = [
        ("Focus now", focus_now),
        (f"Coming up this week ({report_days_ahead} days)", coming_up),
        (f"Triage later ({stale_days}+ day stale)", triage_later),
    ]

    if following_tasks:
        sections.append(("Watching", following_tasks[:12]))

    comment_note = attach_recent_comments(
        config,
        me,
        [{"heading": heading, "items": items} for heading, items in sections],
    )

    for heading, items in sections:
        render_section(lines, heading, items, today)

    section_payloads = [{"heading": heading, "items": items} for heading, items in sections]
    if comment_note:
        lines.extend(["", f"> {comment_note}"])

    return "\n".join(lines) + "\n", snapshot, section_payloads


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parent.parent
    config = build_config(args, repo_root)

    me = fetch_me(config)
    workspace_gid = resolve_workspace_gid(config, me)
    assigned_tasks = fetch_assigned_tasks(config, workspace_gid, me["gid"])
    following_tasks, search_note = fetch_following_tasks(config, workspace_gid, me["gid"])

    report, snapshot, sections = render_markdown(
        config=config,
        me=me,
        workspace_gid=workspace_gid,
        assigned_tasks=assigned_tasks,
        following_tasks=following_tasks,
        search_note=search_note,
        report_days_ahead=config.report_days_ahead,
        stale_days=config.stale_days,
    )

    config.output_path.parent.mkdir(parents=True, exist_ok=True)
    config.output_path.write_text(report, encoding="utf-8")
    dashboard_path = config.output_path.parent / "daily-asana-dashboard.html"
    dashboard_html = render_dashboard_html(
        me=me,
        workspace_gid=workspace_gid,
        snapshot=snapshot,
        sections=sections,
        today=date.today(),
        search_note=search_note,
    )
    dashboard_path.write_text(dashboard_html, encoding="utf-8")
    print(f"Wrote {config.output_path}")
    print(f"Wrote {dashboard_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
