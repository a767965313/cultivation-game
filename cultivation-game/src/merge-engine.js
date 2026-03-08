/**
 * 修仙合成算法引擎
 * Merge Engine for Cultivation Game
 * 
 * 核心功能：
 * - BFS连通块查找（四方向）
 * - 合成触发判定（3+相邻）
 * - 完美合成判定（纯度≥90% 或 有相生元素）
 * - 执行合成（计算新物品）
 */

// ========== 常量配置 ==========
const GRID_SIZE = 8; // 8x8 网格
const MERGE_THRESHOLD = 3; // 合成阈值：3个及以上相邻
const PERFECT_PURITY = 90; // 完美合成纯度阈值
const MAX_PURITY = 100; // 最大纯度

// 元素定义
const ELEMENTS = {
  gold: { name: '金', icon: '⚔️' },
  wood: { name: '木', icon: '🌿' },
  water: { name: '水', icon: '💧' },
  fire: { name: '火', icon: '🔥' },
  earth: { name: '土', icon: '🏔️' }
};

// 元素键值数组
const ELEMENT_KEYS = Object.keys(ELEMENTS);

// 相生关系链：木→火→土→金→水→木
const SHENG_XIANG = {
  wood: 'fire',
  fire: 'earth',
  earth: 'gold',
  gold: 'water',
  water: 'wood'
};

// 相克关系链：金→木→土→水→火→金
const KE_XIANG = {
  gold: 'wood',
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'gold'
};

// 四方向偏移量 [上, 下, 左, 右]
const DIRECTIONS_4 = [
  -GRID_SIZE, // 上
  GRID_SIZE,  // 下
  -1,         // 左
  1           // 右
];

// ========== 工具函数 ==========

/**
 * 将一维索引转换为二维坐标
 * @param {number} index - 一维索引 (0-63)
 * @returns {{row: number, col: number}} 二维坐标
 */
function indexToCoord(index) {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE
  };
}

/**
 * 将二维坐标转换为一维索引
 * @param {number} row - 行坐标
 * @param {number} col - 列坐标
 * @returns {number} 一维索引
 */
function coordToIndex(row, col) {
  return row * GRID_SIZE + col;
}

/**
 * 检查两个索引是否相邻（四方向）
 * @param {number} idx1 - 索引1
 * @param {number} idx2 - 索引2
 * @returns {boolean} 是否相邻
 */
function isAdjacent4(idx1, idx2) {
  const c1 = indexToCoord(idx1);
  const c2 = indexToCoord(idx2);
  const rowDiff = Math.abs(c1.row - c2.row);
  const colDiff = Math.abs(c1.col - c2.col);
  // 四方向相邻：行差为1且列差为0，或行差为0且列差为1
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * 获取有效的四方向邻居索引
 * @param {number} index - 当前索引
 * @returns {number[]} 邻居索引数组
 */
function getNeighbors4(index) {
  const { row, col } = indexToCoord(index);
  const neighbors = [];
  
  if (row > 0) neighbors.push(index - GRID_SIZE); // 上
  if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE); // 下
  if (col > 0) neighbors.push(index - 1); // 左
  if (col < GRID_SIZE - 1) neighbors.push(index + 1); // 右
  
  return neighbors;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== 核心算法 ==========

/**
 * BFS查找连通块（四方向）
 * 查找与起始位置相同元素类型且等级/纯度相同的所有相邻格子
 * 
 * @param {Array} grid - 网格数组，每个元素为 {element, purity, level, isStone} 或 null
 * @param {number} startIndex - 起始索引 (0-63)
 * @param {string} elementType - 元素类型 (gold/wood/water/fire/earth)
 * @returns {number[]} 连通块索引数组（包含起始索引）
 */
function findConnected(grid, startIndex, elementType) {
  // 边界检查
  if (startIndex < 0 || startIndex >= GRID_SIZE * GRID_SIZE) {
    return [];
  }
  
  const startItem = grid[startIndex];
  if (!startItem || startItem.element !== elementType) {
    return [];
  }
  
  const visited = new Set();
  const queue = [startIndex];
  const connected = [];
  
  // 使用队列进行BFS
  while (queue.length > 0) {
    const idx = queue.shift();
    
    if (visited.has(idx)) continue;
    visited.add(idx);
    
    const item = grid[idx];
    
    // 检查是否为相同元素类型
    if (!item || item.element !== elementType) continue;
    
    // 如果是灵气，检查纯度是否一致；如果是灵石，检查等级是否一致
    if (!startItem.isStone && !item.isStone) {
      // 都是灵气，纯度必须一致
      if (item.purity !== startItem.purity) continue;
    } else if (startItem.isStone && item.isStone) {
      // 都是灵石，等级必须一致
      if (item.level !== startItem.level) continue;
    } else {
      // 一个是灵气一个是灵石，不能合并
      continue;
    }
    
    connected.push(idx);
    
    // 获取四方向邻居
    const neighbors = getNeighbors4(idx);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
  
  return connected;
}

/**
 * 检查是否存在相生元素在连通块相邻位置
 * 相生链：木→火→土→金→水→木
 * 要找的是：什么元素生出我（比如火需要木来生）
 * 
 * @param {number[]} connectedIndices - 连通块索引数组
 * @param {Array} grid - 网格数组
 * @returns {boolean} 是否存在相生元素
 */
function hasShengXiangElement(connectedIndices, grid) {
  if (connectedIndices.length === 0) return false;
  
  const firstItem = grid[connectedIndices[0]];
  if (!firstItem) return false;
  
  const targetElement = firstItem.element;
  // 反向查找：哪个元素生出我（如 fire 需要 wood 来生）
  const supportingElement = Object.keys(SHENG_XIANG).find(key => SHENG_XIANG[key] === targetElement);
  
  // 检查连通块周围是否有相生元素
  const connectedSet = new Set(connectedIndices);
  const checkedNeighbors = new Set();
  
  for (const idx of connectedIndices) {
    const neighbors = getNeighbors4(idx);
    for (const neighbor of neighbors) {
      // 避免重复检查
      if (checkedNeighbors.has(neighbor)) continue;
      checkedNeighbors.add(neighbor);
      
      // 如果邻居不在连通块内，但元素相生
      if (!connectedSet.has(neighbor)) {
        const neighborItem = grid[neighbor];
        if (neighborItem && neighborItem.element === supportingElement) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * 检查完美合成条件
 * 条件1：所有元素纯度 >= 90%
 * 条件2：有相生元素在相邻位置（仅对灵气有效）
 * 
 * @param {number[]} connectedIndices - 连通块索引数组
 * @param {Array} grid - 网格数组
 * @returns {boolean} 是否满足完美合成条件
 */
function checkPerfectMerge(connectedIndices, grid) {
  if (connectedIndices.length < MERGE_THRESHOLD) return false;
  
  const items = connectedIndices.map(i => grid[i]);
  const firstItem = items[0];
  
  // 条件1：所有元素纯度 >= 90%
  // 对于灵石，纯度固定为100，天然满足
  const allHighPurity = items.every(item => item.purity >= PERFECT_PURITY);
  if (allHighPurity) return true;
  
  // 条件2：有相生元素在相邻位置（灵气才需要此条件）
  if (!firstItem.isStone) {
    const hasSupportingElement = hasShengXiangElement(connectedIndices, grid);
    if (hasSupportingElement) return true;
  }
  
  return false;
}

/**
 * 检查合成条件
 * 检查指定位置是否可以触发合成
 * 
 * @param {Array} grid - 网格数组
 * @param {number} index - 要检查的位置索引
 * @returns {Object|null} 合成结果对象或null
 *   { indices: number[], newLevel: number, isPerfect: boolean, newPurity: number, newItem: Object }
 */
function checkMerge(grid, index) {
  // 边界检查
  if (index < 0 || index >= GRID_SIZE * GRID_SIZE) {
    return null;
  }
  
  const item = grid[index];
  if (!item) return null;
  
  // 使用BFS查找连通块
  const connected = findConnected(grid, index, item.element);
  
  // 合成阈值检查：至少需要3个相邻
  if (connected.length < MERGE_THRESHOLD) {
    return null;
  }
  
  // 检查是否完美合成
  const isPerfect = checkPerfectMerge(connected, grid);
  
  // 计算新物品的等级和纯度
  const count = connected.length;
  const firstItem = grid[connected[0]];
  
  let newLevel = 0;
  let newPurity = 0;
  let newItem = null;
  
  if (firstItem.isStone) {
    // 灵石合成：等级提升
    const levelUp = Math.floor(count / 3);
    newLevel = firstItem.level + levelUp;
    newPurity = MAX_PURITY;
    newItem = createStone(firstItem.element, newLevel);
  } else {
    // 灵气合成：纯度提升
    // 基础提升：每个参与合成的灵气提供10%基础纯度
    const baseMultiplier = count;
    // 完美合成加成：50%额外纯度
    const perfectBonus = isPerfect ? 1.5 : 1.0;
    // 计算新纯度
    newPurity = Math.min(MAX_PURITY, Math.floor(firstItem.purity * baseMultiplier * perfectBonus));
    
    if (newPurity >= MAX_PURITY) {
      // 纯度达到100%，转化为1级灵石
      newLevel = 1;
      newPurity = MAX_PURITY;
      newItem = createStone(firstItem.element, 1);
    } else {
      // 仍然是灵气，纯度提升
      newLevel = 0;
      newItem = createQi(firstItem.element, newPurity);
    }
  }
  
  return {
    indices: connected,
    newLevel,
    isPerfect,
    newPurity,
    newItem,
    count,
    element: firstItem.element
  };
}

/**
 * 执行合成
 * 移除旧物品，生成新物品放在连通块的第一个位置
 * 
 * @param {number[]} indices - 要合成的索引数组
 * @param {Array} grid - 网格数组（会被修改）
 * @returns {Object} 新物品对象
 */
function executeMerge(indices, grid) {
  if (indices.length < MERGE_THRESHOLD) {
    throw new Error(`合成失败：至少需要${MERGE_THRESHOLD}个物品，当前只有${indices.length}个`);
  }
  
  // 检查所有索引是否有效
  for (const idx of indices) {
    if (idx < 0 || idx >= GRID_SIZE * GRID_SIZE) {
      throw new Error(`无效索引: ${idx}`);
    }
    if (!grid[idx]) {
      throw new Error(`索引 ${idx} 处没有物品`);
    }
  }
  
  // 执行合成检查获取新物品
  const mergeResult = checkMerge(grid, indices[0]);
  if (!mergeResult) {
    throw new Error('合成条件不满足');
  }
  
  // 清除所有参与合成的格子（保留第一个位置放新物品）
  for (let i = 1; i < indices.length; i++) {
    grid[indices[i]] = null;
  }
  
  // 在第一个位置放置新物品
  const targetIndex = indices[0];
  grid[targetIndex] = { ...mergeResult.newItem, id: generateId() };
  
  return grid[targetIndex];
}

// ========== 物品创建函数 ==========

/**
 * 创建灵气物品
 * @param {string} element - 元素类型
 * @param {number} purity - 纯度 (1-100)
 * @returns {Object} 灵气物品对象
 */
function createQi(element, purity = 10) {
  if (!ELEMENT_KEYS.includes(element)) {
    throw new Error(`无效元素类型: ${element}`);
  }
  
  return {
    id: generateId(),
    type: 'qi',
    element,
    purity: Math.min(MAX_PURITY, Math.max(1, purity)),
    level: 0,
    isStone: false
  };
}

/**
 * 创建灵石物品
 * @param {string} element - 元素类型
 * @param {number} level - 等级 (1+)
 * @returns {Object} 灵石物品对象
 */
function createStone(element, level = 1) {
  if (!ELEMENT_KEYS.includes(element)) {
    throw new Error(`无效元素类型: ${element}`);
  }
  
  return {
    id: generateId(),
    type: 'stone',
    element,
    purity: MAX_PURITY,
    level: Math.max(1, level),
    isStone: true
  };
}

// ========== 导出模块 ==========

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // 核心函数
    findConnected,
    checkMerge,
    executeMerge,
    checkPerfectMerge,
    hasShengXiangElement,
    
    // 物品创建
    createQi,
    createStone,
    
    // 工具函数
    indexToCoord,
    coordToIndex,
    isAdjacent4,
    getNeighbors4,
    generateId,
    
    // 常量
    GRID_SIZE,
    MERGE_THRESHOLD,
    PERFECT_PURITY,
    MAX_PURITY,
    ELEMENTS,
    ELEMENT_KEYS,
    SHENG_XIANG,
    KE_XIANG
  };
}

// ========== 测试代码 ==========

function runTests() {
  console.log('🧪 开始运行合成引擎测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ ${testName}`);
      passed++;
    } else {
      console.log(`❌ ${testName}`);
      failed++;
    }
  }
  
  // 测试1: 工具函数 - 坐标转换
  console.log('--- 测试1: 坐标转换 ---');
  assert(coordToIndex(0, 0) === 0, '坐标(0,0)转换为索引0');
  assert(coordToIndex(0, 7) === 7, '坐标(0,7)转换为索引7');
  assert(coordToIndex(1, 0) === 8, '坐标(1,0)转换为索引8');
  assert(coordToIndex(7, 7) === 63, '坐标(7,7)转换为索引63');
  
  const coord = indexToCoord(10);
  assert(coord.row === 1 && coord.col === 2, '索引10转换为坐标(1,2)');
  
  // 测试2: 邻居查找
  console.log('\n--- 测试2: 邻居查找 ---');
  const neighbors0 = getNeighbors4(0);
  assert(neighbors0.includes(1) && neighbors0.includes(8), '索引0的邻居是1和8');
  assert(!neighbors0.includes(-1) && !neighbors0.includes(-8), '索引0没有越界邻居');
  
  const neighbors63 = getNeighbors4(63);
  assert(neighbors63.includes(62) && neighbors63.includes(55), '索引63的邻居是62和55');
  
  // 测试3: 相邻检查
  console.log('\n--- 测试3: 相邻检查 ---');
  assert(isAdjacent4(0, 1), '索引0和1水平相邻');
  assert(isAdjacent4(0, 8), '索引0和8垂直相邻');
  assert(!isAdjacent4(0, 9), '索引0和9不相邻（对角）');
  assert(!isAdjacent4(0, 2), '索引0和2不相邻（距离2）');
  
  // 测试4: 3个水平相邻 - 应触发合成
  console.log('\n--- 测试4: 3个水平相邻 ---');
  let grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[11] = createQi('fire', 10);
  grid[12] = createQi('fire', 10);
  const result4 = checkMerge(grid, 10);
  assert(result4 !== null && result4.count === 3, '3个水平相邻触发合成');
  assert(result4.indices.includes(10) && result4.indices.includes(11) && result4.indices.includes(12), '连通块包含正确索引');
  
  // 测试5: 3个垂直相邻 - 应触发合成
  console.log('\n--- 测试5: 3个垂直相邻 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('water', 20);
  grid[18] = createQi('water', 20);
  grid[26] = createQi('water', 20);
  const result5 = checkMerge(grid, 18);
  assert(result5 !== null && result5.count === 3, '3个垂直相邻触发合成');
  
  // 测试6: 4个L型 - 应触发合成
  console.log('\n--- 测试6: 4个L型 ---');
  grid = Array(64).fill(null);
  grid[20] = createQi('wood', 15);
  grid[21] = createQi('wood', 15);
  grid[28] = createQi('wood', 15); // 21下方
  grid[29] = createQi('wood', 15); // 28右侧
  const result6 = checkMerge(grid, 20);
  assert(result6 !== null && result6.count === 4, '4个L型触发合成');
  
  // 测试7: 2个相邻 - 不应触发
  console.log('\n--- 测试7: 2个相邻 ---');
  grid = Array(64).fill(null);
  grid[30] = createQi('gold', 10);
  grid[31] = createQi('gold', 10);
  const result7 = checkMerge(grid, 30);
  assert(result7 === null, '2个相邻不触发合成');
  
  // 测试8: 对角相邻 - 不应触发（非四方向）
  console.log('\n--- 测试8: 对角相邻 ---');
  grid = Array(64).fill(null);
  grid[0] = createQi('earth', 10);
  grid[9] = createQi('earth', 10);
  grid[18] = createQi('earth', 10);
  const result8 = checkMerge(grid, 0);
  assert(result8 === null, '对角排列不触发合成');
  
  // 测试9: 边界格子 - 正确处理
  console.log('\n--- 测试9: 边界格子 ---');
  grid = Array(64).fill(null);
  grid[0] = createQi('fire', 10);
  grid[1] = createQi('fire', 10);
  grid[8] = createQi('fire', 10);
  const result9 = checkMerge(grid, 0);
  assert(result9 !== null && result9.count === 3, '边界格子正确触发合成');
  
  // 测试10: 不同元素不合并
  console.log('\n--- 测试10: 不同元素不合并 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[11] = createQi('fire', 10);
  grid[12] = createQi('water', 10); // 不同元素
  const result10 = checkMerge(grid, 10);
  assert(result10 === null, '不同元素不触发合成');
  
  // 测试11: 不同纯度不合并
  console.log('\n--- 测试11: 不同纯度不合并 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[11] = createQi('fire', 10);
  grid[12] = createQi('fire', 20); // 不同纯度
  const result11 = checkMerge(grid, 10);
  assert(result11 === null, '不同纯度不触发合成');
  
  // 测试12: 完美合成 - 纯度>=90%
  console.log('\n--- 测试12: 完美合成（高纯度） ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 90);
  grid[11] = createQi('fire', 90);
  grid[12] = createQi('fire', 90);
  const result12 = checkMerge(grid, 10);
  assert(result12 !== null && result12.isPerfect === true, '纯度≥90%触发完美合成');
  assert(result12.newPurity === 100, '完美合成纯度达到100');
  
  // 测试13: 完美合成 - 有相生元素
  console.log('\n--- 测试13: 完美合成（相生元素） ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10); // 火
  grid[11] = createQi('fire', 10);
  grid[12] = createQi('fire', 10);
  grid[9] = createQi('wood', 10);  // 木生火，相生元素在旁边
  const result13 = checkMerge(grid, 10);
  assert(result13 !== null && result13.isPerfect === true, '有相生元素触发完美合成');
  
  // 测试14: 灵石合成
  console.log('\n--- 测试14: 灵石合成 ---');
  grid = Array(64).fill(null);
  grid[10] = createStone('gold', 1);
  grid[11] = createStone('gold', 1);
  grid[12] = createStone('gold', 1);
  const result14 = checkMerge(grid, 10);
  assert(result14 !== null && result14.newItem.isStone === true, '灵石合成生成灵石');
  assert(result14.newLevel === 2, '3个1级灵石合成2级灵石');
  
  // 测试15: 执行合成
  console.log('\n--- 测试15: 执行合成 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[11] = createQi('fire', 10);
  grid[12] = createQi('fire', 10);
  const indices15 = [10, 11, 12];
  const newItem15 = executeMerge(indices15, grid);
  assert(grid[11] === null && grid[12] === null, '合成后原位置被清空');
  assert(grid[10] !== null && grid[10].id === newItem15.id, '新物品在第一个位置');
  assert(newItem15.element === 'fire', '新物品元素正确');
  
  // 测试16: 性能测试 - 1000次合成
  console.log('\n--- 测试16: 性能测试 ---');
  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    grid = Array(64).fill(null);
    grid[10] = createQi('fire', 10);
    grid[11] = createQi('fire', 10);
    grid[12] = createQi('fire', 10);
    checkMerge(grid, 10);
  }
  const endTime = performance.now();
  const duration = endTime - startTime;
  assert(duration < 100, `1000次合成用时 ${duration.toFixed(2)}ms < 100ms`);
  
  // 测试17: 大规模连通块查找
  console.log('\n--- 测试17: 大规模连通块 ---');
  grid = Array(64).fill(null);
  // 创建一个8个相连的灵气
  for (let i = 0; i < 8; i++) {
    grid[i] = createQi('water', 10);
  }
  const result17 = checkMerge(grid, 0);
  assert(result17 !== null && result17.count === 8, '8个连通块正确识别');
  
  // 测试18: 相生关系验证
  console.log('\n--- 测试18: 相生关系验证 ---');
  assert(SHENG_XIANG.wood === 'fire', '木生火');
  assert(SHENG_XIANG.fire === 'earth', '火生土');
  assert(SHENG_XIANG.earth === 'gold', '土生金');
  assert(SHENG_XIANG.gold === 'water', '金生水');
  assert(SHENG_XIANG.water === 'wood', '水生木');
  
  // 测试19: 相生元素检测
  console.log('\n--- 测试19: 相生元素检测 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[18] = createQi('wood', 10); // 木在火上方，木生火
  const hasSheng19 = hasShengXiangElement([10], grid);
  assert(hasSheng19 === true, '检测到上方的相生元素');
  
  // 测试20: 无相生元素检测
  console.log('\n--- 测试20: 无相生元素检测 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 10);
  grid[11] = createQi('water', 10); // 水克火，不是相生
  const hasSheng20 = hasShengXiangElement([10], grid);
  assert(hasSheng20 === false, '正确识别无相生元素');
  
  // 测试21: 灵气转化为灵石
  console.log('\n--- 测试21: 灵气转化为灵石 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('earth', 50);
  grid[11] = createQi('earth', 50);
  grid[12] = createQi('earth', 50);
  const result21 = checkMerge(grid, 10);
  assert(result21 !== null && result21.newItem.isStone === true, '高纯度灵气转化为灵石');
  assert(result21.newItem.level === 1, '转化后生成1级灵石');
  
  // 测试22: 灵气纯度提升
  console.log('\n--- 测试22: 灵气纯度提升 ---');
  grid = Array(64).fill(null);
  grid[10] = createQi('fire', 5);
  grid[11] = createQi('fire', 5);
  grid[12] = createQi('fire', 5);
  const result22 = checkMerge(grid, 10);
  assert(result22 !== null && result22.newItem.isStone === false, '低纯度仍是灵气');
  assert(result22.newItem.purity > 5, '纯度提升');
  
  // 测试结果汇总
  console.log('\n========== 测试结果 ==========');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  console.log(`🎯 通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return { passed, failed, total: passed + failed };
}

// 自动运行测试（如果在Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境，立即运行测试
  runTests();
}

// 在浏览器环境中可以通过 console 调用 runTests() 运行测试
console.log('🎮 合成引擎加载完成！调用 runTests() 运行测试');
