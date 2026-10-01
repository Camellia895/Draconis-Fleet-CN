// inject.js — Draconis-Fleet 0.7.9 汉化注入器（armaa apply_zh.js 改造版）
// 增强：① CSV 与 keyed 注入支持 @L<行号> 去重条目（按 e.line 定位/第 N 次出现）
//       ② designTypeColors 键替换（R16）  ③ changelog.md 分块回填  ④ Janino zh Java 转义
// 原则：文本替换、绝不 JSON 序列化回写（R8）；UTF-8 无 BOM；保持各文件原 EOL（R17）。
// 用法: node inject.js [--dry]
'use strict';
const fs = require('fs'), path = require('path');
const { parseCsv, csvJoinRow } = require('C:/game/StarSector.v0.9.8a-RC8/_work/skills/shared/scripts/csvlib.js');

const GAME = 'C:/game/StarSector.v0.9.8a-RC8';
const MOD = GAME + '/mods/Draconis-Fleet';
const W = GAME + '/_work/mod_work/Draconis-Fleet';
const TMP = GAME + '/_work/_tmp';
const DRY = process.argv.includes('--dry');

const SHARDS = ['01_data', '02_structured', '03_rules_missions', '04_jar', '05_misc'];
const entries = [];
for (const s of SHARDS) {
  const zhFp = W + '/worklist/zh/' + s + '.json';
  const fp = fs.existsSync(zhFp) ? zhFp : W + '/worklist/' + s + '.json';
  if (!fs.existsSync(fp)) continue;
  for (const e of JSON.parse(fs.readFileSync(fp, 'utf8'))) { e._shard = s; entries.push(e); }
}
// 只注入"有中文译文"的条目；zh===en（jar 为 c）视为有意保留原文 → 跳过
const todo = entries.filter(e => {
  const en = e.c !== undefined ? e.c : e.en;
  return e.zh && /[\u4e00-\u9fff]/.test(e.zh) && e.zh !== en;
});
console.log('worklist total:', entries.length, ' to inject:', todo.length);

const report = {};
function stat(file, applied, missed) {
  const r = report[file] || (report[file] = { applied: 0, missed: 0 });
  r.applied += applied; r.missed += missed;
}
function readMod(rel) { return fs.readFileSync(path.join(MOD, rel)); }
function writeMod(rel, text) {
  if (DRY) return;
  fs.writeFileSync(path.join(MOD, rel), Buffer.from(text, 'utf8'));
}
function detectEol(raw) { return /\r\n/.test(raw) ? 'CRLF' : 'LF'; }
const enc = s => JSON.stringify(s).slice(1, -1);
const idEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 第 N 次出现替换（0 基）；fn(args) 接收 match 数组自行重组分组
// （⚠️ 函数替换器里 $1 不是反向引用而是字面量——2026-09 实测事故，必须用 args 重组）
function replaceNth(text, re, fn, n) {
  let i = -1;
  return text.replace(re, (...args) => { i++; return i === n ? fn(args) : args[0]; });
}

// ---------- A) CSV 结构级注入（行级 splice，保持原 EOL） ----------
const CSV_IDCOL = {
  'data/strings/descriptions.csv': 'id', 'data/hullmods/hull_mods.csv': 'id', 'data/weapons/weapon_data.csv': 'id',
  'data/characters/skills/skill_data.csv': 'id', 'data/campaign/market_conditions.csv': 'id',
  'data/campaign/special_items.csv': 'id', 'data/campaign/commodities.csv': 'id', 'data/campaign/industries.csv': 'id',
  'data/hulls/ship_data.csv': 'id', 'data/hulls/wing_data.csv': 'id', 'data/shipsystems/ship_systems.csv': 'id',
  'data/config/exerelin/corvus_spawnpoints.csv': 'faction', 'data/campaign/rules.csv': 'id',
};
function injectCsv(entriesForFile) {
  const byFile = new Map();
  for (const e of entriesForFile) {
    if (!byFile.has(e.file)) byFile.set(e.file, []);
    byFile.get(e.file).push(e);
  }
  for (const [rel, list] of byFile) {
    let raw = readMod(rel).toString('utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const eol = detectEol(raw);
    const nl = eol === 'CRLF' ? '\r\n' : '\n';
    const { header, rows } = parseCsv(raw);
    const idCol = CSV_IDCOL[rel] || 'id';
    const idIdx = header.indexOf(idCol);
    if (idIdx < 0) { console.error('  !! idCol 不存在:', rel, idCol); continue; }
    const lineEnd = new Array(rows.length);
    for (let i = 0; i < rows.length; i++) lineEnd[i] = (i + 1 < rows.length ? rows[i + 1].line - 1 : raw.split('\n').length);
    const rowById = new Map();
    for (let i = 0; i < rows.length; i++) {
      const id = (rows[i].cells[idIdx] || '').trim();
      if (!rowById.has(id)) rowById.set(id, []);
      rowById.get(id).push(i);
    }
    const rowAtLine = line => rows.findIndex((r, i) => r.line <= line && line <= lineEnd[i]);
    const lines = raw.split('\n');
    let applied = 0, missed = 0;
    const touchedRows = new Map();
    for (const e of list) {
      let ri;
      const mAt = String(e.id).match(/^(.*)@L(\d+)$/);
      if (mAt && e.line) {
        ri = rowAtLine(Number(mAt[2]));                 // 去重条目：按行号定位
      } else if (e.line) {
        const li = rowAtLine(e.line);                   // 优先按行号（同一 id 多行的确定性定位）
        const cand = li >= 0 ? li : undefined;
        ri = cand;
      }
      if (ri === undefined || ri < 0) {
        const ids = rowById.get(String(e.id).trim());
        ri = ids && ids.length ? ids[0] : undefined;    // 兜底：id 首个匹配行
      }
      if (ri === undefined || ri < 0) { missed++; stat(rel + '::norow:' + e.id, 0, 1); continue; }
      let colIdx = header.indexOf(e.field);
      if (colIdx < 0 && /^script\(AddText\)$/.test(e.field)) colIdx = header.indexOf('script');
      if (colIdx < 0) { missed++; stat(rel + '::nocolumn:' + e.field, 0, 1); continue; }
      const cur = (rows[ri].cells[colIdx] || '').trim();
      if (cur !== String(e.en).trim()) { missed++; stat(rel + '::enmismatch:' + e.id + '&' + e.field, 0, 1); continue; }
      rows[ri].cells[colIdx] = e.zh;
      if (!touchedRows.has(ri)) touchedRows.set(ri, []);
      touchedRows.get(ri).push(e);
      applied++;
    }
    // 被改动行重建：按起始行【降序】splice（多行单元格译后行数可变）
    const order = [...touchedRows.keys()].sort((a, b) => rows[b].line - rows[a].line);
    for (const ri of order) {
      const start = rows[ri].line - 1, end = lineEnd[ri] - 1;
      let rowText = csvJoinRow(rows[ri].cells);
      if (eol === 'CRLF') rowText = rowText.replace(/\n/g, '\r\n');
      const replacement = rowText.split('\n');
      lines.splice(start, end - start + 1, ...replacement);
    }
    let out = lines.join('\n');
    if (raw.endsWith('\n') && !out.endsWith('\n')) out += nl;
    writeMod(rel, out);
    stat(rel, applied, missed);
  }
}

// ---------- B) 结构化伪 JSON：键级正则替换（三形状 + @L 出现序） ----------
function injectKeyed(entriesForFile) {
  const byFile = new Map();
  for (const e of entriesForFile) {
    if (!byFile.has(e.file)) byFile.set(e.file, []);
    byFile.get(e.file).push(e);
  }
  for (const [rel, list] of byFile) {
    let raw = readMod(rel).toString('utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    let applied = 0, missed = 0;
    const occCounters = new Map(); // 出现序计数（同 key 第 N 次出现）
    for (const e of list) {
      let re, n = 0;
      const mAt = String(e.id).match(/^(.*)@L(\d+)$/);
      if (e._shard === '02_structured' && (e.field === 'rank/name' || e.field.startsWith('rank'))) {
        const rid = mAt ? mAt[1] : e.id;
        if (mAt) { const k = rel + '#' + rid; n = occCounters.get(k) || 0; occCounters.set(k, n + 1); }
        re = new RegExp('("' + idEsc(rid) + '"\\s*:\\s*\\{\\s*"name"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")');
      } else if (e._shard === '02_structured' && e.field === 'fleetTypeNames') {
        const k2 = String(e.id).includes('/') ? String(e.id).split('/').pop() : e.id;
        re = new RegExp('("' + idEsc(k2) + '"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")');
      } else if ((e.file||'').endsWith('strings.json')) {
        re = new RegExp('("' + idEsc(e.field) + '"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")');
      } else if (['hullName', 'displayName', 'displayNameWithArticle', 'displayNameLong', 'displayNameLongWithArticle', 'descriptionPrefix', 'tech', 'title', 'difficulty', 'description'].includes(e.field)) {
        re = new RegExp('("' + idEsc(e.field) + '"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")');
      } else { missed++; stat(rel + '::unkeyed:' + e.field, 0, 1); continue; }
      const m = raw.match(re);
      if (!m || (m[2] !== enc(e.en) && m[2] !== e.en)) { missed++; stat(rel + '::keymismatch:' + e.id + '&' + e.field, 0, 1); continue; }
      raw = replaceNth(raw, re, a => a[1] + enc(e.zh) + a[3], n);
      applied++;
    }
    writeMod(rel, raw);
    stat(rel, applied, missed);
  }
}

// ---------- C) JSON 字符串值替换（tips/ship_names/chatter/bounty/exerelin/mod_info/planets/entities） ----------
function injectJsonValues(entriesForFile) {
  const byFile = new Map();
  for (const e of entriesForFile) {
    if (!byFile.has(e.file)) byFile.set(e.file, []);
    byFile.get(e.file).push(e);
  }
  for (const [rel, list] of byFile) {
    let raw = readMod(rel).toString('utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    let applied = 0, missed = 0;
    const enMap = new Map(); // en → zh（同 en 不同 zh 报警）
    for (const e of list) {
      if (enMap.has(e.en) && enMap.get(e.en) !== e.zh) console.error('  !! 同 en 不同 zh:', rel, JSON.stringify(e.en.slice(0, 40)));
      if (!enMap.has(e.en)) enMap.set(e.en, e.zh);
    }
    for (const [en, zh] of enMap) {
      const from = '"' + enc(en) + '"';
      const to = '"' + enc(zh) + '"';
      if (!raw.includes(from)) { missed++; stat(rel + '::valmissing:' + en.slice(0, 30), 0, 1); continue; }
      raw = raw.split(from).join(to);
      applied++;
    }
    writeMod(rel, raw);
    stat(rel, applied, missed);
  }
}

// ---------- C2) settings.json designTypeColors 键（R16：键本身要译，值色数组不动） ----------
function injectDesignTypeKeys(list) {
  const rel = 'data/config/settings.json';
  let raw = readMod(rel).toString('utf8');
  let applied = 0, missed = 0;
  for (const e of list) {
    const from = '"' + enc(e.en) + '"';
    const to = '"' + enc(e.zh) + '"';
    const cnt = raw.split(from).length - 1;
    if (cnt !== 1) { missed++; stat(rel + '::keyambig:' + e.en + 'x' + cnt, 0, 1); continue; }
    raw = raw.replace(from, to);
    applied++;
  }
  writeMod(rel, raw);
  stat(rel + '::designTypeKeys', applied, missed);
}

// ---------- D) changelog.md：按 changelog@<行号> 空行分段块回填 ----------
function injectChangelog(list) {
  const byFile = new Map();
  for (const e of list) {
    if (!byFile.has(e.file)) byFile.set(e.file, []);
    byFile.get(e.file).push(e);
  }
  for (const [rel, le] of byFile) {
    let raw = readMod(rel).toString('utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const eol = detectEol(raw);
    const lines = raw.split(eol === 'CRLF' ? '\r\n' : '\n');
    let applied = 0, missed = 0;
    for (const e of le) {
      const m = String(e.field).match(/^changelog@(\d+)$/);
      if (!m) { missed++; continue; }
      const start = Number(m[1]) - 1; // 0 基
      if (start < 0 || start >= lines.length || !lines[start].trim()) { missed++; continue; }
      let end = start;
      while (end + 1 < lines.length && lines[end + 1].trim() !== '') end++;
      const blockText = lines.slice(start, end + 1).join('\n').trim();
      if (blockText !== String(e.en).trim()) { missed++; stat(rel + '::blockmismatch@' + (start + 1), 0, 1); continue; }
      const zhLines = e.zh.split('\n');
      lines.splice(start, end - start + 1, ...zhLines);
      applied++;
    }
    writeMod(rel, lines.join(eol === 'CRLF' ? '\r\n' : '\n'));
    stat(rel, applied, missed);
  }
}

// ---------- E) mission_text.txt 整文件 ----------
function injectWholeFile(list) {
  for (const e of list) { writeMod(e.file, e.zh); stat(e.file, 1, 0); }
}

// ---------- F) Janino .java 字面量替换（zh 做 Java 转义） ----------
function injectJanino(list) {
  const byFile = new Map();
  for (const e of list) {
    if (!byFile.has(e.file)) byFile.set(e.file, []);
    byFile.get(e.file).push(e);
  }
  for (const [rel, le] of byFile) {
    let raw = readMod(rel).toString('utf8');
    let applied = 0, missed = 0;
    for (const e of le) {
      const from = '"' + e.en + '"';   // en 保持源码原始转义
      const zhEsc = e.zh.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const to = '"' + zhEsc + '"';
      if (!raw.includes(from)) { missed++; stat(rel + '::litmissing:' + e.en.slice(0, 30), 0, 1); continue; }
      raw = raw.split(from).join(to);
      applied++;
    }
    writeMod(rel, raw);
    stat(rel, applied, missed);
  }
}

// ---------- 分发 ----------
const isCsv = e => e.file && CSV_IDCOL[e.file] !== undefined;
const isJanino = e => (e.file||'').endsWith('.java');
const isWhole = e => (e.file||'').endsWith('mission_text.txt') && e.field === 'text';
const isChangelog = e => /^changelog@\d+$/.test(e.field);
const isDesignKeys = e => e.file === 'data/config/settings.json';
const isKeyed = e => /\.(faction|ship|skin|variant)$/.test(e.file||'') || (e.file||'').endsWith('/descriptor.json')
  || (e.file||'').endsWith('strings.json');
const isJsonVal = e => (e.file||'').endsWith('.json') || (e.file||'').endsWith('mod_info.json');

console.log('=== CSV ===');
injectCsv(todo.filter(e => isCsv(e)));
console.log('=== keyed structured ===');
injectKeyed(todo.filter(e => !isCsv(e) && !isJanino(e) && !isWhole(e) && !isChangelog(e) && !isDesignKeys(e) && isKeyed(e)));
console.log('=== json values ===');
injectJsonValues(todo.filter(e => !isCsv(e) && !isJanino(e) && !isWhole(e) && !isChangelog(e) && !isDesignKeys(e) && !isKeyed(e) && isJsonVal(e)));
console.log('=== designTypeColors keys ===');
injectDesignTypeKeys(todo.filter(isDesignKeys));
console.log('=== changelog ===');
injectChangelog(todo.filter(isChangelog));
console.log('=== whole files ===');
injectWholeFile(todo.filter(e => !isCsv(e) && !isJanino(e) && isWhole(e)));
console.log('=== janino ===');
injectJanino(todo.filter(isJanino));

// ---------- G) jar 常量池补丁 ----------
{
  const jarList = todo.filter(e => e._shard === '04_jar');
  const mapping = new Map();
  for (const e of jarList) mapping.set(e.c, e.zh);
  console.log('=== jar patch ===', mapping.size, 'mappings');
  if (mapping.size > 0 && !DRY) {
    const srcDir = path.join(TMP, 'Draconis_jar');
    const patchDir = path.join(TMP, 'Draconis_patch_jar');
    fs.rmSync(patchDir, { recursive: true, force: true });
    fs.cpSync(srcDir, patchDir, { recursive: true });
    const { execFileSync } = require('child_process');
    const mapObj = Object.fromEntries(mapping);
    fs.writeFileSync(path.join(TMP, 'draconis_jar_mapping.json'), JSON.stringify(mapObj, null, 1), 'utf8');
    execFileSync('node', [GAME + '/_work/skills/shared/scripts/patchdir.js', path.join(TMP, 'draconis_jar_mapping.json'), patchDir], { stdio: 'inherit' });
    const jarRel = 'jars/Draconis.jar';
    const bak = GAME + '/_work/mod_bak/Draconis-Fleet_0.7.9_jar_backup';
    fs.mkdirSync(bak, { recursive: true });
    if (!fs.existsSync(path.join(bak, 'Draconis.jar.orig'))) fs.copyFileSync(path.join(MOD, jarRel), path.join(bak, 'Draconis.jar.orig'));
    execFileSync('node', [GAME + '/_work/skills/shared/scripts/rezip.js', patchDir, path.join(MOD, jarRel)], { stdio: 'inherit' });
    stat(jarRel, mapping.size, 0);
  } else if (DRY) {
    stat('jars/Draconis.jar (dry)', mapping.size, 0);
  }
}

// ---------- 汇总 ----------
console.log('\n===== 注入汇总', DRY ? '(DRY)' : '', '=====');
let totA = 0, totM = 0;
const missedDetail = [];
for (const [f, r] of Object.entries(report)) {
  totA += r.applied; totM += r.missed;
  if (r.missed > 0 || r.applied > 0) console.log(f.padEnd(70), 'applied', r.applied, 'missed', r.missed);
}
console.log('TOTAL applied:', totA, 'missed:', totM);
fs.mkdirSync(W + '/out', { recursive: true });
fs.writeFileSync(W + '/out/apply_report.json', JSON.stringify({ dry: DRY, report }, null, 1), 'utf8');
