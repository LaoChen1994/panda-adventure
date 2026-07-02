import Phaser from 'phaser';

/**
 * 启动加载场景 (优先加载真实切图，未成功则动态生成色块占位图作为 Fallback)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 创建一个居中的加载进度文本提示
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '探险队集结中...',
      style: {
        font: '20px Outfit, Arial, sans-serif',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5);

    const v = '?v=4';
    // 1. 加载真实的像素艺术 PNG 资产，包含静态头像以及逐帧行走动画图
    this.load.image('panda_default', 'assets/characters/panda_default.png' + v);

    const characterLoadingConfigs = [
      { id: 'kungfu_panda', frames: 6 },
      { id: 'bamboo_archer', frames: 6 },
      { id: 'wealth_panda', frames: 9 },
      { id: 'iron_shield', frames: 9 },
      { id: 'drunk_master', frames: 9 },
      { id: 'gear_mechanic', frames: 9 }
    ];

    characterLoadingConfigs.forEach(char => {
      // 加载静态选择界面立绘/首帧头像
      this.load.image(char.id, `assets/characters/${char.id}.png` + v);
      // 循环加载逐帧行走动画图片
      for (let i = 0; i < char.frames; i++) {
        this.load.image(`${char.id}_walk_${i}`, `assets/characters/${char.id}_walk_${i}.png` + v);
      }
    });

    this.load.image('enemy_caterpillar', 'assets/enemies/caterpillar.png' + v);
    this.load.image('enemy_rabbit', 'assets/enemies/rabbit.png' + v);
    this.load.image('enemy_flower', 'assets/enemies/flower.png' + v);
    this.load.image('enemy_boar', 'assets/enemies/boar.png' + v);
    this.load.image('enemy_ape', 'assets/enemies/ape.png' + v);
    this.load.image('enemy_gorilla', 'assets/enemies/gorilla.png' + v);
    this.load.image('enemy_centipede', 'assets/enemies/centipede.png' + v);
    this.load.image('enemy_taotie', 'assets/enemies/taotie.png' + v);
    this.load.image('enemy_dragon', 'assets/enemies/dragon.png' + v);
    this.load.image('enemy_chest', 'assets/items/chest.png' + v);

    this.load.image('bullet_default', 'assets/projectiles/coin_shot.png' + v);
    this.load.image('bullet_large', 'assets/projectiles/arrow.png' + v);
    this.load.image('bullet_coin', 'assets/projectiles/coin_shot.png' + v);
    this.load.image('bullet_wine', 'assets/projectiles/wine_drop.png' + v);
    this.load.image('bullet_fan', 'assets/projectiles/lightning_bolt.png' + v);
    this.load.image('bullet_web', 'assets/projectiles/web_net.png' + v);
    this.load.image('bullet_firefly', 'assets/projectiles/glow_dot.png' + v);
    this.load.image('bullet_foxfire', 'assets/projectiles/fox_fire.png' + v);

    this.load.image('effect_swing', 'assets/effects/swing.png' + v);
    this.load.image('summons_turret', 'assets/summons/turret.png' + v);

    // 武器挂件切图
    this.load.image('weapon_stick', 'assets/weapons/stick.png' + v);
    this.load.image('weapon_bow', 'assets/weapons/bow.png' + v);
    this.load.image('weapon_abacus', 'assets/weapons/abacus.png' + v);
    this.load.image('weapon_shield', 'assets/weapons/shield.png' + v);
    this.load.image('weapon_pot', 'assets/weapons/pot.png' + v);
    this.load.image('weapon_wrench', 'assets/weapons/wrench.png' + v);
    this.load.image('weapon_spear', 'assets/weapons/spear.png' + v);
    this.load.image('weapon_fan', 'assets/weapons/fan.png' + v);

    // 宠物跟随切图
    this.load.image('pet_46', 'assets/pets/rat.png' + v);
    this.load.image('pet_47', 'assets/pets/firefly.png' + v);
    this.load.image('pet_48', 'assets/pets/toad.png' + v);
    this.load.image('pet_49', 'assets/pets/spider.png' + v);
    this.load.image('pet_50', 'assets/pets/baby_panda.png' + v);
    this.load.image('pet_51', 'assets/pets/fox.png' + v);

    this.load.image('collectable_xp', 'assets/items/xp_gem.png' + v);
    this.load.image('collectable_gold', 'assets/items/bamboo_coin.png' + v);
    this.load.image('collectable_chest', 'assets/items/chest.png' + v);
    this.load.image('collectable_bamboo_shoot', 'assets/items/bamboo_shoot.png' + v);

    // 地图底图瓦片
    this.load.image('map_forest_tile', 'assets/maps/forest_tile.png' + v);
    this.load.image('map_lava_tile', 'assets/maps/lava_tile.png' + v);
    this.load.image('map_sky_tile', 'assets/maps/sky_tile.png' + v);

    // 视觉特效
    this.load.image('effect_shield_ring', 'assets/effects/shield_ring.png' + v);
    this.load.image('effect_level_up', 'assets/effects/level_up.png' + v);
  }

  create() {
    // 1.5 移除可能加载成功的低质地表底图，并由代码程序化绘制高清且无限延展的底图纹理
    this.textures.remove('map_forest_tile');
    this.textures.remove('map_lava_tile');
    this.textures.remove('map_sky_tile');
    this.generateProceduralTextures();

    // 2. 对于加载失败的资产，动态生成占位纹理作为 Fail-safe 机制
    this.generateFallbackTextures();

    // 加载完毕，跳转到主场景
    this.scene.start('GameScene');
  }

  /**
   * 使用 Phaser Graphics 在内存中生成色块纹理，避免读取本地图片出错
   */
  private generateFallbackTextures() {
    const g = this.add.graphics();
    g.setVisible(false);

    // ==========================================
    // 1. 玩家占位 (绿色大圆形 + 黑色耳朵)
    // ==========================================
    const generateWalkFallback = (charId: string, frames: number) => {
      for (let i = 0; i < frames; i++) {
        const key = `${charId}_walk_${i}`;
        if (!this.textures.exists(key)) {
          g.clear();
          g.fillStyle(0xffffff, 1);
          g.fillCircle(128, 128, 64);
          g.fillStyle(0x111111, 1);
          g.fillCircle(128 - 24, 128 - 24, 20); // 左耳
          g.fillCircle(128 + 24, 128 - 24, 20); // 右耳
          g.generateTexture(key, 256, 256);
        }
      }
    };

    generateWalkFallback('kungfu_panda', 6);
    generateWalkFallback('bamboo_archer', 6);
    generateWalkFallback('wealth_panda', 9);
    generateWalkFallback('iron_shield', 9);
    generateWalkFallback('drunk_master', 9);
    generateWalkFallback('gear_mechanic', 9);

    const pandaKeys = ['panda_default', 'kungfu_panda', 'bamboo_archer', 'wealth_panda', 'iron_shield', 'drunk_master', 'gear_mechanic'];
    pandaKeys.forEach(key => {
      if (!this.textures.exists(key)) {
        g.clear();
        g.fillStyle(0xffffff, 1); // 身体白色
        g.fillCircle(24, 24, 16);
        g.fillStyle(0x111111, 1); // 耳朵和眼睛黑色
        g.fillCircle(12, 12, 6);  // 左耳
        g.fillCircle(36, 12, 6);  // 右耳
        g.fillCircle(18, 20, 3);  // 左眼
        g.fillCircle(30, 20, 3);  // 右眼
        g.fillStyle(0xcc2222, 1); // 红色武僧围巾
        g.fillTriangle(14, 32, 34, 32, 24, 44);
        g.generateTexture(key, 48, 48);
      }
    });

    // ==========================================
    // 2. 怪物占位 (白/黄/红/黑等多色配置)
    // ==========================================
    
    // W1-5 变异毛毛虫 (绿黄色胶囊体)
    if (!this.textures.exists('enemy_caterpillar')) {
      g.clear();
      g.fillStyle(0x8ae622, 1);
      g.fillRoundedRect(4, 8, 24, 16, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(24, 14, 3);
      g.fillStyle(0x000000, 1);
      g.fillCircle(24, 14, 1.5);
      g.generateTexture('enemy_caterpillar', 32, 32);
    }

    // W3-8 疯狂红眼兔 (橙色直立胶囊体 + 红眼)
    if (!this.textures.exists('enemy_rabbit')) {
      g.clear();
      g.fillStyle(0xff7722, 1);
      g.fillRoundedRect(8, 6, 16, 24, 5);
      g.fillStyle(0xffffff, 1); // 耳朵
      g.fillEllipse(12, 4, 3, 8);
      g.fillEllipse(20, 4, 3, 8);
      g.fillStyle(0xff0000, 1); // 暴躁红眼
      g.fillCircle(12, 12, 2.5);
      g.fillCircle(20, 12, 2.5);
      g.generateTexture('enemy_rabbit', 32, 32);
    }

    // W6-12 毒藤食人花 (紫色固定花瓣)
    if (!this.textures.exists('enemy_flower')) {
      g.clear();
      g.fillStyle(0xa855f7, 1); // 花骨朵
      g.fillEllipse(24, 20, 14, 18);
      g.fillStyle(0x22c55e, 1); // 叶片根部
      g.fillRect(16, 34, 16, 10);
      g.fillStyle(0x4ade80, 1);
      g.fillTriangle(8, 38, 24, 34, 16, 44);
      g.fillTriangle(40, 38, 24, 34, 32, 44);
      g.generateTexture('enemy_flower', 48, 48);
    }

    // W9-15 黑风寨山猪 (深褐色大矩形)
    if (!this.textures.exists('enemy_boar')) {
      g.clear();
      g.fillStyle(0x5c4033, 1);
      g.fillRoundedRect(4, 8, 40, 26, 4);
      g.fillStyle(0xffffff, 1); // 獠牙
      g.fillTriangle(38, 24, 44, 14, 40, 26);
      g.fillStyle(0xff3300, 1); // 红眼
      g.fillCircle(32, 16, 3);
      g.generateTexture('enemy_boar', 48, 48);
    }

    // W13-19 竹林刺客猿 (灰黑色长条形)
    if (!this.textures.exists('enemy_ape')) {
      g.clear();
      g.fillStyle(0x374151, 1);
      g.fillRoundedRect(8, 4, 16, 38, 6);
      g.fillStyle(0xf3f4f6, 1); // 刺客白面具
      g.fillRect(10, 10, 12, 10);
      g.fillStyle(0xef4444, 1); // 面具红点
      g.fillCircle(16, 15, 2);
      g.generateTexture('enemy_ape', 32, 48);
    }

    // ==========================================
    // 3. 精英怪与 BOSS 占位
    // ==========================================
    
    // 精英猩猩 (巨型黑色方块)
    if (!this.textures.exists('enemy_gorilla')) {
      g.clear();
      g.fillStyle(0x1f2937, 1);
      g.fillRoundedRect(10, 10, 60, 60, 12);
      g.fillStyle(0x4b5563, 1); // 背部石碑
      g.fillRect(20, 2, 40, 10);
      g.fillStyle(0xff0000, 1);
      g.fillCircle(28, 28, 4);
      g.fillCircle(52, 28, 4);
      g.generateTexture('enemy_gorilla', 80, 80);
    }

    // 精英蜈蚣 (青铜多节多足形)
    if (!this.textures.exists('enemy_centipede')) {
      g.clear();
      g.fillStyle(0x10b981, 1);
      g.fillRoundedRect(8, 12, 48, 18, 6);
      g.fillStyle(0x047857, 1); // 外壳鳞片
      g.fillCircle(18, 21, 6);
      g.fillCircle(32, 21, 6);
      g.fillCircle(46, 21, 6);
      g.fillStyle(0xf59e0b, 1); // 黄眼
      g.fillCircle(46, 17, 3);
      g.generateTexture('enemy_centipede', 64, 40);
    }

    // BOSS 1: 饕餮 (暗红巨兽)
    if (!this.textures.exists('enemy_taotie')) {
      g.clear();
      g.fillStyle(0x991b1b, 1);
      g.fillRoundedRect(10, 10, 100, 100, 20);
      g.fillStyle(0x111111, 1); // 大口
      g.fillRoundedRect(25, 50, 70, 40, 10);
      g.fillStyle(0xfacc15, 1); // 邪恶金眼
      g.fillCircle(38, 36, 10);
      g.fillCircle(82, 36, 10);
      g.fillStyle(0x000000, 1);
      g.fillCircle(38, 36, 4);
      g.fillCircle(82, 36, 4);
      g.generateTexture('enemy_taotie', 120, 120);
    }

    // BOSS 2: 青龙 (青色发光机械龙)
    if (!this.textures.exists('enemy_dragon')) {
      g.clear();
      g.fillStyle(0x06b6d4, 1);
      g.fillRoundedRect(10, 20, 100, 60, 15);
      g.fillStyle(0xe0f2fe, 1); // 发光能量核心
      g.fillCircle(40, 50, 12);
      g.fillStyle(0x10b981, 1); // 龙角
      g.fillTriangle(80, 25, 95, 5, 90, 35);
      g.fillStyle(0xfff, 1); // 怒目
      g.fillCircle(80, 42, 6);
      g.generateTexture('enemy_dragon', 120, 100);
    }

    // ==========================================
    // 4. 子弹类占位
    // ==========================================
    
    // 默认子弹 (黄色小圆形)
    if (!this.textures.exists('bullet_default')) {
      g.clear();
      g.fillStyle(0xffeb3b, 1);
      g.fillCircle(6, 6, 5);
      g.generateTexture('bullet_default', 12, 12);
    }

    // 穿透强化子弹 (大黄色圆圈)
    if (!this.textures.exists('bullet_large')) {
      g.clear();
      g.fillStyle(0xffc107, 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(10, 10, 3);
      g.generateTexture('bullet_large', 20, 20);
    }

    // 金算盘金币子弹 (金币)
    if (!this.textures.exists('bullet_coin')) {
      g.clear();
      g.fillStyle(0xffd700, 1); // 纯金
      g.fillCircle(8, 8, 7);
      g.fillStyle(0x161b22, 1); // 铜钱孔
      g.fillRect(6, 6, 4, 4);
      g.generateTexture('bullet_coin', 16, 16);
    }

    // 醉拳酒壶子弹 (紫色酒滴)
    if (!this.textures.exists('bullet_wine')) {
      g.clear();
      g.fillStyle(0xc084fc, 1);
      g.fillTriangle(8, 1, 3, 11, 13, 11);
      g.fillCircle(8, 11, 5);
      g.generateTexture('bullet_wine', 16, 16);
    }

    // ==========================================
    // 5. 特效类占位
    // ==========================================
    
    // 竹棍挥击斩击波 (白色弧光)
    if (!this.textures.exists('effect_swing')) {
      g.clear();
      g.lineStyle(4, 0xffffff, 0.8);
      g.beginPath();
      g.arc(16, 24, 20, -Math.PI / 3, Math.PI / 3, false);
      g.strokePath();
      g.generateTexture('effect_swing', 32, 48);
    }

    // 机枪塔召唤物 (机械学者扳手丢出生成的炮台)
    if (!this.textures.exists('summons_turret')) {
      g.clear();
      g.fillStyle(0x6b7280, 1); // 机械银灰
      g.fillRect(8, 14, 16, 14); // 底座
      g.fillStyle(0x22c55e, 1); // 发光指示灯
      g.fillCircle(16, 8, 5);
      g.fillStyle(0x374151, 1); // 枪管
      g.fillRect(16, 18, 14, 6);
      g.generateTexture('summons_turret', 32, 32);
    }

    // ==========================================
    // 6. 局内掉落物占位
    // ==========================================
    
    // 蓝色经验宝石
    if (!this.textures.exists('collectable_xp')) {
      g.clear();
      g.fillStyle(0x00d2ff, 1);
      g.fillTriangle(8, 1, 1, 8, 15, 8);
      g.fillTriangle(8, 15, 1, 8, 15, 8);
      g.generateTexture('collectable_xp', 16, 16);
    }

    // 掉落的竹子金币 (绿黄色圆环)
    if (!this.textures.exists('collectable_gold')) {
      g.clear();
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(8, 8, 7);
      g.fillStyle(0x0d1117, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('collectable_gold', 16, 16);
    }

    // 精英红木宝箱
    if (!this.textures.exists('collectable_chest')) {
      g.clear();
      g.fillStyle(0xb91c1c, 1); // 绛红色木盒
      g.fillRect(2, 4, 28, 20);
      g.fillStyle(0xfacc15, 1); // 纯金锁扣
      g.fillRect(12, 10, 8, 8);
      g.generateTexture('collectable_chest', 32, 28);
    }

    // ==========================================
    // 7. 新武器挂载 fallback
    // ==========================================
    if (!this.textures.exists('weapon_spear')) {
      g.clear();
      g.fillStyle(0xcc2222, 1);
      g.fillRect(8, 20, 32, 8); // 枪身
      g.fillStyle(0xffd700, 1);
      g.fillTriangle(36, 16, 48, 24, 36, 32); // 枪尖
      g.generateTexture('weapon_spear', 48, 48);
    }
    if (!this.textures.exists('weapon_fan')) {
      g.clear();
      g.fillStyle(0x3a86ff, 1);
      g.fillTriangle(12, 36, 24, 12, 36, 36);
      g.generateTexture('weapon_fan', 48, 48);
    }

    // ==========================================
    // 8. 宠物 fallback
    // ==========================================
    const petColors: Record<number, number> = {
      46: 0xb79457, // 灰褐色竹鼠
      47: 0xeaff33, // 亮黄萤火虫
      48: 0xffd700, // 招财金蟾
      49: 0x8b5a2b, // 机关木蛛
      50: 0x333333, // 幼崽熊猫
      51: 0xff4500  // 烈火灵狐
    };
    for (const petIdStr in petColors) {
      const petId = parseInt(petIdStr);
      const key = `pet_${petId}`;
      if (!this.textures.exists(key)) {
        g.clear();
        g.fillStyle(petColors[petId], 1);
        g.fillCircle(24, 24, 16);
        g.fillStyle(0xffffff, 1); // 眼睛
        g.fillCircle(18, 20, 4);
        g.fillCircle(30, 20, 4);
        g.fillStyle(0x000000, 1);
        g.fillCircle(18, 20, 2);
        g.fillCircle(30, 20, 2);
        g.generateTexture(key, 48, 48);
      }
    }

    // ==========================================
    // 9. 竹笋掉落物 fallback
    // ==========================================
    if (!this.textures.exists('collectable_bamboo_shoot')) {
      g.clear();
      g.fillStyle(0x4ade80, 1); // 翠绿色
      g.fillTriangle(16, 2, 6, 26, 26, 26);
      g.fillStyle(0x22c55e, 1); // 深绿底座
      g.fillRect(8, 22, 16, 6);
      g.generateTexture('collectable_bamboo_shoot', 32, 32);
    }

    // ==========================================
    // 10. 新增特殊子弹 fallback
    // ==========================================
    if (!this.textures.exists('bullet_fan')) {
      g.clear();
      g.fillStyle(0x5cd8ff, 1); // 电蓝色圆圈
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 2);
      g.generateTexture('bullet_fan', 16, 16);
    }
    if (!this.textures.exists('bullet_web')) {
      g.clear();
      g.lineStyle(1.5, 0xffffff, 0.9);
      g.strokeCircle(8, 8, 6);
      g.lineBetween(8, 2, 8, 14);
      g.lineBetween(2, 8, 14, 8);
      g.generateTexture('bullet_web', 16, 16);
    }
    if (!this.textures.exists('bullet_firefly')) {
      g.clear();
      g.fillStyle(0xeaff33, 1); // 黄绿微光
      g.fillCircle(6, 6, 5);
      g.generateTexture('bullet_firefly', 12, 12);
    }
    if (!this.textures.exists('bullet_foxfire')) {
      g.clear();
      g.fillStyle(0xff5500, 1); // 妖火紫红
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xc084fc, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('bullet_foxfire', 16, 16);
    }

    // ==========================================
    // 11. 新增地图底图瓦片与视觉特效 fallback
    // ==========================================
    if (!this.textures.exists('map_forest_tile')) {
      g.clear();
      g.fillStyle(0xa3e2ab, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x7dc486, 0.5);
      g.fillRect(0, 0, 64, 2);
      g.fillRect(0, 0, 2, 64);
      g.generateTexture('map_forest_tile', 64, 64);
    }
    if (!this.textures.exists('map_lava_tile')) {
      g.clear();
      g.fillStyle(0xf5cca6, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0xd0a678, 0.5);
      g.fillRect(0, 0, 64, 2);
      g.fillRect(0, 0, 2, 64);
      g.generateTexture('map_lava_tile', 64, 64);
    }
    if (!this.textures.exists('map_sky_tile')) {
      g.clear();
      g.fillStyle(0xbae6fd, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x7dd3fc, 0.5);
      g.fillRect(0, 0, 64, 2);
      g.fillRect(0, 0, 2, 64);
      g.generateTexture('map_sky_tile', 64, 64);
    }
    if (!this.textures.exists('effect_shield_ring')) {
      g.clear();
      g.lineStyle(3, 0x5cd8ff, 0.6);
      g.strokeCircle(24, 24, 20);
      g.generateTexture('effect_shield_ring', 48, 48);
    }
    if (!this.textures.exists('effect_level_up')) {
      g.clear();
      g.fillStyle(0xffd700, 0.4);
      g.fillRect(8, 0, 32, 48);
      g.generateTexture('effect_level_up', 48, 48);
    }

    // 回收图形
    g.destroy();
  }

  /**
   * 程序化绘制高清地表和地表随机装饰贴图，消除重复廉价感，支持无限扩展
   */
  private generateProceduralTextures() {
    const g = this.add.graphics();
    g.setVisible(false);

    // 1. 幽静翠竹林平铺地表 (map_forest_tile)
    if (!this.textures.exists('map_forest_tile')) {
      g.clear();
      // 优雅的竹绿底色
      g.fillStyle(0xd2ecd5, 1);
      g.fillRect(0, 0, 256, 256);
      
      // 绘制斑驳的泥苔微弱圆点，增加细节起伏感
      g.fillStyle(0xc4e5c8, 1);
      g.fillCircle(45, 60, 40);
      g.fillCircle(185, 205, 55);
      g.fillCircle(210, 75, 30);
      g.fillCircle(65, 185, 35);
      
      g.fillStyle(0xe2f3e4, 1);
      g.fillCircle(115, 125, 45);
      g.fillCircle(235, 155, 25);

      // 绘制超细精致的十字标网格，消除网格空旷感
      g.lineStyle(1.5, 0xb6dfbc, 0.45);
      // 外边框
      g.strokeRect(0, 0, 256, 256);
      // 中央辅助十字定位
      g.lineBetween(128 - 6, 128, 128 + 6, 128);
      g.lineBetween(128, 128 - 6, 128, 128 + 6);
      
      g.generateTexture('map_forest_tile', 256, 256);
    }

    // 2. 熔岩地下城平铺地表 (map_lava_tile)
    if (!this.textures.exists('map_lava_tile')) {
      g.clear();
      // 深灰色玄武岩底色
      g.fillStyle(0x1c1c1f, 1);
      g.fillRect(0, 0, 256, 256);
      
      // 绘制错落的石板缝隙线
      g.lineStyle(2, 0x111113, 1);
      g.strokeRect(0, 0, 256, 256);
      g.strokeRect(0, 0, 128, 128);
      g.strokeRect(128, 128, 128, 128);

      // 缝隙中流动发光的暗红熔岩痕迹
      g.lineStyle(2.5, 0xff4500, 0.65);
      g.lineBetween(8, 8, 120, 8);
      g.lineBetween(120, 8, 120, 120);
      g.lineBetween(8, 120, 120, 120);
      
      g.lineBetween(136, 136, 248, 136);
      g.lineBetween(248, 136, 248, 248);
      g.lineBetween(136, 248, 248, 248);

      // 暗红色的地表温度起伏光斑
      g.fillStyle(0xff3300, 0.12);
      g.fillCircle(64, 64, 45);
      g.fillCircle(192, 192, 50);

      g.generateTexture('map_lava_tile', 256, 256);
    }

    // 3. 浮空空岛平铺地表 (map_sky_tile)
    if (!this.textures.exists('map_sky_tile')) {
      g.clear();
      // 柔和晴空蓝底色
      g.fillStyle(0xdbeafe, 1);
      g.fillRect(0, 0, 256, 256);

      // 绘制流线型风道轨迹
      g.lineStyle(2, 0xffffff, 0.4);
      g.beginPath();
      g.arc(64, 64, 50, 0, Math.PI / 2);
      g.strokePath();
      g.beginPath();
      g.arc(192, 192, 40, Math.PI, Math.PI * 1.5);
      g.strokePath();

      // 浮空虚化的云雾圆斑
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(128, 128, 55);
      g.fillCircle(210, 45, 40);
      g.fillCircle(45, 215, 45);

      // 闪烁的十字星标记
      g.lineStyle(1.5, 0xffffff, 0.85);
      g.lineBetween(128 - 8, 128, 128 + 8, 128);
      g.lineBetween(128, 128 - 8, 128, 128 + 8);
      
      g.lineBetween(45 - 5, 45, 45 + 5, 45);
      g.lineBetween(45, 45 - 5, 45, 45 + 5);

      g.generateTexture('map_sky_tile', 256, 256);
    }

    // ==========================================
    // 4. 地表装饰物纹理生成
    // ==========================================
    
    // 嫩绿细长草丛
    if (!this.textures.exists('decor_grass_1')) {
      g.clear();
      g.fillStyle(0x7dc486, 1);
      g.fillTriangle(8, 32, 16, 6, 24, 32);
      g.fillTriangle(18, 32, 24, 10, 30, 32);
      g.fillStyle(0x60aa68, 1); // 阴影侧叶
      g.fillTriangle(2, 32, 8, 14, 14, 32);
      g.generateTexture('decor_grass_1', 32, 32);
    }

    // 浅黄嫩绿草堆
    if (!this.textures.exists('decor_grass_2')) {
      g.clear();
      g.fillStyle(0xa3d977, 1);
      g.fillTriangle(6, 32, 12, 12, 18, 32);
      g.fillTriangle(14, 32, 20, 6, 26, 32);
      g.fillStyle(0x81be52, 1);
      g.fillTriangle(21, 32, 26, 16, 31, 32);
      g.generateTexture('decor_grass_2', 32, 32);
    }

    // 鲜红丛中花
    if (!this.textures.exists('decor_flower_1')) {
      g.clear();
      g.fillStyle(0x4caf50, 1); // 绿茎
      g.fillRect(14, 16, 4, 16);
      g.fillTriangle(6, 24, 14, 20, 14, 26); // 左叶
      g.fillStyle(0xf44336, 1); // 红花瓣
      g.fillCircle(16, 10, 6); // 上
      g.fillCircle(10, 14, 6); // 左
      g.fillCircle(22, 14, 6); // 右
      g.fillCircle(16, 18, 6); // 下
      g.fillStyle(0xffeb3b, 1); // 黄花芯
      g.fillCircle(16, 14, 4);
      g.generateTexture('decor_flower_1', 32, 32);
    }

    // 橘黄小野花
    if (!this.textures.exists('decor_flower_2')) {
      g.clear();
      g.fillStyle(0x4caf50, 1); // 绿茎
      g.fillRect(14, 16, 4, 16);
      g.fillTriangle(26, 24, 18, 20, 18, 26); // 右叶
      g.fillStyle(0xff9800, 1); // 橙花瓣
      g.fillCircle(16, 10, 6);
      g.fillCircle(10, 14, 6);
      g.fillCircle(22, 14, 6);
      g.fillCircle(16, 18, 6);
      g.fillStyle(0xff5722, 1); // 橘红芯
      g.fillCircle(16, 14, 3.5);
      g.generateTexture('decor_flower_2', 32, 32);
    }

    // 圆润青石
    if (!this.textures.exists('decor_stone')) {
      g.clear();
      g.fillStyle(0x90a4ae, 1);
      g.fillEllipse(12, 22, 10, 8);
      g.fillStyle(0xb0bec5, 1); // 高光
      g.fillEllipse(9, 20, 6, 4);
      
      g.fillStyle(0x78909c, 1); // 伴生小石子
      g.fillCircle(24, 26, 5);
      g.fillStyle(0x90a4ae, 1);
      g.fillCircle(23, 25, 2.5);
      g.generateTexture('decor_stone', 32, 32);
    }

    // 丛生小翠竹
    if (!this.textures.exists('decor_bamboo')) {
      g.clear();
      g.fillStyle(0x2e7d32, 1); // 茎杆
      g.fillRect(14, 4, 4, 8);
      g.fillRect(14, 14, 4, 8);
      g.fillRect(14, 24, 4, 8);
      g.fillStyle(0x1b5e20, 1); // 骨节
      g.fillRect(13, 12, 6, 2);
      g.fillRect(13, 22, 6, 2);
      g.fillRect(13, 32, 6, 2);
      g.fillStyle(0x4caf50, 1); // 竹叶
      g.fillTriangle(14, 8, 4, 4, 14, 12);
      g.fillTriangle(18, 18, 28, 14, 18, 22);
      g.generateTexture('decor_bamboo', 32, 36);
    }

    // 熔岩灼烧地表裂缝
    if (!this.textures.exists('decor_lava_crack')) {
      g.clear();
      g.lineStyle(2.5, 0xff3300, 1);
      g.beginPath();
      g.moveTo(4, 16);
      g.lineTo(16, 12);
      g.lineTo(20, 24);
      g.lineTo(28, 20);
      g.strokePath();

      g.lineStyle(1.5, 0xffaa00, 0.85);
      g.beginPath();
      g.moveTo(16, 12);
      g.lineTo(22, 4);
      g.strokePath();

      g.fillStyle(0xff3300, 0.22);
      g.fillCircle(16, 12, 8);
      g.generateTexture('decor_lava_crack', 32, 32);
    }

    // 浮空云朵/小雾团
    if (!this.textures.exists('decor_cloud')) {
      g.clear();
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(10, 20, 8);
      g.fillCircle(18, 16, 10);
      g.fillCircle(26, 20, 7);
      g.fillRect(10, 18, 16, 10);
      g.generateTexture('decor_cloud', 36, 32);
    }

    g.destroy();
  }
}
