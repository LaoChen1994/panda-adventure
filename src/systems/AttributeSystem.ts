import { PlayerAttributes, AttributeModifier } from '../types';

/**
 * 熊猫探险 16维属性系统管理器
 */
export class AttributeSystem {
  // 基础默认值
  private baseAttributes: PlayerAttributes = {
    hpMax: 100,
    hpRegen: 0,
    lifeSteal: 0,
    damageModifier: 0, // 0% 基础加成
    meleeDmg: 0,
    rangedDmg: 0,
    engineering: 0,
    attackSpeed: 0,   // 0% 基础加成
    critChance: 5,    // 5% 基础暴击
    speed: 100,       // 100% 基础速度
    range: 0,         // 0 基础额外范围
    armor: 0,
    dodge: 0,         // 0% 基础闪避
    luck: 0,
    harvest: 0,
    xpGainModifier: 0 // 0% 基础加成
  };

  // 当前角色的固有调整值
  private characterAdjustments: Partial<PlayerAttributes> = {};

  // 动态修饰器列表 (以修饰器 id 为 key)
  private modifiers: Map<string, AttributeModifier> = new Map();

  // 缓存最终计算结果
  private cachedAttributes: PlayerAttributes;
  private isDirty: boolean = true;

  constructor() {
    this.cachedAttributes = { ...this.baseAttributes };
  }

  /**
   * 初始化角色专属修正值
   */
  public initCharacterBase(adjustments: Partial<PlayerAttributes>) {
    this.characterAdjustments = { ...adjustments };
    this.isDirty = true;
  }

  /**
   * 添加修饰器
   */
  public addModifier(mod: AttributeModifier) {
    this.modifiers.set(mod.id, mod);
    this.isDirty = true;
  }

  /**
   * 移除修饰器 (如售出道具、临时效果失效)
   */
  public removeModifier(id: string) {
    if (this.modifiers.delete(id)) {
      this.isDirty = true;
    }
  }

  public hasModifier(id: string): boolean {
    return this.modifiers.has(id);
  }

  /**
   * 批量移除符合前缀的修饰器
   */
  public removeModifiersByPrefix(prefix: string) {
    for (const key of this.modifiers.keys()) {
      if (key.startsWith(prefix)) {
        this.modifiers.delete(key);
      }
    }
    this.isDirty = true;
  }

  /**
   * 获取所有修饰器
   */
  public getAllModifiers(): AttributeModifier[] {
    return Array.from(this.modifiers.values());
  }

  /**
   * 清除所有动态修饰器
   */
  public clearModifiers() {
    this.modifiers.clear();
    this.isDirty = true;
  }

  /**
   * 获取当前的 16 维最终计算值
   */
  public getAttributes(): PlayerAttributes {
    if (this.isDirty) {
      this.recalculate();
      this.isDirty = false;
    }
    return this.cachedAttributes;
  }

  /**
   * 获取单项属性的最终值
   */
  public get(attr: keyof PlayerAttributes): number {
    return this.getAttributes()[attr];
  }

  /**
   * 重新计算最终属性
   */
  private recalculate() {
    const nextAttrs = { ...this.baseAttributes };

    // 1. 叠加角色专属初始调整
    for (const key in this.characterAdjustments) {
      const attrKey = key as keyof PlayerAttributes;
      nextAttrs[attrKey] += (this.characterAdjustments[attrKey] || 0);
    }

    // 2. 收集修饰器，分类为加法和乘法
    const addValues: Record<keyof PlayerAttributes, number> = {} as any;
    const mulValues: Record<keyof PlayerAttributes, number> = {} as any;

    // 初始化累计结构
    for (const key in this.baseAttributes) {
      const attrKey = key as keyof PlayerAttributes;
      addValues[attrKey] = 0;
      mulValues[attrKey] = 0;
    }

    // 累加所有动态修饰
    this.modifiers.forEach(mod => {
      addValues[mod.attribute] += mod.addVal;
      mulValues[mod.attribute] += mod.mulVal;
    });

    // 3. 应用公式：最终值 = (基础/调整值 + 累计加法值) * (1 + 累计乘法值)
    for (const key in this.baseAttributes) {
      const attrKey = key as keyof PlayerAttributes;
      const basePlusAdd = nextAttrs[attrKey] + addValues[attrKey];
      nextAttrs[attrKey] = basePlusAdd * (1 + mulValues[attrKey]);
    }

    // 4. 边界约束限制
    // 闪避率常规最高上限 60%
    if (nextAttrs.dodge > 60) {
      // 醉拳大师上限在 Player 逻辑中单独判定提升至 75%
      nextAttrs.dodge = 60;
    }
    // 闪避率不能为负数
    if (nextAttrs.dodge < 0) nextAttrs.dodge = 0;

    // 暴击率限制在 0% - 100%
    if (nextAttrs.critChance < 0) nextAttrs.critChance = 0;
    if (nextAttrs.critChance > 100) nextAttrs.critChance = 100;

    // 移动速度最低限制在 20%
    if (nextAttrs.speed < 20) nextAttrs.speed = 20;

    this.cachedAttributes = nextAttrs;
  }
}
