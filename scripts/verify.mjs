#!/usr/bin/env node
/**
 * verify.mjs — 聚合仓自检
 *
 * 只做机械对账，不联网、不装包、不改文件：
 *   1. plugins.json 结构对得上 plugins.schema.json 的必填项与枚举
 *   2. 每条 catalog 条目都有对应的 plugins/<id>.json，且两处 id / version / repo 一致
 *   3. 没有孤儿清单（plugins/ 下的文件都在 catalog 里）
 *   4. README 的目录表与 plugins.json 严格对应（行数、id、版本）
 *   5. 兄弟仓存在时，plugins/<id>.json 里声明的文件与 package.json 版本真对得上
 *
 * 兄弟仓缺失（没 clone 的机器）只警告不失败，方便单独使用聚合仓。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIBLING_ROOT = resolve(ROOT, '..');

let failed = 0;
let passed = 0;
const rows = [];

function ok(name, detail = '') {
  passed += 1;
  rows.push(`  ok    ${name}${detail ? ' — ' + detail : ''}`);
}
function bad(name, detail) {
  failed += 1;
  rows.push(`  FAIL  ${name} — ${detail}`);
}
function warn(name, detail) {
  rows.push(`  warn  ${name} — ${detail}`);
}
function check(cond, name, detail) {
  if (cond) ok(name);
  else bad(name, detail);
  return cond;
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ── 1. plugins.json 基本结构 ────────────────────────────────────────────────
const catalogPath = join(ROOT, 'plugins.json');
if (!existsSync(catalogPath)) {
  console.error('fatal: plugins.json not found at ' + catalogPath);
  process.exit(1);
}
const catalog = readJson(catalogPath);

check(typeof catalog.catalogVersion === 'string' && /^\d+\.\d+\.\d+$/.test(catalog.catalogVersion), 'catalogVersion is semver', String(catalog.catalogVersion));
check(typeof catalog.updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(catalog.updatedAt), 'updatedAt is a plain date', String(catalog.updatedAt));
check(catalog.install && catalog.install.sourcePolicy === 'github', 'install.sourcePolicy is github', String(catalog.install?.sourcePolicy));
check(typeof catalog.install?.command === 'string' && catalog.install.command.includes('dsh plugin'), 'install.command uses the dsh CLI', String(catalog.install?.command));
check(Array.isArray(catalog.plugins) && catalog.plugins.length > 0, 'plugins[] is a non-empty array');

const CATEGORIES = ['metering', 'workspace', 'productivity', 'model', 'ui', 'other'];
const STATUSES = ['stable', 'beta', 'experimental', 'deprecated'];
const ids = new Set();

for (const p of catalog.plugins) {
  const tag = p.id || '(missing id)';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(p.id))) bad(tag + ' id format', String(p.id));
  if (ids.has(p.id)) bad(tag + ' id unique', 'duplicate id');
  ids.add(p.id);
  check(typeof p.name === 'string' && p.name.length > 0, tag + ' has name');
  check(typeof p.version === 'string' && /^\d+\.\d+\.\d+/.test(p.version), tag + ' version is semver', String(p.version));
  check(typeof p.repo === 'string' && /^https:\/\/github\.com\//.test(p.repo), tag + ' repo is a github url', String(p.repo));
  check(typeof p.install === 'string' && p.install.startsWith('github:'), tag + ' install uses the github: source', String(p.install));
  check(typeof p.description === 'string' && p.description.length > 20, tag + ' description is substantive');
  check(CATEGORIES.includes(p.category), tag + ' category is known', String(p.category));
  check(STATUSES.includes(p.status), tag + ' status is known', String(p.status));
  check(Array.isArray(p.highlights) && p.highlights.length > 0, tag + ' lists highlights');
}

// ── 2 & 3. 每条 catalog 条目都要有清单，且不能有孤儿 ─────────────────────────
const manifestDir = join(ROOT, 'plugins');
const manifests = existsSync(manifestDir)
  ? readdirSync(manifestDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
  : [];

for (const id of ids) {
  const file = join(manifestDir, id + '.json');
  if (!check(existsSync(file), 'manifest exists: ' + id, 'plugins/' + id + '.json missing')) continue;
  const m = readJson(file);
  check(m.id === id, 'manifest id matches filename: ' + id, `${m.id} vs ${id}`);
  const entry = catalog.plugins.find((p) => p.id === id);
  check(m.version === entry.version, 'manifest version matches catalog: ' + id, `${m.version} vs ${entry.version}`);
  check(m.repo === entry.repo, 'manifest repo matches catalog: ' + id, `${m.repo} vs ${entry.repo}`);
  for (const key of ['entry', 'clientEntry', 'bundlePatch']) {
    check(typeof m[key] === 'string' && m[key].length > 0, 'manifest declares ' + key + ': ' + id);
  }
}

for (const name of manifests) {
  check(ids.has(name), 'no orphan manifest: ' + name, 'plugins/' + name + '.json is not in plugins.json');
}

// ── 4. README 目录表与 plugins.json 对应 ────────────────────────────────────
const readmePath = join(ROOT, 'README.md');
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, 'utf8');
  const tableRows = readme
    .split('\n')
    .filter((line) => /^\|\s*`/.test(line) && line.includes('github.com/ChrisZqaq/'));
  check(tableRows.length === catalog.plugins.length, 'README table row count matches catalog', `${tableRows.length} vs ${catalog.plugins.length}`);
  for (const p of catalog.plugins) {
    const hit = tableRows.find((line) => line.includes('`' + p.id + '`'));
    check(Boolean(hit), 'README lists ' + p.id);
    if (hit) {
      check(hit.includes(p.version), 'README version matches catalog: ' + p.id, `table row does not carry ${p.version}`);
      check(hit.includes(p.repo), 'README repo link matches catalog: ' + p.id);
    }
  }
  check(readme.includes('catalog-' + catalog.catalogVersion), 'README shows the catalog version', catalog.catalogVersion);
} else {
  bad('README.md exists', 'missing at repo root');
}

// ── 5. 兄弟仓存在时，清单声明的文件与 package.json 版本要真对得上 ────────────
let checkedSiblings = 0;
for (const p of catalog.plugins) {
  const manifestPath = join(manifestDir, p.id + '.json');
  if (!existsSync(manifestPath)) continue;
  const m = readJson(manifestPath);
  if (!m.repoPath) {
    warn('sibling path declared: ' + p.id, 'manifest has no repoPath');
    continue;
  }
  const repoDir = join(SIBLING_ROOT, m.repoPath);
  const pkgPath = join(repoDir, 'package.json');
  if (!existsSync(pkgPath)) {
    warn('sibling repo present: ' + p.id, m.repoPath + ' not cloned next to the collection repo');
    continue;
  }
  checkedSiblings += 1;
  const pkg = readJson(pkgPath);
  check(pkg.name === p.name, 'sibling package name matches catalog: ' + p.id, `${pkg.name} vs ${p.name}`);
  check(pkg.version === p.version, 'sibling version matches catalog: ' + p.id, `${pkg.version} vs ${p.version}`);
  for (const key of ['entry', 'clientEntry', 'bundlePatch']) {
    const rel = m[key];
    if (!rel) continue;
    check(existsSync(join(repoDir, rel)), `sibling file exists: ${p.id}/${rel}`);
  }
  for (const dir of m.hostDirs || []) {
    check(existsSync(join(repoDir, dir)) && readdirSync(join(repoDir, dir)).some((f) => f.endsWith('.js')), `sibling host dir has code: ${p.id}/${dir}`);
  }
  for (const doc of m.docs || []) {
    if (doc.includes('/')) check(existsSync(join(repoDir, doc)), `sibling doc exists: ${p.id}/${doc}`);
  }
  if (pkg.dsh?.bundle?.patch) {
    const norm = (s) => String(s || '').replace(/^\.\//, '');
    check(norm(pkg.dsh.bundle.patch) === norm(m.bundlePatch), 'sibling bundle patch matches manifest: ' + p.id, `${pkg.dsh.bundle.patch} vs ${m.bundlePatch}`);
  } else {
    bad('sibling declares a bundle patch: ' + p.id, 'package.json dsh.bundle.patch is missing');
  }
}

// ── 报告 ────────────────────────────────────────────────────────────────────
console.log(rows.join('\n'));
console.log('');
console.log(`catalog ${catalog.catalogVersion} · ${catalog.plugins.length} plugins · sibling repos checked: ${checkedSiblings}`);
if (failed > 0) {
  console.error(`${failed} check(s) failed, ${passed} passed`);
  process.exit(1);
}
console.log(`all ${passed} checks passed`);