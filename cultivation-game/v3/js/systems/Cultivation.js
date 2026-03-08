/**
 * Cultivation - 修为系统
 * 处理境界突破、经验计算
 */

import { REALMS } from '../config.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Cultivation {
  constructor() {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // 监听灵石创建事件，自动记录到图鉴
    eventBus.on(EVENTS.STONE_CREATED, ({ element, level }) => {
      this.addToCollection(element, level);
    });
  }

  // 获取当前境界信息
  getCurrentRealm() {
    const realmIndex = gameState.get('realmIndex');
    return REALMS[realmIndex];
  }

  // 获取当前阶段
  getCurrentStage() {
    const realm = this.getCurrentRealm();
    const stageIndex = gameState.get('stageIndex');
    return realm.stages[stageIndex];
  }

  // 获取升级所需经验
  getMaxXP() {
    return this.getCurrentRealm().xpPerStage;
  }

  // 获取当前经验进度（百分比）
  getProgressPercent() {
    const currentXP = gameState.get('currentXP');
    const maxXP = this.getMaxXP();
    return Math.floor((currentXP / maxXP) * 100);
  }

  // 获取境界加成百分比
  getBonusPercent() {
    return this.getCurrentRealm().bonus;
  }

  // 吸收灵石获得修为
  absorbStones(stones) {
    if (!stones || stones.length === 0) {
      return { success: false, message: '没有可吸收的灵石' };
    }

    // 计算总经验
    let totalXP = stones.reduce((sum, stone) => sum + stone.level * 10, 0);

    // 丹药加成
    totalXP = Math.floor(totalXP * this.getPillEffect('xp'));

    // 工坊加成
    const xpBoost = gameState.get('shopLevels').xp_boost;
    if (xpBoost > 0) {
      totalXP = Math.floor(totalXP * (1 + xpBoost * 0.2));
    }

    // 执行吸收
    const result = this.addXP(totalXP);

    // 触发事件
    eventBus.emit(EVENTS.XP_GAINED, {
      amount: totalXP,
      stonesCount: stones.length,
      ...result
    });

    return {
      success: true,
      xpGained: totalXP,
      stonesAbsorbed: stones.length,
      ...result
    };
  }

  // 增加经验值
  addXP(amount) {
    let currentXP = gameState.get('currentXP');
    let realmIndex = gameState.get('realmIndex');
    let stageIndex = gameState.get('stageIndex');
    
    let breakthroughs = [];
    currentXP += amount;

    // 检查突破
    while (currentXP >= REALMS[realmIndex].xpPerStage) {
      currentXP -= REALMS[realmIndex].xpPerStage;
      stageIndex++;

      // 阶段突破
      if (stageIndex >= REALMS[realmIndex].stages.length) {
        stageIndex = 0;
        realmIndex++;
        
        // 境界突破
        if (realmIndex < REALMS.length) {
          breakthroughs.push({
            type: 'realm',
            from: REALMS[realmIndex - 1].name,
            to: REALMS[realmIndex].name
          });
          
          eventBus.emit(EVENTS.REALM_BREAKTHROUGH, {
            realm: REALMS[realmIndex],
            bonus: REALMS[realmIndex].bonus
          });
        } else {
          // 已达到最高境界
          realmIndex = REALMS.length - 1;
          currentXP = REALMS[realmIndex].xpPerStage;
          break;
        }
      } else {
        // 阶段突破
        breakthroughs.push({
          type: 'stage',
          realm: REALMS[realmIndex].name,
          stage: REALMS[realmIndex].stages[stageIndex]
        });
      }
    }

    // 更新状态
    gameState.set('currentXP', currentXP);
    gameState.set('realmIndex', realmIndex);
    gameState.set('stageIndex', stageIndex);

    return {
      breakthroughs,
      newRealm: REALMS[realmIndex],
      newStage: REALMS[realmIndex].stages[stageIndex]
    };
  }

  // 获取丹药效果
  getPillEffect(type) {
    const activePills = gameState.get('activePills');
    const endTime = activePills[type];
    
    if (!endTime || Date.now() > endTime) {
      return 1;
    }
    return 3; // 破境丹 3倍效果
  }

  // 添加到图鉴
  addToCollection(element, level) {
    const key = `${element}_${level}`;
    const collection = gameState.get('collection');
    
    if (!collection[key]) {
      collection[key] = {
        count: 0,
        firstTime: Date.now()
      };
    }
    
    collection[key].count++;
    gameState.set('collection', { ...collection });
  }

  // 获取图鉴收集进度
  getCollectionProgress() {
    const collection = gameState.get('collection');
    const total = 45; // 5元素 x 9等级
    const collected = Object.keys(collection).length;
    
    return {
      collected,
      total,
      percent: Math.floor((collected / total) * 100)
    };
  }

  // 检查是否收集完成某元素的所有等级
  isElementComplete(element) {
    const collection = gameState.get('collection');
    for (let level = 1; level <= 9; level++) {
      if (!collection[`${element}_${level}`]) {
        return false;
      }
    }
    return true;
  }
}

// 导出单例
export const cultivation = new Cultivation();
