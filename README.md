# Freedcamp plugin

© 2026 [Cubo3 Ltda.](mailto:contacto@cubo3.cl) — licensed under MIT (see
[`LICENSE`](./LICENSE)).

Connects Claude to your Freedcamp account so it can read and manage
projects, tasks, comments, and files without leaving the chat.

## Components

- **MCP server** (`freedcamp`) — a small Node script
  (`servers/freedcamp-server.js`) with **zero external dependencies**
  (only Node's built-in `https`, `crypto`, `readline`) that talks directly
  to Freedcamp's REST API (`https://freedcamp.com/api/v1/`) and exposes 8
  tools: `freedcamp_list_projects`, `freedcamp_list_tasks`,
  `freedcamp_get_task`, `freedcamp_create_task`, `freedcamp_update_task`,
  `freedcamp_add_comment`, `freedcamp_list_comments`,
  `freedcamp_list_files`.
- **Skill** (`freedcamp`) — tells Claude when and how to use those tools.

## Installation

1. Clone or download this repository.
2. Rename `mcp.json.template` to `.mcp.json` (in the repo root). This file
   is not tracked with the leading dot in the repo itself — rename it
   locally before pointing your Claude client at this plugin.
3. Follow the environment variable setup below (or the full guide in
   `CONFIGURACION-CLAVES.md`) before first use.

## Setup — required environment variables

This plugin needs two values from your own Freedcamp account, and they
must be set as **environment variables** in the environment that runs the
MCP server — never pasted into chat, never hardcoded in any file here.
See `CONFIGURACION-CLAVES.md` for the full step-by-step guide.

1. Go to Freedcamp → **My Account → API tab**
   (`https://freedcamp.com/manage/account#api`). You'll need to re-enter
   your password to reveal the secret.
2. Copy your **API key** and **API secret**.
3. Set them as environment variables named exactly:
   - `FREEDCAMP_API_KEY`
   - `FREEDCAMP_API_SECRET`

   How you set them depends on where this plugin runs (e.g. a `.env` file
   loaded by your Claude environment, your OS/user environment variables,
   or your process manager's secret store). If you're not sure how your
   setup loads environment variables for MCP servers, ask whoever manages
   that environment — don't put the raw secret in `.mcp.json` or any
   other plugin file.
4. **Never share your API secret** — Freedcamp's own docs call this out
   explicitly. If you suspect it leaked, regenerate it from the same API
   tab.

If either variable is missing, every tool call will fail with a clear
error message naming the missing variable — that's expected until step 3
is done, not a bug in the plugin.

## Usage

Just ask naturally, e.g.:

- "What Freedcamp projects do I have?"
- "Show me my open tasks in [project]"
- "Create a task in [project] called ... due next Friday"
- "Mark task #1234 as done"
- "Comment on task #1234: ..."
- "What files are attached to task #1234?"

## Known limitations

- Listing comments/files reuses the "get one task" endpoint (Freedcamp's
  public API doesn't document a separate list-comments-by-item endpoint)
  — so `freedcamp_list_comments`/`freedcamp_list_files` only work for
  tasks, not other item types.
- File tools return metadata and a temporary (~1 hour) download URL only
  — they don't download or upload file contents.
- No delete tools are included (task/comment/file deletion), by design,
  to keep this a low-risk read-mostly integration. Ask if you want those
  added later.

## License

MIT © 2026 [Cubo3 Ltda.](mailto:contacto@cubo3.cl). See [`LICENSE`](./LICENSE)
for the full text.
