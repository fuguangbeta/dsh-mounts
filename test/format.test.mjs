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

function makeReactStub(readyState, plan) {
  let hookIndex = 0
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
      const index = hookIndex++
      let value = plan && plan[index] !== undefined ? plan[index] : typeof initial === 'function' ? initial() : initial
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

function collectFlags(node, out = []) {
  if (node === null || node === undefined || typeof node === 'boolean') return out
  if (typeof node === 'string' || typeof node === 'number') return out
  if (Array.isArray(node)) {
    for (const child of node) collectFlags(child, out)
    return out
  }
  const props = node.props || {}
  if ('aria-expanded' in props) out.push(props['aria-expanded'])
  const type = node.type
  if (typeof type === 'function') {
    if (type.prototype && typeof type.prototype.render === 'function') {
      const instance = new type(props)
      collectFlags(instance.render(), out)
      return out
    }
    collectFlags(type(props), out)
    return out
  }
  collectFlags(props.children, out)
  return out
}

function collectPlaceholders(node, out = []) {
  if (node === null || node === undefined || typeof node === 'boolean') return out
  if (typeof node === 'string' || typeof node === 'number') return out
  if (Array.isArray(node)) {
    for (const child of node) collectPlaceholders(child, out)
    return out
  }
  const props = node.props || {}
  if (typeof props.placeholder === 'string') out.push(props.placeholder)
  const type = node.type
  if (typeof type === 'function') {
    if (type.prototype && typeof type.prototype.render === 'function') {
      const instance = new type(props)
      collectPlaceholders(instance.render(), out)
      return out
    }
    collectPlaceholders(type(props), out)
    return out
  }
  collectPlaceholders(props.children, out)
  return out
}

function mountPanel(readyState, plan) {
  const ReactStub = makeReactStub(readyState, plan)
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

test('panel smoke: the ready state starts collapsed with no workspace picked', () => {
  const { page, ReactStub } = mountPanel({ status: 'ready', data: readySnapshot(), error: null })
  const pageElement = ReactStub.createElement(page, {})
  const output = renderTree(pageElement)
  assert.match(output, /挂载清单/)
  assert.match(output, /生成于/)
  assert.match(output, /选择/)
  assert.doesNotMatch(output, /请选择工作区/)
  assert.doesNotMatch(output, /可搜索全部|未注册/)
  assert.doesNotMatch(output, /alpha/)
  const placeholders = collectPlaceholders(pageElement)
  assert.ok(placeholders.includes('搜索技能 / 记忆 / MCP'))
  assert.ok(placeholders.includes('选择'))
  const expanded = collectFlags(pageElement).filter((value) => value === true)
  assert.equal(expanded.length, 0, 'nothing should be expanded on first render')
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

test('panel smoke: the pane entrance animation is present and motion-safe', () => {
  const { page, ReactStub } = mountPanel(null)
  const output = renderTree(ReactStub.createElement(page, {}))
  assert.match(output, /\.dmp-root\{animation:dmp-pane-in 200ms cubic-bezier\(\.16,1,\.3,1\) both;\}/)
  assert.match(output, /@keyframes dmp-pane-in\{from\{opacity:0;transform:translateY\(6px\);\}to\{opacity:1;transform:none;\}\}/)
  assert.match(output, /@keyframes dmp-wipe\{from\{clip-path:inset\(0 100% 0 0\);\}to\{clip-path:inset\(0 0 0 0\);\}\}/)
  assert.ok(
    output.includes(
      '.dmp-block{position:relative;margin-top:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;animation:dmp-wipe 260ms cubic-bezier(.16,1,.3,1) both;}',
    ),
  )
  assert.ok(
    output.includes(
      '.dmp-block-head{display:flex;align-items:center;gap:10px;width:100%;padding-block:12px;padding-right:16px;cursor:pointer;transition:background-color var(--dmp-dur) var(--dmp-ease);}',
    ),
  )
  assert.ok(!output.includes('.dmp-block-head{position:relative'))
  assert.ok(output.includes('section.dmp-block:nth-of-type(2){animation-delay:60ms;}'))
  assert.ok(output.includes('section.dmp-block:nth-of-type(2)::after{animation-delay:60ms;}'))
  assert.ok(output.includes(".dmp-block::after{content:'';position:absolute;inset:0;pointer-events:none;"))
  assert.ok(output.includes('animation:dmp-sheen 200ms cubic-bezier(.16,1,.3,1) both'))
  assert.ok(output.includes('@keyframes dmp-sheen{from{background-position:150% 0;}to{background-position:-50% 0;}}'))
  assert.ok(output.includes('background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.10) 50%,transparent 100%)'))
  assert.ok(output.includes('pointer-events:none'))
  assert.ok(
    output.includes(
      '.dmp-collapse.is-open > .dmp-collapse-inner > .dmp-group > .dmp-mem-head{animation:dmp-wipe 260ms cubic-bezier(.16,1,.3,1) both;}',
    ),
  )
  assert.match(
    output,
    /prefers-reduced-motion: reduce\)\{\.dmp-root,\.dmp-block,\.dmp-mem-head\{animation:none!important;\}\}/,
  )
  assert.ok(output.includes('@media (prefers-reduced-motion: reduce){.dmp-block::after{animation:none!important;}}'))
  assert.ok(output.includes('animation:dmp-row-in 200ms cubic-bezier(.16,1,.3,1) both'))
  assert.ok(!output.includes('cubic-bezier(.2,0,0,1)'))
  assert.ok(!output.includes('cubic-bezier(.22,1,.36,1)'))
  assert.ok(output.includes('animation-delay:calc(var(--dmp-i,0) * 20ms)'))
  assert.ok(output.includes('.dmp-collapse.is-open > .dmp-collapse-inner > .dmp-item'))
  assert.ok(!output.includes('\n.dmp-item,.dmp-file,.dmp-empty,.dmp-warning,.dmp-group{animation:dmp-row-in'))
  assert.ok(output.includes('@media (prefers-reduced-motion: reduce){.dmp-item,.dmp-file,.dmp-empty,.dmp-warning,.dmp-group{animation:none!important;}}'))
})

const searchSnapshot = {
  skills: [
    {
      name: 'alpha-skill',
      scope: 'workspace',
      workspace: 'alpha',
      workspacePath: 'D:\\ws\\alpha',
      path: 'D:\\ws\\alpha\\.dsh\\skills\\alpha-skill\\SKILL.md',
      source: 'project',
    },
    {
      name: 'beta-skill',
      scope: 'workspace',
      workspace: 'beta',
      workspacePath: 'D:\\ws\\beta',
      path: 'D:\\ws\\beta\\.dsh\\skills\\beta-skill\\SKILL.md',
      source: 'project',
    },
    { name: 'global-skill', scope: 'global', path: 'C:\\skills\\global\\SKILL.md' },
  ],
  workspaces: [
    {
      name: 'alpha',
      path: 'D:\\ws\\alpha',
      memory: {
        files: [
          {
            name: 'MEMORY.md',
            dir: 'D:\\ws\\alpha\\.dsh\\memory',
            realPath: 'D:\\ws\\alpha\\.dsh\\memory\\MEMORY.md',
          },
        ],
      },
      projectMcp: [{ server: 'codegraph', target: 'D:\\ws\\alpha\\.mcp.json' }],
    },
    {
      name: 'beta',
      path: 'D:\\ws\\beta',
      memory: { files: [{ name: 'notes.md', dir: 'D:\\ws\\beta\\.dsh\\memory' }] },
      projectMcp: [],
    },
  ],
  globalMemory: { files: [{ name: 'global.md' }] },
}

const searchIndexAll = helpers.buildSearchIndex(searchSnapshot, '')

test('buildSearchIndex covers every workspace when none is selected', () => {
  const keys = searchIndexAll.map((item) => item.kind + ':' + item.workspace + ':' + item.name).sort()
  assert.deepEqual(keys, [
    'mcp:alpha:codegraph',
    'memory:alpha:MEMORY.md',
    'memory:beta:notes.md',
    'skill:alpha:alpha-skill',
    'skill:beta:beta-skill',
  ])
})

test('buildSearchIndex narrows to the selected workspace only', () => {
  const index = helpers.buildSearchIndex(searchSnapshot, 'alpha')
  assert.ok(index.length > 0)
  assert.ok(index.every((item) => item.workspace === 'alpha'))
  assert.deepEqual(index.map((item) => item.name).sort(), ['MEMORY.md', 'alpha-skill', 'codegraph'])
})

test('querySearch matches a path substring', () => {
  const hits = helpers.querySearch(searchIndexAll, 'D:\\ws\\beta')
  const names = hits.map((item) => item.name).sort()
  assert.deepEqual(names, ['beta-skill', 'notes.md'])
})

test('querySearch is case-insensitive', () => {
  const names = helpers.querySearch(searchIndexAll, 'CODE').map((item) => item.name)
  assert.deepEqual(names, ['codegraph'])
})

test('querySearch returns an empty list for a blank query', () => {
  assert.deepEqual(helpers.querySearch(searchIndexAll, ''), [])
  assert.deepEqual(helpers.querySearch(searchIndexAll, '   '), [])
})

test('querySearch returns an empty list when nothing matches', () => {
  assert.deepEqual(helpers.querySearch(searchIndexAll, 'zzz'), [])
})

test('workspaceExpansion opens only the workspace block', () => {
  const expansion = helpers.workspaceExpansion('alpha')
  assert.deepEqual(expansion.blocks, { workspace: true })
  assert.deepEqual(expansion.sections, {})
  assert.deepEqual(expansion.rows, {})
})

test('workspaceExpansion keys are scoped per workspace', () => {
  const alphaKeys = ['brief', 'memory', 'skills', 'mcp'].map((kind) => helpers.wsSectionId('alpha', kind))
  const betaKeys = ['brief', 'memory', 'skills', 'mcp'].map((kind) => helpers.wsSectionId('beta', kind))
  assert.deepEqual(alphaKeys.filter((key) => betaKeys.includes(key)), [])
  assert.ok(alphaKeys.every((key) => key.startsWith('ws:alpha:')))
  assert.deepEqual(helpers.workspaceExpansion('alpha').sections, {})
})

test('panel smoke: a ready workspace opens only the block, not the sections', () => {
  // The stub does not run effects or state updates, so this seeds the state the
  // pick effect would land once the snapshot arrives: block open, sections shut.
  const plan = []
  plan[1] = { workspace: true }
  plan[2] = helpers.workspaceExpansion('alpha').sections
  plan[3] = 'alpha'
  plan[4] = { status: 'ready', data: { ...readySnapshot(), briefWorkspace: 'alpha' }, error: null }
  const { page, ReactStub } = mountPanel(null, plan)
  const pageElement = ReactStub.createElement(page, {})
  const expanded = collectFlags(pageElement).filter((value) => value === true)
  assert.equal(expanded.length, 1, 'only the workspace block should be expanded')
  const output = renderTree(pageElement)
  assert.match(output, /项目简报/)
  assert.match(output, /记忆/)
  assert.match(output, /技能/)
  assert.match(output, /MCP/)
})
