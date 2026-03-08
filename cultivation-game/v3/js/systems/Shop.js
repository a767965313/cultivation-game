/**
 * Shop - 灵气工坊系统
 * 处理商品购买和等级管理
 */

import { SHOP_ITEMS } from '../config.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Shop {
  // 获取商品当前价格
  getPrice(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const level = gameState.get('shopLevels')[itemId] || 0;
    return Math.floor(item.basePrice * Math.pow(1.5, level));
  }

  // 检查是否可以购买
  canPurchase(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const currentLevel = gameState.get('shopLevels')[itemId] || 0;
    
    if (currentLevel >= item.maxLevel) {
      return { canBuy: false, reason: '已达最高等级' };
    }

    const price = this.getPrice(itemId);
    const stoneCount = gameState.get('stoneCount');
    const mergeCount = gameState.get('mergeCount');

    if (item.priceType === 'stone' && stoneCount < price) {
      return { canBuy: false, reason: '灵石不足' };
    }

    if (item.priceType === 'merge' && mergeCount < price) {
      return { canBuy: false, reason: '合成点不足' };
    }

    return { canBuy: true, price };
  }

  // 购买商品
  purchase(itemId) {
    const check = this.canPurchase(itemId);
    if (!check.canBuy) {
      return { success: false, message: check.reason };
    }

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const price = check.price;
    const shopLevels = gameState.get('shopLevels');

    // 扣除货币
    if (item.priceType === 'stone') {
      gameState.set('stoneCount', gameState.get('stoneCount') - price);
    } else {
      gameState.set('mergeCount', gameState.get('mergeCount') - price);
    }

    // 升级
    shopLevels[itemId]++;
    gameState.set('shopLevels', { ...shopLevels });

    // 触发事件
    eventBus.emit(EVENTS.ITEM_PURCHASED, {
      itemId,
      item,
      newLevel: shopLevels[itemId]
    });

    // 特殊处理：自动捕捉
    if (itemId === 'auto_capture') {
      this.startAutoCapture();
    }

    return {
      success: true,
      item,
      newLevel: shopLevels[itemId]
    };
  }

  // 获取所有商品信息
  getAllItems() {
    const shopLevels = gameState.get('shopLevels');
    return SHOP_ITEMS.map(item => {
      const currentLevel = shopLevels[item.id] || 0;
      const price = this.getPrice(item.id);
      const check = this.canPurchase(item.id);
      
      return {
        ...item,
        currentLevel,
        price,
        canBuy: check.canBuy,
        reason: check.reason,
        isMaxed: currentLevel >= item.maxLevel
      };
    });
  }

  // 获取特定商品信息
  getItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const currentLevel = gameState.get('shopLevels')[itemId] || 0;
    const price = this.getPrice(itemId);
    const check = this.canPurchase(itemId);

    return {
      ...item,
      currentLevel,
      price,
      canBuy: check.canBuy,
      reason: check.reason,
      isMaxed: currentLevel >= item.maxLevel
    };
  }

  // 启动自动捕捉
  startAutoCapture() {
    const level = gameState.get('shopLevels').auto_capture;
    if (level === 0) return;

    // 清除旧的定时器
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
    }

    // 计算间隔（等级越高，间隔越短）
    const interval = Math.max(2000, (10 - level * 1.5) * 1000);

    this.autoCaptureInterval = setInterval(() => {
      // 触发捕捉事件，由外部处理
      eventBus.emit('auto:capture', { level });
    }, interval);
  }

  // 停止自动捕捉
  stopAutoCapture() {
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
      this.autoCaptureInterval = null;
    }
  }

  // 获取自动捕捉间隔（毫秒）
  getAutoCaptureInterval() {
    const level = gameState.get('shopLevels').auto_capture;
    if (level === 0) return null;
    return Math.max(2000, (10 - level * 1.5) * 1000);
  }
}

// 导出单例
export const shop = new Shop();
