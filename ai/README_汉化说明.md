# 汉化说明（Draconis Fleet 0.7.9 → 德拉科尼斯舰队）

> 上一任译者的决策记录。术语全表见 `ai\zh\glossary.md`；逐条对照见 `ai\en\` ↔ `ai\zh\`（jar 常量条目用 `c` 键）与 `ai\zh\Draconis-Fleet_中英对照.xlsx`。

## 载体与机制

| 层 | 载体 | 处置 |
|---|---|---|
| data 层 | 13 个 CSV + 伪 JSON 配置 + 3 个 .faction + 125 个 .variant + 64 个 .ship/.skin | 结构化回填 |
| jar 层 | `jars/Draconis.jar` 常量池（869 条译文） | **常量池补丁，未重编译**（R7：只改被 CONSTANT_String 引用的常量）；crisis 3 类（Tracker/BaselineFactor/HAE factor）已随零核心修复重编译，显示字面量以中文内联源码重建；`Tags.INTEL_COLONIES` 保留原版键名（不再内联译文，保证 intel 筛选可用） |
| Janino 源码 | `data/missions/highorbit/MissionDefinition.java`（32 条字面量） | 源码字面量替换（jar 中无该类，运行时编译） |
| 外置文本表 | `data/strings/strings.json`（CHM 委托船插 tooltip，2 条） | 键序/行尾保持的文本替换 |

上游 `src/` 与 jar 存在**重构漂移**（部分文本从事件类迁到 `AIOStrings`/`FafnirAccessStrings` 持有类），jar 是运行真相——后续更新勿以 src 为准对齐。

## 关键决策

1. **星系名 `Fafnir` 保留英文**：`createStarSystem`/`getStarSystem` 共用查找键，翻译会破坏旧存档兼容。地图显示、叙事文本中的 Fafnir 一律不译。
2. **R16 三通道联动**：`designTypeColors` 两键 `Draconis`→德拉科尼斯、`XLII Battlegroup`→第42战斗群，与 ship_data/weapon_data/hull_mods 的 tech 列及 8 个 `.skin` 的 tech 字段逐字一致（`check_designtype.js` 验证）。`Proto-Draconis`（原型德拉科尼斯）上游就无颜色键，1:1 保留该行为。
3. **天龙座星名采用中文星官名**：Thuban=右枢、Eltanin=天棓四、Rastaban=天棓三、Alrakis=天厨二、Alruba=天一、Alwaid=龙节、Juza=天狗、Errakis=上弼、Aldhibah=上辅、Aldibain=少弼、Grumium=尚书、Shao/Shaowei=少尉/少尉、Nodus=荆棘、Kuma=驹等（全表见 `ai\zh\glossary.md` §2 与 ship_data 对照）。**字形修正**：星官名"棓"缺字库字形，全库 126 处改用同音"棒"（天棓一→天棒一等）；"薙刀"缺字形改"长刀"（3 处）。
4. **人名保留拉丁**：Emil August、Elias Korrin、Daniel Ancker、Kori、Samuel J. Harrows 不音译。
5. **DRACON 四档名**：LONG WATCH=长夜戒备、DRAWN SWORD=亮剑、BARE STEEL=露刃、DEAD LIGHT=死灯（tooltip/log/情报复用同词）。
6. **有意的保留项**：jar 调试日志 443 条（`Draconis: …`/`=== XXX ===` 等，玩家不可见）、逻辑键与枚举 736 条、人名组件 7 条、任务舰队前缀 DNS/HSS、chatter 军官名匹配表（`officer_name_to_character.csv`，翻译即失效）。全量审计：`ai\en\excluded_entries.json` + jar skip 审计（1263 条）。
7. **对话标点**：rules 对话用【】替代英文引号包提示；正文内引用用弯引号“”；`strings.json` 闸门强制无弯引号→该表用【】。

## 已知上游问题（EN 基线同报，未修）

- 3 个 `.faction` 的 `priorityShips.hulls` 引用 8 个不存在的 hull id（`XLII_*_fortysecond` 系——`.skin` 注册的是 skinHullId，上游引用写法与 0.98 引擎不匹配）。
- `custom_entities.json` 引用缺失贴图 `graphics/backgrounds/hyperspace_corona.png`（引擎有回退）。
- 两个无人舰 variant 无 displayName（引擎合法空值）。

## 2026-09-30 修正记录

- `rules.csv` 4 处 `AddText` 脚本（星门开场对白 / Blind-Eye 便条）的**命令收引号曾被译成 `】`**，触发游戏内 `RuleException: Unmatched quotes`——已修复为 ASCII 引号并经引擎侧 TestCsv 管线复检。**教训**：`script` 列的 `AddText "…"` 引号是命令语法，任何情况下不得替换为全角括号；正文内引用才用【】/弯引号。

## 更新指南（下一版 0.8.x）

1. 用 `ai\脚本\` 的提取链（recipe.json → extract_extra.js → classify_jar.js 含人工覆写表 jar_overrides.json → inject.js）重跑；
2. 以 EN 新版对 `ai\zh\` 旧译按 locator 复用（en 未变直接沿用）；
3. 注入前必跑 R15 断言（`check_install_source.js`），注入后跑 G3/G4 闸门全套。
