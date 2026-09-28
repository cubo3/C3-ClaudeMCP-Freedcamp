---
name: freedcamp
description: >
  This skill should be used when the user asks about their Freedcamp projects
  or tasks, e.g. "check my Freedcamp tasks", "create a task in Freedcamp",
  "what's assigned to me in Freedcamp", "update this Freedcamp task",
  "comment on this Freedcamp task", or "what files are attached to this
  Freedcamp task". It documents how to use the freedcamp_* MCP tools.
---

Use the `freedcamp_*` tools (from the `freedcamp` MCP server) to read and
write Freedcamp data. Do not guess ids — look them up first.

## Typical flow

1. If the project isn't already known, call `freedcamp_list_projects` and
   match by name to get `project_id`.
2. To find a task, call `freedcamp_list_tasks` with that `project_id`
   (optionally filtered by `status` or `assigned_to_id`) and match by title
   to get `task_id`.
3. For full detail on one task (description, comments, files), call
   `freedcamp_get_task`.

## Tools

- `freedcamp_list_projects` — no arguments. Returns id, name, description,
  active flag, role for every project the user can see.
- `freedcamp_list_tasks` — optional `project_id`, `status` (0=not started,
  1=completed, 2=in progress), `assigned_to_id`, `limit`, `offset`.
- `freedcamp_get_task` — requires `task_id`. Returns the full task including
  embedded `comments` and `files` arrays.
- `freedcamp_create_task` — requires `project_id` and `title`; optional
  `description`, `list_id`, `priority` (0-3), `assigned_to_id`, `due_date`
  (YYYY-MM-DD), `start_date` (YYYY-MM-DD).
- `freedcamp_update_task` — requires `task_id`; pass only the fields to
  change (`title`, `description`, `status`, `priority`, `assigned_to_id`,
  `due_date`, `list_id`).
- `freedcamp_add_comment` — requires `item_id` (the task id) and
  `description`. `app_id` defaults to "2" (Tasks) — only override it for a
  non-task item.
- `freedcamp_list_comments` — requires `task_id`.
- `freedcamp_list_files` — requires `task_id`. Returns file metadata and a
  temporary download URL (expires ~1 hour) — this does not download the
  file content.

## Notes

- Status codes: 0 = not started, 1 = completed, 2 = in progress.
- Priority codes: 0 = none, 1 = low, 2 = medium, 3 = high.
- `assigned_to_id` accepts a user id, or the constants `-1` (everyone) /
  `0` (nobody).
- If a tool call fails with a message about `FREEDCAMP_API_KEY` /
  `FREEDCAMP_API_SECRET`, tell the user those environment variables aren't
  set where the MCP server runs — see this plugin's README, section Setup.
  Never ask the user to paste the key/secret into chat.

---
© 2026 Cubo3 Ltda. (contacto@cubo3.cl) — MIT License.
