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
