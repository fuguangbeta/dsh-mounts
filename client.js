/**
 * dsh-mounts — Client half.
 *
 * One mostly read-only page: a Global/Workspace tree, two-line rows, and
 * detail that expands in place. The panel reads the Host snapshot and posts
 * only the explicit handoff save; it starts no process and reaches no other origin.
 */
window.__ModuleLoader__.load({
  id: 'dsh-mounts',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    let ReactDOM = null
    try {
      ReactDOM = require('react-dom')
    } catch {
      ReactDOM = null
    }

    const NS = 'mounts'
    const API = '/dsh-mounts/api'
    const HANDOFF_API = '/dsh-mounts/handoff'

    const ZN = {
      'panel.title': '挂载清单',
      'panel.subtitle': '当前项目挂载了什么：全局与工作区的项目简报、记忆、技能与 MCP；技能和 MCP 行尾带状态点。',
      'panel.readonly': '只读 · 交接',
      'panel.refresh': '刷新',
      'brief.copy': '复制简报',
      'brief.empty': '暂无简报（未发现规则或记忆文件）',
      'panel.loading': '读取中…',
      'panel.error': '读取失败',
      'panel.retry': '重试',
      'meta.workspaceCount': '工作区 %s 个',
      'meta.patch': '补丁',
      'meta.inferred': '（推断）',
      'meta.inferredHint': 'profile 名由安装路径推断',
      'section.brief': '项目简报',
      'root.global': '全局',
      'root.workspace': '工作区',
      'status.on': '生效',
      'status.off': '未生效（被遮蔽或未挂载）',
      'status.unknown': '缺少生效数据',
      'status.session': '会话',
      'status.catalog': '目录',
      'status.scope': '状态点按所选工作区的会话或目录计算',
      'status.scopeLabel': '生效视角',
      'section.rules': '规则',
      'section.memory': '记忆',
      'section.skills': '技能',
      'section.mcp': 'MCP 服务器',
      'section.handoff': '交接',
      'section.team': '团队',
      'section.engines': '引擎',
      'engines.none': '未接入',
      'handoff.none': '无',
      'handoff.noneHint': '无（写入 .dsh-mounts/handoff.md）',
      'handoff.edit': '编辑',
      'handoff.write': '写交接',
      'handoff.save': '保存',
      'handoff.saving': '保存中…',
      'handoff.cancel': '取消',
      'handoff.placeholder': '时间 / 版本 / 现场 / 未决 / 下一步',
      'handoff.saved': '交接已保存',
      'handoff.saveFailed': '交接保存失败',
      'team.none': '未检测到',
      'team.members': '成员',
      'team.tasks': '任务',
      'team.unparsed': 'team.json 无法解析',
      'team.count': '成员 %s · 任务 %s',
      'mcp.projectEmpty': '本项目未配置 MCP',
      'mcp.external': '外部',
      'mcp.active': '生效',
      'mcp.configured': '配置',
      'mcp.externalHint': '.mcp.json 是外部格式，DSH 不会挂载；要挂载请用 .dsh/mcp.json。',
      'workspace.empty': '未注册工作区',
      'brief.full': '完整简报',
      'brief.hint': '规则、记忆、技能、MCP、团队与交接',
      'label.sections': '节',
      'memory.workspaces': '%s 个工作区 · %s 个文件',
      'memory.noRules': '无规则文件',
      'memory.noMemory': '无记忆文件',
      'memory.folded': '合并 %s',
      'detail.open': '打开',
      'detail.path': '路径',
      'detail.sections': '章节',
      'detail.desc': '描述',
      'detail.source': '来源',
      'detail.row': '补丁行',
      'detail.title': '标题',
      'detail.preset': '所属预设',
      'detail.target': '目标',
      'detail.env': 'env',
      'detail.copy': '复制路径',
      'detail.copied': '已复制到剪贴板',
      'detail.copyFailed': '复制失败：浏览器没有授予剪贴板权限',
      'detail.openFailed': '打开失败。该路径可能是目录联接，系统打开了它指向的真实位置。',
      'rules.empty': '未找到全局 AGENTS.md。',
      'rules.inject': '自动注入',
      'rules.injectHint': '该文件会被 DSH 自动注入到本工作区的每个会话',
      'memory.empty': '未发现记忆库。',
      'memory.emptyHint': '把记忆文件放在工作区的 memory/ 目录（<工作区>/memory、.dsh/memory、.agents/memory）。',
      'skills.global': '全局技能',
      'skills.workspace': '工作区技能',
      'skills.globalEmpty': '未发现全局技能。',
      'skills.workspaceEmpty': '未发现工作区技能。',
      'mcp.empty': '未发现 MCP 服务器行。',
      'common.generated': '生成于',
    }

    const EN = {
      'panel.title': 'Mounts',
      'panel.subtitle': 'What this project mounts: project brief, memory, skills, and MCP — globally and per workspace, with a status dot on skills and MCP rows.',
      'panel.readonly': 'Read-only + handoff',
      'panel.refresh': 'Refresh',
      'brief.copy': 'Copy brief',
      'brief.empty': 'No brief yet (no rules or memory files found)',
      'panel.loading': 'Reading…',
      'panel.error': 'Failed to read',
      'panel.retry': 'Retry',
      'meta.workspaceCount': '%s workspaces',
      'meta.patch': 'Patch',
      'meta.inferred': '(inferred)',
      'meta.inferredHint': 'Profile name inferred from the install path',
      'section.brief': 'Project brief',
      'root.global': 'Global',
      'root.workspace': 'Workspace',
      'status.on': 'Active',
      'status.off': 'Inactive (shadowed or not mounted)',
      'status.unknown': 'No effective data',
      'status.session': 'Session',
      'status.catalog': 'Catalog',
      'status.scope': "Dots use the selected workspace's session or catalog",
      'status.scopeLabel': 'Effective view',
      'section.rules': 'Rules',
      'section.memory': 'Memory',
      'section.skills': 'Skills',
      'section.mcp': 'MCP servers',
      'section.handoff': 'Handoff',
      'section.team': 'Team',
      'section.engines': 'Engines',
      'engines.none': 'None',
      'handoff.none': 'None',
      'handoff.noneHint': 'None (write to .dsh-mounts/handoff.md)',
      'handoff.edit': 'Edit',
      'handoff.write': 'Write handoff',
      'handoff.save': 'Save',
      'handoff.saving': 'Saving…',
      'handoff.cancel': 'Cancel',
      'handoff.placeholder': 'Time / version / state / open issues / next step',
      'handoff.saved': 'Handoff saved',
      'handoff.saveFailed': 'Failed to save handoff',
      'team.none': 'Not detected',
      'team.members': 'Members',
      'team.tasks': 'Tasks',
      'team.unparsed': 'team.json is not parseable',
      'team.count': '%s members · %s tasks',
      'mcp.projectEmpty': 'No project-level MCP configured',
      'mcp.external': 'External',
      'mcp.active': 'active',
      'mcp.configured': 'configured',
      'mcp.externalHint': '.mcp.json is an external format; DSH does not mount it. Use .dsh/mcp.json instead.',
      'workspace.empty': 'No registered workspace',
      'brief.full': 'Full brief',
      'brief.hint': 'Rules, memory, skills, MCP, team and handoff',
      'label.sections': 'sections',
      'memory.workspaces': '%s workspaces · %s files',
      'memory.noRules': 'No instruction files',
      'memory.noMemory': 'No memory files',
      'memory.folded': '%s folded',
      'detail.open': 'Open',
      'detail.path': 'Path',
      'detail.sections': 'Sections',
      'detail.desc': 'Description',
      'detail.source': 'Source',
      'detail.row': 'Patch row',
      'detail.title': 'Title',
      'detail.preset': 'Owning preset',
      'detail.target': 'Target',
      'detail.env': 'env',
      'detail.copy': 'Copy path',
      'detail.copied': 'Copied to clipboard',
      'detail.copyFailed': 'Copy failed: the browser denied clipboard access',
      'detail.openFailed': 'Failed to open. The path may be a directory junction; the target location was used.',
      'rules.empty': 'No global AGENTS.md found.',
      'rules.inject': 'Auto-injected',
      'rules.injectHint': 'This file is injected into every session of this workspace',
      'memory.empty': 'No memory stores found.',
      'memory.emptyHint': 'Put memory files in a workspace memory/ directory (<ws>/memory, .dsh/memory, .agents/memory).',
      'skills.global': 'Global skills',
      'skills.workspace': 'Workspace skills',
      'skills.globalEmpty': 'No global skills found.',
      'skills.workspaceEmpty': 'No workspace skills found.',
      'mcp.empty': 'No MCP server rows found.',
      'common.generated': 'Generated',
    }

    const CSS = `
.dmp-root{--dmp-ease:cubic-bezier(.2,0,0,1);--dmp-dur:170ms;height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);}
.dmp-inner{max-width:1020px;margin:0 auto;padding:30px 34px 76px;animation:dmp-enter var(--dmp-dur) var(--dmp-ease) both;}
@keyframes dmp-enter{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:none;}}
.dmp-head{display:flex;align-items:flex-start;gap:16px;}
.dmp-title{font-size:20px;font-weight:600;letter-spacing:.01em;}
.dmp-sub{margin-top:6px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.dmp-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none;}
.dmp-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.dmp-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary);}
.dmp-chip.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary);}
.dmp-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;font-size:12px;line-height:18px;cursor:pointer;font-family:inherit;transition:background-color var(--dmp-dur) var(--dmp-ease),border-color var(--dmp-dur) var(--dmp-ease),color var(--dmp-dur) var(--dmp-ease),transform var(--dmp-dur) var(--dmp-ease);}
.dmp-btn:hover{border-color:var(--dsw-alias-border-l2);}
.dmp-btn:active:not(:disabled){transform:scale(.97);}
.dmp-btn:disabled{opacity:.55;cursor:default;}
.dmp-meta{display:flex;align-items:baseline;gap:20px;margin-top:16px;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;}
.dmp-meta-item{display:flex;align-items:baseline;gap:6px;min-width:0;}
.dmp-meta-key{flex:none;}
.dmp-meta-value{min-width:0;overflow:hidden;text-overflow:ellipsis;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-primary);}
.dmp-block{margin-top:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;}
.dmp-block-head{display:flex;align-items:center;gap:10px;width:100%;padding-block:12px;padding-right:16px;cursor:pointer;transition:background-color var(--dmp-dur) var(--dmp-ease);}
.dmp-block-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-block-toggle{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:0;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dmp-block-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-block-head.has-action .dmp-block-toggle{flex:0 1 auto;}
.dmp-block-action{flex:none;display:flex;align-items:center;min-width:0;}
.dmp-block-action .dmp-picker{margin-right:0;}
.dmp-arrow{flex:none;display:inline-block;width:12px;font-size:11px;color:var(--dsw-alias-label-secondary);transition:transform var(--dmp-dur) var(--dmp-ease);transform-origin:50% 50%;}
.dmp-arrow.is-open{transform:rotate(90deg);}
.dmp-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--dmp-dur) var(--dmp-ease);}
.dmp-collapse.is-open{grid-template-rows:1fr;}
.dmp-collapse-inner{min-height:0;overflow:hidden;transition:padding-block var(--dmp-dur) var(--dmp-ease),border-color var(--dmp-dur) var(--dmp-ease);}
.dmp-collapse:not(.is-open) > .dmp-collapse-inner{padding-block:0;border-top-color:transparent;}
.dmp-block-title{font-size:13.5px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-block-count{margin-left:auto;font-size:12.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.dmp-block-body{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-mem-head{display:flex;align-items:baseline;gap:6px;width:100%;padding-block:9px;padding-right:16px;background:none;border:0;color:inherit;font:inherit;font-size:11.5px;text-align:left;cursor:pointer;color:var(--dsw-alias-label-secondary);transition:background-color var(--dmp-dur) var(--dmp-ease);}
.dmp-mem-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-mem-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-mem-head b{font-weight:500;color:var(--dsw-alias-label-primary);}
.dmp-mem-count{font-variant-numeric:tabular-nums;}
.dmp-mem-latest{margin-left:auto;font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmp-mem-body{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-file{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:12px;padding-block:3px;padding-right:16px;font-size:11.5px;line-height:1.6;}
.dmp-file.dmp-rule-row{grid-template-columns:minmax(0,1fr) auto auto auto;gap:12px;padding-block:3px;padding-right:16px;font-size:11.5px;line-height:1.6;}
.dmp-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);}
.dmp-file-meta{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.dmp-open-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:6px;padding:0 8px;font-size:11px;line-height:18px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background-color var(--dmp-dur) var(--dmp-ease),border-color var(--dmp-dur) var(--dmp-ease),transform var(--dmp-dur) var(--dmp-ease);}
.dmp-open-btn:hover{border-color:var(--dsw-alias-border-l2);}
.dmp-open-btn:active{transform:scale(.97);}
.dmp-open-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-open-notice{padding-block:8px;padding-right:16px;font-size:11.5px;color:var(--dsw-alias-state-success-primary);animation:dmp-enter var(--dmp-dur) var(--dmp-ease) both;}
.dmp-open-error{padding-block:8px;padding-right:16px;font-size:11.5px;color:var(--dsw-alias-state-error-primary);animation:dmp-enter var(--dmp-dur) var(--dmp-ease) both;}
.dmp-link-btn{appearance:none;border:0;background:none;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11px;line-height:18px;cursor:pointer;padding:0 2px;}
.dmp-link-btn:hover{text-decoration:underline;}
.dmp-link-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-handoff-edit{padding-block:4px 10px;padding-right:16px;}
.dmp-handoff-input{display:block;width:100%;box-sizing:border-box;min-height:92px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;line-height:1.6;padding:8px 10px;}
.dmp-handoff-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-handoff-edit .dmp-brief-actions{margin-top:8px;margin-bottom:0;}
.dmp-item{border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-item:first-child{border-top:0;}
.dmp-item.static{display:flex;align-items:center;gap:14px;padding-block:10px;padding-right:16px;}
.dmp-item.expandable{display:block;}
.dmp-row-head{display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding-block:10px;padding-right:16px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color var(--dmp-dur) var(--dmp-ease);}
.dmp-row-head:hover{background:var(--dsw-alias-bg-layer-2);}
.dmp-row-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.dmp-row-body{padding-block:2px 12px;padding-right:16px;font-size:11.5px;line-height:1.7;color:var(--dsw-alias-label-secondary);}
.dmp-detail-line{display:flex;gap:8px;min-width:0;}
.dmp-detail-label{flex:none;opacity:.8;}
.dmp-detail-value{min-width:0;word-break:break-word;color:var(--dsw-alias-label-secondary);}
.dmp-item-text{flex:1;min-width:0;}
.dmp-line1{display:flex;align-items:baseline;gap:8px;min-width:0;}
.dmp-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-secondary{margin-top:2px;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-item-meta{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right;max-width:220px;overflow:hidden;text-overflow:ellipsis;}
.dmp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
.dmp-empty{padding-block:12px;padding-right:16px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.dmp-empty-hint{margin-top:2px;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary);}
.dmp-brief-actions{display:flex;justify-content:flex-end;gap:8px;margin-bottom:6px;}
.dmp-picker{position:relative;display:inline-flex;margin-right:auto;max-width:320px;}
.dmp-select-button{appearance:none;display:inline-flex;align-items:center;gap:8px;max-width:320px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 10px;font:inherit;font-size:11.5px;line-height:18px;cursor:pointer;transition:background-color var(--dmp-dur) var(--dmp-ease),border-color var(--dmp-dur) var(--dmp-ease),box-shadow var(--dmp-dur) var(--dmp-ease),transform var(--dmp-dur) var(--dmp-ease);}
.dmp-select-button:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);}
.dmp-select-button:active{transform:scale(.97);}
.dmp-select-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.dmp-select-button.is-open{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);animation:dmp-press 200ms var(--dmp-ease);}
.dmp-picker-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-picker-caret{flex:none;font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);transition:transform var(--dmp-dur) var(--dmp-ease);}
.dmp-select-button.is-open .dmp-picker-caret{transform:rotate(180deg);}
.dmp-select-button.dmp-title-select{border-color:transparent;background:none;padding:2px 6px;font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary);}
.dmp-select-button.dmp-title-select:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);}
.dmp-select-button.dmp-title-select.is-open{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);}
.dmp-menu{--dmp-ease:cubic-bezier(.2,0,0,1);--dmp-dur:170ms;position:fixed;z-index:1000;max-height:260px;overflow:auto;padding:4px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;box-shadow:0 16px 36px -20px rgba(0,0,0,.55);animation:dmp-menu-in 170ms cubic-bezier(.2,0,0,1) both;}
.dmp-menu-option{display:flex;flex-direction:column;gap:1px;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:6px 10px;border-radius:6px;cursor:pointer;animation:dmp-option-in 160ms cubic-bezier(.2,0,0,1) both;animation-delay:calc(var(--i,0) * 14ms);transition:background-color var(--dmp-dur) var(--dmp-ease);}
.dmp-menu-option:hover,.dmp-menu-option:focus-visible{background:var(--dsw-alias-bg-layer-2);outline:none;}
.dmp-menu-option:focus-visible{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);}
.dmp-menu-option.is-selected{color:var(--dsw-alias-brand-primary);}
.dmp-menu-name{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dmp-menu-path{font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
@keyframes dmp-menu-in{from{opacity:0;transform:translateY(-5px) scale(.98);}to{opacity:1;transform:none;}}
@keyframes dmp-option-in{from{opacity:0;transform:translateX(-3px);}to{opacity:1;transform:none;}}
@keyframes dmp-press{0%{transform:scale(.97);}55%{transform:scale(1.015);}100%{transform:scale(1);}}
.dmp-brief{margin:0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.65;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow:auto;}
.dmp-dot{display:inline-block;width:6px;height:6px;border-radius:50%;flex:none;margin-left:2px;position:relative;top:-1px;transition:background-color var(--dmp-dur) var(--dmp-ease),opacity var(--dmp-dur) var(--dmp-ease);}
.dmp-dot.ok{background:var(--dsw-alias-state-success-primary);}
.dmp-dot.bad{background:var(--dsw-alias-state-error-primary);}
.dmp-dot.unknown{background:var(--dsw-alias-label-secondary);opacity:.45;}
.dmp-indent-0{padding-left:16px;}
.dmp-indent-1{padding-left:32px;}
.dmp-indent-2{padding-left:48px;}
.dmp-indent-3{padding-left:64px;}
.dmp-warning{padding-block:8px;padding-right:16px;font-size:11px;line-height:1.6;color:var(--dsw-alias-state-warn-primary);border-top:1px solid var(--dsw-alias-border-l1);}
.dmp-foot{margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
@media (prefers-reduced-motion: reduce){.dmp-inner,.dmp-collapse,.dmp-arrow,.dmp-btn,.dmp-open-btn,.dmp-select-button,.dmp-select-button .dmp-picker-caret,.dmp-block-head,.dmp-mem-head,.dmp-row-head,.dmp-open-notice,.dmp-open-error,.dmp-menu,.dmp-menu-option{animation:none!important;transition:none!important;}}
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

    function mcpCountText(configured, active, t) {
      const label = typeof t === 'function' ? t : (key) => ZN[key] || key
      return label('mcp.configured') + ' ' + configured + ' · ' + label('mcp.active') + ' ' + (active === null ? '—' : active)
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

    function shortDate(iso) {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return String(iso || '').slice(0, 10)
      return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
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
          'div',
          {
            className: 'dmp-block-head dmp-indent-0' + (props.action ? ' has-action' : ''),
            onClick: (event) => {
              const target = event.target
              if (target && typeof target.closest === 'function' && target.closest('.dmp-block-toggle, .dmp-block-action')) {
                return
              }
              props.onToggle()
            },
          },
          h(
            'button',
            {
              type: 'button',
              className: 'dmp-block-toggle',
              'aria-expanded': props.open,
              'aria-controls': panelId,
              onClick: props.onToggle,
            },
            h('span', { className: 'dmp-arrow' + (props.open ? ' is-open' : ''), 'aria-hidden': true }, '▸'),
            h('span', { className: 'dmp-block-title' }, props.title),
          ),
          props.action ? h('div', { className: 'dmp-block-action' }, props.action) : null,
          props.count != null ? h('span', { className: 'dmp-block-count' }, String(props.count)) : null,
        ),
        h(
          'div',
          {
            id: panelId,
            className: 'dmp-collapse' + (props.open ? ' is-open' : ''),
            'aria-hidden': !props.open,
            inert: !props.open,
          },
          h('div', { className: 'dmp-collapse-inner dmp-block-body' }, props.children),
        ),
      )
    }

    function Group(props) {
      const bodyId = 'dmp-group-' + props.id
      return h(
        'div',
        { className: 'dmp-group' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-mem-head dmp-indent-' + (props.depth || 1),
            'aria-expanded': props.open,
            'aria-controls': bodyId,
            onClick: props.onToggle,
          },
          h('span', { className: 'dmp-arrow' + (props.open ? ' is-open' : ''), 'aria-hidden': true }, '▸'),
          h('b', null, props.label),
          props.count != null ? h('span', { className: 'dmp-mem-count' }, props.count) : null,
        ),
        h(
          'div',
          {
            id: bodyId,
            className: 'dmp-collapse' + (props.open ? ' is-open' : ''),
            'aria-hidden': !props.open,
            inert: !props.open,
          },
          h('div', { className: 'dmp-collapse-inner dmp-mem-body' }, props.children),
        ),
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

      const depth = Number.isInteger(props.depth) ? props.depth : 0
      const headClass = 'dmp-indent-' + depth
      const bodyClass = 'dmp-indent-' + (depth + 1)

      if (!props.expandable) {
        return h('div', { className: 'dmp-item static ' + headClass }, text, meta)
      }

      const bodyId = 'dmp-row-' + props.id
      return h(
        'div',
        { className: 'dmp-item expandable' },
        h(
          'button',
          {
            type: 'button',
            className: 'dmp-row-head ' + headClass,
            'aria-expanded': Boolean(props.open),
            'aria-controls': bodyId,
            onClick: props.onToggle,
          },
          h('span', { className: 'dmp-arrow' + (props.open ? ' is-open' : ''), 'aria-hidden': true }, '▸'),
          text,
          meta,
        ),
        h(
          'div',
          {
            id: bodyId,
            className: 'dmp-collapse' + (props.open ? ' is-open' : ''),
            'aria-hidden': !props.open,
            inert: !props.open,
          },
          h('div', { className: 'dmp-collapse-inner dmp-row-body ' + bodyClass }, props.detail),
        ),
      )
    }

    function WorkspacePicker(props) {
      const [open, setOpen] = React.useState(false)
      const [pos, setPos] = React.useState(null)
      const triggerRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const selected = props.workspaces.find((entry) => entry.name === props.value) || props.workspaces[0]

      React.useEffect(() => {
        if (!open) return undefined
        const place = () => {
          const el = triggerRef.current
          if (!el) return
          const rect = el.getBoundingClientRect()
          const menuHeight = Math.min(260, props.workspaces.length * 46 + 8)
          const up = window.innerHeight - rect.bottom < menuHeight + 8 && rect.top > menuHeight
          const width = Math.max(rect.width, 200)
          setPos({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
            minWidth: width,
            ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
          })
        }
        place()
        const onPointer = (event) => {
          if (triggerRef.current && triggerRef.current.contains(event.target)) return
          if (menuRef.current && menuRef.current.contains(event.target)) return
          setOpen(false)
        }
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          setOpen(false)
          if (triggerRef.current) triggerRef.current.focus()
        }
        const onViewport = () => setOpen(false)
        document.addEventListener('pointerdown', onPointer, true)
        document.addEventListener('keydown', onKey)
        window.addEventListener('resize', onViewport)
        window.addEventListener('scroll', onViewport, true)
        return () => {
          document.removeEventListener('pointerdown', onPointer, true)
          document.removeEventListener('keydown', onKey)
          window.removeEventListener('resize', onViewport)
          window.removeEventListener('scroll', onViewport, true)
        }
      }, [open, props.workspaces.length])

      React.useEffect(() => {
        if (!open) return undefined
        const frame = requestAnimationFrame(() => {
          const menu = menuRef.current
          if (!menu) return
          const target = menu.querySelector('[aria-selected="true"]') || menu.querySelector('.dmp-menu-option')
          if (target) target.focus()
        })
        return () => cancelAnimationFrame(frame)
      }, [open, pos])

      const onMenuKeyDown = (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault()
        const menu = menuRef.current
        if (!menu) return
        const items = Array.from(menu.querySelectorAll('.dmp-menu-option'))
        if (!items.length) return
        const current = items.indexOf(document.activeElement)
        const next =
          event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
        items[next].focus()
      }

      const menu =
        open && pos
          ? h(
              'div',
              {
                ref: menuRef,
                className: 'dmp-menu',
                role: 'listbox',
                'aria-label': props.ariaLabel,
                style: {
                  left: pos.left,
                  top: pos.top,
                  bottom: pos.bottom,
                  minWidth: pos.minWidth,
                  maxWidth: Math.max(200, Math.min(320, window.innerWidth - pos.left - 8)),
                },
                onKeyDown: onMenuKeyDown,
              },
              props.workspaces.map((entry, index) =>
                h(
                  'button',
                  {
                    key: entry.name,
                    type: 'button',
                    role: 'option',
                    'aria-selected': entry.name === props.value,
                    className: 'dmp-menu-option' + (entry.name === props.value ? ' is-selected' : ''),
                    style: { '--i': index },
                    title: entry.path,
                    onClick: () => {
                      props.onChange(entry.name)
                      setOpen(false)
                      if (triggerRef.current) triggerRef.current.focus()
                    },
                  },
                  h('span', { className: 'dmp-menu-name' }, entry.name),
                  h('span', { className: 'dmp-menu-path' }, entry.path),
                ),
              ),
            )
          : null

      return h(
        'div',
        { className: 'dmp-picker' },
        h(
          'button',
          {
            ref: triggerRef,
            type: 'button',
            className: 'dmp-select-button' + (props.compact ? ' dmp-title-select' : '') + (open ? ' is-open' : ''),
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            'aria-label': props.ariaLabel,
            title: selected ? selected.path : '',
            onClick: () => setOpen((value) => !value),
            onKeyDown: (event) => {
              if (event.key !== 'ArrowDown') return
              event.preventDefault()
              setOpen(true)
            },
          },
          h('span', { className: 'dmp-picker-label' }, selected ? selected.name : '—'),
          h('span', { className: 'dmp-picker-caret', 'aria-hidden': true }, '▾'),
        ),
        menu && ReactDOM && typeof ReactDOM.createPortal === 'function'
          ? ReactDOM.createPortal(menu, document.body)
          : menu,
      )
    }

    function useInventory(workspace) {
      const [state, setState] = React.useState({ status: 'loading', data: null, error: null })
      const load = React.useCallback(() => {
        let live = true
        setState({ status: 'loading', data: null, error: null })
        const url = workspace ? API + '?workspace=' + encodeURIComponent(workspace) : API
        fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
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
      }, [workspace])
      React.useEffect(load, [load])
      return { ...state, reload: load }
    }

    if (typeof globalThis !== 'undefined' && globalThis.__DSH_MOUNTS_TEST__) {
      globalThis.__DSH_MOUNTS_TEST__.helpers = { shortDate, bytes, mcpCountText }
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
          const [openBlocks, setOpenBlocks] = React.useState({})
          const [openSections, setOpenSections] = React.useState({})
          const [briefPick, setBriefPick] = React.useState(() => {
            try {
              return window.localStorage.getItem('dsh-mounts.brief-workspace')
            } catch {
              return null
            }
          })
          const inventory = useInventory(briefPick)
          const [openMemoryWorkspaces, setOpenMemoryWorkspaces] = React.useState({})
          const [openRows, setOpenRows] = React.useState({})
          const [openSkillsScope, setOpenSkillsScope] = React.useState({})
          const [openSkillWorkspaces, setOpenSkillWorkspaces] = React.useState({})
          const [notice, setNotice] = React.useState(null)
          const [openError, setOpenError] = React.useState(null)
          const [handoffDraft, setHandoffDraft] = React.useState(null)
          const [handoffSaving, setHandoffSaving] = React.useState(false)
          const handoffInputRef = React.useRef(null)
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
          const toggleSection = (id) => setOpenSections((previous) => ({ ...previous, [id]: !previous[id] }))
          const pickWorkspace = (name) => {
            setBriefPick(name)
            setHandoffDraft(null)
            try {
              window.localStorage.setItem('dsh-mounts.brief-workspace', name)
            } catch {
              /* storage unavailable */
            }
          }
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

          const openFile = (target, copyTarget) => {
            setOpenError(null)
            setNotice(null)
            if (!canOpen) {
              copyPath(copyTarget || target)
              return
            }
            openOnHost(target).then(
              () => {},
              () => setOpenError(t('detail.openFailed')),
            )
          }

          const saveHandoff = (workspacePath) => {
            if (!workspacePath || handoffDraft === null || handoffSaving) return
            const text = handoffInputRef.current ? handoffInputRef.current.value : handoffDraft
            setHandoffSaving(true)
            setOpenError(null)
            setNotice(null)
            fetch(HANDOFF_API, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ workspace: workspacePath, text }),
            })
              .then(async (response) => {
                const payload = await response.json().catch(() => ({}))
                if (!response.ok || !payload.ok) throw new Error(payload.error || 'HTTP ' + response.status)
                return payload
              })
              .then(() => {
                setHandoffDraft(null)
                setNotice(t('handoff.saved'))
                inventory.reload()
              })
              .catch((error) => {
                setOpenError(t('handoff.saveFailed') + '：' + String((error && error.message) || error))
              })
              .finally(() => setHandoffSaving(false))
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
            const warnings = Array.isArray(data.warnings) ? data.warnings : []
            const configWarnings = Array.isArray(data.configWarnings) ? data.configWarnings : []
            const warningsFor = (prefix) => configWarnings.filter((warning) => String(warning).includes(prefix))
            const warningLines = (list, keyPrefix) =>
              list.map(
                (warning, index) =>
                  h('div', { className: 'dmp-warning dmp-indent-1', key: keyPrefix + index }, warning),
              )
            const profile = data.profile || {}
            const brief = typeof data.brief === 'string' ? data.brief : ''
            const briefWorkspace = data.briefWorkspace || ''
            const engines = (Array.isArray(data.engines) ? data.engines : []).filter((engine) => engine.installed)
            const effective = data.effective || null
            const effectiveAvailable = Boolean(effective && effective.available)
            const effectiveScope =
              effective && effective.scope ? effective.scope : effectiveAvailable ? 'session' : 'catalog'
            const effectiveNames = new Set(
              effectiveAvailable && Array.isArray(effective.skills) ? effective.skills.map((skill) => skill.name) : [],
            )
            const effectivePathByName = new Map(
              effectiveAvailable && Array.isArray(effective.skills)
                ? effective.skills.map((skill) => [skill.name, skill.path])
                : [],
            )
            const effectiveServers = new Set(
              effectiveAvailable && Array.isArray(effective.tools.servers)
                ? effective.tools.servers.map((server) => server.server)
                : [],
            )
            const defaultBriefName = briefWorkspace || (workspaces[0] && workspaces[0].name) || ''
            const activeBrief =
              workspaces.find((entry) => entry.name === (briefPick || defaultBriefName)) || null
            const briefText = activeBrief ? activeBrief.brief || '' : brief
            const briefName = activeBrief ? activeBrief.name : defaultBriefName

            const home = String(globalRules.path || '')
              .replace(/[\\/]\.dsh[\\/]AGENTS\.md$/i, '')
              .replace(/\\/g, '/')
            const short = (value) => {
              const text = String(value || '').replace(/\\/g, '/')
              return home && text.toLowerCase().startsWith(home.toLowerCase()) ? '~' + text.slice(home.length) : text
            }

            const sectionMeta = (entry) =>
              bytes(entry.bytes) + ' · ' + (entry.sections || []).length + ' ' + t('label.sections')

            const pickName = briefPick || briefWorkspace || (workspaces[0] && workspaces[0].name) || ''
            const selectedEntry =
              workspaces.find((entry) => entry.name === pickName) ||
              workspaces.find((entry) => entry.name === briefWorkspace) ||
              workspaces[0] ||
              null
            const fileSkillNames = new Set(skills.map((skill) => skill.name))
            const bundledSkills = effectiveAvailable
              ? effective.skills
                  .filter((skill) => !fileSkillNames.has(skill.name))
                  .map((skill) => ({
                    name: skill.name,
                    desc: skill.description || '',
                    bytes: 0,
                    scope: 'global',
                    source: skill.source || 'bundled',
                    path: '',
                  }))
              : []
            const displaySkills = [...skills, ...bundledSkills]
            const globalSkills = displaySkills.filter((skill) => skill.scope === 'global')
            const workspaceSkills = selectedEntry
              ? skills.filter(
                  (skill) =>
                    skill.scope === 'workspace' &&
                    (skill.workspacePath === selectedEntry.path || skill.workspace === selectedEntry.name),
                )
              : []
            const globalMemory =
              data.globalMemory && Array.isArray(data.globalMemory.files)
                ? data.globalMemory
                : { count: 0, files: [] }
            const globalMcp = servers
            const projectMcp = selectedEntry && Array.isArray(selectedEntry.projectMcp) ? selectedEntry.projectMcp : []
            const workspaceItemCount = selectedEntry
              ? (selectedEntry.rules || []).length +
                ((selectedEntry.memory && selectedEntry.memory.count) || 0) +
                workspaceSkills.length +
                projectMcp.length +
                (selectedEntry.handoff ? 1 : 0) +
                (selectedEntry.team ? 1 : 0)
              : 0

            const dot = (on, label) =>
              h('span', {
                className: 'dmp-dot ' + (on === null ? 'unknown' : on ? 'ok' : 'bad'),
                'aria-label': label || (on === null ? t('status.unknown') : on ? t('status.on') : t('status.off')),
              })
            const skillDot = (skill) => {
              const winPath = effectivePathByName.get(skill.name)
              const on = effectiveAvailable
                ? effectiveNames.has(skill.name) && (!skill.path || !winPath || winPath === skill.path)
                : null
              return dot(on)
            }
            const mcpOn = (server) => {
              if (server.sourceKind === 'external') return null
              if (!effectiveAvailable || effectiveScope === 'catalog') return null
              return effectiveServers.has(String(server.server || ''))
            }
            const mcpDot = (server) => {
              if (server.sourceKind === 'external') return dot(null, t('mcp.external'))
              if (mcpOn(server) === null) return dot(null, t('status.catalog'))
              return dot(mcpOn(server))
            }
            const mcpCount = (list) => {
              const configured = list.length
              const active =
                effectiveAvailable && effectiveScope === 'session'
                  ? list.filter((server) => mcpOn(server) === true).length
                  : null
              return mcpCountText(configured, active, t)
            }

            const emptyLine = (text, depth) =>
              h('div', { className: 'dmp-empty dmp-indent-' + depth, key: 'empty-' + depth + '-' + String(text) }, text)

            const ruleRow = (rule, depth) =>
              h(Row, {
                key: rule.path,
                id: 'rule-' + rule.path,
                name: rule.file,
                secondary: bytes(rule.bytes) + ' · ' + (rule.sections || []).length + ' ' + t('label.sections'),
                mono: true,
                tag: h('span', { className: 'dmp-chip' }, t('rules.inject')),
                expandable: true,
                depth,
                open: Boolean(openRows['rule-' + rule.path]),
                onToggle: () => toggleRow('rule-' + rule.path),
                detail: detailLines([
                  [t('detail.path'), rule.path],
                  [t('detail.sections'), (rule.sections || []).length ? rule.sections.join('、') : '—'],
                ]),
              })

            const memoryRow = (file, depth) => {
              const target = joinPath(file.dir, file.name)
              return h(
                'div',
                { className: 'dmp-file dmp-indent-' + depth, key: (file.dir || '') + '|' + file.name, title: target },
                h('span', { className: 'dmp-file-name' }, file.name),
                h('span', { className: 'dmp-file-meta' }, bytes(file.bytes) + ' · ' + shortDate(file.mtime)),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dmp-open-btn',
                    title: target,
                    onClick: () => openFile(file.realPath || target, target),
                  },
                  canOpen ? t('detail.open') : t('detail.copy'),
                ),
              )
            }

            const skillRow = (skill, depth) => {
              const source = skill.source || skill.label || (skill.scope === 'global' ? 'global' : 'workspace')
              const key = skill.path || 'effective:' + skill.name
              return h(Row, {
                key,
                id: 'skill-' + key,
                name: skill.name,
                secondary: skill.desc || '—',
                meta: skill.bytes ? bytes(skill.bytes) : source,
                tag: skillDot(skill),
                expandable: true,
                depth,
                open: Boolean(openRows['skill-' + key]),
                onToggle: () => toggleRow('skill-' + key),
                detail: detailLines([
                  [t('detail.source'), source],
                  [t('detail.path'), skill.path || '—'],
                  [t('detail.desc'), skill.desc || '—'],
                ]),
              })
            }

            const mcpRow = (server, depth) => {
              const key = (server.row || server.server) + '|' + (server.target || '')
              return h(Row, {
                key,
                id: 'mcp-' + key,
                name: (server.server || server.row) + ' · ' + (server.transport || '?'),
                secondary: server.target || '—',
                meta: server.sourceKind === 'external' ? t('mcp.external') : server.presetId || '',
                tag: mcpDot(server),
                expandable: true,
                depth,
                open: Boolean(openRows['mcp-' + key]),
                onToggle: () => toggleRow('mcp-' + key),
                detail: detailLines([
                  [t('detail.row'), server.row],
                  [t('detail.source'), server.source || '—'],
                  [t('detail.env'), (server.env || []).join('、') || '—'],
                  [t('detail.target'), server.target || '—'],
                  [t('detail.preset'), server.presetId || '—'],
                ]),
              })
            }

            const briefFull = (text, depth) =>
              h(Row, {
                key: 'brief-full',
                id: 'brief-full',
                name: t('brief.full'),
                secondary: t('brief.hint'),
                depth,
                expandable: true,
                open: Boolean(openRows['brief-full']),
                onToggle: () => toggleRow('brief-full'),
                detail: [
                  h(
                    'div',
                    { className: 'dmp-brief-actions', key: 'brief-copy' },
                    h(
                      'button',
                      { className: 'dmp-btn', type: 'button', disabled: !text, onClick: () => copyPath(text) },
                      t('brief.copy'),
                    ),
                  ),
                  h('pre', { className: 'dmp-brief', key: 'brief-text' }, text || t('brief.empty')),
                ],
              })

            const section = (id, label, count, depth, children) =>
              h(
                Group,
                {
                  key: id,
                  id,
                  label,
                  count,
                  depth,
                  open: Boolean(openSections[id]),
                  onToggle: () => toggleSection(id),
                },
                children,
              )

            const globalBriefRows = [
              h(Row, {
                key: 'g-profile',
                name: 'profile · ' + (profile.name || '—'),
                secondary: profile.patch || '—',
                mono: true,
                depth: 2,
              }),
              h(Row, {
                key: 'g-rules',
                name: t('section.rules'),
                secondary: globalRules.exists ? '1 · ' + sectionMeta(globalRules) : '—',
                depth: 2,
              }),
              h(Row, { key: 'g-skills', name: t('section.skills'), secondary: String(globalSkills.length), depth: 2 }),
              h(Row, { key: 'g-mcp', name: t('section.mcp'), secondary: String(globalMcp.length), depth: 2 }),
              h(Row, {
                key: 'g-engines',
                name: t('section.engines'),
                secondary: engines.length ? engines.map((engine) => engine.label).join('、') : t('engines.none'),
                depth: 2,
              }),
            ]

            const teamDetail = (team) => {
              if (team.unknown) {
                return [h('div', { className: 'dmp-detail-line', key: 'team-unknown' }, t('team.unparsed'))]
              }
              const members = (team.members || [])
                .map((member) => [member.name, member.role, member.status].filter(Boolean).join(' · '))
                .join('、')
              const tasks = (team.tasks || [])
                .map((task) => [task.subject, task.status, task.assignee].filter(Boolean).join(' · '))
                .join('、')
              return [
                h(
                  'div',
                  { className: 'dmp-detail-line', key: 'team-members' },
                  h('span', { className: 'dmp-detail-label' }, t('team.members')),
                  h('span', { className: 'dmp-detail-value' }, members || '—'),
                ),
                h(
                  'div',
                  { className: 'dmp-detail-line', key: 'team-tasks' },
                  h('span', { className: 'dmp-detail-label' }, t('team.tasks')),
                  h('span', { className: 'dmp-detail-value' }, tasks || '—'),
                ),
              ]
            }

            const wsBriefRows = selectedEntry
              ? [
                  h(Row, {
                    key: 'w-rules',
                    name: t('section.rules'),
                    secondary: String((selectedEntry.rules || []).length),
                    depth: 2,
                  }),
                  h(Row, {
                    key: 'w-memory',
                    name: t('section.memory'),
                    secondary: String((selectedEntry.memory && selectedEntry.memory.count) || 0),
                    depth: 2,
                  }),
                  h(Row, {
                    key: 'w-skills',
                    name: t('section.skills'),
                    secondary: String(workspaceSkills.length),
                    depth: 2,
                  }),
                  h(Row, {
                    key: 'w-mcp',
                    name: t('section.mcp'),
                    secondary: String(projectMcp.length),
                    depth: 2,
                  }),
                  h(Row, {
                    key: 'w-handoff',
                    name: t('section.handoff'),
                    secondary: selectedEntry.handoff ? selectedEntry.handoff.preview : t('handoff.noneHint'),
                    tag: h(
                      'button',
                      {
                        className: 'dmp-link-btn',
                        type: 'button',
                        onClick: () =>
                          setHandoffDraft(
                            selectedEntry.handoff && typeof selectedEntry.handoff.text === 'string'
                              ? selectedEntry.handoff.text
                              : '',
                          ),
                      },
                      selectedEntry.handoff ? t('handoff.edit') : t('handoff.write'),
                    ),
                    depth: 2,
                  }),
                  handoffDraft !== null
                    ? h(
                        'div',
                        { className: 'dmp-handoff-edit dmp-indent-2', key: 'handoff-edit' },
                        h('textarea', {
                          className: 'dmp-handoff-input',
                          rows: 5,
                          ref: handoffInputRef,
                          defaultValue: handoffDraft,
                          placeholder: t('handoff.placeholder'),
                        }),
                        h(
                          'div',
                          { className: 'dmp-brief-actions' },
                          h(
                            'button',
                            {
                              className: 'dmp-btn',
                              type: 'button',
                              disabled: handoffSaving,
                              onClick: () => saveHandoff(selectedEntry.path),
                            },
                            handoffSaving ? t('handoff.saving') : t('handoff.save'),
                          ),
                          h(
                            'button',
                            {
                              className: 'dmp-btn',
                              type: 'button',
                              disabled: handoffSaving,
                              onClick: () => setHandoffDraft(null),
                            },
                            t('handoff.cancel'),
                          ),
                        ),
                      )
                    : null,
                  selectedEntry.team
                    ? h(Row, {
                        key: 'w-team',
                        id: 'team',
                        name: t('section.team'),
                        secondary: selectedEntry.team.unknown
                          ? t('team.unparsed')
                          : String(t('team.count'))
                              .replace('%s', String(selectedEntry.team.members.length))
                              .replace('%s', String(selectedEntry.team.tasks.length)),
                        expandable: true,
                        depth: 2,
                        open: Boolean(openRows.team),
                        onToggle: () => toggleRow('team'),
                        detail: teamDetail(selectedEntry.team),
                      })
                    : h(Row, {
                        key: 'w-team',
                        name: t('section.team'),
                        secondary: t('team.none'),
                        depth: 2,
                      }),
                ]
              : []

            const globalBody = [
              section('global:brief', t('section.brief'), null, 1, globalBriefRows),
              section(
                'global:memory',
                t('section.memory'),
                (globalRules.exists ? 1 : 0) + globalMemory.count,
                1,
                [
                  globalRules.exists
                    ? ruleRow(
                        {
                          path: globalRules.path,
                          file: short(globalRules.path),
                          bytes: globalRules.bytes,
                          sections: globalRules.sections,
                        },
                        2,
                      )
                    : null,
                  ...globalMemory.files.slice(0, 30).map((file) => memoryRow(file, 2)),
                  !globalRules.exists && !globalMemory.count ? emptyLine(t('memory.empty'), 2) : null,
                ],
              ),
              section(
                'global:skills',
                t('section.skills'),
                globalSkills.length,
                1,
                globalSkills.length
                  ? [
                      ...globalSkills.map((skill) => skillRow(skill, 2)),
                      warningLines(warningsFor('extraSkillRoots'), 'global-skill-warning-'),
                    ]
                  : [emptyLine(t('skills.globalEmpty'), 2)],
              ),
              section(
                'global:mcp',
                t('section.mcp'),
                mcpCount(globalMcp),
                1,
                globalMcp.length
                  ? [
                      ...globalMcp.map((server) => mcpRow(server, 2)),
                      ...warnings.map((warning, index) =>
                        h('div', { className: 'dmp-warning dmp-indent-2', key: 'global-mcp-warning-' + index }, warning),
                      ),
                      warningLines(warningsFor('extraPatchFiles'), 'global-mcp-config-'),
                    ]
                  : [emptyLine(t('mcp.empty'), 2)],
              ),
            ]

            const workspaceBody = selectedEntry
              ? [
                  section('ws:brief', t('section.brief'), null, 1, [
                    ...wsBriefRows,
                    briefFull(selectedEntry.brief || '', 2),
                  ]),
                  section(
                    'ws:memory',
                    t('section.memory'),
                    (() => {
                      const mem = selectedEntry.memory || { count: 0, folded: 0 }
                      const total = (selectedEntry.rules || []).length + (mem.count || 0)
                      return mem.folded
                        ? total + ' · ' + String(t('memory.folded')).replace('%s', String(mem.folded))
                        : total
                    })(),
                    1,
                    [
                      ...(selectedEntry.rules || []).map((rule) => ruleRow(rule, 2)),
                      ...((selectedEntry.memory && selectedEntry.memory.files) || [])
                        .slice(0, 50)
                        .map((file) => memoryRow(file, 2)),
                      (selectedEntry.rules || []).length === 0 && !(selectedEntry.memory && selectedEntry.memory.count)
                        ? emptyLine(t('memory.empty'), 2)
                        : null,
                    ],
                  ),
                  section(
                    'ws:skills',
                    t('section.skills'),
                    workspaceSkills.length,
                    1,
                    workspaceSkills.length
                      ? workspaceSkills.map((skill) => skillRow(skill, 2))
                      : [emptyLine(t('skills.workspaceEmpty'), 2)],
                  ),
                  section(
                    'ws:mcp',
                    t('section.mcp'),
                    mcpCount(projectMcp),
                    1,
                    projectMcp.length
                      ? [
                          ...projectMcp.map((server) => mcpRow(server, 2)),
                          projectMcp.some((server) => server.sourceKind === 'external')
                            ? h('div', { className: 'dmp-warning dmp-indent-2', key: 'ext-mcp' }, t('mcp.externalHint'))
                            : null,
                        ]
                      : [emptyLine(t('mcp.projectEmpty'), 2)],
                  ),
                ]
              : [emptyLine(t('workspace.empty'), 1)]

            body = h(
              React.Fragment,
              null,
              h(
                'div',
                { className: 'dmp-meta' },
                h(
                  'span',
                  { className: 'dmp-meta-item', title: profile.patch },
                  h('span', { className: 'dmp-meta-key' }, t('meta.patch')),
                  h('b', { className: 'dmp-meta-value' }, String(profile.patch || '').split(/[\\/]/).pop() || '—'),
                  h(Chip, { tone: profile.patchExists ? 'ok' : 'warn' }, profile.patchExists ? '✓' : '·'),
                  profile.inferred
                    ? h('span', { title: t('meta.inferredHint') }, h(Chip, null, t('meta.inferred')))
                    : null,
                ),
                h(
                  'span',
                  { className: 'dmp-meta-item' },
                  h(
                    'span',
                    { className: 'dmp-meta-key' },
                    String(t('meta.workspaceCount')).replace('%s', String(workspaces.length)),
                  ),
                ),
                effectiveAvailable
                  ? h(
                      'span',
                      { className: 'dmp-meta-item', title: t('status.scope') },
                      h('span', { className: 'dmp-meta-key' }, t('status.scopeLabel')),
                      h(
                        Chip,
                        { tone: 'ok' },
                        effectiveScope === 'catalog'
                          ? t('status.catalog')
                          : (effective.agent && effective.agent.preset ? effective.agent.preset + ' · ' : '') +
                              t('status.session'),
                      ),
                    )
                  : null,
              ),
              notice ? h('div', { className: 'dmp-open-notice' }, notice) : null,
              openError ? h('div', { className: 'dmp-open-error' }, openError) : null,
              h(
                Block,
                {
                  id: 'global',
                  title: t('root.global'),
                  count: globalSkills.length + globalMcp.length + (globalRules.exists ? 1 : 0) + globalMemory.count,
                  open: Boolean(openBlocks.global),
                  onToggle: () => toggleBlock('global'),
                },
                globalBody,
              ),
              h(
                Block,
                {
                  id: 'workspace',
                  title:
                    workspaces.length > 1
                      ? t('root.workspace')
                      : t('root.workspace') + (selectedEntry ? ' · ' + selectedEntry.name : ''),
                  count: workspaceItemCount,
                  action:
                    workspaces.length > 1 && selectedEntry
                      ? h(WorkspacePicker, {
                          compact: true,
                          workspaces,
                          value: selectedEntry.name,
                          onChange: pickWorkspace,
                          ariaLabel: t('root.workspace'),
                        })
                      : null,
                  open: Boolean(openBlocks.workspace),
                  onToggle: () => toggleBlock('workspace'),
                },
                workspaceBody,
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
