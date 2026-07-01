# 武器羁绊与虚拟摇杆视觉层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在游戏中实现完整的武器羁绊属性加成系统与虚拟摇杆的半透明圆形手势绘图反馈。

**Architecture:** 
1. 在 `WeaponSystem.ts` 中配置羁绊字典 `SYNERGY_DATABASE`，编写标签统计与等级匹配逻辑。
2. 在 `Player.ts` 中重算装备时，动态给 `AttributeSystem` 添加以 `synergy_` 开头的属性修饰符，驱动生命上限与攻速变化。
3. 在 `OverlayManager.ts` 中解析激活的羁绊并将其渲染为绿/蓝/紫三色高亮卡片放入属性面板。
4. 在 `GameScene.ts` 触屏手势回调中引入 `Phaser.GameObjects.Graphics` 绘制动态交互的虚拟摇杆。

**Tech Stack:** TypeScript, Phaser 3, HTML5, Vanilla CSS

---

### Task 1: 羁绊配置定义与统计方法实现

**Files:**
- Modify: `src/types.ts`
- Modify: `src/systems/WeaponSystem.ts`
- Create: `tests/test-synergy-data.ts`

- [ ] **Step 1: 创建测试脚本以验证羁绊加载和统计功能**

```typescript
// tests/test-synergy-data.ts
import { WeaponSystem, SYNERGY_DATABASE } from '../src/systems/WeaponSystem';
import { WeaponQuality } from '../src/types';

function runTest() {
  console.log("Running Task 1 Tests...");
  const system = new WeaponSystem();
  
  // 1. 验证数据库加载
  if (!SYNERGY_DATABASE.melee) {
    throw new Error("SYNERGY_DATABASE is missing melee config");
  }
  
  // 2. 模拟装备武器
  system.equipWeapon('bamboo_stick', WeaponQuality.WHITE, 0); // 近战, 自然
  system.equipWeapon('bamboo_bow', WeaponQuality.WHITE, 1);   // 远程, 穿透, 自然
  
  // 3. 统计标签
  const counts = (system as any).countActiveTags();
  console.log("Active tag counts:", counts);
  
  if (counts['自然'] !== 2) {
    throw new Error(`Expected '自然' count to be 2, but got ${counts['自然']}`);
  }
  if (counts['近战'] !== 1) {
    throw new Error(`Expected '近战' count to be 1, but got ${counts['近战']}`);
  }
  
  // 4. 计算激活的羁绊
  const synergies = system.getActiveSynergies();
  console.log("Active synergies:", synergies);
  const naturalSyn = synergies.find(s => s.tagKey === 'natural');
  if (!naturalSyn || naturalSyn.level !== 1) {
    throw new Error("Expected natural synergy to be active at level 1");
  }
  
  console.log("Task 1 Tests Passed!");
}

runTest();
```

- [ ] **Step 2: 运行测试确保报错（编译失败）**

运行：`npx tsc --target es2020 --module commonjs src/systems/WeaponSystem.ts tests/test-synergy-data.ts && node tests/test-synergy-data.js`
预期：编译报错，因为 `countActiveTags` 和 `getActiveSynergies` 未定义，或者 `SYNERGY_DATABASE` 不存在。

- [ ] **Step 3: 完善 `types.ts` 和 `WeaponSystem.ts` 定义与实现**

在 `src/types.ts` 中追加羁绊结构接口：
```typescript
export interface SynergyLevelConfig {
  count: number;
  modifiers: Record<string, number>;
}

export interface SynergyConfig {
  tag: string;
  name: string;
  levels: SynergyLevelConfig[];
}

export interface ActiveSynergyInfo {
  tagKey: string;
  name: string;
  tag: string;
  currentCount: number;
  level: number; // 0, 1, 2, 3 等档位，0 表示未激活
  activeModifiers: Record<string, number>;
}
```

在 `src/systems/WeaponSystem.ts` 头部追加 `SYNERGY_DATABASE`：
```typescript
import { WeaponId, WeaponConfig, WeaponQuality, EquippedWeapon, WeaponStats, SynergyConfig, ActiveSynergyInfo } from '../types';

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

在 `WeaponSystem` 类中实现核心统计方法：
```typescript
  /**
   * 统计所有已装备武器的标签数量
   */
  private countActiveTags(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.equippedSlots.forEach(eq => {
      if (!eq) return;
      const dbEntry = WEAPON_DATABASE[eq.weaponId];
      if (!dbEntry || !dbEntry.tags) return;
      
      dbEntry.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }

  /**
   * 获取当前全部激活的羁绊和属性修饰器
   */
  public getActiveSynergies(): ActiveSynergyInfo[] {
    const counts = this.countActiveTags();
    const result: ActiveSynergyInfo[] = [];

    for (const [key, config] of Object.entries(SYNERGY_DATABASE)) {
      const tagCount = counts[config.tag] || 0;
      
      // 找出符合当前计数的最大激活等级
      let activeLevel = 0;
      let activeModifiers: Record<string, number> = {};

      for (let i = 0; i < config.levels.length; i++) {
        if (tagCount >= config.levels[i].count) {
          activeLevel = i + 1;
          activeModifiers = config.levels[i].modifiers;
        }
      }

      if (tagCount > 0) {
        result.push({
          tagKey: key,
          name: config.name,
          tag: config.tag,
          currentCount: tagCount,
          level: activeLevel,
          activeModifiers
        });
      }
    }

    return result;
  }
```

- [ ] **Step 4: 重新编译运行测试脚本确保测试通过**

运行：`npx tsc --target es2020 --module commonjs src/systems/WeaponSystem.ts tests/test-synergy-data.ts && node tests/test-synergy-data.js`
预期：输出 "Task 1 Tests Passed!"

- [ ] **Step 5: 提交更改**

```bash
git add src/types.ts src/systems/WeaponSystem.ts
git commit -m "feat: add SYNERGY_DATABASE and synergy counting to WeaponSystem"
```

---

### Task 2: 羁绊修饰符与 Player 属性系统动态绑定

**Files:**
- Modify: `src/entities/Player.ts`
- Create: `tests/test-player-synergy.ts`

- [ ] **Step 1: 编写测试用例验证属性重算与羁绊挂载**

```typescript
// tests/test-player-synergy.ts
import { Player } from '../src/entities/Player';
import { WeaponSystem } from '../src/systems/WeaponSystem';
import { WeaponQuality } from '../src/types';

// Mock scene
const mockScene = {
  add: { existing: () => {} },
  physics: { add: { existing: () => {} } },
  anims: { exists: () => true }
} as any;

function runTest() {
  console.log("Running Task 2 Tests...");
  const player = new Player(mockScene, 0, 0, 'kungfu_panda');
  const weaponSystem = new WeaponSystem();
  
  // 给玩家穿两把新手竹棍 (近战, 自然)
  weaponSystem.equipWeapon('bamboo_stick', WeaponQuality.WHITE, 0);
  weaponSystem.equipWeapon('bamboo_stick', WeaponQuality.WHITE, 1);
  
  // 获取激活的羁绊列表并应用于玩家
  const synergies = weaponSystem.getActiveSynergies();
  (player as any).applySynergyModifiers(synergies);
  
  // 验证最大生命值是否正确增加了 10 点 (自然羁绊 2件效果)
  const maxHp = player.getMaxHp();
  console.log("Max HP after natural synergy:", maxHp);
  if (maxHp !== 130) { // 100 基础 + 20 功夫熊猫加成 + 10 自然羁绊
    throw new Error(`Expected Max HP to be 130, but got ${maxHp}`);
  }
  
  console.log("Task 2 Tests Passed!");
}

runTest();
```

- [ ] **Step 2: 运行测试确保失败（编译错误）**

运行：`npx tsc --target es2020 --module commonjs src/entities/Player.ts tests/test-player-synergy.ts && node tests/test-player-synergy.js`
预期：编译报错，因为 `applySynergyModifiers` 在 `Player` 中不存在。

- [ ] **Step 3: 实现 `Player.ts` 中的羁绊增益挂载方法**

在 `src/entities/Player.ts` 中实现 `applySynergyModifiers` 方法：
```typescript
  import { ActiveSynergyInfo } from '../types';

  /**
   * 应用武器羁绊属性增益
   */
  public applySynergyModifiers(activeSynergies: ActiveSynergyInfo[]) {
    // 1. 清除原有的全部以 synergy_ 开头的羁绊属性修饰符
    const allAttributes = this.attributeSystem.getAttributes();
    Object.keys(allAttributes).forEach(attrName => {
      // 遍历所有可能的羁绊前缀并清除
      const synergyPrefixes = ['melee', 'ranged', 'natural', 'engineering', 'wealth', 'magic'];
      synergyPrefixes.forEach(prefix => {
        this.attributeSystem.removeAttributeModifier(attrName, `synergy_${prefix}`);
      });
    });

    // 2. 挂载当前生效的羁绊增益
    activeSynergies.forEach(syn => {
      if (syn.level <= 0) return; // 未满足最低件数不生效
      
      Object.entries(syn.activeModifiers).forEach(([attrKey, value]) => {
        // 百分比改变量加到 mulVal，固定数值加到 addVal
        const isPercent = attrKey === 'damageModifier' || attrKey === 'attackSpeed' || attrKey === 'dodge' || attrKey === 'xpGainModifier';
        
        this.attributeSystem.addAttributeModifier(attrKey, {
          id: `synergy_${syn.tagKey}`,
          addVal: isPercent ? 0 : value,
          mulVal: isPercent ? (value / 100) : 0
        });
      });
    });

    // 3. 校验并约束当前血量不超过最大生命上限
    const maxHp = this.getMaxHp();
    if (this.hp > maxHp) {
      this.hp = maxHp;
    }
    
    // 触发 HUD UI 数据重绘
    this.onStatsChanged();
  }
```
*注：确保在 `src/systems/AttributeSystem.ts` 里有对应的 `removeAttributeModifier` 或类似的移除接口。让我们先看一下 `AttributeSystem.ts` 以确认。*

- [ ] **Step 4: 运行测试脚本确保属性更新完全正确**

运行：`npx tsc --target es2020 --module commonjs src/entities/Player.ts tests/test-player-synergy.ts && node tests/test-player-synergy.js`
预期：输出 "Task 2 Tests Passed!"

- [ ] **Step 5: 提交更改**

```bash
git add src/entities/Player.ts
git commit -m "feat: implement applySynergyModifiers in Player entity"
```

---

### Task 3: 触发属性重算逻辑联动

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: 在武器库变动时主动计算与应用羁绊属性**

在 `src/scenes/GameScene.ts` 中搜索并定位所有武器变动的方法：
* `buyWeaponFromShop` 
* `mergeShopWeapons`
* `startGame` (初始装备)

在这些方法的末尾（在更新仓库后），调用属性同步方法：
```typescript
  private updatePlayerSynergyStats() {
    if (!this.player || !this.weaponSystem) return;
    const activeSynergies = this.weaponSystem.getActiveSynergies();
    this.player.applySynergyModifiers(activeSynergies);
    this.syncHUD();
  }
```

具体修改在 [GameScene.ts](file:///Users/pidan/Work/Learn/game/熊猫探险/src/scenes/GameScene.ts)：
1. 在 `startGame` 函数的 `this.player.registerCallbacks(...)` 之后添加：
   ```typescript
   this.updatePlayerSynergyStats();
   ```
2. 在 `buyWeaponFromShop` 成功装备武器之后添加：
   ```typescript
   this.updatePlayerSynergyStats();
   ```
3. 在 `mergeShopWeapons` 成功合并或交换之后添加：
   ```typescript
   this.updatePlayerSynergyStats();
   ```

- [ ] **Step 2: 编译测试项目**

运行：`npm run build`
预期：Vite 编译及 TS 类型检查通过，无任何语法错误。

- [ ] **Step 3: 提交更改**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: link weapon changes in GameScene to player synergy recalculations"
```

---

### Task 4: HTML DOM 结构与 CSS 样式调整

**Files:**
- Modify: `index.html`
- Modify: `src/ui/style.css`

- [ ] **Step 1: 在 index.html 中追加羁绊面板节点**

打开 [index.html](file:///Users/pidan/Work/Learn/game/熊猫探险/index.html)，定位到 `#stats-drawer` 中的 `#hud-stats-list` 的同级下方，增加专属列表节点：
```html
          <!-- index.html -->
          <div class="stats-list" id="hud-stats-list"></div>
          
          <!-- 新增：已激活羁绊展示区 -->
          <div class="hud-synergy-section" id="hud-synergy-section" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #ffd700; font-size: 1rem;">已激活武器羁绊</h4>
            <div class="synergy-list" id="hud-synergy-list" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- 动态装填 -->
            </div>
          </div>
```

- [ ] **Step 2: 在 `src/ui/style.css` 中添加羁绊徽章及边框视觉样式**

打开 [src/ui/style.css](file:///Users/pidan/Work/Learn/game/熊猫探险/src/ui/style.css) 尾部，追加羁绊卡片样式，按照品级显示边框（2件绿、4件蓝、6件紫）：
```css
/* 武器羁绊卡片样式 */
.synergy-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-left: 4px solid #666;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.synergy-card.lvl-1 {
  border-left-color: #22c55e; /* 绿色 */
  background: rgba(34, 197, 94, 0.06);
}

.synergy-card.lvl-2 {
  border-left-color: #3b82f6; /* 蓝色 */
  background: rgba(59, 130, 246, 0.08);
}

.synergy-card.lvl-3 {
  border-left-color: #a855f7; /* 紫色/金色 */
  background: rgba(168, 85, 247, 0.1);
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.2);
}

.synergy-name {
  font-weight: bold;
  color: #fff;
}

.synergy-count-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #eee;
  margin-left: 6px;
}

.synergy-effects {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
}
```

- [ ] **Step 3: 提交更改**

```bash
git add index.html src/ui/style.css
git commit -m "style: add HTML structure and CSS styles for weapon synergies"
```

---

### Task 5: 属性抽屉面板渲染羁绊数据

**Files:**
- Modify: `src/ui/OverlayManager.ts`

- [ ] **Step 1: 在面板刷新时动态装载激活的羁绊卡片**

在 `src/ui/OverlayManager.ts` 中找到渲染 Stats Drawer 的入口方法，通常是 `toggleStatsDrawer` 或 `updateStats`，在渲染基础 16 维属性后，渲染羁绊列表。

具体实现代码：
```typescript
  // 在 OverlayManager.ts 合适的方法里添加渲染羁绊的逻辑
  public updateSynergyList(synergies: any[]) {
    const listNode = document.getElementById('hud-synergy-list');
    if (!listNode) return;
    
    listNode.innerHTML = '';
    
    // 只过滤并展示件数大于 0 的标签
    const activeSyns = synergies.filter(s => s.currentCount > 0);
    
    if (activeSyns.length === 0) {
      listNode.innerHTML = `<div style="color: #666; font-size: 0.8rem; text-align: center; padding: 10px;">暂无武器羁绊激活</div>`;
      return;
    }
    
    activeSyns.forEach(syn => {
      const card = document.createElement('div');
      card.className = `synergy-card lvl-${syn.level}`;
      
      // 解析属性加成文案
      let effectsText = '未激活加成';
      if (syn.level > 0) {
        effectsText = Object.entries(syn.activeModifiers)
          .map(([key, val]) => {
            const nameMap: Record<string, string> = {
              hpMax: '最大生命', hpRegen: '生命再生', lifeSteal: '吸血率',
              damageModifier: '伤害', meleeDmg: '近战伤害', rangedDmg: '远程伤害',
              engineering: '工程学', attackSpeed: '攻速', critChance: '暴击率',
              speed: '移速', range: '范围', armor: '护甲', dodge: '闪避率',
              luck: '幸运', harvest: '收获', xpGainModifier: '经验修正'
            };
            const name = nameMap[key] || key;
            const isPercent = key === 'damageModifier' || key === 'attackSpeed' || key === 'dodge' || key === 'xpGainModifier';
            return `+${val}${isPercent ? '%' : ''}${name}`;
          })
          .join(', ');
      }
      
      card.innerHTML = `
        <div>
          <span class="synergy-name">${syn.name}</span>
          <span class="synergy-count-badge">${syn.currentCount}件</span>
        </div>
        <div class="synergy-effects">${effectsText}</div>
      `;
      listNode.appendChild(card);
    });
  }
```

在 `OverlayManager.ts` 更新属性状态时调用这个方法：
```typescript
  // 在 updateStatsDrawer 等渲染方法中加入调用
  const synergies = this.gameScene.weaponSystem.getActiveSynergies();
  this.updateSynergyList(synergies);
```

- [ ] **Step 2: 编译测试**

运行：`npm run build`
预期：成功通过类型检查与打包编译。

- [ ] **Step 3: 提交更改**

```bash
git add src/ui/OverlayManager.ts
git commit -m "feat: render active weapon synergies in HUD stats panel"
```

---

### Task 6: 虚拟摇杆视觉绘制组件实现

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: 增加摇杆属性与手势响应绘图**

在 [GameScene.ts](file:///Users/pidan/Work/Learn/game/熊猫探险/src/scenes/GameScene.ts) 中新增摇杆视觉对象：
* 在类字段定义中追加：
  ```typescript
  private joystickGraphics!: Phaser.GameObjects.Graphics;
  private joystickBasePos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  ```

* 在 `create()` 中初始化 `joystickGraphics`：
  ```typescript
  this.joystickGraphics = this.add.graphics();
  this.joystickGraphics.setDepth(200); // 确保在最上层
  this.joystickGraphics.setScrollFactor(0); // 固定在镜头视图内
  ```

* 修改指针按下的逻辑 `pointerdown`：
  ```typescript
  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!this.isGameActive) return;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.isDragging = true;

    // 显示并重绘摇杆基底
    this.joystickBasePos.set(pointer.x, pointer.y);
    this.drawJoystick(pointer.x, pointer.y, pointer.x, pointer.y);
  });
  ```

* 修改指针拖拽的逻辑 `pointermove`：
  ```typescript
  this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (!this.isDragging) return;

    // 计算偏离距离与角度
    const distance = Phaser.Math.Distance.Between(this.joystickBasePos.x, this.joystickBasePos.y, pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.joystickBasePos.x, this.joystickBasePos.y, pointer.x, pointer.y);
    
    // 限制摇杆操纵帽偏离外圈最大半径 50
    let targetX = pointer.x;
    let targetY = pointer.y;
    if (distance > 50) {
      targetX = this.joystickBasePos.x + Math.cos(angle) * 50;
      targetY = this.joystickBasePos.y + Math.sin(angle) * 50;
    }

    // 重绘最新摇杆帽位置
    this.drawJoystick(this.joystickBasePos.x, this.joystickBasePos.y, targetX, targetY);
  });
  ```

* 修改指针松开的逻辑 `pointerup`：
  ```typescript
  this.input.on('pointerup', () => {
    this.isDragging = false;
    this.joystickGraphics.clear(); // 清除摇杆视觉
  });
  ```

* 实现 `drawJoystick` 绘图函数：
  ```typescript
  private drawJoystick(bx: number, by: number, kx: number, ky: number) {
    this.joystickGraphics.clear();

    // 1. 绘制摇杆外层圆形基底 (半透明灰色底座，白色线圈)
    this.joystickGraphics.fillStyle(0xffffff, 0.12);
    this.joystickGraphics.lineStyle(2, 0xffffff, 0.4);
    this.joystickGraphics.fillCircle(bx, by, 50);
    this.joystickGraphics.strokeCircle(bx, by, 50);

    // 2. 绘制内层操纵摇杆帽 (不透明度更高的白色摇杆)
    this.joystickGraphics.fillStyle(0xffffff, 0.45);
    this.joystickGraphics.fillCircle(kx, ky, 20);
  }
  ```

- [ ] **Step 2: 启动游戏进行本地运行验证**

运行：`npm run dev` 并打开本地服务器链接。
验证：用鼠标拖拽游戏屏幕，确认出现摇杆底座及操纵帽，并限制半径；手指松开时立刻淡出消失。

- [ ] **Step 3: 提交更改并推送**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement visual feedback for virtual joystick on drag gestures"
```
