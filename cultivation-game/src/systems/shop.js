/**
 * 工坊商店系统 - Shop System
 * 负责商品管理、价格计算、购买流程和效果应用
 * @module shop
 */

import { REALMS, getRealmStage } from '../data/realms.js';

// ==================== 商品数据 ====================

/**
 * 商店商品配置
 * @typedef {Object} ShopItem
 * @property {string} id - 商品唯一ID
 * @property {string} name - 商品名称
 * @property {string} description - 商品描述
 * @property {number} basePrice - 基础价格（灵石）
 * @property {number} priceMultiplier - 每级价格倍数
 * @property {number} maxLevel - 最大等级
 * @property {number} unlockRealm - 解锁境界ID
 * @property {function} effect - 效果函数，返回效果对象
 */
export const SHOP_ITEMS = [
    {
        id: 'capture_efficiency',
        name: '捕捉效率',
        description: '每次捕捉获得更多灵气',
        basePrice: 100,        // 灵石价格
        priceMultiplier: 1.5,  // 每级价格倍数
        maxLevel: 10,
        unlockRealm: 0,        // 炼气期解锁
        effect: (level) => ({ captureBonus: level })  // 每次多捕获level个
    },
    {
        id: 'auto_merge',
        name: '自动合成仪',
        description: '自动执行最优合成',
        basePrice: 500,
        priceMultiplier: 2,
        maxLevel: 1,           // 一次性购买
        unlockRealm: 1,        // 筑基期解锁
        effect: (level) => ({ autoMerge: level > 0 })
    },
    {
        id: 'purity_boost',
        name: '纯度提升',
        description: '捕捉灵气纯度+5%',
        basePrice: 200,
        priceMultiplier: 1.3,
        maxLevel: 10,
        unlockRealm: 0,
        effect: (level) => ({ purityBonus: level * 5 })  // +5% per level
    },
    {
        id: 'merge_range',
        name: '合成范围+1',
        description: '合成检测范围扩大1格（用于未来扩展）',
        basePrice: 1000,
        priceMultiplier: 2,
        maxLevel: 2,
        unlockRealm: 2,        // 金丹期解锁
        effect: (level) => ({ mergeRangeBonus: level })
    }
];

// ==================== 内部状态 ====================

/**
 * 购买等级状态
 * @type {Object<string, number>} - { itemId: level }
 */
const purchasedLevels = {};

/**
 * 已应用的效果缓存
 * @type {Object<string, Object>} - { itemId: effectObject }
 */
const appliedEffects = {};

// ==================== 核心功能函数 ====================

/**
 * 获取商品配置
 * @param {string} itemId - 商品ID
 * @returns {ShopItem|null} 商品配置
 */
function getShopItemConfig(itemId) {
    return SHOP_ITEMS.find(item => item.id === itemId) || null;
}

/**
 * 检查商品是否已解锁
 * @param {string} itemId - 商品ID
 * @param {number} currentRealm - 当前境界ID
 * @returns {boolean} 是否解锁
 */
function isItemUnlocked(itemId, currentRealm) {
    const item = getShopItemConfig(itemId);
    if (!item) return false;
    return currentRealm >= item.unlockRealm;
}

/**
 * 检查是否已达最大等级
 * @param {string} itemId - 商品ID
 * @param {number} currentLevel - 当前等级
 * @returns {boolean} 是否已达最大等级
 */
function isMaxLevel(itemId, currentLevel) {
    const item = getShopItemConfig(itemId);
    if (!item) return true;
    return currentLevel >= item.maxLevel;
}

/**
 * 计算商品价格
 * 公式：basePrice * (priceMultiplier ^ currentLevel)
 * @param {string} itemId - 商品ID
 * @param {number} currentLevel - 当前等级
 * @returns {number} 当前价格
 */
function calculateItemPrice(itemId, currentLevel) {
    const item = getShopItemConfig(itemId);
    if (!item) return 0;
    return Math.floor(item.basePrice * Math.pow(item.priceMultiplier, currentLevel));
}

/**
 * 应用升级效果
 * @param {string} itemId - 商品ID
 * @param {number} level - 等级
 * @returns {Object} 效果对象
 */
function applyItemEffect(itemId, level) {
    const item = getShopItemConfig(itemId);
    if (!item || level <= 0) return {};
    
    const effect = item.effect(level);
    appliedEffects[itemId] = effect;
    return effect;
}

/**
 * 获取所有已应用效果的汇总
 * @returns {Object} 合并后的效果对象
 */
function getAllAppliedEffects() {
    let combinedEffects = {
        captureBonus: 0,
        autoMerge: false,
        purityBonus: 0,
        mergeRangeBonus: 0
    };
    
    for (const [itemId, effect] of Object.entries(appliedEffects)) {
        if (effect.captureBonus !== undefined) {
            combinedEffects.captureBonus += effect.captureBonus;
        }
        if (effect.autoMerge !== undefined) {
            combinedEffects.autoMerge = combinedEffects.autoMerge || effect.autoMerge;
        }
        if (effect.purityBonus !== undefined) {
            combinedEffects.purityBonus += effect.purityBonus;
        }
        if (effect.mergeRangeBonus !== undefined) {
            combinedEffects.mergeRangeBonus += effect.mergeRangeBonus;
        }
    }
    
    return combinedEffects;
}

/**
 * 执行购买流程
 * @param {string} itemId - 商品ID
 * @param {number} currentMoney - 当前灵石数量
 * @param {number} currentLevel - 当前等级
 * @returns {Object} 购买结果
 */
function executePurchase(itemId, currentMoney, currentLevel) {
    const item = getShopItemConfig(itemId);
    
    // 1. 检查商品是否存在
    if (!item) {
        return {
            success: false,
            error: 'ITEM_NOT_FOUND',
            message: '商品不存在'
        };
    }
    
    // 2. 检查是否已达最大等级
    if (currentLevel >= item.maxLevel) {
        return {
            success: false,
            error: 'MAX_LEVEL_REACHED',
            message: '已达到最大等级',
            maxLevel: item.maxLevel
        };
    }
    
    // 3. 计算价格
    const price = calculateItemPrice(itemId, currentLevel);
    
    // 4. 检查货币是否足够
    if (currentMoney < price) {
        return {
            success: false,
            error: 'INSUFFICIENT_FUNDS',
            message: '灵石不足',
            required: price,
            current: currentMoney,
            shortage: price - currentMoney
        };
    }
    
    // 5. 扣除货币，升级等级
    const newLevel = currentLevel + 1;
    const remainingMoney = currentMoney - price;
    
    // 更新状态
    purchasedLevels[itemId] = newLevel;
    
    // 6. 应用效果
    const effect = applyItemEffect(itemId, newLevel);
    
    return {
        success: true,
        itemId,
        itemName: item.name,
        previousLevel: currentLevel,
        newLevel,
        price,
        remainingMoney,
        effect,
        message: `成功购买 ${item.name}，当前等级 ${newLevel}`
    };
}

// ==================== 公共API ====================

/**
 * 获取所有可用商品（根据当前境界过滤）
 * @param {number} currentRealm - 当前境界ID
 * @returns {Array<ShopItem>} 可用商品列表
 */
function getAvailableItems(currentRealm) {
    return SHOP_ITEMS.filter(item => item.unlockRealm <= currentRealm);
}

/**
 * 获取商品详情（含当前价格）
 * @param {string} itemId - 商品ID
 * @param {number} currentLevel - 当前等级
 * @returns {Object|null} 商品详情
 */
function getItem(itemId, currentLevel) {
    const item = getShopItemConfig(itemId);
    if (!item) return null;
    
    const price = calculateItemPrice(itemId, currentLevel);
    const isMaxed = currentLevel >= item.maxLevel;
    const nextEffect = isMaxed ? null : item.effect(currentLevel + 1);
    const currentEffect = currentLevel > 0 ? item.effect(currentLevel) : null;
    
    return {
        ...item,
        currentLevel,
        currentPrice: price,
        isMaxed,
        canUpgrade: !isMaxed,
        currentEffect,
        nextEffect
    };
}

/**
 * 计算价格
 * @param {string} itemId - 商品ID
 * @param {number} currentLevel - 当前等级
 * @returns {number} 当前价格
 */
function calculatePrice(itemId, currentLevel) {
    return calculateItemPrice(itemId, currentLevel);
}

/**
 * 购买商品
 * @param {string} itemId - 商品ID
 * @param {number} currentMoney - 当前灵石数量
 * @param {number} currentLevel - 当前等级
 * @returns {Object} 购买结果
 */
function purchase(itemId, currentMoney, currentLevel) {
    return executePurchase(itemId, currentMoney, currentLevel);
}

/**
 * 获取已购买等级
 * @param {string} itemId - 商品ID
 * @returns {number} 已购买等级（0表示未购买）
 */
function getPurchasedLevel(itemId) {
    return purchasedLevels[itemId] || 0;
}

/**
 * 应用升级效果
 * @param {string} itemId - 商品ID
 * @param {number} level - 等级
 * @returns {Object} 效果对象
 */
function applyEffect(itemId, level) {
    return applyItemEffect(itemId, level);
}

/**
 * 获取商店系统状态
 * @returns {Object} 完整状态
 */
function getState() {
    return {
        purchasedLevels: { ...purchasedLevels },
        appliedEffects: { ...appliedEffects },
        combinedEffects: getAllAppliedEffects()
    };
}

/**
 * 设置商店系统状态（用于存档加载）
 * @param {Object} savedState - 保存的状态
 */
function setState(savedState) {
    if (savedState.purchasedLevels) {
        Object.assign(purchasedLevels, savedState.purchasedLevels);
        
        // 重新应用所有效果
        for (const [itemId, level] of Object.entries(purchasedLevels)) {
            applyItemEffect(itemId, level);
        }
    }
}

/**
 * 重置商店系统
 */
function reset() {
    Object.keys(purchasedLevels).forEach(key => delete purchasedLevels[key]);
    Object.keys(appliedEffects).forEach(key => delete appliedEffects[key]);
}

// ==================== 界面函数（供UI层使用） ====================

/**
 * 渲染商店面板
 * @param {number} currentRealm - 当前境界
 * @param {number} currentMoney - 当前灵石
 * @returns {Object} 面板数据
 */
function renderShopPanel(currentRealm, currentMoney) {
    const availableItems = getAvailableItems(currentRealm);
    
    return {
        title: '灵气工坊',
        subtitle: `当前境界: ${getRealmStage(currentRealm, 0)?.realm || '未知'}`,
        money: currentMoney,
        items: availableItems.map(item => {
            const level = getPurchasedLevel(item.id);
            return renderShopItem(item.id, level, currentMoney);
        })
    };
}

/**
 * 渲染单个商品
 * @param {string} itemId - 商品ID
 * @param {number} currentLevel - 当前等级
 * @param {number} currentMoney - 当前灵石
 * @returns {Object} 商品渲染数据
 */
function renderShopItem(itemId, currentLevel, currentMoney) {
    const item = getItem(itemId, currentLevel);
    if (!item) return null;
    
    const canAfford = currentMoney >= item.currentPrice;
    
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        icon: getItemIcon(item.id),
        level: item.currentLevel,
        maxLevel: item.maxLevel,
        price: item.currentPrice,
        canAfford,
        isMaxed: item.isMaxed,
        canBuy: !item.isMaxed && canAfford,
        effect: item.currentEffect,
        nextEffect: item.nextEffect
    };
}

/**
 * 处理购买点击
 * @param {string} itemId - 商品ID
 * @param {number} currentMoney - 当前灵石
 * @returns {Object} 点击处理结果
 */
function onPurchaseClick(itemId, currentMoney) {
    const currentLevel = getPurchasedLevel(itemId);
    return purchase(itemId, currentMoney, currentLevel);
}

/**
 * 获取商品图标
 * @param {string} itemId - 商品ID
 * @returns {string} 图标字符
 */
function getItemIcon(itemId) {
    const icons = {
        'capture_efficiency': '⚡',
        'auto_merge': '🤖',
        'purity_boost': '✨',
        'merge_range': '🔍'
    };
    return icons[itemId] || '📦';
}

// ==================== 导出 ====================

export const ShopSystem = {
    // 商品数据
    SHOP_ITEMS,
    
    // 核心API
    getAvailableItems,
    getItem,
    calculatePrice,
    purchase,
    getPurchasedLevel,
    applyEffect,
    
    // 状态管理
    getState,
    setState,
    reset,
    getAllAppliedEffects,
    
    // 界面函数
    renderShopPanel,
    renderShopItem,
    onPurchaseClick,
    getItemIcon,
    
    // 内部函数（供高级使用）
    _isUnlocked: isItemUnlocked,
    _calculateItemPrice: calculateItemPrice
};

export default ShopSystem;
