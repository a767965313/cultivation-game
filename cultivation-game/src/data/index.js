/**
 * 数据系统统一导出
 * 修仙游戏核心数据模块
 */

// 灵石数据
export { 
    STONE_CHAIN, 
    getStone, 
    calculateMergeResult, 
    validateStoneBalance 
} from './stone-chain.js';

// 境界数据
export { 
    REALMS, 
    getRealm, 
    getRealmStage, 
    calculateBreakthroughXP, 
    validateRealmBalance 
} from './realms.js';

// 五行数据
export { 
    ELEMENTS, 
    ELEMENT_KEYS,
    getElement, 
    getShengElement, 
    getShengByElement,
    getKeElement, 
    getKeByElement,
    calculateElementBonus, 
    getElementRelations,
    validateElementCycle 
} from './elements.js';

// 导入验证函数
import { validateStoneBalance } from './stone-chain.js';
import { validateRealmBalance } from './realms.js';
import { validateElementCycle } from './elements.js';

/**
 * 完整数据验证
 * 验证所有数值系统的平衡性
 * @returns {Object} 验证报告
 */
export function validateAll() {
    const stoneValidation = validateStoneBalance();
    const realmValidation = validateRealmBalance();
    const elementValidation = validateElementCycle();
    
    return {
        timestamp: new Date().toISOString(),
        overall: stoneValidation.passed && realmValidation.passed && elementValidation.passed,
        stoneChain: stoneValidation,
        realms: realmValidation,
        elements: elementValidation
    };
}

/**
 * 打印验证报告
 */
export function printValidationReport() {
    const report = validateAll();
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║      修仙游戏数据系统验证报告          ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`验证时间: ${report.timestamp}`);
    console.log(`整体状态: ${report.overall ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
    
    // 灵石链验证
    console.log('【灵石升级链】');
    report.stoneChain.details.forEach(item => {
        const icon = item.passed ? '✅' : '❌';
        console.log(`  ${icon} ${item.from} → ${item.to}: ${item.ratio}x`);
    });
    console.log('');
    
    // 境界验证
    console.log('【境界系统】');
    report.realms.details.forEach(item => {
        const icon = item.passed ? '✅' : '❌';
        console.log(`  ${icon} ${item.from} → ${item.to}: ${item.ratio}x`);
    });
    console.log('');
    
    // 五行验证
    console.log('【五行系统】');
    report.elements.details.forEach(item => {
        const icon = item.passed ? '✅' : '❌';
        console.log(`  ${icon} ${item.type}: ${item.chain}`);
    });
    
    return report;
}

// 版本信息
export const DATA_VERSION = '1.0.0';
