---
name: freedcamp
description: >
  Este skill debe usarse cuando el usuario pregunte por sus proyectos o
  tareas de Freedcamp, por ejemplo "revisa mis tareas de Freedcamp",
  "crea una tarea en Freedcamp", "qué tengo asignado en Freedcamp",
  "actualiza esta tarea de Freedcamp", "comenta en esta tarea de Freedcamp",
  o "qué archivos tiene adjuntos esta tarea de Freedcamp". Documenta cómo
  usar las herramientas MCP `freedcamp_*`.
---

Usa las herramientas `freedcamp_*` (del servidor MCP `freedcamp`) para leer
y escribir datos de Freedcamp. No adivines los ids — búscalos primero.

## Flujo típico

1. Si el proyecto no se conoce aún, llama a `freedcamp_list_projects` y
   coincide por nombre para obtener el `project_id`.
2. Para encontrar una tarea, llama a `freedcamp_list_tasks` con ese
   `project_id` (opcionalmente filtrado por `status` o `assigned_to_id`) y
   coincide por título para obtener el `task_id`.
3. Para crear una tarea en una lista concreta o asignada a alguien, busca
   antes el `list_id` con `freedcamp_list_task_lists` y el `assigned_to_id`
   con `freedcamp_list_assignees`.
4. Para el detalle completo de una tarea (descripción, comentarios,
   archivos), llama a `freedcamp_get_task`.

## Herramientas

- `freedcamp_list_projects` — sin argumentos. Devuelve id, nombre,
  descripción, estado activo y rol de cada proyecto visible para el
  usuario.
- `freedcamp_list_tasks` — opcionales `project_id`, `status` (0=sin
  iniciar, 1=completada, 2=en progreso), `assigned_to_id`, `limit`,
  `offset`.
- `freedcamp_get_task` — requiere `task_id`. Devuelve la tarea completa,
  incluyendo los arreglos `comments` y `files`.
- `freedcamp_create_task` — requiere `project_id` y `title`; opcionales
  `description`, `list_id`, `priority` (0-3), `assigned_to_id`, `due_date`
  (AAAA-MM-DD), `start_date` (AAAA-MM-DD).
- `freedcamp_update_task` — requiere `task_id`; pasa solo los campos a
  cambiar (`title`, `description`, `status`, `priority`, `assigned_to_id`,
  `due_date`, `list_id`).
- `freedcamp_add_comment` — requiere `item_id` (el id de la tarea) y
  `description`. `app_id` por defecto es "2" (Tareas) — solo cámbialo para
  un ítem que no sea una tarea.
- `freedcamp_list_comments` — requiere `task_id`.
- `freedcamp_list_task_lists` — requiere `project_id`. Devuelve las listas
  de tareas (`list_id`, título, cantidad) para elegir `list_id` al crear una
  tarea. Se deriva de las tareas existentes: una lista vacía no aparece.
- `freedcamp_list_assignees` — requiere `project_id`. Devuelve los usuarios
  con tareas asignadas (`user_id`, nombre) para elegir `assigned_to_id`. Un
  usuario sin tareas asignadas no aparece.
- `freedcamp_list_files` — requiere `task_id`. Devuelve metadata de
  archivos y una URL de descarga temporal (expira en ~1 hora) — esto no
  descarga el contenido del archivo.

## Notas

- Códigos de estado: 0 = sin iniciar, 1 = completada, 2 = en progreso.
- Códigos de prioridad: 0 = ninguna, 1 = baja, 2 = media, 3 = alta.
- `assigned_to_id` acepta un id de usuario, o las constantes `-1`
  (todos) / `0` (nadie).
- Si una llamada falla con un mensaje sobre `FREEDCAMP_API_KEY` /
  `FREEDCAMP_API_SECRET`, dile al usuario que esas variables de entorno no
  están configuradas donde corre el servidor MCP — ver la sección
  Configuración del README de este plugin. Nunca le pidas al usuario que
  pegue la key/secret en el chat.

---
© 2026 Cubo3 Ltda. (contacto@cubo3.cl) — Licencia MIT.
Desarrollado orgullosamente en Chile 🇨🇱.
