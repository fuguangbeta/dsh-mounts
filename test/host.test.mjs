import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const root = mkdtempSync(path.join(tmpdir(), 'dsh-mounts-test-'))
const home = path.join(root, 'home')
const profile = path.join(home, 'profiles', 'test')
const ws = path.join(root, 'workspace')
const wsExternal = path.join(root, 'workspace-external')
const wsMany = path.join(root, 'workspace-many')
const wsHint = path.join(root, 'workspace-hint')
const wsBytes = path.join(root, 'workspace-bytes')
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
for (let index = 1; index <= 22; index += 1) {
  const name = 'm' + String(index).padStart(2, '0') + '.md'
  write(path.join(wsMany, 'memory', name), '# Many\n')
}
const bigMemoryBytes = 70 * 1024
write(path.join(wsBytes, 'memory', 'big.md'), 'x'.repeat(bigMemoryBytes))
write(path.join(wsBytes, 'memory', 'small.md'), '# Small\n')
write(path.join(wsHint, '.dsh-mounts', 'handoff.md'), '# Hint\n> 摘要：summary line。\nnext step\nsecret-body\n')
const wsPreview = path.join(root, 'workspace-preview')
write(path.join(wsPreview, '.dsh-mounts', 'handoff.md'), '# 交接\n\n> 读者：后来的人\n> 摘要：真实摘要\n\n正文\n')
const wsFallback = path.join(root, 'workspace-fallback')
write(path.join(wsFallback, '.dsh-mounts', 'handoff.md'), '# 交接\n\n> 读者：后来的人\n\n正文\n')
const wsPeriod = path.join(root, 'workspace-period')
write(path.join(wsPeriod, '.dsh-mounts', 'handoff.md'), '> 摘要：真实摘要。\n')

const routes = new Map()
const listeners = new Map()
const tools = []
const ctx = {
  get(name) {
    if (name === 'workspaceRegistry') {
      return {
        list: () => [
          { path: ws, updatedAt: '2026-01-02T00:00:00Z' },
          { path: wsExternal, updatedAt: '2026-01-01T00:00:00Z' },
          { path: wsMany, updatedAt: '2025-12-31T00:00:00Z' },
          { path: wsBytes, updatedAt: '2025-12-30T00:00:00Z' },
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
  on(event, listener) {
    listeners.set(event, listener)
    return () => listeners.delete(event)
  },
  webServer: {
    register({ path: routePath, handler }) {
      routes.set(routePath, handler)
      return () => routes.delete(routePath)
    },
  },
}

const { apply, handoffPreview } = await import('../index.js')
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
  assert.match(data.brief, /## 预设 MCP/)
  assert.match(data.brief, /## 最近交接/)
  assert.match(data.brief, /写入位置/)
  assert.match(data.brief, /目录：/)
  assert.match(data.brief, /技能：生效/)
  assert.match(data.brief, /MCP 工具/)
  assert.match(data.brief, /- 生成：\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
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
  assert.match(data.brief, /## 项目 MCP/)
})

test('unknown workspace is rejected instead of falling back', async () => {
  const response = await call(api(), { url: '/dsh-mounts/api?workspace=workspace-typo' })
  assert.equal(response.status, 404)
  assert.match(response.body, /workspace not found/)
})

test('memory list keeps names beyond the display cap', async () => {
  const response = await call(api(), {
    url: '/dsh-mounts/api?workspace=workspace-many',
  })
  const data = json(response)
  const entry = data.workspaces.find((item) => item.path === wsMany)
  assert.equal(entry.memory.count, 22)
  assert.match(data.brief, /其余 2 个：m21\.md、m22\.md/)
})

test('brief marks only large memory files with their byte size', async () => {
  const response = await call(api(), { url: '/dsh-mounts/api?workspace=workspace-bytes' })
  const data = json(response)
  assert.equal(data.briefWorkspace, 'workspace-bytes')
  const entry = data.workspaces.find((item) => item.path === wsBytes)
  assert.equal(entry.memory.count, 2)
  const big = entry.memory.files.find((item) => item.name === 'big.md')
  const small = entry.memory.files.find((item) => item.name === 'small.md')
  assert.equal(big.bytes, bigMemoryBytes)
  assert.match(data.brief, /- big\.md（\d{4}-\d{2}-\d{2}，71680 B）/)
  assert.match(data.brief, /- small\.md（\d{4}-\d{2}-\d{2}）/)
  assert.doesNotMatch(data.brief, /small\.md（[^）]*B/)
})

test('memory dates use the local calendar day', async () => {
  const file = path.join(ws, 'memory', 'date-edge.md')
  write(file, '# Date edge\n')
  const localMidnight = new Date(2026, 0, 1, 0, 30)
  utimesSync(file, localMidnight, localMidnight)

  const data = json(await call(api()))
  assert.match(data.brief, /date-edge\.md（2026-01-01）/)
})

test('agent/created injects a complete UserMessage', async () => {
  const handler = listeners.get('agent/created')
  assert.ok(handler)
  const injected = []
  const agent = {
    session: { header: { cwd: wsHint } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent, source: 'startup' })
  assert.equal(injected.length, 1)
  assert.equal(injected[0].role, 'user')
  assert.match(injected[0].content[0].text, /handoff\.md/)
  assert.match(injected[0].content[0].text, /摘要：summary line/)
  assert.doesNotMatch(injected[0].content[0].text, /摘要：摘要/)
  assert.doesNotMatch(injected[0].content[0].text, /。。/)
  assert.doesNotMatch(injected[0].content[0].text, /secret-body/)
  await handler({ agent, source: 'resume' })
  assert.equal(injected.length, 1)

  const noHandoff = {
    session: { header: { cwd: wsExternal } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent: noHandoff, source: 'startup' })
  assert.equal(injected.length, 1)

  const subagent = {
    session: { header: { cwd: wsHint, origin: 'subagent' } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent: subagent, source: 'startup' })
  assert.equal(injected.length, 1)
})

test('handoff preview prefers the 摘要 quote over the first quote', async () => {
  const handler = listeners.get('agent/created')
  const injected = []
  const agent = {
    session: { header: { cwd: wsPreview } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent, source: 'startup' })
  assert.equal(injected.length, 1)
  assert.match(injected[0].content[0].text, /摘要：真实摘要/)
  assert.doesNotMatch(injected[0].content[0].text, /摘要：读者/)
})

test('handoff preview falls back to the first quote without a 摘要 marker', async () => {
  const handler = listeners.get('agent/created')
  const injected = []
  const agent = {
    session: { header: { cwd: wsFallback } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent, source: 'startup' })
  assert.equal(injected.length, 1)
  assert.match(injected[0].content[0].text, /摘要：读者：后来的人/)
})

test('handoff hint drops the trailing period of the summary', async () => {
  const handler = listeners.get('agent/created')
  const injected = []
  const agent = {
    session: { header: { cwd: wsPeriod } },
    inject: (payload) => injected.push(payload),
  }
  await handler({ agent, source: 'startup' })
  assert.equal(injected.length, 1)
  assert.match(injected[0].content[0].text, /摘要：真实摘要。开工前/)
  assert.doesNotMatch(injected[0].content[0].text, /。。/)
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
  assert.equal(entry.handoff.preview, 'next step')
  assert.ok(entry.handoff.mtime)
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
  assert.match(output.text, /写入位置/)

  const missing = await definition.execute({ workspace: 'workspace-typo' }, { signal: new AbortController().signal })
  assert.match(missing.text, /未找到工作区/)
  assert.doesNotMatch(missing.text, /## 记忆库/)
})

test('handoffPreview reads 摘要 markers with both colon widths', () => {
  assert.equal(handoffPreview('# 交接\n\n> 摘要：真实摘要\n'), '真实摘要')
  assert.equal(handoffPreview('> 摘要: 真实摘要\n'), '真实摘要')
})

test('handoffPreview strips bold 摘要 markers', () => {
  assert.equal(handoffPreview('> **摘要**：真实摘要\n'), '真实摘要')
  assert.equal(handoffPreview('> **摘要** : 真实摘要\n'), '真实摘要')
})

test('handoffPreview reads English Summary markers case-insensitively', () => {
  assert.equal(handoffPreview('> Summary: real summary\n'), 'real summary')
  assert.equal(handoffPreview('> summary:real summary\n'), 'real summary')
})

test('handoffPreview accepts a full-width colon after Summary', () => {
  assert.equal(handoffPreview('> Summary：全角\n'), '全角')
})

test('handoffPreview prefers 摘要 over Summary and the first quote', () => {
  assert.equal(handoffPreview('> 读者：后来的人\n> Summary: english\n> **摘要**：真实摘要\n'), '真实摘要')
  assert.equal(handoffPreview('> 读者：后来的人\n> Summary: english\n'), 'english')
})

test('handoffPreview falls back to the first quote without a marker', () => {
  assert.equal(handoffPreview('> 读者：后来的人\n\n正文\n'), '读者：后来的人')
})

test('handoffPreview caps a long summary at 160 characters', () => {
  const preview = handoffPreview('> 摘要：' + '示'.repeat(200) + '\n')
  assert.equal(preview.length, 160)
  assert.equal(preview, '示'.repeat(159) + '…')
})
