/**
 * Debug Tools - 调试工具
 * 提供游戏开发和测试用的便捷命令
 * 
 * 使用方法：
 * 1. 在浏览器控制台输入 CultivationDebug 访问所有调试功能
 * 2. 输入 CultivationDebug.help() 查看帮助
 */

import { gameState } from '../v3/js/core/GameState.js';
import { mergeSystem } from '../v3/js/systems/MergeSystem.js';
import { cultivation } from '../v3/js/systems/Cultivation.js';
import { REALMS, ELEMENT_KEYS, generateId } from '../v3/js/config.js';

// 确保游戏状态可用
const getState = () => gameState.get();
const setState = (key, value) => gameState.set(key, value);

export const CultivationDebug = {
  // ========== 物品操作 ==========

  /**
   * 快速给予物品到库存
   * @param {Object} config - 配置对象
   * @param {string} config.element - 元素类型 (gold/wood/water/fire/earth)
   * @param {number} config.level - 灵石等级 (0=灵气)
   * @param {number} config.count - 数量
   * @param {number} config.purity - 灵气纯度 (1-100)
   * @param {boolean} config.isStone - 是否灵石
   */
  giveItems({ element, level = 0, count = 1, purity = 10, isStone = false }) {
    const inventory = getState().inventory;
    const validElements = ELEMENT_KEYS;
    
    if (!validElements.includes(element)) {
      console.error(`❌ 无效元素: ${element}. 可选: ${validElements.join(', ')}`);
      return;
    }

    for (let i = 0; i < count; i++) {
      const item = {
        id: generateId(),
        type: isStone || level > 0 ? 'stone' : 'qi',
        element,
        level: isStone || level > 0 ? level : 0,
        purity: isStone || level > 0 ? 100 : purity,
        isStone: isStone || level > 0
      };
      inventory.push(item);
    }

    setState('inventory', [...inventory]);
    console.log(`✅ 已给予 ${count} 个 ${this.getElementName(element)} ${isStone || level > 0 ? `Lv.${level}灵石` : `${purity}%灵气`}`);
  },

  /**
   * 快速给予灵石
   * @param {string} element - 元素
   * @param {number} level - 等级
   * @param {number} count - 数量
   */
  giveStones(element, level = 1, count = 1) {
    return this.giveItems({ element, level, count, isStone: true });
  },

  /**
   * 快速给予灵气
   * @param {string} element - 元素
   * @param {number} purity - 纯度
   * @param {number} count - 数量
   */
  giveQi(element, purity = 10, count = 1) {
    return this.giveItems({ element, level: 0, count, purity, isStone: false });
  },

  // ========== 境界设置 ==========

  /**
   * 设置境界和阶段
   * @param {number} realmIndex - 境界索引 (0-8)
   * @param {number} stageIndex - 阶段索引 (0-3)
   */
  setRealm(realmIndex, stageIndex = 0) {
    if (realmIndex < 0 || realmIndex >= REALMS.length) {
      console.error(`❌ 无效境界索引: ${realmIndex}. 范围: 0-${REALMS.length - 1}`);
      console.log('可用境界:');
      REALMS.forEach((r, i) => console.log(`  ${i}: ${r.name}`));
      return;
    }

    if (stageIndex < 0 || stageIndex >= 4) {
      console.error(`❌ 无效阶段索引: ${stageIndex}. 范围: 0-3`);
      return;
    }

    setState('realmIndex', realmIndex);
    setState('stageIndex', stageIndex);
    setState('currentXP', 0);

    const realm = REALMS[realmIndex];
    console.log(`✅ 境界已设置: ${realm.name} ${realm.stages[stageIndex]}`);
    console.log(`   境界加成: +${realm.bonus}%`);
  },

  /**
   * 增加修为
   * @param {number} amount - 修为值
   */
  addXP(amount) {
    const result = cultivation.addXP(amount);
    console.log(`✅ 增加 ${amount} 修为`);
    if (result.breakthroughs.length > 0) {
      result.breakthroughs.forEach(bt => {
        console.log(`🎉 ${bt.type === 'realm' ? '突破境界' : '突破阶段'}: ${bt.to || bt.stage}`);
      });
    }
    return result;
  },

  // ========== 货币设置 ==========

  /**
   * 设置灵石数量
   * @param {number} amount - 数量
   */
  setMoney(amount) {
    if (typeof amount !== 'number' || amount < 0) {
      console.error('❌ 无效金额');
      return;
    }
    setState('stoneCount', Math.floor(amount));
    console.log(`✅ 灵石数量已设置: ${amount}`);
  },

  /**
   * 设置合成次数
   * @param {number} amount - 数量
   */
  setMergeCount(amount) {
    setState('mergeCount', Math.floor(amount));
    console.log(`✅ 合成次数已设置: ${amount}`);
  },

  // ========== 网格操作 ==========

  /**
   * 在网格指定位置放置物品
   * @param {number} row - 行 (0-7)
   * @param {number} col - 列 (0-7)
   * @param {Object} item - 物品对象
   */
  placeAt(row, col, item) {
    const grid = getState().grid;
    if (row < 0 || row >= 8 || col < 0 || col >= 8) {
      console.error(`❌ 无效位置: [${row},${col}]. 范围: 0-7`);
      return;
    }
    grid[row][col] = { ...item, id: generateId() };
    setState('grid', [...grid]);
    console.log(`✅ 已放置 ${this.getElementName(item.element)} 到 [${row},${col}]`);
  },

  /**
   * 填充整个网格
   * @param {string} element - 元素类型
   * @param {number} level - 等级 (0=灵气)
   * @param {number} purity - 纯度
   */
  fillGrid(element, level = 0, purity = 50) {
    const grid = getState().grid;
    const isStone = level > 0;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        grid[r][c] = {
          id: generateId(),
          type: isStone ? 'stone' : 'qi',
          element,
          level: isStone ? level : 0,
          purity: isStone ? 100 : purity,
          isStone
        };
      }
    }
    
    setState('grid', [...grid]);
    console.log(`✅ 网格已填充: ${this.getElementName(element)} ${isStone ? `Lv.${level}灵石` : `${purity}%灵气`}`);
  },

  /**
   * 清空网格和库存
   */
  clear() {
    setState('grid', Array(8).fill(null).map(() => Array(8).fill(null)));
    setState('inventory', []);
    console.log('✅ 网格和库存已清空');
  },

  /**
   * 仅清空网格
   */
  clearGrid() {
    setState('grid', Array(8).fill(null).map(() => Array(8).fill(null)));
    console.log('✅ 网格已清空');
  },

  /**
   * 仅清空库存
   */
  clearInventory() {
    setState('inventory', []);
    console.log('✅ 库存已清空');
  },

  // ========== 模拟功能 ==========

  /**
   * 模拟N次合成
   * @param {number} n - 模拟次数
   * @returns {Object} 模拟结果统计
   */
  simulateMerges(n = 10) {
    console.log(`🔄 开始模拟 ${n} 次合成...`);
    
    const stats = {
      total: 0,
      perfect: 0,
      qiToStone: 0,  // 灵气提纯为灵石
      stoneLevelUp: 0,  // 灵石升级
      averagePurityGain: 0
    };

    for (let i = 0; i < n; i++) {
      // 随机选择元素
      const element = ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
      
      // 在网格中放置3个相邻的灵气
      const startRow = Math.floor(Math.random() * 6) + 1;
      const startCol = Math.floor(Math.random() * 6) + 1;
      
      const positions = [
        [startRow, startCol],
        [startRow, startCol + 1],
        [startRow + 1, startCol]
      ];

      const purity = 30 + Math.floor(Math.random() * 40);
      
      positions.forEach(([r, c]) => {
        this.placeAt(r, c, {
          type: 'qi',
          element,
          level: 0,
          purity,
          isStone: false
        });
      });

      // 执行合并检查
      const grid = getState().grid;
      const cluster = mergeSystem.findCluster(startRow, startCol, grid[startRow][startCol]);
      
      if (cluster.length >= 3) {
        stats.total++;
        
        // 记录结果
        const result = mergeSystem.performMerge(cluster, grid[startRow][startCol]);
        
        if (result.purity === 100 && !result.isStone) {
          stats.perfect++;
        }
        if (result.isStone && result.level === 1) {
          stats.qiToStone++;
        }
        if (result.isStone && result.level > 1) {
          stats.stoneLevelUp++;
        }
      }
    }

    console.log('📊 模拟结果:');
    console.log(`   总合成次数: ${stats.total}/${n}`);
    console.log(`   完美提纯: ${stats.perfect} (${((stats.perfect/stats.total)*100).toFixed(1)}%)`);
    console.log(`   灵气→灵石: ${stats.qiToStone}`);
    console.log(`   灵石升级: ${stats.stoneLevelUp}`);
    
    return stats;
  },

  /**
   * 模拟突破到指定境界所需时间
   * @param {number} targetRealm - 目标境界
   */
  simulateBreakthrough(targetRealm = 8) {
    console.log(`🔄 模拟突破到 ${REALMS[targetRealm]?.name || '最高境界'}...`);
    
    let totalXP = 0;
    for (let i = 0; i < targetRealm; i++) {
      totalXP += REALMS[i].xpPerStage * 4; // 4个阶段
    }

    // 假设每秒100修为，有50%时间用于摆放和合成
    const xpPerSecond = 100 * 0.5;
    const seconds = totalXP / xpPerSecond;
    
    console.log(`📊 预计所需:`);
    console.log(`   总修为: ${totalXP}`);
    console.log(`   预估时间: ${this.formatTime(seconds)}`);
    console.log(`   (假设每秒有效修为获取为 ${xpPerSecond})`);
    
    return { totalXP, estimatedSeconds: seconds };
  },

  // ========== 数值平衡检查 ==========

  /**
   * 检查游戏数值平衡
   * @returns {Object} 平衡报告
   */
  checkBalance() {
    const report = {
      realms: [],
      mergeRatios: [],
      shopBalance: [],
      collectionBalance: []
    };

    console.log('📊 数值平衡检查报告');
    console.log('========================');

    // 1. 检查境界修为需求
    console.log('\n🎯 境界修为需求:');
    REALMS.forEach((realm, i) => {
      const totalXP = realm.xpPerStage * 4;
      const prevTotal = i > 0 ? REALMS[i-1].xpPerStage * 4 : 100;
      const ratio = (totalXP / prevTotal).toFixed(2);
      const ok = totalXP / prevTotal >= 1.5 && totalXP / prevTotal <= 3;
      
      report.realms.push({
        name: realm.name,
        xpPerStage: realm.xpPerStage,
        totalXP,
        ratio,
        ok,
        bonus: realm.bonus
      });
      
      console.log(`   ${realm.name}: 阶段${realm.xpPerStage} | 总计${totalXP} | 倍率${ratio}x ${ok ? '✅' : '⚠️'}`);
    });

    // 2. 检查合成倍率
    console.log('\n🔄 合成数量倍率:');
    const mergeCounts = [3, 4, 5, 6, 7, 8];
    mergeCounts.forEach(count => {
      const baseMultiplier = count;
      const bonus5Plus = count >= 5 ? 1.5 : 1;
      const totalMultiplier = (baseMultiplier * bonus5Plus).toFixed(2);
      
      // 30%纯度起步，计算最终纯度
      const finalPurity = Math.min(100, Math.floor(30 * totalMultiplier));
      
      report.mergeRatios.push({ count, multiplier: totalMultiplier, finalPurity });
      console.log(`   ${count}合1: ${totalMultiplier}x → ${finalPurity}%纯度`);
    });

    // 3. 检查工坊价格
    console.log('\n🏪 工坊价格检查:');
    // 假设基础获取速度
    const stonePerMinute = 2;
    const mergePerMinute = 5;
    
    const shopItems = [
      { id: 'auto_capture', name: '自动捕捉', basePrice: 5, priceType: 'stone' },
      { id: 'merge_boost', name: '合成加速', basePrice: 10, priceType: 'stone' },
      { id: 'xp_boost', name: '修为增幅', basePrice: 100, priceType: 'merge' },
      { id: 'lucky_charm', name: '聚灵符', basePrice: 50, priceType: 'stone' }
    ];
    
    shopItems.forEach(item => {
      const price = item.basePrice;
      const minutes = item.priceType === 'stone' 
        ? price / stonePerMinute 
        : price / mergePerMinute;
      
      report.shopBalance.push({
        name: item.name,
        price,
        type: item.priceType,
        estimatedMinutes: Math.round(minutes)
      });
      
      console.log(`   ${item.name}: ${price}${item.priceType === 'stone' ? '💎' : '⚡'} (~${Math.round(minutes)}分钟)`);
    });

    // 4. 图鉴收集难度
    console.log('\n📚 图鉴收集:');
    const totalItems = 45; // 5元素 x 9等级
    const estimatedStonePerLevel = 3; // 平均需要3颗灵石才能升到下一级
    const totalStonesNeeded = totalItems * estimatedStonePerLevel;
    
    report.collectionBalance.push({
      totalItems,
      estimatedStonePerLevel,
      totalStonesNeeded,
      estimatedHours: (totalStonesNeeded / stonePerMinute / 60).toFixed(1)
    });
    
    console.log(`   总收集项: ${totalItems}`);
    console.log(`   预估总灵石需求: ~${totalStonesNeeded}`);
    console.log(`   预估收集时间: ~${(totalStonesNeeded / stonePerMinute / 60).toFixed(1)}小时`);

    console.log('\n========================');
    return report;
  },

  // ========== 性能测试 ==========

  /**
   * 性能测试
   */
  benchmark() {
    console.log('🚀 开始性能测试...');
    
    const results = {
      bfs: {},
      stateUpdate: {},
      merge: {},
      render: {}
    };

    // 1. BFS连通块查找测试
    console.log('\n1️⃣ BFS连通块查找测试');
    const iterations = 10000;
    const testGrid = getState().grid;
    
    // 预设一些测试数据
    testGrid[4][4] = { element: 'fire', level: 1, purity: 100, isStone: true };
    testGrid[4][5] = { element: 'fire', level: 1, purity: 100, isStone: true };
    testGrid[5][4] = { element: 'fire', level: 1, purity: 100, isStone: true };
    
    const bfsStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      mergeSystem.findCluster(4, 4, testGrid[4][4]);
    }
    const bfsDuration = performance.now() - bfsStart;
    
    results.bfs = {
      iterations,
      totalMs: bfsDuration.toFixed(2),
      perOpMs: (bfsDuration / iterations).toFixed(4),
      opsPerSecond: Math.floor(iterations / (bfsDuration / 1000))
    };
    
    console.log(`   ${iterations}次: ${bfsDuration.toFixed(2)}ms`);
    console.log(`   平均: ${(bfsDuration / iterations).toFixed(4)}ms/次`);
    console.log(`   每秒: ${Math.floor(iterations / (bfsDuration / 1000))}次`);

    // 2. 状态更新测试
    console.log('\n2️⃣ 状态更新测试');
    const stateIterations = 1000;
    const stateStart = performance.now();
    
    for (let i = 0; i < stateIterations; i++) {
      setState('captureCount', i);
    }
    const stateDuration = performance.now() - stateStart;
    
    results.stateUpdate = {
      iterations: stateIterations,
      totalMs: stateDuration.toFixed(2),
      perOpMs: (stateDuration / stateIterations).toFixed(4)
    };
    
    console.log(`   ${stateIterations}次: ${stateDuration.toFixed(2)}ms`);
    console.log(`   平均: ${(stateDuration / stateIterations).toFixed(4)}ms/次`);

    // 3. 内存占用估算
    console.log('\n3️⃣ 内存占用估算');
    const state = getState();
    const stateJson = JSON.stringify(state);
    const estimatedBytes = stateJson.length * 2; // UTF-16
    
    results.memory = {
      estimatedKB: (estimatedBytes / 1024).toFixed(2),
      gridCells: 64,
      inventoryItems: state.inventory.length
    };
    
    console.log(`   状态大小: ~${(estimatedBytes / 1024).toFixed(2)}KB`);
    console.log(`   网格单元: 64`);
    console.log(`   库存物品: ${state.inventory.length}`);

    // 4. 总体评分
    console.log('\n📊 性能评分:');
    const bfsScore = bfsDuration < 100 ? '优秀 ✅' : bfsDuration < 500 ? '良好 ⚡' : '需优化 ⚠️';
    const stateScore = stateDuration < 50 ? '优秀 ✅' : stateDuration < 200 ? '良好 ⚡' : '需优化 ⚠️';
    
    console.log(`   BFS查找: ${bfsScore}`);
    console.log(`   状态更新: ${stateScore}`);

    return results;
  },

  // ========== 辅助方法 ==========

  getElementName(element) {
    const names = { gold: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    return names[element] || element;
  },

  formatTime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
    return `${Math.floor(seconds / 86400)}天`;
  },

  // ========== 帮助信息 ==========

  help() {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           🎮 修仙合成系统 - 调试工具 v1.0                         ║
╠══════════════════════════════════════════════════════════════════╣
  
  📦 物品操作
  ───────────────────────────────────────────────────────────────
  giveItems({element, level, count, purity})  给予物品到库存
  giveStones(element, level, count)           快速给予灵石
  giveQi(element, purity, count)              快速给予灵气
  
  🎯 境界设置
  ───────────────────────────────────────────────────────────────
  setRealm(realmIndex, stageIndex)            设置境界(0-8, 0-3)
  addXP(amount)                               增加修为
  
  💰 货币设置
  ───────────────────────────────────────────────────────────────
  setMoney(amount)                            设置灵石数量
  setMergeCount(amount)                       设置合成次数
  
  🎲 网格操作
  ───────────────────────────────────────────────────────────────
  placeAt(row, col, item)                     在指定位置放置物品
  fillGrid(element, level, purity)            填充整个网格
  clear()                                     清空网格和库存
  clearGrid()                                 仅清空网格
  clearInventory()                            仅清空库存
  
  🔄 模拟功能
  ───────────────────────────────────────────────────────────────
  simulateMerges(n)                           模拟N次合成
  simulateBreakthrough(targetRealm)           模拟突破所需时间
  
  📊 数值平衡
  ───────────────────────────────────────────────────────────────
  checkBalance()                              检查数值平衡
  
  ⚡ 性能测试
  ───────────────────────────────────────────────────────────────
  benchmark()                                 运行性能测试
  
  📚 其他
  ───────────────────────────────────────────────────────────────
  help()                                      显示此帮助
  
╚══════════════════════════════════════════════════════════════════╝

💡 使用示例:
  CultivationDebug.giveItems({element: 'fire', level: 1, count: 5})
  CultivationDebug.setRealm(2, 0)  // 设置到金丹期前期
  CultivationDebug.fillGrid('water', 0, 50)
  CultivationDebug.simulateMerges(20)
  CultivationDebug.checkBalance()
`);
  }
};

// 挂载到全局对象
if (typeof window !== 'undefined') {
  window.CultivationDebug = CultivationDebug;
  console.log('🎮 调试工具已加载! 输入 CultivationDebug.help() 查看帮助');
}

export default CultivationDebug;
