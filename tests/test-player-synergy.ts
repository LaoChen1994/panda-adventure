import { AttributeSystem } from '../src/systems/AttributeSystem';
import { ActiveSynergyInfo } from '../src/types';

function runTest() {
  console.log("Running Task 2 Tests (AttributeSystem mock)...");
  const attributeSystem = new AttributeSystem();
  
  // 功夫熊猫初始化调整
  attributeSystem.initCharacterBase({ hpMax: 20, meleeDmg: 5, speed: 10, rangedDmg: -10 });
  
  // 模拟从 WeaponSystem 获取的自然羁绊 2 件套 activeSynergies
  const synergies: ActiveSynergyInfo[] = [
    {
      tagKey: 'natural',
      name: '万物苏生',
      tag: '自然',
      currentCount: 2,
      level: 1,
      activeModifiers: { hpMax: 10 }
    }
  ];

  // 1. 模拟 Player.ts 中的 applySynergyModifiers 逻辑
  // 清除 synergy 属性修饰符
  const synergyPrefixes = ['melee', 'ranged', 'natural', 'engineering', 'wealth', 'magic'];
  const allAttributes = attributeSystem.getAttributes();
  Object.keys(allAttributes).forEach(attrName => {
    synergyPrefixes.forEach(prefix => {
      attributeSystem.removeModifier(`synergy_${prefix}`);
    });
  });

  // 挂载
  synergies.forEach(syn => {
    if (syn.level <= 0) return;
    Object.entries(syn.activeModifiers).forEach(([attrKey, value]) => {
      const isPercent = attrKey === 'damageModifier' || attrKey === 'attackSpeed' || attrKey === 'dodge' || attrKey === 'xpGainModifier';
      attributeSystem.addModifier({
        id: `synergy_${syn.tagKey}`,
        attribute: attrKey as any,
        addVal: isPercent ? 0 : value,
        mulVal: isPercent ? (value / 100) : 0
      });
    });
  });

  // 2. 验证最终最大生命值
  const maxHp = attributeSystem.get('hpMax');
  console.log("Calculated maxHp:", maxHp);
  // 基础 100 + 20 功夫熊猫 + 10 自然羁绊 = 130
  if (maxHp !== 130) {
    throw new Error(`Expected maxHp to be 130, but got ${maxHp}`);
  }

  console.log("Task 2 Tests Passed!");
}

runTest();
