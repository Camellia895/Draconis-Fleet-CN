// extract_extra.js — Draconis-Fleet 数据层补充提取（recipe 覆盖不到的四处盲区）
// 1) tips.json：kTips 的正则只认未加引号的 `tips:`，本文件是 `"tips":`（合法 JSON 键）
// 2) .skin 的 descriptionPrefix / tech（图鉴前缀 + 文件级设计类型，R16 通道之一）
// 3) chatter 角色的嵌套 lines（战斗无线电台词，jsonDirObjects 只抓顶层键）
// 4) exerelin vengeanceFleetNames / vengeanceLevelNames / vengeanceFleetNamesSingle（数组盲区，Kayse 实测）
// 条目 schema 与 build_data_worklist.js 一致：{ file, id, field, line, en, zh:"", note }
// 用法：node extract_extra.js <modRoot> <outFile>
'use strict';
const fs = require('fs');
const path = require('path');
const SK = 'C:/game/StarSector.v0.9.8a-RC8/_work/skills/shared/scripts';
const { parseJsonLoose, findLineOf } = require(path.join(SK, 'pseudojson.js'));

const MOD = process.argv[2];
const OUT = process.argv[3];
const ENTRIES = [];
const add = e => ENTRIES.push(e);

// ---------- 1) tips.json（带引号键） ----------
{
  const file = 'data/strings/tips.json';
  const raw = fs.readFileSync(path.join(MOD, file), 'utf8').replace(/^\uFEFF/, '');
  // 正则截数组会被 tip 文本里的 "[Draconis]" 方括号截断 ⇒ 整文件 parseJsonLoose（已验证可解析）
  const parsed = parseJsonLoose(raw);
  const arr = Array.isArray(parsed.tips) ? parsed.tips : null;
  if (!arr) { console.error('tips extract fail'); process.exit(1); }
  arr.forEach((tip, i) => {
    // 本 mod 元素是 {freq, tip} 对象（原版是纯字符串）
    const t = typeof tip === 'string' ? tip : (tip && tip.tip);
    if (typeof t !== 'string' || !t.trim()) return;
    add({ file, id: 'tip' + (i + 1), field: 'text', line: findLineOf(raw, t.slice(0, 40)), en: t, zh: '', note: '加载界面提示（freq 为权重，勿动）' });
  });
}

// ---------- 2) .skin 的 descriptionPrefix / tech ----------
{
  const dir = 'data/hulls/skins';
  for (const f of fs.readdirSync(path.join(MOD, dir)).filter(x => x.endsWith('.skin'))) {
    const file = dir + '/' + f;
    const raw = fs.readFileSync(path.join(MOD, file), 'utf8');
    const obj = parseJsonLoose(raw);
    const id = f.replace(/\.skin$/, '');
    if (obj.descriptionPrefix) {
      add({ file, id, field: 'descriptionPrefix', line: findLineOf(raw, obj.descriptionPrefix.slice(0, 40)), en: obj.descriptionPrefix, zh: '', note: '图鉴描述前缀（引擎按 prefix+\\n\\n+正文 渲染；ship_data 的 name 是正文开头）' });
    }
    if (obj.tech && /[a-zA-Z]/.test(obj.tech)) {
      add({ file, id, field: 'tech', line: findLineOf(raw, obj.tech), en: obj.tech, zh: '', note: '文件级设计类型（须与 designTypeColors 键/ship_data tech 列译文精确一致，R16）' });
    }
  }
}

// ---------- 3) chatter 角色（嵌套 lines） ----------
{
  const dir = 'data/config/chatter/characters';
  for (const f of fs.readdirSync(path.join(MOD, dir)).filter(x => x.endsWith('.json'))) {
    const file = dir + '/' + f;
    const raw = fs.readFileSync(path.join(MOD, file), 'utf8');
    const obj = parseJsonLoose(raw);
    const id = f.replace(/\.json$/, '');
    if (obj.name) add({ file, id, field: 'name', line: findLineOf(raw, obj.name), en: obj.name, zh: '', note: '角色显示名（战斗 chatter 顶部）' });
    const lines = obj.lines || {};
    for (const [cat, arr] of Object.entries(lines)) {
      if (!Array.isArray(arr)) continue;
      arr.forEach((it, i) => {
        const t = typeof it === 'string' ? it : (it && it.text);
        if (!t || !t.trim()) return;
        add({ file, id, field: `lines.${cat}[${i}]`, line: findLineOf(raw, t.slice(0, 40)), en: t, zh: '', note: `战斗无线电台词（场景 ${cat}#${i + 1}）` });
      });
    }
  }
}

// ---------- 4) exerelin vengeance 舰队名数组 ----------
{
  const file = 'data/config/exerelinFactionConfig/XLII_draconis.json';
  const raw = fs.readFileSync(path.join(MOD, file), 'utf8');
  const obj = parseJsonLoose(raw);
  const keys = ['vengeanceLevelNames', 'vengeanceFleetNames', 'vengeanceFleetNamesSingle'];
  for (const k of keys) {
    (obj[k] || []).forEach((v, i) => {
      if (typeof v !== 'string' || !v.trim()) return;
      add({ file, id: 'XLII_draconis', field: `${k}[${i}]`, line: findLineOf(raw, v), en: v, zh: '', note: 'Nexerelin 报复舰队名（数组盲区补抓）' });
    });
  }
}

// ---------- 5) default_fleet_type_names.json（扁平字符串表，jsonObjects 不吃字符串值） ----------
{
  const file = 'data/world/factions/default_fleet_type_names.json';
  const raw = fs.readFileSync(path.join(MOD, file), 'utf8');
  const obj = parseJsonLoose(raw);
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'string' || !v.trim()) continue;
    add({ file, id: 'default_fleet_type_names', field: k, line: findLineOf(raw, '"' + v + '"'), en: v, zh: '', note: '特殊舰队类型显示名（键 ' + k + ' 为逻辑键不译）' });
  }
}

// ---------- 6) settings.json designTypeColors 键（R16：键必须与 CSV tech 列译文逐字一致） ----------
{
  const file = 'data/config/settings.json';
  const raw = fs.readFileSync(path.join(MOD, file), 'utf8');
  const obj = parseJsonLoose(raw);
  const dtc = obj.designTypeColors || {};
  for (const k of Object.keys(dtc)) {
    if (!/[a-zA-Z]{2}/.test(k)) continue;
    add({ file, id: 'designTypeColors', field: k, line: findLineOf(raw, '"' + k + '"'), en: k, zh: '', note: '设计类型颜色注册键（R16）：译文必须与 ship_data/hull_mods/.skin 的 tech/manufacturer 中文值逐字一致，否则该分类不上色' });
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(ENTRIES, null, 2), 'utf8');
console.log('extra entries:', ENTRIES.length);
