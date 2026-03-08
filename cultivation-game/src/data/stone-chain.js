/**
 * 灵石升级链数据
 * 10级灵石完整数据（0-9级）
 * 数值曲线：每级约3倍增长
 */

export const STONE_CHAIN = [
    { 
        level: 0, 
        name: '灵气团', 
        icon: '💨', 
        xpValue: 0, 
        color: '#cccccc', 
        description: '未凝聚的天地灵气，修真者的起点' 
    },
    { 
        level: 1, 
        name: '灵石·下品', 
        icon: '🔮', 
        xpValue: 10, 
        color: '#9b59b6', 
        description: '最为常见的灵石，杂质较多，世俗界流通' 
    },
    { 
        level: 2, 
        name: '灵石·中品', 
        icon: '💎', 
        xpValue: 30, 
        color: '#3498db', 
        description: '经过初步提炼，杂质减少，低级修士常用' 
    },
    { 
        level: 3, 
        name: '灵石·上品', 
        icon: '💠', 
        xpValue: 100, 
        color: '#2ecc71', 
        description: '较为纯净，蕴含灵气充沛，修士日常修炼之物' 
    },
    { 
        level: 4, 
        name: '灵石·极品', 
        icon: '🌟', 
        xpValue: 300, 
        color: '#f1c40f', 
        description: '稀有品质，蕴含丰富灵气，突破瓶颈时辅助佳品' 
    },
    { 
        level: 5, 
        name: '玄晶', 
        icon: '🔷', 
        xpValue: 1000, 
        color: '#e74c3c', 
        description: '蕴含玄妙之力，可遇不可求，大宗门珍藏' 
    },
    { 
        level: 6, 
        name: '地晶', 
        icon: '🌍', 
        xpValue: 3000, 
        color: '#8e44ad', 
        description: '大地精华凝聚，千年成形，蕴含地脉之力' 
    },
    { 
        level: 7, 
        name: '天晶', 
        icon: '☀️', 
        xpValue: 10000, 
        color: '#ff6b6b', 
        description: '天界流落之物，极为罕见，得之可助修为暴涨' 
    },
    { 
        level: 8, 
        name: '仙晶·伪', 
        icon: '👑', 
        xpValue: 30000, 
        color: '#00d2ff', 
        description: '接近仙界品质，凡间极致，渡劫期大能方可炼化' 
    },
    { 
        level: 9, 
        name: '仙晶·真', 
        icon: '✨', 
        xpValue: 100000, 
        color: '#ffd700', 
        description: '真正的仙界之物，传说中的存在，据说可助飞升' 
    }
];

/**
 * 根据等级获取灵石数据
 * @param {number} level - 灵石等级 0-9
 * @returns {Object|null} 灵石数据对象
 */
export function getStone(level) {
    if (level < 0 || level >= STONE_CHAIN.length) {
        return null;
    }
    return STONE_CHAIN[level];
}

/**
 * 获取灵石合成结果
 * 3个同级灵石合成1个高一级灵石
 * @param {number} level - 当前灵石等级
 * @param {boolean} isPerfect - 是否为完美合成
 * @returns {Object|null} 合成后的灵石数据
 */
export function calculateMergeResult(level, isPerfect = false) {
    if (level < 0 || level >= STONE_CHAIN.length - 1) {
        return null;
    }
    const result = getStone(level + 1);
    if (!result) return null;
    
    // 完美合成可获得10%额外灵气值
    if (isPerfect) {
        return {
            ...result,
            xpValue: Math.floor(result.xpValue * 1.1)
        };
    }
    return result;
}

/**
 * 验证灵石数值平衡
 * 检查升级曲线是否符合约3倍规律
 * @returns {Object} 验证结果
 */
export function validateStoneBalance() {
    const results = [];
    let allPassed = true;
    
    for (let i = 1; i < STONE_CHAIN.length - 1; i++) {
        const current = STONE_CHAIN[i];
        const next = STONE_CHAIN[i + 1];
        const ratio = next.xpValue / current.xpValue;
        const passed = ratio >= 2.8 && ratio <= 3.5; // 允许±0.5误差（覆盖3.33x）
        
        results.push({
            from: current.name,
            to: next.name,
            ratio: ratio.toFixed(2),
            passed
        });
        
        if (!passed) allPassed = false;
    }
    
    // 验证合成收益：3个低级 = 1个高级（约90-110%）
    for (let i = 1; i < STONE_CHAIN.length - 1; i++) {
        const threeLow = STONE_CHAIN[i].xpValue * 3;
        const oneHigh = STONE_CHAIN[i + 1].xpValue;
        const mergeRatio = oneHigh / threeLow;
        const mergePassed = mergeRatio >= 0.9 && mergeRatio <= 1.15; // 允许玩家获得10-15%合成收益
        
        results.push({
            type: 'merge',
            from: `3×${STONE_CHAIN[i].name}`,
            to: STONE_CHAIN[i + 1].name,
            ratio: mergeRatio.toFixed(2),
            passed: mergePassed
        });
        
        if (!mergePassed) allPassed = false;
    }
    
    return { passed: allPassed, details: results };
}

export default STONE_CHAIN;
