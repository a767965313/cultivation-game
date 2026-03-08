/**
 * Pills - 丹药效果管理
 * 处理丹药Buff的计时和效果查询
 */

import { gameState } from '../core/GameState.js';
import { eventBus, EVENTS } from '../core/EventBus.js';

export class Pills {
  constructor() {
    this.timer = null;
    this.startTimer();
  }

  // 启动计时器
  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    // 每秒检查一次过期
    this.timer = setInterval(() => {
      this.checkExpired();
    }, 1000);
  }

  // 停止计时器
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // 检查过期丹药
  checkExpired() {
    const activePills = gameState.get('activePills');
    const now = Date.now();
    let hasExpired = false;

    Object.keys(activePills).forEach(effect => {
      if (now > activePills[effect]) {
        delete activePills[effect];
        hasExpired = true;
        
        eventBus.emit(EVENTS.PILL_EXPIRED, { effect });
      }
    });

    if (hasExpired) {
      gameState.set('activePills', { ...activePills });
    }
  }

  // 获取效果倍数
  getEffectMultiplier(type) {
    const activePills = gameState.get('activePills');
    const endTime = activePills[type];

    if (!endTime || Date.now() > endTime) {
      // 清理过期记录
      if (endTime) {
        delete activePills[type];
        gameState.set('activePills', { ...activePills });
      }
      return 1;
    }

    const multipliers = {
      speed: 1.5,   // 疾风丹
      luck: 2,      // 聚灵丹
      xp: 3,        // 破境丹
      merge: 2,     // 提纯丹
      combo: 1.5    // 连击丹
    };

    return multipliers[type] || 1;
  }

  // 获取所有活跃丹药
  getActivePills() {
    const activePills = gameState.get('activePills');
    const now = Date.now();
    const result = [];

    const names = {
      speed: { name: '疾风丹', icon: '💨' },
      luck: { name: '聚灵丹', icon: '✨' },
      xp: { name: '破境丹', icon: '🔮' },
      merge: { name: '提纯丹', icon: '🔥' },
      combo: { name: '连击丹', icon: '⚡' }
    };

    Object.entries(activePills).forEach(([effect, endTime]) => {
      if (now < endTime) {
        result.push({
          effect,
          name: names[effect]?.name || effect,
          icon: names[effect]?.icon || '💊',
          endTime,
          remaining: Math.ceil((endTime - now) / 1000)
        });
      }
    });

    return result.sort((a, b) => a.remaining - b.remaining);
  }

  // 是否有活跃丹药
  hasActivePills() {
    return this.getActivePills().length > 0;
  }

  // 清除所有效果（调试用）
  clearAll() {
    gameState.set('activePills', {});
  }
}

// 导出单例
export const pills = new Pills();
