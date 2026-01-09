# 安知鱼的博客系统

一个基于 Vue3 + Supabase + EdgeOne 的现代化博客系统，包含前台展示和后台管理功能。

## ✨ 特性

### 前台功能
- 📝 文章列表与详情展示
- 🏷️ 分类和标签管理
- 💬 评论系统
- 🖼️ 相册展示
- 🎵 音乐播放器
- 🔍 搜索功能
- 📱 响应式设计
- 🌙 暗黑模式支持

### 后台管理
- 👤 用户管理
- 📰 文章管理（增删改查）
- 📂 分类管理
- 🏷️ 标签管理
- 💬 评论管理（审核/删除）
- 🖼️ 媒体库管理
- 🔗 友链管理
- 📄 页面管理
- ⚙️ 网站设置
- 📊 数据统计

### 技术栈
- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **CSS 框架**: TailwindCSS
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: 宝塔面板 / EdgeOne Pages

## 🚀 快速开始

### 环境要求

- Node.js >= 18.18.0
- pnpm >= 9

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/anheyu-blog.git

# 进入项目目录
cd anheyu-blog

# 安装依赖
pnpm install

# 安装 Supabase 客户端
pnpm add @supabase/supabase-js
```

### 配置

1. 复制环境变量模板：

```bash
cp .env.example .env.local
```

2. 编辑 `.env.local`，填写 Supabase 配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_TITLE=安知鱼的博客
VITE_APP_DESCRIPTION=一个分享技术与生活的博客
VITE_API_URL=https://your-project.supabase.co
VITE_ROUTER_HISTORY=hash
```

### 数据库初始化

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 在 SQL Editor 中执行 `supabase/init.sql` 文件内容
4. 创建 `media` 存储桶并设置为 Public

### 本地开发

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:8848
```

### 构建

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 📦 部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 部署到宝塔面板（推荐）

1. 准备一台安装了宝塔面板的 Linux 服务器
2. 参考 [BAOTA_DEPLOYMENT.md](./BAOTA_DEPLOYMENT.md) 完整部署指南
3. 快速开始：
   ```bash
   # 上传项目到 /www/wwwroot/anheyu
   # 安装依赖
   pnpm install

   # 配置环境变量
   cp .env.baota.example .env.production
   # 编辑 .env.production 填写配置

   # 构建项目
   pnpm build

   # 配置 Nginx（参考 nginx.conf）
   # 重启 Nginx
   nginx -s reload
   ```

### 部署到 EdgeOne

1. 配置 EdgeOne 环境变量
2. 构建项目：`pnpm build`
3. 通过 EdgeOne Pages 部署或手动上传 `dist` 目录

## 📁 项目结构

```
anheyu-blog/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口
│   │   └── supabase/      # Supabase API 封装
│   ├── assets/            # 资源文件
│   ├── components/        # 公共组件
│   ├── composables/       # 组合式函数
│   ├── config/           # 配置文件
│   ├── layout/           # 布局组件
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── types/            # TypeScript 类型
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── post/         # 博客前台
│   │   └── system/       # 后台管理
│   ├── App.vue
│   └── main.ts
├── supabase/             # Supabase 配置
│   └── init.sql          # 数据库初始化脚本
├── build/                # 构建配置
├── types/                # 全局类型定义
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── DEPLOYMENT.md         # 部署文档
├── BAOTA_DEPLOYMENT.md   # 宝塔面板部署文档
├── nginx.conf            # Nginx 配置示例
├── deploy.sh             # 自动部署脚本
├── ecosystem.config.js   # PM2 进程管理配置
└── .env.baota.example    # 宝塔部署环境变量模板
```

## 🔧 功能模块说明

### 文章管理
- 支持富文本编辑
- Markdown 支持
- 封面图上传
- 分类和标签关联
- 发布/草稿状态
- 置顶功能
- SEO 优化

### 评论管理
- 支持嵌套回复
- 评论审核机制
- 邮箱验证
- 防垃圾评论
- @用户功能

### 媒体管理
- 图片上传
- 图片压缩
- 存储桶管理
- 外链支持

### 统计分析
- 文章浏览量统计
- 评论统计
- 用户活跃度
- 访问趋势分析

## 📝 开发指南

### 添加新的 API

```typescript
// src/api/supabase/your-feature.ts
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';

export async function getData(params: any) {
  const { data, error } = await supabase
    .from(TABLES.YOUR_TABLE)
    .select('*');

  if (error) {
    handleSupabaseError(error);
  }

  return data;
}
```

### 添加新的页面

1. 在 `src/views` 下创建页面组件
2. 在 `src/router/modules` 添加路由配置
3. 如需后台菜单，更新 `src/store/modules/permission.ts`

## 🐛 常见问题

### 数据库连接失败
- 检查 `.env.local` 中的 Supabase 配置是否正确
- 确认 Supabase 项目状态为 Active

### 图片上传失败
- 确认 Supabase 中已创建 `media` 存储桶
- 检查存储桶权限设置

### 更多问题
请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 常见问题章节

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Vue.js](https://vuejs.org/)
- [Supabase](https://supabase.com/)
- [Element Plus](https://element-plus.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
