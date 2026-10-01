# Draconis Fleet（0.7.9）汉化术语表【定稿】

> 本表在共享术语表基础上**针对本 mod 修正/增补**，2026-09 汉化定稿已按本表回填。
> 来源标注：`[核心]` = 0.98a 核心汉化用词；`[自定]` = 本项目新定；`[保留]` = 有意不译。
> **动笔前先读第 8 份《写作规范》（`starsector-mod-localization-spec`）**：占位符 `%`→`%%`、
> `\u0001` 数量位置、CSV 引号、禁 `「」` 用 `【】`、`${}` 等格式铁律都在那里。

## 0. 本 mod 硬约束（先读）

1. **R16 设计类型三通道**：`settings.json` 的 `designTypeColors` 键、各 CSV 的 `tech/manufacturer` 列、
   `.skin` 的 `tech` 字段，同一设计类型的译文必须**逐字一致**。定稿：
   - `Draconis` → **德拉科尼斯**
   - `XLII Battlegroup` → **第42战斗群**
   - （`Proto-Draconis` → 原型德拉科尼斯；`Unknown` → 未知）
2. **`Fafnir`（星系名）保留英文**：`createStarSystem` + `getStarSystem` 共用查找键，
   翻译破坏旧存档兼容。**星图上的其余天体名一律跟随保留拉丁**（Itoron / Athebyne / Kori / Vorium /
   Tiamat / Nidhogg / Jormungandr / Hel / Ladon / Vritra），保持星图风格统一；地理通名意译
   （the Rift 裂隙、Ring-Port 环港、Stellar Array 星辉阵列、Buoy 浮标、Relay 中继站、
   Inner Belt 内环带、Outer Ice Belt 外冰带、Lost Gate 失落星门）。
3. **AIO 拼接段条目**：`" alpha"`、`" is"`、`"s are"` 等碎片译文须与前后段连读成句。
   纯英文词法碎片（`s`、`s are`、`s)`、`\u0001s`）无中文对应，**保留英文**。

## 1. 舰船名：天龙座星官体系（本汉化的核心决定）

作者以天龙座恒星为全部舰船命名，且已用汉语拼音埋下星官名（Tianlong=天龙、Tianbang=天棓、
Shaowei=少尉、Pojun=破军……）。汉化把整支舰队还原为**中文星官名**（经中维基天龙座恒星列表核实）：

| EN | ZH | 依据 |
|---|---|---|
| Thuban (α) | 右枢 | 紫微右垣第一星 |
| Rastaban (β) | 天棓三 | |
| Eltanin (γ) | 天棓四 | 天龙座最亮星 |
| Grumium (ξ) | 天棓一 | |
| Kuma (ν) | 天棓二 | |
| Altais (δ) | 天厨一 | |
| Alsafi (σ) | 天厨二 | |
| Aldhibah (ζ) | 上弼 | 紫微左垣（Nodus I） |
| Aldibain (η) | 少宰 | |
| Eldsich (ι, Ed Asich) | 左枢 | 紫微左垣第一星 |
| Giausar (λ) | 上辅 | |
| Alrakis (μ) | 天棓增九 | |
| Errakis (μ 变体拼写) | 天棓增十 | 与上行同星异拼，中文以相邻增星区分 |
| Alwaid (β 传统别名) | 龙首 | β=天棓三已被 Rastaban 占用，取"龙头"意译 |
| Alruba (χ, al-ruba‘“驼羔”) | 驹 | χ=御女四，但御女已给 Yunu，改取词源"幼驼"→ 驹 |
| Dziban (ψ¹, “双狼”) | 双狼 | ψ 无通行中文名，取词源 |
| Asuia | 阿苏娅 | β 的古变名；舰体设定为“识别错误”的异类，音译保留异质感 |
| Nodus（“龙身之节”） | 龙节 | δ/ζ 的 Nodus II/I 均已被占，取“节”意译 |
| Sunsetter | 落日 | |
| Thorne | 荆棘 | |
| Excalibur（MRM 无人舰体） | 断钢剑 | |
| Tianlong / Tianbang / Tianyi / Tiangou | 天龙 / 天棓 / 天一 / 天狗 | 拼音还原 |
| Yinde / Yunu / Zhushi / Nushi / Shangshu | 阴德 / 御女 / 柱史 / 女史 / 尚书 | 拼音还原（均天龙座星官） |
| Shaobi / Shaowei / Pojun | 少弼 / 少尉 / 破军 | 拼音还原 |
| Jufeng / Juni / Juza | 飓风 / 主计 / 主宰 | Juni 图鉴称"会计改设计"，故名"主计"；Juza 音节无星官对应，取"主宰" |
| Assault/Utility Drone | 强击无人机 / 勤务无人机 | |
| Armor/Vambrace Module | 装甲模块 / 护臂模块 | |

- `Mk.II` 保留写法（如 驹Mk.II、天龙Mk.II）；皮肤后缀 `(XLII)` → `（42）`；
  `Rastabam`（作者笔误）→ 天棓三。
- 原型舰体 hullName 与本体同名；tech 列 = 原型德拉科尼斯。

## 2. 势力与组织

| EN | ZH |
|---|---|
| Draconis Alliance / the Alliance / DDA | 德拉科尼斯同盟 / 同盟 / DDA |
| Draconis Defence Alliance | 德拉科尼斯防卫同盟 |
| Alliance Intelligence Office / the Office / AIO | 同盟情报局 / 情报局 / AIO |
| Draconis (XLII) Battlegroup | 德拉科尼斯第42战斗群 |
| the Forty Second / 42nd Defence Fleet | 第42防卫舰队 |
| Fleet Admiral / Commander / Rear Admiral | 舰队元帅 / 指挥官 / 海军少将 |
| Chief of Base Operations | 基地运作长 |
| DRACON 5/4/3/2/1 | 冷锻 / 长夜戒备 / 亮剑 / 露刃 / 死灯（DRACON 字样保留） |
| Steel Curtain Protocol | 钢铁幕帘协议 |
| Draconis Priority Target / High-Value Target | 德拉科尼斯优先目标 / 高价值目标 |
| CENTCOM HQ / SATCOM / Octantis Uplink | 中央司令部 / 通信总站 / Octantis 上行链路 |
| 核心势力 | 霸主 / 速子科技 / 卢德教会 / 卢德左径 / 英仙座联盟 / 辛达强权 / 海盗 / 非势力团体 |

## 3. 人名（保留拉丁）

Emil August（舰队元帅）、Elias Korrin、Daniel Ancker、Kori（人名兼站名）、Samuel J. Harrows、
Vasner、Sigma Octantis（人格化 AI，语调：机器神，冷、精确、俯视）。台词中署名军衔译中文。

## 4. 武器命名（定稿）

突刺剑高射炮 · 剃刀高射炮 · 细剑自动炮 · 拳刺炮弹发射器 · 长管炮线圈炮 · 双手大剑自动炮 ·
长剑自动炮 · 投石机炮弹发射器 · 仁慈刺链炮 · 双矛炮 · 配重投石机炮 · 应答剑电磁炮（Fragarach，意译"应答剑"）·
阔剑电磁炮 · 粒子爆发长枪 · 恰西克质量驱动器 · 索夫尼亚爆发长枪 · 战锤质量驱动器（Piernacz）·
破剑刃短程导弹发射器 · 微型阔斧枪发射器 · 长戟级鱼雷（弹舱）· 半弓级鱼雷（弹舱）· 大弓级鱼雷发射器 ·
阔斧枪中程导弹发射器 / 多管火箭发射器 · 长矛多管火箭发射器 · 薙刀多管火箭发射器 · 滚刀多管火箭发射器 ·
杜兰达尔Mk.I/Mk.II主炮 · 破甲细剑主炮 · 自动机炮 · 火绳钩枪短程导弹发射器 · 弯刀级鱼雷 ·
单刃剑级鱼雷 · 弯月刀级鱼雷 · 钩镰枪级鱼雷 · 投石索自动炮 · 波纹剑质量驱动器 · 诱饵发射器 ·
断钢剑导弹改装型 · 雷达碟 · 相位鱼雷 · 军刀中程导弹发射器 · SLAP-ER巡航导弹 · 迷雾锚 ·
姿态推进器 / 旋转雷达罩 / 蓝色闪灯 / 左右翼梢 / 推盘（装饰模块，后缀（德拉科尼斯））· 制导湮灭火箭巢

## 5. 舰船系统 / 船插（定稿）

回避规程 · 破壁/脉冲星/黑障/叛道干扰阵 · 断钢剑打击 · 应急动力 · 应急维修 · 时间滑移 · 时间突进 ·
相位斗篷 · 诱饵发射器 · 强击无人机 · 雷达阵列 · 相位鱼雷阵列 · 毁灭模式 · 幅能循环器 · 等离子喷射 ·
战斗冲刺 · 横向跃迁 · 猎户驱动 · 电容核心 · 分流驱动 · 战时应急功率 · 弹药选择器 ｜ 德拉科尼斯舰体 ·
第42战斗群 · 咆哮电子战套件 · 头痛电子战套件 · 自动诱饵撒布器 · 导弹控制矩阵 · 瞄准系统 · 先进弹道火控 ·
自适应幅能矩阵 · 单丝拖缆 · 改进型子系统 · 不可名状之恐怖 · 超频核心 · 幅能反应装甲 · 紧急召回 ·
适应力场 · 放电线圈阵列 · 同盟精练船员 · 相位鱼雷阵列自动改装 · 边际配给（Marginal Allocation）

## 6. 舰队类型名（定稿）

商贸船队 · 转运船队 · 影子船队 · 补给船队 · 哨戒中队 · 巡逻舰队 · 战斗群 · 检察舰队 · 特遣舰队 ·
救济分舰队 · 快速反应部队 · 防卫舰队 · 入侵舰队 · 支援舰队 · 采矿船队 · 叛乱者 · 德拉科尼斯舰队 ｜
AIO监视分遣队 · AIO封锁支队 · AIO打击战斗群 · AIO影子舰队 · 远征打击群 · 第42分遣队

## 7. 固定舰名（03 任务与 05 舰名表共用）

Kori 之怒 · 无形坚忍（Abstract Endurance）· 使徒信经 · 坚定决心 · 不屈 · 擎天 · 铁幕 · 复仇 · 加尔各答 ·
霹雳 · 迅捷正义 · 夜色深沉 · 你觉得走运吗？ · 霸主之志 · 巴比伦 · 吾等全部希望 · 约瑟 · 执法者 · 航行者 ·
家外之家 · 遵从 · 威权 · 天罚 · 皓潮 · 律法者 · 风暴 · 警醒 · 守望者

## 8. 其他定稿

- magicBounty：蚀日行动（To Eclipse the Sun）· 幽灵协议 · APPARITION 幻影 · REVENANT ACTUAL 亡魂本尊 ·
  `auto` 保留 · 星辉阵列阿尔法/布拉沃/查理
- 舰队呼号前缀 DNS / HSS 保留拉丁；任务名 High Orbit 高轨
- HUD 状态词：进入射程 / 超出射程 / 无目标 / 无无人机 / 就绪 / 在线 / 离线 / 消散中 / 弹药 / 高爆 / 动能 / 破片 /
  干扰中！/ 武器卡壳！/ DPS：/ 状态：
- System Burn → 系统过载；Ghost Echo → 幽影回响；HYPERCOGNITION → 超认知；[OCTANTIS] 方括号保留
- "The Word"（Sigma Octantis 圣经语体）→ **道**
- 变体角色名：Elite 精英 · Standard 标准 · Strike 突击 · Escort 护卫 · Custom 定制 · Assault 强袭 ·
  Support 支援 · Overdriven 超载 · Prototype 原型 · Experimental 试验型 · Unstable 失稳型
  （武器 primaryRoleStr 的 Strike 为"打击"，与变体名区分）

## 9. 格式铁律速查（详见第 8 份 spec）

- 占位符**数量、顺序、形状**逐字保留：`%s` `%d` `%.1f` `%%` `\u0001` `$shipName` `==高亮==` `{{数值}}`。
- `04_jar.json` 中含 `\u0001` 的条目：数量与位置不变；**首尾空白逐字保留**（拼接段）。
- 译文一律用弯引号“”，不出现 ASCII 双引号（rules.csv 的 AddText 指令条目除外，其命令与引号结构保留）。
- 禁用字形：「」『』全角斜杠／全角波浪～（核心字库缺字形）。
- 保留英文条目 = `zh` 与原文逐字相同（星图专名、人名、`auto`、`s`-类词法碎片、DNS/HSS）。
