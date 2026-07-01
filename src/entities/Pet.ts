import Phaser from 'phaser';
import { Player } from './Player';

export type PetId = 46 | 47 | 48 | 49 | 50 | 51;

/**
 * 萌宠跟随伙伴实体类
 */
export class Pet extends Phaser.Physics.Arcade.Sprite {
  public petId: PetId;
  private player: Player;
  private actionTimer: number = 0;
  private orbitAngle: number = 0;
  private animTime: number = Math.random() * 100;
  private baseScaleVal: number = 0.35; // 宠物身形小巧可爱

  constructor(scene: Phaser.Scene, player: Player, petId: PetId) {
    // 材质加载名称对应 BootScene 中注册的 pet_46 到 pet_51
    const textureKey = `pet_${petId}`;
    super(scene, player.x, player.y, textureKey);
    
    this.petId = petId;
    this.player = player;

    // 添加进 Phaser 场景和物理世界
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setScale(this.baseScaleVal);
    this.setOrigin(0.5, 0.5);

    // 宠物不需要和世界物理边界或敌人产生阻挡碰撞，设置其重力为 0，且不发生反弹
    (this.body as Phaser.Physics.Arcade.Body)?.setGravity(0, 0);
  }

  /**
   * 每帧更新入口
   */
  public updatePet(dt: number) {
    this.animTime += dt;
    const playerSpeed = 1 + (this.player.getAttributes().speed / 100);

    // =======================================================
    // 1. 跟随移动机制
    // =======================================================
    if (this.petId === 47) {
      // 萌宠 47 萤火虫：在玩家身边以 50 码半径环绕旋转飞行
      this.orbitAngle += dt * 3.0; // 旋转速度
      const radius = 50;
      this.x = this.player.x + Math.cos(this.orbitAngle) * radius;
      this.y = this.player.y + Math.sin(this.orbitAngle) * radius;
      
      // 轻微上下漂浮动画 (波浪波幅)
      this.y += Math.sin(this.animTime * 6) * 3;
    } else {
      // 其它陆地宠物：跟随在玩家身后位置 (x轴偏离，y轴微降)
      const followOffsetX = this.player.flipX ? 40 : -40;
      const targetX = this.player.x + followOffsetX;
      const targetY = this.player.y + 12;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

      if (dist > 20) {
        // 计算走向目标点的夹角
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        // 跟随速度略微快于玩家速度以保证能追上
        const speed = 190 * playerSpeed;
        this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // 卡通走动摇摆动画 (Waddle)
        this.setAngle(Math.sin(this.animTime * 15) * 12);
        
        // 跑动时拉伸身躯
        const squashY = this.baseScaleVal + Math.abs(Math.sin(this.animTime * 15)) * 0.08;
        const squashX = this.baseScaleVal - Math.abs(Math.sin(this.animTime * 15)) * 0.03;
        this.setScale(squashX, squashY);
      } else {
        // 贴身静止
        this.setVelocity(0, 0);
        this.setAngle(0);
        
        // 待机呼吸起伏 (Idle)
        const breathY = this.baseScaleVal + Math.sin(this.animTime * 3.5) * 0.02;
        const breathX = this.baseScaleVal - Math.sin(this.animTime * 3.5) * 0.01;
        this.setScale(breathX, breathY);
      }

      // 翻转材质朝向
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body && Math.abs(body.velocity.x) > 10) {
        this.setFlipX(body.velocity.x < 0);
      } else {
        this.setFlipX(this.player.flipX);
      }
    }

    // =======================================================
    // 2. 宠物动作计时器与特定事件广播
    // =======================================================
    this.actionTimer += dt;
    const engineering = this.player.getAttributes().engineering;

    switch (this.petId) {
      case 46:
        // 萌宠 46 小竹鼠：无主动攻击。磁铁拾取距离扩容 (GameScene 检测并触发)
        break;

      case 47:
        // 萌宠 47 小萤火虫：每 2 秒朝随机近身目标发射一颗荧光弹 (10 + 50%工程伤害)
        if (this.actionTimer >= 2.0) {
          this.actionTimer = 0;
          this.scene.events.emit('pet-action-shoot-firefly', {
            x: this.x,
            y: this.y,
            damage: 10 + Math.round(engineering * 0.5)
          });
        }
        break;

      case 48:
        // 萌宠 48 招财金蟾：每 10 秒吐出 2-4 金币，并执行弹跳视觉效果
        if (this.actionTimer >= 10.0) {
          this.actionTimer = 0;
          const goldCount = Phaser.Math.Between(2, 4);
          
          this.scene.events.emit('pet-action-spawn-gold', {
            x: this.x,
            y: this.y,
            count: goldCount
          });

          // 播放金蟾弹跳动画
          this.scene.tweens.add({
            targets: this,
            y: this.y - 30,
            yoyo: true,
            duration: 250,
            ease: 'Quad.easeOut'
          });
        }
        break;

      case 49:
        // 萌宠 49 机关木蛛：每 3 秒发射一张蛛网伤害最近怪物，并降低其 40% 移动速度 2 秒
        if (this.actionTimer >= 3.0) {
          this.actionTimer = 0;
          this.scene.events.emit('pet-action-shoot-spider', {
            x: this.x,
            y: this.y,
            damage: 15 + engineering
          });
        }
        break;

      case 50:
        // 萌宠 50 熊猫嘟嘟 (熊猫幼崽)：每 12 秒掉落一个高能竹笋，碰触可恢复 8 HP
        if (this.actionTimer >= 12.0) {
          this.actionTimer = 0;
          this.scene.events.emit('pet-action-spawn-heal', {
            x: this.x,
            y: this.y,
            healVal: 8
          });

          // 翻滚一下，体现萌系
          this.scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 500,
            onComplete: () => { this.setRotation(0); }
          });
        }
        break;

      case 51:
        // 萌宠 51 灵狐阿宝：每 1.5 秒向随机目标射出一枚追踪妖火 (造成 30 + 100%工程伤害，并燃烧)
        if (this.actionTimer >= 1.5) {
          this.actionTimer = 0;
          this.scene.events.emit('pet-action-shoot-fox', {
            x: this.x,
            y: this.y,
            damage: 30 + engineering
          });
        }
        break;
    }
  }

  /**
   * 销毁重置
   */
  public destroyPet() {
    this.setVelocity(0, 0);
    this.destroy();
  }
}
