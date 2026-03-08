# 🎮 Web 游戏项目开发提示词模板

> 通用模板：适用于各类 HTML5 Web 游戏（休闲/策略/RPG/动作）
> 基于「修仙合成系统」工程实践，扩展为多类型游戏开发指南

---

## 一、项目启动：需求定义

### 1.1 核心定位（必须明确）
```
□ 游戏类型：
  ○ 合成类（Merge）     ○ 点击放置（Idle/Clicker）
  ○ 塔防（TD）          ○ 卡牌（Card）
  ○ 回合制 RPG          ○ 动作（Action）
  ○ 解谜（Puzzle）      ○ 其他：_______

□ 核心玩法（一句话）：
  例：「捕捉灵气 → 合成提纯 → 突破境界」
  例：「放置防御塔 → 抵御波次敌人 → 升级科技树」

□ 目标平台：
  ○ 移动端优先（竖屏）  ○ 桌面端优先（横屏）  ○ 全平台适配
```

### 1.2 技术选型决策

| 维度 | 选项 A | 选项 B | 选项 C | 推荐场景 |
|-----|--------|--------|--------|---------|
| **架构** | 单文件 HTML | 多文件模块化 | 游戏框架 | MVP 用单文件，大型项目用框架 |
| **渲染** | DOM + CSS | Canvas 2D | WebGL | UI 重用 DOM，大量粒子用 Canvas |
| **状态管理** | 全局对象 | 类封装 | 事件总线 | 简单游戏用全局，复杂用类 |
| **存储** | LocalStorage | IndexedDB | 云端 | 单机用 LocalStorage，大数据用 IndexedDB |
| **构建** | 无构建 | Vite/Rollup | Webpack | 单文件免构建，框架项目用 Vite |

**默认推荐（快速启动）：**
- 单文件 HTML + DOM 渲染 + LocalStorage + 无构建

---

## 二、目录结构规范

### 2.1 单文件模式（推荐 MVP 使用）
```
project-name/
├── index.html              # 当前线上版本（GitHub Pages 根目录）⭐
├── manifest.json           # PWA 配置（可选）
├── index-v1.0.html         # 版本备份（按迭代归档）
├── index-v1.1.html
├── index-v2.0.html
├── FUNCTION_STATUS.md      # 功能实现状态追踪
├── README.md               # 项目文档
└── docs/                   # 设计文档
    ├── requirements.md     # 需求文档
    ├── roadmap.md          # 路线图
    └── changelog.md        # 变更日志
```

### 2.2 多文件模式（复杂项目）
```
project-name/
├── index.html              # 入口文件
├── css/
│   ├── base.css           # 重置 + 变量
│   ├── components.css     # 组件样式
│   └── animations.css     # 动画
├── js/
│   ├── core/
│   │   ├── GameState.js   # 状态管理
│   │   ├── EventBus.js    # 事件系统
│   │   └── SaveManager.js # 存档管理
│   ├── systems/           # 游戏系统
│   │   ├── Combat.js
│   │   ├── Inventory.js
│   │   └── Shop.js
│   └── main.js            # 入口
├── assets/                # 静态资源
│   ├── images/
│   └── audio/
└── docs/
```

### 2.3 框架模式（Phaser/Pixi 等）
```
project-name/
├── src/
│   ├── scenes/            # 游戏场景
│   ├── entities/          # 游戏实体
│   ├── systems/           # 游戏系统
│   └── main.js
├── public/                # 静态资源
├── dist/                  # 构建输出
├── index.html
└── package.json
```

---

## 三、版本迭代流程

### 3.1 版本命名规范

| 版本 | 命名示例 | 含义 | 适用场景 |
|-----|---------|------|---------|
| MVP | `index-mvp.html` | 最小可行产品 | 验证核心玩法 |
| Patch | `index-v1.0.1.html` | Bug 修复 | 紧急修复 |
| Minor | `index-v1.1.html` | 新功能 | 添加功能模块 |
| Major | `index-v2.0.html` | 重大变更 | 架构重构/大版本 |
| Complete | `index-v2.1-complete.html` | 功能完整版 | 整合所有功能 |
| Refactor | `index-v3.0-refactor.html` | 代码重构 | 优化不改动功能 |

### 3.2 迭代检查清单

```
□ 需求确认
  □ 功能范围明确
  □ 验收标准定义

□ 开发阶段
  □ 复制上一版本为基础
  □ 功能开发完成
  □ 本地测试通过（无控制台报错）
  □ 移动端/桌面端适配检查

□ 文档更新
  □ FUNCTION_STATUS.md 状态更新
  □ README.md 更新日志
  □ 新增功能说明文档（如需要）

□ 版本控制
  □ Git add 所有变更
  □ Commit message 规范（版本号 + 功能描述）
  □ Push 到远程仓库
  □ 验证 GitHub Pages 部署
```

---

## 四、核心架构模板

### 4.1 单文件架构（通用）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, max-scale=1.0, user-scalable=no">
    <title>{{游戏名}} - {{版本号}}</title>
    <style>
        /* === 1. 设计令牌（变量）=== */
        :root {
            --color-primary: #667eea;
            --color-bg: #1a1a2e;
            --spacing-unit: 8px;
            --radius: 12px;
        }
        
        /* === 2. 重置 + 基础 === */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; background: var(--color-bg); }
        
        /* === 3. 布局系统 === */
        .container { max-width: 100%; margin: 0 auto; padding: 10px; }
        .grid { display: grid; }
        .flex { display: flex; }
        
        /* === 4. 组件样式 === */
        .btn { /* 按钮样式 */ }
        .card { /* 卡片样式 */ }
        .modal { /* 弹窗样式 */ }
        
        /* === 5. 动画 === */
        @keyframes fadeIn { /* ... */ }
    </style>
</head>
<body>
    <!-- === UI 层 === -->
    <div id="app">
        <!-- 根据游戏类型定义 -->
    </div>
    
    <script>
        // === 1. 配置层 ===
        const CONFIG = {
            VERSION: '1.0.0',
            SAVE_KEY: 'game_save_v1',
            // 游戏特定配置
        };
        
        // === 2. 状态层（单一数据源）===
        const GameState = {
            // 核心数据
            data: { /* ... */ },
            
            // 方法：获取状态
            get(key) { return this.data[key]; },
            
            // 方法：更新状态（触发 UI 更新）
            set(key, value) {
                this.data[key] = value;
                EventBus.emit('state:changed', { key, value });
            }
        };
        
        // === 3. 事件总线（解耦）===
        const EventBus = {
            events: {},
            on(event, callback) { /* ... */ },
            emit(event, data) { /* ... */ }
        };
        
        // === 4. 系统层（游戏逻辑）===
        const Systems = {
            // 战斗系统
            Combat: { init() {}, update() {} },
            // 经济系统
            Economy: { init() {}, update() {} },
            // 存档系统
            Save: { save() {}, load() {} }
        };
        
        // === 5. 渲染层（UI 更新）===
        const Renderer = {
            init() { this.bindEvents(); },
            bindEvents() {
                EventBus.on('state:changed', ({ key, value }) => {
                    this.updateUI(key, value);
                });
            },
            updateUI(key, value) { /* 更新对应 DOM */ }
        };
        
        // === 6. 初始化 ===
        function init() {
            Systems.Save.load();
            Object.values(Systems).forEach(s => s.init?.());
            Renderer.init();
            gameLoop();
        }
        
        // === 7. 游戏循环 ===
        function gameLoop() {
            // 更新逻辑
            Object.values(Systems).forEach(s => s.update?.());
            requestAnimationFrame(gameLoop);
        }
        
        // 启动
        init();
    </script>
</body>
</html>
```

### 4.2 状态管理方案选择

| 复杂度 | 方案 | 代码示例 | 适用 |
|-------|------|---------|------|
| 简单 | 全局对象 | `const state = { gold: 0 }` | 放置/点击游戏 |
| 中等 | 类封装 | `class GameState { }` | 合成/卡牌游戏 |
| 复杂 | Proxy 响应式 | `new Proxy(state, { set() {} })` | RPG/复杂系统 |
| 团队 | 状态管理库 | Redux/Zustand | 多人协作项目 |

---

## 五、功能模块速查

### 5.1 通用模块（大多数游戏需要）

```
□ 核心玩法（Unique Selling Point）
□ 进度系统（等级/经验/技能树）
□ 资源系统（货币/材料/道具）
□ 存档系统（自动/手动/多槽位）
□ 设置系统（音量/画质/语言）
□ 新手引导（Tutorial）
```

### 5.2 按类型选配模块

**合成类（Merge）：**
```
□ 合成器网格（Grid）
□ 拖拽交互
□ 连锁合成（Combo）
□ 品质/等级系统
□ 收集图鉴
```

**放置/点击（Idle/Clicker）：**
```
□ 离线收益计算
□ 自动生产队列
□ 升级树（Upgrade Tree）
□ 声望/重置系统（Prestige）
□ 多层级资源
```

**塔防（TD）：**
```
□ 敌人波次系统
□ 防御塔升级
□ 路径寻路
□ 范围/攻速计算
□ 技能/法术系统
```

**卡牌（Card）：**
```
□ 牌组管理
□ 抽牌/弃牌逻辑
□ 卡牌效果系统
□ 敌人 AI
□ 遗物/宝物系统
```

**RPG：**
```
□ 角色属性系统
□ 装备/背包
□ 任务系统
□ 对话/剧情树
□ 战斗回合制/即时制
```

---

## 六、部署与发布

### 6.1 部署平台对比

| 平台 | 优点 | 缺点 | 适用 |
|-----|------|------|------|
| **GitHub Pages** | 免费、自动化 | 国内访问慢 | 海外用户/开源项目 |
| **Vercel** | 极速、自动部署 | 函数限制 | 需要服务端功能 |
| **Netlify** | 拖拽部署 | 带宽限制 | 快速原型 |
| **Surge.sh** | 命令行部署 | 无 CI | 快速分享 |
| **Gitee Pages** | 国内快 | 需审核 | 国内用户为主 |
| **自有服务器** | 完全控制 | 需维护 | 商业化项目 |

### 6.2 GitHub Pages 部署规范

**部署前检查清单：**
```
□ index.html 位于仓库根目录（非子目录）⭐
□ manifest.json 如使用 PWA 也在根目录
□ 所有资源使用相对路径（./ 或文件名）
□ 无敏感信息泄露（API keys、密码）
□ .gitignore 排除 node_modules 等
```

**部署问题排查：**
| 问题 | 原因 | 解决 |
|-----|------|------|
| 404 | index.html 不在根目录 | 复制到根目录或配置自定义域名 |
| 样式丢失 | 路径错误 | 检查 CSS/JS 引用路径 |
| 缓存不更新 | CDN 缓存 | 强制刷新（Ctrl+Shift+R）|
| 推送超时 | 网络/Git 配置 | 调整 http 配置 |

**Git 配置（解决推送超时）：**
```bash
git config http.postBuffer 524288000
git config http.version HTTP/1.1
git config http.lowSpeedLimit 1000
git config http.lowSpeedTime 5
```

---

## 七、性能优化检查清单

### 7.1 渲染性能
```
□ 使用 transform/opacity 做动画（GPU 加速）
□ 避免频繁 DOM 操作（批量更新）
□ 使用 requestAnimationFrame 做循环
□ Canvas 游戏使用对象池（Object Pool）
□ 图片懒加载/预加载策略
```

### 7.2 内存管理
```
□ 及时移除事件监听器
□ 使用 WeakMap/WeakSet 管理临时数据
□ 避免循环引用
□ 定期清理 LocalStorage 过期数据
```

### 7.3 加载优化
```
□ 单文件压缩（Minify）
□ 图片使用 WebP 格式
□ 音频按需加载
□ 使用 Service Worker 缓存（PWA）
```

---

## 八、快速启动提示词

### 8.1 新项目（通用版）
```
创建一个 Web 游戏：

【基本信息】
- 类型：[合成类/塔防/放置/卡牌/RPG/其他]
- 核心玩法：[一句话描述]
- 平台：[移动端/桌面端/全平台]

【技术选型】
- 架构：单文件 HTML / 多文件 / 框架
- 渲染：DOM / Canvas / WebGL
- 存储：LocalStorage / IndexedDB

【迭代计划】
- MVP：[核心功能]
- V1.x：[功能列表]
- V2.0：[完整功能]

按「Web 游戏开发模板」执行：
1. 创建目录结构
2. 实现 MVP
3. 准备部署
```

### 8.2 功能迭代（通用版）
```
在当前版本基础上添加功能：

【功能描述】
- 名称：[功能名]
- 类型：[系统/玩法/UI/优化]
- 需求：[具体描述]

【验收标准】
- [ ] 功能可用
- [ ] 无控制台报错
- [ ] 移动端适配
- [ ] 文档已更新

按模板执行：复制版本 → 开发 → 测试 → 提交
```

### 8.3 部署上线（通用版）
```
部署当前版本：

【部署配置】
- 平台：[GitHub Pages/Vercel/其他]
- 域名：[默认/自定义]
- 环境：[生产/测试]

【检查项】
- [ ] index.html 在根目录
- [ ] 资源路径正确
- [ ] 敏感信息已移除
- [ ] 本地测试通过

执行部署流程并验证线上访问
```

---

## 九、常见错误速查

| 错误 | 场景 | 解决方案 |
|-----|------|---------|
| `404 File not found` | GitHub Pages | index.html 必须在仓库根目录 |
| `Operation too slow` | Git 推送 | 调整 http.postBuffer |
| `failed to push` | 版本冲突 | `git pull --rebase` 后 push |
| 样式错乱 | 移动端 | 检查 viewport meta 标签 |
| 点击无响应 | 移动端 | 添加 `touch-action: manipulation` |
| 存档丢失 | 更新后 | 检查 LocalStorage key 兼容性 |
| 动画卡顿 | 性能问题 | 使用 transform 代替 left/top |
| 内存泄漏 | 长时间运行 | 检查事件监听器清理 |

---

## 十、示例项目参考

### 10.1 单文件典范
**修仙合成系统** - https://a767965313.github.io/cultivation-game/
- 单文件 62KB 包含全部功能
- 12 个版本迭代（MVP → V2.1）
- 3 个存档槽位设计
- PWA 完整支持

**特点：**
- DOM 渲染 + CSS Grid 布局
- 全局状态管理
- LocalStorage 多槽位存档
- 无构建工具

### 10.2 其他类型参考
| 类型 | 开源项目 | 学习点 |
|-----|---------|--------|
| 放置 | Cookie Clicker | 离线收益计算 |
| 塔防 | Tower Defense | 波次系统 |
| 卡牌 | Slay the Spire JS | 卡牌效果系统 |
| RPG | BrowserQuest | Canvas 渲染 |

---

## 附录：决策树

```
开始新项目
    │
    ├─ 快速原型验证？
    │   ├─ 是 → 单文件 + DOM + 无构建
    │   └─ 否 → 继续
    │
    ├─ 需要复杂图形/粒子？
    │   ├─ 是 → Canvas / WebGL
    │   └─ 否 → DOM + CSS
    │
    ├─ 大量数据存档？
    │   ├─ 是 → IndexedDB
    │   └─ 否 → LocalStorage
    │
    └─ 团队协作？
        ├─ 是 → 多文件 + 构建工具 + 类型检查
        └─ 否 → 单文件或简单多文件
```

---

*模板版本：v2.0*
*适用范围：HTML5 Web 游戏（单文件/多文件/框架）*
*最后更新：2026-03-08*
