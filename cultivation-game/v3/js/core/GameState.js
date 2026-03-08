/**
 * GameState - 全局状态管理
 * 集中管理游戏状态，支持订阅变化
 */

import { CONFIG, REALMS, generateId } from '../config.js';
import { eventBus, EVENTS } from './EventBus.js';

export class GameState {
  constructor() {
    this.data = this.getDefaultState();
    this.subscribers = new Map();
  }

  getDefaultState() {
    return {
      // 核心游戏数据
      grid: Array(CONFIG.GRID_SIZE).fill(null).map(() => Array(CONFIG.GRID_SIZE).fill(null)),
      inventory: [],
      selectedItem: null,
      
      // 统计
      captureCount: 0,
      mergeCount: 0,
      stoneCount: 0,
      maxLevel: 0,
      
      // 修为
      realmIndex: 0,
      stageIndex: 0,
      currentXP: 0,
      
      // 时间
      startTime: Date.now(),
      totalPlayTime: 0,
      lastSaveTime: null,
      
      // V1.2 工坊
      shopLevels: { auto_capture: 0, merge_boost: 0, xp_boost: 0, lucky_charm: 0 },
      
      // V1.3 图鉴
      collection: {},
      
      // V1.4 挑战
      challengeProgress: {},
      currentChallenge: null,
      challengeEvents: { stonesInTime: 0, maxMergeSize: 0, maxCombo: 0 },
      
      // V1.5 丹药
      activePills: {}
    };
  }

  // 获取状态
  get(key) {
    return key ? this.data[key] : this.data;
  }

  // 设置状态
  set(key, value) {
    const oldValue = this.data[key];
    this.data[key] = value;
    
    // 通知订阅者
    this.notify(key, value, oldValue);
    
    // 全局事件
    eventBus.emit(EVENTS.GAME_STATE_CHANGE, { key, value, oldValue });
    
    return value;
  }

  // 批量设置
  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  // 订阅状态变化
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    // 返回取消订阅函数
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  // 通知订阅者
  notify(key, newValue, oldValue) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb(newValue, oldValue));
    }
  }

  // 重置状态
  reset() {
    this.data = this.getDefaultState();
    // 初始化库存
    for (let i = 0; i < CONFIG.INITIAL_QI_COUNT; i++) {
      this.data.inventory.push(this.createQiItem());
    }
    eventBus.emit(EVENTS.GAME_STATE_CHANGE, { type: 'reset' });
  }

  // 创建灵气物品
  createQiItem(element) {
    const { ELEMENT_KEYS } = await import('../config.js');
    const el = element || ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
    return { id: generateId(), type: 'qi', element: el, purity: 10, level: 0, isStone: false };
  }

  // 创建灵石
  createStone(element, level) {
    return { id: generateId(), type: 'stone', element, purity: 100, level, isStone: true };
  }

  // 序列化（用于存档）
  serialize() {
    return JSON.stringify({
      ...this.data,
      totalPlayTime: this.data.totalPlayTime + Math.floor((Date.now() - this.data.startTime) / 1000)
    });
  }

  // 反序列化（用于读档）
  deserialize(json) {
    const data = JSON.parse(json);
    this.data = { ...this.getDefaultState(), ...data, startTime: Date.now() };
    eventBus.emit(EVENTS.GAME_STATE_CHANGE, { type: 'load' });
  }

  // 获取当前境界
  getCurrentRealm() {
    return REALMS[this.data.realmIndex];
  }

  // 获取最大修为
  getMaxXP() {
    return this.getCurrentRealm().xpPerStage;
  }
}

// 导出单例实例
export const gameState = new GameState();
