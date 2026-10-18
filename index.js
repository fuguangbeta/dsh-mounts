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
 * It never writes a file, never spawns a process, and never reaches a network.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
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
      memoryRoots: z.array(z.string()).default([]),
      extraSkillRoots: z.array(z.string()).default([]),
      extraPatchFiles: z.array(z.string()).default([]),
    })
  : undefined

/** The Web server owns the route table; stay inactive where it is absent. */
export const inject = ['webServer']

export const name = 'dsh-mounts'

const ROUTE = '/dsh-mounts/api'
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

function scan({ dshHome, profileName, profileDir, cwd, memoryRoots, workspaces, patchFiles, patchPath, extraSkillRoots, extraPatchFiles, profileInferred }) {
  const patch = patchPath || path.join(profileDir, 'cordis.patch.yml')
  const configWarnings = []
  const project = locateProject(cwd)
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
    globalRules: {
      path: globalFile,
      exists: globalText !== null,
      bytes: fileSize(globalFile),
      sections: globalText ? headings(globalText).slice(0, 12) : [],
    },
    workspaces: workspaceEntries(workspaces),
    skillRoots,
    skills,
    mcp,
    presets,
    registry,
    builtins: BUILTIN_PRESETS,
    warnings,
    configWarnings,
    config: {
      memoryRoots: memoryRoots || [],
      extraSkillRoots: extraSkillRoots || [],
      extraPatchFiles: extraPatchFiles || [],
    },
  }
}

export function apply(ctx, config) {
  const memoryRoots = config && Array.isArray(config.memoryRoots) ? config.memoryRoots : []
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

  const handler = (req, res) => {
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
      const body = JSON.stringify(
        scan({
          dshHome,
          profileName,
          profileDir,
          cwd,
          memoryRoots,
          workspaces: workspacePaths(),
          patchFiles,
          patchPath: profilePatch,
          extraSkillRoots,
          extraPatchFiles,
          profileInferred,
        }),
      )
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

  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: ROUTE, handler }))
}
