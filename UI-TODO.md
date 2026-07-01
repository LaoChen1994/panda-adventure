# 《熊猫探险》美术与音效资源开发清单 (UI-TODO.md)

本文件罗列了游戏从“矢量占位阶段”过渡到“商业上线阶段”所需的全部美术与音效资源。
请您按照以下规格设计图片或音效，并将其放置于 `/public/assets/` 对应的目录下，逻辑代码会自动通过加载器替换。

---

## 1. 熊猫人物角色精灵图 (Spritesheets)
所有熊猫角色包含 **待机 (Idle)**、**移动 (Walk)**、**受击 (Hurt)** 三种动画状态。
推荐规格：PNG 图集或每帧大小为 $64 \times 64$ 像素的序列帧。

| 目录/文件名 | 对应角色 | 动作状态 | 建议帧数 | 美术风格描述 |
| --- | --- | --- | --- | --- |
| `characters/kungfu_idle.png` | 功夫熊猫 | 待机 | 4 帧 | 红色武僧袍，双手自然握拳，呼吸起伏。 |
| `characters/kungfu_walk.png` | 功夫熊猫 | 奔跑 | 6 帧 | 步伐矫健，身躯随奔跑微动。 |
| `characters/archer_idle.png` | 翠竹射手 | 待机 | 4 帧 | 头戴斗笠，手握青竹弓，警戒站姿。 |
| `characters/archer_walk.png` | 翠竹射手 | 奔跑 | 6 帧 | 侧身跑，背部箭袋微微晃动。 |
| `characters/wealth_idle.png` | 财迷熊猫 | 待机 | 4 帧 | 手持金算盘，脖上挂铜钱，身形肥硕。 |
| `characters/wealth_walk.png` | 财迷熊猫 | 奔跑 | 6 帧 | 小碎步跑，铜钱发出碰撞的动态效果。 |
| `characters/shield_idle.png` | 铁甲霸王 | 待机 | 4 帧 | 身穿中式重甲，盾牌立地，极具安全感。 |
| `characters/shield_walk.png` | 铁甲霸王 | 奔跑 | 6 帧 | 沉重奔跑，踏步时有尘土飞扬效果。 |
| `characters/drunk_idle.png` | 醉拳大师 | 待机 | 4 帧 | 提着酒葫芦，站立时身体左右摇晃晃。 |
| `characters/drunk_walk.png` | 醉拳大师 | 奔跑 | 6 帧 | 踉踉跄跄的醉步奔跑。 |
| `characters/mechanic_idle.png` | 机械学者 | 待机 | 4 帧 | 戴单片镜，背着蒸汽齿轮箱，摆弄小扳手。 |
| `characters/mechanic_walk.png` | 机械学者 | 奔跑 | 6 帧 | 奔跑时背后齿轮箱有蒸汽排出。 |

---

## 2. 武器与子弹美术资产 (Icons & Projectiles)
武器分为**商店图标**与**战斗挂载体**；远程武器需要额外的**飞行子弹切图**。

| 武器ID | 对应名称 | 武器图标 (`64x64`) | 战斗持枪/持棍切图 | 子弹/弹体切图 |
| --- | --- | --- | --- | --- |
| `bamboo_stick` | 新手竹棍 | `icons/stick.png` | `weapons/stick.png` | 无 (近战挥动特效 `effects/swing.png`) |
| `bamboo_bow` | 青竹弓 | `icons/bow.png` | `weapons/bow.png` | `projectiles/arrow.png` (竹箭切图) |
| `gold_abacus` | 金算盘 | `icons/abacus.png` | `weapons/abacus.png` | `projectiles/coin_shot.png` (金币弹头) |
| `stone_shield` | 石制大盾 | `icons/shield.png` | `weapons/shield.png` | 无 (环绕盾牌防御体) |
| `wine_pot` | 醉拳酒壶 | `icons/pot.png` | `weapons/pot.png` | `projectiles/wine_drop.png` (酒滴弹药) |
| `wrench` | 扳手 | `icons/wrench.png` | `weapons/wrench.png` | 无 (召唤出的炮台：`summons/turret.png`) |
| `spear` | 烈焰红枪 | `icons/spear.png` | `weapons/spear.png` | 无 (火焰路径特效 `projectiles/fire_trail.png`) |
| `fan` | 五雷神扇 | `icons/fan.png` | `weapons/fan.png` | `projectiles/lightning_bolt.png` (雷电电符子弹) |

---

## 3. 怪物与 BOSS 资产表 (Sprites)
怪物包含**移动**与**攻击**动画。
推荐规格：小怪 $48 \times 48$ 像素，精英怪 $128 \times 128$ 像素，BOSS $256 \times 256$ 像素。

| 怪物 ID | 怪物名称 | 类型 | 精灵图/序列帧 | 美术风格描述 |
| --- | --- | --- | --- | --- |
| `caterpillar` | 变异毛毛虫 | 普通小怪 | `enemies/caterpillar.png` | 绿色、多足、身体呈波浪状蠕动。 |
| `rabbit` | 疯狂红眼兔 | 普通小怪 | `enemies/rabbit.png` | 红眼暴躁兔，起跳时有拉伸变形的蓄力感。 |
| `flower` | 毒藤食人花 | 普通小怪 | `enemies/flower.png` | 紫色花苞，扎根地下，发射绿毒液体。 |
| `boar` | 黑风寨山猪 | 普通小怪 | `enemies/boar.png` | 披甲野猪，冲锋时头低垂，獠牙锋利。 |
| `ape` | 竹林刺客猿 | 普通小怪 | `enemies/ape.png` | 黑色长臂猿，戴面具，双臂抓挠攻击。 |
| `gorilla` | 巨力狂猩 | 精英怪 | `enemies/gorilla.png` | 背部捆石碑，双拳锤击地面，裂地波特效。 |
| `centipede` | 百足蜈蚣 | 精英怪 | `enemies/centipede.png` | 机关蜈蚣，分节身体，尾部喷吐紫气。 |
| `taotie` | 邪化暴君 | 最终 BOSS | `enemies/taotie.png` | 大口饕餮，浑身长满荆棘，吞噬引力波特效。 |
| `dragon` | 九天青龙 | 最终 BOSS | `enemies/dragon.png` | 青铜巨龙，身体闪烁核心光芒，嘴部火焰喷吐。 |

---

## 4. 地图瓦片与场景元素 (Map Assets)
瓦片图（Tileset）推荐大小：$32 \times 32$ 或 $64 \times 64$ 像素，支持平铺。

| 地图 ID | 地图名称 | 地表瓦片图 (Tiles) | 动态场景/机关切图 |
| --- | --- | --- | --- |
| `bamboo_forest` | 幽静翠竹林 | `maps/forest_tile.png` | `maps/bamboo_bush.png` (可穿过的竹丛) |
| `lava_cave` | 熔岩地下城 | `maps/lava_tile.png` | `maps/geyser.png` (间歇泉口)、`maps/lava_flow.png` (岩浆沟) |
| `sky_island` | 太极悬浮空岛 | `maps/sky_tile.png` | `maps/yin_yang.png` (太极阴阳眼法阵)、`maps/abyss.png` (深渊边缘) |

---

## 5. UI 与特效切图
* **经验能量球与消耗品**：
  * `items/xp_gem.png` (蓝色发光小水晶)
  * `items/bamboo_coin.png` (竹子铜钱)
  * `items/chest.png` (精英怪掉落的红木宝箱)
  * `items/bamboo_shoot.png` (萌宠熊猫嘟嘟在地上产出的治疗高能竹笋)
* **武器与宠物弹药特效**：
  * `effects/chain_lightning.png` (连锁闪电线段切图)
  * `effects/shield_ring.png` (满血护盾的环绕光效)
  * `effects/level_up.png` (升级时的金色光柱)
  * `projectiles/fire_trail.png` (烈焰红枪刺击在地面残留的火焰路径粒子)
  * `projectiles/lightning_bolt.png` (五雷神扇发射出的电符)
  * `projectiles/web_net.png` (萌宠机关木蛛喷出的蛛网)
  * `projectiles/fox_fire.png` (萌宠灵狐阿宝射出的引燃妖火)
* **血条与进度条框**：`ui/bar_bg.png` / `ui/hp_fill.png` / `ui/xp_fill.png`

---

## 6. 音效与配乐需求 (Audio)
推荐格式：小体积 `mp3` 或 `ogg`。

| 类别 | 音频文件名 | 触发场景 | 音效效果说明 |
| --- | --- | --- | --- |
| **BGM** | `audio/bgm_menu.mp3` | 主菜单 | 悠扬国风、笛子/古筝舒缓音乐。 |
| **BGM** | `audio/bgm_combat.mp3` | 战斗波次中 | 紧凑、富有节奏感的快节奏国风战鼓。 |
| **BGM** | `audio/bgm_boss.mp3` | 第 20 波 Boss 战 | 史诗感、压迫感十足的交响加民乐。 |
| **SFX** | `audio/sfx_shoot.mp3` | 远程武器开火 | 清脆的竹箭离弦声或金币弹射声。 |
| **SFX** | `audio/sfx_melee.mp3` | 近战武器挥击 | 空气撕裂与打击肉体的闷响声。 |
| **SFX** | `audio/sfx_hurt.mp3` | 玩家受到伤害 | 熊猫的闷哼声或重甲受击声。 |
| **SFX** | `audio/sfx_dodge.mp3` | 触发闪避 | 飘逸的衣襟带风声。 |
| **SFX** | `audio/sfx_coin.mp3` | 拾取竹子金币 | 金属铜钱落袋的清脆叮当声。 |
| **SFX** | `audio/sfx_levelup.mp3`| 局内升级 | 华丽的编钟升级音效。 |
| **SFX** | `audio/sfx_merge.mp3` | 商店武器融合 | 兵器铸造或合成成功的“铛”声。 |
| **SFX** | `audio/sfx_explosion.mp3`| Boss技能/爆裂子弹 | 巨石碎裂或爆炸的低沉轰鸣声。 |

---

## 7. 萌宠跟随伙伴精灵图 (Pet Sprites)
所有宠物包含 **待机/飘浮 (Idle)** 和 **跑动/跟随 (Follow)** 动作状态。
每个状态推荐规格：$48 \times 48$ 像素的序列帧（透明PNG）。

| 目录/文件名 | 对应宠物 | 动作状态 | 美术风格描述 |
| --- | --- | --- | --- |
| `pets/rat_idle.png` / `rat_walk.png` | 萌宠・小竹鼠 | 待机 / 奔跑 | 背着小竹篓的小仓鼠，两腮鼓起，跑动时腿部打转。 |
| `pets/firefly_idle.png` | 萌宠・小萤火虫 | 飘浮 / 环绕 | 尾部发着暖黄色荧光的小飞虫，戴着护目镜，身体轻微上下漂浮。 |
| `pets/toad_idle.png` / `toad_jump.png` | 萌宠・招财金蟾 | 待机 / 弹跳跟随 | 趴在金元宝上、眯眼笑的金色蛤蟆，向前移动时一蹦一跳。 |
| `pets/spider_idle.png` / `spider_walk.png` | 萌宠・机关木蛛 | 待机 / 爬行 | 木质榫卯结构的八脚蜘蛛，眼睛亮蓝光，机械式快速爬行。 |
| `pets/baby_panda_idle.png` / `baby_panda_walk.png` | 萌宠・熊猫嘟嘟 | 待机 / 爬行跟随 | 咬着奶嘴、黑白相间的熊猫幼崽，在地上翻滚式移动或慢吞吞爬行。 |
| `pets/fox_idle.png` / `fox_walk.png` | 萌宠・灵狐阿宝 | 飘浮 / 灵动奔跑 | 三尾红狐，额头有火焰印记，跑动时身后带起火红色气流尾迹。 |

---

## 8. 集市卡面/道具图标列表 (Shop Item Icons)
道具购买时卡片上的图标，建议尺寸为 $64 \times 64$ 或 $128 \times 128$ 像素，透明底 PNG。
在没有美术资产时，游戏会默认加载 **Vibrant Emojis**（高饱和卡通 Emoji 字符）作为占位符。

* **道具 1 - 15 (白色普通品质)**：
  * `items/1.png` - 老旧的沙袋 (打满补丁的粗布沙袋)
  * `items/2.png` - 磨刀石 (灰色的粗糙砺石)
  * `items/3.png` - 羽毛箭翎 (火红色的飞羽箭翎)
  * `items/4.png` - 防弹背心 (绿色的厚实战术防弹衣)
  * `items/5.png` - 跑鞋 (画有黄色闪电的运动跑鞋)
  * `items/6.png` - 幸运四叶草 (翠绿、半透明的四叶草)
  * `items/7.png` - 存钱罐 (粉色小猪造型的瓷质存钱罐)
  * `items/8.png` - 劣质红药水 (红泡泡浮动的小药水瓶)
  * `items/9.png` - 吸血蝙蝠牙 (两颗雪白尖锐的吸血牙)
  * `items/10.png` - 放大镜 (红手柄的金边放大镜)
  * `items/11.png` - 小齿轮 (闪着黄铜亮光的机械小齿轮)
  * `items/12.png` - 坏掉的怀表 (表盘碎裂、指针飞转的怀表)
  * `items/13.png` - 智慧药水 (盛有蓝色发光药液的试管)
  * `items/14.png` - 增高鞋垫 (两只黄色软绵鞋垫)
  * `items/15.png` - 铁钉皮带 (扎着锋利铁钉的棕色皮带)
* **道具 16 - 27 & 52 (绿色优秀品质)**：
  * `items/16.png` - 巨大空心竹筒 (圆滚厚实的大空心竹筒)
  * `items/17.png` - 刺客面具 (画有红白相间刺客谱系的木面具)
  * `items/18.png` - 重型火药 (黑色皮革包的重型黑火药)
  * `items/19.png` - 合金扳手 (银灰色的钛合金开口大扳手)
  * `items/20.png` - 黄金算盘 (金灿灿的小算盘)
  * `items/21.png` - 备用电池 (绿色的特斯拉圆柱电池)
  * `items/22.png` - 急救绷带 (印有红十字的医用绷带)
  * `items/23.png` - 神速马靴 (带有一对白羽小翅膀的高筒马靴)
  * `items/24.png` - 荆棘背心 (编满褐色锐利木刺的防守背心)
  * `items/25.png` - 强光手电 (红色的工业强光手电筒)
  * `items/26.png` - 高蛋白竹笋 (水灵肥胖的剥皮嫩竹笋)
  * `items/27.png` - 幸运猫爪 (招财猫的肥嘟嘟粉色肉垫爪)
  * `items/52.png` - 避雷针 (捆绑了铜线圈的金属避雷针)
* **道具 28 - 35 & 41-43, 53 (蓝色稀有品质)**：
  * `items/28.png` - 狂战士药剂 (带有血丝脉络的猩红药剂瓶)
  * `items/29.png` - 墨家机关核心 (漂浮着淡蓝八卦条纹的金属核心)
  * `items/30.png` - 巨浪护腕 (绣有波浪云纹的蓝色战斗护腕)
  * `items/31.png` - 幽灵披风 (淡紫灰相间、半隐形斗篷)
  * `items/32.png` - 财富重担 (沉甸甸的黄金大麻袋)
  * `items/33.png` - 量子加速器 (流游量子脉冲的双层金属光环)
  * `items/34.png` - 吸血鬼伯爵披风 (红黑内衬的吸血鬼立领披风)
  * `items/35.png` - 指南针 (黄铜制成的复古指南针)
  * `items/41.png` - 龙筋玉带 (盘有龙纹、镶嵌翡翠的精致玉带)
  * `items/42.png` - 神手护腕 (青绿坚韧的羽弓射手护腕)
  * `items/43.png` - 天平筹码 (小天平托起几枚红黑筹码)
  * `items/53.png` - 醉仙葫芦 (金线缠绕、挂有阴阳穗的醉仙小酒葫)
* **道具 36 - 40 & 44-45, 54 (紫色史诗品质)**：
  * `items/36.png` - 【易筋经】 (古朴线装的泛黄武学秘籍)
  * `items/37.png` - 【九转还魂丹】 (闪耀七彩金光的仙家金丹)
  * `items/38.png` - 【核能竹子反应堆】 (散发幽绿色核能辐射光芒的金属竹节)
  * `items/39.png` - 【点金神手】 (纯金打造的熊猫巨爪)
  * `items/40.png` - 【虚空之眼】 (紫色水晶球内镶嵌的发光魔眼)
  * `items/44.png` - 玄铁重力甲 (通体亮黑色、重力环绕的重装太古板甲)
  * `items/45.png` - 太极阴阳玉 (完美的黑白双色太极圆形玉佩)
  * `items/54.png` - 九天玄晶 (流光溢彩的九彩能量水晶簇)| 九天青龙 | 最终 BOSS | `enemies/dragon.png` | 青铜巨龙，身体闪烁核心光芒，嘴部火焰喷吐。 |

---

## 4. 地图瓦片与场景元素 (Map Assets)
瓦片图（Tileset）推荐大小：$32 \times 32$ 或 $64 \times 64$ 像素，支持平铺。

| 地图 ID | 地图名称 | 地表瓦片图 (Tiles) | 动态场景/机关切图 |
| --- | --- | --- | --- |
| `bamboo_forest` | 幽静翠竹林 | `maps/forest_tile.png` | `maps/bamboo_bush.png` (可穿过的竹丛) |
| `lava_cave` | 熔岩地下城 | `maps/lava_tile.png` | `maps/geyser.png` (间歇泉口)、`maps/lava_flow.png` (岩浆沟) |
| `sky_island` | 太极悬浮空岛 | `maps/sky_tile.png` | `maps/yin_yang.png` (太极阴阳眼法阵)、`maps/abyss.png` (深渊边缘) |

---

## 5. UI 与特效切图
* **经验能量球**：`items/xp_gem.png` (蓝色发光小水晶)
* **金币**：`items/bamboo_coin.png` (竹子铜钱)
* **宝箱**：`items/chest.png` (精英怪掉落的红木宝箱)
* **光环与闪电**：
  * `effects/chain_lightning.png` (连锁闪电线段切图)
  * `effects/shield_ring.png` (满血护盾的环绕光效)
  * `effects/level_up.png` (升级时的金色光柱)
* **血条与进度条框**：`ui/bar_bg.png` / `ui/hp_fill.png` / `ui/xp_fill.png`

---

## 6. 音效与配乐需求 (Audio)
推荐格式：小体积 `mp3` 或 `ogg`。

| 类别 | 音频文件名 | 触发场景 | 音效效果说明 |
| --- | --- | --- | --- |
| **BGM** | `audio/bgm_menu.mp3` | 主菜单 | 悠扬国风、笛子/古筝舒缓音乐。 |
| **BGM** | `audio/bgm_combat.mp3` | 战斗波次中 | 紧凑、富有节奏感的快节奏国风战鼓。 |
| **BGM** | `audio/bgm_boss.mp3` | 第 20 波 Boss 战 | 史诗感、压迫感十足的交响加民乐。 |
| **SFX** | `audio/sfx_shoot.mp3` | 远程武器开火 | 清脆的竹箭离弦声或金币弹射声。 |
| **SFX** | `audio/sfx_melee.mp3` | 近战武器挥击 | 空气撕裂与打击肉体的闷响声。 |
| **SFX** | `audio/sfx_hurt.mp3` | 玩家受到伤害 | 熊猫的闷哼声或重甲受击声。 |
| **SFX** | `audio/sfx_dodge.mp3` | 触发闪避 | 飘逸的衣襟带风声。 |
| **SFX** | `audio/sfx_coin.mp3` | 拾取竹子金币 | 金属铜钱落袋的清脆叮当声。 |
| **SFX** | `audio/sfx_levelup.mp3`| 局内升级 | 华丽的编钟升级音效。 |
| **SFX** | `audio/sfx_merge.mp3` | 商店武器融合 | 兵器铸造或合成成功的“铛”声。 |
| **SFX** | `audio/sfx_explosion.mp3`| Boss技能/爆裂子弹 | 巨石碎裂或爆炸的低沉轰鸣声。 |
