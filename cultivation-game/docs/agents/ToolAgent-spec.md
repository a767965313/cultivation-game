# ToolAgent 专业规范

## 核心职责
开发调试工具、测试工具、数值模拟器，提升开发效率。

## 专业知识

### 控制台调试命令
```javascript
// 全局调试对象
window.CultivationDebug = {
    // 快速给予物品
    giveItems({ element, level, count, purity = 100 }) {
        for (let i = 0; i < count; i++) {
            state.inventory.push({
                id: Date.now() + i,
                element,
                level,
                purity
            });
        }
        updateUI();
        console.log(`给予 ${count} 个 ${element} Lv${level}`);
    },
    
    // 设置境界
    setRealm(realm, stage = 0) {
        state.realm = realm;
        state.stage = stage;
        state.xp = 0;
        updateUI();
        console.log(`设置境界：${REALMS[realm].name} ${REALMS[realm].stages[stage]}`);
    },
    
    // 设置货币
    setMoney(amount) {
        state.spiritStones = amount;
        updateUI();
        console.log(`设置灵石：${amount}`);
    },
    
    // 填充网格
    fillGrid(element, level) {
        for (let i = 0; i < 64; i++) {
            state.grid[i] = {
                id: Date.now() + i,
                element,
                level,
                purity: 100
            };
        }
        updateUI();
        console.log('网格已填充');
    },
    
    // 清空
    clear() {
        state.grid = Array(64).fill(null);
        state.inventory = [];
        updateUI();
        console.log('已清空');
    },
    
    // 模拟N次合成
    simulateMerges(n) {
        let total = 0;
        let perfect = 0;
        
        for (let i = 0; i < n; i++) {
            // 随机放置3个相同元素
            const element = ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)];
            const indices = [];
            
            while (indices.length < 3) {
                const idx = Math.floor(Math.random() * 64);
                if (!state.grid[idx] && !indices.includes(idx)) {
                    indices.push(idx);
                }
            }
            
            indices.forEach(idx => {
                state.grid[idx] = {
                    id: Date.now(),
                    element,
                    level: 0,
                    purity: 80 + Math.floor(Math.random() * 20)
                };
            });
            
            // 尝试合成
            const result = checkMerge(indices[0]);
            if (result) {
                total++;
                if (result.isPerfect) perfect++;
            }
        }
        
        console.log(`模拟 ${n} 次，成功合成 ${total} 次，完美 ${perfect} 次`);
        return { total, perfect, rate: perfect / total };
    },
    
    // 检查数值平衡
    checkBalance() {
        const report = {
            stoneChain: [],
            realmXP: [],
            shopPrices: []
        };
        
        // 检查灵石链
        for (let i = 1; i < STONE_CHAIN.length; i++) {
            const prev = STONE_CHAIN[i - 1];
            const curr = STONE_CHAIN[i];
            const ratio = curr.xp / prev.xp;
            report.stoneChain.push({
                level: i,
                name: curr.name,
                xp: curr.xp,
                ratio: ratio.toFixed(2),
                ok: ratio >= 2.5 && ratio <= 3.5
            });
        }
        
        // 检查境界
        REALMS.forEach((realm, i) => {
            const totalXP = realm.baseXP * 4; // 4个阶段
            report.realmXP.push({
                realm: realm.name,
                totalXP,
                estimatedTime: this.formatTime(totalXP / 100) // 假设每秒100修为
            });
        });
        
        console.table(report.stoneChain);
        console.table(report.realmXP);
        
        return report;
    },
    
    formatTime(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)}秒`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
        return `${Math.floor(seconds / 3600)}小时`;
    },
    
    // 性能测试
    benchmark() {
        const iterations = 10000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            findConnected(state.grid, Math.floor(Math.random() * 64), 'gold');
        }
        
        const duration = performance.now() - start;
        console.log(`${iterations} 次BFS: ${duration.toFixed(2)}ms`);
        console.log(`平均: ${(duration / iterations).toFixed(3)}ms/次`);
    }
};
```

### 性能监控面板
```javascript
function initPerfPanel() {
    const panel = document.createElement('div');
    panel.id = 'perf-panel';
    panel.innerHTML = `
        <div style="position:fixed;bottom:80px;right:10px;background:rgba(0,0,0,0.8);color:#0f0;padding:10px;font-family:monospace;font-size:12px;z-index:9999;border-radius:4px;">
            <div>FPS: <span id="fps">60</span></div>
            <div>Grid Updates: <span id="grid-updates">0</span></div>
            <div>Merge Time: <span id="merge-time">0</span>ms</div>
        </div>
    `;
    document.body.appendChild(panel);
    
    // FPS计数器
    let frames = 0;
    let lastTime = performance.now();
    
    function updateFPS() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            document.getElementById('fps').textContent = frames;
            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    }
    updateFPS();
}
```

### 自动化测试
```javascript
const Tests = {
    // 测试连通块查找
    testConnected() {
        // 设置测试网格
        state.grid = Array(64).fill(null);
        state.grid[0] = { element: 'fire', level: 0 };
        state.grid[1] = { element: 'fire', level: 0 };
        state.grid[2] = { element: 'fire', level: 0 };
        
        const connected = findConnected(state.grid, 0, 'fire');
        console.assert(connected.length === 3, '应找到3个连通元素');
        console.log('✓ testConnected 通过');
    },
    
    // 测试合成
    testMerge() {
        // ... 设置测试场景
        const result = checkMerge(0);
        console.assert(result !== null, '应触发合成');
        console.assert(result.newItem.level === 1, '应生成Lv1');
        console.log('✓ testMerge 通过');
    },
    
    // 运行所有测试
    runAll() {
        console.log('运行自动化测试...');
        this.testConnected();
        this.testMerge();
        // ... 更多测试
        console.log('测试完成');
    }
};

window.CultivationDebug.Tests = Tests;
```

## 接口规范
```typescript
interface DebugTools {
    giveItems(config: ItemConfig): void;
    setRealm(realm: number, stage: number): void;
    setMoney(amount: number): void;
    fillGrid(element: ElementType, level: number): void;
    clear(): void;
    simulateMerges(n: number): SimulationResult;
    checkBalance(): BalanceReport;
    benchmark(): void;
    Tests: TestSuite;
}
```

## 交付标准
- [ ] 调试命令完整可用
- [ ] 性能监控面板
- [ ] 自动化测试套件
- [ ] 数值模拟工具
- [ ] 使用文档
