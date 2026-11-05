import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const root = mkdtempSync(path.join(tmpdir(), 'dsh-mounts-test-'))
const home = path.join(root, 'home')
const profile = path.join(home, 'profiles', 'test')
const ws = path.join(root, 'workspace')
const wsExternal = path.join(root, 'workspace-external')
mkdirSync(path.join(profile), { recursive: true })
process.env.DSH_HOME = home
process.env.DSH_PROFILE = 'test'
process.env.DSH_PROFILE_DIR = profile

function write(file, text) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text, 'utf8')
}

write(path.join(ws, 'memory', 'MEMORY.md'), '# Memory\n')
write(path.join(ws, '.dsh', 'memory', 'extra.md'), '# Extra\n')
write(path.join(ws, 'AGENTS.local.md'), '# Local\n\n## One\n\n## Two\n')
write(
  path.join(ws, '.dsh', 'mcp.json'),
  JSON.stringify({ mcpServers: { demo: { command: 'node', args: ['server.js'] } } }),
)
write(
  path.join(wsExternal, '.mcp.json'),
  JSON.stringify({ mcpServers: { external: { command: 'npx', args: ['server'] } } }),
)
write(path.join(wsExternal, 'mirror-memory', 'main', 'MEMORY.md'), '# Mirror\n')

const routes = new Map()
const tools = []
const ctx = {
  get(name) {
    if (name === 'workspaceRegistry') {
      return {
        list: () => [
          { path: ws, updatedAt: '2026-01-02T00:00:00Z' },
          { path: wsExternal, updatedAt: '2026-01-01T00:00:00Z' },
        ],
      }
    }
    if (name === 'skills') {
      return {
        list: async ({ cwd }) => [
          {
            name: 'demo',
            source: 'project-dsh',
            description: 'demo skill',
            invocation: { modelInvocable: true, userInvocable: true },
            path: path.join(cwd, '.dsh', 'skills', 'demo', 'SKILL.md'),
          },
        ],
      }
    }
    if (name === 'tools') {
      return {
        register(definition) {
          tools.push(definition)
          return () => {}
        },
        schemas: () => [{ name: 'working_directory' }, { name: 'mcp__demo__ping' }],
      }
    }
    return undefined
  },
  effect(fn) {
    fn()
  },
  webServer: {
    register({ path: routePath, handler }) {
      routes.set(routePath, handler)
      return () => routes.delete(routePath)
    },
  },
}

const { apply } = await import('../index.js')
apply(ctx, {})

function call(handler, { method = 'GET', url = '/dsh-mounts/api', body, headers } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter()
    req.method = method
    req.url = url
    req.headers = headers || { host: '127.0.0.1:1234' }
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value
      },
      end(payload) {
        resolve({ status: this.statusCode, headers: this.headers, body: payload })
      },
    }
    handler(req, res).catch(reject)
    if (body !== undefined) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
}

const json = (response) => JSON.parse(response.body)
const api = () => routes.get('/dsh-mounts/api')
const handoff = () => routes.get('/dsh-mounts/handoff')

test.after(() => rmSync(root, { recursive: true, force: true }))

test('snapshot reads standard memory and project MCP', async () => {
  const response = await call(api())
  assert.equal(response.status, 200)
  const data = json(response)
  const entry = data.workspaces.find((item) => item.path === ws)
  assert.equal(entry.rules.length, 1)
  assert.equal(entry.memory.count, 2)
  assert.equal(entry.projectMcp.length, 1)
  assert.equal(entry.projectMcp[0].sourceKind, 'dsh')
  assert.equal(data.effective.scope, 'catalog')
  assert.equal(data.effective.tools.mcp, 1)
  assert.equal(data.briefWorkspace, 'workspace')
})

test('external .mcp.json is marked external and mirrors are not memory', async () => {
  const response = await call(api(), {
    url: '/dsh-mounts/api?workspace=workspace-external',
  })
  const data = json(response)
  const entry = data.workspaces.find((item) => item.path === wsExternal)
  assert.equal(entry.memory.count, 0)
  assert.equal(entry.projectMcp[0].sourceKind, 'external')
  assert.equal(data.briefWorkspace, 'workspace-external')
})

test('handoff POST writes .dsh-mounts/handoff.md and the snapshot reads it', async () => {
  const response = await call(handoff(), {
    method: 'POST',
    body: JSON.stringify({ workspace: ws, text: '# Handoff\nnext step' }),
  })
  assert.equal(response.status, 200)
  assert.equal(readFileSync(path.join(ws, '.dsh-mounts', 'handoff.md'), 'utf8'), '# Handoff\nnext step')
  const data = json(await call(api()))
  const entry = data.workspaces.find((item) => item.path === ws)
  assert.equal(entry.handoff.preview, '# Handoff / next step')
})

test('handoff rejects non-POST, unknown workspace, and oversized text', async () => {
  assert.equal((await call(handoff(), { method: 'GET' })).status, 405)
  const unknown = await call(handoff(), {
    method: 'POST',
    body: JSON.stringify({ workspace: path.join(root, 'missing'), text: 'x' }),
  })
  assert.equal(unknown.status, 400)
  const oversized = await call(handoff(), {
    method: 'POST',
    body: JSON.stringify({ workspace: ws, text: 'x'.repeat(21000) }),
  })
  assert.equal(oversized.status, 413)
})

test('project_context tool is registered and reads a workspace', async () => {
  const definition = tools.find((item) => item.name === 'project_context')
  assert.ok(definition)
  const output = await definition.execute(
    { workspace: 'workspace-external' },
    { agent: { session: { header: { cwd: wsExternal } } }, signal: new AbortController().signal },
  )
  assert.match(output.text, /workspace-external/)
})
