/**
 * 修炼突破系统快速测试
 * 跳过动画等待，纯逻辑测试
 */

import { CultivationSystem } from './cultivation.js';
import { calculateBreakthroughXP, getRealmStage } from '../data/realms.js';

// 模拟跳过动画
if (typeof globalThis !== 'undefined') {
    globalThis.MergeAnimation = {
        playBreakthrough: async () => Promise.resolve()
    };
} else if (typeof window !== 'undefined') {
    window.MergeAnimation = {
        playBreakthrough: async () => Promise.resolve()
    };
}

// 测试结果
const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
    try {
        CultivationSystem.reset();
        fn();
        results.passed++;
        results.tests.push({ name, status: '✅' });
        console.log(`✅ ${name}`);
    } catch (e) {
        results.failed++;
        results.tests.push({ name, status: '❌', error: e.message });
        console.log(`❌ ${name}: ${e.message}`);
    }
}

function assertEqual(a, b, msg = '') {
    if (a !== b) throw new Error(`${msg} 期望:${b}, 实际:${a}`);
}

function assertTrue(v, msg = '') {
    if (!v) throw new Error(`${msg} 期望true`);
}

function assertFalse(v, msg = '') {
    if (v) throw new Error(`${msg} 期望false`);
}

console.log('═══════════════════════════════════════════');
console.log('      修炼突破系统快速测试 v1.0');
console.log('═══════════════════════════════════════════\n');

// 测试1: 灵石吸收
console.log('\n📦 测试组1: 灵石吸收\n');

test('吸收单个下品灵石', () => {
    const r = CultivationSystem.absorb({ stone_1: 1 });
    assertEqual(r.xpGained, 10);
    assertEqual(r.stonesConsumed[0].name, '灵石·下品');
});

test('吸收混合灵石', () => {
    const r = CultivationSystem.absorb({ stone_1: 2, stone_2: 1, stone_3: 1 });
    assertEqual(r.xpGained, 150); // 20+30+100
});

test('跳过level 0', () => {
    const r = CultivationSystem.absorb({ stone_0: 100, stone_1: 1 });
    assertEqual(r.xpGained, 10);
});

test('空库存', () => {
    const r = CultivationSystem.absorb({});
    assertEqual(r.xpGained, 0);
});

// 测试2: 突破检测
console.log('\n📦 测试组2: 突破检测\n');

test('可突破检测', () => {
    const check = CultivationSystem._checkBreakthrough(0, 0, 30);
    assertTrue(check.canBreakthrough);
});

test('不可突破检测', () => {
    const check = CultivationSystem._checkBreakthrough(0, 0, 29);
    assertFalse(check.canBreakthrough);
});

test('最高境界不可突破', () => {
    const check = CultivationSystem._checkBreakthrough(8, 3, 999999);
    assertFalse(check.canBreakthrough);
});

// 测试3: 修为计算
console.log('\n📦 测试组3: 修为计算\n');

test('炼气期突破XP计算', () => {
    assertEqual(calculateBreakthroughXP(0, 0), 30); // 初期→中期
    assertEqual(calculateBreakthroughXP(0, 1), 30); // 中期→后期
    assertEqual(calculateBreakthroughXP(0, 2), 30); // 后期→大圆满
    assertEqual(calculateBreakthroughXP(0, 3), 150); // →筑基
});

test('进度百分比', () => {
    CultivationSystem.addXP(15);
    assertEqual(CultivationSystem.getProgress(), 50);
});

// 测试4: 状态管理
console.log('\n📦 测试组4: 状态管理\n');

test('状态持久化', () => {
    CultivationSystem.addXP(100);
    const saved = CultivationSystem.getState();
    CultivationSystem.reset();
    assertEqual(CultivationSystem.getState().xp, 0);
    CultivationSystem.setState(saved);
    assertEqual(CultivationSystem.getState().xp, 100);
});

test('获取当前境界', () => {
    const realm = CultivationSystem.getCurrentRealm();
    assertEqual(realm.realm, 0);
    assertEqual(realm.stage, 0);
    assertEqual(realm.realmName, '炼气期');
});

// 测试5: 库存处理
console.log('\n📦 测试组5: 库存处理\n');

test('库存正确移除', () => {
    const r = CultivationSystem.absorb({ stone_1: 3, stone_2: 2, other: 5 });
    assertEqual(r.inventory.stone_1, undefined);
    assertEqual(r.inventory.stone_2, undefined);
    assertEqual(r.inventory.other, 5);
});

test('无效库存处理', () => {
    const r = CultivationSystem.absorb(null);
    assertEqual(r.xpGained, 0);
});

// 测试6: 异步突破测试
console.log('\n📦 测试组6: 突破流程\n');

await (async () => {
    // 测试完整突破流程
    CultivationSystem.reset();
    CultivationSystem.addXP(240); // 足够到筑基
    
    let r = await CultivationSystem.breakthrough();
    assertTrue(r.success, '第1次突破');
    assertEqual(r.newStage, 1);
    
    r = await CultivationSystem.breakthrough();
    assertEqual(r.newStage, 2);
    
    r = await CultivationSystem.breakthrough();
    assertEqual(r.newStage, 3);
    
    r = await CultivationSystem.breakthrough();
    assertEqual(r.newRealm, 1);
    assertEqual(r.newStage, 0);
    assertEqual(r.rewards.title, '初入仙途');
    console.log('✅ 完整突破流程');
    results.passed++;
})();

await (async () => {
    // 测试溢出修为
    CultivationSystem.reset();
    CultivationSystem.addXP(100);
    const r = await CultivationSystem.breakthrough();
    assertTrue(r.overflowXP > 0, '应有溢出');
    console.log('✅ 修为溢出处理');
    results.passed++;
})();

await (async () => {
    // 测试无法突破
    CultivationSystem.reset();
    const r = await CultivationSystem.breakthrough();
    assertFalse(r.success);
    assertEqual(r.message, '修为不足，无法突破');
    console.log('✅ 无法突破处理');
    results.passed++;
})();

// 报告
console.log('\n═══════════════════════════════════════════');
console.log('              测试报告');
console.log('═══════════════════════════════════════════');
console.log(`总测试数: ${results.passed + results.failed}`);
console.log(`✅ 通过: ${results.passed}`);
console.log(`❌ 失败: ${results.failed}`);
console.log(`通过率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════');

if (results.failed > 0) {
    console.log('\n❌ 失败详情:');
    results.tests.filter(t => t.error).forEach(t => {
        console.log(`  ${t.name}: ${t.error}`);
    });
}

export default results;
