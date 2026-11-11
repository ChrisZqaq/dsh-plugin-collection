# install.ps1 — 聚合仓的安装 / 升级入口（Windows）
#
#   .\install.ps1 -List
#   .\install.ps1 -Plugin dsh-infra
#   .\install.ps1 -All
#   .\install.ps1 -All -DryRun
#
# 插件一律从各自的作者仓库取（github: 源），聚合仓不复制插件源码。
[CmdletBinding()]
param(
  [switch]$List,
  [string]$Plugin,
  [switch]$All,
  [string]$Profile = "desktop",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$CatalogPath = Join-Path $Here "plugins.json"
if (-not (Test-Path $CatalogPath)) { throw "fatal: $CatalogPath not found" }
$Catalog = Get-Content $CatalogPath -Raw | ConvertFrom-Json

function Install-One([string]$Spec) {
  $cmd = @("--yes", "-p", "@deepseek-ai/dsh", "dsh", "plugin", "--profile", $Profile, "add", $Spec)
  Write-Host ("-> npx " + ($cmd -join " "))
  if (-not $DryRun) { & npx @cmd }
}

if ($List) {
  $Catalog.plugins | Format-Table id, version, status, install -AutoSize
  return
}

if ($Plugin) {
  $hit = $Catalog.plugins | Where-Object { $_.id -eq $Plugin }
  if (-not $hit) { throw "unknown plugin: $Plugin (try -List)" }
  Install-One $hit.install
  Write-Host ""
  Write-Host "done. 重启 DSH 宿主后插件才会加载新代码。"
  return
}

if ($All) {
  foreach ($p in $Catalog.plugins) {
    if ($p.status -eq "deprecated") { Write-Host "skip $($p.id) (deprecated)"; continue }
    Install-One $p.install
  }
  Write-Host ""
  Write-Host "done. 重启 DSH 宿主后插件才会加载新代码。"
  return
}

Write-Host "usage: .\install.ps1 -List | -Plugin <id> | -All [-DryRun] [-Profile <name>]"
exit 2
