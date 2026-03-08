/**
 * Collection - 图鉴系统
 * 管理灵石收集进度
 */

import { COLLECTION_ITEMS, ELEMENTS } from '../config.js';
import { gameState } from '../core/GameState.js';

export class Collection {
  // 添加收集记录
  add(element, level) {
    const key = `${element}_${level}`;
    const collection = gameState.get('collection');
    
    const isNew = !collection[key];
    
    if (isNew) {
      collection[key] = {
        count: 1,
        firstTime: Date.now()
      };
    } else {
      collection[key].count++;
    }
    
    gameState.set('collection', { ...collection });
    
    return {
      isNew,
      element,
      level,
      key
    };
  }

  // 检查是否已收集
  has(element, level) {
    const key = `${element}_${level}`;
    const collection = gameState.get('collection');
    return !!collection[key];
  }

  // 获取收集详情
  get(element, level) {
    const key = `${element}_${level}`;
    const collection = gameState.get('collection');
    return collection[key] || null;
  }

  // 获取总收集进度
  getProgress() {
    const collection = gameState.get('collection');
    const collected = Object.keys(collection).length;
    const total = COLLECTION_ITEMS.length;
    
    return {
      collected,
      total,
      percent: Math.floor((collected / total) * 100),
      remaining: total - collected
    };
  }

  // 按元素获取收集进度
  getElementProgress(element) {
    const collection = gameState.get('collection');
    let collected = 0;
    
    for (let level = 1; level <= 9; level++) {
      if (collection[`${element}_${level}`]) {
        collected++;
      }
    }
    
    return {
      element,
      elementName: ELEMENTS[element].name,
      collected,
      total: 9,
      percent: Math.floor((collected / 9) * 100),
      isComplete: collected === 9
    };
  }

  // 获取所有元素的进度
  getAllElementsProgress() {
    const elements = Object.keys(ELEMENTS);
    return elements.map(el => this.getElementProgress(el));
  }

  // 获取已收集的灵石列表
  getCollectedList() {
    const collection = gameState.get('collection');
    return Object.entries(collection).map(([key, data]) => {
      const [element, level] = key.split('_');
      return {
        key,
        element,
        level: parseInt(level),
        elementName: ELEMENTS[element].name,
        icon: ELEMENTS[element].icon,
        count: data.count,
        firstTime: data.firstTime
      };
    }).sort((a, b) => {
      // 按元素和等级排序
      if (a.element !== b.element) {
        return Object.keys(ELEMENTS).indexOf(a.element) - Object.keys(ELEMENTS).indexOf(b.element);
      }
      return a.level - b.level;
    });
  }

  // 获取未收集的灵石列表
  getUncollectedList() {
    const collection = gameState.get('collection');
    const uncollected = [];
    
    COLLECTION_ITEMS.forEach(item => {
      if (!collection[item.id]) {
        uncollected.push({
          ...item,
          elementName: ELEMENTS[item.element].name,
          icon: ELEMENTS[item.element].icon
        });
      }
    });
    
    return uncollected;
  }

  // 获取最近收集的灵石
  getRecentCollected(limit = 5) {
    const list = this.getCollectedList();
    return list
      .sort((a, b) => b.firstTime - a.firstTime)
      .slice(0, limit);
  }

  // 获取收集统计数据
  getStats() {
    const list = this.getCollectedList();
    const totalCount = list.reduce((sum, item) => sum + item.count, 0);
    
    return {
      uniqueCollected: list.length,
      totalCollected: totalCount,
      averagePerItem: list.length > 0 ? (totalCount / list.length).toFixed(1) : 0,
      completeElements: this.getAllElementsProgress().filter(e => e.isComplete).length
    };
  }
}

// 导出单例
export const collection = new Collection();
