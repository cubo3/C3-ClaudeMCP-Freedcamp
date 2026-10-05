# Changelog

## 0.2.0 — 2026
- `.mcp.json` incluido en el repositorio (sin secretos): ya no hay que renombrar `mcp.json.template`.
- Nuevas herramientas: `freedcamp_list_task_lists` y `freedcamp_list_assignees`.
- `freedcamp_list_tasks` ahora devuelve también `list_id`, `list_title` y `assigned_to_id`.
- Protocolo MCP: negocia la versión con el cliente, responde `ping` y toma la versión del servidor desde `package.json`.
- Herramientas de lectura marcadas con `readOnlyHint`.
- Reintentos con espera creciente ante 429/5xx/red (escrituras solo ante 429).
- Pruebas automáticas (`node --test`) y CI en GitHub Actions (Node 18, 20 y 22).
- `package.json` completo (engines, bin, repository, keywords) y metadatos del plugin en inglés.
- README bilingüe con aviso de proyecto no oficial; `SECURITY.md`; mensajes de error con tildes.

## 0.1.0 — 2026
- Versión inicial: 8 herramientas de Freedcamp, skill y documentación en español.
