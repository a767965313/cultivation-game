# AnimationAgent 专业规范

## 核心职责
负责合成动画、突破动画的视觉表现实现。

## 专业知识

### CSS 动画性能优化
```css
/* 使用 transform 和 opacity，触发 GPU 加速 */
.animate {
    will-change: transform, opacity;
    transform: translateZ(0); /* 强制硬件加速 */
}

/* 避免触发重排 */
/* 好的属性：transform, opacity */
/* 避免：width, height, top, left, margin */
```

### 合成动画序列
```javascript
async function playMergeAnimation(indices, resultIndex, isPerfect) {
    // Phase 1: 元素高亮 (100ms)
    await highlightElements(indices);
    
    // Phase 2: 向中心聚拢 (300ms)
    const center = calculateCenter(indices);
    await Promise.all(indices.map(i => 
        animateToPosition(i, center, 300, 'ease-out')
    ));
    
    // Phase 3: 闪光效果 (200ms)
    await flashEffect(center, isPerfect ? '#FFD700' : '#FFFFFF');
    
    // Phase 4: 原元素消失
    indices.forEach(i => hideElement(i));
    
    // Phase 5: 新元素生成动画 (400ms)
    await spawnElement(resultIndex, {
        scale: [0, 1.2, 1],
        opacity: [0, 1],
        duration: 400
    });
    
    // Phase 6: 完美合成光环 (500ms, 可选)
    if (isPerfect) {
        await perfectGlow(resultIndex);
    }
}
```

### 突破动画序列
```javascript
async function playBreakthroughAnimation(realmName) {
    // Phase 1: 全屏渐变金色 (300ms)
    await fullscreenGradient('#000000', '#FFD700', 300);
    
    // Phase 2: 境界名称浮现 (500ms)
    await showRealmTitle(realmName, {
        scale: [0.5, 1.2, 1],
        opacity: [0, 1],
        blur: [10, 0]
    });
    
    // Phase 3: 粒子扩散 (800ms)
    await particleExplosion({
        count: 50,
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        spread: 360,
        duration: 800
    });
    
    // Phase 4: 恢复正常 (200ms)
    await fullscreenGradient('#FFD700', '#000000', 200);
    hideRealmTitle();
}
```

### 关键帧定义
```css
@keyframes mergeGather {
    from { transform: scale(1) translate(0, 0); opacity: 1; }
    to { transform: scale(0.8) translate(var(--tx), var(--ty)); opacity: 0.5; }
}

@keyframes mergeFlash {
    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    50% { box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.8); }
    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

@keyframes spawnPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes perfectGlow {
    0%, 100% { box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.6); }
}

@keyframes floatUp {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-30px); opacity: 0; }
}
```

### 粒子系统（简化版）
```javascript
function createParticle(x, y, color) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 6px;
        height: 6px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
    `;
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 100;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    particle.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px)`, opacity: 0 }
    ], {
        duration: 600 + Math.random() * 400,
        easing: 'ease-out'
    }).onfinish = () => particle.remove();
    
    document.body.appendChild(particle);
}
```

### 震动反馈
```javascript
function hapticFeedback(type) {
    if (!navigator.vibrate) return;
    
    const patterns = {
        light: [10],           // 轻震
        medium: [20],          // 中震
        heavy: [30, 50, 30],   // 强震（突破）
        success: [10, 30, 10]  // 成功感
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
}
```

## 接口规范
```typescript
interface AnimationSystem {
    // 合成动画
    playMerge(indices: number[], resultIndex: number, isPerfect: boolean): Promise<void>;
    playPerfectGlow(index: number): Promise<void>;
    
    // 突破动画
    playBreakthrough(realmName: string): Promise<void>;
    
    // 反馈
    showFloatingText(x: number, y: number, text: string, color: string): void;
    haptic(type: 'light' | 'medium' | 'heavy' | 'success'): void;
}
```

## 交付标准
- [ ] 合成动画流畅（60fps）
- [ ] 突破动画完整
- [ ] 完美合成有视觉区分
- [ ] 震动反馈集成
- [ ] 动画可配置（速度/强度）
