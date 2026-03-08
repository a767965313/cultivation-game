/**
 * 修炼突破系统测试
 * 测试用例覆盖所有功能点
 */

import { CultivationSystem } from './cultivation.js';
import { calculateBreakthroughXP, getRealmStage } from '../data/realms.js';

// 测试工具
let testResults = [];
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    return new Promise(async (resolve) => {
        try {
            // 重置状态
            CultivationSystem.reset();
            
            await fn();
            testResults.push({ name, status: '✅ 通过' });
            passedTests++;
            console.log(`✅ ${name}`);
            resolve();
        } catch (error) {
            testResults.push({ name, status: '❌ 失败', error: error.message });
            failedTests++;
            console.log(`❌ ${name}: ${error.message}`);
            resolve();
        }
    });
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} 期望值: ${expected}, 实际值: ${actual}`);
    }
}

function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`${message} 期望为 true，实际为 ${value}`);
    }
}

function assertFalse(value, message = '') {
    if (value) {
        throw new Error(`${message} 期望为 false，实际为 ${value}`);
    }
}

async function runAllTests() {
    console.log('═══════════════════════════════════════════');
    console.log('      修炼突破系统测试套件 v1.0');
    console.log('═══════════════════════════════════════════\n');

    // --- 测试1: 吸收不同等级灵石组合 ---
    console.log('\n📦 测试组1: 吸收不同等级灵石组合\n');

    await test('吸收单个下品灵石(level 1)', async () => {
        const inventory = { stone_1: 1 };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 10, '下品灵石应提供10修为');
        assertEqual(result.stonesConsumed.length, 1, '应消耗1个灵石');
        assertEqual(result.stonesConsumed[0].name, '灵石·下品', '名称匹配');
    });

    await test('吸收多个同等级灵石', async () => {
        const inventory = { stone_1: 5 };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 50, '5个下品灵石应提供50修为');
    });

    await test('吸收混合等级灵石', async () => {
        const inventory = { 
            stone_1: 2,  // 2 * 10 = 20
            stone_2: 1, // 1 * 30 = 30
            stone_3: 1  // 1 * 100 = 100
        };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 150, '混合灵石总修为应为150');
        assertEqual(result.stonesConsumed.length, 3, '应消耗3种灵石');
    });

    await test('吸收高等级灵石', async () => {
        const inventory = { stone_9: 1 }; // 仙晶·真 = 100000
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 100000, '仙晶·真应提供100000修为');
    });

    await test('跳过level 0灵气团', async () => {
        const inventory = { stone_0: 10, stone_1: 1 };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 10, '不应吸收level 0');
        assertEqual(result.stonesConsumed.length, 1, '只应消耗1种');
    });

    await test('空库存', async () => {
        const inventory = {};
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 0, '空库存应获得0修为');
        assertEqual(result.stonesConsumed.length, 0, '不应消耗任何灵石');
    });

    await test('只有灵气团', async () => {
        const inventory = { stone_0: 100 };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 0, '灵气团不应被吸收');
    });

    // --- 测试2: 境界突破检测 ---
    console.log('\n📦 测试组2: 境界突破检测\n');

    await test('炼气期初期突破检测', async () => {
        // 炼气期初期 → 中期 需要 30 修为 (130-100)
        const check = CultivationSystem._checkBreakthrough(0, 0, 30);
        assertTrue(check.canBreakthrough, '30修为应可突破');
    });

    await test('修为不足无法突破', async () => {
        const check = CultivationSystem._checkBreakthrough(0, 0, 29);
        assertFalse(check.canBreakthrough, '29修为不应可突破');
    });

    await test('境界提升经验计算', async () => {
        // 测试各境界突破所需经验 (基于实际算法)
        // 炼气期 baseXP=100
        // stage 0: 100, stage 1: 130, stage 2: 160, stage 3: 190
        // 跨阶段突破: next - current
        const xp0to1 = calculateBreakthroughXP(0, 0); // 130-100 = 30
        const xp1to2 = calculateBreakthroughXP(0, 1); // 160-130 = 30
        const xp2to3 = calculateBreakthroughXP(0, 2); // 190-160 = 30
        const xp3toNext = calculateBreakthroughXP(0, 3); // 筑基期 300 * 0.5 = 150
        
        assertEqual(xp0to1, 30, '初期→中期');
        assertEqual(xp1to2, 30, '中期→后期');
        assertEqual(xp2to3, 30, '后期→大圆满');
        assertEqual(xp3toNext, 150, '大圆满→筑基');
    });

    // --- 测试3: 突破到各境界阶段 ---
    console.log('\n📦 测试组3: 突破到各境界阶段\n');

    await test('炼气期完整突破', async () => {
        // 炼气期需要: 30 + 30 + 30 + 150 = 240 修为突破到筑基
        CultivationSystem.addXP(240);
        
        // 初期→中期
        let result = await CultivationSystem.breakthrough();
        assertTrue(result.success, '应突破成功');
        assertEqual(result.newRealm, 0, '仍在炼气期');
        assertEqual(result.newStage, 1, '进入中期');
        
        // 中期→后期
        result = await CultivationSystem.breakthrough();
        assertEqual(result.newStage, 2, '进入后期');
        
        // 后期→大圆满
        result = await CultivationSystem.breakthrough();
        assertEqual(result.newStage, 3, '进入大圆满');
        
        // 大圆满→筑基
        result = await CultivationSystem.breakthrough();
        assertEqual(result.newRealm, 1, '进入筑基期');
        assertEqual(result.newStage, 0, '回到初期');
    });

    await test('快速突破到金丹期', async () => {
        // 直接给足够修为
        CultivationSystem.addXP(3000);
        
        // 连续突破到筑基期 (4次)
        for (let i = 0; i < 4; i++) {
            await CultivationSystem.breakthrough();
        }
        
        const realm = CultivationSystem.getCurrentRealm();
        assertEqual(realm.realm, 1, '应达到筑基期');
        
        // 继续突破到金丹期 (筑基期突破需要更多修为，这里修为应该够多次突破)
        let count = 0;
        while (CultivationSystem.canBreakthrough() && count < 10) {
            await CultivationSystem.breakthrough();
            count++;
        }
        
        const finalRealm = CultivationSystem.getCurrentRealm();
        assertTrue(finalRealm.realm >= 2, '应达到至少金丹期');
    });

    await test('突破奖励发放', async () => {
        // 240修为到达筑基
        CultivationSystem.addXP(240); 
        
        // 突破4次到筑基
        for (let i = 0; i < 3; i++) await CultivationSystem.breakthrough();
        
        const result = await CultivationSystem.breakthrough();
        assertTrue(result.success, '应突破成功');
        assertTrue(result.rewards.unlockShopItems.length > 0, '应解锁商店物品');
        assertEqual(result.rewards.title, '初入仙途', '称号正确');
    });

    // --- 测试4: 修为溢出处理 ---
    console.log('\n📦 测试组4: 修为溢出处理\n');

    await test('突破后修为溢出', async () => {
        // 给远超突破所需的修为 (初期→中期只要30)
        CultivationSystem.addXP(100);
        
        const result = await CultivationSystem.breakthrough();
        assertTrue(result.overflowXP > 0, '应有溢出修为');
        
        const state = CultivationSystem.getState();
        assertEqual(state.xp, result.overflowXP, '溢出修为应保留');
    });

    await test('连环突破检测', async () => {
        // 给足够多次突破的修为
        CultivationSystem.addXP(200);
        
        const result = await CultivationSystem.breakthrough();
        assertTrue(result.canContinueBreakthrough, '应可继续突破');
        
        // 继续突破
        const result2 = await CultivationSystem.breakthrough();
        assertTrue(result2.success, '二次突破应成功');
    });

    // --- 测试5: 边界条件 ---
    console.log('\n📦 测试组5: 边界条件\n');

    await test('渡劫期大圆满后无法突破', async () => {
        // 设置为渡劫期大圆满
        CultivationSystem.setState({ realm: 8, stage: 3, xp: 999999 });
        
        const check = CultivationSystem._checkBreakthrough(8, 3, 999999);
        assertFalse(check.canBreakthrough, '最高境界不应可突破');
        assertEqual(check.message, '已达最高境界 - 渡劫期大圆满', '提示信息正确');
    });

    await test('无法突破时调用breakthrough', async () => {
        const result = await CultivationSystem.breakthrough();
        assertFalse(result.success, '应返回失败');
        assertEqual(result.message, '修为不足，无法突破', '错误信息正确');
    });

    await test('状态持久化', async () => {
        CultivationSystem.addXP(100);
        const saved = CultivationSystem.getState();
        
        CultivationSystem.reset();
        assertEqual(CultivationSystem.getState().xp, 0, '重置后应为0');
        
        CultivationSystem.setState(saved);
        const restored = CultivationSystem.getState();
        assertEqual(restored.xp, 100, '恢复后应保留修为');
    });

    await test('进度百分比计算', async () => {
        // 炼气期初期→中期需要30修为
        CultivationSystem.addXP(15);
        const progress = CultivationSystem.getProgress();
        assertEqual(progress, 50, '进度应为50%');
    });

    await test('库存正确处理', async () => {
        const inventory = { stone_1: 3, stone_2: 2, other_item: 5 };
        const result = CultivationSystem.absorb(inventory);
        
        // 检查消耗后的库存
        assertEqual(result.inventory['stone_1'], undefined, 'stone_1应被删除');
        assertEqual(result.inventory['stone_2'], undefined, 'stone_2应被删除');
        assertEqual(result.inventory['other_item'], 5, '非灵石应保留');
    });

    // --- 测试6: 特殊场景 ---
    console.log('\n📦 测试组6: 特殊场景\n');

    await test('无效库存对象', async () => {
        const result = CultivationSystem.absorb(null);
        assertEqual(result.xpGained, 0, 'null库存应安全处理');
        
        const result2 = CultivationSystem.absorb(undefined);
        assertEqual(result2.xpGained, 0, 'undefined库存应安全处理');
    });

    await test('零数量灵石', async () => {
        const inventory = { stone_1: 0, stone_2: 1 };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 30, '应只计算有效数量');
        assertEqual(result.stonesConsumed.length, 1, '只应消耗1种');
    });

    await test('库存部分消耗', async () => {
        const inventory = { 
            stone_1: 100,
            stone_3: 1,
            key_item: 1
        };
        const result = CultivationSystem.absorb(inventory);
        assertEqual(result.xpGained, 1100, '总修为应正确');
        assertEqual(result.inventory['key_item'], 1, '非灵石key_item应保留');
    });

    // --- 测试7: 完整修炼流程 ---
    console.log('\n📦 测试组7: 完整修炼流程\n');

    await test('从凡人修炼到金丹期完整流程', async () => {
        // 准备丰富的灵石库存
        const inventory = {
            stone_1: 20,   // 200
            stone_2: 10,   // 300
            stone_3: 5,    // 500
            stone_4: 2     // 600
        };
        // 总计: 1600 修为
        
        // 第一步：吸收灵石
        const absorbResult = CultivationSystem.absorb(inventory);
        assertEqual(absorbResult.xpGained, 1600, '应获得1600修为');
        assertTrue(absorbResult.breakthrough, '应可突破');
        
        // 第二步：连续突破
        let breakCount = 0;
        while (CultivationSystem.canBreakthrough() && breakCount < 20) {
            const result = await CultivationSystem.breakthrough();
            assertTrue(result.success, `第${breakCount + 1}次突破应成功`);
            breakCount++;
        }
        
        // 验证最终境界
        const final = CultivationSystem.getCurrentRealm();
        console.log(`   突破次数: ${breakCount}, 最终境界: ${final.realmName} ${final.stageName}`);
        assertTrue(final.realm >= 2, '应至少达到金丹期');
    });

    // ==================== 测试报告 ====================
    console.log('\n═══════════════════════════════════════════');
    console.log('              测试报告');
    console.log('═══════════════════════════════════════════');
    console.log(`总测试数: ${passedTests + failedTests}`);
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`通过率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════\n');

    // 输出详细结果
    if (failedTests > 0) {
        console.log('\n失败详情:\n');
        testResults.filter(r => r.error).forEach(r => {
            console.log(`❌ ${r.name}`);
            console.log(`   错误: ${r.error}\n`);
        });
    }

    return {
        total: passedTests + failedTests,
        passed: passedTests,
        failed: failedTests,
        passRate: ((passedTests / (passedTests + failedTests)) * 100).toFixed(1),
        results: testResults
    };
}

// 运行测试
runAllTests().then(report => {
    // 导出结果供其他模块使用
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = report;
    }
});

export default runAllTests;
