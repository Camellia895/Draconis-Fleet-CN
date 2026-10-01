// classify_jar.js — Draconis-Fleet jar 候选分类 v1
// 三桶输出：translate / skip / uncertain（人工复核）
// 依据（优先级从高到低）：
//   A. 调用点语义：候选 src[].lineText（或字符串持有类常量的**全源码使用点**）里出现
//      - 日志 API（log.info/warn/error、System.out、printStackTrace）→ skip log
//      - 显示 API（addPara/setText/setName/addBullet/tooltip/createSmallDescription…）→ translate ui
//      - 逻辑 API（setPostId/setPersonality/hasTag/getMemory/set/addTag/equals/contains 查找…）→ skip id
//   B. 字符串持有类常量名：MEM_/PATH_/$ → id；NAME/TITLE/DESC/PARA/TEXT/MSG/… → ui
//   C. 内容模式：路径/类名/签名/内存键/全大写枚举/小写snake id/纯符号 → skip
// 用法: node classify_jar.js <candidates.json> <srcDir> <outClassify.json> <outUncertain.txt>
'use strict';
const fs = require('fs');
const path = require('path');

const cand = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const SRC = process.argv[3];
const OUT = process.argv[4];
const OUTTXT = process.argv[5];

// 人工复核覆写表（精确匹配常量原文，优先级最高）
const OVERRIDES_PATH = path.join(__dirname, 'jar_overrides.json');
const OV = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')) : { translate: {}, skip: {} };

// ---------- 载入全部源码（185 文件），建 使用点索引 ----------
const srcFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.java')) srcFiles.push(p);
  }
})(SRC);
const SRC_LINES = srcFiles.map(f => ({
  rel: path.relative(SRC, f).split(path.sep).join('/'),
  lines: fs.readFileSync(f, 'utf8').split(/\r?\n/),
}));
// field 名 → [{file, line(1基), text}]
const USE_INDEX = new Map();
for (const sf of SRC_LINES) {
  sf.lines.forEach((t, i) => {
    const m = t.match(/\.([A-Z][A-Za-z0-9_]{2,})\b/g);
    if (!m) return;
    for (const raw of m) {
      const name = raw.slice(1);
      if (!USE_INDEX.has(name)) USE_INDEX.set(name, []);
      USE_INDEX.get(name).push({ where: `${sf.rel}:${i + 1}`, text: t.trim() });
    }
  });
}

// ---------- 规则表 ----------
const RE_LOG = /\blog\.(info|warn|error|debug)\b|Global\.getLogger|System\.out\.print|printStackTrace|\.trace\(/;
const RE_DISPLAY = /\b(addPara|setText|setTitle|addTitle|addBullet|addSectionHeading|addSectorInfo|createSmallDescription|createTitle|setName|addShipList|addText\b|appendToTooltip|addTooltip|setTooltip|setLabel|getSortString|getIntelTitle|createIntelTitle|setAchievement|showCodexEntry|addToIntel|setImportant|setValue\b|getTextLabel|addOption\b|optionSelected|addDescription|setShortcut|setFont)\b/;
const RE_LOGIC_API = /\b(setPostId|setPersonality|hasTag|addTag|removeTag|getMemoryWithoutUpdate|mem\.set|getMemory|setMemory|setCommodity|addCommodity|getCommodity|setFaction|setPlugin|addPlugin|setEntity|addEntity|setHullId|getHullId|setVariant|getVariant|setWeapon|getWeaponSpec|getHullModSpecWithId|setImportant|setForceNoFleets|setSensorProfile|setPlayerVisible|setInteractingFaction|setGlobal|getBoolean|equals\(|\.contains\(|startsWith|endsWith|equalsIgnoreCase|getEntryId|setPostId\(|setRankId|setPostId|playMusic|playSound|loadTexture|getSprite|setCircularOrbit|setCircularOrbitWithSpin|getSpec\(\)\.getId|hasHullMod|addHullMod|getFleetMember|setType|setDNA|addTag)\b/;
const RE_MEMKEY = /\$|mem_/;
const RE_PATH = /^(graphics|sounds|data|icons)[\/\\]|^[a-z0-9_\/]+\.(png|jpg|jpeg|ogg|wav|json|csv|txt|java|class|skill|skin|ship|variant|system|wpn|proj|faction)$/;
const RE_CLASSNAME = /^(levianeer|com|org|java)\.[\w.]+$/;
const RE_SIG = /^L[\w\/]+;|^\([\)\[BCDFIJSZLVW]+\(|^\[[BCDFIJSZL]/;
const RE_ALLCAPS = /^[A-Z0-9][A-Z0-9_]*$/;
const RE_SNAKE = /^[a-z0-9]+(_[a-z0-9]+)+$/;
const RE_NUMSYM = /^[-+*/×%()\d\s.,:%'"_=<>|~]*$/;
const RE_VARIANT = /^(XLII|FortySecond|draconis)[_A-Za-z0-9]*_(Standard|Strike|Elite|Assault|Attack|Support|Escort|Balanced|Raider|Shielded|Overdriven|Starting|Outdated|CS|PD|Fighter|Unstable|Experimental|Cargo|Hybrid|Draconis|fortysecond)/;

// 人名（保留原文；计数口径排除）
const PERSON_NAMES = new Set([
  'Emil August', 'Emil', 'August', 'Elias Korrin', 'Elias', 'Korrin', 'Daniel Ancker', 'Daniel', 'Ancker',
  'Kori', 'Samuel J. Harrows', 'Samuel', 'Harrows',
]);

// 显式 id/键（单个裸小写词或已核实的键）
const ID_WORDS = new Set([
  'crew', 'fuel', 'supplies', 'hand_weapons', 'aggressive', 'reckless', 'steady', 'cautious', 'timid',
  'decivilized', 'battlestation', 'cold', 'habitable', 'irradiated', 'athebyne', 'close', 'continue',
  'deliver', 'credits', 'barren-bombarded', 'barren-desert', 'characters', 'dda', 'a', 'none', 'yes', 'no',
]);
// 显式 display（裸词但确证为显示文本）
const UI_WORDS = new Set([
  'bombarding',              // raidActionText，渲染进敌意活动情报句
  'accessibility', 'stability', 'periodic disruptions', 'colony', 'exposure', // addPara 高亮词
]);

// 常量名前缀 → 逻辑键（选项 id 等）
const RE_OPT_CONST = /^(OPT_|OPTION_|MENU_|CHOICE_|BUT_)/;

// 显示上下文判定：单条 lineText
function ctxKind(lineText) {
  if (RE_LOG.test(lineText)) return 'log';
  if (RE_LOGIC_API.test(lineText)) return 'logic';
  if (RE_DISPLAY.test(lineText)) return 'display';
  return null;
}

// 定义行 → 常量名
function defName(lineText) {
  const m = lineText.match(/(?:static\s+final\s+)?String\s+(\w+)\s*[=+]/) || lineText.match(/String\s+(\w+)\s*=/);
  return m ? m[1] : null;
}

// 判定一个候选
function classifyOne(e) {
  const c = e.c;

  // ---- 人工覆写（最高优先级） ----
  if (OV.translate[c]) return ['translate', 'ui', '人工覆写：' + OV.translate[c]];
  if (OV.skip[c]) return ['skip', OV.skip[c].split('（')[0].startsWith('log') ? 'log' : (OV.skip[c].startsWith('id') ? 'id' : (OV.skip[c].startsWith('sig') ? 'sig' : 'fmt')), '人工覆写：' + OV.skip[c]];

  // ---- 内容模式先行（无歧义的先排除） ----
  if (c === '') return ['skip', 'fmt', '空串'];
  if (RE_SIG.test(c) && !c.includes(' ')) return ['skip', 'sig', '签名/类描述'];
  if (RE_CLASSNAME.test(c)) return ['skip', 'sig', '类名'];
  if (RE_PATH.test(c)) return ['skip', 'path', '资源路径'];
  if (RE_NUMSYM.test(c)) return ['skip', 'fmt', '纯数字/符号/格式片段'];
  if (RE_VARIANT.test(c)) return ['skip', 'id', '变体 id'];
  if (RE_MEMKEY.test(c)) return ['skip', 'id', '内存键 $…'];
  if (RE_SNAKE.test(c)) return ['skip', 'id', '小写下划线 id'];
  if (RE_ALLCAPS.test(c) && c.length > 2) return ['skip', 'id', '全大写枚举/选项键'];
  if (/^(XLII|FortySecond)_[A-Za-z0-9_]+$/.test(c) && !c.includes(' ')) return ['skip', 'id', 'mod 内部 id'];
  // camelCase 标识符（配置键/字段名/地图键）
  if (/^[a-z][a-zA-Z0-9]*$/.test(c) && c.length > 3 && /[A-Z]/.test(c)) return ['skip', 'id', 'camelCase 键'];
  // 纯格式片段：只有 \u0001 占位符 + 标点/数字/百分号（无字母词）
  if (/^[\u0001\s.,:\/()%\d-]+$/.test(c)) return ['skip', 'fmt', 'recipe 纯占位/标点片段'];
  if (/^(%.2f|%.0f|%d|%s|%%)[\d%.\/xXf]*$/.test(c.replace(/\u0001/g, '').trim())) return ['skip', 'fmt', 'printf 格式片段'];
  // 带符号的数值 recipe 片段（+\u0001 / ×\u0001 / -%d / %.1fx / 1.5x）
  if (/^[+×-]?[\u0001%][\d.,%fxds]*$/.test(c)) return ['skip', 'fmt', '数值/格式片段'];
  if (/^\d+(\.\d+)?x$/.test(c)) return ['skip', 'fmt', '倍率片段'];
  // 内存键/键名 recipe 片段（_\u0001、\u0001_buff、\u0001_store_purchase…）
  if (/^[\u0001_][\u0001\w]*$/.test(c)) return ['skip', 'id', '键名拼接片段'];
  // 日志前缀（本代码库惯例）
  if (/^(Draconis: |DDA: |    >>> |=== )/.test(c)) return ['skip', 'log', '调试日志'];
  // 人名组件（保留原文；计数口径排除人名）
  if (PERSON_NAMES.has(c)) return ['skip', 'other', '人物姓名组件（保留原文）'];
  if (UI_WORDS.has(c)) return ['translate', 'ui', '确证显示词（高亮/情报句）'];
  if (ID_WORDS.has(c)) return ['skip', 'id', '裸词 id/枚举/键'];
  // 裸小写单词（无空格）= id/枚举/选项键（显示片段几乎都带前导空格/占位符/大写）
  if (/^[a-z][a-z0-9-]*$/.test(c) && c.length > 1) return ['skip', 'id', '裸小写词 id'];

  // ---- 收集有效判定上下文 ----
  let ctxs = (e.src || []).map(s => s.lineText || '');
  // 无对齐（indy recipe 常见）→ 内容回查：取候选里的特征词在源码里搜行（双方归一化为纯字母，绕开弯引号）
  if (!ctxs.some(t => t.trim())) {
    const words = c.replace(/[^A-Za-z]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    if (words.length) {
      words.sort((a, b) => b.length - a.length);
      for (const needle of words) {
        const hits = [];
        for (const sf of SRC_LINES) {
          for (const t of sf.lines) {
            if (t.replace(/[^A-Za-z]/g, '').includes(needle)) { hits.push(t.trim()); if (hits.length >= 4) break; }
          }
          if (hits.length >= 4) break;
        }
        if (hits.length > 0 && hits.length <= 40) { ctxs = hits; break; }
      }
    }
  }
  // 定义行 → 常量名 → 全源码使用点
  let constName = null;
  for (const t of ctxs) { constName = defName(t); if (constName) break; }
  let usageTexts = [];
  let usageIsDefinition = true;
  if (constName) {
    const uses = USE_INDEX.get(constName) || [];
    usageTexts = uses.filter(u => !/String\s+\w+\s*=/.test(u.text) || /"[^"]*"/.test(u.text));
    // 只保留"非定义行"的使用
    const realUses = uses.filter(u => !new RegExp('String\\s+' + constName + '\\s*=').test(u.text));
    if (realUses.length) { usageTexts = realUses.map(u => u.text); usageIsDefinition = false; }
  }

  const effTexts = usageIsDefinition ? ctxs : usageTexts;
  const kinds = new Set();
  for (const t of effTexts) { const k = ctxKind(t); if (k) kinds.add(k); }

  const isHolder = constName && effTexts.every(t => /static\s+final\s+String/.test(t) || t === '');

  // ---- 冲突：既当查找键又当显示 ----
  if (kinds.has('logic') && (kinds.has('display') || kinds.size === 0)) {
    return ['uncertain', '', '逻辑/显示混合使用：' + effTexts.slice(0, 2).map(t => t.slice(0, 90)).join(' ⏐ ')];
  }
  if (kinds.has('log') && kinds.size === 1) return ['skip', 'log', '调试日志'];
  if (kinds.has('display')) return ['translate', 'ui', '显示 API 调用点'];
  if (kinds.has('log')) return ['skip', 'log', '调试日志'];
  if (kinds.has('logic')) return ['skip', 'id', '逻辑 API 实参（查找键）'];

  // ---- 常量名启发（持有类/无调用点） ----
  if (constName) {
    // OPT_* 名的常量：值是裸小写词才是真选项 id；值是句子的是选项文本（2026-09 实测误杀修正）
    if (RE_OPT_CONST.test(constName) && /^[a-z][a-z0-9_ "]*$/.test(c)) return ['skip', 'id', '选项 id 常量（' + constName + '）'];
    if (/^(MEM_|PATH_|KEY_|ID_|TAG_)/.test(constName)) return ['skip', 'id', '持有类键常量'];
    if (/(NAME|TITLE|DESC|PARA|TEXT|MSG|LINE|QUOTE|BRIEF|TAGLINE|INTEL|REPORT|WARNING|OPTION|CHOICE|LABEL|HEADER|PARAGRAPH|SUFFIX|PREFIX)/.test(constName))
      return ['translate', 'ui', '持有类显示常量（' + constName + '）'];
    if (/(HIGHLIGHT|FMT|FORMAT)/.test(constName)) return ['translate', 'fmt', '格式/高亮片段（拼接段，R6）'];
  }

  // ---- 内容启发：带空格的自然语言 / 对话引语 ----
  if (/^["“]/.test(c)) return ['translate', 'ui', '对话引语'];
  if (/[a-z]{3} [a-z]{3}/i.test(c)) {
    return ['translate', 'ui', '自然语言文本（无调用点上下文）'];
  }

  return ['uncertain', '', '无判定依据：' + JSON.stringify(c.slice(0, 90))];
}

const out = [];
const un = [];
for (const e of cand) {
  const [decision, category, note] = classifyOne(e);
  const item = {
    c: e.c,
    decision, category: category || 'other',
    cls: (e.classes || []).map(x => x.split('/').pop().replace(/\.class$/, '')).slice(0, 3).join('|'),
    note,
  };
  if (decision === 'uncertain') {
    item.srcCtx = (e.src || []).map(s => s.ctx + ' :: ' + (s.lineText || '').slice(0, 140));
    un.push(item);
  }
  out.push(item);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
const byDecision = {};
for (const o of out) byDecision[o.decision] = (byDecision[o.decision] || 0) + 1;
let txt = '';
un.forEach((u, i) => {
  txt += `--- #${i + 1} [${u.cls}]\n  c: ${JSON.stringify(u.c)}\n  note: ${u.note}\n  (srcCtx: ${(u.srcCtx || []).join(' || ') || '无'})\n`;
});
fs.writeFileSync(OUTTXT, txt, 'utf8');
console.log('total:', out.length, JSON.stringify(byDecision));
console.log('uncertain list ->', OUTTXT);
