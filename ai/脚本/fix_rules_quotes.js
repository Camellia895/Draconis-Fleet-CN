// fix_rules_quotes.js — 修复 rules.csv script(AddText) 格尾被译成 】 的收引号（R2 事故，2026-09-30）
// 模式：格内 AddText "...正文。】 → ...正文。"（仅格尾；正文内部的【】不动）
// 同时校验：每行 AddText 计数 EN vs ZH 必须一致（防其它静默丢命令）
// 用法: node fix_rules_quotes.js
'use strict';
const fs = require('fs');
const { parseCsv, csvJoinRow } = require('C:/game/StarSector.v0.9.8a-RC8/_work/skills/shared/scripts/csvlib.js');

const GAME = 'C:/game/StarSector.v0.9.8a-RC8';
const CUR = GAME + '/mods/Draconis-Fleet/data/campaign/rules.csv';
const EN = GAME + '/_work/mod_bak/Draconis-Fleet_0.7.9_EN_backup/data/campaign/rules.csv';

let raw = fs.readFileSync(CUR, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const { header, rows } = parseCsv(raw);
const ii = header.indexOf('id'), si = header.indexOf('script');

// EN 的 AddText 计数基线
const enCounts = new Map();
{
  const e = parseCsv(fs.readFileSync(EN, 'utf8'));
  const ei = e.header.indexOf('id'), es = e.header.indexOf('script');
  for (const r of e.rows) {
    const id = (r.cells[ei] || '').trim();
    const sc = r.cells[es] || '';
    if (id && !id.startsWith('#')) enCounts.set(id, (sc.match(/AddText\b/g) || []).length);
  }
}

const lines = raw.split('\n');
const lineEnd = new Array(rows.length);
for (let i = 0; i < rows.length; i++) lineEnd[i] = (i + 1 < rows.length ? rows[i + 1].line - 1 : lines.length);
const fixed = [];
const touched = new Map();
for (let i = 0; i < rows.length; i++) {
  const id = (rows[i].cells[ii] || '').trim();
  if (!id || id.startsWith('#')) continue;
  const sc = rows[i].cells[si] || '';
  if (!sc.includes('AddText')) continue;
  // 结构核对：AddText 计数 vs EN
  const enN = enCounts.get(id) || 0;
  const zhN = (sc.match(/AddText\b/g) || []).length;
  if (zhN !== enN) console.error('  !! AddText 计数不一致 id=' + id + ' EN=' + enN + ' ZH=' + zhN);
  // 修复格尾 】→ "
  const t = sc.trimEnd();
  if (t.endsWith('】')) {
    const newSc = t.slice(0, -1) + '"';
    if (newSc !== sc) {
      rows[i].cells[si] = newSc;
      touched.set(i, 1);
      fixed.push(id);
      console.log('fixed:', id);
    }
  }
}
// 行级 splice（降序；LF 风格）
const order = [...touched.keys()].sort((a, b) => rows[b].line - rows[a].line);
for (const ri of order) {
  const start = rows[ri].line - 1, end = lineEnd[ri] - 1;
  let rowText = csvJoinRow(rows[ri].cells); // 该文件为 LF（check_eol 实证）
  lines.splice(start, end - start + 1, ...rowText.split('\n'));
}
fs.writeFileSync(CUR, lines.join('\n'), Buffer.byteLength('') >= 0 ? 'utf8' : 'utf8');
console.log('rows fixed:', fixed.length, fixed.join(', '));
