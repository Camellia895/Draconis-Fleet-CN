// merge_shards.js — 把各提取产物合并成 ≤5 份交付 shard（按载体类型分片，交付契约 §4.1）
// 用法: node merge_shards.js <workDir> <outWorklistDir>
'use strict';
const fs = require('fs');
const path = require('path');

const W = process.argv[2];
const OUT = process.argv[3];
const rd = p => JSON.parse(fs.readFileSync(path.join(W, p), 'utf8'));
const wr = (name, arr) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(arr, null, 1), 'utf8'); return arr.length; };

const sec01 = rd('worklist/sec_01_data_csv.json');
const sec02 = rd('worklist/sec_02_structured.json');
const sec03 = rd('worklist/sec_03_rules_missions.json');
const sec05 = rd('worklist/sec_05_misc.json');
const extra = rd('worklist/sec_extra.json');
const janino = rd('worklist/sec_janino_mission.json');
const jar = rd('out/jar_translate.json');

// ---- locator 去重：重复 (file,id,field) 的后续条目 id 加 @L<行号>（注入按行号定位） ----
function dedup(arr) {
  const seen = new Map();
  for (const e of arr) {
    const key = e.file + '#' + e.id + '&' + e.field;
    if (!seen.has(key)) { seen.set(key, e); continue; }
    e.id = e.id + '@L' + (e.line || '?');
    e.note = (e.note ? e.note + '；' : '') + '同 id+field 重复条目，按行号 ' + e.line + ' 定位';
  }
  return arr;
}
// 空文本条目过滤（引擎合法空值，如无人机变体空 displayName——无可译内容）
function dropEmpty(arr) { return arr.filter(e => (e.en && e.en.trim()) || (e.c && e.c.trim())); }

// ---- 01_data：CSV 层原样 ----
const s1 = dropEmpty(dedup(sec01.map(e => ({ ...e, source: "new" }))));

// ---- 02_structured：.ship/.skin/.variant/.faction + skin 的 descriptionPrefix/tech ----
const skinExtra = extra.filter(e => e.file.endsWith('.skin'));
const s2 = dropEmpty(dedup([...sec02, ...skinExtra].map(e => ({ ...e, source: "new" }))));

// ---- 03_rules_missions：rules + 任务 + mission 源码 + strings.json ----
const misTranslate = janino.filter(e => e.decision !== 'skip' && e._kind === 'mission')
  .map(e => ({ file: e.file, id: e.id, field: e.field, line: e.line, en: e.en, zh: '', source: 'new', note: e.note }));
const stringsJson = janino.filter(e => e._kind === 'stringsJson')
  .map(e => ({ file: e.file, id: e.id, field: e.field, line: e.line, en: e.en, zh: '', source: 'new', note: e.note }));
const s3 = dropEmpty([...sec03, ...misTranslate, ...stringsJson]);

// ---- 04_jar：jar 常量池（c 键 = 常量原文） ----
const s4 = jar.map(e => ({ c: e.c, cls: e.cls || (e.classes || []).map(x => x.split('/').pop().replace(/\.class$/, '')).slice(0, 3).join('|'), zh: '', source: 'new', note: e.note || '' }));

// ---- 05_misc：tips/shipNames/伪JSON 配置/chatter/vengeance 数组/mod_info/changelog ----
const miscExtra = extra.filter(e => !e.file.endsWith('.skin'));
const s5 = dropEmpty([...sec05, ...miscExtra]);

fs.mkdirSync(OUT, { recursive: true });
const counts = {
  '01_data.json': wr('01_data.json', s1),
  '02_structured.json': wr('02_structured.json', s2),
  '03_rules_missions.json': wr('03_rules_missions.json', s3),
  '04_jar.json': wr('04_jar.json', s4),
  '05_misc.json': wr('05_misc.json', s5),
};
console.log(JSON.stringify(counts, null, 1));
console.log('TOTAL:', Object.values(counts).reduce((a, b) => a + b, 0));

// locator 唯一性自检（除 jar 层用 c 作键外）
for (const [name, arr] of Object.entries({ '01_data.json': s1, '02_structured.json': s2, '03_rules_missions.json': s3, '05_misc.json': s5 })) {
  const seen = new Set(); const dups = [];
  for (const e of arr) {
    const loc = e.file + '#' + e.id + '&' + e.field + (e.field.startsWith('changelog@') ? '' : '');
    // changelog@行号 已含行号，唯一
    if (seen.has(loc)) dups.push(loc);
    seen.add(loc);
  }
  if (dups.length) console.log('DUP in', name, dups.slice(0, 5), 'x' + dups.length);
}
console.log('locator check done');
