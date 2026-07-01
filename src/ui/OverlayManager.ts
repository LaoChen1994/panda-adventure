import { CharacterId, EquippedWeapon, ItemConfig, WeaponQuality, WeaponId } from '../types';
import { CHARACTER_DATABASE } from '../entities/Player';
import { WEAPON_DATABASE } from '../systems/WeaponSystem';

/**
 * 混合 UI 叠层管理器 (负责 HTML5 DOM 与 Phaser 的数据交互与面板更新)
 */
export class OverlayManager {
  public static readonly itemEmojis: Record<number, string> = {
    1: '🎒', 2: '🪨', 3: '🪶', 4: '🛡️', 5: '👟', 6: '🍀', 7: '🐷', 8: '🧪', 9: '🦇', 10: '🔍',
    11: '⚙️', 12: '🕰️', 13: '🧪', 14: '👣', 15: '🎗️', 16: '🎋', 17: '🎭', 18: '🧨', 19: '🔧', 20: '🪙',
    21: '🔋', 22: '🩹', 23: '👢', 24: '🥋', 25: '🔦', 26: '🎋', 27: '🐾', 28: '🧪', 29: '💠', 30: '🔱',
    31: '🧥', 32: '💰', 33: '💫', 34: '🧛', 35: '🧭', 36: '📖', 37: '💊', 38: '☢️', 39: '🫱', 40: '👁️',
    41: '🥋', 42: '🏹', 43: '⚖️', 44: '🦾', 45: '☯️', 46: '🐹', 47: '🪰', 48: '🐸', 49: '🕷️', 50: '🐼',
    51: '🦊', 52: '⚡', 53: '🍶', 54: '💎'
  };

  private activeScreenId: string = 'menu-screen';
  private selectedCharacterId: CharacterId = 'kungfu_panda';

  // 拖拽数据缓存
  private dragStartSlotIndex: number = -1;

  // 游戏场景与回调句柄引用
  private onStartGameCallback: (charId: CharacterId) => void = () => {};
  private onLevelUpSelectedCallback: (modIndex: number) => void = () => {};
  private onShopBuyItemCallback: (item: ItemConfig) => void = () => {};
  private onShopBuyWeaponCallback: (weaponId: WeaponId, cost: number) => void = () => {};
  private onShopRerollCallback: () => void = () => {};
  private onShopWeaponMergedCallback: (from: number, to: number) => void = () => {};
  private onShopNextWaveCallback: () => void = () => {};
  private onReviveCallback: () => void = () => {};
  private onDoubleCoinsCallback: () => void = () => {};
  private onRestartGameCallback: () => void = () => {};

  constructor() {
    this.initDOMEvents();
  }

  /**
   * 注册控制回调
   */
  public registerHandlers(handlers: {
    onStartGame: (charId: CharacterId) => void;
    onLevelUpSelected: (optionIndex: number) => void;
    onShopBuyItem: (item: ItemConfig) => void;
    onShopBuyWeapon: (weaponId: WeaponId, cost: number) => void;
    onShopReroll: () => void;
    onShopWeaponMerged: (from: number, to: number) => void;
    onShopNextWave: () => void;
    onRevive: () => void;
    onDoubleCoins: () => void;
    onRestartGame: () => void;
  }) {
    this.onStartGameCallback = handlers.onStartGame;
    this.onLevelUpSelectedCallback = handlers.onLevelUpSelected;
    this.onShopBuyItemCallback = handlers.onShopBuyItem;
    this.onShopBuyWeaponCallback = handlers.onShopBuyWeapon;
    this.onShopRerollCallback = handlers.onShopReroll;
    this.onShopWeaponMergedCallback = handlers.onShopWeaponMerged;
    this.onShopNextWaveCallback = handlers.onShopNextWave;
    this.onReviveCallback = handlers.onRevive;
    this.onDoubleCoinsCallback = handlers.onDoubleCoins;
    this.onRestartGameCallback = handlers.onRestartGame;
  }

  /**
   * 设置游戏实例
   */
  public setGameInstance(_game: any) {
    // 留空以兼容接口
  }

  /**
   * 切换当前显示的 UI 面板
   */
  public showScreen(screenId: string) {
    // 隐藏之前的
    const prev = document.getElementById(this.activeScreenId);
    if (prev) {
      prev.classList.remove('active');
    }

    // 显示当前的
    const next = document.getElementById(screenId);
    if (next) {
      next.classList.add('active');
      this.activeScreenId = screenId;
    }
  }

  /**
   * 初始化主界面的 DOM 结构与静态事件
   */
  private initDOMEvents() {
    // 1. 初始化主菜单熊猫角色列表
    const charGrid = document.getElementById('char-grid');
    if (charGrid) {
      charGrid.innerHTML = '';

      (Object.keys(CHARACTER_DATABASE) as CharacterId[]).forEach(charId => {
        const slot = document.createElement('div');
        slot.className = `char-slot ${charId === this.selectedCharacterId ? 'selected' : ''}`;
        
        // 使用熊猫大画立绘替代低效 Emoji
        slot.innerHTML = `<img src="assets/characters/${charId}.png" style="width: 85%; height: 85%; object-fit: contain;" />`;
        
        slot.addEventListener('click', () => {
          this.selectCharacter(charId);
        });
        charGrid.appendChild(slot);
      });
      this.selectCharacter(this.selectedCharacterId); // 初始化信息框
    }

    // 2. 主界面：开始按钮
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.onStartGameCallback(this.selectedCharacterId);
    });

    // 3. 战斗 HUD：属性面板显示与关闭
    const toggleBtn = document.getElementById('toggle-stats-btn');
    const statsDrawer = document.getElementById('stats-drawer');
    const closeStatsBtn = document.getElementById('close-stats-btn');

    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      statsDrawer?.classList.toggle('active');
    });

    closeStatsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      statsDrawer?.classList.remove('active');
    });

    // 点击全屏遮罩空白区域自动关闭面板
    statsDrawer?.addEventListener('click', (e) => {
      if (e.target === statsDrawer) {
        statsDrawer.classList.remove('active');
      }
    });

    // 4. 商店界面：购买/刷新/下一波
    document.getElementById('shop-reroll-btn')?.addEventListener('click', () => {
      this.onShopRerollCallback();
    });
    document.getElementById('shop-next-wave-btn')?.addEventListener('click', () => {
      this.onShopNextWaveCallback();
    });

    // 5. 结算界面：复活/加倍/重玩
    document.getElementById('revive-btn')?.addEventListener('click', () => {
      this.onReviveCallback();
    });
    document.getElementById('double-coins-btn')?.addEventListener('click', () => {
      this.onDoubleCoinsCallback();
    });
    document.getElementById('restart-game-btn')?.addEventListener('click', () => {
      this.onRestartGameCallback();
    });
  }

  /**
   * 选择角色高亮并显示被动
   */
  private selectCharacter(charId: CharacterId) {
    this.selectedCharacterId = charId;
    
    // 更新高亮
    const charGrid = document.getElementById('char-grid');
    if (charGrid) {
      const children = Array.from(charGrid.children);
      const index = Object.keys(CHARACTER_DATABASE).indexOf(charId);
      children.forEach((c, idx) => {
        if (idx === index) c.classList.add('selected');
        else c.classList.remove('selected');
      });
    }

    // 更新详情
    const info = CHARACTER_DATABASE[charId];
    const infoBox = document.getElementById('char-info');
    if (infoBox && info) {
      infoBox.innerHTML = `
        <div class="char-info-title text-gold">${info.name}</div>
        <p class="text-muted">${info.description}</p>
        <div class="char-info-passive">
          <strong>专属被动【${info.passiveName}】:</strong>
          <span style="font-size: 0.85rem; color: #fff;">${info.passiveDesc}</span>
        </div>
      `;
    }
  }

  // =======================================================
  //            战斗 HUD 更新接口
  // =======================================================

  /**
   * 更新 HUD 战斗数值
   */
   public updateHUD(data: {
    level: number;
    xpPercent: number;
    xp: number;
    requiredXp: number;
    timerText: string;
    waveText: string;
    gold: number;
    hp: number;
    maxHp: number;
    shield: number;
    attributes: any;
    weapons: (EquippedWeapon | null)[];
  }) {
    // 基础文本
    const lvlNode = document.getElementById('hud-level');
    if (lvlNode) lvlNode.innerText = data.level.toString();

    const xpTextNode = document.getElementById('hud-xp-text');
    if (xpTextNode) xpTextNode.innerText = `(${data.xp}/${data.requiredXp})`;

    const xpFill = document.getElementById('hud-xp-fill');
    if (xpFill) xpFill.style.width = `${Math.min(100, data.xpPercent)}%`;

    const timerNode = document.getElementById('hud-timer');
    if (timerNode) timerNode.innerText = data.timerText;

    const waveNode = document.getElementById('hud-wave-text');
    if (waveNode) waveNode.innerText = data.waveText;

    const goldNode = document.getElementById('hud-gold');
    if (goldNode) goldNode.innerText = data.gold.toString();

    // 更新属性面板
    this.updateStatsDrawer(data.hp, data.maxHp, data.shield, data.attributes);

    // 更新底部武器列表
    const weaponsList = document.getElementById('hud-weapons-list');
    if (weaponsList) {
      weaponsList.innerHTML = '';
      
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

      data.weapons.forEach(w => {
        if (!w) return;
        const icon = document.createElement('div');
        icon.className = `hud-weapon-icon border-q${w.quality}`;
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        const key = weaponKeys[w.weaponId] || 'stick';
        icon.innerHTML = `<img src="assets/icons/${key}.png" style="width: 24px; height: 24px; object-fit: contain;" />`;
        weaponsList.appendChild(icon);
      });
    }
  }

  /**
   * 刷新 HUD 面板内的 16 维数值
   */
  private updateStatsDrawer(hp: number, maxHp: number, shield: number, attrs: any) {
    const list = document.getElementById('hud-stats-list');
    if (!list) return;

    const names: Record<string, string> = {
      hpMax: '最大生命值 (HP)',
      hpRegen: '生命再生 (HP Regen)',
      lifeSteal: '生命偷取 (Life Steal)',
      damageModifier: '伤害加成 (Damage)',
      meleeDmg: '近战伤害 (Melee DMG)',
      rangedDmg: '远程伤害 (Ranged DMG)',
      engineering: '工程学 (Engineering)',
      attackSpeed: '攻击速度 (Attack Speed)',
      critChance: '暴击率 (Crit Chance)',
      speed: '移动速度 (Speed)',
      range: '攻击范围 (Range)',
      armor: '护甲值 (Armor)',
      dodge: '闪避率 (Dodge)',
      luck: '幸运值 (Luck)',
      harvest: '收获值 (Harvest)',
      xpGainModifier: '经验修正 (XP Gain)'
    };

    const emojis: Record<string, string> = {
      hpMax: '❤️', hpRegen: '❇️', lifeSteal: '🩸', damageModifier: '🔥',
      meleeDmg: '⚔️', rangedDmg: '🏹', engineering: '⚙️', attackSpeed: '⚡',
      critChance: '🎯', speed: '👟', range: '👁️', armor: '🛡️',
      dodge: '💨', luck: '🍀', harvest: '🎋', xpGainModifier: '🎓'
    };

    let html = `
      <div class="stat-item" style="font-weight: bold; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px;">
        <span>生命值:</span>
        <span style="color: #4dff46;">${hp} / ${maxHp} ${shield > 0 ? `<span style="color:#5cd8ff;">(${shield}🛡️)</span>` : ''}</span>
      </div>
    `;

    for (const key in attrs) {
      const val = attrs[key];
      let formattedVal = Math.round(val).toString();

      // 百分比格式化
      if (['lifeSteal', 'damageModifier', 'attackSpeed', 'critChance', 'speed', 'dodge', 'xpGainModifier'].includes(key)) {
        formattedVal = `${Math.round(val)}%`;
      }

      html += `
        <div class="stat-item">
          <span>${emojis[key] || ''} ${names[key] || key}:</span>
          <span style="color: ${val > 0 && key !== 'speed' ? '#22c55e' : val < 0 ? '#ef4444' : '#fff'};">${formattedVal}</span>
        </div>
      `;
    }

    list.innerHTML = html;
  }

  // =======================================================
  //            升级选择 (4选1) 界面
  // =======================================================

  /**
   * 显示升级天赋界面
   */
  public showLevelUpScreen(options: {
    attribute: string;
    addVal: number;
    mulVal: number;
    quality: number; // 1-4 Quality
  }[]) {
    const container = document.getElementById('levelup-options');
    if (!container) return;
    container.innerHTML = '';

    const attrNames: Record<string, string> = {
      hpMax: '最大生命值',
      hpRegen: '生命再生',
      lifeSteal: '生命偷取',
      damageModifier: '伤害加成',
      meleeDmg: '近战伤害',
      rangedDmg: '远程伤害',
      engineering: '工程学',
      attackSpeed: '攻击速度',
      critChance: '暴击率',
      speed: '移动速度',
      range: '攻击范围',
      armor: '护甲值',
      dodge: '闪避率',
      luck: '幸运值',
      harvest: '收获值',
      xpGainModifier: '经验修正'
    };

    const attrEmojis: Record<string, string> = {
      hpMax: '❤️', hpRegen: '❇️', lifeSteal: '🩸', damageModifier: '🔥',
      meleeDmg: '⚔️', rangedDmg: '🏹', engineering: '⚙️', attackSpeed: '⚡',
      critChance: '🎯', speed: '👟', range: '👁️', armor: '🛡️',
      dodge: '💨', luck: '🍀', harvest: '🎋', xpGainModifier: '🎓'
    };

    const qualityNames = ['', '普通', '优秀', '稀有', '史诗'];

    options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = `option-card card-q${opt.quality}`;
      
      const emoji = attrEmojis[opt.attribute] || '🌟';
      const name = attrNames[opt.attribute] || opt.attribute;
      
      let valText = '';
      if (opt.addVal !== 0) {
        valText = `${opt.addVal > 0 ? '+' : ''}${opt.addVal}`;
      } else {
        valText = `${opt.mulVal > 0 ? '+' : ''}${Math.round(opt.mulVal * 100)}%`;
      }

      // 属性如攻速暴击等额外补充 % 单位
      if (['lifeSteal', 'damageModifier', 'attackSpeed', 'critChance', 'speed', 'dodge', 'xpGainModifier'].includes(opt.attribute) && opt.addVal !== 0) {
        valText += '%';
      }

      card.innerHTML = `
        <div class="option-icon">${emoji}</div>
        <div class="option-details">
          <h4>${name} ${valText}</h4>
          <p>${qualityNames[opt.quality]}品质属性强化</p>
        </div>
      `;

      card.addEventListener('click', () => {
        this.onLevelUpSelectedCallback(idx);
      });

      container.appendChild(card);
    });

    this.showScreen('levelup-screen');
  }

  // =======================================================
  //            商店界面更新与融合交互
  // =======================================================

  /**
   * 刷新商店道具列表与融合界面
   */
  public updateShop(data: {
    wave: number;
    gold: number;
    rerollCost: number;
    harvestIncome: number;
    marketItems: (ItemConfig | { id: string; name: string; quality: WeaponQuality; price: number; isWeapon: true })[];
    equippedWeapons: (EquippedWeapon | null)[];
    purchasedItems: { name: string; quality: string }[];
  }) {
    // 头部波次与钱包
    const waveTitle = document.getElementById('shop-wave-title');
    if (waveTitle) waveTitle.innerText = `WAVE ${data.wave} 完成`;

    const goldNode = document.getElementById('shop-gold');
    if (goldNode) goldNode.innerText = data.gold.toString();

    const rerollNode = document.getElementById('reroll-cost');
    if (rerollNode) rerollNode.innerText = data.rerollCost.toString();

    const harvestIncomeNode = document.getElementById('shop-harvest-income');
    if (harvestIncomeNode) harvestIncomeNode.innerText = `+${data.harvestIncome} 🎍 收获值利息`;

    // 1. 刷新商品橱窗
    const goodsGrid = document.getElementById('shop-goods-grid');
    if (goodsGrid) {
      goodsGrid.innerHTML = '';
      
      const weaponKeys: Record<string, string> = {
        bamboo_stick: 'stick',
        bamboo_bow: 'bow',
        gold_abacus: 'abacus',
        stone_shield: 'shield',
        wine_pot: 'pot',
        wrench: 'wrench',
        spear: 'spear',
        fan: 'fan'
      };

      data.marketItems.forEach(good => {
        const card = document.createElement('div');
        card.className = 'good-card';

        // 区分武器与道具
        const isWeapon = 'isWeapon' in good;
        
        let qualityName = 'white';
        let desc = '';
        let iconHtml = '';
        let tagsHtml = '';

        if (isWeapon) {
          const key = weaponKeys[good.id] || 'stick';
          qualityName = ['','white','green','blue','purple','red'][good.quality];
          desc = `拥有 6 个空槽，可拖拽升级。${WEAPON_DATABASE[good.id as WeaponId]?.mythicDesc || ''}`;
          iconHtml = `<img src="assets/icons/${key}.png" style="width: 32px; height: 32px; object-fit: contain;" />`;

          const tags = WEAPON_DATABASE[good.id as WeaponId]?.tags || [];
          if (tags.length > 0) {
            tagsHtml = `<div style="display:flex; gap: 4px; margin-top: 4px; margin-bottom: 4px; flex-wrap: wrap;">` + 
              tags.map((t: string) => `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(0,0,0,0.3); border-radius: 4px; color: #fff;">${t}</span>`).join('') +
              `</div>`;
          }
        } else {
          qualityName = good.quality;
          desc = good.desc;
          const emoji = OverlayManager.itemEmojis[good.id] || '📦';
          iconHtml = `<img src="assets/items/${good.id}.png" style="width: 32px; height: 32px; object-fit: contain;" onerror="this.outerHTML='<span style=\\'font-size: 1.5rem;\\'>${emoji}</span>'" />`;
        }

        const qualityColors: Record<string, string> = {
          white: 'var(--q1-white)',
          green: 'var(--q2-green)',
          blue: 'var(--q3-blue)',
          purple: 'var(--q4-purple)',
          red: 'var(--q5-red)'
        };

        card.innerHTML = `
          <div class="good-top">
            <div class="good-icon" style="border-color: ${qualityColors[qualityName]}; display: flex; align-items: center; justify-content: center;">${iconHtml}</div>
            <div class="good-details">
              <h4 style="color: ${qualityColors[qualityName]}">${good.name}</h4>
              ${tagsHtml}
              <p>${desc}</p>
            </div>
          </div>
          <button class="btn btn-primary buy-btn" style="padding: 6px 12px; font-size: 0.8rem; align-self: flex-end;">
            🎍 ${good.price} 购买
          </button>
        `;

        // 点击购买
        card.querySelector('.buy-btn')?.addEventListener('click', () => {
          if (isWeapon) {
            this.onShopBuyWeaponCallback(good.id as WeaponId, good.price);
          } else {
            this.onShopBuyItemCallback(good as ItemConfig);
          }
        });

        goodsGrid.appendChild(card);
      });
    }

    // 2. 刷新玩家武器融合槽位 (最多6件)
    const weaponsGrid = document.getElementById('shop-weapons-grid');
    if (weaponsGrid) {
      weaponsGrid.innerHTML = '';
      
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

      for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        const w = data.equippedWeapons[i];

        if (w) {
          slot.className = `weapon-slot active border-q${w.quality}`;
          slot.setAttribute('draggable', 'true');
          slot.setAttribute('data-index', i.toString());
          
          const key = weaponKeys[w.weaponId] || 'stick';
          const qText = ['','白','绿','蓝','紫','红'][w.quality];
          
          slot.innerHTML = `
            <div class="slot-icon" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><img src="assets/icons/${key}.png" style="width: 32px; height: 32px; object-fit: contain;" /></div>
            <div class="slot-quality-dot">${qText}</div>
          `;

          // 拖拽源事件
          slot.addEventListener('dragstart', () => {
            this.dragStartSlotIndex = i;
            slot.style.opacity = '0.5';
          });

          slot.addEventListener('dragend', () => {
            slot.style.opacity = '1.0';
            this.clearDragHover();
          });
        } else {
          slot.className = 'weapon-slot';
          slot.setAttribute('data-index', i.toString());
          slot.innerHTML = `<span class="slot-empty-label">空槽</span>`;
        }

        // 拖拽目标事件
        slot.addEventListener('dragover', (e) => {
          e.preventDefault(); // 允许放置
        });

        slot.addEventListener('dragenter', () => {
          if (this.dragStartSlotIndex !== -1 && this.dragStartSlotIndex !== i) {
            slot.classList.add('drag-over');
          }
        });

        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', () => {
          slot.classList.remove('drag-over');
          if (this.dragStartSlotIndex !== -1 && this.dragStartSlotIndex !== i) {
            this.onShopWeaponMergedCallback(this.dragStartSlotIndex, i);
            this.dragStartSlotIndex = -1;
          }
        });

        weaponsGrid.appendChild(slot);
      }
    }

    // 3. 刷新已拥有道具列表
    const itemsList = document.getElementById('shop-items-list');
    if (itemsList) {
      itemsList.innerHTML = '';
      if (data.purchasedItems.length === 0) {
        itemsList.innerHTML = '<span class="text-muted" style="font-size:0.8rem; padding: 10px;">暂无道具，在集市中购买以激活其被动属性。</span>';
      } else {
        data.purchasedItems.forEach(item => {
          const badge = document.createElement('div');
          
          const qualityColors: Record<string, string> = {
            white: 'var(--q1-white)',
            green: 'var(--q2-green)',
            blue: 'var(--q3-blue)',
            purple: 'var(--q4-purple)'
          };

          badge.className = 'shop-item-badge';
          badge.style.borderColor = qualityColors[item.quality] || 'var(--border-light)';
          badge.innerHTML = `
            <span style="color: ${qualityColors[item.quality]};">●</span>
            <span>${item.name}</span>
          `;
          itemsList.appendChild(badge);
        });
      }
    }
  }

  private clearDragHover() {
    const slots = document.querySelectorAll('.weapon-slot');
    slots.forEach(s => s.classList.remove('drag-over'));
  }

  // =======================================================
  //            游戏结束/结算/复活 界面
  // =======================================================

  /**
   * 显示结算卡片
   */
  public showGameOverScreen(data: {
    isWin: boolean;
    wave: number;
    timeSurvived: number;
    kills: number;
    goldEarned: number;
    canRevive: boolean;
  }) {
    const titleNode = document.getElementById('gameover-title');
    if (titleNode) {
      if (data.isWin) {
        titleNode.innerText = '探险胜利！';
        titleNode.className = 'gameover-header text-gold animate-glow';
      } else {
        titleNode.innerText = '探险中止';
        titleNode.className = 'gameover-header text-red';
      }
    }

    const waveNode = document.getElementById('gameover-wave');
    if (waveNode) waveNode.innerText = data.wave.toString();

    const timeNode = document.getElementById('stat-time');
    if (timeNode) {
      const minutes = Math.floor(data.timeSurvived / 60);
      const seconds = Math.round(data.timeSurvived % 60);
      timeNode.innerText = `${minutes}分 ${seconds}秒`;
    }

    const killsNode = document.getElementById('stat-kills');
    if (killsNode) killsNode.innerText = data.kills.toString();

    const coinsNode = document.getElementById('stat-coins');
    if (coinsNode) coinsNode.innerText = data.goldEarned.toString();

    // 复活按钮判定
    const reviveBtn = document.getElementById('revive-btn') as HTMLButtonElement;
    if (reviveBtn) {
      if (data.canRevive && !data.isWin) {
        reviveBtn.style.display = 'block';
      } else {
        reviveBtn.style.display = 'none';
      }
    }

    this.showScreen('gameover-screen');
  }

  /**
   * 提示弹窗辅助方法
   */
  public toast(message: string, color: string = '#ffd700') {
    const toastNode = document.createElement('div');
    toastNode.style.position = 'absolute';
    toastNode.style.top = '20px';
    toastNode.style.left = '50%';
    toastNode.style.transform = 'translateX(-50%)';
    toastNode.style.background = 'rgba(22, 27, 34, 0.9)';
    toastNode.style.border = `1px solid ${color}`;
    toastNode.style.borderRadius = '8px';
    toastNode.style.padding = '10px 20px';
    toastNode.style.color = '#fff';
    toastNode.style.zIndex = '99999';
    toastNode.style.pointerEvents = 'none';
    toastNode.style.fontSize = '0.9rem';
    toastNode.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
    toastNode.innerText = message;

    document.body.appendChild(toastNode);

    setTimeout(() => {
      toastNode.style.transition = 'opacity 0.5s';
      toastNode.style.opacity = '0';
      setTimeout(() => {
        toastNode.remove();
      }, 500);
    }, 2000);
  }
}
