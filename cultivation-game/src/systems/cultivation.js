/**
 * 修炼突破系统 - Cultivation System
 * 负责灵石转化修为、境界突破的核心逻辑
 * @module cultivation
 */

import { STONE_CHAIN, getStone } from '../data/stone-chain.js';
import { REALMS, getRealm, getRealmStage, calculateBreakthroughXP } from '../data/realms.js';

// ==================== 内部状态 ====================

/**
 * 修炼状态
 * @typedef {Object} CultivationState
 * @property {number} xp - 当前修为值
 * @property {number} realm - 当前境界ID (0-8)
 * @property {number} stage - 当前阶段 (0-3)
 * @property {Object} lastResult - 上次修炼结果
 */
const state = {
    xp: 0,              // 当前修为
    realm: 0,           // 当前境界ID
    stage: 0,           // 当前阶段
    lastResult: null,   // 上次吸收结果
    breakthroughHistory: [] // 突破历史记录
};

/**
 * 突破奖励配置
 * 每个境界突破时解锁的内容
 */
const BREAKTHROUGH_REWARDS = {
    // 炼气期 → 筑基期
    '0_3': {
        unlockShopItems: ['基础功法', '低阶丹方'],
        title: '初入仙途',
        bonusStats: { maxHP: 50, maxMP: 30 }
    },
    // 筑基期 → 金丹期
    '1_3': {
        unlockShopItems: ['御剑术', '中阶丹方'],
        title: '丹成一品',
        bonusStats: { maxHP: 100, maxMP: 80, fly: true }
    },
    // 金丹期 → 元婴期
    '2_3': {
        unlockShopItems: ['元婴秘法', '高阶丹方', '夺舍之术'],
        title: '元婴初成',
        bonusStats: { maxHP: 200, maxMP: 150, reincarnation: true }
    },
    // 元婴期 → 化神期
    '3_3': {
        unlockShopItems: ['神识修炼法', '法则感悟'],
        title: '神识大成',
        bonusStats: { maxHP: 350, maxMP: 300, divineSense: true }
    },
    // 化神期 → 炼虚期
    '4_3': {
        unlockShopItems: ['虚空炼体', '大道碎片'],
        title: '触摸大道',
        bonusStats: { maxHP: 500, maxMP: 500 }
    },
    // 炼虚期 → 合体期
    '5_3': {
        unlockShopItems: ['小世界开辟术', '合体秘典'],
        title: '天人合一',
        bonusStats: { maxHP: 800, maxMP: 800, smallWorld: true }
    },
    // 合体期 → 大乘期
    '6_3': {
        unlockShopItems: ['大乘真经', '真仙遗物'],
        title: '半步真仙',
        bonusStats: { maxHP: 1200, maxMP: 1200 }
    },
    // 大乘期 → 渡劫期
    '7_3': {
        unlockShopItems: ['渡劫指南', '避雷法宝'],
        title: '天劫加身',
        bonusStats: { maxHP: 2000, maxMP: 2000, tribulation: true }
    },
    // 渡劫期大圆满 - 飞升
    '8_3': {
        unlockShopItems: ['飞升之路', '仙界地图'],
        title: '飞升仙界',
        bonusStats: { maxHP: 5000, maxMP: 5000, ascended: true },
        special: 'game_complete'
    }
};

/**
 * 阶段突破奖励（同境界内）
 */
const STAGE_REWARDS = {
    0: { bonusStats: { hp: 10, mp: 5 } },      // 前期→中期
    1: { bonusStats: { hp: 15, mp: 8 } },      // 中期→后期
    2: { bonusStats: { hp: 20, mp: 10 } },     // 后期→大圆满
    3: { bonusStats: { hp: 30, mp: 15 } }      // 大圆满→下一境界
};

// ==================== 核心功能函数 ====================

/**
 * 从库存中筛选可吸收的灵石（level >= 1）
 * @param {Object} inventory - 库存对象 { itemId: quantity }
 * @returns {Array<{stone: Object, quantity: number}>} 可吸收的灵石列表
 */
function filterAbsorbableStones(inventory) {
    if (!inventory || typeof inventory !== 'object') {
        return [];
    }

    const absorbable = [];
    
    for (const [itemId, quantity] of Object.entries(inventory)) {
        // 解析 itemId (格式: "stone_1" 表示 level 1 的灵石)
        const match = itemId.match(/^stone_(\d+)$/);
        if (!match) continue;
        
        const level = parseInt(match[1], 10);
        if (level < 1) continue; // 跳过 level 0 (灵气团)
        
        const stone = getStone(level);
        if (stone && quantity > 0) {
            absorbable.push({
                stone,
                quantity,
                itemId
            });
        }
    }
    
    return absorbable;
}

/**
 * 计算总修为值
 * @param {Array<{stone: Object, quantity: number}>} stones - 灵石列表
 * @returns {number} 总修为值
 */
function calculateTotalXP(stones) {
    return stones.reduce((total, { stone, quantity }) => {
        return total + stone.xpValue * quantity;
    }, 0);
}

/**
 * 从库存中移除已吸收的灵石
 * @param {Object} inventory - 原始库存
 * @param {Array<{stone: Object, quantity: number, itemId: string}>} stones - 已吸收的灵石
 * @returns {Object} 更新后的库存
 */
function removeStonesFromInventory(inventory, stones) {
    const newInventory = { ...inventory };
    
    for (const { itemId, quantity } of stones) {
        if (newInventory[itemId] !== undefined) {
            newInventory[itemId] -= quantity;
            if (newInventory[itemId] <= 0) {
                delete newInventory[itemId];
            }
        }
    }
    
    return newInventory;
}

/**
 * 吸收灵石，增加修为
 * @param {Object} inventory - 库存对象
 * @returns {Object} 吸收结果 { xpGained, stonesConsumed, breakthrough, inventory }
 */
function absorbStones(inventory) {
    // 1. 筛选可吸收的灵石
    const absorbableStones = filterAbsorbableStones(inventory);
    
    if (absorbableStones.length === 0) {
        return {
            xpGained: 0,
            stonesConsumed: [],
            breakthrough: false,
            inventory: { ...inventory },
            message: '没有可吸收的灵石'
        };
    }
    
    // 2. 计算总修为值
    const xpGained = calculateTotalXP(absorbableStones);
    
    // 3. 从库存移除
    const newInventory = removeStonesFromInventory(inventory, absorbableStones);
    
    // 4. 记录消耗的石头详情
    const stonesConsumed = absorbableStones.map(({ stone, quantity }) => ({
        name: stone.name,
        level: stone.level,
        quantity,
        xpValue: stone.xpValue * quantity
    }));
    
    // 5. 增加修为
    const previousXP = state.xp;
    state.xp += xpGained;
    
    // 6. 检查是否可突破
    const breakthroughCheck = checkBreakthrough(state.realm, state.stage, state.xp);
    
    // 7. 保存结果
    state.lastResult = {
        xpGained,
        stonesConsumed,
        previousXP,
        currentXP: state.xp,
        breakthrough: breakthroughCheck.canBreakthrough,
        timestamp: Date.now()
    };
    
    return {
        xpGained,
        stonesConsumed,
        breakthrough: breakthroughCheck.canBreakthrough,
        requiredXP: breakthroughCheck.requiredXP,
        currentXP: state.xp,
        inventory: newInventory,
        progress: getProgress()
    };
}

/**
 * 检查是否可以突破
 * @param {number} realm - 当前境界ID
 * @param {number} stage - 当前阶段
 * @param {number} xp - 当前修为值
 * @returns {Object} { canBreakthrough: boolean, requiredXP: number, currentXP: number }
 */
function checkBreakthrough(realm, stage, xp) {
    // 检查是否已达最高境界
    if (realm >= REALMS.length - 1 && stage >= 3) {
        return {
            canBreakthrough: false,
            requiredXP: 0,
            currentXP: xp,
            message: '已达最高境界 - 渡劫期大圆满'
        };
    }
    
    const requiredXP = calculateBreakthroughXP(realm, stage);
    const canBreakthrough = xp >= requiredXP;
    
    return {
        canBreakthrough,
        requiredXP,
        currentXP: xp,
        surplus: canBreakthrough ? xp - requiredXP : 0, // 溢出修为
        progress: Math.min(100, Math.floor((xp / requiredXP) * 100))
    };
}

/**
 * 播放突破动画
 * @param {string} realmName - 境界名称
 * @returns {Promise<void>}
 */
async function playBreakthroughAnimation(realmName) {
    // 检查全局 MergeAnimation 对象
    if (typeof globalThis !== 'undefined' && globalThis.MergeAnimation) {
        await globalThis.MergeAnimation.playBreakthrough(realmName);
    } else if (typeof window !== 'undefined' && window.MergeAnimation) {
        await window.MergeAnimation.playBreakthrough(realmName);
    } else {
        // 降级：只是等待一段时间模拟动画
        console.log(`🎆 突破动画: ${realmName}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

/**
 * 获取当前阶段的突破奖励
 * @param {number} realm - 境界
 * @param {number} stage - 阶段
 * @returns {Object} 奖励对象
 */
function getBreakthroughRewards(realm, stage) {
    const key = `${realm}_${stage}`;
    const rewards = BREAKTHROUGH_REWARDS[key];
    
    if (rewards) {
        return {
            ...rewards,
            stageBonus: STAGE_REWARDS[3] || {}
        };
    }
    
    // 普通阶段突破奖励
    return {
        stageBonus: STAGE_REWARDS[stage] || {}
    };
}

/**
 * 执行突破
 * @returns {Object} 突破结果 { success, newRealm, newStage, rewards, overflowXP }
 */
async function executeBreakthrough() {
    // 1. 检查是否可突破
    const check = checkBreakthrough(state.realm, state.stage, state.xp);
    
    if (!check.canBreakthrough) {
        return {
            success: false,
            message: '修为不足，无法突破',
            requiredXP: check.requiredXP,
            currentXP: check.currentXP
        };
    }

    const oldRealm = state.realm;
    const oldStage = state.stage;
    const oldRealmName = getRealmStage(oldRealm, oldStage).realm;
    
    // 2. 扣除突破所需修为
    state.xp -= check.requiredXP;
    const overflowXP = state.xp; // 溢出修为
    
    // 3. 更新境界/阶段
    let newRealm = oldRealm;
    let newStage = oldStage + 1;
    
    // 如果当前是大圆满(3)，则进入下一境界
    if (oldStage === 3) {
        newRealm = oldRealm + 1;
        newStage = 0;
    }
    
    // 4. 获取新境界信息
    const newRealmData = getRealmStage(newRealm, newStage);
    
    // 5. 播放突破动画
    await playBreakthroughAnimation(newRealmData.realm);
    
    // 6. 更新状态
    state.realm = newRealm;
    state.stage = newStage;
    
    // 7. 获取突破奖励
    const rewards = getBreakthroughRewards(oldRealm, oldStage);
    
    // 8. 记录突破历史
    state.breakthroughHistory.push({
        from: { realm: oldRealm, stage: oldStage, name: oldRealmName },
        to: { realm: newRealm, stage: newStage, name: newRealmData.realm },
        timestamp: Date.now(),
        overflowXP
    });
    
    // 9. 检查溢出修为是否还能继续突破（连环突破）
    const canContinue = checkBreakthrough(newRealm, newStage, state.xp);
    
    return {
        success: true,
        newRealm,
        newStage,
        realmName: newRealmData.realm,
        stageName: newRealmData.stage,
        rewards,
        overflowXP,
        canContinueBreakthrough: canContinue.canBreakthrough,
        description: newRealmData.description
    };
}

// ==================== 公共API ====================

/**
 * 获取当前境界信息
 * @returns {Object} 当前境界信息
 */
function getCurrentRealm() {
    const realmData = getRealmStage(state.realm, state.stage);
    const nextBreakthrough = checkBreakthrough(state.realm, state.stage, state.xp);
    
    return {
        realm: state.realm,
        stage: state.stage,
        realmName: realmData.realm,
        stageName: realmData.stage,
        description: realmData.description,
        xp: state.xp,
        requiredXP: nextBreakthrough.requiredXP,
        progress: nextBreakthrough.progress,
        canBreakthrough: nextBreakthrough.canBreakthrough
    };
}

/**
 * 获取突破进度百分比
 * @returns {number} 0-100
 */
function getProgress() {
    const check = checkBreakthrough(state.realm, state.stage, state.xp);
    return check.progress;
}

/**
 * 检查当前是否可突破
 * @returns {boolean}
 */
function canBreakthrough() {
    const check = checkBreakthrough(state.realm, state.stage, state.xp);
    return check.canBreakthrough;
}

/**
 * 执行突破（同步包装，实际调用异步 executeBreakthrough）
 * @returns {Promise<Object>}
 */
async function breakthrough() {
    return await executeBreakthrough();
}

/**
 * 获取修炼状态快照
 * @returns {Object} 完整状态
 */
function getState() {
    return {
        xp: state.xp,
        realm: state.realm,
        stage: state.stage,
        currentRealm: getCurrentRealm(),
        lastResult: state.lastResult,
        breakthroughCount: state.breakthroughHistory.length
    };
}

/**
 * 设置修炼状态（用于存档加载）
 * @param {Object} savedState - 保存的状态
 */
function setState(savedState) {
    if (savedState.xp !== undefined) state.xp = savedState.xp;
    if (savedState.realm !== undefined) state.realm = savedState.realm;
    if (savedState.stage !== undefined) state.stage = savedState.stage;
    if (savedState.breakthroughHistory) {
        state.breakthroughHistory = savedState.breakthroughHistory;
    }
}

/**
 * 重置修炼状态
 */
function reset() {
    state.xp = 0;
    state.realm = 0;
    state.stage = 0;
    state.lastResult = null;
    state.breakthroughHistory = [];
}

/**
 * 直接增加修为（用于测试或特殊事件）
 * @param {number} amount - 修为值
 */
function addXP(amount) {
    state.xp += amount;
    return {
        xpAdded: amount,
        currentXP: state.xp,
        canBreakthrough: canBreakthrough()
    };
}

/**
 * 获取突破历史
 * @returns {Array} 突破记录
 */
function getBreakthroughHistory() {
    return [...state.breakthroughHistory];
}

// ==================== 导出 ====================

export const CultivationSystem = {
    // 核心功能
    absorb: absorbStones,
    breakthrough,
    canBreakthrough,
    
    // 查询
    getCurrentRealm,
    getProgress,
    getState,
    getBreakthroughHistory,
    
    // 管理
    setState,
    reset,
    addXP,
    
    // 内部函数（供高级使用）
    _checkBreakthrough: checkBreakthrough,
    _executeBreakthrough: executeBreakthrough
};

export default CultivationSystem;
