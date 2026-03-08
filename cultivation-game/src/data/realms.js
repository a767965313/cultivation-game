/**
 * 修仙境界数据
 * 9个境界 × 4个阶段
 */

export const REALMS = [
    { 
        id: 0, 
        name: '炼气期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 100,
        description: '引气入体，打通经脉，奠定修真基础'
    },
    { 
        id: 1, 
        name: '筑基期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 300,
        description: '铸造道基，稳固根基，正式踏入仙途'
    },
    { 
        id: 2, 
        name: '金丹期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 1000,
        description: '凝结金丹，寿元大增，可御剑飞行'
    },
    { 
        id: 3, 
        name: '元婴期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 3000,
        description: '金丹化婴，元神初成，肉身毁灭亦可夺舍重生'
    },
    { 
        id: 4, 
        name: '化神期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 10000,
        description: '元婴化神，神识大成，可感知天地法则'
    },
    { 
        id: 5, 
        name: '炼虚期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 30000,
        description: '炼虚合道，触摸大道边缘，举手投足间有法则相随'
    },
    { 
        id: 6, 
        name: '合体期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 100000,
        description: '元神与肉身合一，战力暴涨，可开辟小世界'
    },
    { 
        id: 7, 
        name: '大乘期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 300000,
        description: '大道将成，半步真仙，一念可动山河'
    },
    { 
        id: 8, 
        name: '渡劫期', 
        stages: ['前期', '中期', '后期', '大圆满'], 
        baseXP: 1000000,
        description: '天劫加身，九死一生，渡过则飞升仙界'
    }
];

/**
 * 获取境界数据
 * @param {number} realmId - 境界ID 0-8
 * @returns {Object|null} 境界数据
 */
export function getRealm(realmId) {
    if (realmId < 0 || realmId >= REALMS.length) {
        return null;
    }
    return REALMS[realmId];
}

/**
 * 获取特定阶段数据
 * @param {number} realmId - 境界ID
 * @param {number} stageIndex - 阶段索引 0-3
 * @returns {Object|null} 阶段数据
 */
export function getRealmStage(realmId, stageIndex) {
    const realm = getRealm(realmId);
    if (!realm || stageIndex < 0 || stageIndex >= realm.stages.length) {
        return null;
    }
    
    const stageMultiplier = 1 + stageIndex * 0.3; // 每阶段增加30%经验需求
    return {
        realm: realm.name,
        stage: realm.stages[stageIndex],
        requiredXP: Math.floor(realm.baseXP * stageMultiplier),
        description: realm.description
    };
}

/**
 * 计算境界突破所需经验
 * @param {number} currentRealm - 当前境界
 * @param {number} currentStage - 当前阶段
 * @returns {number} 突破所需经验
 */
export function calculateBreakthroughXP(currentRealm, currentStage) {
    const current = getRealmStage(currentRealm, currentStage);
    if (!current) return 0;
    
    // 大圆满阶段后突破到下一境界
    if (currentStage === 3) {
        const nextRealm = getRealm(currentRealm + 1);
        if (!nextRealm) return 0;
        return Math.floor(nextRealm.baseXP * 0.5);
    }
    
    // 同境界内突破到下一阶段
    const nextStage = getRealmStage(currentRealm, currentStage + 1);
    return nextStage.requiredXP - current.requiredXP;
}

/**
 * 验证境界数值平衡
 * @returns {Object} 验证结果
 */
export function validateRealmBalance() {
    const results = [];
    let allPassed = true;
    
    // 验证境界间经验增长
    for (let i = 0; i < REALMS.length - 1; i++) {
        const current = REALMS[i];
        const next = REALMS[i + 1];
        const ratio = next.baseXP / current.baseXP;
        const passed = ratio >= 2.8 && ratio <= 3.5; // 境界跨度更大一些
        
        results.push({
            from: current.name,
            to: next.name,
            ratio: ratio.toFixed(2),
            passed
        });
        
        if (!passed) allPassed = false;
    }
    
    return { passed: allPassed, details: results };
}

export default REALMS;
