/**
 * dsh-mounts — Client half.
 *
 * One read-only page, four flat lists. Every block collapses from its title;
 * rows are two-line cards (name + one secondary line) and never expand.
 * The panel only reads the JSON snapshot its Host half serves; it writes
 * nothing, starts no process and reaches no other origin.
 */
window.__ModuleLoader__.load({
  id: 'dsh-mounts',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'mounts'
    const API = '/dsh-mounts/api'

    const ZN = {
      'panel.title': '挂载清单',
      'panel.subtitle': '这个 profile 实际挂载了什么：预规定、记忆库、技能、MCP 与 Agent Preset。',
      'panel.readonly': '只读',
      'panel.refresh': '刷新',
      'panel.loading': '读取中…',
      'panel.error': '读取失败',
      'panel.retry': '重试',
      'meta.workspace': '工作区',
      'meta.project': '项目根',
      'meta.workspaceIsProject': '工作区 = 项目根',
      'meta.patch': '补丁',
      'meta.inferred': '（推断）',
      'meta.git': '含 .git',
      'meta.noGit': '无 .git',
      'section.rules': '预规定',
      'section.memory': '记忆库',
      'section.skills': '技能',
      'section.mcp': 'MCP 服务器',
      'section.presets': '智能体预设',
      'label.sections': '节',
      'memory.workspaces': '%s 个工作区 · %s 个文件',
      'memory.noRules': '无规则文件',
      'memory.noMemory': '无记忆文件',
      'detail.open': '打开',
      'detail.path': '路径',
      'detail.sections': '章节',
      'detail.desc': '描述',
      'detail.source': '来源',
      'detail.row': '补丁行',
      'detail.title': '标题',
      'detail.target': '目标',
      'detail.env': 'env',
      'detail.copy': '复制路径',
      'detail.copied': '已复制到剪贴板',
      'detail.copyFailed': '复制失败：浏览器没有授予剪贴板权限',
      'detail.openFailed': '打开失败：系统默认程序没有接受这个文件',
      'rules.empty': '未找到全局 AGENTS.md。',
      'rules.inject': '注入',
      'memory.empty': '未发现记忆库。',
      'memory.emptyHint': '把记忆文件放在工作区的 memory/ 目录（<工作区>/memory、.dsh/memory、.agents/memory）。',
      'skills.global': '全局技能',
      'skills.workspace': '工作区技能',
      'skills.globalEmpty': '未发现全局技能。',
      'skills.workspaceEmpty': '未发现工作区技能。',
      'mcp.empty': '未发现 MCP 服务器行。',
      'preset.empty': '未发现预设。',
      'preset.builtinRow': '内置 preset（来自 bundle，不可展开）',
      'common.generated': '生成于',
    }

    const EN = {
      'panel.title': 'Mounts',
      'panel.subtitle': 'What this profile actually mounts: rules, memory libraries, skills, MCP servers, and Agent Presets.',
      'panel.readonly': 'Read-only',
      'panel.refresh': 'Refresh',
      'panel.loading': 'Reading…',
      'panel.error': 'Failed to read',
      'panel.retry': 'Retry',
      'meta.workspace': 'Workspace',
      'meta.project': 'Project',
      'meta.workspaceIsProject': 'Workspace = Project',
      'meta.patch': 'Patch',
      'meta.inferred': '(inferred)',
      'meta.git': 'has .git',
      'meta.noGit': 'no .git',
      'section.rules': 'Instructions',
      'section.memory': 'Memory stores',
      'section.skills': 'Skills',
      'section.mcp': 'MCP servers',
      'section.presets': 'Agent Presets',
      'label.sections': 'sections',
      'memory.workspaces': '%s workspaces · %s files',
      'memory.noRules': 'No instruction files',
      'memory.noMemory': 'No memory files',
      'detail.open': 'Open',
      'detail.path': 'Path',
      'detail.sections': 'Sections',
      'detail.desc': 'Description',
      'detail.source': 'Source',
      'detail.row': 'Patch row',
      'detail.title': 'Title',
      'detail.target': 'Target',
      'detail.env': 'env',
      'detail.copy': 'Copy path',
      'detail.copied': 'Copied to clipboard',
      'detail.copyFailed': 'Copy failed: the browser denied clipboard access',
      'detail.openFailed': 'Open failed: the default application did not accept this file',
      'rules.empty': 'No global AGENTS.md found.',
      'rules.inject': 'Injected',
      'memory.empty': 'No memory stores found.',
      'memory.emptyHint': 'Put memory files in a workspace memory/ directory (<ws>/memory, .dsh/memory, .agents/memory).',
      'skills.global': 'Global skills',
      'skills.workspace': 'Workspace skills',
      'skills.globalEmpty': 'No global skills found.',
      'skills.workspaceEmpty': 'No workspace skills found.',
      'mcp.empty': 'No MCP server rows found.',
      'preset.empty': 'No presets found.',
      'preset.builtinRow': 'Built-in preset (from the bundle, not expandable)',
      'common.generated': 'Generated',
    }

    const CSS = `
.dmp-root{height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);}
.dmp-inner{max-width:1020px;margin:0 auto;padding:30px 34px 76px;}
.dmp-head{display:flex;align-items:flex-start;gap:16px;}
.dmp-title{font-size:20px;font-weight:600;letter-spacing:.01em;}
.dmp-sub{margin-top:6px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.dmp-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none;}
.dmp-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.dmp-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary);}
.dmp-chip.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary);}
.dmp-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;font-size:12px;line-height:18px;cursor:pointer;font-family:inherit;}
.dmp-btn:hover{border-color:var(--dsw-alias-border-l2);}
.dmp-btn:disabled{opacity:.55;cursor:default;}
.dmp-meta{display:flex;align-items:baseline;gap:20px;margin-top:16px;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;}
.dmp-meta-item{display:flex;align-items:baseline;gap:6px;min-width:0;}
.dmp-meta-key{flex:none;}
.dmp-meta-value{min-width:0;overflow:hidden;text-overflow:ellipsis;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-primary);}
.dmp-block{margin-top:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;}
.dmp-block-head{display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dmp-block-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-block-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-arrow{flex:none;width:12px;font-size:11px;color:var(--dsw-alias-label-secondary);}
.dmp-block-title{font-size:13.5px;font-weight:600;}
.dmp-block-count{margin-left:auto;font-size:12.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.dmp-block-body{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-group{display:flex;align-items:baseline;gap:6px;padding:10px 16px 4px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.dmp-group b{font-weight:500;color:var(--dsw-alias-label-primary);}
.dmp-group-meta{font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmp-mem-head{display:flex;align-items:baseline;gap:6px;width:100%;padding:9px 16px;background:none;border:0;color:inherit;font:inherit;font-size:11.5px;text-align:left;cursor:pointer;color:var(--dsw-alias-label-secondary);}
.dmp-mem-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-mem-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-mem-head b{font-weight:500;color:var(--dsw-alias-label-primary);}
.dmp-mem-count{font-variant-numeric:tabular-nums;}
.dmp-mem-latest{margin-left:auto;font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmp-mem-body{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-file{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:12px;padding:3px 16px 3px 40px;font-size:11.5px;line-height:1.6;}
.dmp-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);}
.dmp-file-meta{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.dmp-open-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:6px;padding:0 8px;font-size:11px;line-height:18px;cursor:pointer;font-family:inherit;white-space:nowrap;}
.dmp-open-btn:hover{border-color:var(--dsw-alias-border-l2);}
.dmp-open-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-open-notice{padding:8px 16px;font-size:11.5px;color:var(--dsw-alias-state-success-primary);}
.dmp-open-error{padding:8px 16px;font-size:11.5px;color:var(--dsw-alias-state-error-primary);}
.dmp-item{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-item:first-child{border-top:0;}
.dmp-item.static{display:flex;align-items:center;gap:14px;padding:10px 16px;}
.dmp-item.expandable{display:block;}
.dmp-row-head{display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:10px 16px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dmp-row-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-row-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-row-body{padding:2px 16px 12px 40px;font-size:11.5px;line-height:1.7;color:var(--dsw-alias-label-secondary);}
.dmp-detail-line{display:flex;gap:8px;min-width:0;}
.dmp-detail-label{flex:none;opacity:.8;}
.dmp-detail-value{min-width:0;word-break:break-word;color:var(--dsw-alias-label-secondary);}
.dmp-item-text{flex:1;min-width:0;}
.dmp-line1{display:flex;align-items:baseline;gap:8px;min-width:0;}
.dmp-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-secondary{margin-top:2px;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-item-meta{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right;max-width:220px;overflow:hidden;text-overflow:ellipsis;}
.dmp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
.dmp-empty{padding:12px 16px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.dmp-empty-hint{margin-top:2px;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary);}
.dmp-rule-row{width:100%;background:none;border:0;font:inherit;font-size:11.5px;text-align:left;cursor:pointer;color:inherit;}
.dmp-rule-section{padding:2px 16px 2px 34px;font-size:11px;color:var(--dsw-alias-label-secondary);}
.dmp-warning{padding:8px 16px;font-size:11px;line-height:1.6;color:var(--dsw-alias-state-warn-primary);border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-foot{margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
`

    function dictFor(active) {
      return String(active || '').toLowerCase().startsWith('zh') ? ZN : EN
    }

    function bytes(value) {
      const size = Number(value) || 0
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
      return (size / 1024 / 1024).toFixed(1) + ' MB'
    }

    function shortTime(iso) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      return (
        String(date.getHours()).padStart(2, '0') +
        ':' +
        String(date.getMinutes()).padStart(2, '0') +
        ':' +
        String(date.getSeconds()).padStart(2, '0')
      )
    }

    function joinPath(dir, name) {
      return String(dir || '').replace(/[\\/]+$/, '') + '\\' + name
    }

    function Chip(props) {
      return h('span', { className: 'dmp-chip' + (props.tone ? ' ' + props.tone : '') }, props.children)
    }

    function Block(props) {
      const panelId = 'dmp-panel-' + props.id
      return h(
        'section',
        { className: 'dmp-block' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-block-head',
            'aria-expanded': props.open,
            'aria-controls': panelId,
            onClick: props.onToggle,
          },
          h('span', { className: 'dmp-arrow', 'aria-hidden': true }, props.open ? '▾' : '▸'),
          h('span', { className: 'dmp-block-title' }, props.title),
          h('span', { className: 'dmp-block-count' }, String(props.count)),
        ),
        h('div', { id: panelId, className: 'dmp-block-body', hidden: !props.open }, props.children),
      )
    }

    function detailLines(lines) {
      return lines.map((line, index) =>
        h(
          'div',
          { className: 'dmp-detail-line', key: index },
          h('span', { className: 'dmp-detail-label' }, line[0]),
          h('span', { className: 'dmp-detail-value' }, line[1]),
        ),
      )
    }

    function Row(props) {
      const text = h(
        'div',
        { className: 'dmp-item-text' },
        h(
          'div',
          { className: 'dmp-line1' },
          h('span', { className: 'dmp-name' + (props.mono ? ' dmp-mono' : ''), title: props.name }, props.name),
          props.tag || null,
        ),
        h('div', { className: 'dmp-secondary', title: props.secondary }, props.secondary || '—'),
      )
      const meta = props.meta
        ? h('div', { className: 'dmp-item-meta', title: String(props.metaTitle || props.meta) }, props.meta)
        : null

      if (!props.expandable) {
        return h('div', { className: 'dmp-item static' }, text, meta)
      }

      const bodyId = 'dmp-row-' + props.id
      return h(
        'div',
        { className: 'dmp-item expandable' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-row-head',
            'aria-expanded': Boolean(props.open),
            'aria-controls': bodyId,
            onClick: props.onToggle,
          },
          h('span', { className: 'dmp-arrow', 'aria-hidden': true }, props.open ? '▾' : '▸'),
          text,
          meta,
        ),
        h('div', { id: bodyId, className: 'dmp-row-body', hidden: !props.open }, props.detail),
      )
    }

    function useInventory() {
      const [state, setState] = React.useState({ status: 'loading', data: null, error: null })
      const load = React.useCallback(() => {
        let live = true
        setState({ status: 'loading', data: null, error: null })
        fetch(API, { headers: { accept: 'application/json' }, cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error('HTTP ' + response.status)
            return response.json()
          })
          .then((data) => {
            if (live) setState({ status: 'ready', data, error: null })
          })
          .catch((error) => {
            if (live) setState({ status: 'error', data: null, error: String((error && error.message) || error) })
          })
        return () => {
          live = false
        }
      }, [])
      React.useEffect(load, [load])
      return { ...state, reload: load }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const dicts = { zh: ZN, en: EN }
        for (const locale of ['zh', 'en']) {
          try {
            ctx.locale.register(NS, locale, dicts[locale])
          } catch {
            /* an already-registered dictionary owns this namespace; keep rendering */
          }
        }

        const translate = (key) => dictFor(ctx.locale.getLocale().active)[key] || key

        // "Open on the Host desktop" belongs to DSH's own Session Remote. The
        // declared-service posture is an inject list: the callback fires once
        // those services exist, so nothing touches an unready proxy at apply
        // time (that mistake once cost the sidebar).
        // A raw `connection.rpc` call is the same fallback dsh-context uses.
        let sessionRemote = null
        try {
          ctx.inject(['remote', 'remote.session'], (inner) => {
            try {
              const session = inner.remote && inner.remote.session
              if (session && typeof session.openWorkspacePath === 'function') sessionRemote = session
            } catch {
              sessionRemote = null
            }
            return () => {
              sessionRemote = null
            }
          })
        } catch {
          sessionRemote = null
        }

        // Configuration writes are intentionally absent: DSH settings cannot
        // persist config into a row that a bundle inserts via `include` (the
        // mutate is accepted and silently dropped), so a settings UI here would
        // lie. The Host still reads config for installers that edit this
        // bundle's own cordis.patch.yml.

        const remoteSession = () => {
          try {
            const session = sessionRemote || (ctx.get('remote') || ctx.remote || {}).session
            return session && typeof session.openWorkspacePath === 'function' ? session : null
          } catch {
            return null
          }
        }

        const connectionRpc = () => {
          try {
            const connection = typeof ctx.get === 'function' ? ctx.get('connection') : null
            if (!connection || connection.isLoopback !== true) return null
            const rpc = connection.rpc
            return rpc && typeof rpc.call === 'function' ? rpc : null
          } catch {
            return null
          }
        }

        const openOnHost = (target) => {
          const session = remoteSession()
          if (session) {
            try {
              return Promise.resolve(session.openWorkspacePath({ path: target }, new AbortController().signal))
            } catch (error) {
              return Promise.reject(error)
            }
          }
          const rpc = connectionRpc()
          if (rpc) {
            try {
              return Promise.resolve(rpc.call('/api', 'session/openWorkspacePath', { args: { request: { path: target } } }))
            } catch (error) {
              return Promise.reject(error)
            }
          }
          return Promise.reject(new Error('no opener'))
        }

        function useTranslate() {
          const [revision, bump] = React.useState(0)
          React.useEffect(() => ctx.locale.subscribe(() => bump((value) => value + 1)), [])
          return React.useMemo(() => translate, [revision])
        }

        function MountsIcon(props) {
          const size = (props && props.size) || 20
          const color = props && props.active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)'
          return h(
            'svg',
            {
              width: size,
              height: size,
              viewBox: '0 0 24 24',
              fill: 'none',
              'aria-hidden': true,
              style: { display: 'block', color },
            },
            h('rect', { x: 3, y: 4.4, width: 18, height: 4.3, rx: 1.7, fill: 'currentColor' }),
            h('rect', { x: 3, y: 10.2, width: 18, height: 4.3, rx: 1.7, fill: 'currentColor', opacity: 0.66 }),
            h('rect', { x: 3, y: 16, width: 18, height: 4.3, rx: 1.7, fill: 'currentColor', opacity: 0.4 }),
          )
        }

        function MountsPage() {
          const t = useTranslate()
          const inventory = useInventory()
          const [openBlocks, setOpenBlocks] = React.useState({})
          const [openMemoryWorkspaces, setOpenMemoryWorkspaces] = React.useState({})
          const [openRows, setOpenRows] = React.useState({})
          const [openSkillsScope, setOpenSkillsScope] = React.useState({})
          const [openSkillWorkspaces, setOpenSkillWorkspaces] = React.useState({})
          const [notice, setNotice] = React.useState(null)
          const [openError, setOpenError] = React.useState(null)
          const [canOpen, setCanOpen] = React.useState(false)
          const data = inventory.data

          // Detect the opener after mount, never during apply: touching the Remote
          // before the client services settle used to abort the whole plugin.
          React.useEffect(() => {
            let live = true
            const check = () => {
              if (!live) return
              if (remoteSession() || connectionRpc()) setCanOpen(true)
            }
            check()
            const timer = setTimeout(check, 600)
            const later = setTimeout(check, 2500)
            const last = setTimeout(check, 5000)
            return () => {
              live = false
              clearTimeout(timer)
              clearTimeout(later)
              clearTimeout(last)
            }
          }, [])

          const toggleBlock = (id) => setOpenBlocks((previous) => ({ ...previous, [id]: !previous[id] }))
          const toggleMemoryWorkspace = (name) =>
            setOpenMemoryWorkspaces((previous) => ({ ...previous, [name]: !previous[name] }))
          const toggleRow = (id) => setOpenRows((previous) => ({ ...previous, [id]: !previous[id] }))
          const toggleSkillsScope = (key) =>
            setOpenSkillsScope((previous) => ({ ...previous, [key]: !previous[key] }))
          const toggleSkillWorkspace = (name) =>
            setOpenSkillWorkspaces((previous) => ({ ...previous, [name]: !previous[name] }))

          const copyPath = (target) => {
            setOpenError(null)
            setNotice(null)
            try {
              const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null
              if (clipboard && typeof clipboard.writeText === 'function') {
                clipboard.writeText(target).then(
                  () => setNotice(t('detail.copied')),
                  () => setOpenError(t('detail.copyFailed')),
                )
                return
              }
            } catch {
              /* clipboard unavailable */
            }
            setOpenError(t('detail.copyFailed'))
          }

          const openFile = (target) => {
            setOpenError(null)
            setNotice(null)
            if (!canOpen) {
              copyPath(target)
              return
            }
            openOnHost(target).then(
              () => {},
              () => setOpenError(t('detail.openFailed')),
            )
          }

          let body = null

          if (inventory.status === 'error') {
            body = h(
              'div',
              { className: 'dmp-block' },
              h(
                'div',
                { className: 'dmp-empty' },
                t('panel.error') + '：' + inventory.error + ' ',
                h('button', { className: 'dmp-btn', type: 'button', onClick: inventory.reload }, t('panel.retry')),
              ),
            )
          } else if (!data) {
            body = h('div', { className: 'dmp-empty' }, t('panel.loading'))
          } else {
            const globalRules = data.globalRules || {}
            const workspaces = data.workspaces || []
            const skills = data.skills || []
            const servers = data.mcp || []
            const presets = data.presets || []
            const warnings = Array.isArray(data.warnings) ? data.warnings : []
            const configWarnings = Array.isArray(data.configWarnings) ? data.configWarnings : []
            const warningsFor = (prefix) => configWarnings.filter((warning) => String(warning).includes(prefix))
            const warningLines = (list, keyPrefix) =>
              list.map((warning, index) => h('div', { className: 'dmp-warning', key: keyPrefix + index }, warning))
            const filledWorkspaces = workspaces.filter(
              (entry) => (entry.rules || []).length > 0 || ((entry.memory && entry.memory.count) || 0) > 0,
            )
            const totalFiles = filledWorkspaces.reduce(
              (sum, entry) => sum + (entry.rules || []).length + ((entry.memory && entry.memory.count) || 0),
              0,
            )
            const workspace = data.workspace || {}
            const profile = data.profile || {}

            const home = String(globalRules.path || '')
              .replace(/[\\/]\.dsh[\\/]AGENTS\.md$/i, '')
              .replace(/\\/g, '/')
            const short = (value) => {
              const text = String(value || '').replace(/\\/g, '/')
              return home && text.toLowerCase().startsWith(home.toLowerCase()) ? '~' + text.slice(home.length) : text
            }

            const sectionMeta = (entry) =>
              bytes(entry.bytes) + ' · ' + (entry.sections || []).length + ' ' + t('label.sections')

            const ruleRows = []
            if (globalRules.exists) {
              ruleRows.push(
                h(Row, {
                  key: 'global',
                  id: 'rule-global',
                  name: short(globalRules.path),
                  secondary: sectionMeta(globalRules),
                  mono: true,
                  expandable: true,
                  open: Boolean(openRows['rule-global']),
                  onToggle: () => toggleRow('rule-global'),
                  detail: [
                    ...detailLines([[t('detail.path'), globalRules.path]]),
                    h(
                      'div',
                      { className: 'dmp-detail-line', key: 'sections' },
                      h('span', { className: 'dmp-detail-label' }, t('detail.sections')),
                      h(
                        'span',
                        { className: 'dmp-detail-value' },
                        (globalRules.sections || []).length
                          ? globalRules.sections.map((section, index) => h('div', { key: index }, section))
                          : '—',
                      ),
                    ),
                  ],
                }),
              )
            }

            const globalSkills = skills.filter((skill) => skill.scope === 'global')
            const workspaceSkills = skills.filter((skill) => skill.scope === 'workspace')
            const workspaceGroups = []
            const workspaceIndex = new Map()
            for (const skill of workspaceSkills) {
              const key = skill.workspace || '—'
              let group = workspaceIndex.get(key)
              if (!group) {
                group = { name: key, path: skill.workspacePath || '', skills: [] }
                workspaceIndex.set(key, group)
                workspaceGroups.push(group)
              }
              group.skills.push(skill)
            }
            workspaceGroups.sort((a, b) => a.name.localeCompare(b.name))
            const skillIndex = new Map(skills.map((skill, index) => [skill.path, index]))
            const skillRow = (skill) =>
              h(Row, {
                key: skill.path,
                id: 'skill-' + skillIndex.get(skill.path),
                name: skill.name,
                secondary: skill.desc || '—',
                meta: bytes(skill.bytes),
              })
            const skillSectionHead = (key, label, open, bodyId) =>
              h(
                'button',
                {
                  type: 'button',
                  className: 'dmp-mem-head',
                  'aria-expanded': open,
                  'aria-controls': bodyId,
                  onClick: () => toggleSkillsScope(key),
                },
                h('span', { className: 'dmp-arrow', 'aria-hidden': true }, open ? '▾' : '▸'),
                h('b', null, label),
              )
            const skillSectionBody = (bodyId, open, children) =>
              h('div', { id: bodyId, className: 'dmp-mem-body', hidden: !open }, children)

            const workspaceNodes = workspaceGroups.map((group) => {
              const open = Boolean(openSkillWorkspaces[group.name])
              const bodyId = 'dmp-skill-ws-' + group.name
              return h(
                'div',
                { key: group.name },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dmp-mem-head',
                    title: group.path,
                    'aria-expanded': open,
                    'aria-controls': bodyId,
                    onClick: () => toggleSkillWorkspace(group.name),
                  },
                  h('span', { className: 'dmp-arrow', 'aria-hidden': true }, open ? '▾' : '▸'),
                  h('b', null, group.name),
                  h('span', { className: 'dmp-mem-count' }, ' (' + group.skills.length + ')'),
                ),
                h('div', { id: bodyId, className: 'dmp-mem-body', hidden: !open }, group.skills.map(skillRow)),
              )
            })

            const globalOpen = Boolean(openSkillsScope.global)
            const workspaceOpen = Boolean(openSkillsScope.workspace)
            const skillNodes = h(
              React.Fragment,
              null,
              h(
                'div',
                { key: 'global' },
                skillSectionHead(
                  'global',
                  t('skills.global') + ' (' + globalSkills.length + ')',
                  globalOpen,
                  'dmp-skills-global',
                ),
                skillSectionBody(
                  'dmp-skills-global',
                  globalOpen,
                  globalSkills.length
                    ? globalSkills.map(skillRow)
                    : h('div', { className: 'dmp-empty' }, t('skills.globalEmpty')),
                ),
              ),
              h(
                'div',
                { key: 'workspace' },
                skillSectionHead(
                  'workspace',
                  t('skills.workspace') + ' (' + workspaceSkills.length + ')',
                  workspaceOpen,
                  'dmp-skills-workspace',
                ),
                skillSectionBody(
                  'dmp-skills-workspace',
                  workspaceOpen,
                  workspaceGroups.length
                    ? workspaceNodes
                    : h('div', { className: 'dmp-empty' }, t('skills.workspaceEmpty')),
                ),
              ),
            )

            const mcpRows = servers.map((server, index) => {
              const rowId = 'mcp-' + index
              return h(Row, {
                key: server.row,
                id: rowId,
                name: (server.server || server.row) + ' · ' + (server.transport || '?'),
                secondary: server.target || '—',
                meta: server.presetId || '',
                expandable: true,
                open: Boolean(openRows[rowId]),
                onToggle: () => toggleRow(rowId),
                detail: detailLines([
                  [t('detail.row'), server.row],
                  [t('detail.env'), (server.env || []).join('、') || '—'],
                  [t('detail.target'), server.target || '—'],
                ]),
              })
            })

            // Built-in presets ship with the bundle and are not in the profile
            // patch. Keep the hard-coded list in its fixed order.
            const BUILTIN_PRESETS =
              Array.isArray(data.builtins) && data.builtins.length
                ? data.builtins
                : ['standard', 'ptc', 'minimal', 'cordis']

            const presetRows = [
              ...presets.map((preset, index) => {
                const rowId = 'preset-' + index
                return h(Row, {
                  key: 'profile-' + preset.row,
                  id: rowId,
                  name: preset.id,
                  secondary: preset.title || '—',
                  meta: 'MCP × ' + preset.mcp,
                  expandable: true,
                  open: Boolean(openRows[rowId]),
                  onToggle: () => toggleRow(rowId),
                  detail: detailLines([
                    [t('detail.row'), preset.row],
                    [t('detail.title'), preset.title || '—'],
                  ]),
                })
              }),
              ...BUILTIN_PRESETS.map((id) =>
                h(Row, {
                  key: 'builtin-' + id,
                  name: id,
                  secondary: t('preset.builtinRow'),
                }),
              ),
            ]

            const samePath =
              Boolean(workspace.cwd) &&
              Boolean(workspace.projectRoot) &&
              String(workspace.cwd).replace(/\\/g, '/').toLowerCase() ===
                String(workspace.projectRoot).replace(/\\/g, '/').toLowerCase()

            body = h(
              React.Fragment,
              null,
              h(
                'div',
                { className: 'dmp-meta' },
                samePath
                  ? h(
                      'span',
                      { className: 'dmp-meta-item', title: workspace.cwd },
                      h('span', { className: 'dmp-meta-key' }, t('meta.workspaceIsProject')),
                      h('b', { className: 'dmp-meta-value' }, short(workspace.cwd)),
                      h(
                        Chip,
                        { tone: workspace.hasGit ? 'ok' : undefined },
                        workspace.hasGit ? t('meta.git') : t('meta.noGit'),
                      ),
                    )
                  : [
                      h(
                        'span',
                        { className: 'dmp-meta-item', title: workspace.cwd, key: 'ws' },
                        h('span', { className: 'dmp-meta-key' }, t('meta.workspace')),
                        h('b', { className: 'dmp-meta-value' }, short(workspace.cwd)),
                      ),
                      h(
                        'span',
                        { className: 'dmp-meta-item', title: workspace.projectRoot, key: 'pr' },
                        h('span', { className: 'dmp-meta-key' }, t('meta.project')),
                        h('b', { className: 'dmp-meta-value' }, short(workspace.projectRoot)),
                        h(
                          Chip,
                          { tone: workspace.hasGit ? 'ok' : undefined },
                          workspace.hasGit ? t('meta.git') : t('meta.noGit'),
                        ),
                      ),
                    ],
                h(
                  'span',
                  { className: 'dmp-meta-item', title: profile.patch },
                  h('span', { className: 'dmp-meta-key' }, t('meta.patch')),
                  h('b', { className: 'dmp-meta-value' }, String(profile.patch || '').split(/[\\/]/).pop() || '—'),
                  h(Chip, { tone: profile.patchExists ? 'ok' : 'warn' }, profile.patchExists ? '✓' : '·'),
                  profile.inferred ? h(Chip, null, t('meta.inferred')) : null,
                ),
              ),
              h(
                Block,
                {
                  id: 'rules',
                  title: t('section.rules'),
                  count: globalRules.exists ? 1 : 0,
                  open: Boolean(openBlocks.rules),
                  onToggle: () => toggleBlock('rules'),
                },
                ruleRows.length ? ruleRows : h('div', { className: 'dmp-empty' }, t('rules.empty')),
              ),
              h(
                Block,
                {
                  id: 'memory',
                  title: t('section.memory'),
                  count: String(t('memory.workspaces'))
                    .replace('%s', String(filledWorkspaces.length))
                    .replace('%s', String(totalFiles)),
                  open: Boolean(openBlocks.memory),
                  onToggle: () => toggleBlock('memory'),
                },
                h(
                  React.Fragment,
                  null,
                  filledWorkspaces.length
                    ? [
                        notice ? h('div', { className: 'dmp-open-notice' }, notice) : null,
                        openError ? h('div', { className: 'dmp-open-error' }, openError) : null,
                        filledWorkspaces.map((entry) => {
                          const bodyId = 'dmp-ws-mem-' + entry.name
                          const open = Boolean(openMemoryWorkspaces[entry.name])
                          const rules = entry.rules || []
                          const mem = entry.memory || { count: 0, files: [] }
                          return h(
                            'div',
                            { key: entry.name },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'dmp-mem-head',
                                title: entry.path,
                                'aria-expanded': open,
                                'aria-controls': bodyId,
                                onClick: () => toggleMemoryWorkspace(entry.name),
                              },
                              h('span', { className: 'dmp-arrow', 'aria-hidden': true }, open ? '▾' : '▸'),
                              h('b', null, entry.name),
                            ),
                            h(
                              'div',
                              { id: bodyId, className: 'dmp-mem-body', hidden: !open },
                              rules.length
                                ? rules.map((rule) => {
                                    const rowId = 'wsrule-' + rule.path
                                    const ruleOpen = Boolean(openRows[rowId])
                                    return h(
                                      'div',
                                      { key: rule.path },
                                      h(
                                        'button',
                                        {
                                          type: 'button',
                                          className: 'dmp-file dmp-rule-row',
                                          title: rule.path,
                                          'aria-expanded': ruleOpen,
                                          'aria-controls': rowId,
                                          onClick: () => toggleRow(rowId),
                                        },
                                        h(
                                          'span',
                                          { className: 'dmp-arrow', 'aria-hidden': true },
                                          ruleOpen ? '▾' : '▸',
                                        ),
                                        h('span', { className: 'dmp-file-name' }, rule.file),
                                        h('span', { className: 'dmp-chip' }, t('rules.inject')),
                                        h(
                                          'span',
                                          { className: 'dmp-file-meta' },
                                          (rule.sections || []).length + ' ' + t('label.sections'),
                                        ),
                                      ),
                                      h(
                                        'div',
                                        { id: rowId, className: 'dmp-mem-body', hidden: !ruleOpen },
                                        (rule.sections || []).length
                                          ? rule.sections.map((section, index) =>
                                              h('div', { className: 'dmp-rule-section', key: index }, section),
                                            )
                                          : h('div', { className: 'dmp-empty' }, '—'),
                                      ),
                                    )
                                  })
                                : h('div', { className: 'dmp-empty' }, t('memory.noRules')),
                              mem.count > 0
                                ? mem.files.map((file) => {
                                    const target = joinPath(file.dir, file.name)
                                    return h(
                                      'div',
                                      {
                                        className: 'dmp-file',
                                        key: (file.dir || '') + '|' + file.name,
                                        title: target,
                                      },
                                      h('span', { className: 'dmp-file-name' }, file.name),
                                      h(
                                        'span',
                                        { className: 'dmp-file-meta' },
                                        bytes(file.bytes) + ' · ' + String(file.mtime).slice(0, 10),
                                      ),
                                      h(
                                        'button',
                                        {
                                          type: 'button',
                                          className: 'dmp-open-btn',
                                          title: target,
                                          onClick: () => openFile(target),
                                        },
                                        canOpen ? t('detail.open') : t('detail.copy'),
                                      ),
                                    )
                                  })
                                : h('div', { className: 'dmp-empty' }, t('memory.noMemory')),
                            ),
                          )
                        }),
                      ]
                    : h(
                        'div',
                        { className: 'dmp-empty' },
                        h('div', null, t('memory.empty')),
                        h('div', { className: 'dmp-empty-hint' }, t('memory.emptyHint')),
                      ),
                  warningLines(warningsFor('memoryRoots'), 'mem-warning-'),
                ),
              ),
              h(
                Block,
                {
                  id: 'skills',
                  title: t('section.skills'),
                  count: skills.length,
                  open: Boolean(openBlocks.skills),
                  onToggle: () => toggleBlock('skills'),
                },
                h(
                  React.Fragment,
                  null,
                  skillNodes,
                  warningLines(warningsFor('extraSkillRoots'), 'skill-warning-'),
                ),
              ),
              h(
                Block,
                {
                  id: 'mcp',
                  title: t('section.mcp'),
                  count: servers.length,
                  open: Boolean(openBlocks.mcp),
                  onToggle: () => toggleBlock('mcp'),
                },
                h(
                  React.Fragment,
                  null,
                  mcpRows.length ? mcpRows : h('div', { className: 'dmp-empty' }, t('mcp.empty')),
                  warnings.map((warning, index) =>
                    h('div', { className: 'dmp-warning', key: 'warning-' + index }, warning),
                  ),
                  warningLines(warningsFor('extraPatchFiles'), 'mcp-warning-'),
                ),
              ),
              h(
                Block,
                {
                  id: 'presets',
                  title: t('section.presets'),
                  count: presets.length + BUILTIN_PRESETS.length,
                  open: Boolean(openBlocks.presets),
                  onToggle: () => toggleBlock('presets'),
                },
                h(
                  React.Fragment,
                  null,
                  presetRows.length ? presetRows : h('div', { className: 'dmp-empty' }, t('preset.empty')),
                  warningLines(warningsFor('extraPatchFiles'), 'preset-warning-'),
                ),
              ),
              h(
                'div',
                { className: 'dmp-foot' },
                h('span', null, t('common.generated') + ' ' + shortTime(data.generatedAt)),
                h('span', null, 'profile · ' + (profile.name || '—')),
              ),
            )
          }

          return h(
            'div',
            { className: 'dmp-root' },
            h('style', null, CSS),
            h(
              'div',
              { className: 'dmp-inner' },
              h(
                'div',
                { className: 'dmp-head' },
                h(
                  'div',
                  null,
                  h('div', { className: 'dmp-title' }, t('panel.title')),
                  h('div', { className: 'dmp-sub' }, t('panel.subtitle')),
                ),
                h(
                  'div',
                  { className: 'dmp-actions' },
                  h(Chip, { tone: 'ok' }, t('panel.readonly')),
                  h(
                    'button',
                    {
                      className: 'dmp-btn',
                      type: 'button',
                      onClick: inventory.reload,
                      disabled: inventory.status === 'loading',
                    },
                    t('panel.refresh'),
                  ),
                ),
              ),
              body,
            ),
          )
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'mounts',
              order: 30,
              label: () => translate('panel.title'),
            },
            MountsIcon,
          ),
        )

        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'mounts' }, MountsPage))
      },
    }
  },
})
