/**
 * EventBus - 事件总线
 * 实现模块间的解耦通信
 */

export class EventBus {
  constructor() {
    this.events = {};
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  // 发布事件
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus error in ${event}:`, error);
      }
    });
  }

  // 一次性订阅
  once(event, callback) {
    const onceCallback = (data) => {
      this.off(event, onceCallback);
      callback(data);
    };
    this.on(event, onceCallback);
  }
}

// 导出单例实例
export const eventBus = new EventBus();

// 预定义的事件类型
export const EVENTS = {
  // 游戏状态
  GAME_STATE_CHANGE: 'game:state:change',
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  
  // 合成系统
  STONE_CREATED: 'stone:created',
  MERGE_COMPLETED: 'merge:completed',
  GRID_UPDATED: 'grid:updated',
  
  // 库存
  INVENTORY_CHANGE: 'inventory:change',
  ITEM_SELECTED: 'item:selected',
  
  // 修为
  REALM_BREAKTHROUGH: 'realm:breakthrough',
  XP_GAINED: 'xp:gained',
  
  // 挑战
  CHALLENGE_START: 'challenge:start',
  CHALLENGE_COMPLETE: 'challenge:complete',
  
  // 商店
  ITEM_PURCHASED: 'shop:item:purchased',
  
  // 丹药
  PILL_CRAFTED: 'pill:crafted',
  PILL_EXPIRED: 'pill:expired',
  
  // UI
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close',
  TOAST_SHOW: 'ui:toast:show'
};
