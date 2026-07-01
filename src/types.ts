/**
 * 《熊猫探险》数据模型类型定义
 */

// 16 维核心战斗与成长属性
export interface PlayerAttributes {
  hpMax: number;          // 最大生命值 (HP)
  hpRegen: number;        // 生命再生 (HP Regen) - 每5秒恢复量
  lifeSteal: number;      // 生命偷取 (%) (Life Steal)
  damageModifier: number; // 伤害加成 (%) (Damage)
  meleeDmg: number;       // 近战伤害 (Melee DMG)
  rangedDmg: number;      // 远程伤害 (Ranged DMG)
  engineering: number;    // 工程学 (Engineering)
  attackSpeed: number;    // 攻击速度 (%) (Attack Speed)
  critChance: number;     // 暴击率 (%) (Critical Chance)
  speed: number;          // 移动速度 (%) (Speed)
  range: number;          // 攻击范围 (Range)
  armor: number;          // 护甲值 (Armor)
  dodge: number;          // 闪避率 (%) (Dodge)
  luck: number;           // 幸运值 (Luck)
  harvest: number;        // 收获值 (Harvest)
  xpGainModifier: number; // 经验修正 (%) (XP Gain)
}

// 属性修饰器结构 (用于道具、被动、局内升级)
export interface AttributeModifier {
  id: string;             // 来源ID (如 "item_1", "levelup_hp")
  attribute: keyof PlayerAttributes;
  addVal: number;         // 加法值
  mulVal: number;         // 乘法值 (例如 0.1 表示增加 10%)
}

// 6 种初始熊猫角色ID
export type CharacterId = 
  | 'kungfu_panda'   // 功夫熊猫
  | 'bamboo_archer'  // 翠竹射手
  | 'wealth_panda'   // 财迷熊猫
  | 'iron_shield'    // 铁甲霸王
  | 'drunk_master'   // 醉拳大师
  | 'gear_mechanic'; // 机械学者

// 熊猫角色配置
export interface CharacterConfig {
  id: CharacterId;
  name: string;
  description: string;
  baseAdjustments: Partial<PlayerAttributes>; // 相比标准值(100hp, 0其它)的初始调整
  passiveName: string;
  passiveDesc: string;
  initialWeaponId: string;
}

// 武器品质
export enum WeaponQuality {
  WHITE = 1,
  GREEN = 2,
  BLUE = 3,
  PURPLE = 4,
  RED = 5 // 神话品质
}

// 武器ID类型
export type WeaponId =
  | 'bamboo_stick' // 新手竹棍
  | 'bamboo_bow'   // 青竹弓
  | 'gold_abacus'  // 金算盘
  | 'stone_shield' // 石制大盾
  | 'wine_pot'     // 醉拳酒壶
  | 'wrench'       // 扳手
  | 'spear'        // 烈焰红枪
  | 'fan';         // 五雷神扇

// 武器品质具体数值配置
export interface WeaponStats {
  damage: number;          // 基础伤害
  attackInterval: number;  // 攻击间隔 (秒)
  range: number;           // 攻击范围
  knockback: number;       // 击退值
  pierce?: number;         // 穿透数 (仅限远程)
}

// 武器基类配置
export interface WeaponConfig {
  id: WeaponId;
  name: string;
  isMelee: boolean;        // 是否近战
  tags?: string[];         // 武器标签
  statsByQuality: Record<WeaponQuality, WeaponStats>;
  mythicDesc?: string;     // 红色神话的特效描述
}

// 玩家装备中的武器槽
export interface EquippedWeapon {
  slotIndex: number;       // 0 - 5
  weaponId: WeaponId;
  quality: WeaponQuality;
}

// 道具品质
export type ItemQuality = 'white' | 'green' | 'blue' | 'purple';

// 道具接口
export interface ItemConfig {
  id: number;              // 1 - 40
  name: string;
  quality: ItemQuality;
  modifiers: Partial<Record<keyof PlayerAttributes, { add?: number; mul?: number }>>;
  desc: string;
  price: number;
}

// 怪物ID
export type EnemyId =
  | 'caterpillar'  // 变异毛毛虫
  | 'rabbit'       // 疯狂红眼兔
  | 'flower'       // 毒藤食人花
  | 'boar'         // 黑风寨山猪
  | 'ape'          // 竹林刺客猿
  | 'gorilla'      // 精英A：巨力狂猩
  | 'centipede'    // 精英B：百足蜈蚣
  | 'taotie'       // BOSS 1：邪化暴君
  | 'dragon'       // BOSS 2：九天青龙
  | 'chest';       // 宝箱可破坏物

// 刷怪规则接口
export interface SpawnRule {
  enemyId: EnemyId;
  interval: number;        // 生成间隔(秒)
  countPerSpawn: number;   // 每次生成数量
  startTime: number;       // 从波次的第几秒开始生成
}

// 波次配置
export interface WaveConfig {
  wave: number;
  duration: number;        // 波次时间(秒)，W20为-1表示无限
  spawnRules: SpawnRule[];
}

// 游戏状态枚举
export enum GameState {
  MENU = 'MENU',
  HUD = 'HUD',
  LEVELUP = 'LEVELUP',
  SHOP = 'SHOP',
  GAMEOVER = 'GAMEOVER'
}

// 单局结算数据记录
export interface GameStatsRecord {
  waveReached: number;
  timeSurvived: number;    // 秒
  kills: number;
  goldEarned: number;
}

// 武器羁绊系统相关类型
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

