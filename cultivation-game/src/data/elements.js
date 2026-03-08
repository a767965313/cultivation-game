/**
 * 五行系统数据
 * 相生相克关系定义
 */

export const ELEMENTS = {
    gold: { 
        name: '金', 
        icon: '⚔️', 
        color: '#FFD700', 
        sheng: 'water',  // 金生水
        ke: 'wood'       // 金克木
    },
    wood: { 
        name: '木', 
        icon: '🌿', 
        color: '#4CAF50', 
        sheng: 'fire',   // 木生火
        ke: 'earth'      // 木克土
    },
    water: { 
        name: '水', 
        icon: '💧', 
        color: '#2196F3', 
        sheng: 'wood',   // 水生木
        ke: 'fire'       // 水克火
    },
    fire: { 
        name: '火', 
        icon: '🔥', 
        color: '#FF5722', 
        sheng: 'earth',  // 火生土
        ke: 'gold'       // 火克金
    },
    earth: { 
        name: '土', 
        icon: '🏔️', 
        color: '#795548', 
        sheng: 'gold',   // 土生金
        ke: 'water'      // 土克水
    }
};

/**
 * 五行英文key列表
 */
export const ELEMENT_KEYS = ['gold', 'wood', 'water', 'fire', 'earth'];

/**
 * 获取元素数据
 * @param {string} type - 元素类型: gold|wood|water|fire|earth
 * @returns {Object|null} 元素数据
 */
export function getElement(type) {
    return ELEMENTS[type] || null;
}

/**
 * 获取相生元素（生成我的）
 * @param {string} type - 当前元素类型
 * @returns {Object|null} 相生元素
 */
export function getShengElement(type) {
    const element = ELEMENTS[type];
    if (!element) return null;
    return {
        key: element.sheng,
        ...ELEMENTS[element.sheng]
    };
}

/**
 * 获取被相生元素（我生成的）
 * @param {string} type - 当前元素类型
 * @returns {Object|null} 被相生元素
 */
export function getShengByElement(type) {
    for (const [key, value] of Object.entries(ELEMENTS)) {
        if (value.sheng === type) {
            return { key, ...value };
        }
    }
    return null;
}

/**
 * 获取相克元素（我克的）
 * @param {string} type - 当前元素类型
 * @returns {Object|null} 相克元素
 */
export function getKeElement(type) {
    const element = ELEMENTS[type];
    if (!element) return null;
    return {
        key: element.ke,
        ...ELEMENTS[element.ke]
    };
}

/**
 * 获取被克元素（克我的）
 * @param {string} type - 当前元素类型
 * @returns {Object|null} 被克元素
 */
export function getKeByElement(type) {
    for (const [key, value] of Object.entries(ELEMENTS)) {
        if (value.ke === type) {
            return { key, ...value };
        }
    }
    return null;
}

/**
 * 计算五行关系加成
 * @param {string} attacker - 攻击方元素
 * @param {string} defender - 防御方元素
 * @returns {number} 伤害加成系数
 */
export function calculateElementBonus(attacker, defender) {
    if (attacker === defender) return 1.0; // 相同无加成
    
    const attackerData = ELEMENTS[attacker];
    if (!attackerData) return 1.0;
    
    // 相克：伤害+50%
    if (attackerData.ke === defender) return 1.5;
    
    // 被克：伤害-30%
    const defenderData = ELEMENTS[defender];
    if (defenderData && defenderData.ke === attacker) return 0.7;
    
    return 1.0;
}

/**
 * 获取完整五行关系链
 * @returns {Array} 五行关系数组
 */
export function getElementRelations() {
    return ELEMENT_KEYS.map(key => {
        const element = ELEMENTS[key];
        return {
            key,
            name: element.name,
            icon: element.icon,
            color: element.color,
            sheng: { key: element.sheng, name: ELEMENTS[element.sheng].name },
            ke: { key: element.ke, name: ELEMENTS[element.ke].name }
        };
    });
}

/**
 * 验证五行关系循环
 * 金→水→木→火→土→金（相生）
 * 金→木→土→水→火→金（相克）
 * @returns {Object} 验证结果
 */
export function validateElementCycle() {
    const results = [];
    let allPassed = true;
    
    // 验证相生循环
    let current = 'gold';
    const shengChain = [];
    for (let i = 0; i < 5; i++) {
        shengChain.push(ELEMENTS[current].name);
        current = ELEMENTS[current].sheng;
    }
    const shengPassed = current === 'gold';
    results.push({
        type: '相生链',
        chain: shengChain.join(' → ') + ' → 金',
        passed: shengPassed
    });
    if (!shengPassed) allPassed = false;
    
    // 验证相克循环
    current = 'gold';
    const keChain = [];
    for (let i = 0; i < 5; i++) {
        keChain.push(ELEMENTS[current].name);
        current = ELEMENTS[current].ke;
    }
    const kePassed = current === 'gold';
    results.push({
        type: '相克链',
        chain: keChain.join(' → ') + ' → 金',
        passed: kePassed
    });
    if (!kePassed) allPassed = false;
    
    return { passed: allPassed, details: results };
}

export default ELEMENTS;
