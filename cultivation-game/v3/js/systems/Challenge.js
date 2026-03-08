/**
 * Challenge - 挑战系统
 * 处理挑战任务、限时逻辑
 */

import { CHALLENGES } from '../config.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Challenge {
  constructor() {
    this.timer = null;
    this.timeLeft = 0;
  }

  // 获取所有挑战列表
  getAllChallenges() {
    const progress = gameState.get('challengeProgress');
    const currentId = gameState.get('currentChallenge');

    return CHALLENGES.map(c => ({
      ...c,
      isCompleted: !!progress[c.id]?.completed,
      isActive: c.id === currentId,
      completedTime: progress[c.id]?.time
    }));
  }

  // 获取特定挑战
  getChallenge(challengeId) {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return null;

    const progress = gameState.get('challengeProgress');
    const currentId = gameState.get('currentChallenge');

    return {
      ...challenge,
      isCompleted: !!progress[challengeId]?.completed,
      isActive: challengeId === currentId,
      completedTime: progress[challengeId]?.time
    };
  }

  // 开始挑战
  start(challengeId) {
    // 检查是否已有进行中的挑战
    if (gameState.get('currentChallenge')) {
      return { success: false, message: '已有进行中的挑战' };
    }

    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: '挑战不存在' };
    }

    // 检查是否已完成
    const progress = gameState.get('challengeProgress');
    if (progress[challengeId]?.completed) {
      return { success: false, message: '该挑战已完成' };
    }

    // 重置挑战事件
    gameState.set('challengeEvents', {
      stonesInTime: 0,
      maxMergeSize: 0,
      maxCombo: 0
    });

    // 设置当前挑战
    gameState.set('currentChallenge', challengeId);

    // 启动计时器（如果是限时挑战）
    if (challenge.timeLimit > 0) {
      this.timeLeft = challenge.timeLimit;
      this.startTimer();
    }

    eventBus.emit(EVENTS.CHALLENGE_START, { challengeId, challenge });

    return { success: true, challenge };
  }

  // 启动倒计时
  startTimer() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.fail();
      }
    }, 1000);
  }

  // 停止计时器
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // 检查挑战进度
  checkProgress() {
    const currentId = gameState.get('currentChallenge');
    if (!currentId) return;

    const challenge = CHALLENGES.find(c => c.id === currentId);
    if (!challenge) return;

    const events = gameState.get('challengeEvents');

    if (challenge.check(gameState.get(), events)) {
      this.complete();
    }
  }

  // 完成挑战
  complete() {
    const challengeId = gameState.get('currentChallenge');
    if (!challengeId) return;

    const challenge = CHALLENGES.find(c => c.id === challengeId);

    // 停止计时器
    this.stopTimer();

    // 记录完成
    const progress = gameState.get('challengeProgress');
    progress[challengeId] = {
      completed: true,
      time: Date.now()
    };
    gameState.set('challengeProgress', { ...progress });

    // 发放奖励
    this.giveReward(challenge);

    // 清除当前挑战
    gameState.set('currentChallenge', null);

    eventBus.emit(EVENTS.CHALLENGE_COMPLETE, { challengeId, challenge });

    return { success: true, challenge };
  }

  // 挑战失败
  fail() {
    this.stopTimer();
    gameState.set('currentChallenge', null);
    return { success: false, reason: 'time_out' };
  }

  // 放弃挑战
  abandon() {
    this.stopTimer();
    gameState.set('currentChallenge', null);
    return { success: true };
  }

  // 发放奖励
  giveReward(challenge) {
    const reward = challenge.reward;

    if (reward.includes('💎')) {
      const amount = parseInt(reward.match(/\d+/)[0]);
      const current = gameState.get('stoneCount');
      gameState.set('stoneCount', current + amount);
    } else if (reward.includes('⚡')) {
      const amount = parseInt(reward.match(/\d+/)[0]);
      const current = gameState.get('mergeCount');
      gameState.set('mergeCount', current + amount);
    }
  }

  // 获取进行中的挑战信息
  getActiveChallenge() {
    const currentId = gameState.get('currentChallenge');
    if (!currentId) return null;

    return {
      ...this.getChallenge(currentId),
      timeLeft: this.timeLeft,
      events: gameState.get('challengeEvents')
    };
  }

  // 更新挑战事件
  updateEvents(updates) {
    const events = gameState.get('challengeEvents');
    Object.assign(events, updates);
    gameState.set('challengeEvents', { ...events });

    // 检查是否完成
    this.checkProgress();
  }

  // 获取完成统计
  getCompletionStats() {
    const progress = gameState.get('challengeProgress');
    const completed = Object.keys(progress).length;
    const total = CHALLENGES.length;

    return {
      completed,
      total,
      percent: Math.floor((completed / total) * 100)
    };
  }
}

// 导出单例
export const challenge = new Challenge();
