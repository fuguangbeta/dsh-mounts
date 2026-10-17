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
      'panel.subtitle': '这个 profile 实际挂载了什么：记忆链、技能、MCP 与 Agent Preset。',
      'panel.readonly': '只读',
      'panel.refresh': '刷新',
      'panel.settings': '设置',
      'settings.title': '插件配置',
      'settings.memoryRoots': '记忆库根目录',
      'settings.extraSkillRoots': '额外技能根目录',
      'settings.extraPatchFiles': '额外补丁文件',
      'settings.hint.memoryRoots': '每个根下的直接子目录算一个库；同名库合并为一组',
      'settings.hint.extraSkillRoots': '路径本身含 SKILL.md 也算一个技能',
      'settings.hint.extraPatchFiles': '标准 cordis.patch.yml 文件',
      'settings.save': '保存',
      'settings.cancel': '取消',
      'settings.saving': '正在应用配置…',
      'settings.unavailable': '此环境无法保存配置',
      'settings.failed': '保存失败：',
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
      'memory.count': '%s 个库 · %s 个文件',
      'memory.files': '%s 个文件',
      'memory.folded': '（%s 个副本已折叠）',
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
      'rules.empty': '未找到 AGENTS.md 或 AGENTS.local.md。',
      'memory.empty': '未发现记忆库。',
      'memory.emptyHint': '把记忆文件放在工作区的 memory/ 目录，或在插件配置里设置 memoryRoots。',
      'skills.empty': '未发现技能。',
      'skills.project': '项目',
      'skills.custom': '自定义',
      'mcp.empty': '未发现 MCP 服务器行。',
      'preset.empty': '未发现预设。',
      'preset.builtinRow': '内置 preset（来自 bundle，不可展开）',
      'common.generated': '生成于',
    }

    const EN = {
      'panel.title': 'Mounts',
      'panel.subtitle': 'What this profile actually mounts: memory chain, skills, MCP servers, and Agent Presets.',
      'panel.readonly': 'Read-only',
      'panel.refresh': 'Refresh',
      'panel.settings': 'Settings',
      'settings.title': 'Plugin configuration',
      'settings.memoryRoots': 'Memory roots',
      'settings.extraSkillRoots': 'Extra skill roots',
      'settings.extraPatchFiles': 'Extra patch files',
      'settings.hint.memoryRoots': 'Each direct child directory counts as one library; same-name libraries merge into one group',
      'settings.hint.extraSkillRoots': 'A path containing SKILL.md counts as one skill',
      'settings.hint.extraPatchFiles': 'A standard cordis.patch.yml file',
      'settings.save': 'Save',
      'settings.cancel': 'Cancel',
      'settings.saving': 'Applying…',
      'settings.unavailable': 'Configuration cannot be saved in this environment',
      'settings.failed': 'Save failed: ',
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
      'memory.count': '%s stores · %s files',
      'memory.files': '%s files',
      'memory.folded': '(%s duplicates folded)',
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
      'rules.empty': 'No AGENTS.md or AGENTS.local.md found.',
      'memory.empty': 'No memory stores found.',
      'memory.emptyHint': 'Put memory files in a workspace memory/ directory, or set memoryRoots in the plugin configuration.',
      'skills.empty': 'No skills found.',
      'skills.project': 'Project',
      'skills.custom': 'Custom',
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
.dmp-config{margin-top:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;}
.dmp-config-title{font-size:13px;font-weight:600;}
.dmp-field{margin-top:10px;}
.dmp-field-label{font-size:12px;font-weight:500;}
.dmp-field-input{display:block;width:100%;box-sizing:border-box;margin-top:4px;min-height:64px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.6;padding:6px 8px;}
.dmp-field-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px;}
.dmp-field-hint{margin-top:3px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.dmp-config-actions{display:flex;gap:8px;margin-top:12px;}
.dmp-config-error{margin-top:8px;font-size:11.5px;color:var(--dsw-alias-state-error-primary);}
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
        // declared-service posture is `ctx.inject(['remote', 'remote.session'])`:
        // the callback fires once those services exist, so nothing touches an
        // unready proxy at apply time (that mistake once cost the sidebar).
        // A raw `connection.rpc` call is the same fallback dsh-context uses.
        let sessionRemote = null
        let settingsRemoteService = null
        try {
          ctx.inject(['remote', 'remote.session'], (inner) => {
            try {
              const session = inner.remote && inner.remote.session
              if (session && typeof session.openWorkspacePath === 'function') sessionRemote = session
              const settings = inner.remote && inner.remote.settings
              if (settings && typeof settings.mutate === 'function' && typeof settings.describe === 'function') {
                settingsRemoteService = settings
              }
            } catch {
              sessionRemote = null
              settingsRemoteService = null
            }
            return () => {
              sessionRemote = null
              settingsRemoteService = null
            }
          })
        } catch {
          sessionRemote = null
          settingsRemoteService = null
        }

        const settingsRemote = () => {
          try {
            if (settingsRemoteService) return settingsRemoteService
            const remote = typeof ctx.get === 'function' ? ctx.get('remote') : null
            const settings = remote && remote.settings
            return settings && typeof settings.mutate === 'function' ? settings : null
          } catch {
            return null
          }
        }

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
          const [openStores, setOpenStores] = React.useState({})
          const [openRows, setOpenRows] = React.useState({})
          const [notice, setNotice] = React.useState(null)
          const [openError, setOpenError] = React.useState(null)
          const [canOpen, setCanOpen] = React.useState(false)
          const [canConfigure, setCanConfigure] = React.useState(false)
          const [settingsOpen, setSettingsOpen] = React.useState(false)
          const [settingsBusy, setSettingsBusy] = React.useState(false)
          const [settingsError, setSettingsError] = React.useState(null)
          const [settingsRevision, setSettingsRevision] = React.useState(undefined)
          const [settingsNs, setSettingsNs] = React.useState('dsh-mounts#mounts-panel')
          const [settingsForm, setSettingsForm] = React.useState({
            memoryRoots: '',
            extraSkillRoots: '',
            extraPatchFiles: '',
          })
          const data = inventory.data

          // Detect the opener after mount, never during apply: touching the Remote
          // before the client services settle used to abort the whole plugin.
          React.useEffect(() => {
            let live = true
            const check = () => {
              if (!live) return
              if (remoteSession() || connectionRpc()) setCanOpen(true)
              if (settingsRemote()) setCanConfigure(true)
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
          const toggleStore = (id) => setOpenStores((previous) => ({ ...previous, [id]: !previous[id] }))
          const toggleRow = (id) => setOpenRows((previous) => ({ ...previous, [id]: !previous[id] }))

          const openSettings = async () => {
            if (settingsOpen) {
              setSettingsOpen(false)
              return
            }
            setSettingsOpen(true)
            setSettingsError(null)
            const base = (data && data.config) || {}
            const joined = (value) => (Array.isArray(value) ? value.join('\n') : '')
            setSettingsForm({
              memoryRoots: joined(base.memoryRoots),
              extraSkillRoots: joined(base.extraSkillRoots),
              extraPatchFiles: joined(base.extraPatchFiles),
            })
            setSettingsRevision(undefined)
            const settings = settingsRemote()
            if (!settings || typeof settings.describe !== 'function') return
            try {
              const descriptors = await settings.describe({ redactSecrets: true })
              const list = Array.isArray(descriptors) ? descriptors : []
              const target =
                list.find((entry) => entry && entry.ns === 'dsh-mounts#mounts-panel') ||
                list.find((entry) => entry && typeof entry.ns === 'string' && entry.ns.endsWith('#mounts-panel')) ||
                list.find((entry) => entry && entry.value && Array.isArray(entry.value.memoryRoots))
              if (!target) return
              setSettingsNs(target.ns)
              if (typeof target.revision === 'number') setSettingsRevision(target.revision)
              const value = target.value || {}
              setSettingsForm({
                memoryRoots: joined(value.memoryRoots),
                extraSkillRoots: joined(value.extraSkillRoots),
                extraPatchFiles: joined(value.extraPatchFiles),
              })
            } catch (error) {
              setSettingsError(t('settings.failed') + String((error && error.message) || error))
            }
          }

          const saveSettings = async () => {
            const settings = settingsRemote()
            if (!settings || !canConfigure) {
              setSettingsError(t('settings.unavailable'))
              return
            }
            setSettingsBusy(true)
            setSettingsError(null)
            const split = (text) =>
              String(text || '')
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
            try {
              const ops = [
                { op: 'set', path: ['memoryRoots'], value: split(settingsForm.memoryRoots) },
                { op: 'set', path: ['extraSkillRoots'], value: split(settingsForm.extraSkillRoots) },
                { op: 'set', path: ['extraPatchFiles'], value: split(settingsForm.extraPatchFiles) },
              ]
              await settings.mutate(settingsNs, ops, settingsRevision)
              setSettingsOpen(false)
              inventory.reload()
            } catch (error) {
              setSettingsError(t('settings.failed') + String((error && (error.message || error.code)) || error))
            } finally {
              setSettingsBusy(false)
            }
          }

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
            const chain = data.chain || []
            const skills = data.skills || []
            const roots = data.skillRoots || []
            const servers = data.mcp || []
            const presets = data.presets || []
            const memory = data.memory || []
            const warnings = Array.isArray(data.warnings) ? data.warnings : []
            const configWarnings = Array.isArray(data.configWarnings) ? data.configWarnings : []
            const warningsFor = (prefix) => configWarnings.filter((warning) => String(warning).includes(prefix))
            const warningLines = (list, keyPrefix) =>
              list.map((warning, index) => h('div', { className: 'dmp-warning', key: keyPrefix + index }, warning))
            const memoryFiles = memory.reduce((sum, store) => sum + store.count, 0)
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
            for (const [index, entry] of chain.entries()) {
              const rowId = 'rule-' + index
              ruleRows.push(
                h(Row, {
                  key: entry.path,
                  id: rowId,
                  name: entry.rel,
                  secondary: sectionMeta(entry),
                  mono: true,
                  expandable: true,
                  open: Boolean(openRows[rowId]),
                  onToggle: () => toggleRow(rowId),
                  detail: [
                    ...detailLines([[t('detail.path'), entry.path]]),
                    h(
                      'div',
                      { className: 'dmp-detail-line', key: 'sections' },
                      h('span', { className: 'dmp-detail-label' }, t('detail.sections')),
                      h(
                        'span',
                        { className: 'dmp-detail-value' },
                        (entry.sections || []).length
                          ? entry.sections.map((section, sectionIndex) => h('div', { key: sectionIndex }, section))
                          : '—',
                      ),
                    ),
                  ],
                }),
              )
            }

            const skillsOf = (root) => skills.filter((skill) => skill.rank === root.rank && skill.label === root.label)
            const openRoots = roots.filter((root) => skillsOf(root).length)
            const projectBase = String(workspace.projectRoot || '').replace(/\\/g, '/')
            const rootDisplay = (root) => {
              const full = String(root.root || '').replace(/\\/g, '/')
              const relative =
                projectBase && full.toLowerCase().startsWith(projectBase.toLowerCase())
                  ? full.slice(projectBase.length).replace(/^\//, '')
                  : full
              if (root.rank === 350) return t('skills.custom') + ' ' + relative
              if (root.rank < 400) return t('skills.project') + ' ' + relative
              return home && full.toLowerCase().startsWith(home.toLowerCase()) ? '~' + full.slice(home.length) : full
            }
            const skillIndex = new Map(skills.map((skill, index) => [skill.path, index]))
            const skillRow = (skill) => {
              const rowId = 'skill-' + skillIndex.get(skill.path)
              return h(Row, {
                key: skill.path,
                id: rowId,
                name: skill.name,
                secondary: skill.desc || '—',
                meta: bytes(skill.bytes),
                expandable: true,
                open: Boolean(openRows[rowId]),
                onToggle: () => toggleRow(rowId),
                detail: detailLines([
                  [t('detail.desc'), skill.desc || '—'],
                  [t('detail.path'), skill.path],
                  [t('detail.source'), (skill.label || '') + ' · rank ' + skill.rank],
                ]),
              })
            }
            const skillNodes =
              openRoots.length > 1
                ? openRoots.map((root) =>
                    h(
                      'div',
                      { key: root.label },
                      h(
                        'div',
                        { className: 'dmp-group', title: root.root },
                        h('b', null, rootDisplay(root)),
                        h('span', { className: 'dmp-group-meta' }, '· ' + skillsOf(root).length),
                      ),
                      skillsOf(root).map(skillRow),
                    ),
                  )
                : skills.map(skillRow)

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
                  count: (globalRules.exists ? 1 : 0) + chain.length,
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
                  count: String(t('memory.count'))
                    .replace('%s', String(memory.length))
                    .replace('%s', String(memoryFiles)),
                  open: Boolean(openBlocks.memory),
                  onToggle: () => toggleBlock('memory'),
                },
                h(
                  React.Fragment,
                  null,
                  memory.length
                    ? [
                        notice ? h('div', { className: 'dmp-open-notice' }, notice) : null,
                        openError ? h('div', { className: 'dmp-open-error' }, openError) : null,
                        memory.map((store) => {
                          const bodyId = 'dmp-mem-' + store.group
                          const open = Boolean(openStores[store.group])
                          const countText = ' · ' + String(t('memory.files')).replace('%s', String(store.count))
                          const foldedText =
                            store.folded > 0
                              ? ' ' + String(t('memory.folded')).replace('%s', String(store.folded))
                              : ''
                          return h(
                            'div',
                            { key: store.group },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'dmp-mem-head',
                                title: (store.dirs || []).join('\n'),
                                'aria-expanded': open,
                                'aria-controls': bodyId,
                                onClick: () => toggleStore(store.group),
                              },
                              h('span', { className: 'dmp-arrow', 'aria-hidden': true }, open ? '▾' : '▸'),
                              h('b', null, store.group),
                              h('span', { className: 'dmp-mem-count' }, countText + foldedText),
                              store.latest
                                ? h('span', { className: 'dmp-mem-latest' }, String(store.latest).slice(0, 10))
                                : null,
                            ),
                            h(
                              'div',
                              { id: bodyId, className: 'dmp-mem-body', hidden: !open },
                              store.files.map((file) => {
                                const target = joinPath(file.dir, file.name)
                                return h(
                                  'div',
                                  { className: 'dmp-file', key: (file.dir || '') + '|' + file.name, title: target },
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
                              }),
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
                  skills.length ? skillNodes : h('div', { className: 'dmp-empty' }, t('skills.empty')),
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
                      onClick: openSettings,
                      disabled: !canConfigure,
                      title: canConfigure ? '' : t('settings.unavailable'),
                    },
                    t('panel.settings'),
                  ),
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
              settingsOpen
                ? h(
                    'div',
                    { className: 'dmp-config' },
                    h('div', { className: 'dmp-config-title' }, t('settings.title')),
                    [
                      ['memoryRoots', 'settings.memoryRoots', 'settings.hint.memoryRoots'],
                      ['extraSkillRoots', 'settings.extraSkillRoots', 'settings.hint.extraSkillRoots'],
                      ['extraPatchFiles', 'settings.extraPatchFiles', 'settings.hint.extraPatchFiles'],
                    ].map(([key, labelKey, hintKey]) =>
                      h(
                        'div',
                        { className: 'dmp-field', key },
                        h('div', { className: 'dmp-field-label' }, t(labelKey)),
                        h('textarea', {
                          className: 'dmp-field-input',
                          rows: 3,
                          spellCheck: false,
                          value: settingsForm[key],
                          onChange: (event) =>
                            setSettingsForm((previous) => ({ ...previous, [key]: event.target.value })),
                        }),
                        h('div', { className: 'dmp-field-hint' }, t(hintKey)),
                      ),
                    ),
                    settingsError ? h('div', { className: 'dmp-config-error' }, settingsError) : null,
                    !canConfigure ? h('div', { className: 'dmp-config-error' }, t('settings.unavailable')) : null,
                    h(
                      'div',
                      { className: 'dmp-config-actions' },
                      h(
                        'button',
                        {
                          className: 'dmp-btn',
                          type: 'button',
                          onClick: saveSettings,
                          disabled: settingsBusy || !canConfigure,
                        },
                        settingsBusy ? t('settings.saving') : t('settings.save'),
                      ),
                      h(
                        'button',
                        {
                          className: 'dmp-btn',
                          type: 'button',
                          onClick: () => setSettingsOpen(false),
                          disabled: settingsBusy,
                        },
                        t('settings.cancel'),
                      ),
                    ),
                  )
                : null,
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
