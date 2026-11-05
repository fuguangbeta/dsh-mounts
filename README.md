# dsh-mounts

[![版本](https://img.shields.io/github/v/tag/fuguangbeta/dsh-mounts?label=%E7%89%88%E6%9C%AC&color=blue)](https://github.com/fuguangbeta/dsh-mounts/tags)
![平台](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-DeepSeek%20Harness-0078D4)
![只读为主](https://img.shields.io/badge/%E8%AE%BF%E9%97%AE-%E5%8F%AA%E8%AF%BB%E4%B8%BA%E4%B8%BB-4CAF50)
[![许可](https://img.shields.io/github/license/fuguangbeta/dsh-mounts?label=%E8%AE%B8%E5%8F%AF)](https://github.com/fuguangbeta/dsh-mounts/blob/main/LICENSE)
[![Star](https://img.shields.io/github/stars/fuguangbeta/dsh-mounts?label=Star&color=yellow)](https://github.com/fuguangbeta/dsh-mounts/stargazers)

## 关于本工具 · *About This Tool*

dsh-mounts 是以只读为主的侧栏面板，将当前 profile 的挂载内容归为五类，同页呈现；顶部另有一份可复制的项目简报，技能与 MCP 的每一行带一个生效状态点（绿=生效，红=未生效）。唯一写入是工作区的 `.dsh-mounts/handoff.md`（显式保存交接）。
面板只注册一个只读工具 `project_context`（模型调用时才返回简报），除交接保存外不写文件，不发起出站请求。安装本身不改变模型所见的提示词。

面板的用途限于确认配置内容与 Host 注册表的口径，不判定进程健康：补丁中存在 MCP 行，不代表对应进程正在运行；
技能出现在列表中，不代表本轮已加载。

记忆库只从固定目录发现：全局 `~/.dsh/memory`、`.engramory-memory`、`memory-bank`；工作区 `<工作区>/memory`、`.dsh/memory`、`.agents/memory`。
都没有时该子节显示一行说明，不会隐藏。
DSH 不读取该目录；DSH 自动注入的内容为各工作区的 `AGENTS.md` 与 `AGENTS.local.md`，归入各工作区的「记忆 → 规则」。

面板不读取记忆正文。记忆库仅取 `stat` 元数据，技能仅取 frontmatter 的 description；
团队只读 `team.json` 的成员/任务摘要；交接读取摘要，保存时写完整文本。
查看正文使用每行的「打开」，交由系统默认程序处理；该操作使用 DSH 内置的 Session Remote，
不可用时降级为「复制路径」。除显式保存交接外，面板不修改文件，也不提供任何设置项。

如果你只是偶尔想确认一次配置，直接读 profile 的 `cordis.patch.yml` 与各工作区的 `AGENTS.md`
也能得到同样的答案。这个面板的价值在于它常驻侧栏、随时可见，不必每次重新查一遍；配置频繁变动时，
这一点有些用处。

This is a mostly read-only sidebar panel for DeepSeek Harness. It presents the mounts as a Global/Workspace tree
on one page, with a status dot on each skill and MCP row (green = active, red = inactive). The only write is
the workspace's `.dsh-mounts/handoff.md` (an explicit handoff save). It registers one read-only tool,
`project_context`, which returns that brief only when the model calls it; it adds nothing to the context,
writes no files, and does not use the network. Installing it does not change the prompt the model receives. Its purpose is
to report what is configured, not whether it is active: an MCP row in the patch does not imply a
running process, and a listed skill was not necessarily loaded this turn. The Memory section
discovers fixed directories globally (`~/.dsh/memory`, `.engramory-memory`, `memory-bank`) and
inside each workspace (`<ws>/memory`, `.dsh/memory`, `.agents/memory`); an explanatory line is shown when none yields a library;
DSH does not read it, and what DSH injects are the `AGENTS.md` and `AGENTS.local.md` files
of each workspace, reported under Memory → Rules. Memory bodies are never read: libraries are
only `stat`-ed, skills contribute the frontmatter description, team state is a member/task
summary from `team.json`, and a handoff contributes its summary; the panel can save the full handoff text. Reading a file
is delegated to the system default application through DSH's Session Remote, with a copy-path fallback.
The panel does not modify any file except an explicit handoff save, and offers no settings.

If you only want to check the configuration occasionally, reading the profile's `cordis.patch.yml`
and each workspace's `AGENTS.md` gives the same answer. The value of this panel is that it sits in
the sidebar and stays current, so nothing has to be looked up again each time; when the configuration
changes often, that is worth something.

---

## 1. 界面 · *Interface*

### 1.1 初始状态 · *Initial State*

面板在打开时的状态：

```
挂载清单  [只读 · 交接]  [刷新]
当前项目挂载了什么：全局与工作区的项目简报、记忆、技能与 MCP。

▸ 全局 (22)
▸ 工作区  [my-app ▾]  7
```

*The panel in its initial state.*

默认两个根都收起；点开根，再点开子节。空子节展开后显示一行说明。
展开/收起、箭头、自绘下拉菜单与按钮统一使用 170ms 缓动；系统开启「减少动态效果」时全部关闭。

*The panel in its initial state. Both roots start collapsed; open a root, then a sub-section. An empty one explains itself.
Expand/collapse, arrows, the custom select menu, and buttons share one 170ms easing; all animation is disabled under "reduce motion".*

### 1.2 记忆展开至文件级 · *Memory Expanded to Files*

```
▾ 工作区  [my-app ▾]
   ▾ 记忆
        AGENTS.md  [自动注入] · 6 节
        MEMORY.md · 6.7 KB · 2026-10-16
        overview.md · 12.9 KB · 2026-10-17
        …
```

两图均为示意，数据非实测。空子节展开后显示一行说明，不隐藏。

*Both figures are illustrative and the data is not measured. An empty sub-section shows an
explanatory line instead of hiding.*

### 1.3 栏目与数据来源 · *Groups and Data Sources*

| 根 | 子节 | 来源 |
|------|------|------|
| 全局 | 项目简报 / 记忆 / 技能 / MCP | profile 与补丁、`~/.dsh/AGENTS.md`、全局记忆库、全局技能（含 bundle 内置）、profile 补丁 MCP；状态点来自 Host 的 `skills` / `tools` 注册表 |
| 工作区 | 项目简报 / 记忆 / 技能 / MCP | 当前工作区的规则、`memory` 文件、工作区技能、`.dsh/mcp.json`、团队与交接 |

| Root | Sub-section | Source |
|------|------|------|
| Global | Project brief / Memory / Skills / MCP | profile and patch, `~/.dsh/AGENTS.md`, global memory libraries, global skills (including bundle-embedded), profile-patch MCP; dots come from the Host `skills` / `tools` registries |
| Workspace | Project brief / Memory / Skills / MCP | The selected workspace's rules, `memory` files, workspace skills, `.dsh/mcp.json`, team state and last handoff |

工作区 MCP 读 `<ws>/.dsh/mcp.json`；`<ws>/.mcp.json` 只作为外部配置显示，DSH 不挂载，状态点为灰。
状态点按所选工作区计算：有该工作区的活动会话时用会话注册表，否则用目录（MCP 工具状态为灰）。

Workspace MCP reads `<ws>/.dsh/mcp.json`; `<ws>/.mcp.json` is shown as external configuration only — DSH does not mount it, so its dot is gray.
Dots use the selected workspace: with a live session there they use its registry, otherwise the catalog (MCP tool status is gray).

工作区 → 项目简报 → 交接 可编辑，保存到 `.dsh-mounts/handoff.md`（≤20 KB）；旧 `.dsh/handoff.md` 仍可读取。
The Workspace → Project brief → Handoff row is editable; saves go to `.dsh-mounts/handoff.md` (≤20 KB). A legacy `.dsh/handoff.md` is still read.

---

## 2. 层级与展开 · *Hierarchy*

| 层级 | 触发 | 内容 |
|------|------|------|
| L1 | 打开面板 | 全局 / 工作区两个根 |
| L2 | 点击根 | 项目简报 / 记忆 / 技能 / MCP 四个子节 |
| L3 | 点击子节 | 该子节的条目 |
| L4 | 点击条目 | 该条目的详情（路径、章节、来源、env、所属预设） |

初始状态停留在 L1；工作区默认取当前，可在工作区标题下切换。

| Level | Trigger | Content |
|------|------|------|
| L1 | Opening the panel | The Global and Workspace roots |
| L2 | Clicking a root | The Project brief / Memory / Skills / MCP sub-sections |
| L3 | Clicking a sub-section | The entries of that sub-section |
| L4 | Clicking an entry | That entry's details (path, sections, source, env, owning preset) |

The initial state rests at L1; the workspace defaults to the current one and can be switched under the Workspace title.

---

## 3. 安装 · *Installation*

### 3.1 安装步骤 · *Steps*

需要 Creator 模式（`cordis` preset），该预设提供 `plugin_manager`。

1. 将本仓库放入任一工作区。可 clone，亦可使用 GitHub 的 Download ZIP；不依赖 npm。
2. 调用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的绝对路径。
3. 检查返回的 `application` 与 `warnings`。

profile 的 `package.json` 与 `cordis.patch.yml` 由 `install_bundle` 维护。手工修改
或于 profile 目录执行 pnpm 均不符合官方流程。

Creator mode (the `cordis` preset) is required, as it provides `plugin_manager`. Place the
repository in any workspace, by clone or by GitHub's Download ZIP; npm is not involved. Call
`install_bundle` with `target` set to the absolute path of this package, then inspect the
returned `application` and `warnings`. The profile's `package.json` and
`cordis.patch.yml` are maintained by `install_bundle`; editing them by hand, or running pnpm
inside the profile directory, is outside the official procedure.

### 3.2 代码改动生效方式 · *Applying Code Changes*

客户端依赖（`client.js`）改动通过硬刷新（Ctrl+Shift+R）生效。Host 侧依赖（`index.js`）
改动需以 `plugin_manager` 将 `include:mounts-panel` 关→开，触发模块重新 import。

Client-side changes (`client.js`) take effect on a hard refresh (Ctrl+Shift+R). Host-side changes
(`index.js`) require toggling `include:mounts-panel` off and on through `plugin_manager`
so the module is imported again.

---

## 4. 安全模型 · *Security Model*

- 除 `POST /dsh-mounts/handoff` 写入工作区 `.dsh-mounts/handoff.md` 外，不写文件，不启动子进程，不发起出站请求。
- 暴露两个 HTTP 端点：`GET /dsh-mounts/api`（只读快照）与 `POST /dsh-mounts/handoff`（保存交接，≤20 KB）。
- 注册一个只读模型工具 `project_context`：只返回简报文本，不写文件、不执行命令。
- 两个端点都只接受 loopback 的 `Host` 头（`127.0.0.1`、`localhost`、`[::1]`），
  其余返回 403，用于阻断 DNS rebinding。
- `/api` 只接受 GET 与 HEAD，其余返回 405；`/handoff` 只接受 POST。响应带 `Cache-Control: no-store`。
- 可选 `workspace` 查询参数（名称或绝对路径）用于选择展示的工作区；只读，不影响其他会话。
- 不返回文件内容：记忆库仅 `stat`，技能仅取 frontmatter 的 description。

「打开」不新建端点，使用 DSH 现有的 Session Remote，路径由 Host 侧复核。

- Except for `POST /dsh-mounts/handoff`, which writes the workspace's `.dsh-mounts/handoff.md`, no files are written, no subprocess is started, and no outbound request is made.
- Two HTTP endpoints are exposed: `GET /dsh-mounts/api` (read-only snapshot) and `POST /dsh-mounts/handoff` (save a handoff, ≤20 KB).
- It registers one read-only model tool, `project_context`, which only returns brief text; it writes no file and runs no command.
- Both endpoints accept only a loopback `Host` header (`127.0.0.1`, `localhost`, `[::1]`) and return 403
  otherwise, which blocks DNS rebinding.
- `/api` accepts only GET and HEAD; `/handoff` accepts only POST. Responses carry `Cache-Control: no-store`.
- It accepts an optional `workspace` query parameter (name or absolute path) to select the displayed workspace; read-only, and it does not affect other sessions.
- It returns no file contents: memory libraries are only `stat`-ed and skills contribute the
  frontmatter description.

The "Open" action creates no endpoint; it uses DSH's existing Session Remote and the path is
re-validated on the Host side.

---

## 5. 已知限制 · *Known Limitations*

| 限制 | 说明 |
|------|------|
| 面板以只读为主 | 唯一写入是 `.dsh-mounts/handoff.md`；不提供启停与删除 |
| 只识别 memory 目录 | 不做模糊匹配 |
| 记忆库位置固定 | 全局只探测 `~/.dsh/memory`、`.engramory-memory`、`memory-bank`；工作区只探测三个 memory 目录 |
| 技能描述最多 1000 字 | 超出部分以省略号结尾 |
| 工作区取最近更新的一个 | 简报默认如此；`project_context` 工具按当前会话工作目录，面板可在简报里切换 |
| 简报不落盘 | 每次请求实时生成，只含路径与元数据，不含记忆正文 |
| 团队状态只读 | 只读 dsh-agent-teams 的 `team.json`；该插件改格式时可能只显示成员/任务数 |
| 状态点按所选工作区计算 | 有活动会话时按该会话的注册表；无会话时按目录（`skills.list` 不带 scope），MCP 工具状态为灰 |
| 外部 .mcp.json 不挂载 | 只显示为「外部」，状态点为灰；要挂载请用 `.dsh/mcp.json` |
| bundle 内置技能由生效数据补入 | 文件扫描看不到 bundle；它们以 `bundled` 来源补入技能列表，行尾同样有状态点 |
| 不显示当前会话的预设 | 只在 meta 的「生效视角」里显示所选工作区会话的预设；无会话时显示「目录」 |
| 不自动读取 customSkillDirs | 该配置属于另一个插件 |
| 没有设置界面 | DSH 配置无法写入 include 插入的行；记忆库位置固定 |
| 记忆同时列规则与记忆文件 | 规则会被注入，记忆文件不会 |
| 「打开」在部分环境下降级为「复制路径」 | 属预期行为，点击后完整路径进入剪贴板 |

| Limitation | Note |
|------|------|
| Mostly read-only | The only write is `.dsh-mounts/handoff.md`; no toggling or deleting |
| Only directories named memory are recognised | No fuzzy matching |
| Memory locations are fixed | Global: only `~/.dsh/memory`, `.engramory-memory`, `memory-bank`; workspace: the three memory directories |
| Skill descriptions are capped at 1000 characters | Longer ones end with an ellipsis |
| The workspace is the most recently updated one | That is the brief's default; the `project_context` tool uses the current session's cwd, and the panel can switch workspaces |
| The brief is generated live, never stored | It contains paths and metadata only, no memory bodies |
| Team state is read-only | It reads dsh-agent-teams' `team.json`; a format change may reduce it to counts |
| The status dots use the selected workspace | With a live session in that workspace they use its registry; without one they use the catalog (`skills.list` without scope), and MCP tool status is gray |
| External `.mcp.json` is not mounted | It is shown as "External" with a gray dot; use `.dsh/mcp.json` to mount |
| Bundle-embedded skills are added from the effective data | A file scan cannot see bundles; they join the list with source `bundled` and the same dot |
| The current session's preset is not shown | The meta "Effective view" chip shows the selected workspace's session preset; without a session it shows "Catalog" |
| `customSkillDirs` is not read automatically | That setting belongs to another plugin |
| No settings UI | DSH settings cannot write a row inserted by include; memory locations are fixed |
| The memory group lists both rules and memory files | Rules are injected; memory files are not |
| "Open" degrades to "Copy path" in some environments | Expected behaviour; clicking places the full path on the clipboard |

---

## 6. 开发 · *Development*

文件结构见 §7。

读盘文本先做 `\r\n?` 到 `\n` 的规范化。CRLF 的 `SKILL.md` 会使 frontmatter 解析静默失败，
description 退化为空字符串。

Host 冒烟测试：`npm test`（`node:test`，无第三方依赖），覆盖扫描、外部 MCP 标记、交接写入与方法/大小限制。

Text read from disk is normalised from `\r\n?` to `\n` first. A CRLF `SKILL.md` makes
frontmatter parsing fail silently and the description degrade to an empty string.

Host smoke tests: `npm test` (`node:test`, no third-party dependencies) cover scanning,
external MCP marking, handoff writes, and method/size limits.

如需注入配置，可直接改本 bundle 的 `cordis.patch.yml` 的 `config`（仅对本机安装有效，不建议提交）。

To inject configuration, edit the `config` of this bundle's own `cordis.patch.yml`
(local installs only; not recommended for commits).

---

## 7. 文件结构 · *File Structure*

```
dsh-mounts/
├── package.json          # 包清单、dsh.bundle 与 dsh.client · Package manifest
├── cordis.patch.yml      # 单条 insert：mounts-panel · Bundle patch
├── index.js              # Host 半：扫描 + GET /api + POST /handoff · Host half
├── client.js             # Web 半：侧栏一级面板与 main keyed 槽 · Client half
├── locale/               # 面板标题与描述的中英文案 · Panel title and description
│   ├── zh.json
│   └── en.json
├── icon.svg              # 插件图标 · Plugin icon
├── README.md             # 本文件 · This file
├── CHANGELOG.md          # 更新日志 · Changelog
├── test/host.test.mjs    # Host 冒烟测试 · Host smoke tests
└── LICENSE               # MIT · MIT
```

---

## 系统要求 · *System Requirements*

| 项 | 要求 |
|------|------|
| DSH | >= 0.2.1-rc.2 |
| 安装 | Creator 模式（`cordis` preset） |
| 日常使用 | 不要求 Creator 模式 |
| 客户端服务 | `remote`、`remote.session`、`connection`、`locale` |
| Host 服务 | `webServer`（必需）；`tools`（可选，缺省时不注册 `project_context`） |
| 平台 | Windows 已验证，其余未测试 |
| 第三方依赖 | 无 |

| Item | Requirement |
|------|------|
| DSH | >= 0.2.1-rc.2 |
| Installation | Creator mode (the `cordis` preset) |
| Everyday use | Creator mode not required |
| Client services | `remote`, `remote.session`, `connection`, `locale` |
| Host services | `webServer` (required); `tools` (optional; without it `project_context` is not registered) |
| Platform | Windows verified; other platforms untested |
| Third-party dependencies | None |

---

## 常见问题 · *Frequently Asked Questions*

**安装后侧栏无「挂载清单」。**
确认 `install_bundle` 返回的 `application` 为 `applied`。若已应用仍不可见，先行硬刷新
（Ctrl+Shift+R）；无效则重启 DSH。

**改动代码后界面无变化。**
参见 §3.2。

**显示的工作区与当前会话不符。**
面板取注册表中最近更新的工作区，无会话级绑定，见 §5。

**「打开」显示为「复制路径」。**
该页面无法取得 Session Remote，属预期降级。点击后完整路径进入剪贴板。

**为何不提供正文预览。**
正文预览需要在端点中开放文件读取，而该端点仅以 Host 头作准入控制，不做会话鉴权。故仅提供「打开」。

The sidebar shows no "挂载清单" after installation. Confirm that `install_bundle` returned
`application: applied`. If it is applied but still invisible, perform a hard refresh
(Ctrl+Shift+R); if that fails, restart DSH.

The interface does not change after a code edit. See §3.2.

The displayed workspace is not the one of the current session. The panel takes the most recently
updated workspace in the registry and has no session-level binding. See §5.

"Open" appears as "Copy path". The page cannot reach the Session Remote, which is the expected
degradation. Clicking places the full path on the clipboard.

Why is there no inline preview of file contents? A preview would require opening file reads on the
endpoint, which is admitted only by the Host header and carries no session authentication. The "Open"
action is provided instead.*

---

## 许可 · *License*

MIT，见 [LICENSE](LICENSE)。*MIT, see [LICENSE](LICENSE).*

---

## 反馈 · *Feedback*

问题请提交 issue，附 DSH 版本与复现步骤。
Please open an issue, including the DSH version and reproduction steps.
