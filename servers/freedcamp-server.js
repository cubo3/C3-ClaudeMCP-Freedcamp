#!/usr/bin/env node
'use strict';

// Copyright (c) 2026 Cubo3 Ltda. <contacto@cubo3.cl>  (https://cubo3.cl)
// Licensed under the MIT License — see the LICENSE file in this repo.
//
// MCP stdio server for the Freedcamp REST API (https://freedcamp.com/api/v1/).
// No external dependencies on purpose: only Node builtins (https, crypto,
// readline), so this runs with a plain `node` install and no `npm install`
// step at plugin-install time.
//
// Auth: Freedcamp signs each request with api_key + timestamp + an
// HMAC-SHA1 hash (key = api secret, message = api_key + timestamp). See
// https://freedcamp.com/Mobile_7Yh/iOS_application_6zp/wiki/wiki_public/view/DFaab
//
// Required env vars (set by the user, never hardcoded, never sent to
// Claude): FREEDCAMP_API_KEY, FREEDCAMP_API_SECRET.

const https = require('https');
const crypto = require('crypto');
const readline = require('readline');
const PKG = require('../package.json');

const API_KEY = process.env.FREEDCAMP_API_KEY;
const API_SECRET = process.env.FREEDCAMP_API_SECRET;
const HOST = 'freedcamp.com';
const BASE_PATH = '/api/v1';
const DEFAULT_TASKS_APP_ID = '2'; // APP_TODOS

function requireCredentials() {
  if (!API_KEY || !API_SECRET) {
    throw new Error(
      'Faltan FREEDCAMP_API_KEY / FREEDCAMP_API_SECRET en el entorno. ' +
      'Configúralas donde corras este plugin (ver README.md) — nunca se pasan por el chat.'
    );
  }
}

function authParams() {
  requireCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hash = crypto
    .createHmac('sha1', API_SECRET)
    .update(API_KEY + timestamp)
    .digest('hex');
  return { api_key: API_KEY, timestamp, hash };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function requestOnce(method, path, { query, body } = {}) {
  return new Promise((resolve, reject) => {
    let params;
    try {
      params = new URLSearchParams(authParams());
    } catch (e) {
      return reject(e);
    }
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) {
          for (const item of v) params.append(`${k}[]`, String(item));
        } else {
          params.set(k, String(v));
        }
      }
    }
    const fullPath = `${BASE_PATH}${path}?${params.toString()}`;
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const headers = { Accept: 'application/json', 'User-Agent': `freedcamp-claude-plugin/${PKG.version}` };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(
      { host: HOST, path: fullPath, method, headers, timeout: 20000 },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode;
          if (status === 429 || status >= 500) {
            return reject(new HttpError(`Freedcamp respondió HTTP ${status}`, status));
          }
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            return reject(
              new HttpError(`Respuesta no-JSON de Freedcamp (HTTP ${status}): ${raw.slice(0, 300)}`, status)
            );
          }
          if (parsed && parsed.msg && parsed.msg !== 'OK' && parsed.http_code >= 400) {
            const detail =
              parsed.data && parsed.data.errors
                ? JSON.stringify(parsed.data.errors)
                : parsed.msg;
            return reject(new HttpError(`Freedcamp API error (HTTP ${parsed.http_code}): ${detail}`, parsed.http_code));
          }
          resolve(parsed);
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Timeout llamando a la API de Freedcamp')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Las lecturas (GET) se reintentan ante 429/5xx/red caída; las escrituras solo ante 429
// (así un reintento nunca duplica una tarea o un comentario).
async function freedcampRequest(method, path, opts = {}) {
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      return await requestOnce(method, path, opts);
    } catch (e) {
      const isGet = method === 'GET';
      const retryable = e.status === 429 || (isGet && (e.status >= 500 || e.status === undefined) && !/FREEDCAMP_API/.test(e.message));
      if (!retryable || attempt >= maxAttempts) throw e;
      await sleep(500 * 2 ** (attempt - 1));
    }
  }
}

// Punto de inyección para pruebas automáticas.
const api = { request: (...args) => freedcampRequest(...args) };

// ---- Tool implementations -------------------------------------------------

async function listProjects() {
  const res = await api.request('GET', '/projects');
  const projects = (res.data && res.data.projects) || [];
  return projects.map((p) => ({
    project_id: p.project_id,
    name: p.project_name,
    description: p.project_description,
    active: p.f_active,
    role: p.role_name,
    favorite: p.f_favorite,
  }));
}

async function listTasks({ project_id, status, assigned_to_id, limit, offset } = {}) {
  const query = {
    project_id,
    status,
    assigned_to_id,
    limit: limit || 50,
    offset: offset || 0,
  };
  const res = await api.request('GET', '/tasks', { query });
  const tasks = (res.data && res.data.tasks) || [];
  const meta = (res.data && res.data.meta) || {};
  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      project_id: t.project_id,
      status: t.status_title,
      priority: t.priority_title,
      assigned_to: t.assigned_to_fullname,
      assigned_to_id: t.assigned_to_id,
      list_id: t.list_id,
      list_title: t.list_title,
      due_ts: t.due_ts,
      comments_count: t.comments_count,
      files_count: t.files_count,
      url: t.url,
    })),
    meta,
  };
}

async function getTask({ task_id }) {
  if (!task_id) throw new Error('task_id es requerido');
  const res = await api.request('GET', `/tasks/${encodeURIComponent(task_id)}`);
  const t = (res.data && res.data.tasks && res.data.tasks[0]) || null;
  if (!t) throw new Error(`No se encontró la tarea ${task_id}`);
  return t;
}

async function createTask({
  project_id,
  title,
  description,
  list_id,
  priority,
  assigned_to_id,
  due_date,
  start_date,
}) {
  if (!project_id) throw new Error('project_id es requerido');
  if (!title) throw new Error('title es requerido');
  const body = { project_id, title };
  if (description !== undefined) body.description = description;
  if (list_id !== undefined) body.list_id = list_id;
  if (priority !== undefined) body.priority = priority;
  if (assigned_to_id !== undefined) body.assigned_to_id = assigned_to_id;
  if (due_date !== undefined) body.due_date = due_date;
  if (start_date !== undefined) body.start_date = start_date;
  const res = await api.request('POST', '/tasks', { body });
  return (res.data && res.data.tasks && res.data.tasks[0]) || res.data;
}

async function updateTask({ task_id, title, description, status, priority, assigned_to_id, due_date, list_id }) {
  if (!task_id) throw new Error('task_id es requerido');
  const body = {};
  if (title !== undefined) body.title = title;
  if (description !== undefined) body.description = description;
  if (status !== undefined) body.status = status;
  if (priority !== undefined) body.priority = priority;
  if (assigned_to_id !== undefined) body.assigned_to_id = assigned_to_id;
  if (due_date !== undefined) body.due_date = due_date;
  if (list_id !== undefined) body.list_id = list_id;
  if (Object.keys(body).length === 0) {
    throw new Error('Pasa al menos un campo para actualizar (title, description, status, priority, assigned_to_id, due_date, list_id)');
  }
  const res = await api.request('POST', `/tasks/${encodeURIComponent(task_id)}`, { body });
  return (res.data && res.data.tasks && res.data.tasks[0]) || res.data;
}

async function addComment({ item_id, description, app_id }) {
  if (!item_id) throw new Error('item_id es requerido (id de la tarea u otro item)');
  if (!description) throw new Error('description es requerido');
  const body = { item_id, description, app_id: app_id || DEFAULT_TASKS_APP_ID };
  const res = await api.request('POST', '/comments', { body });
  return (res.data && res.data.comments && res.data.comments[0]) || res.data;
}

async function listComments({ task_id }) {
  const task = await getTask({ task_id });
  return task.comments || [];
}

async function listFiles({ task_id }) {
  const task = await getTask({ task_id });
  return task.files || [];
}


// Freedcamp no documenta endpoints públicos para listas ni usuarios; se derivan de las tareas
// existentes (campos list_id/list_title y assigned_to_id/assigned_to_fullname).
async function collectTasks(project_id, maxPages = 5) {
  const all = [];
  for (let page = 0; page < maxPages; page++) {
    const { tasks } = await listTasks({ project_id, limit: 200, offset: page * 200 });
    all.push(...tasks);
    if (tasks.length < 200) break;
  }
  return all;
}

async function listTaskLists({ project_id }) {
  if (!project_id) throw new Error('project_id es requerido');
  const lists = new Map();
  for (const t of await collectTasks(project_id)) {
    if (t.list_id && !lists.has(t.list_id)) lists.set(t.list_id, { list_id: t.list_id, title: t.list_title, tasks: 0 });
    if (t.list_id) lists.get(t.list_id).tasks++;
  }
  return [...lists.values()];
}

async function listAssignees({ project_id }) {
  if (!project_id) throw new Error('project_id es requerido');
  const users = new Map();
  for (const t of await collectTasks(project_id)) {
    if (!t.assigned_to_id || t.assigned_to_id === '0' || t.assigned_to_id === '-1') continue;
    if (!users.has(t.assigned_to_id)) users.set(t.assigned_to_id, { user_id: t.assigned_to_id, name: t.assigned_to, tasks: 0 });
    users.get(t.assigned_to_id).tasks++;
  }
  return [...users.values()];
}

// ---- Tool registry ----------------------------------------------------

const TOOLS = [
  {
    name: 'freedcamp_list_projects',
    description: 'List all Freedcamp projects the authenticated user has access to.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: listProjects,
  },
  {
    name: 'freedcamp_list_tasks',
    description: 'List Freedcamp tasks, optionally filtered by project, status, or assignee.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Restrict to this project id' },
        status: { type: 'integer', description: '0=not started, 1=completed, 2=in progress' },
        assigned_to_id: { type: 'string', description: 'Filter by assigned user id' },
        limit: { type: 'integer', description: 'Max results (default 50, max 200)' },
        offset: { type: 'integer', description: 'Pagination offset (default 0)' },
      },
      additionalProperties: false,
    },
    handler: listTasks,
  },
  {
    name: 'freedcamp_get_task',
    description: 'Get full details for one Freedcamp task by id, including its comments and attached files.',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'Task id' } },
      required: ['task_id'],
      additionalProperties: false,
    },
    handler: getTask,
  },
  {
    name: 'freedcamp_create_task',
    description: 'Create a new task in a Freedcamp project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project id to create the task in' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description (plain text or HTML)' },
        list_id: { type: 'string', description: 'Task list id (omit for the first list)' },
        priority: { type: 'integer', description: '0=none, 1=low, 2=medium, 3=high' },
        assigned_to_id: { type: 'string', description: 'User id to assign to, -1=everyone, 0=nobody' },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
        start_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['project_id', 'title'],
      additionalProperties: false,
    },
    handler: createTask,
  },
  {
    name: 'freedcamp_update_task',
    description: 'Update fields on an existing Freedcamp task (status, title, description, priority, assignee, due date).',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task id to update' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'integer', description: '0=not started, 1=completed, 2=in progress' },
        priority: { type: 'integer', description: '0=none, 1=low, 2=medium, 3=high' },
        assigned_to_id: { type: 'string' },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
        list_id: { type: 'string' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
    handler: updateTask,
  },
  {
    name: 'freedcamp_add_comment',
    description: 'Add a comment to a Freedcamp task (or other item).',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'Id of the task/item to comment on' },
        description: { type: 'string', description: 'Comment text (HTML supported)' },
        app_id: { type: 'string', description: 'Application id, default "2" (Tasks)' },
      },
      required: ['item_id', 'description'],
      additionalProperties: false,
    },
    handler: addComment,
  },
  {
    name: 'freedcamp_list_comments',
    description: 'List the comments on a Freedcamp task.',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'Task id' } },
      required: ['task_id'],
      additionalProperties: false,
    },
    handler: listComments,
  },
  {
    name: 'freedcamp_list_files',
    description: 'List files attached to a Freedcamp task (does not download file contents, only metadata and a temporary download URL).',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'Task id' } },
      required: ['task_id'],
      additionalProperties: false,
    },
    handler: listFiles,
  },
  {
    name: 'freedcamp_list_task_lists',
    description: 'List the task lists of a project (id, title, number of tasks), to choose list_id when creating a task. Derived from existing tasks, so empty lists do not appear.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: 'Project id' } },
      required: ['project_id'],
      additionalProperties: false,
    },
    handler: listTaskLists,
  },
  {
    name: 'freedcamp_list_assignees',
    description: 'List the users that have tasks assigned in a project (user_id, name, number of tasks), to choose assigned_to_id. Derived from existing tasks, so users without assigned tasks do not appear.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: 'Project id' } },
      required: ['project_id'],
      additionalProperties: false,
    },
    handler: listAssignees,
  },
];

const READ_ONLY = new Set(['freedcamp_list_projects', 'freedcamp_list_tasks', 'freedcamp_get_task', 'freedcamp_list_comments', 'freedcamp_list_files', 'freedcamp_list_task_lists', 'freedcamp_list_assignees']);

// ---- MCP JSON-RPC over stdio -------------------------------------------

const io = { write: (message) => process.stdout.write(JSON.stringify(message) + '\n') };

function send(message) {
  io.write(message);
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

async function handleRequest(msg) {
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      const wanted = params && params.protocolVersion;
      sendResult(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(wanted) ? wanted : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'freedcamp', version: PKG.version },
      });
      return;
    }
    if (method === 'ping') {
      sendResult(id, {});
      return;
    }
    if (method === 'notifications/initialized') {
      return; // notification, no response
    }
    if (method === 'tools/list') {
      sendResult(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
          annotations: { readOnlyHint: READ_ONLY.has(name) },
        })),
      });
      return;
    }
    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) {
        sendError(id, -32601, `Unknown tool: ${name}`);
        return;
      }
      try {
        const result = await tool.handler(args || {});
        sendResult(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: false,
        });
      } catch (toolErr) {
        sendResult(id, {
          content: [{ type: 'text', text: `Error: ${toolErr.message}` }],
          isError: true,
        });
      }
      return;
    }
    if (id !== undefined) {
      sendError(id, -32601, `Unknown method: ${method}`);
    }
  } catch (err) {
    if (id !== undefined) sendError(id, -32603, err.message);
  }
}

function main() {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch (e) {
      return; // ignore unparseable lines
    }
    handleRequest(msg);
  });
}

if (require.main === module) main();

module.exports = { io, TOOLS, READ_ONLY, api, handleRequest, listTaskLists, listAssignees, listTasks };
