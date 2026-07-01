import Phaser from 'phaser';
import { Player, CHARACTER_DATABASE } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { WaveSystem } from '../systems/WaveSystem';
import { WeaponSystem, WEAPON_DATABASE } from '../systems/WeaponSystem';
import { ItemSystem, ITEM_DATABASE } from '../systems/ItemSystem';
import { OverlayManager } from '../ui/OverlayManager';
import { CharacterId, EquippedWeapon, ItemConfig, WeaponQuality, WeaponId, EnemyId, PlayerAttributes } from '../types';
import { Pet, PetId } from '../entities/Pet';

/**
 * 核心战斗主场景
 */
export class GameScene extends Phaser.Scene {
  // 核心系统实例
  public player!: Player;
  public playerHighlight!: Phaser.GameObjects.Graphics;
  public waveSystem!: WaveSystem;
  public weaponSystem!: WeaponSystem;
  public overlayManager!: OverlayManager;

  // 物理碰撞组
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private bulletsGroup!: Phaser.Physics.Arcade.Group;
  private enemyProjectilesGroup!: Phaser.Physics.Arcade.Group;
  private collectablesGroup!: Phaser.Physics.Arcade.Group;
  private summonsGroup!: Phaser.Physics.Arcade.Group;
  private activePets: Pet[] = [];
  private petsGroup!: Phaser.GameObjects.Group;

  // 场景状态
  private isGameActive: boolean = false;
  private totalKills: number = 0;
  private totalTimeElapsed: number = 0;
  private totalGoldCollected: number = 0;
  
  // 局内临时状态
  private isReviveUsed: boolean = false;

  // 武器实体外观挂件状态
  private weaponVisuals: (Phaser.GameObjects.Sprite | undefined)[] = [];
  private weaponOrbitAngle: number = 0;

  // 输入控制
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // 虚拟摇杆控制与绘图变量 (移动端触屏拖拽)
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDragging: boolean = false;
  private joystickGraphics!: Phaser.GameObjects.Graphics;
  private joystickBasePos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  // 地图背景瓦片与格板
  private mapBackground!: Phaser.GameObjects.TileSprite;
  
  // 程序化地表装饰物状态
  private activeDecorators: Map<string, Phaser.GameObjects.Sprite[]> = new Map();
  private lastPlayerCellCol: number = -999;
  private lastPlayerCellRow: number = -999;

  // Boss 方向指引图形容器
  private bossIndicator!: Phaser.GameObjects.Graphics;

  // 商店集市当前陈列的商品
  private shopMarketItems: any[] = [];

  constructor() {
    super('GameScene');
  }

  init() {
    this.waveSystem = new WaveSystem();
    this.weaponSystem = new WeaponSystem();
    // 获取全局绑定的 overlayManager
    this.overlayManager = (this.game.registry.get('overlayManager') as OverlayManager);
    this.overlayManager.setGameInstance(this);
    
    // 重置统计
    this.totalKills = 0;
    this.totalTimeElapsed = 0;
    this.totalGoldCollected = 0;
    this.isReviveUsed = false;
    this.registry.set('reborn_used', false);
  }

  create() {
    // 1. 设置物理边界 (大幅度拓宽物理边界，实现接近无限地图，同时保留安全边界)
    this.physics.world.setBounds(-100000, -100000, 200000, 200000);

    // 初始化 Boss 指向指示器图形
    this.bossIndicator = this.add.graphics();
    this.bossIndicator.setDepth(100);
    this.bossIndicator.setScrollFactor(0);

    // 初始化虚拟摇杆图形
    this.joystickGraphics = this.add.graphics();
    this.joystickGraphics.setDepth(200);
    this.joystickGraphics.setScrollFactor(0);

    // 2. 初始化物理对象组 (开启对象池回收)
    this.enemiesGroup = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.bulletsGroup = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.enemyProjectilesGroup = this.physics.add.group();
    this.collectablesGroup = this.physics.add.group();
    this.summonsGroup = this.physics.add.group();
    this.petsGroup = this.add.group();

    // 3. 开启碰撞监听
    // 子弹击中怪物
    this.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, this.handleBulletHitEnemy, undefined, this);
    
    // 4. 输入设备绑定
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;
    }

    // 绑定触屏手势做虚拟摇杆
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameActive) return;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.isDragging = true;
      this.joystickBasePos.set(pointer.x, pointer.y);
      this.drawJoystick(pointer.x, pointer.y, pointer.x, pointer.y);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const distance = Phaser.Math.Distance.Between(this.joystickBasePos.x, this.joystickBasePos.y, pointer.x, pointer.y);
      const angle = Phaser.Math.Angle.Between(this.joystickBasePos.x, this.joystickBasePos.y, pointer.x, pointer.y);
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (distance > 50) {
        targetX = this.joystickBasePos.x + Math.cos(angle) * 50;
        targetY = this.joystickBasePos.y + Math.sin(angle) * 50;
      }
      this.drawJoystick(this.joystickBasePos.x, this.joystickBasePos.y, targetX, targetY);
    });
    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.joystickGraphics.clear();
    });

    // 5. 绑定全局核心事件总线
    this.events.off('enemy-died');
    this.events.on('enemy-died', this.handleEnemyDropReward, this);
    
    this.events.off('spawn-enemy');
    this.events.on('spawn-enemy', this.spawnEnemy, this);

    this.events.off('spawn-enemy-projectile');
    this.events.on('spawn-enemy-projectile', this.spawnEnemyProjectile, this);

    this.events.off('spawn-player-turret');
    this.events.on('spawn-player-turret', this.spawnPlayerTurret, this);

    this.events.off('player-reflect-dmg');
    this.events.on('player-reflect-dmg', this.handlePlayerReflectDmg, this);

    this.events.off('player-reborn-wave');
    this.events.on('player-reborn-wave', this.handlePlayerRebornWave, this);

    // 绑定萌宠跟随特技事件监听
    this.events.off('pet-action-shoot-firefly');
    this.events.on('pet-action-shoot-firefly', this.handlePetShootFirefly, this);

    this.events.off('pet-action-spawn-gold');
    this.events.on('pet-action-spawn-gold', this.handlePetSpawnGold, this);

    this.events.off('pet-action-shoot-spider');
    this.events.on('pet-action-shoot-spider', this.handlePetShootSpider, this);

    this.events.off('pet-action-spawn-heal');
    this.events.on('pet-action-spawn-heal', this.handlePetSpawnHeal, this);

    this.events.off('pet-action-shoot-fox');
    this.events.on('pet-action-shoot-fox', this.handlePetShootFox, this);

    // 6. UI事件处理器绑定
    this.bindUIEventHandlers();

    // 7. 开启主菜单界面
    this.overlayManager.showScreen('menu-screen');
  }

  /**
   * 绑定网页按钮点击逻辑
   */
  private bindUIEventHandlers() {
    this.overlayManager.registerHandlers({
      // 主菜单：点击开始游戏
      onStartGame: (charId: CharacterId) => {
        this.startGame(charId);
      },
      // 局内升级：选择四选一属性
      onLevelUpSelected: (idx: number) => {
        this.applyLevelUpUpgrade(idx);
      },
      // 商店：购买道具
      onShopBuyItem: (item: ItemConfig) => {
        this.buyItemFromShop(item);
      },
      // 商店：购买武器
      onShopBuyWeapon: (weaponId: WeaponId, cost: number) => {
        this.buyWeaponFromShop(weaponId, cost);
      },
      // 商店：刷新集市
      onShopReroll: () => {
        this.rerollShopMarket();
      },
      // 商店：拖拽合成
      onShopWeaponMerged: (from: number, to: number) => {
        this.mergeShopWeapons(from, to);
      },
      // 商店：下一波
      onShopNextWave: () => {
        this.startNextWave();
      },
      // 结算：复活
      onRevive: () => {
        this.watchAdRevive();
      },
      // 结算：双倍金币
      onDoubleCoins: () => {
        this.watchAdDoubleCoins();
      },
      // 结算：重玩
      onRestartGame: () => {
        this.restartGame();
      }
    });
  }

  // =======================================================
  //            关卡战斗流程控制
  // =======================================================

  private startGame(charId: CharacterId) {
    this.isGameActive = true;
    this.totalKills = 0;
    this.totalTimeElapsed = 0;
    this.totalGoldCollected = 0;
    this.isReviveUsed = false;

    // 清理旧武器实体挂载
    this.weaponVisuals.forEach(s => { if (s) s.destroy(); });
    this.weaponVisuals = [];
    this.weaponOrbitAngle = 0;

    // 清理跟随的宠物
    this.activePets.forEach(p => p.destroyPet());
    this.activePets = [];
    if (this.petsGroup) this.petsGroup.clear(true, true);
    
    // 清除可能存在的旧尸体和掉落物
    this.enemiesGroup.clear(true, true);
    this.bulletsGroup.clear(true, true);
    this.collectablesGroup.clear(true, true);
    this.summonsGroup.clear(true, true);
    this.enemyProjectilesGroup.clear(true, true);

    // 1. 创建地图背景瓦片 (在窗口大小上平铺，跟随镜头更新，实现无限延展)
    if (this.mapBackground) this.mapBackground.destroy();

    // 初始化地表装饰物数据状态
    if (this.activeDecorators) {
      for (const sprites of this.activeDecorators.values()) {
        sprites.forEach(s => s.destroy());
      }
      this.activeDecorators.clear();
    }
    this.lastPlayerCellCol = -999;
    this.lastPlayerCellRow = -999;

    const width = this.scale.width;
    const height = this.scale.height;
    this.mapBackground = this.add.tileSprite(width / 2, height / 2, width + 100, height + 100, 'map_forest_tile');
    this.mapBackground.setScrollFactor(0);
    this.mapBackground.setDepth(-11);
    this.mapBackground.setTint(0x777777); // 降低背景亮度

    // 监听窗口大小改变，保持背景铺满屏幕
    this.scale.off('resize');
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.mapBackground) {
        this.mapBackground.setSize(gameSize.width + 100, gameSize.height + 100);
        this.mapBackground.setPosition(gameSize.width / 2, gameSize.height / 2);
      }
    });

    // 根据不同地图调整背景格颜色
    this.adjustMapVisuals(1);

    // 2. 实例化玩家
    this.player = new Player(this, 1500, 1500, charId);

    // 添加主角底座高光
    this.playerHighlight = this.add.graphics();
    this.playerHighlight.fillStyle(0xffd700, 0.2);
    this.playerHighlight.fillCircle(0, 0, 45);
    this.playerHighlight.setDepth(this.player.depth - 1);
    this.weaponSystem.clear();
    
    // 自动装备该角色的初始武器
    const charConfig = CHARACTER_DATABASE[charId];
    this.weaponSystem.equipWeapon(charConfig.initialWeaponId as WeaponId, WeaponQuality.WHITE, 0);
    this.updatePlayerWeaponModifiers();

    // 注册玩家属性回调
    this.player.registerCallbacks(
      () => { this.syncHUD(); },
      () => { this.handlePlayerLevelUp(); },
      () => { this.handlePlayerDie(); }
    );

    // 相机跟随 (不设相机边界，实现无限视野行走)
    this.cameras.main.removeBounds();
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // 3. 物理碰撞关联 (掉落物与玩家、怪物与玩家)
    this.physics.add.overlap(this.player, this.collectablesGroup, this.handlePlayerCollectReward, undefined, this);
    this.physics.add.overlap(this.player, this.enemyProjectilesGroup, this.handlePlayerHitByProjectile, undefined, this);
    this.physics.add.overlap(this.player, this.enemiesGroup, this.handlePlayerEnemyCollision, undefined, this);

    // 4. 开始第一波
    this.waveSystem.startWave(1);
    this.physics.resume();
    this.overlayManager.showScreen('hud-screen');
  }

  /**
   * 依据地图阶段调整地貌画刷
   */
  private adjustMapVisuals(wave: number) {
    // 切换波次时清空原有的地表装饰物，使其在玩家周围动态生成新地图专有装饰
    if (this.activeDecorators) {
      for (const sprites of this.activeDecorators.values()) {
        sprites.forEach(s => s.destroy());
      }
      this.activeDecorators.clear();
      this.lastPlayerCellCol = -999;
      this.lastPlayerCellRow = -999;
    }

    if (wave >= 1 && wave <= 5) {
      // 幽静翠竹林 - 亮青草绿
      this.cameras.main.setBackgroundColor('#d2ecd5');
      if (this.mapBackground) this.mapBackground.setTexture('map_forest_tile');
    } else if (wave >= 6 && wave <= 15) {
      // 熔岩地下城 - 暖黑地块
      this.cameras.main.setBackgroundColor('#1c1c1f');
      if (this.mapBackground) this.mapBackground.setTexture('map_lava_tile');
    } else {
      // 空岛 - 舒适天空蓝
      this.cameras.main.setBackgroundColor('#dbeafe');
      if (this.mapBackground) this.mapBackground.setTexture('map_sky_tile');
    }
  }

  /**
   * 战斗主循环
   */
  update(_time: number, delta: number) {
    if (!this.isGameActive || this.scene.isPaused('GameScene')) return;

    const dt = delta / 1000;
    this.totalTimeElapsed += dt;

    // 0. 地图背景无限平铺平移与地表装饰物随动
    if (this.mapBackground) {
      this.mapBackground.tilePositionX = this.cameras.main.scrollX;
      this.mapBackground.tilePositionY = this.cameras.main.scrollY;
    }
    this.updateDecorators();

    // 1. 玩家移动逻辑驱动
    this.handlePlayerMovement();

    // 2. 玩家状态周期计时
    this.player.updateEntity(dt);

    // 更新高光位置跟随玩家
    if (this.playerHighlight) {
      this.playerHighlight.setPosition(this.player.x, this.player.y);
    }

    // 2.2 更新所有怪物状态与动画
    this.enemiesGroup.getChildren().forEach(e => {
      if (e.active) {
        (e as Enemy).updateEntity(dt);
      }
    });

    // 2.5 萌宠跟随状态计时更新
    this.activePets.forEach(pet => pet.updatePet(dt));

    // 3. 武器自动索敌与开火循环
    const attrs = this.player.getAttributes();
    this.weaponSystem.updateCooldowns(dt, attrs.attackSpeed, (_slotIndex, weapon) => {
      this.fireWeapon(weapon);
    });

    // 3.5 旋转定位挂件武器外观
    this.updateWeaponVisuals(dt);

    // 4. 地图危险机关环境 tick
    this.tickMapHazards(dt);

    // 5. 刷怪倒计时 tick
    this.waveSystem.tick(
      dt,
      (enemyId) => {
        this.events.emit('spawn-enemy', enemyId);
      },
      () => {
        this.handleWaveComplete();
      }
    );

    // 6. 掉落物磁吸重力判定 (磁铁效果)
    this.tickCollectablesMagnet();

    // 7. 更新工程学召唤塔自动开火
    this.tickSummonedTurrets(dt);

    // 7.5 更新 Boss 指示方向
    this.updateBossIndicator();

    // 8. 同步更新 HUD 面板 (定时器)
    this.syncHUD();
  }

  /**
   * 玩家移动输入解析 (支持 WASD 与触屏滑动双端)
   */
  private handlePlayerMovement() {
    let vx = 0;
    let vy = 0;

    if (this.isDragging) {
      // 虚拟摇杆控制向量
      const dx = this.input.activePointer.x - this.dragStartX;
      const dy = this.input.activePointer.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        vx = dx / dist;
        vy = dy / dist;
      }
    } else if (this.cursors && this.wasdKeys) {
      // 键盘控制
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) vx = -1;
      else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) vx = 1;

      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) vy = -1;
      else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) vy = 1;

      // 对角线移动速度斜归一化
      if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
      }
    }

    this.player.move(vx, vy);
  }

  // =======================================================
  //            武器与子弹攻击流水线
  // =======================================================

  /**
   * 触发武器发射
   */
  private fireWeapon(equipped: EquippedWeapon) {
    const stats = this.weaponSystem.getWeaponStats(equipped.weaponId, equipped.quality);
    const attrs = this.player.getAttributes();

    // 获取最终索敌距离 (受属性 range 加成)
    const finalRange = stats.range + attrs.range;

    // 寻找最近的怪物
    const target = this.findNearestEnemy(this.player.x, this.player.y, finalRange);
    if (!target) return; // 范围内无怪物

    // 计算朝向角度
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    
    // 计算最终基础面板伤害
    // 近战或远程伤害加成加算：(基础 + 近/远伤) * (1 + 伤害加成百分比/100)
    let damageVal = stats.damage;
    if (WEAPON_DATABASE[equipped.weaponId].isMelee) {
      damageVal += attrs.meleeDmg;
    } else {
      damageVal += attrs.rangedDmg;
    }
    const damageModifier = 1 + (attrs.damageModifier / 100);
    let finalDamage = Math.round(damageVal * damageModifier);

    // 判定暴击
    let isCrit = false;
    let critMul = 2.0;

    // 幽灵披风触发：闪避后下一击必定 300% 暴击
    if (this.player.getAndClearGhostCritBuff()) {
      isCrit = true;
      critMul = 3.0;
    } else if (Math.random() * 100 < attrs.critChance) {
      isCrit = true;
      critMul = 2.0;
    }

    if (isCrit) {
      finalDamage = Math.round(finalDamage * critMul);
    }

    // 翠竹射手专属被动：【百步穿杨】距离越远伤害越高
    if (this.player.characterId === 'bamboo_archer') {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
      const distBonus = Math.min(30, Math.floor(dist / 50) * 5); // 每50码+5%，上限30%
      finalDamage = Math.round(finalDamage * (1 + distBonus / 100));
    }

    // 触发子弹射出
    this.spawnWeaponProjectiles(equipped, finalDamage, finalRange, stats.knockback, angle, isCrit);

    // 播放环绕武器的外观攻击/后坐力动画
    const equippedWeapons = this.weaponSystem.getEquippedWeapons();
    const slot = equippedWeapons.findIndex(w => w === equipped);
    if (slot !== -1) {
      const targetSprite = this.weaponVisuals[slot];
      if (targetSprite) {
        targetSprite.setData('isTweening', true);
        const isMelee = WEAPON_DATABASE[equipped.weaponId].isMelee;

        if (isMelee) {
          // 近战武器：快速转动半圆进行挥砍，随后收回
          const currentRot = targetSprite.rotation;
          this.tweens.add({
            targets: targetSprite,
            rotation: currentRot + 1.2,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
              targetSprite.setData('isTweening', false);
            }
          });
        } else {
          // 远程武器：旋转指向攻击方向，播放反方向的后坐力平移动画
          targetSprite.rotation = angle;
          const recoilDist = 6;
          const recoilX = targetSprite.x - Math.cos(angle) * recoilDist;
          const recoilY = targetSprite.y - Math.sin(angle) * recoilDist;

          this.tweens.add({
            targets: targetSprite,
            x: recoilX,
            y: recoilY,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 70,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
              targetSprite.setData('isTweening', false);
            }
          });
        }
      }
    }
  }

  /**
   * 依据武器生成各品阶的子弹/波判定体
   */
  private spawnWeaponProjectiles(
    equipped: EquippedWeapon,
    damage: number,
    range: number,
    knockback: number,
    angle: number,
    isCrit: boolean
  ) {
    const bulletPool = this.bulletsGroup;
    const bulletSpeed = WEAPON_DATABASE[equipped.weaponId].isMelee ? 180 : 500;

    // 红色神话属性特效
    const isMythic = equipped.quality === WeaponQuality.RED;

    // 1. 新手竹棍 (近战挥击)
    if (equipped.weaponId === 'bamboo_stick') {
      const b = bulletPool.get() as Bullet;
      if (b) {
        b.fire(this.player.x, this.player.y, angle, bulletSpeed, damage, range, knockback, 99, 'effect_swing', { isMeleeSwing: true });
      }

      // 神话特效：30% 概率释放半月形穿透气波
      if (isMythic && Math.random() < 0.3) {
        const gasWave = bulletPool.get() as Bullet;
        if (gasWave) {
          gasWave.fire(this.player.x, this.player.y, angle, 400, damage, range * 1.5, knockback, 5, 'effect_swing', { isMeleeSwing: true });
        }
      }
      return;
    }

    // 2. 青竹弓 (远程箭矢)
    if (equipped.weaponId === 'bamboo_bow') {
      const pierce = equipped.quality >= WeaponQuality.BLUE ? (equipped.quality === WeaponQuality.PURPLE ? 3 : 2) : 1;
      const finalPierce = isMythic ? 4 : pierce;

      if (isMythic) {
        // 神话特效：三连发扇形箭
        const angles = [angle - 0.2, angle, angle + 0.2];
        angles.forEach(a => {
          const b = bulletPool.get() as Bullet;
          if (b) {
            b.fire(this.player.x, this.player.y, a, bulletSpeed, damage, range, knockback, finalPierce, 'bullet_large', { isSplitOnCrit: isCrit });
          }
        });
      } else {
        const b = bulletPool.get() as Bullet;
        if (b) {
          b.fire(this.player.x, this.player.y, angle, bulletSpeed, damage, range, knockback, finalPierce, 'bullet_default', { isSplitOnCrit: isCrit });
        }
      }
      return;
    }

    // 3. 金算盘 (扔金币)
    if (equipped.weaponId === 'gold_abacus') {
      const b = bulletPool.get() as Bullet;
      if (b) {
        b.fire(this.player.x, this.player.y, angle, bulletSpeed, damage, range, knockback, 1, 'bullet_coin', { chainLightning: isMythic }); // 神话带连锁闪电
      }
      return;
    }

    // 4. 石制大盾 (近战盾击)
    if (equipped.weaponId === 'stone_shield') {
      // 盾击挥动：大范围强击退
      const b = bulletPool.get() as Bullet;
      if (b) {
        b.fire(this.player.x, this.player.y, angle, 120, damage, range, knockback, 99, 'effect_swing', { isMeleeSwing: true });
      }

      // 神话特效：360度大盾击，震退并眩晕
      if (isMythic) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const subB = bulletPool.get() as Bullet;
          if (subB) {
            subB.fire(this.player.x, this.player.y, a, 100, damage * 0.8, range, knockback * 1.5, 99, 'effect_swing', { isMeleeSwing: true });
          }
        }
      }
      return;
    }

    // 5. 醉拳酒壶 (烈酒泼洒)
    if (equipped.weaponId === 'wine_pot') {
      // 喷洒扇形泼水子弹
      const dropletCount = equipped.quality >= WeaponQuality.PURPLE ? 4 : 2;
      for (let i = 0; i < dropletCount; i++) {
        const spreadAngle = angle + Phaser.Math.FloatBetween(-0.25, 0.25);
        const b = bulletPool.get() as Bullet;
        if (b) {
          b.fire(this.player.x, this.player.y, spreadAngle, bulletSpeed + Phaser.Math.Between(-50, 50), damage, range, knockback, 1, 'bullet_wine');
        }
      }
      return;
    }

    // 6. 扳手 (射出螺母或敲击)
    if (equipped.weaponId === 'wrench') {
      const b = bulletPool.get() as Bullet;
      if (b) {
        b.fire(this.player.x, this.player.y, angle, bulletSpeed, damage, range, knockback, 99, 'effect_swing', { isMeleeSwing: true });
      }
      return;
    }

    // 7. 烈焰红枪 (近战刺击与地表灼烧路径)
    if (equipped.weaponId === 'spear') {
      const b = bulletPool.get() as Bullet;
      if (b) {
        b.fire(this.player.x, this.player.y, angle, bulletSpeed, damage, range, knockback, 99, 'effect_swing', { isMeleeSwing: true });
      }

      // 红色神话：地面火海路径
      if (isMythic) {
        for (let step = 1; step <= 3; step++) {
          const fx = this.player.x + Math.cos(angle) * (step * 50);
          const fy = this.player.y + Math.sin(angle) * (step * 50);
          
          const fireSpot = bulletPool.get() as Bullet;
          if (fireSpot) {
            fireSpot.fire(fx, fy, angle, 0, Math.round(damage * 0.3), 10, 0, 99, 'bullet_wine');
            fireSpot.setTint(0xff3300); // 橘红火焰色
            fireSpot.setData('burnDmg', 20);
            fireSpot.setData('burnDuration', 3.0);
            
            // 2.5秒后渐隐回收
            this.tweens.add({
              targets: fireSpot,
              alpha: 0,
              duration: 2500,
              onComplete: () => {
                fireSpot.deactivate();
                fireSpot.clearTint();
              }
            });
          }
        }
      }
      return;
    }

    // 8. 五雷神扇 (三连发射击与雷电链)
    if (equipped.weaponId === 'fan') {
      const angles = [angle - 0.15, angle, angle + 0.15];
      const pierce = equipped.quality >= WeaponQuality.BLUE ? (equipped.quality === WeaponQuality.PURPLE ? 2 : 2) : 1;
      const finalPierce = isMythic ? 3 : pierce;

      angles.forEach(a => {
        const b = bulletPool.get() as Bullet;
        if (b) {
          b.fire(this.player.x, this.player.y, a, bulletSpeed, damage, range, knockback, finalPierce, 'bullet_fan');
          if (isMythic) {
            b.setData('chainLightningOnHit', true);
          }
        }
      });
      return;
    }
  }

  /**
   * 子弹重合判定逻辑
   */
  private handleBulletHitEnemy(bulletObject: any, enemyObject: any) {
    const bullet = bulletObject as Bullet;
    const enemy = enemyObject as Enemy;

    if (!bullet.active || enemy.hp <= 0) return;

    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
    const hitRes = bullet.onHitEnemy(enemy.x.toString() + enemy.y.toString());
    
    if (hitRes) {
      // 伤害减算
      enemy.takeDamage(hitRes.damage, hitRes.knockback, angle);

      // 屏幕震动与受击顿帧 (Hit Stop)
      const isCrit = hitRes.damage > 0 && hitRes.effects.isSplitOnCrit; // 简易判定是否为暴击（可基于伤害量或传入特效判定）
      if (hitRes.damage > 10) {
        this.cameras.main.shake(100, isCrit ? 0.008 : 0.003);
        
        // 顿帧效果：如果伤害高，暂停怪物的动画和物理速度一瞬间
        if (enemy.body) {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const vx = body.velocity.x;
          const vy = body.velocity.y;
          body.setVelocity(0, 0);
          this.time.delayedCall(isCrit ? 100 : 50, () => {
            if (enemy.active && enemy.hp > 0) {
              body.setVelocity(vx, vy);
            }
          });
        }
      }

      // 吸血触发
      this.player.triggerLifeSteal(hitRes.damage);

      // 连锁闪电触发判定
      const hasReactor = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_38');
      if (hasReactor && Math.random() < 0.25) {
        this.triggerChainLightning(enemy, hitRes.damage);
      }

      // 石制大盾红色神话：对击中的敌人进行 1.5s 眩晕判定
      const weapons = this.weaponSystem.getEquippedWeapons();
      const hasMythicShield = weapons.some(w => w && w.weaponId === 'stone_shield' && w.quality === WeaponQuality.RED);
      if (hasMythicShield && Math.random() < 0.3) {
        enemy.applyStun(1.5);
      }

      // 金算盘红色神话：击中有概率掉落 10 金币的黄金
      const hasMythicAbacus = weapons.some(w => w && w.weaponId === 'gold_abacus' && w.quality === WeaponQuality.RED);
      if (hasMythicAbacus && Math.random() < 0.2) {
        this.handleEnemyDropGoldOnly(enemy.x, enemy.y);
      }

      // 暴击分裂效果判定
      if (hitRes.effects.isSplitOnCrit) {
        this.triggerCritArrowSplit(enemy.x, enemy.y, angle, hitRes.damage);
      }

      // 检查子弹是否携带状态属性 (减速、灼烧、额外连锁闪电)
      const slowPercent = bullet.getData('slowPercent');
      const slowDuration = bullet.getData('slowDuration');
      if (slowPercent !== undefined && slowDuration !== undefined) {
        enemy.applySlow(slowPercent, slowDuration);
      }

      const burnDmg = bullet.getData('burnDmg');
      const burnDuration = bullet.getData('burnDuration');
      if (burnDmg !== undefined && burnDuration !== undefined) {
        enemy.applyBurn(burnDmg, burnDuration);
      }

      const chainLightningOnHit = bullet.getData('chainLightningOnHit');
      if (chainLightningOnHit) {
        this.triggerChainLightning(enemy, hitRes.damage);
      }
    }
  }

  /**
   * 连锁闪电逻辑 (在5个敌人间弹跳)
   */
  private triggerChainLightning(startEnemy: Enemy, dmg: number) {
    let currentTarget = startEnemy;
    const hitSet = new Set<string>([startEnemy.x.toString() + startEnemy.y.toString()]);

    const chainTimer = this.time.addEvent({
      delay: 100,
      repeat: 4, // 弹跳4次，共5个敌人
      callback: () => {
        const next = this.findNearestEnemyExclude(currentTarget.x, currentTarget.y, 250, hitSet);
        if (next) {
          hitSet.add(next.x.toString() + next.y.toString());
          
          const line = this.add.graphics();
          line.lineStyle(2, 0x5cd8ff, 1);
          line.lineBetween(currentTarget.x, currentTarget.y, next.x, next.y);
          this.time.delayedCall(150, () => line.destroy());

          next.takeDamage(dmg * 0.8, 0, 0);
          currentTarget = next;
        } else {
          chainTimer.destroy();
        }
      }
    });
  }

  /**
   * 箭矢暴击向左右分裂
   */
  private triggerCritArrowSplit(x: number, y: number, angle: number, dmg: number) {
    const leftAngle = angle - Math.PI / 2;
    const rightAngle = angle + Math.PI / 2;
    const angles = [leftAngle, rightAngle];

    angles.forEach(a => {
      const b = this.bulletsGroup.get() as Bullet;
      if (b) {
        b.fire(x, y, a, 400, dmg * 0.5, 300, 10, 1, 'bullet_default');
      }
    });
  }

  // =======================================================
  //            怪物生成与 AI 回调事件
  // =======================================================

  private spawnEnemy(enemyId: EnemyId) {
    if (!this.isGameActive) return;

    let sx = 0;
    let sy = 0;

    const isBoss = enemyId === 'taotie' || enemyId === 'dragon';
    if (isBoss) {
      // 计算玩家与大地图中心 (1500, 1500) 的距离
      const distFromCenter = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1500, 1500);
      
      if (distFromCenter <= 3000) {
        // 如果玩家在大地图附近，Boss 生成在 [100, 2900] 的整个大地图内，但必须避开玩家 1200 像素范围
        let tries = 0;
        do {
          sx = Phaser.Math.Between(100, 2900);
          sy = Phaser.Math.Between(100, 2900);
          tries++;
        } while (
          Phaser.Math.Distance.Between(sx, sy, this.player.x, this.player.y) < 1200 &&
          tries < 100
        );

        if (tries >= 100) {
          // 保底：如果在整个地图上尝试了 100 次依然离玩家太近，就以玩家为中心，在 1200 像素外任意方向生成 Boss
          const angle = Math.random() * Math.PI * 2;
          sx = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 1200, 100, 2900);
          sy = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 1200, 100, 2900);
        }
      } else {
        // 如果玩家已经跑到了无限大地图的远方（距离中心 > 3000），Boss 应该生成在玩家当前坐标的外围 (1500 到 2500 像素)
        const angle = Math.random() * Math.PI * 2;
        const distance = Phaser.Math.Between(1500, 2500);
        sx = this.player.x + Math.cos(angle) * distance;
        sy = this.player.y + Math.sin(angle) * distance;
      }
      
      // 发送全局 Toast 提示玩家寻找 Boss
      this.overlayManager.toast('警报：最终 Boss 已在此区域某处显现！请跟随红色箭头搜寻！', '#ff3333');
    } else {
      const cam = this.cameras.main;
      const halfW = cam.width / 2;
      const halfH = cam.height / 2;
      const currentWave = this.waveSystem.currentWaveNum;

      if (currentWave <= 2 && Math.random() < 0.60) {
        // 新手期引怪保底：60% 的概率将小怪直接生成在玩家周围 200~350 像素（屏幕视口边缘内），让玩家能迅速杀怪升级选词条
        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(200, 350);
        sx = this.player.x + Math.cos(angle) * dist;
        sy = this.player.y + Math.sin(angle) * dist;
      } else {
        // 普通小怪动态生成在屏幕视口边缘微外侧，结合玩家当前移动方向偏置刷新
        const margin = 25; // 缩小 margin 至 25 像素，确保生成的怪在 450 像素惊醒范围内，出生后即走向玩家
        let side = Math.floor(Math.random() * 4); // 0:上, 1:下, 2:左, 3:右
        
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body && (body.velocity.x !== 0 || body.velocity.y !== 0)) {
          if (Math.random() < 0.75) {
            const vx = body.velocity.x;
            const vy = body.velocity.y;
            // 根据水平和垂直分量决定主偏向边缘
            if (Math.abs(vx) > Math.abs(vy)) {
              side = vx > 0 ? 3 : 2; // 向右走则刷在右边缘，向左走刷在左边缘
            } else {
              side = vy > 0 ? 1 : 0; // 向下走刷在底边缘，向上走刷在顶边缘
            }
          }
        }

        switch (side) {
          case 0: // 顶边缘（上）
            sx = this.player.x + Phaser.Math.Between(-halfW, halfW);
            sy = cam.scrollY - margin;
            break;
          case 1: // 底边缘（下）
            sx = this.player.x + Phaser.Math.Between(-halfW, halfW);
            sy = cam.scrollY + cam.height + margin;
            break;
          case 2: // 左边缘（左）
            sx = cam.scrollX - margin;
            sy = this.player.y + Phaser.Math.Between(-halfH, halfH);
            break;
          case 3: // 右边缘（右）
            sx = cam.scrollX + cam.width + margin;
            sy = this.player.y + Phaser.Math.Between(-halfH, halfH);
            break;
        }
      }
    }

    // 出生预警红圈特效
    const warningIndicator = this.add.graphics();
    warningIndicator.lineStyle(3, 0xff0000, 0.8);
    warningIndicator.strokeCircle(sx, sy, 30);
    warningIndicator.setDepth(-1);

    this.tweens.add({
      targets: warningIndicator,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        warningIndicator.destroy();
        const enemy = new Enemy(this, sx, sy, enemyId, this.waveSystem.currentWaveNum);
        this.enemiesGroup.add(enemy);
      }
    });
  }

  /**
   * 生成怪物子弹
   */
  private spawnEnemyProjectile(data: { x: number; y: number; angle: number; speed: number; damage: number; type: string }) {
    const bullet = this.physics.add.sprite(data.x, data.y, 'bullet_wine');
    bullet.setTint(0xff3300);
    this.enemyProjectilesGroup.add(bullet);
    
    bullet.body?.setSize(12, 12);
    bullet.setVelocity(Math.cos(data.angle) * data.speed, Math.sin(data.angle) * data.speed);
    
    bullet.setData('damage', data.damage);

    this.time.delayedCall(4000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  /**
   * 玩家直接撞到怪物身上受到接触伤害
   */
  private handlePlayerEnemyCollision(_player: any, _enemy: any) {
    const enemy = _enemy as Enemy;
    if (!enemy.active || enemy.hp <= 0) return;
    
    // 造成基础接触伤害，如果怪物没有伤害(如宝箱)则传入 0
    if (enemy.dmg > 0) {
      this.player.takeDamage(enemy.dmg, '碰撞伤害');
    }
  }

  /**
   * 怪物投掷弹击中玩家
   */
  private handlePlayerHitByProjectile(_player: any, projectile: any) {
    const proj = projectile as Phaser.Physics.Arcade.Sprite;
    if (!proj.active) return;
    
    const dmg = proj.getData('damage') || 5;
    this.player.takeDamage(dmg, '怪物子弹');
    proj.destroy();
  }

  /**
   * 怪物被玩家反弹/闪避反震伤害
   */
  private handlePlayerReflectDmg(data: { damage: number; sourcePos: { x: number; y: number } }) {
    const target = this.findNearestEnemy(data.sourcePos.x, data.sourcePos.y, 200);
    if (target) {
      const blast = this.add.graphics();
      blast.lineStyle(3, 0xff5555, 0.8);
      blast.strokeCircle(this.player.x, this.player.y, 40);
      this.time.delayedCall(200, () => blast.destroy());

      target.takeDamage(data.damage, 15, Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y));
    }
  }

  /**
   * 还魂丹九转复活的击退震荡波
   */
  private handlePlayerRebornWave(data: { x: number; y: number }) {
    const shockCircle = this.add.graphics();
    shockCircle.lineStyle(6, 0xffd700, 1);
    
    this.tweens.add({
      targets: shockCircle,
      alpha: 0,
      scaleX: 6,
      scaleY: 6,
      duration: 500,
      onUpdate: (tween, _target) => {
        shockCircle.clear();
        shockCircle.lineStyle(6, 0xffd700, 1 - tween.progress);
        shockCircle.strokeCircle(data.x, data.y, 50 * (1 + tween.progress * 5));
      },
      onComplete: () => {
        shockCircle.destroy();
      }
    });

    this.enemiesGroup.getChildren().forEach(child => {
      const enemy = child as any as Enemy;
      const dist = Phaser.Math.Distance.Between(data.x, data.y, enemy.x, enemy.y);
      if (dist < 400) {
        const angle = Phaser.Math.Angle.Between(data.x, data.y, enemy.x, enemy.y);
        enemy.takeDamage(10, 80, angle);
      }
    });
  }

  // =======================================================
  //            掉落物与磁吸拾取系统
  // =======================================================

  /**
   * 怪物死亡后掉落经验宝石或金币
   */
  private handleEnemyDropReward(data: { x: number; y: number; enemyId: EnemyId; isElite: boolean }) {
    this.totalKills++;
    
    const hasMidas = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_39');
    const isMidasRoll = hasMidas && Math.random() < 0.05;

    if (data.isElite) {
      const chest = this.physics.add.sprite(data.x, data.y, 'collectable_chest');
      this.collectablesGroup.add(chest);
      chest.setData('type', 'chest');
      return;
    }

    const roll = Math.random();
    
    if (isMidasRoll || roll < 0.15) {
      const coin = this.physics.add.sprite(data.x, data.y, 'collectable_gold');
      this.collectablesGroup.add(coin);
      coin.setData('type', 'gold');
      coin.setData('value', isMidasRoll ? 10 : 1);
    } else {
      const gem = this.physics.add.sprite(data.x, data.y, 'collectable_xp');
      this.collectablesGroup.add(gem);
      gem.setData('type', 'xp');
      gem.setData('value', 1);
    }
  }

  private handleEnemyDropGoldOnly(x: number, y: number) {
    const coin = this.physics.add.sprite(x, y, 'collectable_gold');
    this.collectablesGroup.add(coin);
    coin.setData('type', 'gold');
    coin.setData('value', 1);
  }

  private tickCollectablesMagnet() {
    const hasBambooRat = this.player.attributeSystem.getAllModifiers().some(mod => mod.id.startsWith('item_46'));
    const pullRange = hasBambooRat ? 350 : 150;
    const attrs = this.player.getAttributes();

    this.collectablesGroup.getChildren().forEach(child => {
      const reward = child as any as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, reward.x, reward.y);

      if (dist <= pullRange) {
        const angle = Phaser.Math.Angle.Between(reward.x, reward.y, this.player.x, this.player.y);
        const speed = 400 * (1 + (attrs.speed / 100));
        (reward.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });
  }

  private handlePlayerCollectReward(_player: any, collectable: any) {
    const item = collectable as Phaser.Physics.Arcade.Sprite;
    if (!item.active) return;

    const type = item.getData('type');
    const val = item.getData('value') || 1;

    if (type === 'xp') {
      this.player.addXp(val);
    } else if (type === 'gold') {
      this.player.addGold(val);
      this.totalGoldCollected += val;
    } else if (type === 'chest') {
      const currentChests = this.registry.get('chests_earned') || 0;
      this.registry.set('chests_earned', currentChests + 1);
      this.overlayManager.toast('获得精英宝箱！波次结束自动开启');
    } else if (type === 'heal') {
      this.player.heal(val);
    }

    item.destroy();
  }

  // =======================================================
  //            萌宠系统特技与召唤 (Pets)
  // =======================================================

  private spawnPet(petId: PetId) {
    if (this.activePets.some(p => p.petId === petId)) {
      return;
    }
    const pet = new Pet(this, this.player, petId);
    this.activePets.push(pet);
    this.petsGroup.add(pet);
  }

  private handlePetShootFirefly(data: { x: number; y: number; damage: number }) {
    const target = this.findNearestEnemy(data.x, data.y, 400);
    if (target) {
      const b = this.bulletsGroup.get() as Bullet;
      if (b) {
        const angle = Phaser.Math.Angle.Between(data.x, data.y, target.x, target.y);
        b.fire(data.x, data.y, angle, 400, data.damage, 400, 5, 1, 'bullet_firefly');
      }
    }
  }

  private handlePetSpawnGold(data: { x: number; y: number; count: number }) {
    for (let i = 0; i < data.count; i++) {
      const ox = data.x + Phaser.Math.Between(-15, 15);
      const oy = data.y + Phaser.Math.Between(-15, 15);
      const coin = this.physics.add.sprite(ox, oy, 'collectable_gold');
      this.collectablesGroup.add(coin);
      coin.setData('type', 'gold');
      coin.setData('value', 1);
    }
  }

  private handlePetShootSpider(data: { x: number; y: number; damage: number }) {
    const target = this.findNearestEnemy(data.x, data.y, 400);
    if (target) {
      const b = this.bulletsGroup.get() as Bullet;
      if (b) {
        const angle = Phaser.Math.Angle.Between(data.x, data.y, target.x, target.y);
        b.fire(data.x, data.y, angle, 400, data.damage, 400, 10, 1, 'bullet_web');
        b.setData('slowPercent', 40);
        b.setData('slowDuration', 2.0);
      }
    }
  }

  private handlePetSpawnHeal(data: { x: number; y: number; healVal: number }) {
    const shoot = this.physics.add.sprite(data.x, data.y, 'collectable_bamboo_shoot');
    this.collectablesGroup.add(shoot);
    shoot.setData('type', 'heal');
    shoot.setData('value', data.healVal);
  }

  private handlePetShootFox(data: { x: number; y: number; damage: number }) {
    const enemiesInRange: Enemy[] = [];
    this.enemiesGroup.getChildren().forEach(child => {
      const enemy = child as any as Enemy;
      if (enemy.hp > 0 && Phaser.Math.Distance.Between(data.x, data.y, enemy.x, enemy.y) <= 500) {
        enemiesInRange.push(enemy);
      }
    });
    const target = enemiesInRange.length > 0 ? Phaser.Utils.Array.GetRandom(enemiesInRange) : null;
    if (target) {
      const b = this.bulletsGroup.get() as Bullet;
      if (b) {
        const angle = Phaser.Math.Angle.Between(data.x, data.y, target.x, target.y);
        b.fire(data.x, data.y, angle, 400, data.damage, 500, 10, 1, 'bullet_foxfire');
        b.setData('burnDmg', 10);
        b.setData('burnDuration', 3.0);
      }
    }
  }

  // =======================================================
  //            工程学与防御塔系统 (Summons)
  // =======================================================

  private spawnPlayerTurret(data: { x: number; y: number }) {
    const turret = this.physics.add.sprite(data.x, data.y, 'summons_turret');
    this.summonsGroup.add(turret);

    turret.body?.setImmovable(true);
    turret.setData('fireCooldown', 0.5);
  }

  private tickSummonedTurrets(dt: number) {
    const engineering = this.player.attributeSystem.get('engineering');
    const hasBattery = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_21');
    const batteryASBonus = hasBattery ? 1.2 : 1.0;

    this.summonsGroup.getChildren().forEach(child => {
      const turret = child as any as Phaser.Physics.Arcade.Sprite;
      let cooldown = turret.getData('fireCooldown') || 0.5;

      cooldown -= dt;
      if (cooldown <= 0) {
        turret.setData('fireCooldown', 0.5 / batteryASBonus);

        const target = this.findNearestEnemy(turret.x, turret.y, 300);
        if (target) {
          const angle = Phaser.Math.Angle.Between(turret.x, turret.y, target.x, target.y);
          const turretDmg = Math.round(5 + engineering);
          
          const bullet = this.bulletsGroup.get() as Bullet;
          if (bullet) {
            const pierce = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_29') ? 2 : 1;
            bullet.fire(turret.x, turret.y, angle, 400, turretDmg, 300, 10, pierce, 'bullet_default');
          }
        }
      } else {
        turret.setData('fireCooldown', cooldown);
      }
    });
  }

  // =======================================================
  //            地图机关环境 Tick (Map Hazards)
  // =======================================================

  private mapHazardTimer: number = 0;

  private tickMapHazards(dt: number) {
    const wave = this.waveSystem.currentWaveNum;
    this.mapHazardTimer += dt;

    if (wave >= 6 && wave <= 15) {
      if (this.mapHazardTimer >= 20.0) {
        this.mapHazardTimer = 0;
        this.triggerLavaGeyser();
      }
    }
  }

  private triggerLavaGeyser() {
    const rx = this.player.x + Phaser.Math.Between(-200, 200);
    const ry = this.player.y + Phaser.Math.Between(-200, 200);

    const warnCircle = this.add.graphics();
    warnCircle.lineStyle(2, 0xff3300, 1);
    warnCircle.strokeCircle(rx, ry, 50);

    this.time.delayedCall(1500, () => {
      warnCircle.destroy();
      
      const geyserVisual = this.add.graphics();
      geyserVisual.fillStyle(0xff7700, 0.8);
      geyserVisual.fillCircle(rx, ry, 50);

      this.time.addEvent({
        delay: 500,
        repeat: 3,
        callback: () => {
          const playerDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, rx, ry);
          if (playerDist <= 50) {
            this.player.takeDamage(20, '火山熔岩');
          }

          this.enemiesGroup.getChildren().forEach(child => {
            const enemy = child as any as Enemy;
            const enemyDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, rx, ry);
            if (enemyDist <= 50) {
              enemy.takeDamage(50, 0, 0);
            }
          });
        }
      });

      this.time.delayedCall(2000, () => {
        geyserVisual.destroy();
      });
    });
  }

  // =======================================================
  //            波次完成与商店集市
  // =======================================================

  private handleWaveComplete() {
    this.physics.pause();
    this.isGameActive = false;

    this.enemiesGroup.clear(true, true);
    this.enemyProjectilesGroup.clear(true, true);
    this.bulletsGroup.clear(true, true);

    const isWealth = this.player.characterId === 'wealth_panda';
    const settlement = this.waveSystem.calculateWaveSettlement(
      this.player.gold,
      this.player.attributeSystem.get('harvest'),
      isWealth
    );

    this.player.addGold(settlement.goldIncome);
    this.player.addXp(settlement.xpIncome);

    const currentHarvest = this.player.attributeSystem.get('harvest');
    if (currentHarvest > 0) {
      this.player.attributeSystem.addModifier({
        id: 'harvest_natural_grow',
        attribute: 'harvest',
        addVal: Math.round(currentHarvest * 0.1),
        mulVal: 0
      });
    }

    let chests = this.registry.get('chests_earned') || 0;
    while (chests > 0) {
      chests--;
      const bonusItem = ItemSystem.getRandomShopItems(1, this.waveSystem.currentWaveNum, 999)[0];
      if (bonusItem) {
        this.applyItemModifiers(bonusItem);
        this.overlayManager.toast(`宝箱开启：获得 [${bonusItem.name}]`);
      }
    }
    this.registry.set('chests_earned', 0);

    this.rerollShopMarket();
    this.openShopScreen();
  }

  private rerollShopMarket() {
    const wave = this.waveSystem.currentWaveNum;
    const rerollCount = this.registry.get('reroll_count') || 0;
    const hasAbacusItem = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_20');
    const discount = hasAbacusItem ? 2 : 0;
    
    const baseReroll = 1 + Math.floor(wave / 2) + rerollCount;
    const finalRerollCost = Math.max(1, baseReroll - discount);

    if (rerollCount > 0 && this.player.gold < finalRerollCost) {
      this.overlayManager.toast('竹金币不足以刷新商店！');
      return;
    }

    if (rerollCount > 0) {
      this.player.gold -= finalRerollCost;
    }

    this.registry.set('reroll_count', rerollCount + 1);

    const luck = this.player.attributeSystem.get('luck');
    const items = ItemSystem.getRandomShopItems(3, wave, luck);
    const weaponsList: WeaponId[] = ['bamboo_stick', 'bamboo_bow', 'gold_abacus', 'stone_shield', 'wine_pot', 'wrench'];
    const randomWpn = weaponsList[Math.floor(Math.random() * weaponsList.length)];
    
    let quality = WeaponQuality.WHITE;
    const wpnRoll = Math.random() * 100;
    if (wave > 10 && wpnRoll < 30) quality = WeaponQuality.BLUE;
    else if (wave > 5 && wpnRoll < 50) quality = WeaponQuality.GREEN;

    const basePriceMap = {
      [WeaponQuality.WHITE]: 15,
      [WeaponQuality.GREEN]: 30,
      [WeaponQuality.BLUE]: 60,
      [WeaponQuality.PURPLE]: 120,
      [WeaponQuality.RED]: 240
    };

    this.shopMarketItems = [
      ...items,
      {
        id: randomWpn,
        name: `${WEAPON_DATABASE[randomWpn].name}`,
        quality: quality,
        price: ItemSystem.calculatePrice(basePriceMap[quality], luck),
        isWeapon: true
      }
    ];

    this.openShopScreen();
  }

  private openShopScreen() {
    const wave = this.waveSystem.currentWaveNum;
    const rerollCount = this.registry.get('reroll_count') || 0;
    const hasAbacusItem = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_20');
    const discount = hasAbacusItem ? 2 : 0;
    const baseReroll = 1 + Math.floor(wave / 2) + rerollCount;
    const nextRerollCost = Math.max(1, baseReroll - discount);

    const purchased = this.player.attributeSystem.getAllModifiers()
      .filter(mod => mod.id.startsWith('item_'))
      .map(mod => {
        const itemId = parseInt(mod.id.split('_')[1]);
        const dbItem = ITEM_DATABASE.find(item => item.id === itemId);
        return {
          name: dbItem?.name || mod.id,
          quality: dbItem?.quality || 'white'
        };
      });

    this.overlayManager.updateShop({
      wave: wave,
      gold: this.player.gold,
      rerollCost: nextRerollCost,
      harvestIncome: Math.round(this.player.attributeSystem.get('harvest')),
      marketItems: this.shopMarketItems,
      equippedWeapons: this.weaponSystem.getEquippedWeapons(),
      purchasedItems: purchased
    });

    this.overlayManager.showScreen('shop-screen');
  }

  private buyWeaponFromShop(weaponId: WeaponId, cost: number) {
    if (this.player.gold < cost) {
      this.overlayManager.toast('竹子金币不足！');
      return;
    }

    const hasYiJinJing = this.player.attributeSystem.getAllModifiers().some(mod => mod.id === 'item_36');
    if (hasYiJinJing && !WEAPON_DATABASE[weaponId].isMelee) {
      this.overlayManager.toast('拥有【传世武籍・易筋经】，无法装备远程武器！', '#ff4646');
      return;
    }

    const index = this.shopMarketItems.findIndex(good => good.isWeapon && good.id === weaponId && good.price === cost);
    if (index === -1) return;

    const isEquipped = this.weaponSystem.addWeaponAuto(weaponId, this.shopMarketItems[index].quality);
    if (!isEquipped) {
      this.overlayManager.toast('6格武器槽已满！拖拽融合以空出格子');
      return;
    }

    this.player.gold -= cost;
    this.shopMarketItems.splice(index, 1);
    this.overlayManager.toast(`购买成功：${WEAPON_DATABASE[weaponId].name}`);

    this.updatePlayerWeaponModifiers();
    this.openShopScreen();
  }

  private buyItemFromShop(item: ItemConfig) {
    const finalPrice = ItemSystem.calculatePrice(item.price, this.player.attributeSystem.get('luck'));

    if (this.player.gold < finalPrice) {
      this.overlayManager.toast('竹子金币不足！');
      return;
    }

    const index = this.shopMarketItems.findIndex(good => !good.isWeapon && good.id === item.id);
    if (index === -1) return;

    this.player.gold -= finalPrice;
    this.shopMarketItems.splice(index, 1);

    this.applyItemModifiers(item);
    this.overlayManager.toast(`获得道具：${item.name}`);

    this.openShopScreen();
  }

  private applyItemModifiers(item: ItemConfig) {
    const modPrefix = `item_${item.id}`;

    for (const attrKey in item.modifiers) {
      const field = attrKey as keyof PlayerAttributes;
      const data = (item.modifiers as any)[field];
      if (data) {
        this.player.attributeSystem.addModifier({
          id: `${modPrefix}_${String(field)}`,
          attribute: field,
          addVal: data.add || 0,
          mulVal: data.mul || 0
        });
      }
    }

    if (item.id === 36) {
      const weapons = this.weaponSystem.getEquippedWeapons();
      weapons.forEach((w, slot) => {
        if (w && !WEAPON_DATABASE[w.weaponId].isMelee) {
          this.weaponSystem.unequipWeapon(slot);
          this.player.addGold(10);
        }
      });
      this.overlayManager.toast('易筋经生效：卸下全部远程武器！', '#ff4646');
    }

    if (item.id >= 46 && item.id <= 51) {
      this.spawnPet(item.id as PetId);
    }

    this.syncHUD();
  }

  private mergeShopWeapons(from: number, to: number) {
    const isMerged = this.weaponSystem.tryMerge(from, to);
    if (isMerged) {
      this.overlayManager.toast('融合升阶成功！', '#ffd700');
    } else {
      this.overlayManager.toast('武器位置交换');
    }

    this.updatePlayerWeaponModifiers();
    this.openShopScreen();
  }

  private updatePlayerWeaponModifiers() {
    // 1. 更新石制大盾被动护甲
    this.player.attributeSystem.removeModifiersByPrefix('weapon_shield_passive');
    const extraArmor = this.weaponSystem.getPassiveAttributeModifiers().armor;
    if (extraArmor > 0) {
      this.player.attributeSystem.addModifier({
        id: 'weapon_shield_passive_armor',
        attribute: 'armor',
        addVal: extraArmor,
        mulVal: 0
      });
    }

    // 2. 更新武器羁绊属性
    const activeSynergies = this.weaponSystem.getActiveSynergies();
    this.player.applySynergyModifiers(activeSynergies);

    this.syncHUD();
  }

  private startNextWave() {
    const nextWave = this.waveSystem.currentWaveNum + 1;
    
    if (nextWave > 20) {
      this.handleGameOver(true);
      return;
    }

    this.registry.set('reroll_count', 0);
    this.adjustMapVisuals(nextWave);

    const maxHp = this.player.getMaxHp();
    this.player.heal(Math.round(maxHp * 0.2));

    this.waveSystem.startWave(nextWave);
    this.isGameActive = true;
    this.physics.resume();

    this.overlayManager.showScreen('hud-screen');
  }

  // =======================================================
  //            升级弹窗与加成注入
  // =======================================================

  private activeLevelupOptions: any[] = [];

  private handlePlayerLevelUp() {
    this.physics.pause();
    this.isGameActive = false;

    // 播放升级特效 (effect_level_up)
    const lvlUpEffect = this.add.sprite(this.player.x, this.player.y, 'effect_level_up');
    lvlUpEffect.setOrigin(0.5, 0.5);
    lvlUpEffect.setDepth(this.player.depth - 1);
    lvlUpEffect.setScale(1.5);
    this.tweens.add({
      targets: lvlUpEffect,
      alpha: { from: 1, to: 0 },
      y: this.player.y - 120,
      duration: 1000,
      onComplete: () => {
        lvlUpEffect.destroy();
      }
    });

    const luck = this.player.attributeSystem.get('luck');
    const options: any[] = [];
    const fields: (keyof PlayerAttributes)[] = [
      'hpMax', 'hpRegen', 'lifeSteal', 'damageModifier', 'meleeDmg', 'rangedDmg',
      'engineering', 'attackSpeed', 'critChance', 'speed', 'range', 'armor', 'dodge', 'luck', 'harvest', 'xpGainModifier'
    ];

    for (let i = 0; i < 4; i++) {
      const attr = fields[Math.floor(Math.random() * fields.length)];
      const roll = Math.random() * 100 + (luck * 0.2);
      let quality = 1;
      if (roll > 105) quality = 4;
      else if (roll > 85) quality = 3;
      else if (roll > 55) quality = 2;

      let addVal = 0;
      let mulVal = 0;

      const scale = [0, 1.0, 2.0, 3.5, 5.0][quality];

      switch (attr) {
        case 'hpMax': addVal = 3 * scale; break;
        case 'hpRegen': addVal = 2 * scale; break;
        case 'lifeSteal': addVal = 2 * scale; break;
        case 'damageModifier': addVal = 5 * scale; break;
        case 'meleeDmg': addVal = 1 * scale; break;
        case 'rangedDmg': addVal = 1 * scale; break;
        case 'engineering': addVal = 4 * scale; break;
        case 'attackSpeed': addVal = 3 * scale; break;
        case 'critChance': addVal = 2 * scale; break;
        case 'speed': addVal = 2 * scale; break;
        case 'range': addVal = 15 * scale; break;
        case 'armor': addVal = 1 * scale; break;
        case 'dodge': addVal = 2 * scale; break;
        case 'luck': addVal = 3 * scale; break;
        case 'harvest': addVal = 5 * scale; break;
        case 'xpGainModifier': addVal = 4 * scale; break;
      }

      options.push({ attribute: attr, addVal: Math.round(addVal), mulVal, quality });
    }

    this.activeLevelupOptions = options;
    this.overlayManager.showLevelUpScreen(options);
  }

  private applyLevelUpUpgrade(idx: number) {
    const opt = this.activeLevelupOptions[idx];
    if (!opt) return;

    const modId = `levelup_lvl_${this.player.level - 1}_${opt.attribute}`;
    
    this.player.attributeSystem.addModifier({
      id: modId,
      attribute: opt.attribute,
      addVal: opt.addVal,
      mulVal: opt.mulVal
    });

    this.overlayManager.toast(`属性提升：${opt.attribute} +${opt.addVal}`);

    this.isGameActive = true;
    this.physics.resume();
    this.overlayManager.showScreen('hud-screen');
  }

  // =======================================================
  //            死亡结算与复活广告模拟
  // =======================================================

  private handlePlayerDie() {
    this.physics.pause();
    this.isGameActive = false;

    const canRevive = !this.isReviveUsed;
    this.handleGameOver(false, canRevive);
  }

  private handleGameOver(isWin: boolean, canRevive: boolean = false) {
    this.overlayManager.showGameOverScreen({
      isWin,
      wave: this.waveSystem.currentWaveNum,
      timeSurvived: this.totalTimeElapsed,
      kills: this.totalKills,
      goldEarned: this.totalGoldCollected,
      canRevive: canRevive
    });
  }

  private watchAdRevive() {
    this.overlayManager.toast('获取复活中...');
    
    setTimeout(() => {
      this.isReviveUsed = true;
      this.player.hp = Math.round(this.player.getMaxHp() * 0.5);
      this.player.triggerInvulnerability(3.0);

      this.isGameActive = true;
      this.physics.resume();
      this.overlayManager.showScreen('hud-screen');
      this.overlayManager.toast('复活成功！');
    }, 800);
  }

  private watchAdDoubleCoins() {
    this.overlayManager.toast('金币翻倍中...');
    setTimeout(() => {
      this.totalGoldCollected *= 2;
      this.overlayManager.toast('双倍金币结算完成！');
      document.getElementById('double-coins-btn')?.setAttribute('disabled', 'true');
      
      const coinsNode = document.getElementById('stat-coins');
      if (coinsNode) coinsNode.innerText = this.totalGoldCollected.toString();
    }, 800);
  }

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

  private restartGame() {
    this.overlayManager.showScreen('menu-screen');
  }

  // =======================================================
  //            辅助查找距离怪物算法
  // =======================================================

  private findNearestEnemy(sx: number, sy: number, maxRange: number): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = maxRange;

    this.enemiesGroup.getChildren().forEach(child => {
      const enemy = child as any as Enemy;
      if (enemy.hp <= 0) return;

      const dist = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private findNearestEnemyExclude(sx: number, sy: number, maxRange: number, excludeKeys: Set<string>): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = maxRange;

    this.enemiesGroup.getChildren().forEach(child => {
      const enemy = child as any as Enemy;
      if (enemy.hp <= 0) return;

      const key = enemy.x.toString() + enemy.y.toString();
      if (excludeKeys.has(key)) return;

      const dist = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private syncHUD() {
    if (!this.player) return;
    
    let timerText = '决战波';
    const config = this.waveSystem.getWaveConfig(this.waveSystem.currentWaveNum);
    if (config.duration !== -1) {
      timerText = `${Math.ceil(this.waveSystem.waveTimeRemaining)}s`;
    }

    const xpPercent = (this.player.xp / this.player.getRequiredXp()) * 100;

    this.overlayManager.updateHUD({
      level: this.player.level,
      xpPercent,
      xp: this.player.xp,
      requiredXp: this.player.getRequiredXp(),
      timerText,
      waveText: `WAVE ${this.waveSystem.currentWaveNum}`,
      gold: this.player.gold,
      hp: this.player.hp,
      maxHp: this.player.getMaxHp(),
      shield: this.player.shield,
      attributes: this.player.getAttributes(),
      weapons: this.weaponSystem.getEquippedWeapons()
    });
  }

  /**
   * 旋转定位与更新熊猫挂接的武器视觉效果
   */
  private updateWeaponVisuals(dt: number) {
    if (!this.player || !this.player.active || !this.isGameActive) {
      this.weaponVisuals.forEach(s => { if (s) s.setVisible(false); });
      return;
    }

    const equipped = this.weaponSystem.getEquippedWeapons();
    
    // 统计目前已装备的武器数量
    let activeCount = 0;
    equipped.forEach(w => { if (w) activeCount++; });

    if (activeCount === 0) {
      this.weaponVisuals.forEach(s => { if (s) s.destroy(); });
      this.weaponVisuals = [];
      return;
    }

    // 自动环绕旋转角增量
    this.weaponOrbitAngle = (this.weaponOrbitAngle || 0) + dt * 1.5;

    let index = 0;
    const radius = 38; // 离熊猫中心的环绕半径

    equipped.forEach((w, slot) => {
      let sprite = this.weaponVisuals[slot];
      if (!w) {
        if (sprite) {
          sprite.destroy();
          this.weaponVisuals[slot] = undefined;
        }
        return;
      }

      const weaponKeys: Record<WeaponId, string> = {
        bamboo_stick: 'stick',
        bamboo_bow: 'bow',
        gold_abacus: 'abacus',
        stone_shield: 'shield',
        wine_pot: 'pot',
        wrench: 'wrench',
        spear: 'spear',
        fan: 'fan'
      };
      const key = `weapon_${weaponKeys[w.weaponId]}`;

      // 若未创建或贴图改变，则重建
      if (!sprite || sprite.texture.key !== key) {
        if (sprite) sprite.destroy();
        sprite = this.add.sprite(this.player.x, this.player.y, key);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(this.player.depth + 1);
        this.weaponVisuals[slot] = sprite;
      }

      sprite.setVisible(true);

      // 如果未在播放攻击缓动动画，则自动计算环绕位置
      if (!sprite.getData('isTweening')) {
        const angleOffset = (index * (Math.PI * 2 / activeCount)) + this.weaponOrbitAngle;
        const tx = this.player.x + Math.cos(angleOffset) * radius;
        const ty = this.player.y + Math.sin(angleOffset) * radius;

        sprite.x = tx;
        sprite.y = ty;
        sprite.rotation = angleOffset + Math.PI / 2; // 指向环绕外侧
        sprite.setScale(0.6);
      }

      index++;
    });
  }

  /**
   * 依据玩家位置动态生成和清理地表装饰物（草丛、花朵、碎石等）
   */
  private updateDecorators() {
    if (!this.player) return;

    const cellSize = 300;
    const playerCol = Math.floor(this.player.x / cellSize);
    const playerRow = Math.floor(this.player.y / cellSize);

    // 如果玩家所在的格子未改变，且已经有装饰物，则无需每帧计算
    if (playerCol === this.lastPlayerCellCol && playerRow === this.lastPlayerCellRow) {
      return;
    }

    this.lastPlayerCellCol = playerCol;
    this.lastPlayerCellRow = playerRow;

    // 我们保持玩家周围 7x7 的格子有地表装饰物 (视角半径为3格)
    const viewRadius = 3;
    const activeKeys = new Set<string>();

    for (let col = playerCol - viewRadius; col <= playerCol + viewRadius; col++) {
      for (let row = playerRow - viewRadius; row <= playerRow + viewRadius; row++) {
        const key = `${col},${row}`;
        activeKeys.add(key);

        if (!this.activeDecorators.has(key)) {
          this.spawnDecoratorsForCell(col, row, cellSize);
        }
      }
    }

    // 清理离开视口太远的区块装饰物
    for (const [key, sprites] of this.activeDecorators.entries()) {
      if (!activeKeys.has(key)) {
        sprites.forEach(s => s.destroy());
        this.activeDecorators.delete(key);
      }
    }
  }

  /**
   * 采用确定性伪随机算法，在指定区块里生成地表装饰物
   */
  private spawnDecoratorsForCell(col: number, row: number, cellSize: number) {
    // 确定性随机数种子生成器 (保证跑回头路时草木位置一模一样)
    const seed = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
    let randCount = 0;
    const rand = () => {
      const x = Math.sin(seed + randCount++) * 10000;
      return x - Math.floor(x);
    };

    const sprites: Phaser.GameObjects.Sprite[] = [];
    const wave = this.waveSystem.currentWaveNum;
    
    // 依据当前的波次与地图类型，选择匹配的地貌树木花草
    let decorTypes: string[] = [];
    if (wave >= 1 && wave <= 5) {
      decorTypes = ['decor_grass_1', 'decor_grass_2', 'decor_flower_1', 'decor_flower_2', 'decor_stone', 'decor_bamboo'];
    } else if (wave >= 6 && wave <= 15) {
      decorTypes = ['decor_stone', 'decor_lava_crack'];
    } else {
      decorTypes = ['decor_cloud', 'decor_stone'];
    }

    // 每个格子区块随机生成 1 到 3 个装饰物
    const count = Math.floor(rand() * 3) + 1; 
    for (let i = 0; i < count; i++) {
      const type = decorTypes[Math.floor(rand() * decorTypes.length)];
      if (!type) continue;

      // 区块内的随机偏移量
      const offsetX = rand() * cellSize;
      const offsetY = rand() * cellSize;

      const x = col * cellSize + offsetX;
      const y = row * cellSize + offsetY;

      // 3% 概率将花草替换为可破坏的宝箱
      if (rand() < 0.03) {
        const chest = new Enemy(this, x, y, 'chest', wave);
        this.enemiesGroup.add(chest);
        continue;
      }

      // 实例化装饰精灵
      const sprite = this.add.sprite(x, y, type);
      sprite.setDepth(-9); // 位于底图之上，玩家/怪物之下
      sprite.setAlpha(0.85);
      
      // 随机缩放与翻转
      const scale = 0.75 + rand() * 0.45;
      sprite.setScale(scale);
      if (rand() < 0.5) {
        sprite.setFlipX(true);
      }

      // 给花草植物注入微风摇曳的缓动动画 (Tween)
      if (type.includes('grass') || type.includes('flower') || type.includes('bamboo')) {
        const swayAngle = 2 + rand() * 5;
        this.tweens.add({
          targets: sprite,
          angle: swayAngle,
          duration: 1000 + rand() * 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      sprites.push(sprite);
    }

    this.activeDecorators.set(`${col},${row}`, sprites);
  }

  /**
   * 刷新屏幕外 Boss 的指示方向
   */
  private updateBossIndicator() {
    if (!this.bossIndicator) return;
    this.bossIndicator.clear();

    if (!this.player || !this.isGameActive) return;

    // 寻找当前波次中的活跃 Boss
    let activeBoss: Enemy | null = null;
    for (const child of this.enemiesGroup.getChildren()) {
      const enemy = child as Enemy;
      if (enemy.hp > 0 && (enemy.enemyId === 'taotie' || enemy.enemyId === 'dragon' || enemy.enemyId === 'gorilla' || enemy.enemyId === 'centipede')) {
        activeBoss = enemy;
        break;
      }
    }

    if (!activeBoss) return;

    const cam = this.cameras.main;
    // 判断 Boss 是否处于相机视口外
    if (cam.worldView.contains(activeBoss.x, activeBoss.y)) {
      return; // 已经在视野内，无需绘制箭头
    }

    // 计算玩家到 Boss 的夹角
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, activeBoss.x, activeBoss.y);

    // 投射计算箭头在屏幕边界的交点
    const padding = 35;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    const maxH = cam.width / 2 - padding;
    const maxV = cam.height / 2 - padding;

    // 射线法确定屏幕截点坐标
    const scale = Math.min(Math.abs(maxH / dx), Math.abs(maxV / dy));
    const ix = centerX + dx * scale;
    const iy = centerY + dy * scale;

    // 绘制指示三角箭头与白色描边
    this.bossIndicator.fillStyle(0xff2222, 0.85);
    this.bossIndicator.lineStyle(2.5, 0xffffff, 1);

    this.bossIndicator.beginPath();
    const size = 13;
    const p1x = ix + Math.cos(angle) * size * 1.3;
    const p1y = iy + Math.sin(angle) * size * 1.3;
    const p2x = ix + Math.cos(angle + Math.PI * 0.8) * size;
    const p2y = iy + Math.sin(angle + Math.PI * 0.8) * size;
    const p3x = ix + Math.cos(angle - Math.PI * 0.8) * size;
    const p3y = iy + Math.sin(angle - Math.PI * 0.8) * size;

    this.bossIndicator.moveTo(p1x, p1y);
    this.bossIndicator.lineTo(p2x, p2y);
    this.bossIndicator.lineTo(p3x, p3y);
    this.bossIndicator.closePath();
    this.bossIndicator.fillPath();
    this.bossIndicator.strokePath();

    // 绘制红色圆圈脉冲光晕，增强危机感
    const pulseRadius = 6 + Math.abs(Math.sin(this.totalTimeElapsed * 8)) * 4;
    this.bossIndicator.lineStyle(1.5, 0xff3333, 0.6);
    this.bossIndicator.strokeCircle(ix, iy, pulseRadius);
  }
}
