/**
 * 游戏配置 - 所有常量定义
 * V3 模块化架构
 */

// 游戏配置
export const CONFIG = {
  GRID_SIZE: 8,
  INITIAL_QI_COUNT: 10,
  SAVE_KEY_PREFIX: 'cultivation_v3_slot_',
  SETTINGS_KEY: 'cultivation_v3_settings',
  AUTO_SAVE_INTERVAL: 30000,
  MAX_SLOTS: 3,
  VERSION: '3.0.0'
};

// 相邻方向定义
export const ADJACENT = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// 境界体系
export const REALMS = [
  { name: '炼气期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 100, bonus: 0 },
  { name: '筑基期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 200, bonus: 10 },
  { name: '金丹期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 400, bonus: 25 },
  { name: '元婴期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 800, bonus: 50 },
  { name: '化神期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 1600, bonus: 80 },
  { name: '炼虚期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 3200, bonus: 120 },
  { name: '合体期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 6400, bonus: 170 },
  { name: '大乘期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 12800, bonus: 230 },
  { name: '渡劫期', stages: ['前期', '中期', '后期', '大圆满'], xpPerStage: 25600, bonus: 300 }
];

// 五行元素
export const ELEMENTS = {
  gold: { name: '金', icon: '⚔️', color: 'element-gold' },
  wood: { name: '木', icon: '🌿', color: 'element-wood' },
  water: { name: '水', icon: '💧', color: 'element-water' },
  fire: { name: '火', icon: '🔥', color: 'element-fire' },
  earth: { name: '土', icon: '🏔️', color: 'element-earth' }
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS);

// 工坊商品
export const SHOP_ITEMS = [
  { id: 'auto_capture', name: '🤖 自动捕捉', basePrice: 5, priceType: 'stone', desc: '自动捕捉灵气', maxLevel: 5 },
  { id: 'merge_boost', name: '⚡ 合成加速', basePrice: 10, priceType: 'stone', desc: '合成品质加成', maxLevel: 5 },
  { id: 'xp_boost', name: '📿 修为增幅', basePrice: 100, priceType: 'merge', desc: '修为获取加成', maxLevel: 3 },
  { id: 'lucky_charm', name: '🍀 聚灵符', basePrice: 50, priceType: 'stone', desc: '额外灵气概率', maxLevel: 5 }
];

// 炼丹配方
export const ALCHEMY_RECIPES = [
  { id: 'speed_pill', name: '⚡ 疾风丹', icon: '💨', desc: '合成速度+50%，持续60秒', duration: 60, cost: { stone: 5 }, effect: 'speed' },
  { id: 'luck_pill', name: '🍀 聚灵丹', icon: '✨', desc: '灵气获取+100%，持续90秒', duration: 90, cost: { stone: 8 }, effect: 'luck' },
  { id: 'xp_pill', name: '📿 破境丹', icon: '🔮', desc: '修为获取+200%，持续60秒', duration: 60, cost: { stone: 10 }, effect: 'xp' },
  { id: 'merge_pill', name: '🔥 提纯丹', icon: '🔥', desc: '合成品质+100%，持续45秒', duration: 45, cost: { stone: 12 }, effect: 'merge' },
  { id: 'combo_pill', name: '⚔️ 连击丹', icon: '⚡', desc: '连锁合成概率+50%，持续60秒', duration: 60, cost: { stone: 15 }, effect: 'combo' }
];

// 挑战任务
export const CHALLENGES = [
  { id: 'speed_run_1', name: '⚡ 极速合成', desc: '60秒内合成5颗灵石', difficulty: '简单', timeLimit: 60, check: (s, e) => e.stonesInTime >= 5, reward: '💎 x10' },
  { id: 'big_merge', name: '🔥 极限提纯', desc: '单次合成使用8+灵气', difficulty: '中等', timeLimit: 0, check: (s, e) => e.maxMergeSize >= 8, reward: '💎 x20' },
  { id: 'high_level', name: '👑 高级灵石', desc: '合成一颗5级灵石', difficulty: '困难', timeLimit: 0, check: (s, e) => s.maxLevel >= 5, reward: '⚡ x50' },
  { id: 'speed_run_2', name: '⏱️ 炼金术士', desc: '120秒内合成10颗灵石', difficulty: '困难', timeLimit: 120, check: (s, e) => e.stonesInTime >= 10, reward: '💎 x30' },
  { id: 'element_master', name: '🎯 五行大师', desc: '每种属性至少合成1颗灵石', difficulty: '中等', timeLimit: 0, check: (s, e) => Object.keys(s.collection || {}).length >= 5, reward: '💎 x25' },
  { id: 'combo_master', name: '⚔️ 连击大师', desc: '单次触发3次连锁合成', difficulty: '困难', timeLimit: 0, check: (s, e) => e.maxCombo >= 3, reward: '⚡ x100' }
];

// 生成图鉴数据
export const COLLECTION_ITEMS = [];
ELEMENT_KEYS.forEach(elem => {
  for (let level = 1; level <= 9; level++) {
    COLLECTION_ITEMS.push({ element: elem, level, id: `${elem}_${level}` });
  }
});

// 工具函数
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
}

export function vibrate(ms = 20) {
  if (navigator.vibrate) navigator.vibrate(ms);
}
