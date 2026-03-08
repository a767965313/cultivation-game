# 🚀 Web 游戏项目 DevOps 工作流

> 标准化开发、测试、部署流程
> 解决 GitHub Pages 国内访问问题

---

## 一、工作流概览

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   本地开发   │ ──▶ │   本地测试   │ ──▶ │  预览部署    │ ──▶ │  生产部署    │
│  (Develop)  │     │   (Test)    │     │  (Preview)  │     │  (Deploy)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                     │                   │                   │
      ▼                     ▼                   ▼                   ▼
  版本迭代开发          控制台无报错        Vercel Preview     GitHub + Vercel
  index-vX.X.html      移动端适配检查      在线预览链接        双平台部署
```

---

## 二、开发规范

### 2.1 分支策略

```
main (生产分支)
  │
  ├── develop (开发分支，可选)
  │     │
  │     └── feature/xxx (功能分支，大型项目用)
  │
  └── 直接提交 (小型项目，单文件模式)
```

**单文件项目推荐：直接 main 分支开发**，通过版本文件管理迭代。

### 2.2 版本迭代规范

```
MVP → V1.0 → V1.1 → ... → V2.0 → Complete
 │      │      │            │        │
核心   首个   功能迭代      重构     完整版
验证   发布
```

**文件命名：**
- `index-mvp.html` - 最小可行产品
- `index-v1.0.html` - 正式发布
- `index-v1.1.html` - 功能迭代
- `index-v2.0.html` - 重大更新
- `index-v2.1-complete.html` - 功能完整版

### 2.3 代码提交规范

```bash
# 格式：<type>: <description>
# 示例：
git commit -m "feat: 添加炼丹系统"
git commit -m "fix: 修复合成动画卡顿"
git commit -m "deploy: 部署 V2.1 到生产环境"
```

**类型：**
- `feat` - 新功能
- `fix` - 修复
- `refactor` - 重构
- `deploy` - 部署
- `docs` - 文档

---

## 三、测试流程

### 3.1 本地测试检查清单

```
□ 功能测试
  □ 核心玩法可正常运行
  □ 无 JavaScript 报错（F12 控制台）
  □ 边界情况处理（空状态、最大值等）

□ 兼容性测试
  □ Chrome / Edge 最新版
  □ 移动端 Chrome（开发者工具模拟）
  □ Safari（如有条件）

□ 响应式测试
  □ 竖屏 375×667（iPhone SE）
  □ 竖屏 390×844（iPhone 14）
  □ 横屏 768×1024（iPad）
  □ 桌面 1920×1080

□ 性能测试
  □ 首屏加载 < 3 秒
  □ 内存占用稳定（无泄漏）
  □ 动画流畅（60fps）
```

### 3.2 快速本地测试命令

```bash
# 1. 启动本地服务器（项目目录）
python3 -m http.server 8080
# 或
npx serve .

# 2. 浏览器访问
open http://localhost:8080

# 3. 打开控制台检查报错
# F12 → Console 标签
```

---

## 四、部署策略

### 4.1 双平台部署架构

```
                    ┌─────────────────┐
                    │   GitHub Repo   │
                    │  (代码仓库)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │GitHub Pages │  │ Vercel      │  │ Gitee Pages │
    │(海外用户)   │  │ (国内用户)   │  │ (备用)      │
    │免费自动     │  │ 免费自动     │  │ 需实名      │
    └─────────────┘  └─────────────┘  └─────────────┘
```

**主策略：GitHub Pages + Vercel 双部署**
- GitHub Pages：海外用户、代码展示
- Vercel：国内用户、主力访问

### 4.2 Vercel 部署配置（推荐）

#### 首次部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录（会打开浏览器授权）
vercel login

# 3. 在项目根目录执行
vercel

# 回答提示：
# ? Set up and deploy "~/project"? [Y/n] → Y
# ? Which scope? [你的账号]
# ? Link to existing project? [y/N] → N
# ? What's your project name? [project-name]
```

#### 自动部署

连接 GitHub 仓库后，每次 `git push` 自动部署：

```bash
# Vercel Dashboard → Project → Git → Connect GitHub
# 或命令行
vercel --prod
```

### 4.3 部署检查清单

```
□ 部署前
  □ index.html 在仓库根目录
  □ 所有资源使用相对路径
  □ 敏感信息已移除
  □ 本地测试通过

□ 部署中
  □ Git commit 提交
  □ Git push 到远程
  □ Vercel 构建成功

□ 部署后
  □ GitHub Pages 可访问（代理）
  □ Vercel 可访问（国内）
  □ 功能正常
  □ 移动端显示正常
```

---

## 五、环境配置

### 5.1 Git 配置（一劳永逸）

```bash
# 解决推送超时
git config --global http.postBuffer 524288000
git config --global http.version HTTP/1.1
git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 5

# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### 5.2 多远程仓库配置

```bash
# 1. 添加多个远程仓库
git remote add origin https://github.com/username/repo.git
git remote add gitee https://gitee.com/username/repo.git

# 2. 同时推送到两个平台
git push origin main
git push gitee main

# 3. 或者配置自动双推（可选）
# 编辑 .git/config，添加多个 url
```

---

## 六、版本发布流程

### 6.1 标准发布流程

```
Step 1: 开发完成
  ├── 复制上一版本：cp index-v1.0.html index-v1.1.html
  ├── 实现新功能
  └── 本地测试通过

Step 2: 更新文档
  ├── 更新 FUNCTION_STATUS.md
  ├── 更新 README.md 更新日志
  └── 检查版本号

Step 3: 提交代码
  ├── git add -A
  ├── git commit -m "feat: 添加XX功能"
  └── git push origin main

Step 4: 验证部署
  ├── 等待 Vercel 构建完成（约30秒）
  ├── 访问 Vercel 链接验证
  └── 国内网络直接访问测试

Step 5: 完成发布
  └── 通知用户/更新文档
```

### 6.2 热修复流程

```
发现线上问题
      │
      ▼
修复代码（直接修改当前版本）
      │
      ▼
git add + commit -m "fix: 修复XX问题"
      │
      ▼
git push（自动触发 Vercel 重新部署）
      │
      ▼
验证修复
```

---

## 七、监控与回滚

### 7.1 版本回滚

```bash
# 方式 1：回滚到上一个版本
git revert HEAD
git push

# 方式 2：强制回滚到指定版本
git log --oneline -5
git reset --hard <commit-hash>
git push --force

# 方式 3：使用备份文件
cp index-v1.0.html index.html
git add index.html
git commit -m "rollback: 回滚到 v1.0"
git push
```

### 7.2 访问监控（可选）

```bash
# 简单可用性检查
curl -s -o /dev/null -w "%{http_code}" https://your-project.vercel.app

# 返回 200 表示正常
```

---

## 八、快速命令速查

```bash
# ===== 开发 =====
# 启动本地服务器
python3 -m http.server 8080
npx serve .

# ===== 版本 =====
# 创建新版本
cp index.html index-v1.1.html

# ===== 提交 =====
git add -A
git commit -m "feat: xxx"
git push origin main

# ===== 部署 =====
# Vercel 首次部署
vercel

# Vercel 生产部署
vercel --prod

# ===== 回滚 =====
git revert HEAD
git push
```

---

## 九、项目结构示例

```
cultivation-game/
├── 📄 index.html              # 当前线上版本 ⭐
├── 📄 index-v1.0.html         # 版本备份
├── 📄 index-v1.1.html
├── 📄 index-v2.0.html
├── 📄 index-v2.1-complete.html
├── 📄 manifest.json           # PWA 配置
├── 📄 README.md               # 项目文档
├── 📄 FUNCTION_STATUS.md      # 功能状态
├── 📁 docs/                   # 文档目录
│   ├── gitee-pages-deploy.md
│   ├── vercel-deploy.md
│   └── devops-workflow.md     # 本文件
├── 📁 .github/                # GitHub 配置
│   └── workflows/             # CI/CD（高级）
└── 📄 .gitignore
```

---

## 十、总结

| 阶段 | 工具/平台 | 关键动作 |
|-----|----------|---------|
| **开发** | VS Code / Cursor | 版本迭代、本地测试 |
| **测试** | Chrome DevTools | 控制台、响应式、性能 |
| **预览** | Vercel Preview | 在线预览、分享测试 |
| **部署** | GitHub + Vercel | 双平台、自动部署 |
| **访问** | Vercel 为主 | 国内用户优先 |

**核心原则：**
1. 单文件快速迭代
2. 本地测试通过再部署
3. Vercel 解决国内访问
4. GitHub 保留代码和海外访问

---

*文档版本：v1.0*
*最后更新：2026-03-08*
