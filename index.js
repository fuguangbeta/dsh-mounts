/**
 * dsh-mounts — Host half.
 *
 * Read-only inventory of what this DSH profile actually mounts: the memory
 * chain (global + project AGENTS.md files), the skills found in the four
 * scan roots, the `dsh-mcp-client` rows of the profile patch, and the Agent
 * Presets that patch declares. The scan is pure Node `fs` reading; the only
 * thing this plugin serves is its own JSON snapshot to its own panel.
 *
 * It never writes a file, never spawns a process, and never reaches a network.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

/** The Web server owns the route table; stay inactive where it is absent. */
export const inject = ['webServer']

export const name = 'dsh-mounts'

const ROUTE = '/dsh-mounts/api'
const RULE_FILES = ['AGENTS.md', 'CLAUDE.md', 'AGENTS.local.md', 'CLAUDE.local.md']
const MCP_PACKAGE = '@deepseek-ai/dsh-mcp-client'
const PRESET_PACKAGE = '@deepseek-ai/dsh-agent-preset'

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
      desc: capText(meta.description, 400),
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

function memoryChain(project, cwd) {
  const sequence = []
  let dir = path.resolve(cwd)
  sequence.push(dir)
  while (dir.toLowerCase() !== project.toLowerCase()) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
    sequence.push(dir)
  }
  const out = []
  for (const base of sequence.reverse()) {
    for (const fileName of RULE_FILES) {
      const file = path.join(base, fileName)
      if (!isFile(file)) continue
      out.push({
        path: file,
        rel: path.relative(project, file) || fileName,
        bytes: fileSize(file),
        sections: headings(readText(file) || '').slice(0, 12),
      })
    }
  }
  return out
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
    return { id, block: lines.slice(start + 1, end).join('\n') }
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

function scanPresetRows(patchFile) {
  const mcp = []
  const presets = []
  let registry = { default: null, selectedDefault: null }
  for (const { id, block } of patchRows(patchFile)) {
    if (rowOf(block, MCP_PACKAGE)) {
      mcp.push({
        row: id,
        server: grab(block, 'serverName'),
        transport: grab(block, 'transport'),
        target: grab(block, 'url') || grab(block, 'command'),
        env: [...block.matchAll(/^\s+([A-Z_][A-Z0-9_]*):/gm)].map((match) => match[1]),
      })
    } else if (rowOf(block, PRESET_PACKAGE)) {
      const config = configBlock(block)
      const presetId = /^\s*id:\s*(\S+)\s*$/m.exec(config)
      const title = /^\s*name:\s*(.+?)\s*$/m.exec(config)
      presets.push({
        row: id,
        id: presetId ? presetId[1] : '?',
        title: title ? unquote(title[1]) : '',
        mcp: block.split('dsh-mcp-client').length - 1,
      })
    } else if (firstLine(block).includes('dsh-agent-preset-registry')) {
      const preset = (name) => {
        const match = new RegExp('^\\s*' + name + ':\\s*(\\S+)\\s*$', 'm').exec(block)
        return match ? match[1] : null
      }
      registry = { default: preset('default'), selectedDefault: preset('selectedDefault') }
    }
  }
  return { mcp, presets, registry }
}

/**
 * Independent memory stores under `<home>/.zcode/cli/memories/projects/*\/memory`.
 * One directory is one store: its `.md` files up to 200, stat only, never content.
 * Stores sort by file count descending, then name ascending.
 */
function memoryStores() {
  const root = path.join(homedir(), '.zcode', 'cli', 'memories', 'projects')
  if (!isDirectory(root)) return []
  let entries
  try {
    entries = readdirSync(root)
  } catch {
    return []
  }
  const stores = []
  for (const name of entries) {
    const dir = path.join(root, name, 'memory')
    if (!isDirectory(dir)) continue
    let files
    try {
      files = readdirSync(dir)
    } catch {
      continue
    }
    const items = []
    for (const file of files) {
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
    const latest = items.reduce((newest, item) => (item.mtime > newest ? item.mtime : newest), '')
    stores.push({ name, dir, count: items.length, latest, files: items })
  }
  stores.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  return stores
}

function scan({ dshHome, profileName, profileDir, cwd }) {
  const patch = path.join(profileDir, 'cordis.patch.yml')
  const project = locateProject(cwd)
  const globalFile = path.join(dshHome, 'AGENTS.md')
  const globalText = readText(globalFile)

  const skills = []
  const skillRoots = []
  for (const [root, rank, label] of [
    [path.join(project.root, '.dsh', 'skills'), 100, '项目 .dsh/skills'],
    [path.join(project.root, '.agents', 'skills'), 200, '项目 .agents/skills'],
    [path.join(dshHome, 'skills'), 400, '用户 ~/.dsh/skills'],
    [path.join(homedir(), '.agents', 'skills'), 500, '用户 ~/.agents/skills'],
  ]) {
    const { found, exists } = skillsIn(root, rank, label)
    skillRoots.push({ label, root, rank, exists, count: found.length })
    skills.push(...found)
  }
  skills.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))

  const { mcp, presets, registry } = scanPresetRows(patch)

  return {
    generatedAt: new Date().toISOString(),
    profile: { name: profileName, dir: profileDir, patch, patchExists: isFile(patch) },
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
    chain: memoryChain(project.root, cwd),
    memory: memoryStores(),
    skillRoots,
    skills,
    mcp,
    presets,
    registry,
  }
}

export function apply(ctx) {
  const home = homedir()
  const dshHome = process.env.DSH_HOME || path.join(home, '.dsh')
  const profileName = process.env.DSH_PROFILE || 'desktop'
  const profileDir = process.env.DSH_PROFILE_DIR || path.join(dshHome, 'profiles', profileName)

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
      const body = JSON.stringify(scan({ dshHome, profileName, profileDir, cwd }))
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
