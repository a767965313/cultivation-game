/**
 * Alchemy - 炼丹系统
 * 处理丹药炼制
 */

import { ALCHEMY_RECIPES } from '../config.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Alchemy {
  // 获取所有配方
  getAllRecipes() {
    const activePills = gameState.get('activePills');

    return ALCHEMY_RECIPES.map(recipe => {
      const canAfford = gameState.get('stoneCount') >= recipe.cost.stone;
      const isActive = activePills[recipe.effect] && Date.now() < activePills[recipe.effect];
      const remainingTime = isActive ? Math.ceil((activePills[recipe.effect] - Date.now()) / 1000) : 0;

      return {
        ...recipe,
        canAfford,
        isActive,
        remainingTime
      };
    });
  }

  // 获取特定配方
  getRecipe(recipeId) {
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return null;

    const activePills = gameState.get('activePills');
    const isActive = activePills[recipe.effect] && Date.now() < activePills[recipe.effect];

    return {
      ...recipe,
      canAfford: gameState.get('stoneCount') >= recipe.cost.stone,
      isActive,
      remainingTime: isActive ? Math.ceil((activePills[recipe.effect] - Date.now()) / 1000) : 0
    };
  }

  // 炼制丹药
  craft(recipeId) {
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) {
      return { success: false, message: '配方不存在' };
    }

    // 检查材料
    if (gameState.get('stoneCount') < recipe.cost.stone) {
      return { success: false, message: '灵石不足' };
    }

    // 检查是否已有同类型效果
    const activePills = gameState.get('activePills');
    if (activePills[recipe.effect] && Date.now() < activePills[recipe.effect]) {
      return { success: false, message: '该丹药效果还在持续中' };
    }

    // 扣除材料
    gameState.set('stoneCount', gameState.get('stoneCount') - recipe.cost.stone);

    // 应用效果
    const endTime = Date.now() + recipe.duration * 1000;
    activePills[recipe.effect] = endTime;
    gameState.set('activePills', { ...activePills });

    // 触发事件
    eventBus.emit(EVENTS.PILL_CRAFTED, {
      recipeId,
      recipe,
      endTime
    });

    return {
      success: true,
      recipe,
      duration: recipe.duration
    };
  }

  // 检查是否可以炼制
  canCraft(recipeId) {
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { canCraft: false, reason: '配方不存在' };

    if (gameState.get('stoneCount') < recipe.cost.stone) {
      return { canCraft: false, reason: '灵石不足' };
    }

    const activePills = gameState.get('activePills');
    if (activePills[recipe.effect] && Date.now() < activePills[recipe.effect]) {
      return { canCraft: false, reason: '效果持续中' };
    }

    return { canCraft: true };
  }
}

// 导出单例
export const alchemy = new Alchemy();
