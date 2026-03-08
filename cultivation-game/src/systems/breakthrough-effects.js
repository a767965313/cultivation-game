/**
 * 突破动画效果集成系统
 * 负责将 T5 的突破动画与 T3 的修炼系统集成
 * @module breakthrough-effects
 */

import { playBreakthrough, haptic, showFloatingText } from '../animations/merge-anim.js';

// ==================== 配置常量 ====================
const CONFIG = {
    // 动画时长 (ms)
    duration: {
        overlayFade: 300,        // 遮罩淡入
        titleDisplay: 1000,      // 境界名称显示
        particleExplosion: 800,  // 粒子爆炸
        overlayFadeOut: 200,     // 遮罩淡出
        rewardPopup: 500,        // 奖励弹窗动画
        progressUpdate: 600,     // 进度条更新
        xpFloat: 1000            // 修为漂浮文字
    },
    // 缓动函数
    easing: {
        easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)'
    },
    // 颜色配置
    colors: {
        gold: '#FFD700',
        realm: '#FFD700',
        xp: '#00FF88',
        bonus: '#FF6B35',
        unlock: '#64C8FF'
    },
    // UI 选择器
    selectors: {
        uiContainer: '#game-ui',
        progressBar: '.cultivation-progress',
        progressFill: '.progress-fill',
        xpDisplay: '.xp-display'
    }
};

// ==================== 状态管理 ====================
let isAnimating = false;
let uiOverlay = null;

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
 * 获取元素
 * @param {string} selector
 * @returns {Element|null}
 */
function getEl(selector) {
    return document.querySelector(selector);
}

/**
 * 禁用/启用界面交互
 * @param {boolean} disabled - 是否禁用
 */
function setUIInteraction(disabled) {
    const container = getEl(CONFIG.selectors.uiContainer) || document.body;
    
    if (disabled) {
        uiOverlay = document.createElement('div');
        uiOverlay.id = 'breakthrough-blocker';
        uiOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: transparent;
            z-index: 9990;
            cursor: not-allowed;
        `;
        document.body.appendChild(uiOverlay);
        
        // 禁用游戏容器内的所有交互元素
        const interactiveElements = container.querySelectorAll('button, input, a, [data-interactive]');
        interactiveElements.forEach(el => {
            el.dataset.breakthroughDisabled = el.disabled || el.getAttribute('disabled');
            el.disabled = true;
            el.style.pointerEvents = 'none';
        });
    } else {
        // 移除遮罩
        if (uiOverlay) {
            uiOverlay.remove();
            uiOverlay = null;
        }
        
        // 恢复交互元素
        const interactiveElements = container.querySelectorAll('[data-breakthrough-disabled]');
        interactiveElements.forEach(el => {
            const wasDisabled = el.dataset.breakthroughDisabled === 'true';
            el.disabled = wasDisabled;
            el.style.pointerEvents = '';
            delete el.dataset.breakthroughDisabled;
        });
    }
}

/**
 * 播放音效（预留接口）
 * @param {string} type - 音效类型
 * @param {Object} options - 配置选项
 */
function playSound(type, options = {}) {
    // 预留接口，等待音频系统集成
    if (window.AudioSystem && typeof window.AudioSystem.play === 'function') {
        window.AudioSystem.play(type, options);
    }
    
    // 触发事件供其他模块监听
    window.dispatchEvent(new CustomEvent('breakthrough:sound', {
        detail: { type, options }
    }));
}

/**
 * 创建奖励弹窗 HTML
 * @param {Object} rewards - 奖励数据
 * @returns {HTMLElement}
 */
function createRewardPopup(rewards) {
    const { realmName, unlocks, bonuses, flavorText } = rewards;
    
    const popup = document.createElement('div');
    popup.id = 'breakthrough-reward-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid ${CONFIG.colors.gold};
        border-radius: 16px;
        padding: 32px;
        min-width: 320px;
        max-width: 480px;
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 10001;
        text-align: center;
        opacity: 0;
    `;
    
    // 构建解锁内容 HTML
    let unlocksHtml = '';
    if (unlocks && unlocks.length > 0) {
        unlocksHtml = `
            <div style="margin: 20px 0; text-align: left;">
                <div style="color: ${CONFIG.colors.unlock}; font-size: 14px; margin-bottom: 8px; font-weight: bold;">
                    🔓 解锁新功能
                </div>
                ${unlocks.map(u => `
                    <div style="color: #fff; font-size: 14px; padding: 6px 0; padding-left: 16px; border-left: 2px solid ${CONFIG.colors.unlock};">
                        ${u}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 构建属性加成 HTML
    let bonusesHtml = '';
    if (bonuses && bonuses.length > 0) {
        bonusesHtml = `
            <div style="margin: 20px 0; text-align: left;">
                <div style="color: ${CONFIG.colors.bonus}; font-size: 14px; margin-bottom: 8px; font-weight: bold;">
                    ⚡ 属性提升
                </div>
                ${bonuses.map(b => `
                    <div style="color: #fff; font-size: 14px; padding: 6px 0; padding-left: 16px; border-left: 2px solid ${CONFIG.colors.bonus};">
                        ${b.name}: <span style="color: ${CONFIG.colors.bonus};">+${b.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 构建弹窗内容
    popup.innerHTML = `
        <div style="font-size: 16px; color: ${CONFIG.colors.gold}; margin-bottom: 8px;">
            ✨ 境界突破 ✨
        </div>
        <div style="font-size: 32px; font-weight: bold; color: ${CONFIG.colors.realm}; 
                    text-shadow: 0 0 20px ${CONFIG.colors.realm}80; margin: 16px 0;">
            ${realmName}
        </div>
        ${flavorText ? `<div style="font-size: 14px; color: #888; font-style: italic; margin: 12px 0;">${flavorText}</div>` : ''}
        ${unlocksHtml}
        ${bonusesHtml}
        <button id="breakthrough-close-btn" style="
            margin-top: 24px;
            padding: 12px 32px;
            background: linear-gradient(135deg, ${CONFIG.colors.gold}, #FFA500);
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 20px rgba(255, 215, 0, 0.5)'" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
            继续修炼
        </button>
    `;
    
    return popup;
}

// ==================== 核心功能 ====================

/**
 * 突破动画触发器
 * @param {string} realmName - 境界名称
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
export async function triggerBreakthrough(realmName, options = {}) {
    if (isAnimating) {
        console.warn('[Breakthrough] 动画正在播放中，跳过本次触发');
        return;
    }
    
    isAnimating = true;
    const { 
        onComplete = () => {},
        onError = (err) => console.error('[Breakthrough] 动画错误:', err)
    } = options;
    
    try {
        // 1. 禁用界面交互（防止动画中操作）
        setUIInteraction(true);
        
        // 2. 播放音效（预留接口）
        playSound('breakthrough_start');
        
        // 3. 触发震动反馈
        haptic('heavy');
        
        // 4. 调用 playBreakthrough 播放动画
        await playBreakthrough(realmName);
        
        // 5. 播放音效（预留接口）
        playSound('breakthrough_complete');
        
        // 6. 触发成功震动
        haptic('success');
        
        // 动画成功完成
        onComplete();
        
    } catch (error) {
        onError(error);
        // 即使出错也要恢复界面
    } finally {
        // 注意：界面恢复在 showBreakthroughRewards 后执行
        // 这里只是为了安全
    }
}

/**
 * 显示突破奖励弹窗
 * @param {Object} rewards - 奖励数据
 * @param {string} rewards.realmName - 境界名称
 * @param {string[]} [rewards.unlocks] - 解锁的新功能列表
 * @param {Array<{name: string, value: number}>} [rewards.bonuses] - 属性加成列表
 * @param {string} [rewards.flavorText] - 境界描述文案
 * @returns {Promise<void>}
 */
export function showBreakthroughRewards(rewards) {
    return new Promise((resolve) => {
        if (!rewards || !rewards.realmName) {
            console.error('[Breakthrough] 奖励数据无效');
            setUIInteraction(false);
            isAnimating = false;
            resolve();
            return;
        }
        
        // 创建弹窗
        const popup = createRewardPopup(rewards);
        document.body.appendChild(popup);
        
        // 播放音效（预留接口）
        playSound('reward_show');
        
        // 弹窗入场动画
        popup.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
        ], {
            duration: CONFIG.duration.rewardPopup,
            easing: CONFIG.easing.bounce
        });
        
        // 绑定关闭按钮
        const closeBtn = popup.querySelector('#breakthrough-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', async () => {
                // 播放音效（预留接口）
                playSound('button_click');
                
                // 弹窗退出动画
                const exitAnim = popup.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
                ], {
                    duration: 200,
                    easing: CONFIG.easing.easeOut
                });
                
                await exitAnim.finished;
                popup.remove();
                
                // 恢复界面交互
                setUIInteraction(false);
                isAnimating = false;
                
                // 触发完成事件
                window.dispatchEvent(new CustomEvent('breakthrough:rewardsClosed', {
                    detail: { rewards }
                }));
                
                resolve();
            });
        }
    });
}

/**
 * 更新境界进度条动画
 * @param {number} xp - 当前修为
 * @param {number} requiredXP - 所需修为
 * @param {Object} options - 配置选项
 */
export function updateProgressBar(xp, requiredXP, options = {}) {
    const { 
        animate = true,
        duration = CONFIG.duration.progressUpdate
    } = options;
    
    const progressFill = getEl(CONFIG.selectors.progressFill);
    const xpDisplay = getEl(CONFIG.selectors.xpDisplay);
    
    if (!progressFill) {
        console.warn('[Breakthrough] 找不到进度条元素');
        return;
    }
    
    const percentage = Math.min(100, Math.max(0, (xp / requiredXP) * 100));
    
    if (animate) {
        // 获取当前进度
        const currentWidth = parseFloat(progressFill.style.width) || 0;
        
        progressFill.animate([
            { width: `${currentWidth}%` },
            { width: `${percentage}%` }
        ], {
            duration,
            easing: CONFIG.easing.easeOut,
            fill: 'forwards'
        });
    } else {
        progressFill.style.width = `${percentage}%`;
    }
    
    // 更新修为显示
    if (xpDisplay) {
        xpDisplay.textContent = `${xp} / ${requiredXP}`;
    }
    
    // 触发进度更新事件
    window.dispatchEvent(new CustomEvent('breakthrough:progressUpdated', {
        detail: { xp, requiredXP, percentage }
    }));
}

/**
 * 漂浮文字显示获得的修为
 * @param {number} amount - 获得的修为数量
 * @param {number} [x] - 显示位置 X（可选，默认屏幕中心）
 * @param {number} [y] - 显示位置 Y（可选，默认屏幕上方）
 * @param {Object} options - 配置选项
 */
export function showXPGain(amount, x, y, options = {}) {
    const {
        color = CONFIG.colors.xp,
        size = '20px'
    } = options;
    
    // 默认位置：屏幕中心偏上
    if (x === undefined) {
        x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
    }
    if (y === undefined) {
        y = window.innerHeight * 0.3 + (Math.random() - 0.5) * 50;
    }
    
    const text = `+${amount} 修为`;
    showFloatingText(x, y, text, color);
    
    // 播放音效（预留接口）
    playSound('xp_gain', { volume: 0.3 });
    
    // 轻微震动反馈
    haptic('light');
    
    // 触发修为获得事件
    window.dispatchEvent(new CustomEvent('breakthrough:xpGained', {
        detail: { amount, x, y }
    }));
}

// ==================== 与 T3 的协作接口 ====================

/**
 * 初始化突破效果系统
 * 暴露全局接口供 T3 调用
 */
export function initBreakthroughEffects() {
    // 注册全局接口
    window.CultivationEffects = {
        /**
         * 突破回调 - T3 调用
         * @param {string} realmName - 境界名称
         * @param {Object} rewards - 奖励数据
         */
        onBreakthrough(realmName, rewards) {
            console.log('[Breakthrough] 收到突破事件:', realmName, rewards);
            
            // 顺序执行：动画 -> 奖励弹窗
            triggerBreakthrough(realmName, {
                onComplete: () => {
                    showBreakthroughRewards(rewards);
                }
            });
        },
        
        /**
         * 修为获得回调 - T3 调用
         * @param {number} amount - 获得的修为
         * @param {number} [x] - 显示位置 X
         * @param {number} [y] - 显示位置 Y
         */
        onXPGain(amount, x, y) {
            showXPGain(amount, x, y);
        },
        
        /**
         * 进度更新回调 - T3 调用
         * @param {number} xp - 当前修为
         * @param {number} requiredXP - 所需修为
         */
        onProgressUpdate(xp, requiredXP) {
            updateProgressBar(xp, requiredXP);
        },
        
        /**
         * 检查动画状态
         * @returns {boolean}
         */
        isAnimating() {
            return isAnimating;
        },
        
        /**
         * 强制重置（紧急恢复）
         */
        forceReset() {
            setUIInteraction(false);
            isAnimating = false;
            
            // 移除可能残留的弹窗
            const popup = getEl('#breakthrough-reward-popup');
            if (popup) popup.remove();
            
            // 移除遮罩
            const blocker = getEl('#breakthrough-blocker');
            if (blocker) blocker.remove();
        }
    };
    
    console.log('[Breakthrough] 突破效果系统已初始化');
    console.log('[Breakthrough] T3 可通过 window.CultivationEffects 调用接口');
}

// ==================== 导出 ====================

export default {
    triggerBreakthrough,
    showBreakthroughRewards,
    updateProgressBar,
    showXPGain,
    initBreakthroughEffects
};

// 自动初始化（如果直接引入）
if (typeof window !== 'undefined') {
    initBreakthroughEffects();
}
