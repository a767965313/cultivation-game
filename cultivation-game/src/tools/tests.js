/**
 * Test Suite - 自动化测试套件
 * 验证游戏核心功能正确性
 */

import { gameState } from '../v3/js/core/GameState.js';
import { mergeSystem } from '../v3/js/systems/MergeSystem.js';
import { cultivation } from '../v3/js/systems/Cultivation.js';
import { challenge } from '../v3/js/systems/Challenge.js';
import { shop } from '../v3/js/systems/Shop.js';
import { REALMS, ELEMENT_KEYS, generateId } from '../v3/js/config.js';
import { eventBus, EVENTS } from '../v3/js/core/EventBus.js';

// 测试工具函数
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ 断言失败: ${message}`);
  }
};

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`❌ 断言失败: ${message}\n   期望: ${expected}\n   实际: ${actual}`);
  }
};

// 保存和恢复游戏状态
let savedState = null;

const saveState = () => {
  savedState = JSON.parse(JSON.stringify(gameState.get()));
};

const restoreState = () => {
  if (savedState) {
    Object.keys(savedState).forEach(key => {
      gameState.set(key, savedState[key]);
    });
  }
};

// 测试套件
export const Tests = {
  results: {
    passed: 0,
    failed: 0,
    errors: []
  },

  /**
   * 重置测试结果
   */
  resetResults() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  },

  /**
   * 运行单个测试
   */
  runTest(name, testFn) {
    try {
      saveState();
      testFn();
      this.results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ name, error: error.message });
      console.error(`❌ ${name}`);
      console.error(`   ${error.message}`);
    } finally {
      restoreState();
    }
  },

  // ========== 游戏状态测试 ==========

  testGameStateInit() {
    this.runTest('游戏状态初始化', () => {
      const state = gameState.get();
      assert(Array.isArray(state.grid), 'grid 应该是数组');
      assert(Array.isArray(state.inventory), 'inventory 应该是数组');
      assertEquals(state.grid.length, 8, 'grid 应该是 8x8');
      assertEquals(state.realmIndex, 0, '初始境界应该是 0');
      assertEquals(state.stageIndex, 0, '初始阶段应该是 0');
    });
  },

  testGameStateSetGet() {
    this.runTest('游戏状态设置和获取', () => {
      gameState.set('testValue', 123);
      assertEquals(gameState.get('testValue'), 123, '应该能正确设置和获取值');
      
      gameState.set('testValue', 456);
      assertEquals(gameState.get('testValue'), 456, '应该能更新值');
    });
  },

  testStateSubscription() {
    this.runTest('状态订阅机制', () => {
      let called = false;
      let receivedValue = null;
      
      const unsubscribe = gameState.subscribe('testSubscribe', (newVal) => {
        called = true;
        receivedValue = newVal;
      });
      
      gameState.set('testSubscribe', 'hello');
      
      assert(called, '订阅回调应该被调用');
      assertEquals(receivedValue, 'hello', '应该收到正确的值');
      
      unsubscribe();
    });
  },

  // ========== 网格系统测试 ==========

  testGridStructure() {
    this.runTest('网格结构', () => {
      const grid = gameState.get('grid');
      assertEquals(grid.length, 8, '网格应该有 8 行');
      assertEquals(grid[0].length, 8, '每行应该有 8 列');
      
      // 检查所有单元格初始为 null
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          assertEquals(grid[r][c], null, `单元格 [${r},${c}] 应该为 null`);
        }
      }
    });
  },

  testGridItemPlacement() {
    this.runTest('网格物品放置', () => {
      const grid = gameState.get('grid');
      const item = {
        id: generateId(),
        type: 'qi',
        element: 'fire',
        purity: 50,
        level: 0,
        isStone: false
      };
      
      grid[3][4] = item;
      gameState.set('grid', [...grid]);
      
      const newGrid = gameState.get('grid');
      assert(newGrid[3][4] !== null, '物品应该被放置');
      assertEquals(newGrid[3][4].element, 'fire', '物品属性应该正确');
    });
  },

  // ========== 合成系统测试 ==========

  testFindCluster() {
    this.runTest('连通块查找', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill(null));
      const item = { element: 'fire', level: 0, purity: 50, isStone: false };
      
      // 放置3个相连的火元素
      grid[4][4] = { ...item, id: generateId() };
      grid[4][5] = { ...item, id: generateId() };
      grid[5][4] = { ...item, id: generateId() };
      
      gameState.set('grid', grid);
      
      const cluster = mergeSystem.findCluster(4, 4, item);
      assertEquals(cluster.length, 3, '应该找到 3 个连通元素');
    });
  },

  testFindClusterDiagonal() {
    this.runTest('连通块对角线不应相连', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill(null));
      const item = { element: 'fire', level: 0, purity: 50, isStone: false };
      
      // 对角线放置
      grid[4][4] = { ...item, id: generateId() };
      grid[5][5] = { ...item, id: generateId() };
      
      gameState.set('grid', grid);
      
      const cluster = mergeSystem.findCluster(4, 4, item);
      assertEquals(cluster.length, 1, '对角线不应算作连通');
    });
  },

  testFindClusterDifferentElements() {
    this.runTest('不同元素不应连通', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill(null));
      
      grid[4][4] = { element: 'fire', level: 0, purity: 50, isStone: false, id: generateId() };
      grid[4][5] = { element: 'water', level: 0, purity: 50, isStone: false, id: generateId() };
      
      gameState.set('grid', grid);
      
      const cluster = mergeSystem.findCluster(4, 4, grid[4][4]);
      assertEquals(cluster.length, 1, '不同元素不应连通');
    });
  },

  testFindClusterDifferentPurity() {
    this.runTest('不同纯度不应连通', () => {
      const grid = Array(8).fill(null).map(() => Array(8).fill(null));
      const item = { element: 'fire', level: 0, isStone: false };
      
      grid[4][4] = { ...item, purity: 50, id: generateId() };
      grid[4][5] = { ...item, purity: 60, id: generateId() };
      
      gameState.set('grid', grid);
      
      const cluster = mergeSystem.findCluster(4, 4, grid[4][4]);
      assertEquals(cluster.length, 1, '不同纯度不应连通');
    });
  },

  testItemsMatch() {
    this.runTest('物品匹配检查', () => {
      const item1 = { element: 'fire', level: 1, purity: 100, isStone: true };
      const item2 = { element: 'fire', level: 1, purity: 100, isStone: true };
      const item3 = { element: 'water', level: 1, purity: 100, isStone: true };
      
      assert(mergeSystem.itemsMatch(item1, item2), '相同物品应该匹配');
      assert(!mergeSystem.itemsMatch(item1, item3), '不同元素不应匹配');
    });
  },

  // ========== 修为系统测试 ==========

  testRealmStructure() {
    this.runTest('境界数据结构', () => {
      assert(REALMS.length > 0, '应该有境界定义');
      
      REALMS.forEach((realm, i) => {
        assert(realm.name, `境界 ${i} 应该有名称`);
        assert(Array.isArray(realm.stages), `境界 ${i} 应该有阶段数组`);
        assertEquals(realm.stages.length, 4, `境界 ${i} 应该有 4 个阶段`);
        assert(typeof realm.xpPerStage === 'number', `境界 ${i} 应该有 xpPerStage`);
        assert(realm.xpPerStage > 0, `境界 ${i} 的 xpPerStage 应该为正数`);
      });
    });
  },

  testAddXP() {
    this.runTest('增加修为', () => {
      gameState.set('realmIndex', 0);
      gameState.set('stageIndex', 0);
      gameState.set('currentXP', 0);
      
      const result = cultivation.addXP(50);
      
      assertEquals(gameState.get('currentXP'), 50, '修为应该增加');
      assertEquals(result.breakthroughs.length, 0, '不应该突破');
    });
  },

  testStageBreakthrough() {
    this.runTest('阶段突破', () => {
      gameState.set('realmIndex', 0);
      gameState.set('stageIndex', 0);
      gameState.set('currentXP', 50);
      
      const result = cultivation.addXP(100);
      
      assertEquals(gameState.get('stageIndex'), 1, '应该突破到下一阶段');
      assert(result.breakthroughs.length > 0, '应该有突破记录');
    });
  },

  testRealmBreakthrough() {
    this.runTest('境界突破', () => {
      gameState.set('realmIndex', 0);
      gameState.set('stageIndex', 3); // 最后一个阶段
      gameState.set('currentXP', 50);
      
      const result = cultivation.addXP(100);
      
      assertEquals(gameState.get('realmIndex'), 1, '应该突破到下一境界');
      assertEquals(gameState.get('stageIndex'), 0, '阶段应该重置');
      assert(result.breakthroughs.some(b => b.type === 'realm'), '应该有境界突破记录');
    });
  },

  testAbsorbStones() {
    this.runTest('吸收灵石', () => {
      const stones = [
        { element: 'fire', level: 1, isStone: true },
        { element: 'water', level: 2, isStone: true }
      ];
      
      const initialXP = gameState.get('currentXP');
      const result = cultivation.absorbStones(stones);
      
      assert(result.success, '吸收应该成功');
      assert(result.xpGained > 0, '应该获得修为');
      assertEquals(gameState.get('currentXP'), initialXP + result.xpGained, '修为应该正确增加');
    });
  },

  // ========== 挑战系统测试 ==========

  testChallengeStructure() {
    this.runTest('挑战数据结构', () => {
      const challenges = challenge.getAllChallenges();
      assert(challenges.length > 0, '应该有挑战定义');
      
      challenges.forEach(c => {
        assert(c.id, '挑战应该有 ID');
        assert(c.name, '挑战应该有名称');
        assert(c.desc, '挑战应该有描述');
      });
    });
  },

  testChallengeStart() {
    this.runTest('开始挑战', () => {
      const challenges = challenge.getAllChallenges();
      const testChallenge = challenges[0];
      
      const result = challenge.start(testChallenge.id);
      
      assert(result.success, '应该能开始挑战');
      assertEquals(gameState.get('currentChallenge'), testChallenge.id, '当前挑战应该设置');
    });
  },

  // ========== 商店系统测试 ==========

  testShopItems() {
    this.runTest('商店商品', () => {
      const items = shop.getAllItems();
      assert(items.length > 0, '应该有商品');
      
      items.forEach(item => {
        assert(item.id, '商品应该有 ID');
        assert(item.name, '商品应该有名称');
        assert(typeof item.basePrice === 'number', '商品应该有价格');
      });
    });
  },

  testShopPurchase() {
    this.runTest('商店购买', () => {
      // 给足够的货币
      gameState.set('stoneCount', 100);
      
      const items = shop.getAllItems();
      const testItem = items.find(i => i.priceType === 'stone');
      
      if (testItem) {
        const result = shop.purchase(testItem.id);
        
        if (result.success) {
          assert(result.item, '应该返回购买的商品');
        }
      }
    });
  },

  // ========== 事件系统测试 ==========

  testEventBus() {
    this.runTest('事件总线', () => {
      let received = false;
      const testData = { test: true };
      
      const handler = (data) => {
        received = true;
        assertEquals(data.test, true, '应该收到正确的数据');
      };
      
      eventBus.on('test:event', handler);
      eventBus.emit('test:event', testData);
      eventBus.off('test:event', handler);
      
      assert(received, '应该接收到事件');
    });
  },

  // ========== 配置测试 ==========

  testElementsConfig() {
    this.runTest('元素配置', () => {
      assert(ELEMENT_KEYS.length === 5, '应该有 5 个元素');
      assert(ELEMENT_KEYS.includes('gold'), '应该包含金');
      assert(ELEMENT_KEYS.includes('wood'), '应该包含木');
      assert(ELEMENT_KEYS.includes('water'), '应该包含水');
      assert(ELEMENT_KEYS.includes('fire'), '应该包含火');
      assert(ELEMENT_KEYS.includes('earth'), '应该包含土');
    });
  },

  testIdGeneration() {
    this.runTest('ID 生成', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      assert(typeof id1 === 'string', 'ID 应该是字符串');
      assert(id1.length > 0, 'ID 不应该为空');
      assert(id1 !== id2, '每次生成的 ID 应该不同');
    });
  },

  // ========== 运行所有测试 ==========

  /**
   * 运行所有测试
   */
  runAll() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('              🧪 修仙合成系统 - 自动化测试套件               ');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    this.resetResults();
    
    // 游戏状态测试
    console.log('📦 游戏状态测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testGameStateInit();
    this.testGameStateSetGet();
    this.testStateSubscription();
    
    // 网格系统测试
    console.log('\n🎲 网格系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testGridStructure();
    this.testGridItemPlacement();
    
    // 合成系统测试
    console.log('\n🔄 合成系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testFindCluster();
    this.testFindClusterDiagonal();
    this.testFindClusterDifferentElements();
    this.testFindClusterDifferentPurity();
    this.testItemsMatch();
    
    // 修为系统测试
    console.log('\n🎯 修为系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testRealmStructure();
    this.testAddXP();
    this.testStageBreakthrough();
    this.testRealmBreakthrough();
    this.testAbsorbStones();
    
    // 挑战系统测试
    console.log('\n🏆 挑战系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testChallengeStructure();
    this.testChallengeStart();
    
    // 商店系统测试
    console.log('\n🏪 商店系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testShopItems();
    this.testShopPurchase();
    
    // 事件系统测试
    console.log('\n📡 事件系统测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testEventBus();
    
    // 配置测试
    console.log('\n⚙️ 配置测试');
    console.log('─────────────────────────────────────────────────────────');
    this.testElementsConfig();
    this.testIdGeneration();
    
    // 输出结果
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                      📊 测试结果                          ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   ✅ 通过: ${this.results.passed}`);
    console.log(`   ❌ 失败: ${this.results.failed}`);
    console.log(`   📈 通过率: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (this.results.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.errors.forEach(e => {
        console.log(`   - ${e.name}`);
      });
    }
    
    return this.results;
  },

  /**
   * 运行指定类别的测试
   */
  runCategory(category) {
    const categories = {
      state: [this.testGameStateInit, this.testGameStateSetGet, this.testStateSubscription],
      grid: [this.testGridStructure, this.testGridItemPlacement],
      merge: [this.testFindCluster, this.testFindClusterDiagonal, this.testFindClusterDifferentElements, 
              this.testFindClusterDifferentPurity, this.testItemsMatch],
      cultivation: [this.testRealmStructure, this.testAddXP, this.testStageBreakthrough, 
                   this.testRealmBreakthrough, this.testAbsorbStones],
      challenge: [this.testChallengeStructure, this.testChallengeStart],
      shop: [this.testShopItems, this.testShopPurchase],
      event: [this.testEventBus],
      config: [this.testElementsConfig, this.testIdGeneration]
    };
    
    const tests = categories[category];
    if (!tests) {
      console.error(`未知类别: ${category}`);
      console.log('可用类别:', Object.keys(categories).join(', '));
      return;
    }
    
    console.log(`\n🧪 运行 ${category} 类别测试...`);
    this.resetResults();
    tests.forEach(test => test.call(this));
    
    console.log(`\n结果: ${this.results.passed} 通过, ${this.results.failed} 失败`);
    return this.results;
  }
};

// 挂载到全局
if (typeof window !== 'undefined') {
  window.CultivationTests = Tests;
  window.runAllTests = () => Tests.runAll();
  window.runTests = (category) => Tests.runCategory(category);
}

export default Tests;
