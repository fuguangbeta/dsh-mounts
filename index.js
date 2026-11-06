/**
 * dsh-mounts — Host half.
 *
 * Read-only inventory of what this DSH profile actually mounts: the global
 * AGENTS.md, each registered workspace's rule files and memory libraries, the
 * skills found in the user and workspace scan roots, the `dsh-mcp-client` rows
 * of the profile patch, and the Agent Presets that patch declares. The scan is
 * pure Node `fs` reading; the only thing this plugin serves is its own JSON
 * snapshot to its own panel.
 *
 * It never spawns a process and never reaches a network; the only write is an
 * explicit handoff save to `<workspace>/.dsh-mounts/handoff.md`.
 */
import { mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import path from 'node:path'

/**
 * A linked bundle lives outside the profile, so a bare `@deepseek-ai/*` import
 * does not resolve from its real path. Try the normal specifier first, then the
 * installation's own copy (the Host process can load from app.asar).
 */
async function loadSchemastery() {
  try {
    const mod = await import('@deepseek-ai/schemastery')
    if (mod && mod.default) return mod.default
  } catch {
    /* fall through to the installation copy */
  }
  try {
    const requireFromHere = createRequire(import.meta.url)
    const candidates = [
      path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'dsh', 'node_modules', '@deepseek-ai', 'schemastery'),
      path.join(path.dirname(process.execPath), 'resources', 'app.asar.unpacked', 'dsh', 'node_modules', '@deepseek-ai', 'schemastery'),
    ]
    for (const dir of candidates) {
      try {
        const mod = requireFromHere(dir)
        if (mod) return mod.default || mod
      } catch {
        /* keep trying */
      }
    }
  } catch {
    /* no installation copy available */
  }
  return null
}

const z = await loadSchemastery()

// 注意：bundle 通过 include 插入的行，其 config 无法从 profile 的表单写入
// （mutate 会被接受后静默丢弃，实测 2026-10-17）。这里保留读取是为了让
// 愿意直接改本 bundle 的 cordis.patch.yml 的安装者仍能注入配置。
export const Config = z
  ? z.object({
      extraSkillRoots: z.array(z.string()).default([]),
      extraPatchFiles: z.array(z.string()).default([]),
    })
  : undefined

/** The Web server owns the route table; stay inactive where it is absent. */
export const inject = ['webServer']

export const name = 'dsh-mounts'

const ROUTE = '/dsh-mounts/api'
const HANDOFF_ROUTE = '/dsh-mounts/handoff'
const MCP_PACKAGE = '@deepseek-ai/dsh-mcp-client'
const PRESET_PACKAGE = '@deepseek-ai/dsh-agent-preset'

/**
 * Presets shipped inside the dsh bundle. Their definitions live in app.asar, so
 * the Host cannot read them; the list is hard-coded. Re-check it after a DSH
 * upgrade — a renamed preset would otherwise go stale here.
 */
const BUILTIN_PRESETS = ['standard', 'ptc', 'minimal', 'cordis']

function readText(file) {
  try {
    // Normalize line endings once, for every parser below: a CRLF file left its
    // `\r` in place, and `(.*)$` never matched, so frontmatter silently emptied.
    return readFileSync(file, 'utf8').replace(/\r\n?/g, '\n')
  } catch {
    return null
  }
}

function fileSize(file) {
  try {
    return statSync(file).size
  } catch {
    return 0
  }
}

function fileMtime(file) {
  try {
    return statSync(file).mtime.toISOString()
  } catch {
    return ''
  }
}

function localDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  )
}
/** Cap a text value and mark the cut with an ellipsis, so the UI never shows a broken sentence. */
function capText(value, max) {
  const text = String(value || '').trim()
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}


function isDirectory(target) {
  try {
    return statSync(target).isDirectory()
  } catch {
    return false
  }
}

function isFile(target) {
  try {
    return statSync(target).isFile()
  } catch {
    return false
  }
}

function unquote(value) {
  return String(value).trim().replace(/^['"]|['"]$/g, '')
}

function frontmatter(text) {
  if (!text || !text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end < 0) return {}
  const out = {}
  for (const line of text.slice(3, end).split(/\r?\n/)) {
    const match = /^(\w[\w-]*):\s*(.*)$/.exec(line)
    if (match) out[match[1]] = unquote(match[2])
  }
  return out
}

function headings(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim())
}

function skillsIn(root, rank, label) {
  const found = []
  if (!isDirectory(root)) return { found, exists: false }
  let entries = []
  try {
    entries = readdirSync(root).sort()
  } catch {
    return { found, exists: true }
  }
  for (const entry of entries) {
    const hit = [path.join(root, entry, 'SKILL.md'), path.join(root, entry + '.md')].find(isFile)
    if (!hit) continue
    const meta = frontmatter(readText(hit))
    found.push({
      rank,
      label,
      dir: entry,
      name: meta.name || entry,
      desc: capText(meta.description, 1000),
      bytes: fileSize(hit),
      path: hit,
    })
  }
  return { found, exists: true }
}

function locateProject(cwd) {
  const start = path.resolve(cwd)
  let dir = start
  for (;;) {
    if (isDirectory(path.join(dir, '.git'))) return { root: dir, hasGit: true }
    const parent = path.dirname(dir)
    if (parent === dir) return { root: start, hasGit: false }
    dir = parent
  }
}

/**
 * Split a Loader patch into its `- id:` rows by indentation. A YAML parser is
 * not usable here: the patch dialect carries `!!js` tags it rejects.
 */
function patchRows(file) {
  const text = readText(file)
  if (text === null) return []
  const lines = text.split(/\r?\n/)
  const starts = []
  lines.forEach((line, index) => {
    const match = /^(\s*)- id:\s*(\S+)\s*$/.exec(line)
    if (match) starts.push({ indent: match[1].length, id: match[2], start: index })
  })
  return starts.map(({ indent, id, start }) => {
    let end = start + 1
    while (end < lines.length) {
      const line = lines[end]
      if (!line.trim()) {
        end += 1
        continue
      }
      const current = line.length - line.trimStart().length
      if (current < indent) break
      if (current === indent && line.trimStart().startsWith('- id:')) break
      end += 1
    }
    return { id, indent, block: lines.slice(start + 1, end).join('\n') }
  })
}

function firstLine(block) {
  for (const line of block.split('\n')) if (line.trim()) return line.trim()
  return ''
}

function configBlock(block) {
  const lines = block.split('\n')
  const at = lines.findIndex((line) => /^\s*config:\s*$/.test(line))
  if (at < 0) return ''
  const out = []
  for (const line of lines.slice(at + 1)) {
    if (/^\s*plugins:\s*$/.test(line)) break
    out.push(line)
  }
  return out.join('\n')
}

function grab(block, key) {
  const match = new RegExp('^\\s*' + key + ':\\s*(.+?)\\s*$', 'm').exec(block)
  return match ? unquote(match[1]) : ''
}

function rowOf(block, pkg) {
  const first = firstLine(block)
  if (!first.startsWith('name:')) return false
  return new RegExp("name:\\s*['\"]" + pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]").test(first)
}

function scanPresetRows(patchFiles) {
  const mcp = []
  const presets = []
  let registry = { default: null, selectedDefault: null }
  const seen = new Set()
  for (const patchFile of patchFiles) {
    // Attribution only holds inside one file: an MCP row is nested under the
    // preset row that declares it in `config.plugins`. Track that nesting with
    // the row indentation, and reset it for every file.
    const stack = []
    for (const { id, indent, block } of patchRows(patchFile)) {
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
      // Layering: earlier files win, so the global layer (listed first) beats a
      // profile row with the same id.
      if (seen.has(id)) continue
      seen.add(id)
      if (rowOf(block, MCP_PACKAGE)) {
        mcp.push({
          row: id,
          server: grab(block, 'serverName'),
          transport: grab(block, 'transport'),
          target: grab(block, 'url') || grab(block, 'command'),
          env: [...block.matchAll(/^\s+([A-Z_][A-Z0-9_]*):/gm)].map((match) => match[1]),
          presetId: stack.length ? stack[stack.length - 1].presetId : '',
          presetRow: stack.length ? stack[stack.length - 1].rowId : '',
        })
      } else if (rowOf(block, PRESET_PACKAGE)) {
        const config = configBlock(block)
        const presetId = /^\s*id:\s*(\S+)\s*$/m.exec(config)
        const title = /^\s*name:\s*(.+?)\s*$/m.exec(config)
        const preset = {
          row: id,
          id: presetId ? presetId[1] : '?',
          title: title ? unquote(title[1]) : '',
          mcp: block.split('dsh-mcp-client').length - 1,
        }
        presets.push(preset)
        stack.push({ indent, presetId: preset.id, rowId: id })
      } else if (firstLine(block).includes('dsh-agent-preset-registry')) {
        const preset = (name) => {
          const match = new RegExp('^\\s*' + name + ':\\s*(\\S+)\\s*$', 'm').exec(block)
          return match ? match[1] : null
        }
        registry = { default: preset('default'), selectedDefault: preset('selectedDefault') }
      }
    }
  }
  return { mcp, presets, registry }
}

/**
 * A leading `~` becomes home; anything else is used verbatim. Paths that do
 * not exist are ignored by the callers, never created.
 */
function expandHome(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text === '~') return homedir()
  if (text.startsWith('~/') || text.startsWith('~\\')) return path.join(homedir(), text.slice(2))
  return text
}

/** Resolve a junction/symlink target; fall back to the logical path. */
const realOf = (value) => {
  try {
    return realpathSync(value)
  } catch {
    return value
  }
}

function markdownFiles(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  const items = []
  for (const file of entries) {
    if (!file.toLowerCase().endsWith('.md')) continue
    const full = path.join(dir, file)
    let info
    try {
      info = statSync(full)
    } catch {
      continue
    }
    if (!info.isFile()) continue
    items.push({ name: file, bytes: info.size, mtime: new Date(info.mtimeMs).toISOString() })
    if (items.length >= 200) break
  }
  items.sort((a, b) => a.name.localeCompare(b.name))
  return items
}

function makeStore(name, dir) {
  const files = markdownFiles(dir)
  if (!files.length) return null
  const latest = files.reduce((newest, item) => (item.mtime > newest ? item.mtime : newest), '')
  return { name, dir, count: files.length, latest, files }
}

function workspaceStores(workspaces) {
  const stores = []
  for (const workspace of workspaces || []) {
    const base = path.basename(workspace) || workspace
    for (const relative of ['memory', path.join('.dsh', 'memory'), path.join('.agents', 'memory')]) {
      const dir = path.join(workspace, relative)
      if (!isDirectory(dir)) continue
      const files = markdownFiles(dir)
      if (!files.length) continue
      stores.push({ group: base, dir, origin: 'workspace', files })
    }
  }
  return stores
}

/** Merge stores by group: unique paths first, then same-name files keep the newest. */
function mergeMemory(stores) {
  const groups = new Map()
  for (const store of stores) {
    let group = groups.get(store.group)
    if (!group) {
      group = { group: store.group, origins: new Set(), dirs: [], byPath: new Map() }
      groups.set(store.group, group)
    }
    group.origins.add(store.origin)
    if (!group.dirs.includes(store.dir)) group.dirs.push(store.dir)
    for (const file of store.files) {
      group.byPath.set((store.dir + '|' + file.name).toLowerCase(), {
        name: file.name,
        bytes: file.bytes,
        mtime: file.mtime,
        dir: store.dir,
        realPath: realOf(path.join(store.dir, file.name)),
      })
    }
  }

  const result = []
  for (const group of groups.values()) {
    // Count physical files (unique paths) before same-name folding; `files`
    // keeps one copy per name, and `folded` reports the removed duplicates.
    const count = group.byPath.size
    const byName = new Map()
    for (const file of group.byPath.values()) {
      const list = byName.get(file.name) || []
      list.push(file)
      byName.set(file.name, list)
    }
    const files = []
    let folded = 0
    for (const list of byName.values()) {
      list.sort((a, b) => (a.mtime < b.mtime ? 1 : a.mtime > b.mtime ? -1 : 0))
      files.push(list[0])
      folded += list.length - 1
    }
    files.sort((a, b) => a.name.localeCompare(b.name))
    const latest = files.reduce((newest, file) => (file.mtime > newest ? file.mtime : newest), '')
    result.push({
      group: group.group,
      origin: group.origins.size > 1 ? 'both' : [...group.origins][0],
      dirs: group.dirs.sort(),
      count,
      folded,
      latest,
      files,
    })
  }
  result.sort((a, b) => b.count - a.count || a.group.localeCompare(b.group))
  return result
}

/* ---------- project context: team, handoff, engines, brief ---------- */

function readJson(file) {
  const text = readText(file)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Tools this plugin can share context with; detection is by profile package name. */
const KNOWN_ENGINES = [
  { id: 'mnemon', label: 'dsh-mnemon', packages: ['dsh-mnemon'] },
  { id: 'mneme', label: 'dsh-mneme', packages: ['@modusensus/dsh-mneme'] },
  { id: 'engramory', label: 'engramory', packages: ['dsh-engramory'] },
  { id: 'agent-teams', label: 'dsh-agent-teams', packages: ['@nanmicoder/dsh-agent-teams', 'dsh-agent-teams'] },
  { id: 'context-doctor', label: 'Context Doctor', packages: ['dsh-context-doctor'] },
]

function installedEngines(profileDir) {
  const pkg = readJson(path.join(profileDir, 'package.json')) || {}
  const dependencies = pkg.dependencies && typeof pkg.dependencies === 'object' ? pkg.dependencies : {}
  const profile = pkg.dsh && pkg.dsh.profile
  const bundles = profile && Array.isArray(profile.bundles) ? profile.bundles : []
  const installed = new Set([...Object.keys(dependencies), ...bundles.map(String)])
  return KNOWN_ENGINES.map((engine) => ({
    id: engine.id,
    label: engine.label,
    installed: engine.packages.some((name) => installed.has(name)),
  }))
}

/** Read a `.agent-teams/team.json` if the collaboration plugin wrote one. */
function readTeamState(workspacePath) {
  const dir = path.join(workspacePath, '.agent-teams')
  if (!isDirectory(dir)) return null
  const data = readJson(path.join(dir, 'team.json'))
  if (!data) return { present: true, unknown: true, members: [], tasks: [] }
  const members = Array.isArray(data.members)
    ? data.members.slice(0, 20).map((member) => ({
        name: String((member && (member.name || member.id)) || '?'),
        role: String((member && member.role) || ''),
        status: String((member && (member.status || member.state)) || ''),
      }))
    : []
  const tasks = Array.isArray(data.tasks)
    ? data.tasks.slice(0, 50).map((task) => ({
        subject: String((task && (task.subject || task.title || task.id)) || '?'),
        status: String((task && task.status) || ''),
        assignee: String((task && (task.assignee || task.owner)) || ''),
      }))
    : []
  return { present: true, status: String(data.status || ''), members, tasks }
}

/** A small, explicit handoff note lives at `<workspace>/.dsh-mounts/handoff.md`. */
function handoffAgeDays(mtime) {
  const time = new Date(mtime).getTime()
  if (!Number.isFinite(time)) return 0
  return Math.max(0, Math.floor((Date.now() - time) / 86400000))
}

function handoffAgeText(mtime) {
  if (!mtime) return ''
  const time = new Date(mtime).getTime()
  if (!Number.isFinite(time)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return minutes + ' 分钟前'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + ' 小时前'
  return Math.floor(hours / 24) + ' 天前'
}

export function handoffPreview(text) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const summaryLine = lines.find((line) => /^>\s*(?:\*\*\s*摘要\s*\*\*|摘要)\s*[:：]/.test(line))
  const englishLine = lines.find((line) => /^>\s*summary\s*[:：]/i.test(line))
  const quoted = lines.find((line) => /^>\s*\S/.test(line))
  const plain = lines.find((line) => !/^#{1,6}\s/.test(line) && !/^[-*_]{3,}$/.test(line))
  const heading = lines.find((line) => /^#{1,6}\s/.test(line))
  const marker = summaryLine || englishLine
  const textLine = marker
    ? marker
        .replace(/^>\s*/, '')
        .replace(/^\*\*\s*摘要\s*\*\*\s*[:：]\s*/, '')
        .replace(/^(?:摘要|summary)\s*[:：]\s*/i, '')
    : quoted
      ? quoted.replace(/^>\s*/, '')
      : plain
        ? plain.replace(/^([-*+]|\d+\.)\s+/, '')
        : heading || ''
  const summary = textLine.replace(/^摘要\s*[:：]\s*/, '')
  return capText(summary || textLine, 160)
}

function readHandoff(workspacePath) {
  for (const relative of [path.join('.dsh-mounts', 'handoff.md'), path.join('.dsh', 'handoff.md')]) {
    const file = path.join(workspacePath, relative)
    if (!isFile(file)) continue
    const text = readText(file) || ''
    return {
      path: file,
      bytes: fileSize(file),
      mtime: fileMtime(file),
      preview: handoffPreview(text),
      text: text.length > 20000 ? text.slice(0, 20000) : text,
    }
  }
  return null
}

/** A bounded, agent-readable summary of what this workspace actually mounts. */
function buildBrief(entry, context) {
  const lines = []
  lines.push('# 项目上下文简报')
  lines.push('')
  lines.push('- 工作区：' + entry.name)
  lines.push('- 路径：' + entry.path)
  lines.push('- 生成：' + localDateTime())
  const selectedPreset = context.registry.selectedDefault || context.registry.default || '?'
  lines.push('')
  lines.push('## 当前预设')
  lines.push('- 选中：' + selectedPreset + '；默认：' + (context.registry.default || '?') + '（实际生效见文末）')
  lines.push('- 自定义：' + (context.presets.length ? context.presets.map((preset) => preset.id).join('、') : '无'))
  lines.push('')
  lines.push('## 全局规则')
  lines.push(
    context.globalRules && context.globalRules.exists
      ? '- `~/.dsh/AGENTS.md`：' + (context.globalRules.sections || []).length + ' 节'
      : '- 无',
  )
  lines.push('')
  lines.push('## 项目规则（自动注入）')
  if (entry.rules.length) {
    for (const rule of entry.rules) {
      lines.push('- ' + rule.file + '：' + (rule.sections || []).length + ' 节')
    }
  } else {
    lines.push('- 无')
  }
  lines.push('')
  lines.push('## 记忆库（Markdown，非自动注入）')
  if (entry.memory.count) {
    if (entry.memory.dirs && entry.memory.dirs.length) lines.push('- 目录：' + entry.memory.dirs.join('；'))
    lines.push(
      '- 共 ' + entry.memory.count + ' 个文件' + (entry.memory.folded ? '（合并同名 ' + entry.memory.folded + ' 个）' : '') + '：',
    )
    const shown = entry.memory.files.slice(0, 20)
    for (const file of shown) {
      const large = file.bytes >= 64 * 1024 ? '，' + file.bytes + ' B' : ''
      lines.push('  - ' + file.name + '（' + localDateTime(new Date(file.mtime)).slice(0, 10) + large + '）')
    }
    if (entry.memory.files.length > shown.length) {
      const rest = entry.memory.files.slice(shown.length).map((file) => file.name)
      lines.push('  - …其余 ' + rest.length + ' 个：' + rest.join('、'))
    }
  } else {
    lines.push('- 无')
  }
  lines.push('')
  const workspaceSkills = context.skills.filter(
    (skill) => skill.scope === 'workspace' && (skill.workspacePath === entry.path || skill.workspace === entry.name),
  )
  const globalSkills = context.skills.filter((skill) => skill.scope === 'global')
  lines.push('## 技能')
  lines.push(
    '- 本项目：' + workspaceSkills.length + ' 个' + (workspaceSkills.length ? '：' + workspaceSkills.slice(0, 8).map((skill) => skill.name).join('、') : ''),
  )
  lines.push('- 全局（目录）：' + globalSkills.length + ' 个（仅 ~/.dsh/skills；文末「生效」含内置/插件/运行时）')
  lines.push('')
  const currentMcp =
    selectedPreset && selectedPreset !== '?'
      ? context.mcp.filter((server) => !server.presetId || server.presetId === selectedPreset)
      : context.mcp
  const otherMcp =
    selectedPreset && selectedPreset !== '?'
      ? context.mcp.filter((server) => server.presetId && server.presetId !== selectedPreset)
      : []
  lines.push('## 预设 MCP')
  if (currentMcp.length) {
    for (const server of currentMcp) {
      lines.push('- ' + server.server + '（' + server.transport + '）' + (server.presetId ? ' · 预设 ' + server.presetId : ''))
    }
  } else {
    lines.push('- 无')
  }
  if (otherMcp.length) lines.push('- 其他预设：' + otherMcp.length + ' 个（未列）')
  if (entry.projectMcp && entry.projectMcp.length) {
    lines.push('')
    lines.push('## 项目 MCP')
    for (const server of entry.projectMcp) {
      lines.push(
        '- ' +
          server.server +
          '（' +
          server.transport +
          '）' +
          (server.target ? ' · ' + server.target : '') +
          (server.sourceKind === 'external' ? ' · 外部格式（DSH 不读取）' : ''),
      )
    }
  }
  if (entry.team) {
    lines.push('')
    lines.push('## 团队（dsh-agent-teams）')
    if (entry.team.unknown) {
      lines.push('- 检测到 `.agent-teams/`，但未找到可解析的 `team.json`')
    } else {
      lines.push('- 成员：' + entry.team.members.length + '；任务：' + entry.team.tasks.length)
      for (const member of entry.team.members.slice(0, 8)) {
        lines.push('  - ' + member.name + (member.role ? '（' + member.role + '）' : '') + (member.status ? ' · ' + member.status : ''))
      }
    }
  }
  lines.push('')
  lines.push('## 最近交接')
  if (entry.handoff) {
    const when = entry.handoff.mtime ? localDateTime(new Date(entry.handoff.mtime)) : ''
    const age = handoffAgeText(entry.handoff.mtime)
    const stale = handoffAgeDays(entry.handoff.mtime) >= 7 ? ' ⚠ 已超过 7 天' : ''
    const meta = [when, age].filter(Boolean).join('，') + stale
    lines.push('- ' + entry.handoff.path + (meta ? '（' + meta + '）' : '') + '：' + (entry.handoff.preview || '（无摘要）'))
  } else {
    lines.push('- 无（写入位置：' + path.join(entry.path, '.dsh-mounts', 'handoff.md') + '）')
  }
  lines.push('')
  lines.push('## 记忆 / 协作引擎')
  const installedEngines = context.engines.filter((engine) => engine.installed)
  if (!installedEngines.length) {
    lines.push('- 均未安装（' + context.engines.map((engine) => engine.label).join('、') + '）')
  } else {
    for (const engine of context.engines) {
      lines.push('- ' + engine.label + '：' + (engine.installed ? '已安装' : '未安装'))
    }
  }
  return lines.join('\n')
}

/* ---------- effective view (what the current agent actually sees) ---------- */

let effectiveCache = null

function sessionOf(agent, sessions) {
  try {
    if (agent && agent.session && agent.session.header) return agent.session
    if (agent && agent.id && sessions && typeof sessions.get === 'function') return sessions.get(agent.id)
  } catch {
    /* no session */
  }
  return null
}

function agentRank(agent, sessions) {
  const session = sessionOf(agent, sessions)
  if (!session) return 0
  try {
    const seq = Number(session.seq || 0)
    const event = seq > 0 ? session.eventAt(seq - 1) : null
    if (event && typeof event.time === 'number') return event.time
    return Number((session.header && session.header.createdAt) || 0)
  } catch {
    return 0
  }
}

/** The live agent whose session runs inside this workspace, most recent first. */
function currentAgentFor(ctx, workspacePath) {
  const root = String(workspacePath || '')
  if (!root) return null
  try {
    const agents = ctx.get('agents')
    const list = agents && typeof agents.list === 'function' ? agents.list() : []
    const sessions = ctx.get('sessions')
    const usable = list.filter((agent) => {
      const session = sessionOf(agent, sessions)
      if (!session || !session.header) return false
      const cwd = session.header.cwd
      return (
        typeof cwd === 'string' &&
        session.header.origin !== 'subagent' &&
        isDirectory(cwd) &&
        (cwd === root || cwd.startsWith(root + path.sep))
      )
    })
    usable.sort((a, b) => agentRank(b, sessions) - agentRank(a, sessions))
    return usable[0] || null
  } catch {
    return null
  }
}

/**
 * Ask the Host's own registries what the agent sees: effective skills (including
 * bundled ones) and the visible tool schemas. Read-only and bounded; failures
 * degrade to no effective view rather than breaking the inventory.
 */
async function effectiveView(ctx, cwd, agent, fileSkills) {
  const key = (agent && agent.id ? 'agent:' + String(agent.id) : 'catalog') + '|' + cwd
  if (effectiveCache && effectiveCache.key === key && Date.now() - effectiveCache.at < 15000) {
    return effectiveCache.value
  }
  let skillsService = null
  let toolsService = null
  try {
    skillsService = ctx.get('skills')
  } catch {
    skillsService = null
  }
  try {
    toolsService = ctx.get('tools')
  } catch {
    toolsService = null
  }
  if (!skillsService && !toolsService) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  let summaries = []
  try {
    if (skillsService && typeof skillsService.list === 'function') {
      summaries = await skillsService.list({
        cwd,
        ...(agent ? { scope: agent } : {}),
        signal: controller.signal,
      })
    }
  } catch {
    summaries = []
  } finally {
    clearTimeout(timer)
  }

  const skills = (Array.isArray(summaries) ? summaries : []).map((skill) => ({
    name: String((skill && skill.name) || ''),
    source: String((skill && skill.source) || ''),
    provider: String((skill && skill.provider) || ''),
    description: capText(skill && skill.description, 200),
    modelInvocable: Boolean(skill && skill.invocation && skill.invocation.modelInvocable),
    userInvocable: Boolean(skill && skill.invocation && skill.invocation.userInvocable),
    path: typeof (skill && skill.path) === 'string' ? skill.path : '',
  }))

  let schemas = []
  try {
    if (toolsService && typeof toolsService.schemas === 'function') schemas = toolsService.schemas(agent || undefined)
  } catch {
    schemas = []
  }
  const servers = []
  let mcpCount = 0
  for (const schema of Array.isArray(schemas) ? schemas : []) {
    const name = String((schema && schema.name) || '')
    const match = /^mcp__(.+?)__(.+)$/.exec(name)
    if (!match) continue
    mcpCount += 1
    const server = match[1]
    const hit = servers.find((entry) => entry.server === server)
    if (hit) hit.count += 1
    else servers.push({ server, count: 1 })
  }
  servers.sort((a, b) => b.count - a.count || a.server.localeCompare(b.server))

  const seen = new Set(skills.map((skill) => skill.name))
  const shadowed = Array.isArray(fileSkills)
    ? [...new Set(fileSkills.map((skill) => skill.name).filter((name) => name && !seen.has(name)))].slice(0, 20)
    : []

  const sessions = (() => {
    try {
      return ctx.get('sessions')
    } catch {
      return null
    }
  })()
  const session = sessionOf(agent, sessions)
  const value = {
    available: skills.length > 0 || schemas.length > 0,
    scope: agent ? 'session' : 'catalog',
    agent: {
      id: agent && agent.id ? String(agent.id) : '',
      preset: session && session.header && session.header.agentPreset ? String(session.header.agentPreset) : '',
      cwd,
    },
    skills,
    shadowed,
    tools: {
      total: Array.isArray(schemas) ? schemas.length : 0,
      mcp: mcpCount,
      native: (Array.isArray(schemas) ? schemas.length : 0) - mcpCount,
      servers,
    },
    generatedAt: new Date().toISOString(),
  }
  effectiveCache = { key, at: Date.now(), value }
  return value
}

function effectiveSection(effective, scopeLabel) {
  if (!effective || !effective.available) return ''
  const sources = {}
  for (const skill of effective.skills) sources[skill.source] = (sources[skill.source] || 0) + 1
  const builtin = sources.bundled || 0
  const project = (sources['project-dsh'] || 0) + (sources['project-agents'] || 0)
  const user =
    (sources['user-dsh'] || 0) + (sources['user-agents'] || 0) + (sources.custom || 0) + (sources.runtime || 0)
  const lines = ['', '## 实际生效（' + (scopeLabel || 'Host 视角') + '）']
  if (effective.agent.preset) lines.push('- Agent 预设：' + effective.agent.preset)
  lines.push(
    '- 技能：生效 ' +
      effective.skills.length +
      '（内置 ' +
      builtin +
      ' / 项目 ' +
      project +
      ' / 用户 ' +
      user +
      '）' +
      (effective.shadowed.length ? '；另有被遮蔽 ' + effective.shadowed.length + '（不计入）' : ''),
  )
  let toolLine = '- 工具：' + effective.tools.total + ' 个；MCP 工具 ' + effective.tools.mcp
  if (effective.tools.servers.length) {
    toolLine +=
      '；MCP 服务器：' +
      effective.tools.servers
        .slice(0, 6)
        .map((server) => server.server + ' ' + server.count)
        .join('、')
  }
  lines.push(toolLine)
  return '\n' + lines.join('\n')
}

/** Project-level MCP: `<workspace>/.dsh/mcp.json` (or `.mcp.json`). */
function readProjectMcp(workspacePath) {
  const dshFile = path.join(workspacePath, '.dsh', 'mcp.json')
  const externalFile = path.join(workspacePath, '.mcp.json')
  for (const file of [dshFile, externalFile]) {
    const data = readJson(file)
    if (!data) continue
    const raw = data.mcpServers || data.servers || data
    const sourceKind = file === dshFile ? 'dsh' : 'external'
    const rows = []
    const push = (name, item) => {
      if (!item || typeof item !== 'object') return
      const env = item.env && typeof item.env === 'object' ? Object.keys(item.env) : []
      const command = Array.isArray(item.args) ? [item.command, ...item.args].filter(Boolean).join(' ') : item.command
      rows.push({
        row: 'project:' + name,
        server: String(name),
        transport: String(item.transport || (item.url ? 'http' : 'stdio')),
        target: String(item.url || command || ''),
        env,
        presetId: '',
        source: file,
        sourceKind,
      })
    }
    if (Array.isArray(raw)) {
      for (const item of raw) push((item && (item.name || item.serverName)) || 'server', item)
    } else if (raw && typeof raw === 'object') {
      for (const [name, item] of Object.entries(raw)) push(name, item)
    }
    return rows.slice(0, 50)
  }
  return []
}

/** Known global memory libraries outside workspaces. */
function readGlobalMemory(dshHome) {
  const dirs = [
    path.join(dshHome, 'memory'),
    path.join(dshHome, '.engramory-memory'),
    path.join(dshHome, 'memory-bank'),
  ]
  const stores = []
  for (const dir of dirs) {
    if (!isDirectory(dir)) continue
    const files = markdownFiles(dir)
    if (files.length) stores.push({ dir, files })
  }
  const files = []
  for (const store of stores) {
    for (const file of store.files) {
      files.push({ ...file, dir: store.dir, realPath: realOf(path.join(store.dir, file.name)) })
    }
  }
  files.sort((a, b) => a.name.localeCompare(b.name))
  const latest = files.reduce((newest, file) => (file.mtime > newest ? file.mtime : newest), '')
  return {
    dirs: stores.map((store) => store.dir),
    count: files.length,
    latest,
    files: files.slice(0, 200),
  }
}

function workspaceEntries(workspaces) {
  const entries = []
  for (const workspacePath of workspaces || []) {
    const rules = []
    for (const fileName of ['AGENTS.md', 'AGENTS.local.md']) {
      const file = path.join(workspacePath, fileName)
      const text = readText(file)
      if (text === null) continue
      rules.push({
        file: fileName,
        path: file,
        bytes: fileSize(file),
        sections: headings(text).slice(0, 12),
        realPath: realOf(file),
      })
    }
    const merged = mergeMemory(workspaceStores([workspacePath]))
    const memory = merged.length
      ? {
          count: merged[0].count,
          folded: merged[0].folded,
          dirs: merged[0].dirs,
          latest: merged[0].latest,
          files: merged[0].files,
        }
      : { count: 0, folded: 0, dirs: [], latest: '', files: [] }
    entries.push({
      name: path.basename(workspacePath) || workspacePath,
      path: workspacePath,
      rules,
      memory,
      team: readTeamState(workspacePath),
      handoff: readHandoff(workspacePath),
      projectMcp: readProjectMcp(workspacePath),
    })
  }
  // Workspaces with content first; otherwise alphabetical.
  entries.sort((a, b) => {
    const aFilled = a.rules.length > 0 || a.memory.count > 0
    const bFilled = b.rules.length > 0 || b.memory.count > 0
    if (aFilled !== bFilled) return aFilled ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return entries
}

function scan({ dshHome, profileName, profileDir, cwd, briefPath, workspaces, patchFiles, patchPath, extraSkillRoots, extraPatchFiles, profileInferred }) {
  const patch = patchPath || path.join(profileDir, 'cordis.patch.yml')
  const configWarnings = []
  const project = locateProject(cwd)
  const engines = installedEngines(profileDir)
  const globalMemory = readGlobalMemory(dshHome)
  const globalFile = path.join(dshHome, 'AGENTS.md')
  const globalText = readText(globalFile)

  const skills = []
  const skillRoots = []
  const scanRoot = (root, rank, label, meta) => {
    const { found, exists } = skillsIn(root, rank, label)
    skillRoots.push({ label, root, rank, exists, count: found.length, ...meta })
    for (const skill of found) skills.push({ ...skill, ...meta })
  }

  // Workspace skills come from every registered workspace, not only the guessed
  // current one: the registry is the only authority the Host has here.
  for (const workspacePath of workspaces || []) {
    const workspaceName = path.basename(workspacePath) || workspacePath
    const meta = { scope: 'workspace', workspace: workspaceName, workspacePath }
    scanRoot(path.join(workspacePath, '.dsh', 'skills'), 100, '项目 .dsh/skills', meta)
    scanRoot(path.join(workspacePath, '.agents', 'skills'), 200, '项目 .agents/skills', meta)
  }
  scanRoot(path.join(dshHome, 'skills'), 400, '用户 ~/.dsh/skills', { scope: 'global' })
  scanRoot(path.join(homedir(), '.agents', 'skills'), 500, '用户 ~/.agents/skills', { scope: 'global' })

  for (const raw of extraSkillRoots || []) {
    const root = expandHome(raw)
    if (!root) continue
    if (!isDirectory(root)) {
      configWarnings.push('extraSkillRoots 中的 ' + raw + ' 不存在')
      continue
    }
    const direct = path.join(root, 'SKILL.md')
    if (isFile(direct)) {
      const meta = frontmatter(readText(direct))
      skills.push({
        rank: 350,
        label: '自定义',
        scope: 'global',
        dir: path.basename(root),
        name: meta.name || path.basename(root),
        desc: capText(meta.description, 1000),
        bytes: fileSize(direct),
        path: direct,
      })
      skillRoots.push({ label: '自定义', root, rank: 350, exists: true, count: 1, scope: 'global' })
      continue
    }
    const { found, exists } = skillsIn(root, 350, '自定义')
    skillRoots.push({ label: '自定义', root, rank: 350, exists, count: found.length, scope: 'global' })
    for (const skill of found) skills.push({ ...skill, scope: 'global' })
  }
  skills.sort(
    (a, b) =>
      a.rank - b.rank ||
      String(a.workspace || '').localeCompare(String(b.workspace || '')) ||
      a.name.localeCompare(b.name),
  )

  for (const raw of extraPatchFiles || []) {
    const file = expandHome(raw)
    if (file && !isFile(file)) configWarnings.push('extraPatchFiles 中的 ' + raw + ' 不存在')
  }

  const { mcp, presets, registry } = scanPresetRows(patchFiles)

  const warnings = []
  if (!mcp.length) warnings.push('未识别到 dsh-mcp-client 行，可能是 DSH 版本变更')

  const globalRules = {
    path: globalFile,
    exists: globalText !== null,
    bytes: fileSize(globalFile),
    sections: globalText ? headings(globalText).slice(0, 12) : [],
  }
  const entries = workspaceEntries(workspaces)
  const briefContext = { skills, mcp, presets, registry, engines, globalRules }
  for (const entry of entries) entry.brief = buildBrief(entry, briefContext)
  const briefEntry = entries.find((entry) => entry.path === (briefPath || cwd)) || entries[0] || null

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: profileName,
      dir: profileDir,
      patch,
      patchExists: isFile(patch),
      inferred: Boolean(profileInferred),
    },
    workspace: {
      cwd,
      projectRoot: project.root,
      hasGit: project.hasGit,
    },
    globalRules,
    workspaces: entries,
    engines,
    globalMemory,
    brief: briefEntry ? briefEntry.brief : '',
    briefWorkspace: briefEntry ? briefEntry.name : '',
    skillRoots,
    skills,
    mcp,
    presets,
    registry,
    builtins: BUILTIN_PRESETS,
    warnings,
    configWarnings,
    config: {
      extraSkillRoots: extraSkillRoots || [],
      extraPatchFiles: extraPatchFiles || [],
    },
  }
}

export function apply(ctx, config) {
  const extraSkillRoots = config && Array.isArray(config.extraSkillRoots) ? config.extraSkillRoots : []
  const extraPatchFiles = config && Array.isArray(config.extraPatchFiles) ? config.extraPatchFiles : []
  const home = homedir()
  const dshHome = process.env.DSH_HOME || path.join(home, '.dsh')
  const envProfileName = process.env.DSH_PROFILE
  const envProfileDir = process.env.DSH_PROFILE_DIR
  let profileName
  let profileInferred = false
  if (envProfileName) profileName = envProfileName
  else if (envProfileDir) profileName = path.basename(envProfileDir)
  else {
    profileName = 'desktop'
    profileInferred = true
  }
  const profileDir = envProfileDir || path.join(dshHome, 'profiles', profileName)
  const globalPatch = path.join(dshHome, 'cordis.patch.yml')
  const profilePatch = path.join(profileDir, 'cordis.patch.yml')
  const patchFiles = [globalPatch, profilePatch, ...extraPatchFiles.map(expandHome)].filter((file) => isFile(file))

  const defaultCwd = () => {
    // Prefer the session with the most recent event (the one the user is
    // looking at); the registry alone often points at another workspace.
    try {
      const sessions = ctx.get('sessions')
      const list = sessions && typeof sessions.list === 'function' ? sessions.list() : []
      const candidates = list
        .map((session) => ({ session, header: session && session.header }))
        .filter(
          ({ header }) =>
            header &&
            typeof header.cwd === 'string' &&
            header.origin !== 'subagent' &&
            isDirectory(header.cwd),
        )
      const lastEventTime = ({ session, header }) => {
        try {
          const seq = Number(session.seq || 0)
          const event = seq > 0 ? session.eventAt(seq - 1) : null
          return event && typeof event.time === 'number' ? event.time : Number(header.createdAt || 0)
        } catch {
          return Number(header.createdAt || 0)
        }
      }
      candidates.sort((a, b) => lastEventTime(b) - lastEventTime(a))
      if (candidates.length) return candidates[0].header.cwd
    } catch {
      /* no session store in this composition */
    }
    try {
      const registry = ctx.get('workspaceRegistry')
      const list = registry && typeof registry.list === 'function' ? registry.list() : []
      const usable = list.filter((workspace) => workspace && typeof workspace.path === 'string' && isDirectory(workspace.path))
      usable.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      if (usable.length) return usable[0].path
    } catch {
      /* no workspace registry in this composition */
    }
    try {
      const workingDirectory = ctx.get('workingDirectory')
      if (workingDirectory && isDirectory(workingDirectory.defaultDirectory)) return workingDirectory.defaultDirectory
    } catch {
      /* no working-directory service in this composition */
    }
    return process.cwd()
  }

  const workspacePaths = () => {
    try {
      const registry = ctx.get('workspaceRegistry')
      const list = registry && typeof registry.list === 'function' ? registry.list() : []
      return list
        .filter((workspace) => workspace && typeof workspace.path === 'string' && isDirectory(workspace.path))
        .map((workspace) => workspace.path)
    } catch {
      return []
    }
  }

  const resolveWorkspace = (value) => {
    if (!value) return ''
    if (path.isAbsolute(value) && isDirectory(value)) return path.resolve(value)
    return (
      workspacePaths().find(
        (workspacePath) => path.basename(workspacePath).toLowerCase() === String(value).toLowerCase(),
      ) || ''
    )
  }

  const buildSnapshot = async (cwd, agent, workspacePath) => {
    const workspaces = workspacePaths()
    // A session may run in a subdirectory: attribute it to the registered
    // workspace that contains it; an unregistered cwd is inspected as its own.
    let briefPath = workspacePath || cwd
    if (workspacePath) {
      if (!workspaces.includes(workspacePath)) workspaces.push(workspacePath)
    } else {
      const owner = workspaces.find(
        (workspacePath) => cwd === workspacePath || cwd.startsWith(workspacePath.endsWith(path.sep) ? workspacePath : workspacePath + path.sep),
      )
      if (owner) briefPath = owner
      else if (cwd && !workspaces.includes(cwd)) workspaces.push(cwd)
    }
    const snapshot = scan({
      dshHome,
      profileName,
      profileDir,
      cwd,
      briefPath,
      workspaces,
      patchFiles,
      patchPath: profilePatch,
      extraSkillRoots,
      extraPatchFiles,
      profileInferred,
    })
    try {
      const effectiveAgent = agent || currentAgentFor(ctx, briefPath)
      const effective = await effectiveView(ctx, briefPath, effectiveAgent, snapshot.skills)
      if (effective) {
        snapshot.effective = effective
        const label = agent ? '当前会话' : effective.scope === 'catalog' ? '目录级' : '该工作区会话'
        const extra = effectiveSection(effective, label)
        if (extra) {
          snapshot.brief += extra
          const entry = snapshot.workspaces.find((item) => item.name === snapshot.briefWorkspace)
          if (entry) entry.brief += extra
        }
      }
    } catch (error) {
      snapshot.effectiveError = String((error && error.message) || error)
    }
    return snapshot
  }

  const readBody = (req, limit) =>
    new Promise((resolve, reject) => {
      let size = 0
      const chunks = []
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > limit) {
          reject(new Error('body too large'))
          req.destroy()
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', reject)
    })

  const handoffHandler = async (req, res) => {
    const send = (status, payload) => {
      res.statusCode = status
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(payload))
    }
    try {
      const host = String(req.headers.host || '')
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host)) return send(403, { ok: false, error: 'forbidden' })
      if (req.method !== 'POST') {
        res.setHeader('allow', 'POST')
        return send(405, { ok: false, error: 'method not allowed' })
      }
      const raw = await readBody(req, 24000)
      let body = {}
      try {
        body = JSON.parse(raw || '{}')
      } catch {
        return send(400, { ok: false, error: 'invalid json' })
      }
      const text = typeof body.text === 'string' ? body.text : ''
      if (text.length > 20000) return send(413, { ok: false, error: 'handoff too large' })
      const workspace = resolveWorkspace(body.workspace)
      if (!workspace) return send(400, { ok: false, error: 'workspace not found' })
      const target = path.join(workspace, '.dsh-mounts', 'handoff.md')
      const root = path.resolve(workspace) + path.sep
      if (!path.resolve(target).startsWith(root)) return send(400, { ok: false, error: 'invalid workspace' })
      mkdirSync(path.dirname(target), { recursive: true })
      const temp = target + '.tmp-' + process.pid
      try {
        writeFileSync(temp, text, 'utf8')
        renameSync(temp, target)
      } catch (error) {
        try {
          unlinkSync(temp)
        } catch {
          /* already gone */
        }
        throw error
      }
      return send(200, { ok: true, handoff: readHandoff(workspace) })
    } catch (error) {
      return send(500, { ok: false, error: String((error && error.message) || error) })
    }
  }

  const handler = async (req, res) => {
    try {
      // Loopback only: a rebound DNS name reaches this port with its own Host
      // header, so a non-loopback Host can never read the inventory.
      const host = String(req.headers.host || '')
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host)) {
        res.statusCode = 403
        res.end('forbidden')
        return
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end('method not allowed')
        return
      }
      const cwd = defaultCwd()
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
      const requestedWorkspace = String(requestUrl.searchParams.get('workspace') || '').trim()
      const selectedWorkspace = resolveWorkspace(requestedWorkspace)
      if (requestedWorkspace && !selectedWorkspace) {
        res.statusCode = 404
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(JSON.stringify({ ok: false, error: 'workspace not found', workspace: requestedWorkspace }))
        return
      }
      const body = JSON.stringify(await buildSnapshot(cwd, null, selectedWorkspace))
      res.statusCode = 200
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ ok: false, error: String((error && error.message) || error) }))
    }
  }

  ctx.effect(() => {
    const disposeApi = ctx.webServer.register({ kind: 'exact', path: ROUTE, handler })
    const disposeHandoff = ctx.webServer.register({ kind: 'exact', path: HANDOFF_ROUTE, handler: handoffHandler })
    return () => {
      disposeApi()
      disposeHandoff()
    }
  })

  // One handoff hint per new agent; subagents are skipped. `agent.inject`
  // expects a complete UserMessage, and omitting `role: 'user'` produces an
  // untyped message that breaks the first request (seen as TRANSPORT).
  const hintedAgents = new WeakSet()
  ctx.effect(() =>
    ctx.on('agent/created', ({ agent }) => {
      try {
        if (!agent || hintedAgents.has(agent)) return
        const header = agent.session && agent.session.header
        const cwd = header && header.cwd
        if (!cwd || header.origin === 'subagent') return
        const handoff = readHandoff(cwd)
        if (!handoff || !handoff.bytes) return
        const days = handoffAgeDays(handoff.mtime)
        const stale = days >= 7 ? '⚠ 交接已 ' + days + ' 天未更新；' : ''
        const meta = handoff.mtime ? localDateTime(new Date(handoff.mtime)) : ''
        const preview = handoff.preview
          ? '；摘要：' + capText(handoff.preview, 80).replace(/[。！？!?]+$/, '')
          : ''
        hintedAgents.add(agent)
        const result = agent.inject({
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '[dsh-mounts] ' +
                stale +
                '项目交接：' +
                handoff.path +
                (meta ? '（' + meta + '）' : '') +
                preview +
                '。开工前先 read 它；这里只是创建时快照，不是交接正文。',
            },
          ],
          source: { kind: 'dsh-mounts' },
        })
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch {
        /* a hint must never block agent creation */
      }
    }),
  )

  // One read-only tool. Without it the model never learns that a workspace has
  // memory banks, where they live, or what this project mounts. The schema is
  // deliberately small; there is no write path.
  let tools = null
  try {
    tools = ctx.get('tools')
  } catch {
    tools = null
  }
  if (tools && typeof tools.register === 'function') {
    ctx.effect(() => {
      try {
        return tools.register({
          name: 'project_context',
          description: '查看项目挂载与最近交接。新会话、接手项目或开工前先调用；只读。',
          parameters: {
            workspace: {
              type: 'string',
              description: '工作区名称或绝对路径；省略时使用当前会话的工作目录。',
            },
          },
          output: {
            schema: { type: 'object', additionalProperties: true },
            render: (_args, value) => [{ type: 'text', text: String((value && value.text) || '') }],
          },
          async execute(args, exec) {
            const requested = args && typeof args.workspace === 'string' ? args.workspace.trim() : ''
            let cwd = ''
            try {
              cwd =
                (exec &&
                  exec.agent &&
                  exec.agent.session &&
                  exec.agent.session.header &&
                  exec.agent.session.header.cwd) ||
                ''
            } catch {
              cwd = ''
            }
            if (requested) {
              const resolved = resolveWorkspace(requested)
              if (!resolved) {
                return {
                  text:
                    '# 项目上下文简报\n\n- 未找到工作区：' +
                    requested +
                    '\n- 当前工作区：' +
                    (cwd || defaultCwd()) +
                    '\n\n请检查名称或绝对路径；未回退到其他工作区。',
                  workspace: null,
                }
              }
              cwd = resolved
            }
            if (!cwd || !isDirectory(cwd)) cwd = defaultCwd()
            let agent = exec && exec.agent
            try {
              const agentCwd = agent && agent.session && agent.session.header && agent.session.header.cwd
              if (agentCwd && cwd && !(agentCwd === cwd || agentCwd.startsWith(cwd + path.sep))) agent = null
            } catch {
              agent = null
            }
            const snapshot = await buildSnapshot(cwd, agent)
            return {
              text: snapshot.brief || '# 项目上下文简报\n\n- 工作区：' + cwd + '\n- 未发现记忆库或规则文件。',
              workspace: cwd,
            }
          },
        })
      } catch {
        return () => {}
      }
    })
  }
}
