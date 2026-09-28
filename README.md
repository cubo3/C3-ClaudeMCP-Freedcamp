# Plugin de Freedcamp

© 2026 [Cubo3 Ltda.](mailto:contacto@cubo3.cl) — licenciado bajo MIT (ver
[`LICENSE`](./LICENSE)). Desarrollado orgullosamente en Chile 🇨🇱.

Conecta Claude a tu cuenta de Freedcamp para que pueda leer y gestionar
proyectos, tareas, comentarios y archivos sin salir del chat.

## Componentes

- **Servidor MCP** (`freedcamp`) — un pequeño script de Node
  (`servers/freedcamp-server.js`) **sin dependencias externas** (solo los
  módulos nativos de Node `https`, `crypto`, `readline`) que habla
  directamente con la API REST de Freedcamp (`https://freedcamp.com/api/v1/`)
  y expone 8 herramientas: `freedcamp_list_projects`, `freedcamp_list_tasks`,
  `freedcamp_get_task`, `freedcamp_create_task`, `freedcamp_update_task`,
  `freedcamp_add_comment`, `freedcamp_list_comments`, `freedcamp_list_files`.
- **Skill** (`freedcamp`) — le indica a Claude cuándo y cómo usar esas
  herramientas.

## Instalación

1. Clona o descarga este repositorio.
2. Renombra `mcp.json.template` a `.mcp.json` (en la raíz del repo). Este
   archivo no se versiona con el punto inicial en el propio repositorio —
   renómbralo localmente antes de apuntar tu cliente de Claude a este
   plugin.
3. Sigue la configuración de variables de entorno más abajo (o la guía
   completa en `CONFIGURACION-CLAVES.md`) antes de usarlo por primera vez.

## Configuración — variables de entorno requeridas

Este plugin necesita dos valores de tu propia cuenta de Freedcamp, y deben
quedar como **variables de entorno** en el entorno donde corre el servidor
MCP — nunca pegadas en el chat, nunca escritas directamente en ningún
archivo de este repo. Ver `CONFIGURACION-CLAVES.md` para la guía completa
paso a paso.

1. Entra a Freedcamp → **My Account → pestaña API**
   (`https://freedcamp.com/manage/account#api`). Te pedirá reingresar tu
   contraseña para mostrar el secreto.
2. Copia tu **API key** y tu **API secret**.
3. Configúralas como variables de entorno con estos nombres exactos:
   - `FREEDCAMP_API_KEY`
   - `FREEDCAMP_API_SECRET`

   Cómo las configures depende de dónde corra este plugin (por ejemplo un
   archivo `.env` cargado por tu entorno de Claude, variables de entorno de
   tu sistema/usuario, o el almacén de secretos de tu gestor de procesos).
   Si no estás seguro de cómo tu configuración carga variables de entorno
   para servidores MCP, consulta a quien administre ese entorno — no
   pongas el secreto real en `.mcp.json` ni en ningún otro archivo del
   plugin.
4. **Nunca compartas tu API secret** — la propia documentación de Freedcamp
   lo advierte explícitamente. Si sospechas que se filtró, regenéralo desde
   la misma pestaña API.

Si falta cualquiera de las dos variables, cada llamada a una herramienta
fallará con un mensaje de error claro nombrando la variable faltante — eso
es esperado hasta completar el paso 3, no es un error del plugin.

## Uso

Simplemente pide de forma natural, por ejemplo:

- "¿Qué proyectos tengo en Freedcamp?"
- "Muéstrame mis tareas abiertas en [proyecto]"
- "Crea una tarea en [proyecto] llamada ... para el próximo viernes"
- "Marca la tarea #1234 como completada"
- "Comenta en la tarea #1234: ..."
- "¿Qué archivos tiene adjuntos la tarea #1234?"

## Limitaciones conocidas

- Listar comentarios/archivos reutiliza el endpoint de "obtener una tarea"
  (la API pública de Freedcamp no documenta un endpoint separado de
  listar-comentarios-por-item) — así que `freedcamp_list_comments` y
  `freedcamp_list_files` solo funcionan para tareas, no para otros tipos de
  ítem.
- Las herramientas de archivos devuelven solo metadata y una URL de
  descarga temporal (~1 hora) — no descargan ni suben contenido de
  archivos.
- No se incluyen herramientas de eliminación (borrar tareas, comentarios o
  archivos), a propósito, para mantener esta integración de bajo riesgo y
  mayormente de lectura. Avisa si quieres que se agreguen más adelante.

## Licencia

MIT © 2026 [Cubo3 Ltda.](mailto:contacto@cubo3.cl). Ver [`LICENSE`](./LICENSE)
para el texto completo.

---

Desarrollado orgullosamente en Chile 🇨🇱 por [Cubo3 Ltda.](mailto:contacto@cubo3.cl)
