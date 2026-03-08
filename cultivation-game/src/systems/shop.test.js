/**
 * 商店系统测试
 * Shop System Tests
 * 测试购买流程、价格计算和效果应用
 */

import { ShopSystem, SHOP_ITEMS } from './shop.js';

describe('ShopSystem', () => {
    // 每个测试前重置状态
    beforeEach(() => {
        ShopSystem.reset();
    });

    // ==================== 商品数据测试 ====================
    
    describe('商品数据', () => {
        test('SHOP_ITEMS 应该包含所有商品', () => {
            expect(SHOP_ITEMS).toHaveLength(4);
            expect(SHOP_ITEMS.map(i => i.id)).toContain('capture_efficiency');
            expect(SHOP_ITEMS.map(i => i.id)).toContain('auto_merge');
            expect(SHOP_ITEMS.map(i => i.id)).toContain('purity_boost');
            expect(SHOP_ITEMS.map(i => i.id)).toContain('merge_range');
        });

        test('商品应该有正确的解锁境界', () => {
            const captureEfficiency = SHOP_ITEMS.find(i => i.id === 'capture_efficiency');
            const autoMerge = SHOP_ITEMS.find(i => i.id === 'auto_merge');
            const mergeRange = SHOP_ITEMS.find(i => i.id === 'merge_range');

            expect(captureEfficiency.unlockRealm).toBe(0); // 炼气期
            expect(autoMerge.unlockRealm).toBe(1);         // 筑基期
            expect(mergeRange.unlockRealm).toBe(2);        // 金丹期
        });
    });

    // ==================== 价格计算测试 ====================
    
    describe('价格计算', () => {
        test('基础价格应该正确', () => {
            expect(ShopSystem.calculatePrice('capture_efficiency', 0)).toBe(100);
            expect(ShopSystem.calculatePrice('auto_merge', 0)).toBe(500);
            expect(ShopSystem.calculatePrice('purity_boost', 0)).toBe(200);
            expect(ShopSystem.calculatePrice('merge_range', 0)).toBe(1000);
        });

        test('价格应该随等级增长（指数增长）', () => {
            // capture_efficiency: basePrice=100, multiplier=1.5
            expect(ShopSystem.calculatePrice('capture_efficiency', 0)).toBe(100);
            expect(ShopSystem.calculatePrice('capture_efficiency', 1)).toBe(150);
            expect(ShopSystem.calculatePrice('capture_efficiency', 2)).toBe(225);
            expect(ShopSystem.calculatePrice('capture_efficiency', 5)).toBe(Math.floor(100 * Math.pow(1.5, 5)));
        });

        test('不同商品应该有不同的价格曲线', () => {
            // auto_merge: basePrice=500, multiplier=2 (一次性购买)
            expect(ShopSystem.calculatePrice('auto_merge', 0)).toBe(500);
            
            // purity_boost: basePrice=200, multiplier=1.3
            expect(ShopSystem.calculatePrice('purity_boost', 1)).toBe(260);
            expect(ShopSystem.calculatePrice('purity_boost', 5)).toBe(Math.floor(200 * Math.pow(1.3, 5)));
        });
    });

    // ==================== 购买流程测试 ====================
    
    describe('购买流程', () => {
        test('成功购买应该扣除货币并升级', () => {
            const result = ShopSystem.purchase('capture_efficiency', 1000, 0);
            
            expect(result.success).toBe(true);
            expect(result.previousLevel).toBe(0);
            expect(result.newLevel).toBe(1);
            expect(result.price).toBe(100);
            expect(result.remainingMoney).toBe(900);
            expect(result.effect).toEqual({ captureBonus: 1 });
        });

        test('连续购买应该累计等级', () => {
            // 第一次购买
            ShopSystem.purchase('capture_efficiency', 1000, 0);
            
            // 第二次购买
            const result = ShopSystem.purchase('capture_efficiency', 900, 1);
            
            expect(result.success).toBe(true);
            expect(result.previousLevel).toBe(1);
            expect(result.newLevel).toBe(2);
            expect(result.price).toBe(150); // 第二级价格
            expect(result.effect).toEqual({ captureBonus: 2 });
        });

        test('灵石不足时应该失败', () => {
            const result = ShopSystem.purchase('auto_merge', 100, 0);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('INSUFFICIENT_FUNDS');
            expect(result.required).toBe(500);
            expect(result.current).toBe(100);
            expect(result.shortage).toBe(400);
        });

        test('达到最大等级后应该失败', () => {
            const result = ShopSystem.purchase('auto_merge', 1000, 1);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('MAX_LEVEL_REACHED');
        });

        test('购买不存在的商品应该失败', () => {
            const result = ShopSystem.purchase('non_existent', 1000, 0);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('ITEM_NOT_FOUND');
        });
    });

    // ==================== 效果应用测试 ====================
    
    describe('效果应用', () => {
        test('capture_efficiency 效果应该正确', () => {
            expect(ShopSystem.applyEffect('capture_efficiency', 1)).toEqual({ captureBonus: 1 });
            expect(ShopSystem.applyEffect('capture_efficiency', 5)).toEqual({ captureBonus: 5 });
            expect(ShopSystem.applyEffect('capture_efficiency', 10)).toEqual({ captureBonus: 10 });
        });

        test('purity_boost 效果应该正确', () => {
            expect(ShopSystem.applyEffect('purity_boost', 1)).toEqual({ purityBonus: 5 });
            expect(ShopSystem.applyEffect('purity_boost', 5)).toEqual({ purityBonus: 25 });
            expect(ShopSystem.applyEffect('purity_boost', 10)).toEqual({ purityBonus: 50 });
        });

        test('auto_merge 效果应该正确', () => {
            expect(ShopSystem.applyEffect('auto_merge', 0)).toEqual({ autoMerge: false });
            expect(ShopSystem.applyEffect('auto_merge', 1)).toEqual({ autoMerge: true });
        });

        test('merge_range 效果应该正确', () => {
            expect(ShopSystem.applyEffect('merge_range', 1)).toEqual({ mergeRangeBonus: 1 });
            expect(ShopSystem.applyEffect('merge_range', 2)).toEqual({ mergeRangeBonus: 2 });
        });

        test('getAllAppliedEffects 应该汇总所有效果', () => {
            ShopSystem.purchase('capture_efficiency', 1000, 0);
            ShopSystem.purchase('purity_boost', 1000, 0);
            ShopSystem.purchase('auto_merge', 1000, 0);
            
            const effects = ShopSystem.getAllAppliedEffects();
            
            expect(effects.captureBonus).toBe(1);
            expect(effects.purityBonus).toBe(5);
            expect(effects.autoMerge).toBe(true);
            expect(effects.mergeRangeBonus).toBe(0);
        });
    });

    // ==================== 可用商品过滤测试 ====================
    
    describe('可用商品过滤', () => {
        test('炼气期应该看到解锁商品', () => {
            const items = ShopSystem.getAvailableItems(0);
            const ids = items.map(i => i.id);
            
            expect(ids).toContain('capture_efficiency');
            expect(ids).toContain('purity_boost');
            expect(ids).not.toContain('auto_merge');     // 筑基期解锁
            expect(ids).not.toContain('merge_range');    // 金丹期解锁
        });

        test('筑基期应该看到更多商品', () => {
            const items = ShopSystem.getAvailableItems(1);
            const ids = items.map(i => i.id);
            
            expect(ids).toContain('capture_efficiency');
            expect(ids).toContain('purity_boost');
            expect(ids).toContain('auto_merge');
            expect(ids).not.toContain('merge_range');
        });

        test('金丹期应该看到所有商品', () => {
            const items = ShopSystem.getAvailableItems(2);
            const ids = items.map(i => i.id);
            
            expect(ids).toContain('capture_efficiency');
            expect(ids).toContain('purity_boost');
            expect(ids).toContain('auto_merge');
            expect(ids).toContain('merge_range');
        });
    });

    // ==================== 商品详情测试 ====================
    
    describe('商品详情', () => {
        test('getItem 应该返回完整信息', () => {
            const item = ShopSystem.getItem('capture_efficiency', 3);
            
            expect(item.id).toBe('capture_efficiency');
            expect(item.name).toBe('捕捉效率');
            expect(item.currentLevel).toBe(3);
            expect(item.currentPrice).toBe(Math.floor(100 * Math.pow(1.5, 3)));
            expect(item.isMaxed).toBe(false);
            expect(item.canUpgrade).toBe(true);
            expect(item.currentEffect).toEqual({ captureBonus: 3 });
        });

        test('maxLevel 时应该正确标记', () => {
            const item = ShopSystem.getItem('auto_merge', 1);
            
            expect(item.isMaxed).toBe(true);
            expect(item.canUpgrade).toBe(false);
            expect(item.nextEffect).toBeNull();
        });

        test('未购买时 currentEffect 应该为 null', () => {
            const item = ShopSystem.getItem('capture_efficiency', 0);
            
            expect(item.currentLevel).toBe(0);
            expect(item.currentEffect).toBeNull();
            expect(item.nextEffect).toEqual({ captureBonus: 1 });
        });
    });

    // ==================== 状态管理测试 ====================
    
    describe('状态管理', () => {
        test('getPurchasedLevel 应该返回正确等级', () => {
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(0);
            
            ShopSystem.purchase('capture_efficiency', 1000, 0);
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(1);
            
            ShopSystem.purchase('capture_efficiency', 900, 1);
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(2);
        });

        test('reset 应该清空所有状态', () => {
            ShopSystem.purchase('capture_efficiency', 1000, 0);
            ShopSystem.purchase('purity_boost', 1000, 0);
            
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(1);
            expect(ShopSystem.getPurchasedLevel('purity_boost')).toBe(1);
            
            ShopSystem.reset();
            
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(0);
            expect(ShopSystem.getPurchasedLevel('purity_boost')).toBe(0);
        });

        test('getState 应该返回完整状态', () => {
            ShopSystem.purchase('capture_efficiency', 1000, 0);
            
            const state = ShopSystem.getState();
            
            expect(state.purchasedLevels.capture_efficiency).toBe(1);
            expect(state.appliedEffects.capture_efficiency).toEqual({ captureBonus: 1 });
            expect(state.combinedEffects.captureBonus).toBe(1);
        });

        test('setState 应该恢复状态', () => {
            const savedState = {
                purchasedLevels: {
                    capture_efficiency: 5,
                    purity_boost: 3
                }
            };
            
            ShopSystem.setState(savedState);
            
            expect(ShopSystem.getPurchasedLevel('capture_efficiency')).toBe(5);
            expect(ShopSystem.getPurchasedLevel('purity_boost')).toBe(3);
            expect(ShopSystem.getAllAppliedEffects().captureBonus).toBe(5);
            expect(ShopSystem.getAllAppliedEffects().purityBonus).toBe(15);
        });
    });

    // ==================== 界面函数测试 ====================
    
    describe('界面函数', () => {
        test('renderShopItem 应该返回正确格式', () => {
            const rendered = ShopSystem.renderShopItem('capture_efficiency', 2, 500);
            
            expect(rendered.id).toBe('capture_efficiency');
            expect(rendered.name).toBe('捕捉效率');
            expect(rendered.level).toBe(2);
            expect(rendered.price).toBe(225); // 100 * 1.5^2
            expect(rendered.canAfford).toBe(true); // 500 >= 225
            expect(rendered.canBuy).toBe(true);
        });

        test('renderShopItem 应该在钱不够时标记', () => {
            const rendered = ShopSystem.renderShopItem('auto_merge', 0, 300);
            
            expect(rendered.price).toBe(500);
            expect(rendered.canAfford).toBe(false);
            expect(rendered.canBuy).toBe(false);
        });

        test('getItemIcon 应该返回对应图标', () => {
            expect(ShopSystem.getItemIcon('capture_efficiency')).toBe('⚡');
            expect(ShopSystem.getItemIcon('auto_merge')).toBe('🤖');
            expect(ShopSystem.getItemIcon('purity_boost')).toBe('✨');
            expect(ShopSystem.getItemIcon('merge_range')).toBe('🔍');
            expect(ShopSystem.getItemIcon('unknown')).toBe('📦');
        });

        test('onPurchaseClick 应该正确处理点击', () => {
            const result = ShopSystem.onPurchaseClick('purity_boost', 500);
            
            expect(result.success).toBe(true);
            expect(result.newLevel).toBe(1);
        });
    });
});

// ==================== 手动测试运行器 ====================

/**
 * 运行基础测试（用于非Jest环境）
 */
export function runShopTests() {
    const results = {
        passed: 0,
        failed: 0,
        errors: []
    };

    function test(name, fn) {
        ShopSystem.reset();
        try {
            fn();
            results.passed++;
            console.log(`✅ ${name}`);
        } catch (e) {
            results.failed++;
            results.errors.push({ name, error: e.message });
            console.log(`❌ ${name}: ${e.message}`);
        }
    }

    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual(expected) {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeNull() {
                if (actual !== null) {
                    throw new Error(`Expected null, got ${actual}`);
                }
            },
            toContain(expected) {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}`);
                }
            },
            not: {
                toContain(expected) {
                    if (actual.includes(expected)) {
                        throw new Error(`Expected array NOT to contain ${expected}`);
                    }
                }
            }
        };
    }

    // 运行测试
    console.log('\n=== 商店系统测试 ===\n');

    // 价格计算测试
    test('基础价格计算', () => {
        expect(ShopSystem.calculatePrice('capture_efficiency', 0)).toBe(100);
        expect(ShopSystem.calculatePrice('auto_merge', 0)).toBe(500);
    });

    test('指数价格增长', () => {
        expect(ShopSystem.calculatePrice('capture_efficiency', 1)).toBe(150);
        expect(ShopSystem.calculatePrice('capture_efficiency', 2)).toBe(225);
    });

    // 购买流程测试
    test('成功购买', () => {
        const result = ShopSystem.purchase('capture_efficiency', 1000, 0);
        expect(result.success).toBe(true);
        expect(result.newLevel).toBe(1);
        expect(result.remainingMoney).toBe(900);
    });

    test('灵石不足', () => {
        const result = ShopSystem.purchase('auto_merge', 100, 0);
        expect(result.success).toBe(false);
        expect(result.error).toBe('INSUFFICIENT_FUNDS');
    });

    test('达到最大等级', () => {
        const result = ShopSystem.purchase('auto_merge', 1000, 1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('MAX_LEVEL_REACHED');
    });

    // 效果测试
    test('效果应用', () => {
        ShopSystem.purchase('capture_efficiency', 1000, 0);
        ShopSystem.purchase('purity_boost', 1000, 0);
        
        const effects = ShopSystem.getAllAppliedEffects();
        expect(effects.captureBonus).toBe(1);
        expect(effects.purityBonus).toBe(5);
    });

    // 商品过滤测试
    test('境界过滤 - 炼气期', () => {
        const items = ShopSystem.getAvailableItems(0);
        expect(items.map(i => i.id)).toContain('capture_efficiency');
        expect(items.map(i => i.id)).not.toContain('auto_merge');
    });

    test('境界过滤 - 金丹期', () => {
        const items = ShopSystem.getAvailableItems(2);
        expect(items.map(i => i.id)).toContain('auto_merge');
        expect(items.map(i => i.id)).toContain('merge_range');
    });

    console.log(`\n=== 测试结果: ${results.passed}通过, ${results.failed}失败 ===`);
    return results;
}

// 如果在浏览器环境中，挂载到全局
if (typeof window !== 'undefined') {
    window.runShopTests = runShopTests;
}

export default runShopTests;
