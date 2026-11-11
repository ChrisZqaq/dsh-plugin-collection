# 🧩 DSH Plugin Collection

> [ChrisZqaq](https://github.com/ChrisZqaq) 自建的 DSH（DeepSeek）插件聚合仓：四个插件各自独立成仓、独立版本、独立发布，本仓只做**索引、组合安装、升级编排与对账**。

[![Catalog](https://img.shields.io/badge/catalog-0.1.0-blue.svg)](plugins.json)
[![Plugins](https://img.shields.io/badge/plugins-4-informational.svg)](plugins.json)
[![Profile](https://img.shields.io/badge/profile-desktop-orange.svg)](#)
[![SSOT](https://img.shields.io/badge/SSOT-plugins.json-blueviolet.svg)](plugins.json)

本仓库**不复制、不重新发布任何插件源码**。每个条目的 `install` 都指向插件作者的原仓库（`github:` 源），源码、Issue、Release、版本号都在各自的仓里各自维护。聚合仓的职责只有三件：一份机器可读的目录、一套安装/升级入口、一个能跑的对账脚本。

---

## 插件目录

| 插件 | 版本 | 用途 | 源码 |
|---|---:|---|---|
| `dsh-token-pill` | 0.2.3 | 侧栏底部胶囊：当前峰谷时段 + 今日 DeepSeek 花费，悬停出缓存命中、按模型拆分与下次变价时间 | [ChrisZqaq/dsh-token-pill](https://github.com/ChrisZqaq/dsh-token-pill) |
| `dsh-cpamc-pill` | 0.1.1 | 侧栏底部第二枚胶囊：CPA-Manager-Plus 反代连接健康度、今日 token 用量与滚动速率 | [ChrisZqaq/dsh-cpamc-pill](https://github.com/ChrisZqaq/dsh-cpamc-pill) |
| `dsh-infra` | 0.1.1 | 机器与仓库公共知识库：一处维护 infra.yml，所有会话都知道该 ssh 哪台、用哪把 key、哪些命令别碰 | [ChrisZqaq/dsh-infra](https://github.com/ChrisZqaq/dsh-infra) |
| `dsh-scratchpad` | 1.0.0 | 侧栏独立入口的常驻便签：随手记、一键复制、一键清空，纯本地持久化 | [ChrisZqaq/dsh-scratchpad](https://github.com/ChrisZqaq/dsh-scratchpad) |

四件套的分工，一句话讲清：

- **看花销** → `dsh-token-pill`（DeepSeek 官方账号，逐 token 计价）
- **看反代** → `dsh-cpamc-pill`（CPA 订阅账号，只报 token 不报钱）
- **别乱动机器** → `dsh-infra`（该用哪把 key、哪台机器，写死在 YAML 里）
- **随手记** → `dsh-scratchpad`

---

## 安装

默认安装目标是 DSH 的 `desktop` profile（`~/.dsh/profiles/desktop`）。换 profile 加 `--profile <name>` / `-Profile <name>`。

### 1. 单插件（官方 CLI，最短路径）

```bash
npx --yes -p @deepseek-ai/dsh dsh plugin --profile desktop add github:ChrisZqaq/dsh-infra
```

### 2. 用聚合仓的选择器

先 clone 本仓（脚本读同目录的 [plugins.json](plugins.json)）：

```bash
git clone git@github.com:ChrisZqaq/dsh-plugin-collection.git
cd dsh-plugin-collection

bash install.sh --list                  # 列出全部插件
bash install.sh --plugin dsh-infra      # 装 / 升单个
bash install.sh --all                   # 全量
bash install.sh --dry-run --all         # 只打印命令
```

Windows：

```powershell
.\install.ps1 -List
.\install.ps1 -Plugin dsh-infra
.\install.ps1 -All
```

### 3. 装完要做的

- **重启 DSH 宿主**（桌面端彻底退出再打开，不是只关窗口）。插件更新只替换磁盘文件，宿主进程里的注入代码不重启不会生效。
- `dsh-infra` 首次使用前确认 `~/.dsh/infra/infra.yml` 存在；没有就从 [examples/infra.example.yml](https://github.com/ChrisZqaq/dsh-infra/blob/main/examples/infra.example.yml) 抄一份。
- `dsh-cpamc-pill` 需要本机跑着 CPA-Manager-Plus（默认 `127.0.0.1:18317`），否则胶囊恒为红点离线。

---

## 升级

**重跑同一条 `add` 即升级**：`github:` 源不带 tag 时取默认分支最新提交。

| 插件 | 升级命令 |
|---|---|
| `dsh-token-pill` | `dsh plugin --profile desktop add github:ChrisZqaq/dsh-token-pill` |
| `dsh-cpamc-pill` | `dsh plugin --profile desktop add github:ChrisZqaq/dsh-cpamc-pill` |
| `dsh-infra` | `dsh plugin --profile desktop add github:ChrisZqaq/dsh-infra` |
| `dsh-scratchpad` | `dsh plugin --profile desktop add github:ChrisZqaq/dsh-scratchpad` |

锁版本就写 `github:ChrisZqaq/<repo>#vX.Y.Z`。

---

## 仓库结构

```
dsh-plugin-collection/
├── plugins.json          # 单一数据源：目录、版本、安装规格、依赖
├── plugins.schema.json   # 上面那份的 JSON Schema
├── plugins/<id>.json     # 每个插件的结构清单（入口、宿主目录、路由、槽位）
├── scripts/verify.mjs    # 对账：catalog ↔ 清单 ↔ README ↔ 兄弟仓
├── install.sh            # macOS / Linux 安装器
├── install.ps1           # Windows 安装器
├── CHANGELOG.md          # 目录与版本变更记录
└── README.md
```

推荐的本地布局（`verify.mjs` 会自动发现兄弟仓并做版本对账）：

```
DSH-Plugin-Dev/
├── dsh-token-pill/          # git → ChrisZqaq/dsh-token-pill
├── dsh-cpamc-pill/          # git → ChrisZqaq/dsh-cpamc-pill
├── dsh-infra/               # git → ChrisZqaq/dsh-infra
├── dsh-scratchpad/          # git → ChrisZqaq/dsh-scratchpad
└── dsh-plugin-collection/   # git → 本仓
```

---

## 对账

```bash
node scripts/verify.mjs
```

跑五类检查，全程离线：

1. `plugins.json` 的必填项、枚举、semver、`github:` 源
2. 每条目录条目都有对应 `plugins/<id>.json`，两边 id / version / repo 一致
3. 没有孤儿清单
4. README 的目录表与 `plugins.json` 严格对应（行数、id、版本、链接）
5. 兄弟仓在场时，清单声明的入口 / 宿主目录 / bundle patch 与各仓 `package.json` 真对得上

兄弟仓没 clone 的机器只 `warn` 不 `FAIL`，方便只拿聚合仓单独用。

---

## 维护约定

- **改版本先改插件仓**：各插件的 `package.json` version 是唯一真源，聚合仓跟随。顺序是「插件仓改版本 → 推 GitHub → 回来改 `plugins.json` + 对应 `plugins/<id>.json` + README 表格 → 跑 `verify.mjs`」。
- **不搬源码**：聚合仓永远只有索引与脚本。想加插件 = 新开一个插件仓 + 在 `plugins.json` 加一条。
- **样式只用主题令牌**：自绘 UI 只碰 `--dsw-alias-*` / `--ds-*`，不写死色值，否则深色模式必炸。高频坑：`--dsw-alias-brand-primary` 是单色主按钮底色不是品牌蓝；等宽字体令牌是 `--ds-font-family-code`（`--dsh-code-font-family` 与 `--dsw-font-mono` 在 DSH 里不存在，浏览器会静默丢弃整条声明）；自绘开关要把轨道和旋钮的令牌成套换。
- **单写者**：同一个插件仓同一时间只允许一个 agent 写。

## 安全边界

插件跑在本机 DSH 进程里，拥有你给的权限。装之前自己看一眼源码——四个仓都是几百行纯 JS，没有构建产物、没有 postinstall 脚本、不主动联网（`dsh-cpamc-pill` 只连本机 CPA 面板，`dsh-infra` 只跑你写在 YAML 里、且被你点过「探活」的命令）。

本仓只提供索引与安装入口，不对插件行为做担保。
