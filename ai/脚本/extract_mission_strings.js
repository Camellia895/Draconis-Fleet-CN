// extract_mission_strings.js — 补提取 data/missions + data/strings/strings.json
// （extract_java_strings.js 只扫 data/plugins|scripts；strings.json 是 CHM 船插的外置文本表）
// 用法: node extract_mission_strings.js <modRoot> <outFile>
'use strict';
const fs = require('fs');
const path = require('path');
const SK = 'C:/game/StarSector.v0.9.8a-RC8/_work/skills/shared/scripts';
const { parseJsonLoose } = require(path.join(SK, 'pseudojson.js'));

const MOD = process.argv[2];
const OUT = process.argv[3];
const ENTRIES = [];
const add = e => ENTRIES.push(e);

// ---------- 1) data/missions/*/MissionDefinition.java ----------
const misDir = path.join(MOD, 'data/missions');
if (fs.existsSync(misDir)) {
  for (const sub of fs.readdirSync(misDir)) {
    const jp = path.join(misDir, sub, 'MissionDefinition.java');
    if (!fs.existsSync(jp)) continue;
    const rel = 'data/missions/' + sub + '/MissionDefinition.java';
    const lines = fs.readFileSync(jp, 'utf8').split(/\r?\n/);
    lines.forEach((l, i) => {
      for (const m of l.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        const en = m[1];
        if (!en.trim()) continue;
        // 分类（调用点语义）
        let field, note, decision = 'translate';
        if (/initFleet/.test(l)) { field = 'fleetPrefix'; decision = 'skip'; note = '舰队名前缀缩写（如 DNS/HSS），保留'; }
        else if (/setFleetTagline/.test(l)) { field = 'tagline'; note = '任务选单舰队标语'; }
        else if (/addBriefingItem/.test(l)) { field = 'briefing'; note = '任务简报条目'; }
        else if (/addToFleet/.test(l)) {
          // 行内引号串：idx0 = variant id（逻辑键），idx1 = 舰名（显示）
          const lits = [...l.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]);
          const idx = lits.indexOf(en);
          field = 'shipName';
          if (idx === 0) { decision = 'skip'; note = 'variant id（逻辑键，禁译 R12）'; }
          else note = '任务舰船名（可意译或保留原文）';
        }
        else { field = 'other'; note = '待人工核对'; }
        add({ file: rel, id: sub, field: field + '@' + (i + 1), line: i + 1, en, zh: '', source: decision === 'skip' ? 'excluded' : 'new', note, decision, _kind: 'mission' });
      }
    });
  }
}

// ---------- 2) data/strings/strings.json（CHM 外置文本表） ----------
{
  const rel = 'data/strings/strings.json';
  const p = path.join(MOD, rel);
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf8');
    const obj = parseJsonLoose(raw);
    for (const [ns, entries] of Object.entries(obj)) {
      for (const [k, v] of Object.entries(entries || {})) {
        if (typeof v !== 'string' || !v.trim()) continue;
        add({ file: rel, id: ns + '.' + k, field: k, line: (raw.slice(0, raw.indexOf(JSON.stringify(v).slice(1, -1))).split(/\r?\n/).length), en: v, zh: '', source: 'new', note: 'CHM 委托船插 tooltip 外置文本（getString("CHM","' + k + '")）', _kind: 'stringsJson' });
      }
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(ENTRIES, null, 2), 'utf8');
const byKind = {};
for (const e of ENTRIES) byKind[e._kind + ':' + (e.decision || 'new')] = (byKind[e._kind + ':' + (e.decision || 'new')] || 0) + 1;
console.log('entries:', ENTRIES.length, JSON.stringify(byKind));
