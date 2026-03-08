/**
 * MergeSystem - 合成系统
 * 处理相邻检测、合并算法
 */

import { CONFIG, ADJACENT, ELEMENTS, generateId } from '../config.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class MergeSystem {
  constructor() {
    this.currentCombo = 0;
  }

  // 查找相连集群
  findCluster(startRow, startCol, item) {
    const visited = new Set();
    const cluster = [];
    const queue = [[startRow, startCol]];
    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
      const [row, col] = queue.shift();
      cluster.push([row, col]);

      for (const [dr, dc] of ADJACENT) {
        const nr = row + dr;
        const nc = col + dc;
        const key = `${nr},${nc}`;

        if (this.isValidPos(nr, nc) && !visited.has(key)) {
          const neighbor = gameState.get('grid')[nr][nc];
          if (neighbor && this.itemsMatch(neighbor, item)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }

    return cluster;
  }

  // 检查位置有效性
  isValidPos(row, col) {
    return row >= 0 && row < CONFIG.GRID_SIZE && col >= 0 && col < CONFIG.GRID_SIZE;
  }

  // 检查物品是否匹配
  itemsMatch(a, b) {
    return a.element === b.element && 
           a.purity === b.purity && 
           a.level === b.level && 
           a.isStone === b.isStone;
  }

  // 执行合并
  performMerge(cluster, item) {
    const count = cluster.length;
    const [targetRow, targetCol] = cluster[0];
    const grid = gameState.get('grid');

    // 清除合并的格子
    for (let i = 1; i < cluster.length; i++) {
      const [r, c] = cluster[i];
      grid[r][c] = null;
    }

    // 更新挑战事件
    this.updateChallengeEvents(count);

    // 计算倍数
    let multiplier = this.calculateMultiplier(count);

    // 生成新物品
    const newItem = this.createMergedItem(item, multiplier, count);

    // 放置新物品
    grid[targetRow][targetCol] = newItem;
    gameState.set('grid', [...grid]);

    // 更新统计
    this.updateStats(newItem, count);

    // 触发事件
    eventBus.emit(EVENTS.MERGE_COMPLETED, {
      count,
      newItem,
      position: [targetRow, targetCol]
    });

    // 连锁合成检查
    this.checkChainReaction(targetRow, targetCol);

    return newItem;
  }

  // 计算合成倍数
  calculateMultiplier(count) {
    let multiplier = count;
    
    // 工坊加成
    const mergeBoost = gameState.get('shopLevels').merge_boost;
    if (mergeBoost > 0) {
      multiplier *= (1 + mergeBoost * 0.1);
    }

    // 5个以上额外加成
    if (count >= 5) {
      multiplier *= 1.5;
    }

    // 丹药加成
    const pillMultiplier = this.getPillEffect('merge');
    multiplier *= pillMultiplier;

    return multiplier;
  }

  // 获取丹药效果
  getPillEffect(type) {
    const activePills = gameState.get('activePills');
    const endTime = activePills[type];
    
    if (!endTime || Date.now() > endTime) {
      if (endTime) {
        delete activePills[type];
        gameState.set('activePills', { ...activePills });
      }
      return 1;
    }

    const effects = { speed: 1.5, luck: 2, xp: 3, merge: 2, combo: 1.5 };
    return effects[type] || 1;
  }

  // 创建合并后的物品
  createMergedItem(item, multiplier, count) {
    // 灵石升级
    if (item.isStone) {
      const levelUp = Math.floor(count / 3);
      return gameState.createStone(item.element, item.level + levelUp);
    }

    // 灵气提纯
    const newPurity = Math.min(100, Math.floor(item.purity * multiplier));
    
    if (newPurity >= 100) {
      // 转化为灵石
      return gameState.createStone(item.element, 1);
    }

    // 保持灵气状态
    return {
      id: generateId(),
      type: 'qi',
      element: item.element,
      purity: newPurity,
      level: 0,
      isStone: false
    };
  }

  // 更新统计
  updateStats(newItem, count) {
    // 增加合成计数
    const mergeCount = gameState.get('mergeCount') + 1;
    gameState.set('mergeCount', mergeCount);

    // 更新最大等级
    if (newItem.isStone && newItem.level > gameState.get('maxLevel')) {
      gameState.set('maxLevel', newItem.level);
    }

    // 灵石生成计数
    if (newItem.isStone && newItem.level === 1) {
      const stoneCount = gameState.get('stoneCount') + 1;
      gameState.set('stoneCount', stoneCount);
    }

    // 连击计数
    this.currentCombo++;
    const challengeEvents = gameState.get('challengeEvents');
    if (this.currentCombo > challengeEvents.maxCombo) {
      challengeEvents.maxCombo = this.currentCombo;
      gameState.set('challengeEvents', { ...challengeEvents });
    }
  }

  // 更新挑战事件
  updateChallengeEvents(count) {
    const challengeEvents = gameState.get('challengeEvents');
    
    if (count > challengeEvents.maxMergeSize) {
      challengeEvents.maxMergeSize = count;
    }

    gameState.set('challengeEvents', { ...challengeEvents });
  }

  // 连锁反应检查
  checkChainReaction(row, col) {
    const comboChance = 0.3 * this.getPillEffect('combo');
    
    if (Math.random() < comboChance) {
      setTimeout(() => {
        const grid = gameState.get('grid');
        const item = grid[row][col];
        if (item) {
          const cluster = this.findCluster(row, col, item);
          if (cluster.length >= 3) {
            this.performMerge(cluster, item);
          } else {
            this.currentCombo = 0;
          }
        }
      }, 400);
    } else {
      this.currentCombo = 0;
    }
  }

  // 检查指定位置是否可以合并
  checkMerge(row, col) {
    const grid = gameState.get('grid');
    const item = grid[row][col];
    
    if (!item) return false;

    const cluster = this.findCluster(row, col, item);
    
    if (cluster.length >= 3) {
      this.performMerge(cluster, item);
      return true;
    }

    return false;
  }
}

// 导出单例
export const mergeSystem = new MergeSystem();
