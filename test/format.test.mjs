import assert from 'node:assert/strict'
import test from 'node:test'

// client.js is a browser module: it expects a module loader on `window` and a
// React-like `require`. Both are stand-ins here; nothing is rendered.
const captured = {}
globalThis.window = {
  __ModuleLoader__: {
    load(config) {
      captured.config = config
    },
  },
}
globalThis.__DSH_MOUNTS_TEST__ = {}

await import('../client.js')

// Any React member resolves to a no-op function; the factory only reads
// `createElement` before components run, and components never run here.
const React = new Proxy(
  {},
  {
    get() {
      return () => null
    },
  },
)
const fakeRequire = (name) => {
  if (name === 'react') return React
  throw new Error('unexpected module: ' + name)
}

captured.config.factory(fakeRequire)
const helpers = globalThis.__DSH_MOUNTS_TEST__.helpers

test.after(() => {
  delete globalThis.window
  delete globalThis.__DSH_MOUNTS_TEST__
})

test('mcpCountText keeps the configured-then-active word order', () => {
  assert.equal(helpers.mcpCountText(3, 0), '配置 3 · 生效 0')
  assert.equal(helpers.mcpCountText(3, null), '配置 3 · 生效 —')
})

test('mcpCountText follows the active dictionary', () => {
  const en = (key) => ({ 'mcp.configured': 'configured', 'mcp.active': 'active' })[key] || key
  assert.equal(helpers.mcpCountText(2, 1, en), 'configured 2 · active 1')
})

test('shortDate keeps the local calendar day across the UTC boundary', () => {
  // Local 00:30 on Jan 1 is still Dec 31 in UTC for positive offsets; the
  // accepted value is the local calendar day, not the UTC slice.
  const localLateNight = new Date(2026, 0, 1, 0, 30)
  assert.equal(helpers.shortDate(localLateNight), '2026-01-01')
  assert.equal(helpers.shortDate(localLateNight.toISOString()), '2026-01-01')
  assert.equal(helpers.shortDate('not-a-date'), 'not-a-date')
  assert.equal(helpers.shortDate(''), '')
})

test('bytes keeps the current unit thresholds', () => {
  assert.equal(helpers.bytes(0), '0 B')
  assert.equal(helpers.bytes(1023), '1023 B')
  assert.equal(helpers.bytes(1024), '1.0 KB')
  assert.equal(helpers.bytes(1536), '1.5 KB')
  assert.equal(helpers.bytes(128814), '125.8 KB')
  assert.equal(helpers.bytes(1048576), '1.0 MB')
  assert.equal(helpers.bytes(2621440), '2.5 MB')
  assert.equal(helpers.bytes('2048'), '2.0 KB')
  assert.equal(helpers.bytes(undefined), '0 B')
})

test('handoffTemplate fills the local date and the summary marker', () => {
  const text = helpers.handoffTemplate('2026-11-07')
  assert.match(text, /^# 交接（2026-11-07）$/m)
  assert.match(text, /^> 摘要：/m)
  assert.match(text, /^## 现场$/m)
  assert.match(text, /^## 未决$/m)
  assert.match(text, /^## 下一步$/m)
  assert.match(text, /^- $/m)
})

test('handoffTemplate uses the active dictionary', () => {
  const en = (key) =>
    ({
      'handoff.templateTitle': 'Handoff',
      'handoff.templateSummary': 'Summary: ',
      'handoff.templateSummaryText': 'one-line state',
      'handoff.templateState': 'State',
      'handoff.templateOpen': 'Open issues',
      'handoff.templateNext': 'Next step',
    })[key] || key
  const text = helpers.handoffTemplate('2026-11-07', en)
  assert.match(text, /^# Handoff（2026-11-07）$/m)
  assert.match(text, /^> Summary: one-line state$/m)
  assert.match(text, /^## State$/m)
  assert.match(text, /^## Open issues$/m)
  assert.match(text, /^## Next step$/m)
})

const skillItems = [
  { name: 'Gamma', source: 'builtin', path: 'D:\\proj\\.dsh\\skills\\gamma\\SKILL.md', desc: 'noise' },
  { name: 'alpha', source: 'workspace', path: 'D:\\proj\\.dsh\\skills\\alpha\\SKILL.md' },
  { name: 'MemWise', source: 'user', path: 'C:\\users\\me\\.dsh\\skills\\memwise\\SKILL.md' },
]

test('filterSkills returns everything in order for a blank query', () => {
  assert.equal(helpers.filterSkills(skillItems, ''), skillItems)
  assert.equal(helpers.filterSkills(skillItems, '   '), skillItems)
  assert.equal(helpers.filterSkills(skillItems, null), skillItems)
})

test('filterSkills matches names case-insensitively', () => {
  assert.deepEqual(helpers.filterSkills(skillItems, 'ALPHA'), [skillItems[1]])
  assert.deepEqual(helpers.filterSkills(skillItems, 'mem'), [skillItems[2]])
})

test('filterSkills matches source paths', () => {
  assert.deepEqual(helpers.filterSkills(skillItems, 'gamma\\skill'), [skillItems[0]])
  assert.deepEqual(helpers.filterSkills(skillItems, 'C:\\USERS\\ME'), [skillItems[2]])
})

test('filterSkills ignores descriptions and returns an empty list when nothing matches', () => {
  assert.deepEqual(helpers.filterSkills(skillItems, 'noise'), [])
  assert.deepEqual(helpers.filterSkills(skillItems, 'zzz'), [])
})

const workspaceItems = [
  { name: 'dsh-mounts', path: 'D:\\我的文件\\dsh-mounts' },
  { name: 'memwise', path: 'D:\\我的文件\\memwise' },
  { name: 'Other', path: 'D:\\work\\other' },
]

test('filterWorkspaces returns the same array for a blank query', () => {
  assert.equal(helpers.filterWorkspaces(workspaceItems, ''), workspaceItems)
  assert.equal(helpers.filterWorkspaces(workspaceItems, '   '), workspaceItems)
})

test('filterWorkspaces matches names case-insensitively', () => {
  assert.deepEqual(helpers.filterWorkspaces(workspaceItems, 'MEMWISE'), [workspaceItems[1]])
})

test('filterWorkspaces matches path substrings', () => {
  assert.deepEqual(helpers.filterWorkspaces(workspaceItems, 'work\\other'), [workspaceItems[2]])
})

test('filterWorkspaces returns an empty list when nothing matches', () => {
  assert.deepEqual(helpers.filterWorkspaces(workspaceItems, 'zzz'), [])
})

// --- shallow render smoke: building the panel tree must never throw ---

function makeReactStub(readyState) {
  const isInventoryState = (value) =>
    value && typeof value === 'object' && 'status' in value && 'data' in value && 'error' in value
  return {
    createElement(type, props, ...children) {
      const next = Object.assign({}, props || {})
      if (children.length === 1) next.children = children[0]
      else if (children.length > 1) next.children = children
      return { type, props: next }
    },
    useState(initial) {
      let value = typeof initial === 'function' ? initial() : initial
      if (readyState && isInventoryState(value)) value = readyState
      return [value, () => {}]
    },
    useRef: (current = null) => ({ current }),
    useEffect: () => {},
    useMemo: (factory) => factory(),
    useCallback: (fn) => fn,
    Component: class Component {
      constructor(props) {
        this.props = props
      }
      setState(update) {
        this.state = Object.assign({}, this.state, typeof update === 'function' ? update(this.state) : update)
      }
    },
    Fragment: 'fragment',
  }
}

function renderTree(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(renderTree).join('')
  const type = node.type
  const props = node.props || {}
  if (typeof type === 'function') {
    if (type.prototype && typeof type.prototype.render === 'function') {
      const instance = new type(props)
      return renderTree(instance.render())
    }
    return renderTree(type(props))
  }
  return renderTree(props.children)
}

function mountPanel(readyState) {
  const ReactStub = makeReactStub(readyState)
  const module = captured.config.factory((name) => {
    if (name === 'react') return ReactStub
    throw new Error('unexpected module: ' + name)
  })
  let page = null
  module.apply({
    inject(services, callback) {
      callback({})
      return () => {}
    },
    get: () => undefined,
    locale: {
      register: () => {},
      getLocale: () => ({ active: 'zh' }),
      subscribe: () => () => {},
    },
    slots: {
      inject: (name, factory) => factory(),
      register: (definition, component) => {
        if (definition && definition.name === 'main') page = component
        return () => {}
      },
    },
  })
  return { page, ReactStub }
}

function readySnapshot() {
  const memoryFile = { name: 'MEMORY.md', bytes: 12, mtime: '2026-11-01T00:00:00Z', dir: 'D:\\ws\\alpha\\.dsh\\memory' }
  return {
    generatedAt: '2026-11-07T00:00:00Z',
    profile: { name: 'demo', patch: 'cordis.patch.yml' },
    globalRules: { exists: true, path: 'C:\\demo\\.dsh\\AGENTS.md', bytes: 120, sections: [{ title: 'a' }, { title: 'b' }] },
    workspaces: [
      {
        name: 'alpha',
        path: 'D:\\ws\\alpha',
        brief: '# brief alpha',
        rules: [],
        memory: { count: 1, folded: 0, files: [memoryFile], dirs: ['D:\\ws\\alpha\\.dsh\\memory'] },
        handoff: { preview: 'prev', text: 'text', mtime: '2026-11-06T00:00:00Z', path: 'D:\\ws\\alpha\\.dsh-mounts\\handoff.md' },
        team: null,
      },
      {
        name: 'beta',
        path: 'D:\\ws\\beta',
        brief: '# brief beta',
        rules: [],
        memory: { count: 0, folded: 0, files: [], dirs: [] },
        handoff: null,
        team: null,
      },
    ],
    skills: [],
    mcp: [],
    engines: [],
    effective: null,
    globalMemory: { count: 0, files: [] },
    warnings: [],
    configWarnings: [],
    brief: '# default brief',
    briefWorkspace: 'alpha',
  }
}

test('panel smoke: the loading state renders without throwing', () => {
  const { page, ReactStub } = mountPanel(null)
  assert.equal(typeof page, 'function')
  const output = renderTree(ReactStub.createElement(page, {}))
  assert.match(output, /读取中/)
})

test('panel smoke: the ready state renders the header', () => {
  const { page, ReactStub } = mountPanel({ status: 'ready', data: readySnapshot(), error: null })
  const output = renderTree(ReactStub.createElement(page, {}))
  assert.match(output, /挂载清单/)
  assert.match(output, /生成于/)
})

test('panel smoke: a render error becomes one readable line with retry', () => {
  const { page } = mountPanel(null)
  const guard = page({})
  const Boundary = guard.type
  const instance = new Boundary({ failLabel: '面板渲染失败：', retryLabel: '重试' })
  instance.state = Boundary.getDerivedStateFromError(new Error('boom'))
  const output = renderTree(instance.render())
  assert.match(output, /面板渲染失败：boom/)
  assert.match(output, /重试/)
})
