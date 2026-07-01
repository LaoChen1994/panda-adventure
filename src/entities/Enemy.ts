import Phaser from 'phaser';
import { EnemyId } from '../types';

/**
 * 怪物及 BOSS 实体基类
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyId: EnemyId;
  public hp: number = 10;
  public maxHp: number = 10;
  public dmg: number = 5;
  public baseSpeed: number = 80;

  // 出生位置坐标，便于大地图区域绕圈定位
  public spawnX: number = 0;
  public spawnY: number = 0;

  // Boss 是否已被惊醒
  public isBossAwakened: boolean = false;

  // 怪物是否已被唤醒仇恨
  public isAggroed: boolean = false;

  protected isKnockbackImmune: boolean = false;
  protected targetPlayer: any = null;

  // 简单有限状态机
  public enemyState: 'CHASE' | 'PREPARE' | 'ATTACK' | 'STUN' | 'DEAD' = 'CHASE';
  protected stateTimer: number = 0;
  protected skillCooldownTimer: number = 0;

  // 冲锋物理方向记录
  protected chargeDirX: number = 0;
  protected chargeDirY: number = 0;

  // 隐身计时器 (刺客猿)
  protected stealthTimer: number = 0;

  // 阶段标记 (BOSS使用)
  protected currentPhase: number = 1;

  // 动画及缩放相关
  protected animTime: number = Math.random() * 100;
  protected baseScaleVal: number = 1.0;

  // 状态效果属性 (减速与灼烧)
  private slowTimer: number = 0;
  private slowMultiplier: number = 1.0;
  private burnTimer: number = 0;
  private burnDamage: number = 0;
  private burnTickTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyId: EnemyId, wave: number) {
    // 默认使用对应的色块纹理
    super(scene, x, y, `enemy_${enemyId}`);
    this.enemyId = enemyId;
    this.targetPlayer = (scene as any).player;
    this.spawnX = x;
    this.spawnY = y;

    // 根据波次强度进行指数混合成长
    const scaleFactor = 1 + (wave * 0.15) + (Math.pow(wave, 1.8) * 0.02);
    
    this.initStats(scaleFactor);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);

    // 根据类型设置碰撞包大小
    this.adjustCollisionBox();

    // 记录初始缩放大小，便于后续执行相对缩放的卡通动画
    this.baseScaleVal = this.scaleX;
  }

  /**
   * 初始化三维数值
   */
  private initStats(scale: number) {
    let baseHp = 15;
    let baseDmg = 3;
    let baseSpd = 80;

    switch (this.enemyId) {
      case 'caterpillar':
        baseHp = 15; baseDmg = 3; baseSpd = 80;
        break;
      case 'rabbit':
        baseHp = 35; baseDmg = 5; baseSpd = 140;
        break;
      case 'flower':
        baseHp = 80; baseDmg = 8; baseSpd = 0; // 无法移动
        break;
      case 'boar':
        baseHp = 220; baseDmg = 12; baseSpd = 110;
        break;
      case 'ape':
        baseHp = 180; baseDmg = 18; baseSpd = 160;
        break;
      
      case 'chest':
        baseHp = 50; baseDmg = 0; baseSpd = 0;
        this.isKnockbackImmune = true;
        break;
      
      // 精英怪 (Mini-Boss)
      case 'gorilla':
        baseHp = 4500; baseDmg = 25; baseSpd = 95;
        this.isKnockbackImmune = true;
        this.setScale(2.5);
        break;
      case 'centipede':
        baseHp = 7000; baseDmg = 30; baseSpd = 130;
        this.isKnockbackImmune = true;
        this.setScale(2.2);
        break;

      // 终极 BOSS
      case 'taotie':
        baseHp = 50000; baseDmg = 45; baseSpd = 110;
        this.isKnockbackImmune = true;
        this.setScale(3.5);
        break;
      case 'dragon':
        baseHp = 65000; baseDmg = 35; baseSpd = 150;
        this.isKnockbackImmune = true;
        this.setScale(3.2);
        break;
    }

    this.maxHp = Math.round(baseHp * scale);
    this.hp = this.maxHp;
    this.dmg = Math.round(baseDmg * scale);
    this.baseSpeed = baseSpd;
  }

  private adjustCollisionBox() {
    if (this.enemyId === 'caterpillar') {
      this.body?.setSize(32, 24);
    } else if (this.enemyId === 'rabbit') {
      this.body?.setSize(28, 36);
    } else if (this.enemyId === 'flower') {
      this.body?.setSize(36, 48);
    } else if (this.enemyId === 'boar') {
      this.body?.setSize(48, 36);
    } else if (this.enemyId === 'ape') {
      this.body?.setSize(32, 44);
    } else if (this.enemyId === 'chest') {
      this.body?.setSize(32, 28);
    }
  }

  /**
   * 承受伤害接口
   */
  public takeDamage(damage: number, knockbackForce: number, hitAngle: number) {
    if (this.enemyState === 'DEAD') return;

    this.hp -= damage;
    this.showFloatingDamage(damage);

    // 受击纯白闪光特效
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // 击退计算
    if (!this.isKnockbackImmune && knockbackForce > 0 && this.body) {
      this.enemyState = 'STUN';
      this.stateTimer = 0.2; // 阻滞 0.2 秒
      const kx = Math.cos(hitAngle) * knockbackForce * 4;
      const ky = Math.sin(hitAngle) * knockbackForce * 4;
      this.setVelocity(kx, ky);
    }

    // 死亡判断
    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  /**
   * 被动眩晕
   */
  public applyStun(duration: number) {
    if (this.enemyState === 'DEAD') return;
    this.enemyState = 'STUN';
    this.stateTimer = duration;
    this.setVelocity(0, 0);
    this.setTint(0x7fb3ff); // 蓝白色表示眩晕
    this.scene.time.delayedCall(Math.round(duration * 1000), () => {
      if (this.active && this.enemyState === 'STUN') {
        this.clearTint();
        this.enemyState = 'CHASE';
      }
    });
  }

  /**
   * 处理怪物死亡
   */
  private handleDeath() {
    this.enemyState = 'DEAD';
    this.setVelocity(0, 0);
    
    // 广播事件：掉落奖励
    this.scene.events.emit('enemy-died', {
      x: this.x,
      y: this.y,
      enemyId: this.enemyId,
      isElite: this.enemyId === 'gorilla' || this.enemyId === 'centipede' || this.enemyId === 'chest'
    });

    // 死亡粒子特效
    const deathParticles = this.scene.add.particles(this.x, this.y, 'bullet_firefly', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      tint: 0xaa2222,
      lifespan: 500,
      quantity: 15,
      emitting: false
    });
    deathParticles.setDepth(this.depth);
    deathParticles.explode();
    this.scene.time.delayedCall(1000, () => deathParticles.destroy());

    // 渐隐消散
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  /**
   * 每帧 AI 决策逻辑
   */
  public updateEntity(dt: number) {
    if (this.enemyState === 'DEAD' || !this.targetPlayer) return;

    // 普通小怪如果距离玩家太远（超过 1500 像素），则自动销毁以回收资源
    const isBoss = this.enemyId === 'taotie' || this.enemyId === 'dragon';
    if (!isBoss) {
      const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      if (distToPlayer > 1500) {
        this.destroy();
        return;
      }
    }

    // Boss 惊醒判定：距离玩家小于 1300 像素时被激活
    if (isBoss && !this.isBossAwakened) {
      const playerDist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      if (playerDist < 1300) {
        this.isBossAwakened = true;
        const bossName = this.enemyId === 'taotie' ? '邪化暴君·饕餮' : '九天青龙';
        (this.scene as any).overlayManager?.toast(`警告：最终 Boss【${bossName}】已被惊醒！决战打响！`, '#ff1111');
      }
    }

    // 减速状态 Tick
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1.0;
        this.clearTint();
      }
    }

    // 灼烧状态 Tick
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (this.burnTickTimer >= 1.0) {
        this.burnTickTimer = 0;
        this.takeDamage(this.burnDamage, 0, 0); // 灼烧伤害无击退
        
        // 灼烧红光一闪
        this.setTint(0xff5500);
        this.scene.time.delayedCall(150, () => {
          if (this.active && this.enemyState !== 'DEAD') {
            if (this.slowTimer > 0) this.setTint(0x7fb3ff);
            else this.clearTint();
          }
        });
      }
    }

    // 0. 卡通走路/待机动画驱动
    this.animTime += dt;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isMoving = body && (Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10);
    
    if (isMoving && this.enemyId !== 'flower' && this.enemyId !== 'chest') {
      const waddleSpeed = 12;
      this.setAngle(Math.sin(this.animTime * waddleSpeed) * 6);
      const squashY = this.baseScaleVal + Math.abs(Math.sin(this.animTime * waddleSpeed)) * 0.12;
      const squashX = this.baseScaleVal - Math.abs(Math.sin(this.animTime * waddleSpeed)) * 0.04;
      this.setScale(squashX, squashY);
    } else {
      this.setAngle(0);
      const breathSpeed = 3.5;
      const breathY = this.baseScaleVal + Math.sin(this.animTime * breathSpeed) * 0.03;
      const breathX = this.baseScaleVal - Math.sin(this.animTime * breathSpeed) * 0.01;
      this.setScale(breathX, breathY);
    }

    if (this.skillCooldownTimer > 0) {
      this.skillCooldownTimer -= dt;
    }

    // 1. 眩晕/击退状态阻滞
    if (this.enemyState === 'STUN') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.enemyState = 'CHASE';
      }
      return;
    }

    // 2. 状态倒计时
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
    }

    // 2.5 小怪仇恨判定与无声巡逻（不放技能，不追玩家）
    if (!isBoss) {
      if (!this.isAggroed) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
        // 如果玩家进入 450 像素（视野范围）内，或者小怪受伤了，激活仇恨
        if (dist <= 450 || this.hp < this.maxHp) {
          this.isAggroed = true;
        }
      }

      // 未激活仇恨时，小怪在出生点附近小范围游巡且不施放任何技能
      if (!this.isAggroed) {
        this.skillCooldownTimer = 2.0; // 冻结技能计时器
        
        if (this.enemyId === 'flower') {
          this.setVelocity(0, 0); // 毒藤食人花本身是静止植物
        } else {
          // 让游巡中心点（出生点）以极慢的速度（每秒 15 像素）向玩家靠拢，保证巡逻的怪能和玩家碰头
          const centerMoveSpeed = 15 * dt;
          const toPlayerAngle = Phaser.Math.Angle.Between(this.spawnX, this.spawnY, this.targetPlayer.x, this.targetPlayer.y);
          this.spawnX += Math.cos(toPlayerAngle) * centerMoveSpeed;
          this.spawnY += Math.sin(toPlayerAngle) * centerMoveSpeed;

          // 在出生点 spawnX, spawnY 附近 80 像素内做缓动正弦圆周游巡
          const patrolSpeed = 0.6;
          const angle = this.animTime * patrolSpeed;
          const patrolRadius = 80;
          const targetX = this.spawnX + Math.cos(angle) * patrolRadius;
          const targetY = this.spawnY + Math.sin(angle) * patrolRadius;

          const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
          const patrolVelocity = this.baseSpeed * 0.35; // 游巡移动速度为常规的 35%
          this.setVelocity(Math.cos(moveAngle) * patrolVelocity, Math.sin(moveAngle) * patrolVelocity);

          if (this.body && this.body.velocity.x < 0) {
            this.setFlipX(true);
          } else if (this.body && this.body.velocity.x > 0) {
            this.setFlipX(false);
          }
        }
        return; // 跳过后面独特 AI（不追击玩家，不施放跃击或投掷）
      }
    }

    // 3. 各怪物独特 AI 驱动
    switch (this.enemyId) {
      case 'caterpillar':
        this.tickCaterpillar();
        break;
      case 'rabbit':
        this.tickRabbit();
        break;
      case 'flower':
        this.tickFlower();
        break;
      case 'boar':
        this.tickBoar();
        break;
      case 'ape':
        this.tickApe(dt);
        break;
      
      // 精英
      case 'gorilla':
        this.tickGorilla();
        break;
      case 'centipede':
        this.tickCentipede(dt);
        break;

      // BOSS
      case 'taotie':
        this.tickTaotie();
        break;
      case 'dragon':
        this.tickDragon(dt);
        break;
    }
  }

  /**
   * 获取碰撞接触伤害
   */
  public getContactDamage(): number {
    return this.dmg;
  }

  // 1. 毛毛虫：纯粹追击
  private tickCaterpillar() {
    this.chaseTarget(this.baseSpeed);
  }

  // 2. 红眼兔：进入200码蓄力1s跃击
  private tickRabbit() {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);

    if (this.enemyState === 'CHASE') {
      if (dist <= 200 && this.skillCooldownTimer <= 0) {
        this.enemyState = 'PREPARE';
        this.stateTimer = 1.0;
        this.setVelocity(0, 0);
        this.setTint(0xffbb00);
      } else {
        this.chaseTarget(this.baseSpeed);
      }
    } else if (this.enemyState === 'PREPARE' && this.stateTimer <= 0) {
      this.enemyState = 'ATTACK';
      this.stateTimer = 0.6;
      this.clearTint();
      this.setTint(0xff5555);

      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      this.setVelocity(Math.cos(angle) * this.baseSpeed * 2.5, Math.sin(angle) * this.baseSpeed * 2.5);
    } else if (this.enemyState === 'ATTACK' && this.stateTimer <= 0) {
      this.clearTint();
      this.enemyState = 'CHASE';
      this.skillCooldownTimer = 3.0;
    }
  }

  // 3. 毒藤食人花：固定，每3秒发射毒弹
  private tickFlower() {
    this.setVelocity(0, 0);

    if (this.skillCooldownTimer <= 0) {
      this.skillCooldownTimer = 3.0;
      this.scene.events.emit('spawn-enemy-projectile', {
        x: this.x,
        y: this.y,
        angle: Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y),
        speed: 180,
        damage: this.dmg,
        type: 'acid'
      });
    }
  }

  // 4. 山猪：霸体直线大冲撞
  private tickBoar() {
    if (this.enemyState === 'CHASE') {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      if (dist <= 300 && this.skillCooldownTimer <= 0) {
        this.enemyState = 'PREPARE';
        this.stateTimer = 1.5;
        this.setVelocity(0, 0);
        this.setTint(0xff00ff);
      } else {
        this.chaseTarget(this.baseSpeed);
      }
    } else if (this.enemyState === 'PREPARE' && this.stateTimer <= 0) {
      this.enemyState = 'ATTACK';
      this.stateTimer = 2.0;
      this.isKnockbackImmune = true;
      this.clearTint();
      this.setTint(0xff3300);

      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      this.chargeDirX = Math.cos(angle);
      this.chargeDirY = Math.sin(angle);
      this.setVelocity(this.chargeDirX * this.baseSpeed * 3, this.chargeDirY * this.baseSpeed * 3);
    } else if (this.enemyState === 'ATTACK') {
      const isBlocked = (this.body as any).blocked.left || (this.body as any).blocked.right || 
                        (this.body as any).blocked.up || (this.body as any).blocked.down;
      
      if (isBlocked || this.stateTimer <= 0) {
        this.isKnockbackImmune = false;
        this.clearTint();
        this.skillCooldownTimer = 5.0;

        if (isBlocked) {
          this.applyStun(1.5);
        } else {
          this.enemyState = 'CHASE';
        }
      }
    }
  }

  // 5. 刺客猿：隐身提速包抄
  private tickApe(dt: number) {
    this.stealthTimer += dt;
    
    if (this.stealthTimer >= 6.0) {
      this.stealthTimer = 0;
      this.setAlpha(0.2);
      this.stateTimer = 2.5;
    }

    if (this.stateTimer > 0) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      const targetX = this.targetPlayer.x - Math.cos(angle) * 80;
      const targetY = this.targetPlayer.y - Math.sin(angle) * 80;
      
      const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(Math.cos(moveAngle) * this.baseSpeed * 1.3, Math.sin(moveAngle) * this.baseSpeed * 1.3);
    } else {
      this.setAlpha(1.0);
      this.chaseTarget(this.baseSpeed);
    }
  }

  // 6. 精英猩猩
  private tickGorilla() {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    
    if (this.enemyState === 'CHASE') {
      if (this.skillCooldownTimer <= 0) {
        this.skillCooldownTimer = 6.0;
        
        if (dist > 300) {
          this.enemyState = 'PREPARE';
          this.stateTimer = 1.0;
          this.setVelocity(0, 0);
          this.setTint(0x00ff88);
        } else {
          this.enemyState = 'ATTACK';
          this.stateTimer = 1.2;
          this.setVelocity(0, 0);
          this.setTint(0xffbb00);
        }
      } else {
        this.chaseTarget(this.baseSpeed);
      }
    } else if (this.enemyState === 'PREPARE' && this.stateTimer <= 0) {
      this.clearTint();
      this.enemyState = 'CHASE';
      this.scene.events.emit('spawn-enemy-projectile', {
        x: this.x,
        y: this.y,
        angle: Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y),
        speed: 250,
        damage: this.dmg * 1.2,
        type: 'boulder'
      });
    } else if (this.enemyState === 'ATTACK' && this.stateTimer <= 0) {
      this.clearTint();
      this.enemyState = 'CHASE';
      const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      const angles = [baseAngle - 0.2, baseAngle, baseAngle + 0.2];
      
      angles.forEach(angle => {
        this.scene.events.emit('spawn-enemy-projectile', {
          x: this.x,
          y: this.y,
          angle: angle,
          speed: 200,
          damage: this.dmg,
          type: 'earth_wave'
        });
      });
    }
  }

  // 7. 精英蜈蚣
  private tickCentipede(dt: number) {
    if (!this.stateTimer) this.stateTimer = 0;
    this.stateTimer += dt;
    if (this.stateTimer >= 0.3) {
      this.stateTimer = 0;
      this.scene.events.emit('spawn-poison-cloud', { x: this.x, y: this.y, duration: 4.0 });
    }

    this.chaseTarget(this.baseSpeed);

    if (this.skillCooldownTimer <= 0) {
      this.skillCooldownTimer = 8.0;
      this.scene.events.emit('spawn-ground-alert', {
        x: this.targetPlayer.x,
        y: this.targetPlayer.y,
        radius: 120,
        delay: 1.5,
        damage: this.dmg * 2
      });
    }
  }

  // 8. 终极 BOSS 1：饕餮
  private tickTaotie() {
    if (!this.isBossAwakened) {
      // 沉睡游荡状态：在出生点附近小范围随机散步，且挂起攻击
      this.skillCooldownTimer = 3.0; // 冻结技能计时器
      
      // 使用缓动正弦圆周巡逻：以出生地为中心，在 150 像素范围内游荡
      const patrolSpeed = 0.5;
      const angle = this.animTime * patrolSpeed;
      const targetX = this.spawnX + Math.cos(angle) * 150;
      const targetY = this.spawnY + Math.sin(angle) * 150;

      const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      const patrolVelocity = this.baseSpeed * 0.4; // 游荡速度减半
      this.setVelocity(Math.cos(moveAngle) * patrolVelocity, Math.sin(moveAngle) * patrolVelocity);

      if (this.body && this.body.velocity.x < 0) {
        this.setFlipX(true);
      } else if (this.body && this.body.velocity.x > 0) {
        this.setFlipX(false);
      }
      return;
    }

    if (this.currentPhase === 1 && this.hp < this.maxHp * 0.5) {
      this.currentPhase = 2;
      this.baseSpeed *= 1.25;
      this.setTint(0xff0000);
      this.showFloatingDamage(9999);
    }

    const cdScale = this.currentPhase === 2 ? 0.7 : 1.0;

    if (this.skillCooldownTimer <= 0) {
      this.skillCooldownTimer = 10.0 * cdScale;
      
      const roll = Math.random();
      if (roll < 0.5) {
        this.scene.events.emit('boss-blackhole-start', { duration: 5.0 });
      } else {
        this.scene.events.emit('boss-meteors-start', { count: 8, delay: 1.0 });
      }

      if (this.currentPhase === 2) {
        this.scene.time.delayedCall(4000, () => {
          if (this.active && this.enemyState !== 'DEAD') {
            this.scene.events.emit('boss-slash-start', { x: this.x, y: this.y, dmg: this.dmg * 1.5 });
          }
        });
      }
    }

    this.chaseTarget(this.baseSpeed);
  }

  // 9. 终极 BOSS 2：青龙
  private tickDragon(dt: number) {
    if (!this.isBossAwakened) {
      this.skillCooldownTimer = 3.0; // 冻结技能计时器，不触发攻击
    } else {
      if (this.currentPhase === 1 && this.hp < this.maxHp * 0.6) {
        this.currentPhase = 2;
        this.setTint(0x00ffff);
      }

      if (this.skillCooldownTimer <= 0) {
        const cdScale = this.currentPhase === 2 ? 0.7 : 1.0;
        this.skillCooldownTimer = 12.0 * cdScale;

        if (this.currentPhase === 1) {
          const roll = Math.random();
          if (roll < 0.5) {
            this.scene.events.emit('boss-missiles-start', { count: 30 });
          } else {
            this.scene.events.emit('boss-grid-start', { duration: 6.0 });
          }
        } else {
          this.scene.events.emit('boss-flamethrower-start', { x: this.x, y: this.y, duration: 8.0 });
        }
      }
    }

    if (!this.stealthTimer) this.stealthTimer = 0;
    this.stealthTimer += dt * 0.5;
    
    const centerX = this.spawnX;
    const centerY = this.spawnY;
    const radius = 1100;
    
    const targetX = centerX + Math.cos(this.stealthTimer) * radius;
    const targetY = centerY + Math.sin(this.stealthTimer) * radius;
    
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(angle) * this.baseSpeed, Math.sin(angle) * this.baseSpeed);
    this.setRotation(angle);
  }

  private chaseTarget(speed: number) {
    if (speed <= 0) return;
    const currentSpeed = speed * this.slowMultiplier;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    this.setVelocity(Math.cos(angle) * currentSpeed, Math.sin(angle) * currentSpeed);

    if (this.body && this.body.velocity.x < 0) {
      this.setFlipX(true);
    } else if (this.body && this.body.velocity.x > 0) {
      this.setFlipX(false);
    }
  }

  /**
   * 施加减速状态
   */
  public applySlow(percent: number, duration: number) {
    if (this.enemyState === 'DEAD') return;
    this.slowMultiplier = 1 - (percent / 100);
    this.slowTimer = duration;
    this.setTint(0x7fb3ff); // 蓝紫色减速色调
  }

  /**
   * 施加全身灼烧状态
   */
  public applyBurn(damagePerSec: number, duration: number) {
    if (this.enemyState === 'DEAD') return;
    this.burnDamage = damagePerSec;
    this.burnTimer = duration;
    this.burnTickTimer = 0;
  }

  private showFloatingDamage(dmg: number) {
    const isBoss = this.enemyId === 'taotie' || this.enemyId === 'dragon';
    const isElite = this.enemyId === 'gorilla' || this.enemyId === 'centipede';
    
    let color = '#ffff00';
    let size = '16px';
    if (isBoss) {
      color = '#ff003c';
      size = '26px';
    } else if (isElite) {
      color = '#ff9000';
      size = '20px';
    }

    const ftext = this.scene.add.text(this.x, this.y - 15, `${Math.round(dmg)}`, {
      fontFamily: 'Outfit, Arial, sans-serif',
      fontSize: size,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    });
    ftext.setOrigin(0.5);

    this.scene.tweens.add({
      targets: ftext,
      x: this.x + Phaser.Math.Between(-20, 20),
      y: this.y - 50,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ftext.destroy();
      }
    });
  }
}
