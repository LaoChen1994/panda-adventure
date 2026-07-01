import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { OverlayManager } from './ui/OverlayManager';

// 1. 实例化混合 UI 叠层管理器
const overlayManager = new OverlayManager();

// 2. Phaser 游戏主配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#0d1117',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false // 可设为 true 开启碰撞盒辅助线
    }
  },
  scene: [BootScene, GameScene]
};

// 3. 启动 Phaser 实例
const game = new Phaser.Game(config);

// 4. 将 UI 管理器挂载至 Phaser 全局注册表中，便于 Scene 内部随时存取
game.registry.set('overlayManager', overlayManager);

// 5. 监听浏览器窗口变化，自适应重绘 Canvas
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
