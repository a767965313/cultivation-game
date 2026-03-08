# Vercel 部署指南

## 一键部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录（浏览器授权）
vercel login

# 3. 在项目目录执行
vercel

# 4. 按提示选择：
# - Set up and deploy? [Y/n] → Y
# - Which scope? → 选择你的账号
# - Link to existing project? [y/N] → N
# - What's your project name? → cultivation-game
```

## 自动部署

每次 `git push` 到 GitHub 后，Vercel 会自动重新部署。

## 访问地址

部署后获得 `.vercel.app` 域名，国内访问速度优于 GitHub Pages。

## 优点

- 国内访问速度快
- 自动 HTTPS
- 自动部署
- 免费额度充足
