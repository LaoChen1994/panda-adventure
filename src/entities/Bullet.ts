import Phaser from 'phaser';

export interface BulletSpecialEffects {
  chainLightning?: boolean; // 是否连锁闪电
  isSplitOnCrit?: boolean;  // 暴击分裂
  isMeleeSwing?: boolean;   // 是否为近战挥击波 (近战竹棍气流)
  isKnockbackWave?: boolean;// 是否近战击退波
}

/**
 * 熊猫探险 子弹实体类 (支持对象池回收)
 */
export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 0;
  private range: number = 0;
  private knockback: number = 0;
  private pierceCount: number = 1;
  private startX: number = 0;
  private startY: number = 0;
  private effects: BulletSpecialEffects = {};
  
  // 已经击中过的怪物ID列表，防止穿透子弹在同一帧对同一个怪造成多次伤害
  private hitEnemies: Set<string> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 默认使用 'bullet_default' 纹理
    super(scene, x, y, 'bullet_default');
  }

  /**
   * 发射/激活子弹
   */
  public fire(
    x: number,
    y: number,
    angle: number, // 弧度
    speed: number,
    damage: number,
    range: number,
    knockback: number,
    pierce: number = 1,
    textureKey: string = 'bullet_default',
    effects: BulletSpecialEffects = {}
  ) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    this.knockback = knockback;
    this.pierceCount = pierce;
    this.effects = effects;
    this.hitEnemies.clear();

    // 换纹理与重置物理包围盒
    this.setTexture(textureKey);
    this.scene.physics.add.existing(this);

    // 缩放微调 (近战挥动大，子弹小)
    if (effects.isMeleeSwing) {
      this.setScale(1.5);
      // 近战挥击不应该受到常规重力，只播放一段挥击弧光并消失
      this.setAlpha(1.0);
      
      // 扩大近战的物理判定包围盒范围 (变成一个大圆)，并设为无限穿透
      this.body?.setCircle(60, -30, -30);
      this.pierceCount = 999;
    } else {
      this.setScale(1.0);
      this.setAlpha(1.0);
      // 恢复默认小圆判定
      this.body?.setCircle(8, 0, 0);
    }

    // 设置速度
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    this.setVelocity(velocityX, velocityY);

    // 设置子弹旋转朝向运动方向
    this.setRotation(angle);
  }

  update() {
    if (!this.active) return;

    // 1. 超出射程销毁
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);
    if (dist > this.range) {
      this.deactivate();
      return;
    }

    // 2. 近战挥击快速渐隐
    if (this.effects.isMeleeSwing) {
      const lifeRatio = dist / this.range;
      this.setAlpha(1 - lifeRatio);
      if (lifeRatio >= 0.9) {
        this.deactivate();
      }
    }
  }

  /**
   * 击中怪物回调
   */
  public onHitEnemy(enemyId: string): { damage: number; knockback: number; effects: BulletSpecialEffects } | null {
    if (this.hitEnemies.has(enemyId)) {
      return null; // 重复击中
    }
    this.hitEnemies.add(enemyId);

    // 扣减穿透次数
    this.pierceCount--;
    if (this.pierceCount <= 0) {
      this.deactivate();
    }

    return {
      damage: this.damage,
      knockback: this.knockback,
      effects: this.effects
    };
  }

  /**
   * 回收子弹
   */
  public deactivate() {
    this.setVelocity(0, 0);
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }
}
