/**
 * Performance Monitor - 性能监控面板
 * 实时监控游戏性能指标
 */

import { gameState } from '../v3/js/core/GameState.js';
import { eventBus, EVENTS } from '../v3/js/core/EventBus.js';

export class PerfMonitor {
  constructor() {
    this.isActive = false;
    this.panel = null;
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memory: 0,
      gridUpdates: 0,
      mergeTime: 0,
      stateChanges: 0,
      eventCount: 0
    };
    this.history = {
      fps: [],
      frameTime: [],
      memory: []
    };
    this.timers = {};
    
    this.init();
  }

  init() {
    this.createPanel();
    this.setupEventTracking();
    this.startMonitoring();
  }

  /**
   * 创建监控面板DOM
   */
  createPanel() {
    // 检查是否已存在
    if (document.getElementById('perf-panel')) {
      document.getElementById('perf-panel').remove();
    }

    this.panel = document.createElement('div');
    this.panel.id = 'perf-panel';
    this.panel.innerHTML = `
      <div id="perf-content" style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.85);
        color: #0f0;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        z-index: 9999;
        border-radius: 8px;
        border: 1px solid #333;
        min-width: 180px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #333;padding-bottom:6px;">
          <span style="color:#ffd700;font-weight:bold;">⚡ 性能监控</span>
          <button id="perf-toggle" style="background:#333;border:none;color:#fff;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:9px;">暂停</button>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;">
          <span style="color:#888;">FPS:</span>
          <span id="perf-fps" style="color:#0f0;font-weight:bold;">60</span>
          
          <span style="color:#888;">帧时间:</span>
          <span id="perf-frame-time" style="color:#0f0;">16.7ms</span>
          
          <span style="color:#888;">内存:</span>
          <span id="perf-memory" style="color:#0f0;">--</span>
          
          <span style="color:#888;">网格更新:</span>
          <span id="perf-grid-updates" style="color:#38ef7d;">0</span>
          
          <span style="color:#888;">合成耗时:</span>
          <span id="perf-merge-time" style="color:#38ef7d;">0ms</span>
          
          <span style="color:#888;">状态变更:</span>
          <span id="perf-state-changes" style="color:#ff9a44;">0</span>
          
          <span style="color:#888;">事件数:</span>
          <span id="perf-events" style="color:#ff9a44;">0</span>
        </div>
        
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #333;">
          <div style="color:#888;font-size:9px;margin-bottom:4px;">FPS 历史</div>
          <canvas id="perf-fps-chart" width="156" height="30" style="background:rgba(0,0,0,0.3);border-radius:3px;"></canvas>
        </div>
        
        <div style="margin-top:8px;text-align:center;">
          <button id="perf-export" style="background:#667eea;border:none;color:#fff;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:9px;margin-right:4px;">导出报告</button>
          <button id="perf-reset" style="background:#444;border:none;color:#fff;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:9px;">重置</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    
    // 绑定按钮事件
    document.getElementById('perf-toggle').addEventListener('click', () => this.toggle());
    document.getElementById('perf-export').addEventListener('click', () => this.exportReport());
    document.getElementById('perf-reset').addEventListener('click', () => this.reset());
    
    this.isActive = true;
  }

  /**
   * 设置事件追踪
   */
  setupEventTracking() {
    // 追踪网格更新
    gameState.subscribe('grid', () => {
      this.metrics.gridUpdates++;
    });
    
    // 追踪状态变更
    gameState.subscribe('*', () => {
      this.metrics.stateChanges++;
    });
    
    // 追踪所有事件
    const originalEmit = eventBus.emit.bind(eventBus);
    eventBus.emit = (event, data) => {
      this.metrics.eventCount++;
      return originalEmit(event, data);
    };
    
    // 监听合成事件以计时
    eventBus.on(EVENTS.MERGE_COMPLETED, () => {
      if (this.timers.mergeStart) {
        this.metrics.mergeTime = performance.now() - this.timers.mergeStart;
        this.timers.mergeStart = null;
      }
    });
  }

  /**
   * 开始监控
   */
  startMonitoring() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFrame = () => {
      if (!this.isActive) return;
      
      const now = performance.now();
      const delta = now - lastTime;
      frames++;
      
      // 每秒更新一次FPS
      if (delta >= 1000) {
        this.metrics.fps = frames;
        this.metrics.frameTime = (delta / frames).toFixed(1);
        
        // 记录历史
        this.history.fps.push(frames);
        this.history.frameTime.push(parseFloat(this.metrics.frameTime));
        if (this.history.fps.length > 60) {
          this.history.fps.shift();
          this.history.frameTime.shift();
        }
        
        frames = 0;
        lastTime = now;
        
        // 更新内存信息（如果可用）
        if (performance.memory) {
          this.metrics.memory = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
        }
        
        // 更新UI
        this.updateUI();
        
        // 重置计数器
        this.metrics.gridUpdates = 0;
        this.metrics.stateChanges = 0;
        this.metrics.eventCount = 0;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    if (!this.panel) return;
    
    const fpsEl = document.getElementById('perf-fps');
    const frameTimeEl = document.getElementById('perf-frame-time');
    const memoryEl = document.getElementById('perf-memory');
    const gridUpdatesEl = document.getElementById('perf-grid-updates');
    const mergeTimeEl = document.getElementById('perf-merge-time');
    const stateChangesEl = document.getElementById('perf-state-changes');
    const eventsEl = document.getElementById('perf-events');
    
    if (fpsEl) {
      fpsEl.textContent = this.metrics.fps;
      fpsEl.style.color = this.metrics.fps >= 55 ? '#0f0' : this.metrics.fps >= 30 ? '#ff9a44' : '#ff416c';
    }
    if (frameTimeEl) frameTimeEl.textContent = this.metrics.frameTime + 'ms';
    if (memoryEl) memoryEl.textContent = this.metrics.memory ? this.metrics.memory + 'MB' : '--';
    if (gridUpdatesEl) gridUpdatesEl.textContent = this.metrics.gridUpdates;
    if (mergeTimeEl) mergeTimeEl.textContent = this.metrics.mergeTime.toFixed(1) + 'ms';
    if (stateChangesEl) stateChangesEl.textContent = this.metrics.stateChanges;
    if (eventsEl) eventsEl.textContent = this.metrics.eventCount;
    
    // 绘制FPS图表
    this.drawFPSChart();
  }

  /**
   * 绘制FPS历史图表
   */
  drawFPSChart() {
    const canvas = document.getElementById('perf-fps-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (this.history.fps.length < 2) return;
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // 绘制FPS线
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxFPS = 70;
    const stepX = width / (this.history.fps.length - 1);
    
    this.history.fps.forEach((fps, i) => {
      const x = i * stepX;
      const y = height - (fps / maxFPS) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 绘制当前值点
    const lastFPS = this.history.fps[this.history.fps.length - 1];
    const lastY = height - (lastFPS / maxFPS) * height;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(width - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 记录合成开始时间
   */
  startMergeTimer() {
    this.timers.mergeStart = performance.now();
  }

  /**
   * 切换监控状态
   */
  toggle() {
    this.isActive = !this.isActive;
    const btn = document.getElementById('perf-toggle');
    if (btn) {
      btn.textContent = this.isActive ? '暂停' : '继续';
      btn.style.background = this.isActive ? '#333' : '#ff416c';
    }
    
    if (this.isActive) {
      this.startMonitoring();
    }
    
    console.log(`性能监控${this.isActive ? '已恢复' : '已暂停'}`);
  }

  /**
   * 显示面板
   */
  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
    }
  }

  /**
   * 隐藏面板
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  /**
   * 销毁面板
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.isActive = false;
  }

  /**
   * 重置统计
   */
  reset() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memory: 0,
      gridUpdates: 0,
      mergeTime: 0,
      stateChanges: 0,
      eventCount: 0
    };
    this.history = {
      fps: [],
      frameTime: [],
      memory: []
    };
    this.updateUI();
    console.log('性能统计已重置');
  }

  /**
   * 导出性能报告
   */
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      history: this.history,
      averageFPS: this.history.fps.length > 0 
        ? (this.history.fps.reduce((a, b) => a + b, 0) / this.history.fps.length).toFixed(1)
        : 0,
      minFPS: this.history.fps.length > 0 ? Math.min(...this.history.fps) : 0,
      maxFPS: this.history.fps.length > 0 ? Math.max(...this.history.fps) : 0,
      gameState: {
        inventoryCount: gameState.get('inventory').length,
        realm: gameState.get('realmIndex'),
        stage: gameState.get('stageIndex'),
        mergeCount: gameState.get('mergeCount'),
        stoneCount: gameState.get('stoneCount')
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perf-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('性能报告已导出');
    return report;
  }
}

// 创建全局实例
export const perfMonitor = new PerfMonitor();

// 挂载到全局
if (typeof window !== 'undefined') {
  window.perfMonitor = perfMonitor;
}

export default perfMonitor;
