/**
 * 合成动画系统 - Merge Animation System
 * 负责合成动画的视觉表现实现
 * @module merge-anim
 */

(function (global) {
    'use strict';

    // ==================== 配置常量 ====================
    const CONFIG = {
        // 动画时长 (ms)
        duration: {
            highlight: 100,    // 高亮
            gather: 300,       // 聚拢
            flash: 200,        // 闪光
            spawn: 400,        // 生成
            perfectGlow: 500,  // 完美光环
            floatText: 1000    // 漂浮文字
        },
        // 缓动函数
        easing: {
            easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
            easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        // 颜色配置
        colors: {
            flash: '#FFFFFF',
            flashPerfect: '#FFD700',
            glow: '#FFD700',
            success: '#00FF88',
            warning: '#FF6B35'
        }
    };

    // ==================== CSS 关键帧注入 ====================
    function injectKeyframes() {
        if (document.getElementById('merge-anim-keyframes')) return;

        const style = document.createElement('style');
        style.id = 'merge-anim-keyframes';
        style.textContent = `
            /* 聚拢动画 */
            @keyframes mergeGather {
                from { 
                    transform: scale(1) translate(0, 0); 
                    opacity: 1; 
                }
                to { 
                    transform: scale(0.8) translate(var(--tx, 0), var(--ty, 0)); 
                    opacity: 0.5; 
                }
            }

            /* 闪光效果 */
            @keyframes mergeFlash {
                0% { 
                    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
                    opacity: 0;
                }
                50% { 
                    box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.8);
                    opacity: 1;
                }
                100% { 
                    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
                    opacity: 0;
                }
            }

            /* 完美闪光 - 金色 */
            @keyframes perfectFlash {
                0% { 
                    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
                    opacity: 0;
                }
                50% { 
                    box-shadow: 0 0 40px 15px rgba(255, 215, 0, 0.9);
                    opacity: 1;
                }
                100% { 
                    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
                    opacity: 0;
                }
            }

            /* 生成弹出动画 */
            @keyframes spawnPop {
                0% { 
                    transform: scale(0); 
                    opacity: 0; 
                }
                60% { 
                    transform: scale(1.2); 
                    opacity: 1; 
                }
                80% { 
                    transform: scale(0.95); 
                }
                100% { 
                    transform: scale(1); 
                    opacity: 1; 
                }
            }

            /* 完美合成光环 */
            @keyframes perfectGlow {
                0%, 100% { 
                    box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3);
                    filter: brightness(1);
                }
                50% { 
                    box-shadow: 0 0 25px 12px rgba(255, 215, 0, 0.7);
                    filter: brightness(1.3);
                }
            }

            /* 元素高亮 */
            @keyframes highlightPulse {
                0%, 100% { 
                    box-shadow: 0 0 0 0 rgba(100, 200, 255, 0);
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 0 15px 5px rgba(100, 200, 255, 0.5);
                    transform: scale(1.05);
                }
            }

            /* 元素消失 */
            @keyframes fadeOut {
                from { 
                    transform: scale(0.8); 
                    opacity: 0.5; 
                }
                to { 
                    transform: scale(0); 
                    opacity: 0; 
                }
            }

            /* 漂浮上升 */
            @keyframes floatUp {
                from { 
                    transform: translateY(0) scale(1); 
                    opacity: 1; 
                }
                to { 
                    transform: translateY(-40px) scale(1.1); 
                    opacity: 0; 
                }
            }

            /* 粒子飞散 */
            @keyframes particleFly {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--px), var(--py)) scale(0);
                    opacity: 0;
                }
            }

            /* 容器基础样式 */
            .merge-anim-container {
                position: relative;
                will-change: transform, opacity;
            }

            .merge-anim-element {
                will-change: transform, opacity, box-shadow;
                transform: translateZ(0);
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== 工具函数 ====================

    /**
     * 等待指定时间
     * @param {number} ms - 毫秒
     * @returns {Promise<void>}
     */
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取元素中心点坐标
     * @param {Element} element 
     * @returns {{x: number, y: number}}
     */
    function getCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    /**
     * 根据索引获取元素 (假设元素有 data-index 属性)
     * @param {number} index 
     * @returns {Element|null}
     */
    function getElementByIndex(index) {
        return document.querySelector(`[data-index="${index}"]`) ||
               document.querySelector(`[data-slot="${index}"]`);
    }

    /**
     * 计算多个元素的中心点
     * @param {number[]} indices 
     * @returns {{x: number, y: number}}
     */
    function calculateCenter(indices) {
        const centers = indices.map(i => {
            const el = getElementByIndex(i);
            return el ? getCenter(el) : { x: 0, y: 0 };
        }).filter(c => c.x !== 0 || c.y !== 0);

        if (centers.length === 0) return { x: 0, y: 0 };

        return {
            x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
            y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length
        };
    }

    /**
     * 震动反馈
     * @param {string} type - 'light' | 'medium' | 'heavy' | 'success'
     */
    function hapticFeedback(type = 'light') {
        if (!navigator.vibrate) return;

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30, 50, 30],
            success: [10, 30, 10],
            perfect: [20, 40, 20, 40, 30]
        };

        navigator.vibrate(patterns[type] || patterns.light);
    }

    // ==================== 动画函数 ====================

    /**
     * 元素高亮
     * @param {number[]} indices - 要高亮的元素索引数组
     * @returns {Promise<void>}
     */
    async function highlightElements(indices) {
        const elements = indices.map(i => getElementByIndex(i)).filter(Boolean);
        
        if (elements.length === 0) return;

        // 添加高亮动画
        const animations = elements.map(el => {
            el.classList.add('merge-anim-element');
            return el.animate([
                { boxShadow: '0 0 0 0 rgba(100, 200, 255, 0)', transform: 'scale(1)' },
                { boxShadow: '0 0 15px 5px rgba(100, 200, 255, 0.5)', transform: 'scale(1.05)' },
                { boxShadow: '0 0 0 0 rgba(100, 200, 255, 0)', transform: 'scale(1)' }
            ], {
                duration: CONFIG.duration.highlight,
                easing: CONFIG.easing.easeInOut
            });
        });

        await Promise.all(animations.map(anim => anim.finished));
    }

    /**
     * 向中心聚拢动画
     * @param {number[]} indices - 要聚拢的元素索引
     * @param {{x: number, y: number}} center - 目标中心点
     * @returns {Promise<void>}
     */
    async function animateGather(indices, center) {
        const elements = indices.map(i => ({
            index: i,
            el: getElementByIndex(i)
        })).filter(item => item.el);

        if (elements.length === 0) return;

        const animations = elements.map(({ el }) => {
            const elCenter = getCenter(el);
            const tx = center.x - elCenter.x;
            const ty = center.y - elCenter.y;

            el.classList.add('merge-anim-element');

            return el.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0.8)`, opacity: 0.5 }
            ], {
                duration: CONFIG.duration.gather,
                easing: CONFIG.easing.easeOut
            });
        });

        await Promise.all(animations.map(anim => anim.finished));
    }

    /**
     * 闪光效果
     * @param {{x: number, y: number}} center - 闪光中心
     * @param {string} color - 闪光颜色
     * @returns {Promise<void>}
     */
    async function flashEffect(center, color = CONFIG.colors.flash) {
        const flash = document.createElement('div');
        flash.className = 'merge-flash-effect';
        flash.style.cssText = `
            position: fixed;
            left: ${center.x - 50}px;
            top: ${center.y - 50}px;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, ${color} 0%, transparent 70%);
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(flash);

        const isPerfect = color === CONFIG.colors.flashPerfect;
        const anim = flash.animate([
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1.5)', opacity: isPerfect ? 0.9 : 0.7 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: CONFIG.duration.flash,
            easing: CONFIG.easing.easeOut
        });

        await anim.finished;
        flash.remove();
    }

    /**
     * 创建粒子效果
     * @param {{x: number, y: number}} center 
     * @param {string} color 
     * @param {number} count 
     */
    function createParticles(center, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 4;
            particle.style.cssText = `
                position: fixed;
                left: ${center.x}px;
                top: ${center.y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
            `;

            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const velocity = 60 + Math.random() * 60;
            const px = Math.cos(angle) * velocity;
            const py = Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${px}px, ${py}px) scale(0)`, opacity: 0 }
            ], {
                duration: 400 + Math.random() * 200,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    /**
     * 元素消失动画
     * @param {number[]} indices 
     * @returns {Promise<void>}
     */
    async function hideElements(indices) {
        const elements = indices.map(i => getElementByIndex(i)).filter(Boolean);
        
        const animations = elements.map(el => {
            return el.animate([
                { transform: 'scale(0.8)', opacity: 0.5 },
                { transform: 'scale(0)', opacity: 0 }
            ], {
                duration: 150,
                easing: CONFIG.easing.easeInOut,
                fill: 'forwards'
            });
        });

        await Promise.all(animations.map(anim => anim.finished));
        
        // 动画结束后隐藏元素
        elements.forEach(el => {
            el.style.visibility = 'hidden';
        });
    }

    /**
     * 生成元素动画
     * @param {number} index - 生成的元素索引
     * @param {Object} options - 配置选项
     * @returns {Promise<void>}
     */
    async function spawnElement(index, options = {}) {
        const el = getElementByIndex(index);
        if (!el) return;

        const { scale = [0, 1.2, 1], opacity = [0, 1] } = options;

        // 确保元素可见
        el.style.visibility = 'visible';
        el.classList.add('merge-anim-element');

        const anim = el.animate([
            { transform: `scale(${scale[0]})`, opacity: opacity[0] },
            { transform: `scale(${scale[1]})`, opacity: opacity[1] },
            { transform: `scale(${scale[2] !== undefined ? scale[2] : 1})`, opacity: opacity[1] }
        ], {
            duration: CONFIG.duration.spawn,
            easing: CONFIG.easing.bounce
        });

        await anim.finished;
    }

    /**
     * 完美合成光环
     * @param {number} index - 目标元素索引
     * @returns {Promise<void>}
     */
    async function perfectGlow(index) {
        const el = getElementByIndex(index);
        if (!el) return;

        el.classList.add('merge-anim-element');

        const anim = el.animate([
            { 
                boxShadow: '0 0 5px 2px rgba(255, 215, 0, 0.3)',
                filter: 'brightness(1)'
            },
            { 
                boxShadow: '0 0 25px 12px rgba(255, 215, 0, 0.7)',
                filter: 'brightness(1.3)'
            },
            { 
                boxShadow: '0 0 5px 2px rgba(255, 215, 0, 0.3)',
                filter: 'brightness(1)'
            }
        ], {
            duration: CONFIG.duration.perfectGlow,
            easing: CONFIG.easing.easeInOut
        });

        // 添加金色粒子效果
        const center = getCenter(el);
        createParticles(center, CONFIG.colors.glow, 12);

        await anim.finished;
    }

    /**
     * 显示漂浮文字
     * @param {number} x 
     * @param {number} y 
     * @param {string} text 
     * @param {string} color 
     */
    function showFloatingText(x, y, text, color = CONFIG.colors.success) {
        const floatEl = document.createElement('div');
        floatEl.textContent = text;
        floatEl.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: 18px;
            font-weight: bold;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px ${color}80;
            transform: translate(-50%, -50%);
        `;

        document.body.appendChild(floatEl);

        floatEl.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -150%) scale(1.2)', opacity: 0 }
        ], {
            duration: CONFIG.duration.floatText,
            easing: 'ease-out'
        }).onfinish = () => floatEl.remove();
    }

    // ==================== 主控函数 ====================

    /**
     * 播放完整合成动画
     * @param {number[]} indices - 参与合成的元素索引
     * @param {number} resultIndex - 结果元素索引
     * @param {boolean} isPerfect - 是否为完美合成
     * @returns {Promise<void>}
     */
    async function playMerge(indices, resultIndex, isPerfect = false) {
        // 注入CSS关键帧
        injectKeyframes();

        // 震动反馈 - 开始
        hapticFeedback('light');

        // Phase 1: 元素高亮 (100ms)
        await highlightElements(indices);

        // Phase 2: 计算中心点并向中心聚拢 (300ms)
        const center = calculateCenter(indices);
        await animateGather(indices, center);

        // Phase 3: 闪光效果 (200ms)
        const flashColor = isPerfect ? CONFIG.colors.flashPerfect : CONFIG.colors.flash;
        await flashEffect(center, flashColor);

        // Phase 4: 原元素消失
        await hideElements(indices);

        // Phase 5: 新元素生成动画 (400ms)
        await spawnElement(resultIndex, {
            scale: [0, 1.2, 1],
            opacity: [0, 1]
        });

        // 震动反馈 - 成功
        hapticFeedback(isPerfect ? 'perfect' : 'success');

        // Phase 6: 完美合成光环 (500ms, 可选)
        if (isPerfect) {
            await perfectGlow(resultIndex);
            
            // 显示"完美!"文字
            const resultEl = getElementByIndex(resultIndex);
            if (resultEl) {
                const center = getCenter(resultEl);
                showFloatingText(center.x, center.y - 30, '完美!', CONFIG.colors.glow);
            }
        }

        // 清理：恢复被隐藏的元素
        indices.forEach(i => {
            const el = getElementByIndex(i);
            if (el) {
                el.style.visibility = '';
                el.style.transform = '';
                el.style.opacity = '';
            }
        });
    }

    // ==================== 突破动画 (扩展功能) ====================

    /**
     * 播放突破动画
     * @param {string} realmName - 境界名称
     * @returns {Promise<void>}
     */
    async function playBreakthrough(realmName) {
        injectKeyframes();

        // 震动反馈
        hapticFeedback('heavy');

        // Phase 1: 全屏金色渐变
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, #FFD700 0%, #000000 100%);
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);

        overlay.style.opacity = '0.6';
        await wait(300);

        // Phase 2: 境界名称浮现
        const title = document.createElement('div');
        title.textContent = realmName;
        title.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #FFD700;
            font-size: 48px;
            font-weight: bold;
            text-shadow: 0 0 30px #FFD700;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(title);

        const titleAnim = title.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0, filter: 'blur(10px)' },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, filter: 'blur(0px)' },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
        ], {
            duration: 500,
            easing: CONFIG.easing.bounce
        });

        await titleAnim.finished;
        await wait(500);

        // Phase 3: 粒子扩散
        const particles = [];
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 8;
            const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];
            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                width: ${size}px;
                height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
            `;
            document.body.appendChild(particle);
            particles.push(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 100 + Math.random() * 200;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }

        await wait(800);

        // Phase 4: 恢复正常
        overlay.style.opacity = '0';
        title.style.opacity = '0';
        await wait(200);

        overlay.remove();
        title.remove();
    }

    // ==================== 配置接口 ====================

    /**
     * 更新配置
     * @param {Object} newConfig 
     */
    function configure(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

    /**
     * 获取当前配置
     * @returns {Object}
     */
    function getConfig() {
        return { ...CONFIG };
    }

    // ==================== 暴露API ====================

    const MergeAnimation = {
        // 核心动画
        playMerge,
        playBreakthrough,
        
        // 子动画（可单独调用）
        highlightElements,
        animateGather,
        flashEffect,
        spawnElement,
        perfectGlow,
        
        // 工具
        showFloatingText,
        haptic: hapticFeedback,
        
        // 配置
        configure,
        getConfig,
        
        // 初始化
        init: injectKeyframes
    };

    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MergeAnimation;
    }
    
    if (typeof global !== 'undefined') {
        global.MergeAnimation = MergeAnimation;
    }

    // AMD
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return MergeAnimation;
        });
    }

})(typeof window !== 'undefined' ? window : this);
