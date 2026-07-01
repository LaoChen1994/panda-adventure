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
