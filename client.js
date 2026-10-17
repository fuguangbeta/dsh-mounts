/**
 * dsh-mounts — Client half.
 *
 * A read-only sidebar panel in three levels: a block summary, the items of one
 * block, and the detail of one item. The panel only reads the JSON snapshot its
 * Host half serves; it writes nothing, starts no process and reaches no other
 * origin.
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
      'panel.loading': '读取中…',
      'panel.error': '读取失败',
      'panel.retry': '重试',
      'meta.workspace': '工作区',
      'meta.project': '项目根',
      'meta.workspaceIsProject': '工作区 = 项目根',
      'meta.patch': '补丁',
      'meta.git': '含 .git',
      'meta.noGit': '无 .git',
      'section.rules': '预规定 / 记忆',
      'section.skills': '技能',
      'section.mcp': 'MCP 服务器',
      'section.presets': 'Agent Preset',
      'label.sections': '节',
      'detail.path': '路径',
      'detail.sections': '章节',
      'detail.noSections': '无二级标题',
      'detail.source': '来源根',
      'detail.description': '描述',
      'detail.target': '目标',
      'detail.env': 'env 变量',
      'detail.row': '补丁行',
      'detail.title': '标题',
      'detail.registry': '注册表',
      'detail.note': '说明',
      'detail.refs': '引用的外部路径（未注入，需手动读取）',
      'detail.dir': '目录',
      'detail.file': '文件',
      'detail.items': '项',
      'detail.open': '打开',
      'detail.openFailed': '打开失败：系统默认程序没有接受这个文件',
      'detail.noDesktop': '当前部署没有打开本地文件的通道',
      'detail.copy': '复制路径',
      'detail.copied': '已复制到剪贴板',
      'detail.copyFailed': '复制失败：浏览器没有授予剪贴板权限',
      'detail.revealHint': '复制后可在资源管理器里粘贴打开',
      'detail.none': '—',
      'rules.global': '全局预规定',
      'rules.chain': '项目链',
      'rules.empty': '项目链上没有 AGENTS.md / AGENTS.local.md',
      'skills.roots': '扫描根',
      'skills.empty': '没有发现技能',
      'skills.project': '项目',
      'skills.user': '用户',
      'skills.emptyRoot': '未创建或无技能',
      'skills.missing': '未创建',
      'mcp.empty': '这个 profile 没有 MCP 行',
      'mcp.env': 'env',
      'preset.registry': '注册表',
      'preset.current': '当前',
      'preset.deployed': '部署默认',
      'preset.builtin': '内置（来自 bundle，不在此补丁中）',
      'preset.empty': '这个 profile 没有额外 preset',
      'preset.note': '在 profile 补丁中声明，承载 %s 个 MCP 服务器',
      'common.empty': '—',
      'common.generated': '生成于',
      'common.none': '无',
    }

    const EN = {
      'panel.title': 'Mounts',
      'panel.subtitle': 'What this profile actually mounts: memory chain, skills, MCP servers, and Agent Presets.',
      'panel.readonly': 'Read-only',
      'panel.refresh': 'Refresh',
      'panel.loading': 'Reading…',
      'panel.error': 'Failed to read',
      'panel.retry': 'Retry',
      'meta.workspace': 'Workspace',
      'meta.project': 'Project',
      'meta.workspaceIsProject': 'Workspace = Project',
      'meta.patch': 'Patch',
      'meta.git': 'has .git',
      'meta.noGit': 'no .git',
      'section.rules': 'Instructions / memory',
      'section.skills': 'Skills',
      'section.mcp': 'MCP servers',
      'section.presets': 'Agent Presets',
      'label.sections': 'sections',
      'detail.path': 'Path',
      'detail.sections': 'Sections',
      'detail.noSections': 'No sub-sections',
      'detail.source': 'Source root',
      'detail.description': 'Description',
      'detail.target': 'Target',
      'detail.env': 'env vars',
      'detail.row': 'Patch row',
      'detail.title': 'Title',
      'detail.registry': 'Registry',
      'detail.note': 'Note',
      'detail.refs': 'Referenced external paths (not injected; read manually)',
      'detail.dir': 'dir',
      'detail.file': 'file',
      'detail.items': 'items',
      'detail.open': 'Open',
      'detail.openFailed': 'Open failed: the default application did not accept this file',
      'detail.noDesktop': 'This deployment has no channel for opening local files',
      'detail.copy': 'Copy path',
      'detail.copied': 'Copied to clipboard',
      'detail.copyFailed': 'Copy failed: the browser denied clipboard access',
      'detail.revealHint': 'Paste the copied path into Explorer to open it',
      'detail.none': '—',
      'rules.global': 'Global instructions',
      'rules.chain': 'Project chain',
      'rules.empty': 'No AGENTS.md / AGENTS.local.md on the project chain',
      'skills.roots': 'Scan roots',
      'skills.empty': 'No skills found',
      'skills.project': 'Project',
      'skills.user': 'User',
      'skills.emptyRoot': 'missing or empty',
      'skills.missing': 'missing',
      'mcp.empty': 'This profile declares no MCP row',
      'mcp.env': 'env',
      'preset.registry': 'Registry',
      'preset.current': 'current',
      'preset.deployed': 'deployed default',
      'preset.builtin': 'Built in (shipped by the bundle, not this patch)',
      'preset.empty': 'This profile declares no extra preset',
      'preset.note': 'Declared in the profile patch; carries %s MCP server(s)',
      'common.empty': '—',
      'common.generated': 'Generated',
      'common.none': 'none',
    }

    const CSS = `
.dmp-root{height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);}
.dmp-inner{max-width:1020px;margin:0 auto;padding:30px 34px 76px;}
.dmp-head{display:flex;align-items:flex-start;gap:16px;}
.dmp-title{font-size:20px;font-weight:600;letter-spacing:.01em;}
.dmp-sub{margin-top:6px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.dmp-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none;}
.dmp-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.dmp-chip.accent{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);}
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
.dmp-item{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-item:first-child{border-top:0;}
.dmp-item-head{display:grid;grid-template-columns:14px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:9px 16px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dmp-item-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-item-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-dot{flex:none;font-size:12px;line-height:1.4;}
.dmp-dot.on{color:var(--dsw-alias-state-success-primary);}
.dmp-dot.off{color:var(--dsw-alias-state-idle-primary);}
.dmp-name{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
.dmp-meta-line{display:flex;align-items:center;gap:8px;justify-content:flex-end;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmp-detail{padding:2px 16px 12px 40px;font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary);}
.dmp-detail-line{display:flex;gap:8px;min-width:0;}
.dmp-detail-line > span:last-child{min-width:0;word-break:break-all;color:var(--dsw-alias-label-secondary);}
.dmp-detail-label{flex:none;opacity:.8;}
.dmp-detail-section{padding-left:0;}
.dmp-empty{padding:12px 16px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.dmp-detail-sub{margin-top:6px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l1);}
.dmp-ref{margin-top:2px;}
.dmp-ref-head{display:flex;align-items:baseline;gap:8px;width:100%;padding:3px 0;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dmp-ref-head.static{cursor:default;}
.dmp-ref-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-ref-path{flex:1;min-width:0;font-size:11.5px;word-break:break-all;color:var(--dsw-alias-label-secondary);}
.dmp-ref-meta{flex:none;font-size:11px;opacity:.85;white-space:nowrap;}
.dmp-ref-body{padding:2px 0 4px 20px;}
.dmp-ref-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:baseline;gap:10px;padding:2px 0;}
.dmp-ref-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:11.5px;}
.dmp-ref-kind,.dmp-ref-date{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmp-link-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:6px;padding:0 8px;font-size:11px;line-height:18px;cursor:pointer;font-family:inherit;}
.dmp-link-btn:hover{border-color:var(--dsw-alias-border-l2);}
.dmp-link-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-ref-scroll{max-height:320px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;border-radius:6px;}
.dmp-ref-scroll::-webkit-scrollbar{width:8px;}
.dmp-ref-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:4px;}
.dmp-ref-scroll::-webkit-scrollbar-track{background:transparent;}
.dmp-ref-item-action{appearance:none;border:0;background:none;font:inherit;text-align:left;cursor:pointer;width:100%;border-radius:6px;}
.dmp-ref-item-action:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-ref-item-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-open-error{padding-top:4px;font-size:11.5px;color:var(--dsw-alias-state-error-primary);}
.dmp-open-notice{padding-top:4px;font-size:11.5px;color:var(--dsw-alias-state-success-primary);}
.dmp-ref-hint{padding:2px 0 4px;font-size:11px;color:var(--dsw-alias-label-secondary);}
.dmp-note{padding:10px 16px;font-size:11.5px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1);}
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

    function formatTime(iso) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
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

    function Item(props) {
      const panelId = 'dmp-detail-' + props.id
      return h(
        'div',
        { className: 'dmp-item' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-item-head',
            'aria-expanded': props.open,
            'aria-controls': panelId,
            onClick: props.onToggle,
          },
          props.dot === null
            ? h('span', { className: 'dmp-dot', 'aria-hidden': true })
            : h(
                'span',
                { className: 'dmp-dot ' + (props.dot ? 'on' : 'off'), 'aria-hidden': true },
                props.dot ? '✓' : '·',
              ),
          h('span', { className: 'dmp-name' + (props.mono ? ' dmp-mono' : ''), title: props.name }, props.name),
          h('span', { className: 'dmp-meta-line' }, props.meta),
        ),
        h('div', { id: panelId, className: 'dmp-detail', hidden: !props.open }, props.detail),
      )
    }

    function detailLines(lines) {
      return lines.map((line, index) =>
        h(
          'div',
          { className: 'dmp-detail-line', key: index },
          h('span', { className: 'dmp-detail-label' }, line[0]),
          h('span', null, line[1]),
        ),
      )
    }

    function detailSections(title, sections) {
      return h(
        'div',
        { className: 'dmp-detail-line dmp-detail-section', key: 'sections' },
        h('span', { className: 'dmp-detail-label' }, title),
        h(
          'span',
          null,
          sections.length
            ? sections.map((section, index) => h('div', { key: index }, section))
            : h('div', null, '—'),
        ),
      )
    }

    function RefRow(props) {
      const entry = props.entry
      const t = props.t
      const isDir = entry.kind === 'dir'
      const items = Array.isArray(entry.items) ? entry.items : []
      const expandable = isDir && items.length > 0
      const meta = isDir
        ? typeof entry.entries === 'number'
          ? entry.entries + ' ' + t('detail.items')
          : t('detail.dir')
        : t('detail.file')
      const bodyId = 'dmp-ref-' + props.id
      const head = [
        h('span', { className: 'dmp-arrow', 'aria-hidden': true }, expandable ? (props.open ? '▾' : '▸') : ''),
        h('span', { className: 'dmp-mono dmp-ref-path', title: entry.path }, entry.path),
        h('span', { className: 'dmp-ref-meta' }, meta),
      ]

      if (!expandable) {
        return h(
          'div',
          { className: 'dmp-ref' },
          h(
            'div',
            { className: 'dmp-ref-head static' },
            ...head,
            !isDir && props.actLabel
              ? h(
                  'button',
                  { type: 'button', className: 'dmp-link-btn', onClick: () => props.onAct(entry.path), title: entry.path },
                  props.actLabel,
                )
              : null,
          ),
        )
      }

      return h(
        'div',
        { className: 'dmp-ref' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-ref-head',
            'aria-expanded': props.open,
            'aria-controls': bodyId,
            onClick: props.onToggle,
          },
          ...head,
        ),
        h(
          'div',
          { id: bodyId, className: 'dmp-ref-body', hidden: !props.open },
          h(
            'div',
            { className: 'dmp-ref-scroll' },
            items.map((item) => {
              const target = joinPath(entry.path, item.name)
              const label = [
                h('span', { className: 'dmp-ref-name', title: item.name }, item.isDir ? item.name + '\\' : item.name),
                h('span', { className: 'dmp-ref-kind' }, item.isDir ? t('detail.dir') : bytes(item.bytes)),
                h('span', { className: 'dmp-ref-date' }, formatTime(item.mtime)),
              ]
              if (item.isDir || !props.actLabel) {
                return h('div', { className: 'dmp-ref-item', key: item.name }, ...label)
              }
              return h(
                'button',
                {
                  type: 'button',
                  className: 'dmp-ref-item dmp-ref-item-action',
                  key: item.name,
                  title: target,
                  onClick: () => props.onAct(target),
                },
                ...label,
                h('span', { className: 'dmp-link-btn' }, props.actLabel),
              )
            }),
          ),
        ),
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
          const [openBlocks, setOpenBlocks] = React.useState({ rules: true })
          const [openItems, setOpenItems] = React.useState({})
          const [openRefs, setOpenRefs] = React.useState({})
          const [openError, setOpenError] = React.useState(null)
          const [notice, setNotice] = React.useState(null)
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

          const copyPath = (target) => {
            setOpenError(null)
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

          const toggleBlock = (id) => setOpenBlocks((previous) => ({ ...previous, [id]: !previous[id] }))
          const toggleItem = (id) => setOpenItems((previous) => ({ ...previous, [id]: !previous[id] }))
          const toggleRef = (id) => setOpenRefs((previous) => ({ ...previous, [id]: !previous[id] }))
          const isItemOpen = (id) => Boolean(openItems[id])
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
            const registry = data.registry || {}
            const workspace = data.workspace || {}
            const profile = data.profile || {}

            const home = String(globalRules.path || '')
              .replace(/[\\/]\.dsh[\\/]AGENTS\.md$/i, '')
              .replace(/\\/g, '/')
            const short = (value) => {
              const text = String(value || '').replace(/\\/g, '/')
              return home && text.toLowerCase().startsWith(home.toLowerCase()) ? '~' + text.slice(home.length) : text
            }

            const sectionCount = (sections) => (sections || []).length + ' ' + t('label.sections')

            // ---- rules ----
            const ruleItems = []
            if (globalRules.exists) {
              ruleItems.push({
                key: 'global',
                dot: true,
                mono: true,
                name: short(globalRules.path),
                meta: [bytes(globalRules.bytes) + ' · ' + sectionCount(globalRules.sections)],
                detail: [
                  ...detailLines([[t('detail.path'), globalRules.path]]),
                  detailSections(t('detail.sections'), globalRules.sections || []),
                ],
              })
            }
            for (const entry of chain) {
              ruleItems.push({
                key: entry.path,
                dot: true,
                mono: true,
                name: entry.rel,
                meta: [bytes(entry.bytes) + ' · ' + sectionCount(entry.sections)],
                detail: [
                  ...detailLines([[t('detail.path'), entry.path]]),
                  detailSections(t('detail.sections'), entry.sections || []),
                ],
              })
            }

            // ---- skills ----
            const skillsOf = (root) => skills.filter((skill) => skill.rank === root.rank && skill.label === root.label)
            const projectBase = String(workspace.projectRoot || '').replace(/\\/g, '/')
            const rootDisplay = (root) => {
              const full = String(root.root || '').replace(/\\/g, '/')
              if (root.rank < 400) {
                const relative =
                  projectBase && full.toLowerCase().startsWith(projectBase.toLowerCase())
                    ? full.slice(projectBase.length).replace(/^\//, '')
                    : full
                return t('skills.project') + ' ' + relative
              }
              return home && full.toLowerCase().startsWith(home.toLowerCase()) ? '~' + full.slice(home.length) : full
            }
            const openRoots = roots.filter((root) => skillsOf(root).length)
            const showRank = openRoots.length > 1

            // ---- mcp ----
            const carriers = presets.filter((preset) => preset.mcp === servers.length)
            const carrier = carriers.length === 1 ? carriers[0] : null

            // ---- presets ----
            const presetItems = presets.map((preset) => {
              const current = Boolean(registry.selectedDefault && preset.id === registry.selectedDefault)
              const deployed = !current && Boolean(registry.default && preset.id === registry.default)
              return {
                key: preset.row,
                dot: null,
                name: preset.id,
                meta: [
                  'MCP × ' + preset.mcp,
                  current ? h(Chip, { tone: 'ok', key: 'current' }, t('preset.current')) : null,
                  deployed ? h(Chip, { key: 'deployed' }, t('preset.deployed')) : null,
                ],
                detail: detailLines([
                  [t('detail.title'), preset.title || '—'],
                  [t('detail.row'), preset.row],
                  [t('detail.registry'), 'default=' + (registry.default || '—') + ' · selectedDefault=' + (registry.selectedDefault || '—')],
                  [t('detail.note'), String(t('preset.note')).replace('%s', String(preset.mcp))],
                ]),
              }
            })

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
                ruleItems.length
                  ? ruleItems.map((item, index) =>
                      h(Item, {
                        key: item.key,
                        id: 'rules-' + index,
                        dot: item.dot,
                        mono: item.mono,
                        name: item.name,
                        meta: item.meta,
                        detail: item.detail,
                        open: isItemOpen('rules-' + index),
                        onToggle: () => toggleItem('rules-' + index),
                      }),
                    )
                  : h('div', { className: 'dmp-empty' }, t('rules.empty')),
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
                openRoots.length
                  ? openRoots.map((root, rootIndex) => {
                      const items = skillsOf(root)
                      return h(
                        React.Fragment,
                        { key: root.label },
                        h(
                          'div',
                          { className: 'dmp-group', title: root.root },
                          h('b', null, rootDisplay(root)),
                          h(
                            'span',
                            { className: 'dmp-group-meta' },
                            '· ' + (root.exists ? items.length : t('skills.missing')),
                          ),
                        ),
                        items.map((skill, index) => {
                          const itemId = 'skills-' + rootIndex + '-' + index
                          const detail = [
                            ...detailLines([
                              [t('detail.description'), skill.desc || '—'],
                              [t('detail.path'), skill.path],
                              [t('detail.source'), root.root],
                            ]),
                          ]
                          if (skill.refs && skill.refs.length) {
                            detail.push(h('div', { className: 'dmp-detail-sub', key: 'refs-title' }, t('detail.refs')))
                            if (!canOpen) {
                              detail.push(h('div', { className: 'dmp-ref-hint', key: 'refs-hint' }, t('detail.revealHint')))
                            }
                            if (notice) {
                              detail.push(h('div', { className: 'dmp-open-notice', key: 'refs-notice' }, notice))
                            }
                            if (openError) {
                              detail.push(h('div', { className: 'dmp-open-error', key: 'refs-error' }, openError))
                            }
                            skill.refs.forEach((entry, refIndex) => {
                              const refKey = skill.path + '|' + entry.path
                              detail.push(
                                h(RefRow, {
                                  key: 'ref-' + entry.path,
                                  id: itemId + '-ref-' + refIndex,
                                  entry,
                                  open: Boolean(openRefs[refKey]),
                                  onToggle: () => toggleRef(refKey),
                                  onAct: canOpen ? openFile : copyPath,
                                  actLabel: canOpen ? t('detail.open') : t('detail.copy'),
                                  t,
                                }),
                              )
                            })
                          }
                          return h(Item, {
                            key: skill.path,
                            id: itemId,
                            dot: null,
                            mono: true,
                            name: skill.name,
                            meta: [
                              showRank ? h(Chip, { tone: 'accent', key: 'rank' }, 'r' + skill.rank) : null,
                              bytes(skill.bytes),
                            ],
                            detail,
                            open: isItemOpen(itemId),
                            onToggle: () => toggleItem(itemId),
                          })
                        }),
                      )
                    })
                  : h('div', { className: 'dmp-empty' }, t('skills.empty')),
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
                servers.length
                  ? servers.map((server, index) => {
                      const itemId = 'mcp-' + index
                      return h(Item, {
                        key: server.row,
                        id: itemId,
                        dot: true,
                        name: server.server || server.row,
                        meta: [
                          h(Chip, { tone: 'accent', key: 'transport' }, server.transport || '?'),
                          carrier ? h('span', { className: 'dmp-mono', key: 'preset' }, carrier.id) : null,
                        ],
                        detail: [
                          ...detailLines([
                            [t('detail.target'), server.target || '—'],
                            [t('detail.env'), (server.env || []).length ? server.env.join(', ') : t('common.none')],
                            [t('detail.row'), server.row],
                          ]),
                        ],
                        open: isItemOpen(itemId),
                        onToggle: () => toggleItem(itemId),
                      })
                    })
                  : h('div', { className: 'dmp-empty' }, t('mcp.empty')),
              ),
              h(
                Block,
                {
                  id: 'presets',
                  title: t('section.presets'),
                  count: presets.length,
                  open: Boolean(openBlocks.presets),
                  onToggle: () => toggleBlock('presets'),
                },
                h(
                  React.Fragment,
                  null,
                  presets.length
                    ? presetItems.map((item, index) =>
                        h(Item, {
                          key: item.key,
                          id: 'presets-' + index,
                          dot: item.dot,
                          name: item.name,
                          meta: item.meta,
                          detail: item.detail,
                          open: isItemOpen('presets-' + index),
                          onToggle: () => toggleItem('presets-' + index),
                        }),
                      )
                    : h('div', { className: 'dmp-empty' }, t('preset.empty')),
                  h('div', { className: 'dmp-note' }, t('preset.builtin')),
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
