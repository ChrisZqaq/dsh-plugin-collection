# CHANGELOG

本仓记录**目录与版本编排**的变更；插件自身的功能变更写在各插件仓的 CHANGELOG / Release 里。

## 0.1.0 — 2026-11-11

首个版本。

- 建仓：`plugins.json` + `plugins.schema.json` 作为单一数据源，README 目录表由它生成核对。
- 收录 4 个插件：`dsh-token-pill` 0.2.3、`dsh-cpamc-pill` 0.1.1、`dsh-infra` 0.1.1、`dsh-scratchpad` 1.0.0。
- 新增 `plugins/<id>.json` 结构清单（入口 / 宿主目录 / 路由 / 槽位 / 依赖）。
- 新增 `scripts/verify.mjs`：catalog ↔ 清单 ↔ README ↔ 兄弟仓四向对账，离线可跑。
- 新增 `install.sh` / `install.ps1`：`--list` / `--plugin` / `--all` / `--dry-run`。
- 安装源统一为 `github:`，避免 registry 缓存滞后导致的旧包。
