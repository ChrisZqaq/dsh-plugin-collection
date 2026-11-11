#!/usr/bin/env bash
# install.sh — 聚合仓的安装 / 升级入口（macOS / Linux）
#
#   bash install.sh --list                列出可选插件
#   bash install.sh --plugin dsh-infra    安装或升级单个插件
#   bash install.sh --all                 安装或升级全部
#   bash install.sh --dry-run --all       只打印命令，不执行
#
# profile 默认 desktop，可用 --profile <name> 覆盖。
# 插件一律从各自的作者仓库取（github: 源），聚合仓不复制插件源码。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CATALOG="$HERE/plugins.json"
PROFILE="desktop"
MODE=""
TARGET=""
DRY=""

usage() {
  sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --list)        MODE="list"; shift ;;
    --plugin)      MODE="one"; TARGET="${2:-}"; shift 2 ;;
    --all)         MODE="all"; shift ;;
    --profile)     PROFILE="${2:-}"; shift 2 ;;
    --dry-run)     DRY="1"; shift ;;
    -h|--help)     usage; exit 0 ;;
    *)             echo "unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [ -z "$MODE" ]; then usage; exit 2; fi
if [ ! -f "$CATALOG" ]; then echo "fatal: $CATALOG not found" >&2; exit 1; fi

# 用 node 读 plugins.json（DSH 用户必然有 node）
read_catalog() {
  node -e '
    const c = require(process.argv[1]);
    for (const p of c.plugins) {
      console.log([p.id, p.version, p.status, p.install, p.description.replace(/\s+/g, " ").slice(0, 60)].join("\t"));
    }
  ' "$CATALOG"
}

install_one() {
  local spec="$1"
  local cmd=(npx --yes -p @deepseek-ai/dsh dsh plugin --profile "$PROFILE" add "$spec")
  echo "→ ${cmd[*]}"
  if [ -z "$DRY" ]; then "${cmd[@]}"; fi
}

case "$MODE" in
  list)
    printf '%-22s %-8s %-12s %s\n' "ID" "VERSION" "STATUS" "SPEC"
    read_catalog | while IFS=$'\t' read -r id version status spec desc; do
      printf '%-22s %-8s %-12s %s\n' "$id" "$version" "$status" "$spec"
    done
    ;;
  one)
    if [ -z "$TARGET" ]; then echo "missing plugin id, try --list" >&2; exit 2; fi
    SPEC="$(read_catalog | awk -F'\t' -v id="$TARGET" '$1 == id { print $4 }')"
    if [ -z "$SPEC" ]; then echo "unknown plugin: $TARGET" >&2; exit 2; fi
    install_one "$SPEC"
    ;;
  all)
    read_catalog | while IFS=$'\t' read -r id version status spec desc; do
      if [ "$status" = "deprecated" ]; then echo "skip $id (deprecated)"; continue; fi
      install_one "$SPEC"
    done
    ;;
esac

echo ""
echo "done. 重启 DSH 宿主（或刷新 Web UI）后插件才会加载新代码。"
