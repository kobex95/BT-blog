# Supabase 数据库配置教程

本教程详细说明如何配置和使用 Supabase 作为博客系统的数据库。

## 📚 目录

- [什么是 Supabase](#什么是-supabase)
- [创建 Supabase 项目](#创建-supabase-项目)
- [数据库初始化](#数据库初始化)
- [存储配置](#存储配置)
- [权限配置](#权限配置)
- [API 调用示例](#api-调用示例)
- [常见问题](#常见问题)

## 什么是 Supabase

Supabase 是一个开源的 Firebase 替代品，提供：

- 🗄️ PostgreSQL 数据库
- 🔐 认证系统
- 📦 实时订阅
- 🗂️ 文件存储
- ⚡ Edge Functions

## 创建 Supabase 项目

### 1. 注册账号

访问 [supabase.com](https://supabase.com) 注册免费账号。

### 2. 创建新项目

1. 点击 "New Project"
2. 填写项目信息：
   ```
   Name: anheyu-blog
   Database Password: [设置强密码]
   Region: 选择最近的区域
   ```
3. 等待项目创建（约 2-3 分钟）

### 3. 获取项目凭证

在项目首页，找到以下信息：

```bash
Project URL: https://xxxxxxxxxxxxx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**重要**：将这些信息保存到项目的 `.env.local` 文件中。

## 数据库初始化

### 方式一：使用 SQL 编辑器（推荐）

1. 登录 Supabase Dashboard
2. 点击左侧菜单 **SQL Editor**
3. 点击 "New query"
4. 复制 `supabase/init.sql` 文件内容
5. 粘贴到编辑器中
6. 点击 "Run" 执行

执行完成后，将创建以下表：

| 表名 | 说明 |
|------|------|
| `roles` | 用户角色表 |
| `users` | 用户表 |
| `categories` | 文章分类表 |
| `tags` | 文章标签表 |
| `posts` | 文章表 |
| `post_tags` | 文章标签关联表 |
| `comments` | 评论表 |
| `media` | 媒体文件表 |
| `flinks` | 友链表 |
| `pages` | 自定义页面表 |
| `settings` | 网站设置表 |
| `albums` | 相册表 |
| `album_categories` | 相册分类表 |
| `music` | 音乐表 |
| `statistics` | 访问统计表 |

### 方式二：使用 Supabase CLI

```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref YOUR_PROJECT_REF

# 推送数据库结构
supabase db push
```

## 存储配置

### 创建存储桶

1. 点击左侧菜单 **Storage**
2. 点击 "New bucket"
3. 填写信息：
   ```
   Name: media
   Public bucket: ✅ 勾选
   ```
4. 点击 "Create bucket"

### 配置存储桶策略

创建存储桶后，设置 RLS 策略以控制访问权限：

```sql
-- 允许所有人读取
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 允许认证用户上传
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- 允许认证用户删除自己的文件
CREATE POLICY "Authenticated Delete Own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 权限配置

Supabase 使用 Row Level Security (RLS) 控制数据访问权限。

### 启用 RLS

```sql
-- 为重要表启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
```

### 创建基础策略

#### 1. 文章访问策略

```sql
-- 公开读取已发布的文章
CREATE POLICY "Public read access to posts"
ON posts FOR SELECT
USING (status = 'published');

-- 管理员可以读取所有文章
CREATE POLICY "Admin full access to posts"
ON posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);
```

#### 2. 评论访问策略

```sql
-- 公开读取已审核的评论
CREATE POLICY "Public read approved comments"
ON comments FOR SELECT
USING (status = 'approved');

-- 认证用户可以创建评论
CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

#### 3. 媒体访问策略

```sql
-- 公开读取所有媒体文件
CREATE POLICY "Public read access to media"
ON media FOR SELECT
USING (true);

-- 认证用户可以上传
CREATE POLICY "Authenticated upload media"
ON media FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

#### 4. 用户访问策略

```sql
-- 公开读取用户基本信息
CREATE POLICY "Public read basic user info"
ON users FOR SELECT
USING (
  status = 'active'
);

-- 用户只能更新自己的信息
CREATE POLICY "Users can update own info"
ON users FOR UPDATE
USING (auth.uid() = id);
```

## API 调用示例

### 初始化客户端

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
```

### 基础 CRUD 操作

#### 读取数据

```typescript
// 获取所有文章
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });

// 获取单篇文章
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', postId)
  .single();

// 关联查询
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    author:author_id(id, username, avatar),
    category:category_id(id, name),
    tags:post_tags(tag:tag_id(id, name))
  `);
```

#### 插入数据

```typescript
// 创建文章
const { data, error } = await supabase
  .from('posts')
  .insert({
    title: '新文章标题',
    content: '文章内容',
    status: 'draft',
    author_id: userId
  })
  .select()
  .single();
```

#### 更新数据

```typescript
// 更新文章
const { data, error } = await supabase
  .from('posts')
  .update({
    title: '更新后的标题',
    status: 'published'
  })
  .eq('id', postId)
  .select()
  .single();
```

#### 删除数据

```typescript
// 删除文章
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

### 分页查询

```typescript
const page = 1;
const pageSize = 10;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### 文件上传

```typescript
// 上传文件到 Storage
const file = document.querySelector('#file-input').files[0];

const { data, error } = await supabase.storage
  .from('media')
  .upload(`uploads/${Date.now()}_${file.name}`, file);

if (error) {
  console.error('上传失败:', error.message);
} else {
  console.log('上传成功:', data.path);
}
```

### 获取公共 URL

```typescript
// 获取文件的公共访问 URL
const { data } = supabase.storage
  .from('media')
  .getPublicUrl('uploads/file.jpg');

console.log(data.publicUrl);
```

### 实时订阅

```typescript
// 订阅评论的实时更新
const subscription = supabase
  .channel('comments_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'comments'
    },
    (payload) => {
      console.log('评论更新:', payload);
    }
  )
  .subscribe();

// 取消订阅
subscription.unsubscribe();
```

## 常见问题

### 1. 如何修改表结构？

使用 Supabase SQL Editor 或 CLI：

```sql
-- 添加新列
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;

-- 修改列
ALTER TABLE posts ALTER COLUMN content TYPE TEXT;

-- 删除列
ALTER TABLE posts DROP COLUMN old_column;
```

### 2. 如何备份数据？

Supabase 自动每天备份数据库。也可以手动导出：

1. 进入 Database → Backups
2. 点击 "New backup"
3. 或使用 CLI：`supabase db dump`

### 3. 如何恢复数据？

1. 进入 Database → Backups
2. 选择要恢复的备份
3. 点击 "Restore"
4. 或使用 CLI：`supabase db restore`

### 4. 如何优化查询性能？

```sql
-- 为常用查询创建索引
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_published ON posts(published_at DESC);

-- 复合索引
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
```

### 5. 如何查看查询日志？

在 Supabase Dashboard 中：

1. 进入 Database → Logs
2. 选择 "Query Logs"
3. 查看查询执行时间和频率

### 6. 如何限制 API 调用频率？

Supabase 免费计划有配额限制。可以在 Dashboard 中查看使用情况：

1. 进入 Settings → API
2. 查看 "Database usage" 和 "API usage"

### 7. 如何使用 Edge Functions？

```bash
# 安装 CLI
npm install -g supabase

# 创建函数
supabase functions new my-function

# 本地开发
supabase functions serve

# 部署
supabase functions deploy my-function
```

### 8. 如何配置自定义域名？

在 EdgeOne 或 Supabase 中配置：

1. 在域名 DNS 设置中添加 CNAME 记录
2. 在 Supabase Dashboard → Settings → Custom domains 中添加域名
3. 验证域名所有权

### 9. 数据库连接超时怎么办？

1. 检查网络连接
2. 确认 Supabase 项目状态为 Active
3. 增加连接池大小
4. 使用连接复用

### 10. 如何迁移现有数据？

```sql
-- 方式一：使用 SQL 导入
-- 在 SQL Editor 中执行 INSERT 语句

-- 方式二：使用 CSV 导入
-- 在 Database → Tables → Import CSV

-- 方式三：使用 pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
psql -h new-db.supabase.co -U postgres -d postgres < backup.sql
```

## 最佳实践

1. **使用 RLS**: 确保敏感数据的安全访问
2. **创建索引**: 优化查询性能
3. **定期备份**: 防止数据丢失
4. **监控使用量**: 避免超出配额
5. **使用连接池**: 减少连接开销
6. **缓存常用查询**: 减少数据库负载

## 资源链接

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)

---

**提示**: 本博客系统已经为您准备好了完整的数据库结构和 API 封装，您可以直接使用 `src/api/supabase/` 中的 API 函数进行开发。
