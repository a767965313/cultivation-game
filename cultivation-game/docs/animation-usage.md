# 合成动画系统 - 使用说明

## 📦 文件位置
`/root/.openclaw/workspace/cultivation-game/src/animations/merge-anim.js`

## 🚀 快速开始

### 1. 引入脚本
```html
<script src="src/animations/merge-anim.js"></script>
```

### 2. 基础使用
```javascript
// 播放完整合成动画
await MergeAnimation.playMerge([0, 1, 2], 3, false);
// 参数: [源元素索引], 结果元素索引, 是否完美合成
```

## 🎬 动画函数详解

### `playMerge(indices, resultIndex, isPerfect)` - 完整合成动画

**时序流程：**
```
0ms     ├─ 元素高亮 (100ms)
100ms   ├─ 向中心聚拢 (300ms)
400ms   ├─ 闪光效果 (200ms)
600ms   ├─ 原元素消失
600ms   ├─ 新元素生成 (400ms) - 弹出效果
1000ms  └─ 完美光环 (500ms, 可选)
```

**示例：**
```javascript
// 普通合成
await MergeAnimation.playMerge([0, 1], 2, false);

// 完美合成（带金色光环）
await MergeAnimation.playMerge([0, 1], 2, true);
```

---

### `highlightElements(indices)` - 元素高亮

**效果：** 元素周围出现蓝色光晕，轻微放大

**参数：**
- `indices` - 元素索引数组

**时长：** 100ms

```javascript
await MergeAnimation.highlightElements([0, 1, 2]);
```

---

### `animateGather(indices, center)` - 聚拢动画

**效果：** 多个元素向指定中心点移动并缩小

**参数：**
- `indices` - 要聚拢的元素索引
- `center` - 目标中心点 `{x, y}`

**时长：** 300ms

```javascript
const center = { x: 400, y: 300 };
await MergeAnimation.animateGather([0, 1], center);
```

---

### `flashEffect(center, color)` - 闪光效果

**效果：** 在指定位置产生扩散闪光

**参数：**
- `center` - 闪光中心 `{x, y}`
- `color` - 闪光颜色 (默认白色，完美合成用金色)

**时长：** 200ms

```javascript
// 普通闪光
await MergeAnimation.flashEffect({x: 400, y: 300}, '#FFFFFF');

// 完美闪光
await MergeAnimation.flashEffect({x: 400, y: 300}, '#FFD700');
```

---

### `spawnElement(index, options)` - 生成动画

**效果：** 元素从无到有弹出（scale 0 → 1.2 → 1）

**参数：**
- `index` - 元素索引
- `options` - 可选配置 `{scale, opacity}`

**时长：** 400ms

```javascript
await MergeAnimation.spawnElement(0, {
    scale: [0, 1.2, 1],
    opacity: [0, 1]
});
```

---

### `perfectGlow(index)` - 完美合成光环

**效果：** 金色呼吸光环 + 金色粒子飞散

**参数：**
- `index` - 目标元素索引

**时长：** 500ms

```javascript
await MergeAnimation.perfectGlow(0);
```

---

### `playBreakthrough(realmName)` - 突破动画

**效果：** 全屏金色渐变 + 境界名称浮现 + 粒子扩散

**参数：**
- `realmName` - 境界名称

**示例：**
```javascript
await MergeAnimation.playBreakthrough('筑基期');
```

---

## 🎨 CSS关键帧

系统会自动注入以下CSS关键帧：

| 关键帧 | 用途 |
|--------|------|
| `mergeGather` | 聚拢动画 |
| `mergeFlash` | 普通闪光 |
| `perfectFlash` | 完美闪光(金色) |
| `spawnPop` | 生成弹出 |
| `perfectGlow` | 完美光环 |
| `highlightPulse` | 高亮脉冲 |
| `fadeOut` | 元素消失 |
| `floatUp` | 漂浮上升 |
| `particleFly` | 粒子飞散 |

---

## ⚙️ 配置选项

### 修改配置
```javascript
MergeAnimation.configure({
    duration: {
        gather: 400,        // 自定义聚拢时长
        spawn: 500          // 自定义生成时长
    },
    colors: {
        flashPerfect: '#FF00FF'  // 自定义完美闪光颜色
    }
});
```

### 查看配置
```javascript
const config = MergeAnimation.getConfig();
console.log(config.duration.gather); // 300
```

**默认配置：**
```javascript
{
    duration: {
        highlight: 100,
        gather: 300,
        flash: 200,
        spawn: 400,
        perfectGlow: 500,
        floatText: 1000
    },
    easing: {
        easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
        easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    colors: {
        flash: '#FFFFFF',
        flashPerfect: '#FFD700',
        glow: '#FFD700',
        success: '#00FF88',
        warning: '#FF6B35'
    }
}
```

---

## 📳 震动反馈

```javascript
// 轻震
MergeAnimation.haptic('light');      // [10ms]

// 中震  
MergeAnimation.haptic('medium');     // [20ms]

// 强震
MergeAnimation.haptic('heavy');      // [30, 50, 30ms]

// 成功感
MergeAnimation.haptic('success');    // [10, 30, 10ms]

// 完美合成
MergeAnimation.haptic('perfect');    // [20, 40, 20, 40, 30ms]
```

---

## 💬 漂浮文字

```javascript
MergeAnimation.showFloatingText(
    400,        // x坐标
    300,        // y坐标  
    '+100修为', // 文字内容
    '#00FF88'   // 颜色
);
```

---

## 🔧 元素定位约定

动画系统通过以下方式查找元素：

1. `data-index` 属性: `<div data-index="0">...</div>`
2. `data-slot` 属性: `<div data-slot="0">...</div>`

**示例HTML结构：**
```html
<div class="game-board">
    <div class="cell" data-index="0">元素1</div>
    <div class="cell" data-index="1">元素2</div>
    <div class="cell" data-index="2">元素3</div>
    <div class="cell" data-index="3">结果</div>
</div>
```

---

## ⚡ 性能优化

- ✅ 使用 `transform` 和 `opacity` 实现 GPU 加速
- ✅ 通过 `will-change` 提示浏览器优化
- ✅ 使用 Web Animations API 替代 CSS 动画（更可控）
- ✅ CSS关键帧动态注入，避免样式污染
- ✅ 动画元素自动添加 `translateZ(0)` 强制硬件加速

---

## 📊 动画时长规范

| 动画 | 时长 | 缓动 |
|------|------|------|
| 聚拢 | 300ms | ease-out |
| 闪光 | 200ms | ease-out |
| 生成 | 400ms | bounce |
| 完美光环 | 500ms | ease-in-out |
| 高亮 | 100ms | ease-in-out |

**总时长（普通合成）：** ~1000ms  
**总时长（完美合成）：** ~1500ms

---

## 🎯 使用示例

### 场景1：三个材料合成装备
```javascript
async function craftItem() {
    const materials = [0, 1, 2];  // 三个材料槽
    const resultSlot = 3;          // 结果槽
    const isPerfect = checkPerfect(); // 检查是否完美
    
    await MergeAnimation.playMerge(materials, resultSlot, isPerfect);
    
    if (isPerfect) {
        console.log('完美合成！品质提升！');
    }
}
```

### 场景2：玩家突破境界
```javascript
async function breakthrough() {
    await MergeAnimation.playBreakthrough('金丹期');
    player.realm = '金丹期';
    player.maxMana *= 2;
}
```

### 场景3：显示获得奖励
```javascript
function showReward(elementIndex, amount) {
    const el = document.querySelector(`[data-index="${elementIndex}"]`);
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    MergeAnimation.showFloatingText(centerX, centerY, `+${amount}灵石`, '#FFD700');
    MergeAnimation.haptic('success');
}
```

---

## 🔗 API导出

支持多种模块格式：
- **CommonJS**: `module.exports`
- **ES Module**: 通过全局对象
- **AMD**: `define`
- **浏览器全局**: `window.MergeAnimation`

```javascript
// Node.js / CommonJS
const MergeAnimation = require('./merge-anim.js');

// 浏览器
const MergeAnimation = window.MergeAnimation;
```
