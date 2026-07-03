import Phaser from 'phaser';
import { AttributeSystem } from '../systems/AttributeSystem';
import { CharacterId, CharacterConfig, PlayerAttributes, ActiveSynergyInfo } from '../types';

// 6个角色配置表定义
export const CHARACTER_DATABASE: Record<CharacterId, CharacterConfig> = {
  kungfu_panda: {
    id: 'kungfu_panda',
    name: '功夫熊猫',
    description: '近战平衡流。精通国术的大师，擅长格挡与闪避反击。',
    baseAdjustments: { hpMax: 20, meleeDmg: 5, speed: 10, rangedDmg: -10 },
    passiveName: '借力打力',
    passiveDesc: '成功闪避敌人攻击时，立刻对周围最近的敌人造成一次等同于 [近战伤害 * 2] 的物理震波。',
    initialWeaponId: 'bamboo_stick'
  },
  bamboo_archer: {
    id: 'bamboo_archer',
    name: '翠竹射手',
    description: '远程走位流。头戴斗笠的猎手，擅长远距离狙击。',
    baseAdjustments: { rangedDmg: 8, range: 100, hpMax: -15, armor: -2 },
    passiveName: '百步穿杨',
    passiveDesc: '距离敌人越远，造成的伤害越高。每相距 50 码，伤害提升 5%（最高提升 30%）。',
    initialWeaponId: 'bamboo_bow'
  },
  wealth_panda: {
    id: 'wealth_panda',
    name: '财迷熊猫',
    description: '理财成长流。身挂铜钱的富商，越有钱战斗力越强。',
    baseAdjustments: { harvest: 20, luck: 15, damageModifier: -10 },
    passiveName: '利滚利',
    passiveDesc: '每波结束时结算利息，身上每存有 10 金币额外获得 1 金币收益（单波上限 50 金币）。',
    initialWeaponId: 'gold_abacus'
  },
  iron_shield: {
    id: 'iron_shield',
    name: '铁甲霸王',
    description: '反伤肉盾流。身披明光重甲的霸王，坚不可摧。',
    baseAdjustments: { armor: 8, hpMax: 40, hpRegen: 5, speed: -15 },
    passiveName: '尖刺重甲',
    passiveDesc: '受到攻击时，将自身护甲值 200% 的固定物理伤害直接反弹给攻击者。',
    initialWeaponId: 'stone_shield'
  },
  drunk_master: {
    id: 'drunk_master',
    name: '醉拳大师',
    description: '高闪避爆发流。步伐飘忽的醉鬼，闪避后瞬间爆发。',
    baseAdjustments: { dodge: 20, critChance: 10, hpRegen: -4 },
    passiveName: '醉里乾坤',
    passiveDesc: '闪避率上限提升至 75%。每完成一次闪避，攻击速度提升 25%，持续 3 秒（最多叠加 3 层）。',
    initialWeaponId: 'wine_pot'
  },
  gear_mechanic: {
    id: 'gear_mechanic',
    name: '机械学者',
    description: '工程召唤流。背后蒸汽箱的发明家，依赖防御塔作战。',
    baseAdjustments: { engineering: 15, damageModifier: -30 },
    passiveName: '流水线生产',
    passiveDesc: '在地图上每隔 15 秒自动生成一台「青铜竹叶机枪塔」，机枪塔继承 100% 的工程学。',
    initialWeaponId: 'wrench'
  }
};

/**
 * 玩家熊猫实体类
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  public characterId: CharacterId = 'kungfu_panda';
  public attributeSystem: AttributeSystem;

  // 各个熊猫角色的逐帧行走动画配置表
  public static readonly walkAnimConfigs: Record<CharacterId, { key: string; sheet: string; frames: number; frameRate: number }> = {
    kungfu_panda: { key: 'kungfu_panda_walk_anim', sheet: 'kungfu_panda_walk', frames: 6, frameRate: 14 },
    bamboo_archer: { key: 'bamboo_archer_walk_anim', sheet: 'bamboo_archer_walk', frames: 6, frameRate: 12 },
    wealth_panda: { key: 'wealth_panda_walk_anim', sheet: 'wealth_panda_walk', frames: 9, frameRate: 14 },
    iron_shield: { key: 'iron_shield_walk_anim', sheet: 'iron_shield_walk', frames: 9, frameRate: 10 },
    drunk_master: { key: 'drunk_master_walk_anim', sheet: 'drunk_master_walk', frames: 9, frameRate: 14 },
    gear_mechanic: { key: 'gear_mechanic_walk_anim', sheet: 'gear_mechanic_walk', frames: 9, frameRate: 14 }
  };
  
  // 局内即时生存状态
  public hp: number = 100;
  public level: number = 1;
  public xp: number = 0;
  
  // 累计金币与局外成长硬币
  public gold: number = 0;

  // 辅助计时器
  private regenTimer: number = 0;
  private turretSpawnTimer: number = 0;

  // 醉拳大师被动层数
  private drunkStacks: number = 0;
  private drunkTimer: number = 0;

  // 满血护盾 (吸血溢出)
  public shield: number = 0;

  // 临时闪避状态 (用于幽灵披风触发)
  private hasGhostCritBuff: boolean = false;

  // 无敌判定 (九转还魂丹复活或闪现免伤)
  private isInvulnerable: boolean = false;

  // 玩家状态回调 (通知 UI)
  private onStatsChanged: () => void = () => {};
  private onLevelUp: () => void = () => {};
  private onPlayerDie: () => void = () => {};

  // 动画时间累加器与基础尺寸缩放
  private animTime: number = Math.random() * 100;
  private baseScaleVal: number = 0.42;

  // 护盾环绕特效精灵
  private shieldSprite: Phaser.GameObjects.Sprite | null = null;

  // 角色脚下血条图形对象
  private hpBarGraphics!: Phaser.GameObjects.Graphics;

  // 上次受击时间（用于无敌帧判定）
  private lastHitTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, characterId: CharacterId) {
    // 基础材质在 BootScene 被预载，根据选择的角色加载不同的 texture
    super(scene, x, y, characterId);
    
    this.characterId = characterId;
    this.attributeSystem = new AttributeSystem();
    
    // 初始化角色固有属性
    const config = CHARACTER_DATABASE[characterId];
    this.attributeSystem.initCharacterBase(config.baseAdjustments);

    // 状态初始化
    this.hp = this.getMaxHp();
    this.level = 1;
    this.xp = 0;
    this.gold = 0;

    // 加入物理场景
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    
    // 缩放尺寸微调 (配合 256x256 3倍超清材质)
    // 调整物理碰撞包围盒 (以 256 像素纹理大小为基准，设置 120x136)
    this.body?.setSize(120, 136);

    // 注册奔跑动画 (为所有配置了行走图的熊猫角色注册逐帧行走图集)
    const animConfig = Player.walkAnimConfigs[this.characterId];
    if (animConfig) {
      if (!scene.anims.exists(animConfig.key)) {
        const frameKeys: { key: string }[] = [];
        for (let i = 0; i < animConfig.frames; i++) {
          frameKeys.push({ key: `${this.characterId}_walk_${i}` });
        }
        scene.anims.create({
          key: animConfig.key,
          frames: frameKeys,
          frameRate: animConfig.frameRate,
          repeat: -1
        });
      }
    }

    // 初始化角色血条画笔
    this.hpBarGraphics = scene.add.graphics();
    this.hpBarGraphics.setDepth(15); // 确保在武器和角色之上
  }

  /**
   * 注册事件监听
   */
  public registerCallbacks(onStatsChanged: () => void, onLevelUp: () => void, onPlayerDie: () => void) {
    this.onStatsChanged = onStatsChanged;
    this.onLevelUp = onLevelUp;
    this.onPlayerDie = onPlayerDie;
    // 首次触发更新
    this.onStatsChanged();
  }

  public getMaxHp(): number {
    return Math.max(10, Math.round(this.attributeSystem.get('hpMax')));
  }

  public getAttributes(): PlayerAttributes {
    return this.attributeSystem.getAttributes();
  }

  public getRequiredXp(): number {
    const lvl = this.level;
    // 优化前期升级速度，新手期更温和，增大甜点区
    return Math.round(5 + (lvl * 1.5) + (lvl * lvl * 0.2));
  }

  /**
   * 获取金币
   */
  public addGold(amount: number) {
    this.gold += amount;
    this.onStatsChanged();
  }

  /**
   * 经验获取
   */
  public addXp(amount: number) {
    const xpModifier = 1 + (this.attributeSystem.get('xpGainModifier') / 100);
    this.xp += Math.round(amount * xpModifier);

    // 检查升级
    let reqXp = this.getRequiredXp();
    while (this.xp >= reqXp) {
      this.xp -= reqXp;
      this.level++;
      this.onLevelUp();
      reqXp = this.getRequiredXp();
    }
    this.onStatsChanged();
  }

  /**
   * 恢复生命值
   */
  public heal(amount: number) {
    if (this.hp <= 0) return;
    const maxHp = this.getMaxHp();
    this.hp = Math.min(maxHp, this.hp + amount);
    this.onStatsChanged();
  }

  /**
   * 受到伤害
   */
  public takeDamage(rawDamage: number, _sourceName: string = '怪物') {
    if (this.hp <= 0 || this.isInvulnerable) return;

    // 无敌帧判定 (0.5秒)
    const now = this.scene.time.now;
    if (now - this.lastHitTime < 500) return;
    this.lastHitTime = now;

    // 1. 闪避判定
    let dodgeChance = this.attributeSystem.get('dodge');
    // 醉拳大师专属被动上限提升至 75%
    if (this.characterId === 'drunk_master') {
      dodgeChance = Math.min(75, dodgeChance + 20); // 包含初始调整
    }
    
    if (Math.random() * 100 < dodgeChance) {
      this.triggerDodge();
      return;
    }

    // 2. 护甲减伤判定
    const armor = this.attributeSystem.get('armor');
    const dmgReduction = armor / (armor + 15);
    let finalDamage = Math.round(rawDamage * (1 - dmgReduction));
    if (finalDamage < 1) finalDamage = 1; // 至少承受 1 点伤害

    // 3. 护盾抵扣
    if (this.shield > 0) {
      if (this.shield >= finalDamage) {
        this.shield -= finalDamage;
        this.showFloatingText(`Shield -${finalDamage}`, '#5cd8ff');
        this.onStatsChanged();
        return;
      } else {
        finalDamage -= this.shield;
        this.showFloatingText(`Shield -${this.shield}`, '#5cd8ff');
        this.shield = 0;
      }
    }

    // 4. 减扣 HP
    this.hp -= finalDamage;
    this.showFloatingText(`-${finalDamage}`, '#ff4646');
    
    // 播放受击变红闪烁动画
    this.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
    });

    // 5. 【被动】铁甲霸王刺客重甲反弹伤害
    if (this.characterId === 'iron_shield' && armor > 0) {
      const reflectDmg = Math.round(armor * 2.0);
      this.reflectDamageToNearestEnemy(reflectDmg);
    }

    // 6. 死亡判定
    if (this.hp <= 0) {
      this.handleDeath();
    }

    this.onStatsChanged();
  }

  /**
   * 触发闪避及对应被动
   */
  private triggerDodge() {
    this.showFloatingText('Dodge!', '#ffffff');

    // 醉拳大师被动【醉里乾坤】
    if (this.characterId === 'drunk_master') {
      this.drunkStacks = Math.min(3, this.drunkStacks + 1);
      this.drunkTimer = 3.0; // 持续 3 秒
      // 动态注入临时攻速修饰器
      this.attributeSystem.addModifier({
        id: 'drunk_passive_as',
        attribute: 'attackSpeed',
        addVal: this.drunkStacks * 25,
        mulVal: 0
      });
    }

    // 功夫熊猫被动【借力打力】
    if (this.characterId === 'kungfu_panda') {
      const meleeDmg = this.attributeSystem.get('meleeDmg');
      const shockDmg = Math.round(meleeDmg * 2.0);
      this.reflectDamageToNearestEnemy(shockDmg);
    }

    // 装备道具 31：幽灵披风触发，下一击必定 300% 暴击
    if (this.hasGhostCloak()) {
      this.hasGhostCritBuff = true;
      this.showFloatingText('CRIT BUFF', '#d05cff');
    }

    this.onStatsChanged();
  }

  /**
   * 攻击吸血逻辑
   */
  public triggerLifeSteal(damageDealt: number) {
    const lifeStealPercent = this.attributeSystem.get('lifeSteal');
    if (lifeStealPercent <= 0) return;

    // 溢出判定吸血
    if (Math.random() * 100 < lifeStealPercent) {
      const healAmount = Math.max(1, Math.round(damageDealt * 0.1)); // 偷取10%的伤害作为HP
      const maxHp = this.getMaxHp();

      if (this.hp >= maxHp) {
        // 满血溢出吸血鬼披风转化为护盾 (最多50)
        if (this.hasVampireCloak()) {
          this.shield = Math.min(50, this.shield + healAmount);
          this.showFloatingText(`+${healAmount} Shield`, '#5cd8ff');
        }
      } else {
        this.heal(healAmount);
        this.showFloatingText(`+${healAmount}`, '#4dff46');
      }
    }
  }

  /**
   * 检查是否拥有特定被动道具
   */
  private hasGhostCloak(): boolean {
    return this.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_31');
  }

  private hasVampireCloak(): boolean {
    return this.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_34');
  }

  public getAndClearGhostCritBuff(): boolean {
    if (this.hasGhostCritBuff) {
      this.hasGhostCritBuff = false;
      return true;
    }
    return false;
  }

  /**
   * 被动反击：寻找最近的敌人造成反击物理震波
   */
  private reflectDamageToNearestEnemy(dmg: number) {
    // 延迟广播到 GameScene 寻找最近的怪
    this.scene.events.emit('player-reflect-dmg', { damage: dmg, sourcePos: { x: this.x, y: this.y } });
  }

  /**
   * 处理玩家死亡 (含九转还魂丹判定)
   */
  private handleDeath() {
    // 检查是否有九转还魂丹 (Item 37) 并未使用过
    const hasRebornPill = this.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_37');
    const isRebornUsed = this.scene.registry.get('reborn_used') === true;

    if (hasRebornPill && !isRebornUsed) {
      // 消耗还魂丹复活
      this.scene.registry.set('reborn_used', true);
      this.hp = Math.round(this.getMaxHp() * 0.5);
      
      // 触发无敌 3 秒与击退震荡波
      this.triggerInvulnerability(3.0);
      this.scene.events.emit('player-reborn-wave', { x: this.x, y: this.y });

      this.showFloatingText('九转复活！', '#ffd000');
      return;
    }

    // 彻底死亡
    this.onPlayerDie();
  }

  /**
   * 触发无敌状态
   */
  public triggerInvulnerability(duration: number) {
    this.isInvulnerable = true;
    
    // 闪烁视觉特效
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      yoyo: true,
      repeat: Math.floor(duration * 4),
      duration: 125,
      onComplete: () => {
        this.setAlpha(1.0);
        this.isInvulnerable = false;
      }
    });
  }

  /**
   * 控制器移动接口 (Vite + Phaser 双端兼容)
   */
  public move(vx: number, vy: number) {
    if (this.hp <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    const speedStat = this.attributeSystem.get('speed');
    // 标准移速 200px/s 乘以上限比例
    const baseSpeedValue = 200 * (speedStat / 100);

    this.setVelocity(vx * baseSpeedValue, vy * baseSpeedValue);

    // 翻转图像方向
    if (vx < 0) {
      this.setFlipX(true);
    } else if (vx > 0) {
      this.setFlipX(false);
    }
  }

  /**
   * 每帧状态更新
   */
  public updateEntity(dt: number) {
    if (this.hp <= 0) {
      if (this.hpBarGraphics) this.hpBarGraphics.clear();
      return;
    }

    this.drawHpBar();

    // 0.5 护盾环绕特效更新
    if (this.shield > 0) {
      if (!this.shieldSprite) {
        this.shieldSprite = this.scene.add.sprite(this.x, this.y, 'effect_shield_ring');
        this.shieldSprite.setDepth(this.depth + 1);
        this.shieldSprite.setScale(0.8);
      } else {
        this.shieldSprite.setPosition(this.x, this.y);
        this.shieldSprite.rotation += dt * 1.5;
        this.shieldSprite.setVisible(true);
      }
    } else {
      if (this.shieldSprite) {
        this.shieldSprite.setVisible(false);
      }
    }

    // 0. 卡通 waddle/idle 动画驱动
    this.animTime += dt;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isMoving = body && (Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10);
    
    if (isMoving) {
      const animConfig = Player.walkAnimConfigs[this.characterId];
      if (animConfig) {
        // 播放真实的逐帧行走 spritesheet 动画
        if (this.anims.currentAnim?.key !== animConfig.key) {
          this.play(animConfig.key);
        }
        
        // 结合微小物理摆动增添动感，但保持缩放比例不变 (因为帧内已含形变)
        this.setAngle(Math.sin(this.animTime * (animConfig.frameRate * 0.8)) * 2);
        this.setScale(this.baseScaleVal, this.baseScaleVal);
      } else {
        // Fallback waddle
        const waddleSpeed = 15;
        this.setAngle(Math.sin(this.animTime * waddleSpeed) * 8);
        const squashY = this.baseScaleVal + Math.abs(Math.sin(this.animTime * waddleSpeed)) * 0.15;
        const squashX = this.baseScaleVal - Math.abs(Math.sin(this.animTime * waddleSpeed)) * 0.05;
        this.setScale(squashX, squashY);
      }
    } else {
      const animConfig = Player.walkAnimConfigs[this.characterId];
      if (animConfig) {
        // 停止动画，切回默认静止贴图
        if (this.anims.isPlaying) {
          this.stop();
          this.setTexture(this.characterId);
        }
      }
      
      // 呼吸呼吸 idle 动画
      this.setAngle(0);
      const breathSpeed = 3;
      const breathY = this.baseScaleVal + Math.sin(this.animTime * breathSpeed) * 0.04;
      const breathX = this.baseScaleVal - Math.sin(this.animTime * breathSpeed) * 0.02;
      this.setScale(breathX, breathY);
    }

    // 1. 生命再生逻辑 (每 5 秒自动恢复 HP Regen 点数)
    const hpRegen = this.attributeSystem.get('hpRegen');
    if (hpRegen > 0) {
      this.regenTimer += dt;
      if (this.regenTimer >= 5.0) {
        this.regenTimer = 0;
        
        // 急救绷带 (Item 22): 生命值低于 30% 时，HP Regen 翻倍
        let regenAmount = hpRegen;
        if (this.hp < this.getMaxHp() * 0.3 && this.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_22')) {
          regenAmount *= 2;
        }

        this.heal(regenAmount);
      }
    }

    // 2. 醉拳大师攻速 Buff 衰减计时
    if (this.drunkTimer > 0) {
      this.drunkTimer -= dt;
      if (this.drunkTimer <= 0) {
        this.drunkStacks = 0;
        this.attributeSystem.removeModifier('drunk_passive_as');
        this.onStatsChanged();
      }
    }

    // 3. 机械学者自动机枪塔生成 (每 15 秒)
    if (this.characterId === 'gear_mechanic') {
      this.turretSpawnTimer += dt;
      if (this.turretSpawnTimer >= 15.0) {
        this.turretSpawnTimer = 0;
        this.scene.events.emit('spawn-player-turret', { x: this.x, y: this.y });
      }
    }
  }

  /**
   * 绘制角色脚下的血条与护盾条
   */
  private drawHpBar() {
    if (!this.hpBarGraphics) return;
    this.hpBarGraphics.clear();
    if (this.hp <= 0) return;

    const maxHp = this.getMaxHp();
    const hpRatio = Math.max(0, Math.min(1, this.hp / maxHp));

    const barWidth = 60;
    const barHeight = 8;
    const offsetX = this.x - barWidth / 2;
    const offsetY = this.y + 60; // 绘在熊猫人脚下 (熊猫人贴图高度约136)

    // 1. 绘制背景黑框
    this.hpBarGraphics.fillStyle(0x000000, 0.6);
    this.hpBarGraphics.fillRect(offsetX - 2, offsetY - 2, barWidth + 4, barHeight + 4);

    // 2. 绘制血条主色（根据血量高低改变颜色：绿/黄/红）
    const color = hpRatio > 0.5 ? 0x2ecc71 : (hpRatio > 0.25 ? 0xf1c40f : 0xe74c3c);
    this.hpBarGraphics.fillStyle(color, 1.0);
    this.hpBarGraphics.fillRect(offsetX, offsetY, barWidth * hpRatio, barHeight);

    // 3. 绘制护盾条叠层（如果有护盾的话，显示为上层淡蓝色光条）
    if (this.shield > 0) {
      const shieldRatio = Math.min(1.0, this.shield / maxHp);
      this.hpBarGraphics.fillStyle(0x5cd8ff, 0.85);
      this.hpBarGraphics.fillRect(offsetX, offsetY + barHeight - 3, barWidth * shieldRatio, 3);
    }
  }

  /**
   * 飘字提示辅助函数
   */
  private showFloatingText(text: string, color: string) {
    const ftext = this.scene.add.text(this.x, this.y - 20, text, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    });
    ftext.setOrigin(0.5);

    this.scene.tweens.add({
      targets: ftext,
      y: this.y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        ftext.destroy();
      }
    });
  }
  /**
   * 应用武器羁绊属性增益
   */
  public applySynergyModifiers(activeSynergies: ActiveSynergyInfo[]) {
    // 1. 清除原有的以 synergy_ 开头的羁绊属性修饰符
    this.attributeSystem.removeModifiersByPrefix('synergy_');

    // 2. 挂载当前生效的羁绊增益
    activeSynergies.forEach(syn => {
      if (syn.level <= 0) return; // 未满足最低件数不生效
      
      Object.entries(syn.activeModifiers).forEach(([attrKey, value]) => {
        // 百分比改变量加到 mulVal，固定数值加到 addVal
        const isPercent = attrKey === 'damageModifier' || attrKey === 'attackSpeed' || attrKey === 'dodge' || attrKey === 'xpGainModifier';
        
        this.attributeSystem.addModifier({
          id: `synergy_${syn.tagKey}`,
          attribute: attrKey as keyof PlayerAttributes,
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

  /**
   * 销毁清理
   */
  public destroy(fromScene?: boolean) {
    if (this.hpBarGraphics) {
      this.hpBarGraphics.destroy();
    }
    if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
    super.destroy(fromScene);
  }
}
