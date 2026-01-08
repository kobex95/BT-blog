# 博客系统部署文档

本文档提供完整的博客系统部署指南，包括前端、后台管理系统、Supabase 数据库和 EdgeOne 平台的配置。

## 目录

- [前置准备](#前置准备)
- [Supabase 数据库配置](#supabase-数据库配置)
- [项目配置](#项目配置)
- [本地开发](#本地开发)
- [部署到 EdgeOne](#部署到-edgeone)
- [常见问题](#常见问题)

## 前置准备

### 1. 安装必要工具

```bash
# 安装 Node.js (推荐 v20 或更高版本)
# 下载地址: https://nodejs.org/

# 安装 pnpm
npm install -g pnpm

# 验证安装
node -v
pnpm -v
```

### 2. 创建账号

- **Supabase**: https://supabase.com/signup
- **腾讯云 EdgeOne Pages**: https://cloud.tencent.com/product/edgeone

## Supabase 数据库配置

### 1. 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `anheyu-blog`
   - **Database Password**: 设置强密码并保存
   - **Region**: 选择最近的区域（如 `Southeast Asia (Singapore)`）
4. 等待项目创建完成（通常需要 2-3 分钟）

### 2. 获取项目凭证

1. 在项目首页，找到以下信息：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. 保存这两个值，稍后配置环境变量时使用。

### 3. 创建数据库表

有两种方式执行数据库初始化：

#### 方式一：使用 SQL 编辑器（推荐）

1. 在 Supabase Dashboard，点击左侧菜单的 **SQL Editor**
2. 点击 "New query"
3. 复制项目根目录下的 `supabase/init.sql` 文件内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行脚本

#### 方式二：使用命令行

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到项目
supabase link --project-ref YOUR_PROJECT_REF

# 执行初始化脚本
supabase db push
```

### 4. 配置存储桶

1. 在 Supabase Dashboard，点击左侧菜单的 **Storage**
2. 点击 "New bucket"
3. 创建存储桶：
   - **Name**: `media`
   - **Public bucket**: 勾选（使文件可公开访问）
4. 点击 "Create bucket"

### 5. 配置 RLS (Row Level Security)

数据库初始化脚本已经包含了基础 RLS 配置。如需自定义权限策略，可以在 SQL Editor 中执行：

```sql
-- 示例：允许所有用户读取已发布的文章
CREATE POLICY "Public read access to posts"
ON posts FOR SELECT
USING (status = 'published');

-- 示例：允许认证用户创建评论
CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

## 项目配置

### 1. 安装依赖

```bash
# 进入项目目录
cd d:/anheyu

# 安装项目依赖
pnpm install

# 安装 Supabase 客户端
pnpm add @supabase/supabase-js
```

### 2. 配置环境变量

复制环境变量模板：

```bash
# 复制模板文件
cp .env.example .env.local
```

编辑 `.env.local` 文件，填写你的配置：

```env
# Supabase 数据库配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用配置
VITE_APP_TITLE=安知鱼的博客
VITE_APP_DESCRIPTION=一个分享技术与生活的博客

# API 配置
VITE_API_URL=https://your-project.supabase.co

# 路由模式 (hash 或 history)
VITE_ROUTER_HISTORY=hash

# 开发端口
VITE_PORT=8848
```

### 3. 修改 Vite 配置

确保 `vite.config.ts` 中的代理配置正确：

```typescript
server: {
  proxy: {
    "/api": {
      target: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/rest/v1')
    }
  }
}
```

## 本地开发

### 启动开发服务器

```bash
# 启动开发服务器
pnpm dev
```

访问 `http://localhost:8848` 查看前端页面。

### 创建管理员账号

数据库初始化脚本已经创建了一个测试管理员账号：

- **用户名**: `admin`
- **邮箱**: `admin@example.com`
- **密码**: `admin123`（请在生产环境中修改）

### 修改管理员密码

登录 Supabase Dashboard，在 SQL Editor 中执行：

```sql
-- 生成新的密码哈希（使用 bcrypt）
-- 注意：实际应用中应该在应用层处理密码哈希

-- 示例：重置为 admin123（仅用于测试）
UPDATE users
SET password = '$2b$10$abcdefghijklmnopqrstuv'
WHERE username = 'admin';
```

## 部署到 EdgeOne

### 1. 连接 EdgeOne 集成

1. 在项目根目录，点击 IDE 中的 **EdgeOne** 集成按钮
2. 按照提示登录 EdgeOne 账号
3. 授权访问项目

### 2. 配置部署环境变量

在 EdgeOne 项目设置中，添加以下环境变量：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-project.supabase.co
VITE_APP_TITLE=安知鱼的博客
VITE_APP_DESCRIPTION=一个分享技术与生活的博客
VITE_ROUTER_HISTORY=hash
```

### 3. 构建项目

```bash
# 构建生产版本
pnpm build
```

构建产物将在 `dist` 目录中。

### 4. 部署

有两种部署方式：

#### 方式一：通过 EdgeOne Pages（推荐）

1. 将代码推送到 Git 仓库（GitHub/GitLab/Gitee）
2. 在 EdgeOne Pages 控制台，点击 "New project"
3. 选择 "Import from Git"
4. 选择你的仓库
5. 配置构建设置：
   - **Framework Preset**: `Vite`
   - **Build Command**: `pnpm build`
   - **Publish Directory**: `dist`
6. 点击 "Deploy"

#### 方式二：手动上传

1. 构建项目：
   ```bash
   pnpm build
   ```

2. 将 `dist` 目录中的所有文件上传到 EdgeOne CDN

3. 在 EdgeOne 控制台配置域名和 HTTPS

### 5. 验证部署

访问你的 EdgeOne 域名，确认：

- 前台博客页面正常显示
- 后台管理页面可以访问（`/login` 或 `/admin`）
- 数据库连接正常
- 图片上传功能可用

## 常见问题

### 1. 数据库连接失败

**问题**: 提示 "Failed to fetch" 或连接 Supabase 失败

**解决方案**:

- 检查 `.env.local` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
- 确认 Supabase 项目状态为 Active
- 检查网络连接和防火墙设置

### 2. 图片上传失败

**问题**: 上传图片时提示 "Storage not found" 或权限错误

**解决方案**:

- 确认 Supabase 中已创建 `media` 存储桶
- 检查存储桶的 RLS 策略是否允许上传
- 确认存储桶设置为 Public

### 3. 路由 404 错误

**问题**: 刷新页面后显示 404

**解决方案**:

- 确认使用 `hash` 路由模式（`.env` 中设置 `VITE_ROUTER_HISTORY=hash`）
- 如果使用 `history` 模式，需要在服务器配置 SPA fallback

### 4. EdgeOne 部署后样式丢失

**问题**: 部署后页面样式不正常

**解决方案**:

- 检查 `vite.config.ts` 中的 `base` 配置
- 确认 `VITE_PUBLIC_PATH` 环境变量设置正确
- 清除浏览器缓存重试

### 5. 评论功能异常

**问题**: 评论无法提交或显示

**解决方案**:

- 检查 Supabase 中 `comments` 表的 RLS 策略
- 确认评论是否需要审核（查看 `settings` 表中的 `comment_audit`）
- 检查前台页面是否正确调用 API

### 6. 性能优化建议

#### 前端优化

- 启用图片懒加载
- 使用 CDN 加速静态资源
- 开启 Gzip/Brotli 压缩
- 配置浏览器缓存策略

#### 数据库优化

- 为常用查询字段创建索引
- 使用 Supabase Edge Functions 处理复杂逻辑
- 启用查询结果缓存

#### EdgeOne 优化

- 配置全球加速节点
- 启用智能路由
- 使用 WAF 保护安全

## 维护和更新

### 数据库备份

定期备份 Supabase 数据库：

1. 进入 Supabase Dashboard
2. 点击 **Database** → **Backups**
3. 查看自动备份或手动创建备份

### 更新依赖

```bash
# 检查可更新的依赖
pnpm outdated

# 更新依赖
pnpm update

# 运行测试确保兼容性
pnpm typecheck
pnpm lint
```

### 监控和日志

- **Supabase**: 查看数据库查询日志和错误日志
- **EdgeOne**: 查看访问日志和 CDN 命中率
- **应用日志**: 集成 Sentry 或其他日志服务

## 技术支持

如遇到问题，请参考：

- [Supabase 文档](https://supabase.com/docs)
- [EdgeOne 文档](https://cloud.tencent.com/document/product/1552)
- [Vue.js 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)

## 许可证

MIT License
