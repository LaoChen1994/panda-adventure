import { WaveConfig, EnemyId } from '../types';

/**
 * 20 个波次的具体怪物生成配置表
 */
export const WAVE_DATABASE: WaveConfig[] = [
  // ==================== 新手期 (W1 - W5: 45秒) ====================
  {
    wave: 1,
    duration: 45,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.8, countPerSpawn: 1, startTime: 0 }
    ]
  },
  {
    wave: 2,
    duration: 45,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.6, countPerSpawn: 1, startTime: 0 },
      { enemyId: 'caterpillar', interval: 2.0, countPerSpawn: 2, startTime: 10 }
    ]
  },
  {
    wave: 3,
    duration: 45,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.5, countPerSpawn: 1, startTime: 0 },
      { enemyId: 'rabbit', interval: 2.0, countPerSpawn: 1, startTime: 5 }
    ]
  },
  {
    wave: 4,
    duration: 45,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.6, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'rabbit', interval: 1.5, countPerSpawn: 1, startTime: 10 }
    ]
  },
  {
    wave: 5,
    duration: 45,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.5, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'rabbit', interval: 1.0, countPerSpawn: 2, startTime: 5 }
    ]
  },

  // ==================== 成长期 (W6 - W10: 60秒) ====================
  {
    wave: 6,
    duration: 60,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.5, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'flower', interval: 2.5, countPerSpawn: 1, startTime: 0 }
    ]
  },
  {
    wave: 7,
    duration: 60,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.4, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'rabbit', interval: 1.5, countPerSpawn: 2, startTime: 5 },
      { enemyId: 'flower', interval: 2.0, countPerSpawn: 1, startTime: 10 }
    ]
  },
  {
    wave: 8,
    duration: 60,
    spawnRules: [
      { enemyId: 'rabbit', interval: 1.0, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'flower', interval: 1.5, countPerSpawn: 2, startTime: 5 }
    ]
  },
  {
    wave: 9,
    duration: 60,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.3, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'boar', interval: 3.0, countPerSpawn: 1, startTime: 5 }
    ]
  },
  {
    wave: 10,
    duration: 60,
    spawnRules: [
      { enemyId: 'rabbit', interval: 0.8, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'flower', interval: 2.0, countPerSpawn: 2, startTime: 10 },
      { enemyId: 'boar', interval: 2.5, countPerSpawn: 1, startTime: 15 }
    ]
  },

  // ==================== 高潮期 (W11 - W19: 75秒) ====================
  {
    wave: 11,
    duration: 75,
    spawnRules: [
      // 30秒时单独触发 精英怪A：巨力狂猩 (gorilla)
      { enemyId: 'caterpillar', interval: 0.4, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'flower', interval: 1.5, countPerSpawn: 2, startTime: 0 },
      { enemyId: 'boar', interval: 2.0, countPerSpawn: 1, startTime: 10 }
    ]
  },
  {
    wave: 12,
    duration: 75,
    spawnRules: [
      { enemyId: 'rabbit', interval: 0.6, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'flower', interval: 1.2, countPerSpawn: 2, startTime: 5 },
      { enemyId: 'boar', interval: 1.8, countPerSpawn: 2, startTime: 15 }
    ]
  },
  {
    wave: 13,
    duration: 75,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.3, countPerSpawn: 4, startTime: 0 },
      { enemyId: 'ape', interval: 2.5, countPerSpawn: 1, startTime: 0 }
    ]
  },
  {
    wave: 14,
    duration: 75,
    spawnRules: [
      { enemyId: 'flower', interval: 1.5, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'boar', interval: 1.5, countPerSpawn: 2, startTime: 10 },
      { enemyId: 'ape', interval: 2.0, countPerSpawn: 1, startTime: 5 }
    ]
  },
  {
    wave: 15,
    duration: 75,
    spawnRules: [
      { enemyId: 'rabbit', interval: 0.6, countPerSpawn: 4, startTime: 0 },
      { enemyId: 'ape', interval: 1.8, countPerSpawn: 2, startTime: 10 }
    ]
  },
  {
    wave: 16,
    duration: 75,
    spawnRules: [
      // 30秒时单独触发 精英怪B：百足蜈蚣 (centipede)
      { enemyId: 'flower', interval: 1.0, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'boar', interval: 1.5, countPerSpawn: 2, startTime: 5 },
      { enemyId: 'ape', interval: 2.0, countPerSpawn: 2, startTime: 15 }
    ]
  },
  {
    wave: 17,
    duration: 75,
    spawnRules: [
      { enemyId: 'caterpillar', interval: 0.25, countPerSpawn: 4, startTime: 0 },
      { enemyId: 'rabbit', interval: 0.5, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'ape', interval: 1.5, countPerSpawn: 2, startTime: 10 }
    ]
  },
  {
    wave: 18,
    duration: 75,
    spawnRules: [
      { enemyId: 'flower', interval: 0.7, countPerSpawn: 4, startTime: 0 },
      { enemyId: 'boar', interval: 1.0, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'ape', interval: 1.2, countPerSpawn: 3, startTime: 10 }
    ]
  },
  {
    wave: 19,
    duration: 75,
    spawnRules: [
      { enemyId: 'rabbit', interval: 0.5, countPerSpawn: 4, startTime: 0 },
      { enemyId: 'boar', interval: 0.9, countPerSpawn: 3, startTime: 0 },
      { enemyId: 'ape', interval: 1.0, countPerSpawn: 3, startTime: 5 }
    ]
  },

  // ==================== 决战期 (W20: BOSS决战不限时) ====================
  {
    wave: 20,
    duration: -1, // 不限时
    spawnRules: [] // 由代码单独触发终极 Boss
  }
];

/**
 * 关卡与刷怪波次管理器
 */
export class WaveSystem {
  public currentWaveNum: number = 1;
  public waveTimeRemaining: number = 45;
  private isWaveActive: boolean = false;
  
  // 刷怪计时器 (记录每个生成规则上次生成的时间戳)
  private spawnTimers: Map<number, number> = new Map();

  // 独立事件标记
  private isEliteSpawned: boolean = false;

  constructor() {}

  /**
   * 开启一个波次
   */
  public startWave(waveNum: number) {
    this.currentWaveNum = waveNum;
    const config = this.getWaveConfig(waveNum);
    this.waveTimeRemaining = config.duration;
    this.isWaveActive = true;
    this.isEliteSpawned = false;

    // 初始化刷怪计时
    this.spawnTimers.clear();
    config.spawnRules.forEach((_, idx) => {
      this.spawnTimers.set(idx, 0);
    });
  }

  /**
   * 获取当前波次配置
   */
  public getWaveConfig(waveNum: number): WaveConfig {
    const wave = WAVE_DATABASE.find(w => w.wave === waveNum);
    return wave || WAVE_DATABASE[0];
  }

  /**
   * 每帧更新波次倒计时，决定是否需要生成怪物
   * @param dt 帧时间 (秒)
   * @param spawnCallback 怪物生成事件回调
   * @param waveCompleteCallback 波次完成事件回调
   */
  public tick(
    dt: number, 
    spawnCallback: (enemyId: EnemyId) => void, 
    waveCompleteCallback: () => void
  ) {
    if (!this.isWaveActive) return;

    const config = this.getWaveConfig(this.currentWaveNum);
    
    // W20 决战不进行常规倒计时，直到 BOSS 战死
    if (config.duration !== -1) {
      this.waveTimeRemaining -= dt;
      
      if (this.waveTimeRemaining <= 0) {
        this.waveTimeRemaining = 0;
        this.isWaveActive = false;
        waveCompleteCallback();
        return;
      }

      // 精英怪产生判定 (第 11 波和 16 波的第 30 秒)
      const elapsed = config.duration - this.waveTimeRemaining;
      if (!this.isEliteSpawned && elapsed >= 30.0) {
        this.isEliteSpawned = true;
        if (this.currentWaveNum === 11) {
          spawnCallback('gorilla'); // 巨力狂猩
        } else if (this.currentWaveNum === 16) {
          spawnCallback('centipede'); // 百足蜈蚣
        }
      }
    } else {
      // W20 BOSS 局
      // 开启波次时如果还没有生成 BOSS，直接生成
      if (!this.isEliteSpawned) {
        this.isEliteSpawned = true;
        // 随机抽取一个最终 BOSS
        const bossId: EnemyId = Math.random() < 0.5 ? 'taotie' : 'dragon';
        spawnCallback(bossId);
      }
    }

    // 常规刷怪逻辑
    const configDuration = config.duration === -1 ? 999999 : config.duration;
    const currentElapsed = configDuration - this.waveTimeRemaining;

    config.spawnRules.forEach((rule, idx) => {
      // 是否达到刷怪启动时间
      if (currentElapsed >= rule.startTime) {
        let lastSpawn = this.spawnTimers.get(idx) || 0;
        lastSpawn += dt;

        if (lastSpawn >= rule.interval) {
          lastSpawn = 0;
          // 执行生成数量
          for (let c = 0; c < rule.countPerSpawn; c++) {
            spawnCallback(rule.enemyId);
          }
        }
        this.spawnTimers.set(idx, lastSpawn);
      }
    });
  }

  /**
   * 结算波次结束收益
   * @param currentGold 玩家当前携带的金币
   * @param harvest 玩家当前的收获属性值
   * @param isWealthPanda 玩家是否为财迷熊猫
   */
  public calculateWaveSettlement(
    currentGold: number,
    harvest: number,
    isWealthPanda: boolean
  ): { goldIncome: number; xpIncome: number; interest: number } {
    
    // 1. 收获值直接获得对应的金币与经验
    const goldFromHarvest = harvest;
    const xpFromHarvest = harvest; // 经验等额产出

    // 2. 利滚利利息结算：每10金币多得1金币 (仅财迷熊猫可用，常规熊猫利息为0)
    let interest = 0;
    if (isWealthPanda) {
      interest = Math.min(50, Math.floor(currentGold / 10));
    }

    // 3. 收获值自动成长规律：每波结束收获属性自动提升 10%
    // (在外部由 Player 或 AttributeSystem 承接加算，此处仅结算直接收益)

    return {
      goldIncome: goldFromHarvest + interest,
      xpIncome: xpFromHarvest,
      interest: interest
    };
  }
}
