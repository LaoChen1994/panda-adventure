import { WeaponId, WeaponConfig, WeaponQuality, EquippedWeapon, WeaponStats } from '../types';

/**
 * 武器基础配置字典
 */
export const WEAPON_DATABASE: Record<WeaponId, WeaponConfig> = {
  bamboo_stick: {
    id: 'bamboo_stick',
    name: '新手竹棍',
    isMelee: true,
    tags: ['近战', '自然'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 10, attackInterval: 0.8, range: 150, knockback: 80 },
      [WeaponQuality.GREEN]:  { damage: 18, attackInterval: 0.75, range: 160, knockback: 90 },
      [WeaponQuality.BLUE]:   { damage: 32, attackInterval: 0.7, range: 180, knockback: 100 },
      [WeaponQuality.PURPLE]: { damage: 60, attackInterval: 0.6, range: 200, knockback: 120 },
      [WeaponQuality.RED]:    { damage: 120, attackInterval: 0.5, range: 250, knockback: 150 }
    },
    mythicDesc: '红色神话：30% 概率挥出半月形竹气波，造成等量伤害并穿透5个敌人。'
  },
  bamboo_bow: {
    id: 'bamboo_bow',
    name: '青竹弓',
    isMelee: false,
    tags: ['远程', '穿透', '自然'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 8, attackInterval: 0.6, range: 400, knockback: 20, pierce: 1 },
      [WeaponQuality.GREEN]:  { damage: 14, attackInterval: 0.55, range: 430, knockback: 22, pierce: 1 },
      [WeaponQuality.BLUE]:   { damage: 24, attackInterval: 0.5, range: 460, knockback: 25, pierce: 2 },
      [WeaponQuality.PURPLE]: { damage: 45, attackInterval: 0.45, range: 500, knockback: 30, pierce: 3 },
      [WeaponQuality.RED]:    { damage: 90, attackInterval: 0.35, range: 600, knockback: 40, pierce: 4 }
    },
    mythicDesc: '红色神话：每次射击变更为“三连发”扇形箭矢，且暴击时箭矢向左右分裂。'
  },
  gold_abacus: {
    id: 'gold_abacus',
    name: '金算盘',
    isMelee: false,
    tags: ['远程', '财富', '投掷'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 6, attackInterval: 0.7, range: 300, knockback: 15, pierce: 1 },
      [WeaponQuality.GREEN]:  { damage: 11, attackInterval: 0.65, range: 320, knockback: 18, pierce: 1 },
      [WeaponQuality.BLUE]:   { damage: 20, attackInterval: 0.6, range: 340, knockback: 20, pierce: 1 },
      [WeaponQuality.PURPLE]: { damage: 38, attackInterval: 0.55, range: 360, knockback: 25, pierce: 2 },
      [WeaponQuality.RED]:    { damage: 75, attackInterval: 0.45, range: 400, knockback: 30, pierce: 3 }
    },
    mythicDesc: '红色神话：金币子弹击中怪物时有 20% 概率使其掉落 1 枚竹子金币。'
  },
  stone_shield: {
    id: 'stone_shield',
    name: '石制大盾',
    isMelee: true,
    tags: ['近战', '重型', '防御'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 5, attackInterval: 1.2, range: 100, knockback: 200 },
      [WeaponQuality.GREEN]:  { damage: 10, attackInterval: 1.1, range: 110, knockback: 230 },
      [WeaponQuality.BLUE]:   { damage: 18, attackInterval: 1.0, range: 120, knockback: 260 },
      [WeaponQuality.PURPLE]: { damage: 35, attackInterval: 0.9, range: 130, knockback: 300 },
      [WeaponQuality.RED]:    { damage: 80, attackInterval: 0.7, range: 150, knockback: 400 }
    },
    mythicDesc: '红色神话：360度盾击，击退所有贴身敌人，并使其眩晕 1.5 秒。额外增加永久护甲。'
  },
  wine_pot: {
    id: 'wine_pot',
    name: '醉拳酒壶',
    isMelee: true,
    tags: ['近战', '范围', '魔法'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 12, attackInterval: 1.0, range: 180, knockback: 30 },
      [WeaponQuality.GREEN]:  { damage: 20, attackInterval: 0.95, range: 190, knockback: 35 },
      [WeaponQuality.BLUE]:   { damage: 35, attackInterval: 0.9, range: 200, knockback: 40 },
      [WeaponQuality.PURPLE]: { damage: 65, attackInterval: 0.8, range: 220, knockback: 50 },
      [WeaponQuality.RED]:    { damage: 130, attackInterval: 0.6, range: 250, knockback: 70 }
    },
    mythicDesc: '红色神话：近战攻击附带 15% 物理吸血，且烈酒喷洒的范围大幅增加。'
  },
  wrench: {
    id: 'wrench',
    name: '扳手',
    isMelee: false,
    tags: ['远程', '工程', '召唤'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 4, attackInterval: 1.2, range: 250, knockback: 10 },
      [WeaponQuality.GREEN]:  { damage: 8, attackInterval: 1.1, range: 270, knockback: 12 },
      [WeaponQuality.BLUE]:   { damage: 15, attackInterval: 1.0, range: 290, knockback: 15 },
      [WeaponQuality.PURPLE]: { damage: 28, attackInterval: 0.9, range: 310, knockback: 18 },
      [WeaponQuality.RED]:    { damage: 60, attackInterval: 0.7, range: 350, knockback: 20 }
    },
    mythicDesc: '红色神话：召唤工程炮台的数量上限提升。炮台继承工程学伤害且子弹具备穿透性。'
  },
  spear: {
    id: 'spear',
    name: '烈焰红枪',
    isMelee: true,
    tags: ['近战', '穿透', '火焰'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 15, attackInterval: 1.0, range: 190, knockback: 60 },
      [WeaponQuality.GREEN]:  { damage: 26, attackInterval: 0.95, range: 200, knockback: 70 },
      [WeaponQuality.BLUE]:   { damage: 45, attackInterval: 0.9, range: 220, knockback: 80 },
      [WeaponQuality.PURPLE]: { damage: 80, attackInterval: 0.8, range: 245, knockback: 95 },
      [WeaponQuality.RED]:    { damage: 160, attackInterval: 0.6, range: 280, knockback: 120 }
    },
    mythicDesc: '红色神话：突刺时在地面留下一条烈焰路径，对经过的怪物造成每秒 20 点的持续灼烧伤害。'
  },
  fan: {
    id: 'fan',
    name: '五雷神扇',
    isMelee: false,
    tags: ['远程', '魔法', '雷电'],
    statsByQuality: {
      [WeaponQuality.WHITE]:  { damage: 12, attackInterval: 0.9, range: 350, knockback: 30, pierce: 1 },
      [WeaponQuality.GREEN]:  { damage: 20, attackInterval: 0.85, range: 370, knockback: 32, pierce: 1 },
      [WeaponQuality.BLUE]:   { damage: 35, attackInterval: 0.8, range: 390, knockback: 35, pierce: 2 },
      [WeaponQuality.PURPLE]: { damage: 60, attackInterval: 0.75, range: 420, knockback: 40, pierce: 2 },
      [WeaponQuality.RED]:    { damage: 110, attackInterval: 0.6, range: 480, knockback: 50, pierce: 3 }
    },
    mythicDesc: '红色神话：扇子挥出 3 道雷电符，击中敌人时 100% 触发连锁闪电弹跳 5 个目标。'
  }
};

/**
 * 武器系统管理器
 */
export class WeaponSystem {
  // 6个装备槽位
  private equippedSlots: (EquippedWeapon | null)[] = new Array(6).fill(null);
  
  // 每个槽位的开火冷却计时器 (秒)
  private cooldowns: number[] = new Array(6).fill(0);

  constructor() {}

  /**
   * 获取所有装备的武器
   */
  public getEquippedWeapons(): (EquippedWeapon | null)[] {
    return this.equippedSlots;
  }

  /**
   * 在指定槽位装备武器
   */
  public equipWeapon(weaponId: WeaponId, quality: WeaponQuality, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 6) return false;
    
    this.equippedSlots[slotIndex] = {
      slotIndex,
      weaponId,
      quality
    };
    
    // 初始化冷却
    const stats = this.getWeaponStats(weaponId, quality);
    this.cooldowns[slotIndex] = stats.attackInterval;
    
    return true;
  }

  /**
   * 自动寻找空槽位装备武器
   */
  public addWeaponAuto(weaponId: WeaponId, quality: WeaponQuality): boolean {
    const emptyIndex = this.equippedSlots.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      return this.equipWeapon(weaponId, quality, emptyIndex);
    }
    return false; // 槽位已满
  }

  /**
   * 卸载武器
   */
  public unequipWeapon(slotIndex: number): EquippedWeapon | null {
    if (slotIndex < 0 || slotIndex >= 6) return null;
    const item = this.equippedSlots[slotIndex];
    this.equippedSlots[slotIndex] = null;
    this.cooldowns[slotIndex] = 0;
    return item;
  }

  /**
   * 尝试合并武器：两件同名同级武器二合一升阶
   */
  public tryMerge(fromSlot: number, toSlot: number): boolean {
    if (fromSlot === toSlot) return false;
    if (fromSlot < 0 || fromSlot >= 6 || toSlot < 0 || toSlot >= 6) return false;

    const fromItem = this.equippedSlots[fromSlot];
    const toItem = this.equippedSlots[toSlot];

    if (!fromItem || !toItem) return false;

    // 判定同名同品质且未满级 (最高红色 Quality 5)
    if (fromItem.weaponId === toItem.weaponId && fromItem.quality === toItem.quality && toItem.quality < WeaponQuality.RED) {
      // 升阶目标槽位
      toItem.quality += 1;
      
      // 清空来源槽位
      this.equippedSlots[fromSlot] = null;
      this.cooldowns[fromSlot] = 0;

      // 重置目标槽位的冷却
      const stats = this.getWeaponStats(toItem.weaponId, toItem.quality);
      this.cooldowns[toSlot] = stats.attackInterval;

      return true; // 合并成功
    }

    // 不满足合并条件，仅进行位置交换
    this.equippedSlots[fromSlot] = toItem;
    this.equippedSlots[toSlot] = fromItem;
    
    // 重新排序 slotIndex
    this.equippedSlots[fromSlot]!.slotIndex = fromSlot;
    this.equippedSlots[toSlot]!.slotIndex = toSlot;

    // 交换冷却计时
    const tempCooldown = this.cooldowns[fromSlot];
    this.cooldowns[fromSlot] = this.cooldowns[toSlot];
    this.cooldowns[toSlot] = tempCooldown;

    return false;
  }

  /**
   * 获取武器的当前品质数值属性
   */
  public getWeaponStats(weaponId: WeaponId, quality: WeaponQuality): WeaponStats {
    const config = WEAPON_DATABASE[weaponId];
    return config.statsByQuality[quality];
  }

  /**
   * 获取当前装备武器对玩家基础属性的被动影响
   * （例如：石制大盾会额外为玩家提供 +1/2/3/5/10 护甲）
   */
  public getPassiveAttributeModifiers(): { armor: number } {
    let extraArmor = 0;
    this.equippedSlots.forEach(weapon => {
      if (weapon && weapon.weaponId === 'stone_shield') {
        const qualityArmorMap: Record<WeaponQuality, number> = {
          [WeaponQuality.WHITE]: 1,
          [WeaponQuality.GREEN]: 2,
          [WeaponQuality.BLUE]: 3,
          [WeaponQuality.PURPLE]: 5,
          [WeaponQuality.RED]: 10
        };
        extraArmor += qualityArmorMap[weapon.quality] || 0;
      }
    });
    return { armor: extraArmor };
  }

  /**
   * 每帧更新冷却，并回调满足开火条件的武器
   */
  public updateCooldowns(dt: number, attackSpeedPercent: number, onFireCallback: (slotIndex: number, weapon: EquippedWeapon) => void) {
    // 攻击速度缩短百分比公式： 实际间隔 = 基础间隔 / (1 + 攻速百分比/100)
    const attackSpeedFactor = 1 + (attackSpeedPercent / 100);

    for (let i = 0; i < 6; i++) {
      const weapon = this.equippedSlots[i];
      if (!weapon) continue;

      if (this.cooldowns[i] > 0) {
        this.cooldowns[i] -= dt;
      }

      if (this.cooldowns[i] <= 0) {
        // 触发开火
        onFireCallback(i, weapon);
        
        // 重置冷却
        const stats = this.getWeaponStats(weapon.weaponId, weapon.quality);
        this.cooldowns[i] = stats.attackInterval / attackSpeedFactor;
      }
    }
  }

  /**
   * 清空全部武器槽 (重置)
   */
  public clear() {
    this.equippedSlots.fill(null);
    this.cooldowns.fill(0);
  }
}
