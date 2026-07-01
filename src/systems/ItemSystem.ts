import { ItemConfig, ItemQuality } from '../types';

/**
 * 40 款道具数据库定义
 */
export const ITEM_DATABASE: ItemConfig[] = [
  // ==================== 白色道具 (1 - 15) ====================
  {
    id: 1,
    name: '老旧的沙袋',
    quality: 'white',
    modifiers: { hpMax: { add: 10 }, speed: { add: -2 } },
    desc: '最大生命值 +10，移动速度 -2%',
    price: 15
  },
  {
    id: 2,
    name: '磨刀石',
    quality: 'white',
    modifiers: { meleeDmg: { add: 3 }, rangedDmg: { add: -1 } },
    desc: '近战伤害 +3，远程伤害 -1',
    price: 15
  },
  {
    id: 3,
    name: '羽毛箭翎',
    quality: 'white',
    modifiers: { rangedDmg: { add: 3 }, range: { add: 20 } },
    desc: '远程伤害 +3，攻击范围 +20',
    price: 15
  },
  {
    id: 4,
    name: '防弹背心',
    quality: 'white',
    modifiers: { armor: { add: 2 }, critChance: { add: -1 } },
    desc: '护甲值 +2，暴击率 -1%',
    price: 15
  },
  {
    id: 5,
    name: '跑鞋',
    quality: 'white',
    modifiers: { speed: { add: 5 } },
    desc: '移动速度 +5%',
    price: 15
  },
  {
    id: 6,
    name: '幸运四叶草',
    quality: 'white',
    modifiers: { luck: { add: 8 } },
    desc: '幸运值 +8',
    price: 15
  },
  {
    id: 7,
    name: '存钱罐',
    quality: 'white',
    modifiers: { harvest: { add: 5 } },
    desc: '收获值 +5',
    price: 15
  },
  {
    id: 8,
    name: '劣质红药水',
    quality: 'white',
    modifiers: { hpRegen: { add: 2 }, damageModifier: { add: -2 } },
    desc: '生命再生 +2，伤害加成 -2%',
    price: 15
  },
  {
    id: 9,
    name: '吸血蝙蝠牙',
    quality: 'white',
    modifiers: { lifeSteal: { add: 2 } },
    desc: '生命偷取 +2%',
    price: 15
  },
  {
    id: 10,
    name: '放大镜',
    quality: 'white',
    modifiers: { critChance: { add: 4 } },
    desc: '暴击率 +4%',
    price: 15
  },
  {
    id: 11,
    name: '小齿轮',
    quality: 'white',
    modifiers: { engineering: { add: 4 } },
    desc: '工程学 +4',
    price: 15
  },
  {
    id: 12,
    name: '坏掉的怀表',
    quality: 'white',
    modifiers: { attackSpeed: { add: 5 } },
    desc: '攻击速度 +5%',
    price: 15
  },
  {
    id: 13,
    name: '智慧药水',
    quality: 'white',
    modifiers: { xpGainModifier: { add: 8 } },
    desc: '经验修正 +8%',
    price: 15
  },
  {
    id: 14,
    name: '增高鞋垫',
    quality: 'white',
    modifiers: { range: { add: 30 } },
    desc: '攻击范围 +30',
    price: 15
  },
  {
    id: 15,
    name: '铁钉皮带',
    quality: 'white',
    modifiers: { meleeDmg: { add: 2 }, lifeSteal: { add: 1 } },
    desc: '近战伤害 +2，生命偷取 +1%',
    price: 15
  },

  // ==================== 绿色道具 (16 - 27) ====================
  {
    id: 16,
    name: '巨大空心竹筒',
    quality: 'green',
    modifiers: { hpMax: { add: 25 }, hpRegen: { add: 4 }, speed: { add: -5 } },
    desc: '最大生命值 +25，生命再生 +4，移动速度 -5%',
    price: 30
  },
  {
    id: 17,
    name: '刺客面具',
    quality: 'green',
    modifiers: { critChance: { add: 8 }, dodge: { add: 5 }, hpMax: { add: -6 } },
    desc: '暴击率 +8%，闪避率 +5%，最大生命值 -6',
    price: 30
  },
  {
    id: 18,
    name: '重型火药',
    quality: 'green',
    modifiers: { rangedDmg: { add: 8 }, attackSpeed: { add: -6 }, range: { add: 40 } },
    desc: '远程伤害 +8，攻击速度 -6%，范围 +40',
    price: 30
  },
  {
    id: 19,
    name: '合金扳手',
    quality: 'green',
    modifiers: { engineering: { add: 10 }, hpMax: { add: 5 }, meleeDmg: { add: -3 } },
    desc: '工程学 +10，最大生命值 +5，近战伤害 -3',
    price: 30
  },
  {
    id: 20,
    name: '黄金算盘',
    quality: 'green',
    modifiers: { harvest: { add: 15 } },
    desc: '【被动】收获值 +15，每次刷新商店的费用减少 2 金币',
    price: 35
  },
  {
    id: 21,
    name: '备用电池',
    quality: 'green',
    modifiers: { damageModifier: { add: -5 } },
    desc: '【召唤】机枪塔攻击速度 +20%，玩家自身伤害 -5%',
    price: 30
  },
  {
    id: 22,
    name: '急救绷带',
    quality: 'green',
    modifiers: { hpRegen: { add: 6 } },
    desc: '【被动】生命再生 +6，当血量低于30%时，再生速度翻倍',
    price: 30
  },
  {
    id: 23,
    name: '神速马靴',
    quality: 'green',
    modifiers: { speed: { add: 12 }, armor: { add: -2 } },
    desc: '移动速度 +12%，护甲 -2',
    price: 30
  },
  {
    id: 24,
    name: '荆棘背心',
    quality: 'green',
    modifiers: { armor: { add: 4 } },
    desc: '【反伤】护甲值 +4，受到攻击时反弹 10 点伤害',
    price: 30
  },
  {
    id: 25,
    name: '强光手电',
    quality: 'green',
    modifiers: { range: { add: 80 } },
    desc: '【致盲】攻击范围 +80，敌人因致盲有 5% 概率攻击未命中',
    price: 30
  },
  {
    id: 26,
    name: '高蛋白竹笋',
    quality: 'green',
    modifiers: { hpMax: { add: 15 }, damageModifier: { add: 5 } },
    desc: '最大生命值 +15，伤害加成 +5%',
    price: 30
  },
  {
    id: 27,
    name: '幸运猫爪',
    quality: 'green',
    modifiers: { luck: { add: 20 } },
    desc: '【幸运】幸运值 +20，怪物掉落道具/药水率提升 10%',
    price: 30
  },

  // ==================== 蓝色道具 (28 - 35) ====================
  {
    id: 28,
    name: '狂战士药剂',
    quality: 'blue',
    modifiers: { damageModifier: { add: 20 }, lifeSteal: { add: 5 } },
    desc: '【重度】伤害加成 +20%，生命偷取 +5%。但每受一次伤害，该局后续所受伤害增加 1%',
    price: 60
  },
  {
    id: 29,
    name: '墨家机关核心',
    quality: 'blue',
    modifiers: { engineering: { add: 20 } },
    desc: '【召唤】工程学 +20。场上每多一台机枪塔，玩家自身护甲值 +1',
    price: 65
  },
  {
    id: 30,
    name: '巨浪护腕',
    quality: 'blue',
    modifiers: { range: { mul: 0.3 } }, // 攻击范围乘法 +30%
    desc: '【近战】近战范围 +30%。近战武器挥舞时产生击退波将敌人推开',
    price: 60
  },
  {
    id: 31,
    name: '幽灵披风',
    quality: 'blue',
    modifiers: { dodge: { add: 15 } },
    desc: '【闪避】闪避率 +15%。如果成功触发闪避，下一次攻击必定产生 300% 暴击',
    price: 60
  },
  {
    id: 32,
    name: '财富重担',
    quality: 'blue',
    modifiers: { speed: { add: -2 } },
    desc: '【金钱】身上每存有 100 金币，伤害加成 +3% (最高30%)，移动速度 -2%',
    price: 65
  },
  {
    id: 33,
    name: '量子加速器',
    quality: 'blue',
    modifiers: { attackSpeed: { add: 30 }, meleeDmg: { add: -5 }, rangedDmg: { add: -5 } },
    desc: '攻击速度 +30%，固定近战与远程伤害 -5',
    price: 60
  },
  {
    id: 34,
    name: '吸血鬼伯爵披风',
    quality: 'blue',
    modifiers: { lifeSteal: { add: 10 } },
    desc: '【吸血】生命偷取 +10%。满血时吸血溢出的生命值转化为临时护盾 (最高50点)',
    price: 65
  },
  {
    id: 35,
    name: '指南针',
    quality: 'blue',
    modifiers: {},
    desc: '【寻宝】每波开始时，在地图中央生成“黄金泉”，站在泉里 5 秒可获得 50 金币',
    price: 60
  },

  // ==================== 紫色传说级 (36 - 40) ====================
  {
    id: 36,
    name: '【传世武籍・易筋经】',
    quality: 'purple',
    modifiers: { hpMax: { add: 50 }, hpRegen: { add: 15 }, armor: { add: 10 } },
    desc: '【禁忌】最大生命值 +50，生命再生 +15，护甲值 +10。代价值：无法再使用任何远程武器！',
    price: 120
  },
  {
    id: 37,
    name: '【九转还魂丹】',
    quality: 'purple',
    modifiers: {},
    desc: '【复活】当生命值归零时，原地复活恢复 50% HP，并拥有 3 秒全屏无敌与击退震荡波 (每局限1次)',
    price: 130
  },
  {
    id: 38,
    name: '【核能竹子反应堆】',
    quality: 'purple',
    modifiers: { damageModifier: { add: 40 } },
    desc: '【闪电】伤害加成 +40%。攻击有 25% 概率触发连锁闪电弹跳 5 个敌人，造成等额伤害',
    price: 125
  },
  {
    id: 39,
    name: '【点金神手】',
    quality: 'purple',
    modifiers: { harvest: { add: 50 } },
    desc: '【点金】收获值 +50。被你击杀的任何敌人都有 5% 概率直接变为 10 金币的黄金',
    price: 120
  },
  {
    id: 40,
    name: '【虚空之眼】',
    quality: 'purple',
    modifiers: {},
    desc: '【闪现】全屏怪物移速永久降低 15%。每 10 秒在受到致命伤害一瞬间会自动向安全方向闪现 200 码并免伤',
    price: 130
  },
  {
    id: 41,
    name: '龙筋玉带',
    quality: 'blue',
    modifiers: { hpMax: { add: 30 }, meleeDmg: { add: 8 }, speed: { add: -4 } },
    desc: '最大生命值 +30，近战伤害 +8，移动速度 -4%',
    price: 60
  },
  {
    id: 42,
    name: '神手护腕',
    quality: 'blue',
    modifiers: { rangedDmg: { add: 8 }, attackSpeed: { add: 10 }, hpMax: { add: -10 } },
    desc: '远程伤害 +8，攻击速度 +10%，最大生命值 -10',
    price: 60
  },
  {
    id: 43,
    name: '天平筹码',
    quality: 'blue',
    modifiers: { harvest: { add: 20 }, luck: { add: 15 }, damageModifier: { add: -8 } },
    desc: '【筹码】收获值 +20，幸运值 +15，伤害加成 -8%',
    price: 65
  },
  {
    id: 44,
    name: '【玄铁重力甲】',
    quality: 'purple',
    modifiers: { armor: { add: 15 }, damageModifier: { add: 15 }, speed: { add: -10 } },
    desc: '【重力】护甲值 +15，伤害加成 +15%，移动速度 -10%',
    price: 120
  },
  {
    id: 45,
    name: '【太极阴阳玉】',
    quality: 'purple',
    modifiers: { lifeSteal: { add: 8 }, hpRegen: { add: 8 }, speed: { add: -5 } },
    desc: '【阴阳】生命偷取 +8%，生命再生 +8，移动速度 -5%',
    price: 125
  },
  {
    id: 46,
    name: '【萌宠・小竹鼠】',
    quality: 'green',
    modifiers: { speed: { add: 3 } },
    desc: '【宠物】召唤可爱小竹鼠跟随，自动帮你拾取方圆 350 码内的经验宝石与金币，移速 +3%',
    price: 45
  },
  {
    id: 47,
    name: '【萌宠・小萤火虫】',
    quality: 'green',
    modifiers: { engineering: { add: 5 } },
    desc: '【宠物】召唤萤火虫环绕，每 2 秒向附近敌人发射 10 点伤害的荧光弹，工程学 +5',
    price: 40
  },
  {
    id: 48,
    name: '【萌宠・招财金蟾】',
    quality: 'blue',
    modifiers: { harvest: { add: 8 } },
    desc: '【宠物】召唤招财金蟾跟随，每 10 秒吐出 2-4 枚竹子金币，收获值 +8',
    price: 70
  },
  {
    id: 49,
    name: '【萌宠・机关木蛛】',
    quality: 'blue',
    modifiers: { engineering: { add: 10 } },
    desc: '【宠物】召唤机关木蛛跟随，每 3 秒朝最近敌人喷射蛛网造成 15 点伤害并减速 40% 持续 2 秒，工程学 +10',
    price: 75
  },
  {
    id: 50,
    name: '【萌宠・熊猫嘟嘟】',
    quality: 'purple',
    modifiers: { hpMax: { add: 15 } },
    desc: '【宠物】召唤熊猫幼崽跟随，每 12 秒在地上掉落一颗美味竹笋，吃掉可恢复 8 点 HP，最大生命值 +15',
    price: 130
  },
  {
    id: 51,
    name: '【萌宠・灵狐阿宝】',
    quality: 'purple',
    modifiers: { luck: { add: 20 } },
    desc: '【宠物】召唤三尾灵狐，每 1.5 秒向随机目标发射引燃妖火造成 30 点伤害，幸运值 +20',
    price: 135
  },
  {
    id: 52,
    name: '避雷针',
    quality: 'green',
    modifiers: { engineering: { add: 8 }, hpMax: { add: 10 } },
    desc: '【被动】工程学 +8，最大生命值 +10。对靠近你的敌人每 3 秒引雷轰击一次造成 20 点伤害',
    price: 30
  },
  {
    id: 53,
    name: '醉仙葫芦',
    quality: 'blue',
    modifiers: { dodge: { add: 10 }, hpRegen: { add: 5 } },
    desc: '【被动】闪避率 +10%，生命再生 +5。闪避时有 10% 概率恢复 2 HP',
    price: 65
  },
  {
    id: 54,
    name: '【九天玄晶】',
    quality: 'purple',
    modifiers: { damageModifier: { add: 30 }, luck: { add: 20 }, speed: { add: -3 } },
    desc: '【九天】伤害加成 +30%，幸运值 +20，移动速度 -3%',
    price: 120
  }
];

/**
 * 道具系统管理器
 */
export class ItemSystem {
  /**
   * 依据当前波次与玩家幸运值，随机抽取出 N 个商品
   * @param count 抽取数量
   * @param wave 当前波次 (影响品质权重)
   * @param luck 玩家幸运值
   */
  public static getRandomShopItems(count: number, wave: number, luck: number): ItemConfig[] {
    const results: ItemConfig[] = [];
    const availableItems = [...ITEM_DATABASE];

    for (let i = 0; i < count; i++) {
      if (availableItems.length === 0) break;

      const quality = this.rollQuality(wave, luck);
      const candidates = availableItems.filter(item => item.quality === quality);
      
      // 如果所选品质已被抽空，从备选中选任意品质
      const targetPool = candidates.length > 0 ? candidates : availableItems;
      const index = Math.floor(Math.random() * targetPool.length);
      const chosen = targetPool[index];
      
      results.push(chosen);
      
      // 从可选列表中移除，防止单次刷新出重复道具
      const mainIndex = availableItems.findIndex(item => item.id === chosen.id);
      if (mainIndex !== -1) {
        availableItems.splice(mainIndex, 1);
      }
    }

    return results;
  }

  /**
   * 基于波次和幸运值随机概率决定抽取的品质
   */
  private static rollQuality(wave: number, luck: number): ItemQuality {
    // 基础品质概率 (随着波次波段变化)
    let wGreen = 12;
    let wBlue = 3;
    let wPurple = 0;

    if (wave >= 6 && wave <= 10) {
      wGreen = 28;
      wBlue = 10;
      wPurple = 2;
    } else if (wave >= 11 && wave <= 19) {
      wGreen = 33;
      wBlue = 17;
      wPurple = 5;
    } else if (wave >= 20) {
      wGreen = 35;
      wBlue = 20;
      wPurple = 10;
    }

    // 幸运值对高品质进行加权加成: 每1点幸运值，使绿、蓝、紫概率相对增加 1%
    const luckFactor = 1 + (Math.max(0, luck) / 100);
    
    let weightGreen = wGreen * luckFactor;
    let weightBlue = wBlue * luckFactor * 1.2;
    let weightPurple = wPurple * luckFactor * 1.5;
    
    // 保持白色的剩余部分
    let weightWhite = Math.max(10, 100 - (weightGreen + weightBlue + weightPurple));
    
    const totalWeight = weightWhite + weightGreen + weightBlue + weightPurple;
    const roll = Math.random() * totalWeight;

    if (roll < weightWhite) {
      return 'white';
    } else if (roll < weightWhite + weightGreen) {
      return 'green';
    } else if (roll < weightWhite + weightGreen + weightBlue) {
      return 'blue';
    } else {
      return 'purple';
    }
  }

  /**
   * 基于幸运值，计算商品在商店中的实际价格浮动（例如高Luck偶尔打折）
   */
  public static calculatePrice(basePrice: number, luck: number): number {
    // 每 2 点幸运值减少 1% 价格，最大打折 30% (即 70% 价格)
    const discount = Math.min(30, Math.floor(Math.max(0, luck) / 2));
    const price = basePrice * (1 - discount / 100);
    return Math.max(1, Math.round(price));
  }
}
