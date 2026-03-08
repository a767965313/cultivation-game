/**
 * SaveManager - 存档管理器
 * 处理多槽位存档的存取、导入导出
 */

import { CONFIG } from '../config.js';
import { eventBus, EVENTS } from './EventBus.js';
import { gameState } from './GameState.js';

export class SaveManager {
  constructor() {
    this.settings = this.loadSettings();
  }

  // 默认设置
  getDefaultSettings() {
    return {
      currentSlot: 0,
      slotNames: ['自动存档', '存档 2', '存档 3'],
      slotExists: [false, false, false],
      version: CONFIG.VERSION
    };
  }

  // 加载设置
  loadSettings() {
    try {
      const saved = localStorage.getItem(CONFIG.SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 版本检查
        if (parsed.version !== CONFIG.VERSION) {
          console.log('存档版本升级:', parsed.version, '->', CONFIG.VERSION);
        }
        return { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
    return this.getDefaultSettings();
  }

  // 保存设置
  saveSettings() {
    localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(this.settings));
  }

  // 获取存档key
  getSlotKey(slotIndex) {
    return CONFIG.SAVE_KEY_PREFIX + slotIndex;
  }

  // 检查存档是否存在
  slotExists(slotIndex) {
    return localStorage.getItem(this.getSlotKey(slotIndex)) !== null;
  }

  // 加载存档
  loadSlot(slotIndex) {
    const key = this.getSlotKey(slotIndex);
    const saved = localStorage.getItem(key);

    if (saved) {
      gameState.deserialize(saved);
      this.settings.slotExists[slotIndex] = true;
    } else {
      gameState.reset();
      this.settings.slotExists[slotIndex] = false;
    }

    this.settings.currentSlot = slotIndex;
    this.saveSettings();

    eventBus.emit(EVENTS.GAME_LOAD, { slotIndex, exists: this.settings.slotExists[slotIndex] });
    
    return this.settings.slotExists[slotIndex];
  }

  // 保存到槽位
  saveToSlot(slotIndex) {
    const serialized = gameState.serialize();
    localStorage.setItem(this.getSlotKey(slotIndex), serialized);
    
    this.settings.slotExists[slotIndex] = true;
    this.saveSettings();

    eventBus.emit(EVENTS.GAME_SAVE, { slotIndex });
    
    return true;
  }

  // 保存到当前槽位
  saveCurrent() {
    return this.saveToSlot(this.settings.currentSlot);
  }

  // 删除存档
  deleteSlot(slotIndex) {
    localStorage.removeItem(this.getSlotKey(slotIndex));
    this.settings.slotExists[slotIndex] = false;
    this.settings.slotNames[slotIndex] = `存档 ${slotIndex + 1}`;
    this.saveSettings();

    // 如果删除的是当前槽位，重置游戏
    if (this.settings.currentSlot === slotIndex) {
      gameState.reset();
    }

    return true;
  }

  // 重命名存档
  renameSlot(slotIndex, name) {
    this.settings.slotNames[slotIndex] = name || `存档 ${slotIndex + 1}`;
    this.saveSettings();
    return true;
  }

  // 切换槽位
  switchSlot(slotIndex) {
    if (slotIndex === this.settings.currentSlot) return false;
    
    // 自动保存当前
    if (this.settings.slotExists[this.settings.currentSlot]) {
      this.saveCurrent();
    }
    
    // 加载新槽位
    this.loadSlot(slotIndex);
    return true;
  }

  // 导出存档
  exportSlot(slotIndex) {
    const key = this.getSlotKey(slotIndex);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const exportData = {
      ...JSON.parse(data),
      slotName: this.settings.slotNames[slotIndex],
      exportVersion: CONFIG.VERSION,
      exportTime: new Date().toISOString()
    };
    
    return btoa(JSON.stringify(exportData));
  }

  // 导入存档
  importSlot(slotIndex, encodedData) {
    try {
      const data = JSON.parse(atob(encodedData));
      
      // 保存到指定槽位
      localStorage.setItem(this.getSlotKey(slotIndex), JSON.stringify(data));
      
      this.settings.slotExists[slotIndex] = true;
      if (data.slotName) {
        this.settings.slotNames[slotIndex] = data.slotName;
      }
      this.saveSettings();

      // 如果导入的是当前槽位，重新加载
      if (slotIndex === this.settings.currentSlot) {
        this.loadSlot(slotIndex);
      }

      return { success: true, slotName: data.slotName };
    } catch (e) {
      console.error('导入失败:', e);
      return { success: false, error: e.message };
    }
  }

  // 获取所有槽位信息
  getSlotsInfo() {
    return Array.from({ length: CONFIG.MAX_SLOTS }, (_, i) => ({
      index: i,
      name: this.settings.slotNames[i],
      exists: this.settings.slotExists[i],
      isCurrent: i === this.settings.currentSlot
    }));
  }

  // 获取当前槽位
  getCurrentSlot() {
    return this.settings.currentSlot;
  }
}

// 导出单例
export const saveManager = new SaveManager();
