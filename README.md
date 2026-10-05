# Freedcamp MCP para Claude

**Conecta Claude a Freedcamp: lee y gestiona proyectos, tareas, comentarios y archivos sin salir del chat.** Un servidor MCP en un solo archivo de Node, sin dependencias, más un *skill* que le enseña a Claude cuándo y cómo usarlo.

*English: an MCP server and Claude plugin for [Freedcamp](https://freedcamp.com). List projects and tasks, create/update tasks, read and add comments, and see attached files — from Claude Desktop or Claude Code. Single file, zero dependencies, Node 18+, MIT licensed.*

[![CI](https://github.com/cubo3/C3-ClaudeMCP-Freedcamp/actions/workflows/ci.yml/badge.svg)](https://github.com/cubo3/C3-ClaudeMCP-Freedcamp/actions/workflows/ci.yml) [![Node 18+](https://img.shields.io/badge/node-18%2B-339933)](https://nodejs.org/) [![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green)](LICENSE)

> Proyecto independiente de Cubo3 Ltda. **No es un producto oficial ni está afiliado a Freedcamp ni a Anthropic.** *Independent project; not affiliated with Freedcamp or Anthropic.*

## Qué puedes pedirle a Claude

- "¿Qué proyectos tengo en Freedcamp?"
- "Muéstrame mis tareas abiertas en *[proyecto]*."
- "Crea una tarea en *[proyecto]*, lista *Backlog*, para el viernes y asígnala a Ana."
- "Marca la tarea #1234 como completada."
- "Comenta en la tarea #1234: …"
- "¿Qué archivos tiene adjuntos la tarea #1234?"

## Herramientas (10)

| Herramienta | Qué hace |
|---|---|
| `freedcamp_list_projects` | Proyectos visibles para el usuario. |
| `freedcamp_list_tasks` | Tareas, filtrables por proyecto, estado y asignado. |
| `freedcamp_get_task` | Detalle completo de una tarea, con comentarios y archivos. |
| `freedcamp_create_task` | Crea una tarea (lista, prioridad, asignado, fechas). |
| `freedcamp_update_task` | Cambia título, descripción, estado, prioridad, asignado o fecha. |
| `freedcamp_add_comment` | Comenta en una tarea. |
| `freedcamp_list_comments` | Comentarios de una tarea. |
| `freedcamp_list_files` | Archivos adjuntos (metadata y URL temporal de descarga). |
| `freedcamp_list_task_lists` | Listas de tareas de un proyecto, para elegir `list_id`. |
| `freedcamp_list_assignees` | Usuarios con tareas en un proyecto, para elegir `assigned_to_id`. |

Las herramientas de lectura se declaran `readOnlyHint`, para que tu cliente de Claude pueda aprobarlas sin fricción y pedir confirmación solo en las que escriben.

## Instalación

Requisitos: **Node 18 o superior**. No hay `npm install`: el servidor usa solo módulos nativos.

1. Clona o descarga este repositorio.
2. Configura tus credenciales de Freedcamp como variables de entorno (más abajo).
3. Apunta tu cliente de Claude a este plugin:
   - **Claude Code:** `claude --plugin-dir /ruta/a/C3-ClaudeMCP-Freedcamp`
   - **Claude Desktop u otro cliente MCP:** agrega un servidor con comando `node` y argumento `/ruta/a/C3-ClaudeMCP-Freedcamp/servers/freedcamp-server.js`, con las dos variables de entorno.

El archivo `.mcp.json` ya viene incluido y **no contiene secretos**, solo referencias `${FREEDCAMP_API_KEY}` y `${FREEDCAMP_API_SECRET}`.

## Configuración: variables de entorno

Necesitas dos valores de tu propia cuenta:

1. Entra a Freedcamp → **My Account → pestaña API** (`https://freedcamp.com/manage/account#api`). Te pedirá tu contraseña para mostrar el secreto.
2. Copia tu **API key** y tu **API secret**.
3. Defínelas como `FREEDCAMP_API_KEY` y `FREEDCAMP_API_SECRET` en el entorno donde corre el servidor.

Guía paso a paso (Linux, macOS y Windows): [`CONFIGURACION-CLAVES.md`](CONFIGURACION-CLAVES.md).

**Nunca compartas tu API secret** ni la pegues en el chat o en un archivo del repositorio. Si sospechas que se filtró, regenérala desde la misma pestaña API. Si falta alguna variable, cada herramienta responde con un error claro que nombra cuál.

## Seguridad y privacidad

- Las credenciales se leen solo del entorno; el servidor firma cada llamada con HMAC-SHA1 (el secreto nunca viaja).
- Habla únicamente con `freedcamp.com` por HTTPS. No hay telemetría ni otros destinos.
- **No incluye herramientas de borrado**, a propósito: la integración es de bajo riesgo y mayormente de lectura.
- Reintentos controlados ante errores 429 y 5xx: las lecturas se reintentan; las escrituras solo ante 429, para no duplicar nunca una tarea o un comentario.
- Reporte de vulnerabilidades: ver [`SECURITY.md`](SECURITY.md).

## Limitaciones conocidas

- Freedcamp no documenta endpoints públicos para listas de tareas ni usuarios; `freedcamp_list_task_lists` y `freedcamp_list_assignees` se derivan de las tareas existentes, así que **no muestran listas vacías ni usuarios sin tareas asignadas**.
- `freedcamp_list_comments` y `freedcamp_list_files` solo funcionan para tareas, no para otros tipos de ítem.
- Los archivos se informan como metadata y una URL temporal (~1 hora); no se descargan ni se suben contenidos.

## Desarrollo

```bash
npm test      # pruebas sin red ni credenciales (node --test)
```

Historial de cambios en [`CHANGELOG.md`](CHANGELOG.md).

## Licencia

[MIT](LICENSE) © 2026 Cubo3 Ltda.

---

Desarrollado orgullosamente en Chile 🇨🇱 por **[Cubo3](https://cubo3.cl)**, ingeniería de internet: desarrollo web a medida, gestión documental y GPS.
