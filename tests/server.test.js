'use strict';
// Pruebas sin red ni credenciales: node --test
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const srv = require('../servers/freedcamp-server.js');
const PKG = require('../package.json');

const SERVER = path.join(__dirname, '..', 'servers', 'freedcamp-server.js');

function rpc(messages, env = {}) {
  const r = spawnSync('node', [SERVER], {
    input: messages.map((m) => JSON.stringify(m)).join('\n') + '\n',
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
    timeout: 10000,
  });
  return r.stdout.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('initialize negocia versión de protocolo y entrega la versión del paquete', () => {
  const [a, b] = rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } },
  ]);
  assert.strictEqual(a.result.protocolVersion, '2025-06-18');
  assert.strictEqual(b.result.protocolVersion, '2025-06-18'); // versión más nueva soportada
  assert.strictEqual(a.result.serverInfo.version, PKG.version);
});

test('ping responde vacío', () => {
  const [r] = rpc([{ jsonrpc: '2.0', id: 1, method: 'ping' }]);
  assert.deepStrictEqual(r.result, {});
});

test('tools/list expone 10 herramientas, las de lectura marcadas readOnly', () => {
  const [r] = rpc([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }]);
  const tools = r.result.tools;
  assert.strictEqual(tools.length, 10);
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  assert.strictEqual(byName.freedcamp_get_task.annotations.readOnlyHint, true);
  assert.strictEqual(byName.freedcamp_create_task.annotations.readOnlyHint, false);
  assert.ok(byName.freedcamp_list_task_lists && byName.freedcamp_list_assignees);
});

test('sin credenciales, la herramienta falla con un mensaje claro', () => {
  const [r] = rpc([{ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'freedcamp_list_projects' } }]);
  assert.strictEqual(r.result.isError, true);
  assert.match(r.result.content[0].text, /FREEDCAMP_API_KEY/);
});

test('método desconocido devuelve error JSON-RPC', () => {
  const [r] = rpc([{ jsonrpc: '2.0', id: 1, method: 'nope' }]);
  assert.strictEqual(r.error.code, -32601);
});

const fakeTasks = [
  { id: '1', title: 'a', list_id: '10', list_title: 'Backlog', assigned_to_id: '5', assigned_to_fullname: 'Ana' },
  { id: '2', title: 'b', list_id: '10', list_title: 'Backlog', assigned_to_id: '5', assigned_to_fullname: 'Ana' },
  { id: '3', title: 'c', list_id: '11', list_title: 'Hecho', assigned_to_id: '0', assigned_to_fullname: '' },
  { id: '4', title: 'd', list_id: '11', list_title: 'Hecho', assigned_to_id: '7', assigned_to_fullname: 'Beto' },
];

test('listTaskLists y listAssignees se derivan de las tareas (API simulada)', async () => {
  srv.api.request = async () => ({ data: { tasks: fakeTasks, meta: {} } });
  const lists = await srv.listTaskLists({ project_id: '1' });
  assert.deepStrictEqual(lists, [
    { list_id: '10', title: 'Backlog', tasks: 2 },
    { list_id: '11', title: 'Hecho', tasks: 2 },
  ]);
  const users = await srv.listAssignees({ project_id: '1' });
  assert.deepStrictEqual(users, [
    { user_id: '5', name: 'Ana', tasks: 2 },
    { user_id: '7', name: 'Beto', tasks: 1 },
  ]);
});
