# 快速开始指南

本指南将帮助您在 15 分钟内完成博客系统的部署。

## 📋 前置条件

在开始之前，请确保您已准备好：

1. ✅ Node.js (v20+)
2. ✅ pnpm 包管理器
3. ✅ Supabase 账号（免费注册）
4. ✅ 腾讯云 EdgeOne 账号（可选，用于部署）

## 🚀 五步部署

### 第 1 步：安装依赖（2 分钟）

```bash
# Windows PowerShell 用户
.\install-supabase.ps1

# Linux/Mac 用户
chmod +x install-supabase.sh
./install-supabase.sh
```

或者手动安装：

```bash
pnpm add @supabase/supabase-js
```

### 第 2 步：配置 Supabase（5 分钟）

#### 2.1 创建项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `anheyu-blog`
   - Database Password: 记住这个密码！
   - Region: 选择最近的区域
4. 等待 2-3 分钟创建完成

#### 2.2 获取凭证

在项目首页找到并复制：
- **Project URL**
- **anon public key**

#### 2.3 初始化数据库

1. 在左侧菜单点击 **SQL Editor**
2. 点击 "New query"
3. 复制项目根目录的 `supabase/init.sql` 内容
4. 粘贴并点击 "Run"

#### 2.4 配置存储

1. 点击左侧菜单 **Storage**
2. 创建新存储桶：
   - Name: `media`
   - Public bucket: ✅ 勾选
3. 点击 "Create bucket"

### 第 3 步：配置项目（2 分钟）

```bash
# 复制环境变量模板
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 填写你的 Supabase 信息
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# 其他配置
VITE_APP_TITLE=安知鱼的博客
VITE_APP_DESCRIPTION=一个分享技术与生活的博客
VITE_API_URL=https://your-project.supabase.co
VITE_ROUTER_HISTORY=hash
```

### 第 4 步：本地测试（3 分钟）

```bash
# 启动开发服务器
pnpm dev
```

访问 http://localhost:8848

#### 测试登录

- 用户名: `admin`
- 密码: `admin123`

⚠️ **重要**: 首次登录后请立即修改密码！

### 第 5 步：部署到 EdgeOne（3 分钟）

#### 5.1 构建项目

```bash
pnpm build
```

#### 5.2 部署

**方式 A: 通过 EdgeOne Pages（推荐）**

1. 将代码推送到 Git 仓库
2. 在 EdgeOne Pages 控制台创建新项目
3. 连接 Git 仓库
4. 配置构建命令：`pnpm build`
5. 设置输出目录：`dist`
6. 点击 "Deploy"

**方式 B: 手动上传**

1. 将 `dist` 目录中的所有文件上传到 EdgeOne CDN
2. 配置域名和 HTTPS

## ✅ 验证部署

访问您的 EdgeOne 域名，检查：

- [ ] 前台博客页面正常显示
- [ ] 可以访问 `/login` 登录
- [ ] 后台管理功能正常
- [ ] 数据库连接正常
- [ ] 图片上传可用

## 🎉 完成！

您的博客系统已经部署成功！

## 📚 下一步

### 学习使用

- 查看 [FEATURES.md](./FEATURES.md) 了解所有功能
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细配置

### 常见配置

#### 修改管理员密码

登录 Supabase Dashboard，在 SQL Editor 中执行：

```sql
-- 使用 bcrypt 生成新密码哈希
UPDATE users
SET password = '$2b$10$your_new_hashed_password'
WHERE username = 'admin';
```

#### 自定义主题

在 **网站设置** 中可以修改：
- 网站标题和描述
- Logo 和 Favicon
- 主题颜色
- 字体设置

#### 配置评论

在 **网站设置** -> **评论设置** 中：
- 启用/禁用评论
- 开启评论审核
- 允许游客评论

## 🔧 故障排查

### 数据库连接失败

```bash
# 检查环境变量
cat .env.local | grep SUPABASE
```

确保 URL 和 Key 格式正确。

### 图片上传失败

1. 检查 Supabase Storage 中是否创建了 `media` 桶
2. 确认存储桶设置为 Public

### 路由 404

确保 `.env.local` 中设置了：
```env
VITE_ROUTER_HISTORY=hash
```

## 📞 获取帮助

遇到问题？

1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 常见问题章节
2. 查阅 [Supabase 文档](https://supabase.com/docs)
3. 查看 [EdgeOne 文档](https://cloud.tencent.com/document/product/1552)

## 🌟 最佳实践

### 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 启用评论审核
3. ✅ 定期备份数据库
4. ✅ 更新依赖包

### 性能优化

1. ✅ 使用 CDN 加速
2. ✅ 启用图片懒加载
3. ✅ 配置浏览器缓存
4. ✅ 压缩静态资源

### 内容管理

1. ✅ 定期清理垃圾数据
2. ✅ 优化数据库索引
3. ✅ 监控存储空间
4. ✅ 备份重要内容

## 🎓 进阶使用

### 添加自定义功能

1. 在 `src/api/supabase/` 中添加新的 API
2. 在 `src/views/system/` 中添加新的管理页面
3. 在 `src/router/modules/` 中添加路由

### 使用 Supabase Edge Functions

对于复杂业务逻辑，可以使用 Supabase Edge Functions：

```bash
# 安装 CLI
npm install -g supabase

# 创建 Edge Function
supabase functions new my-function

# 部署
supabase functions deploy my-function
```

### 集成第三方服务

- **评论**: Disqus, Gitalk, Waline
- **分析**: Google Analytics, 百度统计
- **搜索**: Algolia
- **支付**: 微信支付, 支付宝

## 📊 监控和维护

### 定期任务

- 每周备份数据库
- 每月更新依赖包
- 每季度审查安全设置
- 每年更新 SSL 证书（如使用自定义域名）

### 日志监控

- Supabase Dashboard 查看数据库日志
- EdgeOne 控制台查看访问日志
- 集成 Sentry 监控错误

---

**恭喜！您已经成功部署了一个功能完整的博客系统！** 🎊

如有任何问题，欢迎查阅详细文档或寻求社区支持。
