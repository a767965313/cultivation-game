/**
 * 修仙合成系统 V3.0 - 主入口
 * 模块化架构，整合所有功能
 */

import { CONFIG, ELEMENT_KEYS, generateId, vibrate, formatTime } from './config.js';
import { eventBus, EVENTS } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { saveManager } from './core/SaveManager.js';
import { mergeSystem } from './systems/MergeSystem.js';
import { cultivation } from './systems/Cultivation.js';
import { shop } from './systems/Shop.js';
import { collection } from './systems/Collection.js';
import { challenge } from './systems/Challenge.js';
import { alchemy } from './systems/Alchemy.js';
import { pills } from './systems/Pills.js';

class CultivationApp {
  constructor() {
    this.selectedItem = null;
    this.autoSaveTimer = null;
    this.playTimeTimer = null;
    this.pillTimer = null;
    
    this.init();
  }

  async init() {
    // 初始化网格
    this.initGrid();
    
    // 加载存档
    saveManager.loadSlot(saveManager.getCurrentSlot());
    
    // 启动商店自动捕捉
    if (gameState.get('shopLevels').auto_capture > 0) {
      shop.startAutoCapture();
    }
    
    // 订阅事件
    this.setupEventListeners();
    
    // 启动定时器
    this.startTimers();
    
    // 初始渲染
    this.renderAll();
  }

  // 初始化网格
  initGrid() {
    const grid = document.getElementById('grid');
    for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', () => this.onCellClick(r, c));
        grid.appendChild(cell);
      }
    }
  }

  // 设置事件监听
  setupEventListeners() {
    // 自动捕捉
    eventBus.on('auto:capture', () => this.capture(1));
    
    // 游戏状态变化
    eventBus.on(EVENTS.GAME_STATE_CHANGE, () => this.renderAll());
    
    // 突破事件
    eventBus.on(EVENTS.REALM_BREAKTHROUGH, ({ realm }) => {
      this.showToast(`🎉 突破至${realm.name}！`);
    });
    
    // 挑战完成
    eventBus.on(EVENTS.CHALLENGE_COMPLETE, ({ challenge }) => {
      this.showToast(`🏆 ${challenge.name} 完成！`);
    });
  }

  // 启动定时器
  startTimers() {
    // 自动保存
    this.autoSaveTimer = setInterval(() => {
      if (saveManager.settings.slotExists[saveManager.getCurrentSlot()]) {
        saveManager.saveCurrent();
      }
    }, CONFIG.AUTO_SAVE_INTERVAL);
    
    // 游戏时长统计
    this.playTimeTimer = setInterval(() => {
      const time = gameState.get('totalPlayTime') + 1;
      gameState.set('totalPlayTime', time);
    }, 1000);
  }

  // ========== 核心玩法 ==========
  
  // 捕捉灵气
  capture(count) {
    vibrate(10);
    
    let actualCount = count;
    
    // 境界加成
    const bonus = cultivation.getBonusPercent();
    actualCount = Math.floor(count * (1 + bonus / 100));
    
    // 聚灵符加成
    const luckyLevel = gameState.get('shopLevels').lucky_charm;
    if (luckyLevel > 0 && Math.random() < luckyLevel * 0.2) {
      actualCount++;
    }
    
    // 丹药加成
    actualCount = Math.floor(actualCount * pills.getEffectMultiplier('luck'));
    
    // 生成灵气
    const inventory = gameState.get('inventory');
    for (let i = 0; i < actualCount; i++) {
      const element = ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
      inventory.push({
        id: generateId(),
        type: 'qi',
        element,
        purity: 10,
        level: 0,
        isStone: false
      });
    }
    
    gameState.set('captureCount', gameState.get('captureCount') + actualCount);
    gameState.set('inventory', [...inventory]);
    
    this.showToast(`获得${actualCount}团灵气！`);
  }

  // 快速捕捉
  quickCapture() {
    this.capture(1);
    vibrate([10, 30, 10]);
  }

  // 格子点击
  onCellClick(row, col) {
    const grid = gameState.get('grid');
    const cellItem = grid[row][col];
    
    // 收回物品
    if (cellItem) {
      const inventory = gameState.get('inventory');
      inventory.push(cellItem);
      grid[row][col] = null;
      gameState.set('inventory', [...inventory]);
      gameState.set('grid', [...grid]);
      return;
    }
    
    // 放置物品
    if (this.selectedItem) {
      const inventory = gameState.get('inventory');
      const idx = inventory.findIndex(i => i.id === this.selectedItem.id);
      
      if (idx > -1) {
        grid[row][col] = this.selectedItem;
        inventory.splice(idx, 1);
        this.selectedItem = null;
        
        gameState.set('inventory', [...inventory]);
        gameState.set('grid', [...grid]);
        
        // 检查合并
        setTimeout(() => {
          if (mergeSystem.checkMerge(row, col)) {
            // 合并成功，检查挑战
            challenge.checkProgress();
          }
        }, 150);
      }
    }
  }

  // 修炼
  cultivate() {
    const inventory = gameState.get('inventory');
    const stones = inventory.filter(i => i.isStone);
    
    if (stones.length === 0) {
      this.showToast('没有可吸收的灵石！');
      return;
    }
    
    const result = cultivation.absorbStones(stones);
    
    if (result.success) {
      // 移除灵石
      gameState.set('inventory', inventory.filter(i => !i.isStone));
      
      // 显示突破信息
      result.breakthroughs.forEach(bt => {
        if (bt.type === 'realm') {
          this.showToast(`🎉 突破至${bt.to}！`);
        }
      });
    }
  }

  // ========== 存档管理 ==========
  
  saveCurrent() {
    saveManager.saveCurrent();
    this.showToast('已保存');
    vibrate([20, 40, 20]);
  }

  switchSlot(index) {
    if (saveManager.switchSlot(index)) {
      this.showToast(`已切换到${saveManager.settings.slotNames[index]}`);
    }
  }

  exportCurrent() {
    const code = saveManager.exportSlot(saveManager.getCurrentSlot());
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast('存档码已复制');
      });
    }
  }

  showImport() {
    const code = prompt('粘贴存档码（格式: 槽位号:存档码）：');
    if (!code) return;
    
    let targetSlot = saveManager.getCurrentSlot();
    let actualCode = code;
    
    if (code.includes(':')) {
      const parts = code.split(':');
      targetSlot = parseInt(parts[0]) - 1;
      actualCode = parts[1];
    }
    
    const result = saveManager.importSlot(targetSlot, actualCode.trim());
    if (result.success) {
      this.showToast('导入成功');
    } else {
      this.showToast('导入失败: ' + result.error);
    }
  }

  // ========== UI 渲染 ==========
  
  renderAll() {
    this.renderSlots();
    this.renderSaveInfo();
    this.renderInventory();
    this.renderGrid();
    this.renderStats();
    this.renderCultivation();
  }

  renderSlots() {
    const container = document.getElementById('saveSlotBar');
    const slots = saveManager.getSlotsInfo();
    
    container.innerHTML = slots.map((slot, i) => `
      <div class="save-slot ${slot.isCurrent ? 'active' : ''} ${!slot.exists ? 'empty' : ''}" onclick="app.switchSlot(${i})">
        <span class="slot-number">#${i + 1}</span>
        <span class="slot-name">${slot.name}</span>
      </div>
    `).join('');
  }

  renderSaveInfo() {
    const realm = cultivation.getCurrentRealm();
    const time = formatTime(gameState.get('totalPlayTime'));
    
    document.getElementById('saveInfoPanel').innerHTML = `
      <div class="save-info-header">
        <span class="save-info-title">📊 当前进度</span>
        <span class="save-info-time">${gameState.get('lastSaveTime') || '未保存'}</span>
      </div>
      <div class="save-stats-grid">
        <div class="save-stat-item"><div class="save-stat-value">${realm.name.replace('期', '')}</div><div class="save-stat-label">境界</div></div>
        <div class="save-stat-item"><div class="save-stat-value">${time}</div><div class="save-stat-label">游戏时长</div></div>
        <div class="save-stat-item"><div class="save-stat-value">${gameState.get('stoneCount')}</div><div class="save-stat-label">灵石</div></div>
      </div>
    `;
  }

  renderInventory() {
    const container = document.getElementById('inventory');
    const inventory = gameState.get('inventory');
    
    if (inventory.length === 0) {
      container.innerHTML = '<div style="padding:10px;color:#666;font-size:10px;">点击捕捉灵气</div>';
      return;
    }
    
    container.innerHTML = inventory.map(item => {
      const element = { gold: { icon: '⚔️' }, wood: { icon: '🌿' }, water: { icon: '💧' }, fire: { icon: '🔥' }, earth: { icon: '🏔️' } }[item.element];
      return `
        <div class="inventory-item ${this.selectedItem?.id === item.id ? 'selected' : ''}" onclick="app.selectItem('${item.id}')">
          <span class="item-icon">${element.icon}</span>
          <span class="item-info">${item.isStone ? `Lv.${item.level}` : `${item.purity}%`}</span>
        </div>
      `;
    }).join('');
  }

  selectItem(id) {
    const inventory = gameState.get('inventory');
    const item = inventory.find(i => i.id === id);
    
    if (this.selectedItem?.id === id) {
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    
    this.renderInventory();
    vibrate(10);
  }

  renderGrid() {
    const cells = document.querySelectorAll('.grid-cell');
    const grid = gameState.get('grid');
    
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const item = grid[r][c];
      
      cell.innerHTML = '';
      if (item) {
        const element = { gold: { icon: '⚔️' }, wood: { icon: '🌿' }, water: { icon: '💧' }, fire: { icon: '🔥' }, earth: { icon: '🏔️' } }[item.element];
        cell.innerHTML = `
          <div class="cell-content element-${item.element}">
            ${element.icon}
            ${!item.isStone ? `<span class="cell-purity">${item.purity}%</span>` : ''}
            ${item.isStone ? `<span class="cell-level">${item.level}</span>` : ''}
          </div>
        `;
      }
    });
  }

  renderStats() {
    document.getElementById('captureCount').textContent = gameState.get('captureCount');
    document.getElementById('mergeCount').textContent = gameState.get('mergeCount');
    document.getElementById('stoneCount').textContent = gameState.get('stoneCount');
    document.getElementById('maxLevel').textContent = gameState.get('maxLevel');
  }

  renderCultivation() {
    const realm = cultivation.getCurrentRealm();
    const stage = cultivation.getCurrentStage();
    const pct = cultivation.getProgressPercent();
    
    document.getElementById('realmName').textContent = realm.name;
    document.getElementById('realmStage').textContent = stage;
    document.getElementById('xpBar').style.width = pct + '%';
  }

  // ========== 模态框 ==========
  
  showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('mainModal').classList.add('active');
  }

  closeModal() {
    document.getElementById('mainModal').classList.remove('active');
  }

  // 工坊面板
  showShop() {
    const items = shop.getAllItems();
    let html = `
      <div class="currency-display" style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span>💎 ${gameState.get('stoneCount')}</span>
        <span>⚡ ${gameState.get('mergeCount')}</span>
      </div>
    `;
    
    items.forEach(item => {
      html += `
        <div class="shop-item" style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-weight:bold;color:#ffd700;">${item.name}</span>
            <span style="font-size:10px;color:#38ef7d;">${item.isMaxed ? '满级' : item.price + (item.priceType === 'stone' ? '💎' : '⚡')}</span>
          </div>
          <div style="font-size:10px;color:#aaa;margin-bottom:6px;">${item.desc}</div>
          <button class="btn ${item.canBuy ? 'btn-success' : ''}" style="width:100%;" onclick="app.buyShopItem('${item.id}')" ${!item.canBuy ? 'disabled' : ''}>
            ${item.isMaxed ? '已满级' : (item.currentLevel === 0 ? '购买' : `升级 Lv.${item.currentLevel + 1}`)}
          </button>
        </div>
      `;
    });
    
    this.showModal('🏪 灵气工坊', html);
  }

  buyShopItem(itemId) {
    const result = shop.purchase(itemId);
    if (result.success) {
      this.showToast(`${result.item.name} 升级成功！`);
      this.showShop(); // 刷新面板
    } else {
      this.showToast(result.message);
    }
  }

  // 图鉴面板
  showCollection() {
    const progress = collection.getProgress();
    let html = `
      <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
          <span>收集进度</span>
          <span>${progress.collected}/${progress.total} (${progress.percent}%)</span>
        </div>
        <div class="progress-bar-container"><div class="progress-bar" style="width:${progress.percent}%"></div></div>
      </div>
    `;
    
    html += '<div class="card-grid">';
    const elements = { gold: { icon: '⚔️', name: '金' }, wood: { icon: '🌿', name: '木' }, water: { icon: '💧', name: '水' }, fire: { icon: '🔥', name: '火' }, earth: { icon: '🏔️', name: '土' } };
    
    for (let level = 1; level <= 9; level++) {
      Object.keys(elements).forEach(elem => {
        const isCollected = collection.has(elem, level);
        html += `
          <div class="card ${isCollected ? 'collected' : 'locked'}">
            <span style="font-size:18px;">${elements[elem].icon}</span>
            <span style="font-size:9px;color:#ffd700;">${level}级</span>
          </div>
        `;
      });
    }
    html += '</div>';
    
    this.showModal('📚 图鉴系统', html);
  }

  // 挑战面板
  showChallenge() {
    const challenges = challenge.getAllChallenges();
    let html = '<div style="max-height:300px;overflow-y:auto;">';
    
    challenges.forEach(c => {
      html += `
        <div class="challenge-item ${c.isCompleted ? 'completed' : ''} ${c.isActive ? 'active' : ''}" 
             style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer;${c.isActive ? 'border:1px solid #ff416c;' : ''}"
             onclick="app.startChallenge('${c.id}')">
          <div style="font-weight:bold;color:#ff9a44;margin-bottom:2px;">${c.name} ${c.isCompleted ? '✅' : ''} ${c.isActive ? '(进行中)' : ''}</div>
          <div style="font-size:10px;color:#aaa;margin-bottom:4px;">${c.desc}</div>
          <div style="font-size:10px;color:#ffd700;">奖励: ${c.reward} · 难度: ${c.difficulty}</div>
        </div>
      `;
    });
    html += '</div>';
    
    this.showModal('🏆 挑战模式', html);
  }

  startChallenge(challengeId) {
    const result = challenge.start(challengeId);
    if (result.success) {
      this.closeModal();
      this.showToast(`${result.challenge.name} 开始！`);
    } else {
      this.showToast(result.message);
    }
  }

  // 炼丹面板
  showAlchemy() {
    const recipes = alchemy.getAllRecipes();
    let html = '<div style="max-height:300px;overflow-y:auto;">';
    
    recipes.forEach(r => {
      html += `
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-weight:bold;color:#00d2ff;">${r.icon} ${r.name}</span>
            <span style="font-size:10px;color:#aaa;">${r.duration}秒</span>
          </div>
          <div style="font-size:10px;color:#ccc;margin-bottom:4px;">${r.desc}</div>
          <div style="font-size:10px;color:#ffd700;margin-bottom:6px;">消耗: ${r.cost.stone} 💎</div>
          <button class="btn ${r.canAfford && !r.isActive ? 'btn-info' : ''}" style="width:100%;" onclick="app.craftPill('${r.id}')" ${!r.canAfford || r.isActive ? 'disabled' : ''}>
            ${r.isActive ? `生效中 (${r.remainingTime}秒)` : '炼制'}
          </button>
        </div>
      `;
    });
    html += '</div>';
    
    this.showModal('⚗️ 炼丹炉', html);
  }

  craftPill(recipeId) {
    const result = alchemy.craft(recipeId);
    if (result.success) {
      this.showToast(`${result.recipe.name} 生效！`);
      this.showAlchemy();
    } else {
      this.showToast(result.message);
    }
  }

  // 存档管理面板
  showSlotManager() {
    const slots = saveManager.getSlotsInfo();
    let html = '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:15px;">';
    
    slots.forEach(slot => {
      const saved = localStorage.getItem(saveManager.getSlotKey(slot.index));
      let info = { exists: false, realm: '--', time: '空槽位' };
      if (saved) {
        const data = JSON.parse(saved);
        const realm = { name: '炼气期' };
        info = { exists: true, realm: realm.name.replace('期', ''), time: data.lastSaveTime || '未知' };
      }
      
      html += `
        <div style="background:rgba(255,255,255,0.05);border:2px solid ${slot.isCurrent ? '#667eea' : 'rgba(255,255,255,0.1)'};border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;">
          <div style="font-size:28px;">${info.exists ? '💾' : '📂'}</div>
          <div style="flex:1;">
            <div style="font-weight:bold;">${slot.name}</div>
            <div style="font-size:10px;color:#888;">${info.realm} · ${info.time}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    html += `
      <div style="margin-bottom:15px;">
        <label style="display:block;font-size:12px;color:#888;margin-bottom:5px;">重命名当前存档</label>
        <input type="text" id="renameInput" value="${saveManager.settings.slotNames[saveManager.getCurrentSlot()]}" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#fff;">
      </div>
      <button class="btn btn-primary" style="width:100%;margin-bottom:10px;" onclick="app.renameSlot()">✏️ 重命名</button>
      <button class="btn btn-danger" style="width:100%;" onclick="app.deleteSlot()">🗑️ 删除此存档</button>
    `;
    
    this.showModal('📂 存档管理', html);
  }

  renameSlot() {
    const name = document.getElementById('renameInput').value.trim();
    if (name) {
      saveManager.renameSlot(saveManager.getCurrentSlot(), name);
      this.showToast('重命名成功');
      this.closeModal();
      this.renderSlots();
    }
  }

  deleteSlot() {
    if (confirm('确定要删除当前存档吗？')) {
      saveManager.deleteSlot(saveManager.getCurrentSlot());
      this.showToast('存档已删除');
      this.closeModal();
      this.renderAll();
    }
  }

  // Toast
  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2500);
  }
}

// 导出全局实例
window.app = new CultivationApp();
