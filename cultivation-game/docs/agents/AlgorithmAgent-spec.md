# AlgorithmAgent 专业规范

## 核心职责
负责合成算法引擎的实现，包括连通块查找、合成判定、完美合成检测。

## 专业知识

### BFS 连通块算法
```javascript
function findConnected(grid, startIndex, elementType) {
    const visited = new Set();
    const queue = [startIndex];
    const connected = [];
    const directions = [-8, 8, -1, 1]; // 上下左右
    
    while (queue.length > 0) {
        const idx = queue.shift();
        if (visited.has(idx)) continue;
        visited.add(idx);
        
        const item = grid[idx];
        if (!item || item.element !== elementType) continue;
        
        connected.push(idx);
        
        // 检查四方向
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        
        if (row > 0) queue.push(idx - 8); // 上
        if (row < 7) queue.push(idx + 8); // 下
        if (col > 0) queue.push(idx - 1); // 左
        if (col < 7) queue.push(idx + 1); // 右
    }
    
    return connected;
}
```

### 完美合成判定
```javascript
function checkPerfectMerge(connectedIndices, grid) {
    // 条件1：所有元素纯度 >= 90%
    const items = connectedIndices.map(i => grid[i]);
    const allHighPurity = items.every(item => item.purity >= 90);
    
    // 条件2：有相生元素在相邻位置
    const hasSupportingElement = checkShengXiang(connectedIndices, grid);
    
    return allHighPurity || hasSupportingElement;
}

// 相生链：木→火→土→金→水→木
const SHENG_XIANG = {
    wood: 'fire',
    fire: 'earth',
    earth: 'gold',
    gold: 'water',
    water: 'wood'
};
```

### 性能优化
- 使用 Set 存储 visited，O(1) 查询
- 限制最大搜索深度（防死循环）
- 使用 TypedArray 存储网格状态（如需要）

## 接口规范
```typescript
interface MergeEngine {
    findConnected(grid: Grid, start: number, element: ElementType): number[];
    checkMerge(grid: Grid, index: number): MergeResult | null;
    executeMerge(indices: number[]): { newItem: Item, isPerfect: boolean };
}
```

## 测试场景
1. 3个水平相邻 - 应触发
2. 3个垂直相邻 - 应触发
3. 4个L型 - 应触发
4. 2个相邻 - 不应触发
5. 对角相邻 - 不应触发（非四方向）
6. 边界格子 - 正确处理
7. 完美合成 - 纯度>=90%
8. 完美合成 - 有相生元素

## 交付标准
- [ ] BFS算法正确实现
- [ ] 10+测试场景通过
- [ ] 性能：1000次合成 < 100ms
- [ ] 代码注释完整
