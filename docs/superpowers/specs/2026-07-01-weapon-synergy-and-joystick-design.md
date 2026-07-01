# 设计文档：武器羁绊系统与虚拟摇杆视觉层设计

本文档记录了《熊猫探险》的武器羁绊（Synergy）系统与虚拟摇杆（Joystick）视觉层优化的详细设计细节。

---

## 1. 武器羁绊系统 (Weapon Synergy)

### 1.1 数据配置表 (SYNERGY_DATABASE)
羁绊系统将根据玩家当前装备的武器标签（Tags）动态提供属性加成。加成设计遵循 $2/4/6$ 件的梯度。

在 `src/systems/WeaponSystem.ts` 中新增以下羁绊配置：

```typescript
export interface SynergyLevelConfig {
  count: number;
  modifiers: Record<string, number>; // 属性改变量，正数表示增加，百分比使用小数（如 0.1 代表 +10%）
}

export interface SynergyConfig {
  tag: string;
  name: string;
  levels: SynergyLevelConfig[];
}

export const SYNERGY_DATABASE: Record<string, SynergyConfig> = {
  melee: {
    tag: '近战',
    name: '近战大师',
    levels: [
      { count: 2, modifiers: { meleeDmg: 3 } },
      { count: 4, modifiers: { meleeDmg: 8, critChance: 5 } },
      { count: 6, modifiers: { meleeDmg: 15, critChance: 10, armor: 5 } }
    ]
  },
  ranged: {
    tag: '远程',
    name: '百步穿杨',
    levels: [
      { count: 2, modifiers: { rangedDmg: 3 } },
      { count: 4, modifiers: { rangedDmg: 8, range: 30 } },
      { count: 6, modifiers: { rangedDmg: 15, range: 60, attackSpeed: 10 } }
    ]
  },
  natural: {
    tag: '自然',
    name: '万物苏生',
    levels: [
      { count: 2, modifiers: { hpMax: 10 } },
      { count: 4, modifiers: { hpMax: 25, hpRegen: 3 } },
      { count: 6, modifiers: { hpMax: 50, hpRegen: 8, dodge: 5 } }
    ]
  },
  engineering: {
    tag: '工程',
    name: '墨家机关',
    levels: [
      { count: 2, modifiers: { engineering: 5 } },
      { count: 4, modifiers: { engineering: 15, hpMax: 5 } },
      { count: 6, modifiers: { engineering: 30, hpMax: 15, armor: 5 } }
    ]
  },
  wealth: {
    tag: '财富',
    name: '利滚利',
    levels: [
      { count: 2, modifiers: { harvest: 5 } },
      { count: 4, modifiers: { harvest: 15, xpGainModifier: 5 } },
      { count: 6, modifiers: { harvest: 30, xpGainModifier: 15, luck: 10 } }
    ]
  },
  magic: {
    tag: '魔法',
    name: '八卦乾坤',
    levels: [
      { count: 2, modifiers: { damageModifier: 5 } },
      { count: 4, modifiers: { damageModifier: 15, lifeSteal: 2 } },
      { count: 6, modifiers: { damageModifier: 30, lifeSteal: 5 } }
    ]
  }
};
```

### 1.2 羁绊属性计算与应用流程
1. 当玩家武器发生变化时（如在商店购买、卸下、拖拽合并），触发 `GameScene.ts` 内的属性重算逻辑。
2. 收集玩家当前装备的所有武器（`this.weaponSystem.getEquippedWeapons()`），统计它们所包含 righteousness。
3. 对每个 tag 计算出现次数，并匹配 `SYNERGY_DATABASE` 中对应的最大满足条件档位（Level）。
4. 先清除所有旧的羁绊修饰器（ID前缀为 `synergy_`）。
5. 针对激活的每个羁绊，构造 `AttributeModifier` 并添加到玩家的 `AttributeSystem` 中：
   * `id`: `synergy_<tag_key>`
   * `addVal`: 对属性的加法修正值
   * `mulVal`: 对属性的乘法百分比修正值
6. 属性变更后更新玩家的 `hpMax` 限制，并触发 `syncHUD()` 以同步界面上的数据。

---

## 2. 虚拟摇杆视觉层 (Virtual Joystick Overlay)

在 `GameScene.ts` 中引入一个绘图对象容器：
1. **构造函数中声明**：
   * `joystickGraphics: Phaser.GameObjects.Graphics`
   * `joystickBasePos: Phaser.Math.Vector2` (触屏按下的圆心位置)
2. **事件流逻辑**：
   * **`pointerdown`**：如果游戏处于活跃状态，记录按下的 `(pointer.x, pointer.y)` 为 `joystickBasePos`。把 `joystickGraphics` 移到该位置并设置为可见。绘制外侧底座圈（半径 50，填充灰色半透明，白细边框）和内侧操纵摇杆帽（半径 20，填充白色半透明）。
   * **`pointermove`**：更新移动逻辑。计算当前触控点与 `joystickBasePos` 之间的距离和角度。
     * 如果距离小于等于 50，将摇杆帽移动 to 触控点。
     * 如果距离大于 50，利用三角函数 `Math.cos/sin` 限制摇杆帽在外圈边缘上（限制最大偏移距离为 50）。
   * **`pointerup`**：将 `joystickGraphics` 设置为不可见并清空重绘。

---

## 3. 战斗 HUD 属性面板已激活羁绊显示

### 3.1 DOM 结构修改
在 [index.html](file:///Users/pidan/Work/Learn/game/熊猫探险/index.html) 的属性抽屉 `#stats-drawer-card` 下方，新增一个容器节点 `#hud-synergy-section`：

```html
<div class="hud-synergy-section" id="hud-synergy-section">
  <h4 class="section-title">已激活羁绊</h4>
  <div class="synergy-list" id="hud-synergy-list">
    <!-- 动态渲染激活的羁绊卡片 -->
  </div>
</div>
```

### 3.2 样式表现 (src/ui/style.css)
定义羁绊标签的视觉效果：
* 未激活时不展示或半透明置灰。
* 激活后显示精美的玻璃拟物化小卡片，根据激活的件数（2/4/6）分别用 **绿色、蓝色、紫色** 框线高亮展示，突出档位升级感。

---

## 4. 交付与测试指标
1. **测试用例 1（武器装备与羁绊计算）**：在商店买下一根新手竹棍（近战、自然）和一把青竹弓（远程、自然），此时“自然”标签计数为 2。打开属性面板，应能看到“万物苏生”羁绊被激活（绿框），且熊猫的最大生命值提升 10。
2. **测试用例 2（武器合成与羁绊更新）**：将两把白色竹棍合成一把绿色竹棍。此时武器总数变少，但由于都是同名合并，自然标签计数仍能保持正确的最新状态。
3. **测试用例 3（虚拟摇杆移动）**：在移动端/触屏模式下拖拽屏幕，手指按下处应立刻显现圆形的双环摇杆，且摇杆帽跟随手指并在边缘受阻。手指松开时摇杆完美消失。
