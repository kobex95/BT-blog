# API 快速参考

本文档提供所有 API 接口的快速参考。

## 📋 目录

- [统一 HTTP 客户端](#统一-http-客户端)
- [文章 API](#文章-api)
- [分类 API](#分类-api)
- [标签 API](#标签-api)
- [评论 API](#评论-api)
- [用户 API](#用户-api)
- [媒体 API](#媒体-api)
- [友链 API](#友链-api)
- [页面 API](#页面-api)
- [相册 API](#相册-api)
- [音乐 API](#音乐-api)
- [设置 API](#设置-api)
- [统计 API](#统计-api)

## 统一 HTTP 客户端

### 基础用法

```typescript
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// GET 请求
http.get(url, { params })

// POST 请求
http.post(url, data, config)

// PUT 请求
http.put(url, data, config)

// DELETE 请求
http.delete(url, config)

// PATCH 请求
http.patch(url, data, config)

// 通用请求
http.request(method, url, config)
```

### 请求配置

```typescript
{
  params: {},        // 查询参数
  data: {},          // 请求体数据
  headers: {},       // 自定义请求头
  timeout: 60000,    // 超时时间
  pagination: false  // 禁用分页转换
}
```

### 响应格式

```typescript
{
  success: boolean,   // 是否成功
  message: string,    // 消息
  data: any,         // 数据
  code: string       // 状态码
}
```

## 文章 API

### 获取文章列表

```typescript
import { getArticleList } from '@/api/post';

const params = {
  page: 1,
  pageSize: 10,
  status: 'published',  // 'draft' | 'published' | 'private'
  categoryId: 'xxx',
  keyword: '搜索词'
};

const { data } = await getArticleList(params);
```

### 获取文章详情

```typescript
const { data } = await http.get(baseUrlApi('articles/:id'));
// 或
import { getArticleById } from '@/api/supabase/post';
const article = await getArticleById(articleId);
```

### 创建文章

```typescript
const articleData = {
  title: '文章标题',
  content: '文章内容',
  content_type: 'markdown',
  excerpt: '摘要',
  cover_image: '封面图URL',
  status: 'draft',
  category_id: '分类ID',
  tags: [{ id: '标签ID' }],
  is_top: false,
  is_sticky: false,
  is_comment_enabled: true
};

const { data } = await http.post(baseUrlApi('articles'), articleData);
```

### 更新文章

```typescript
const updateData = {
  id: '文章ID',
  title: '新标题',
  content: '新内容',
  status: 'published'
};

const { data } = await http.put(baseUrlApi('articles'), updateData);
```

### 删除文章

```typescript
// 删除单个
await http.delete(baseUrlApi('articles'), {
  data: { id: '文章ID' }
});

// 批量删除
await http.delete(baseUrlApi('articles'), {
  data: { ids: ['ID1', 'ID2'] }
});
```

### 获取相关文章

```typescript
import { getRelatedPosts } from '@/api/supabase/post';

const related = await getRelatedPosts(articleId, categoryId, 5);
```

### 增加浏览量

```typescript
import { incrementPostViews } from '@/api/supabase/post';

await incrementPostViews(articleId);
```

## 分类 API

### 获取所有分类

```typescript
import { getCategories } from '@/api/supabase/category';

const categories = await getCategories();
```

### 创建分类

```typescript
const categoryData = {
  name: '分类名称',
  slug: '分类slug',
  description: '分类描述',
  cover_image: '封面图URL',
  sort_order: 0
};

const category = await createCategory(categoryData);
```

### 更新分类

```typescript
await updateCategory(categoryId, {
  name: '新名称',
  sort_order: 1
});
```

### 删除分类

```typescript
await deleteCategory(categoryId);
```

## 标签 API

### 获取所有标签

```typescript
import { getTags } from '@/api/supabase/tag';

const tags = await getTags();
```

### 创建标签

```typescript
const tagData = {
  name: '标签名称',
  slug: '标签slug',
  description: '标签描述'
};

const tag = await createTag(tagData);
```

### 搜索标签

```typescript
const tags = await searchTags('关键词');
```

### 删除标签

```typescript
await deleteTag(tagId);
```

## 评论 API

### 获取评论列表

```typescript
import { getComments } from '@/api/supabase/comment';

const { data } = await getComments({
  page: 1,
  pageSize: 10,
  status: 'approved',  // 'pending' | 'approved' | 'rejected'
  postId: '文章ID'
});
```

### 创建评论

```typescript
const commentData = {
  post_id: '文章ID',
  parent_id: '父评论ID', // 可选
  author_name: '评论者名称',
  author_email: '评论者邮箱',
  content: '评论内容'
};

const comment = await createComment(commentData);
```

### 批量审核

```typescript
// 批量通过
await approveComments(['ID1', 'ID2']);

// 批量拒绝
await rejectComments(['ID1', 'ID2']);
```

### 删除评论

```typescript
await deleteComment(commentId);
```

### 获取最新评论

```typescript
const recentComments = await getRecentComments(10);
```

## 用户 API

### 获取用户列表

```typescript
import { getUsers } from '@/api/supabase/user';

const { data } = await getUsers({
  page: 1,
  pageSize: 10,
  status: 'active',
  roleId: '角色ID',
  keyword: '搜索词'
});
```

### 获取用户详情

```typescript
const user = await getUserById(userId);
```

### 创建用户

```typescript
const userData = {
  username: '用户名',
  email: '邮箱',
  password: '密码（加密后）',
  role_id: '角色ID',
  bio: '个人简介',
  website: '个人网站'
};

const user = await createUser(userData);
```

### 更新用户

```typescript
await updateUser(userId, {
  username: '新用户名',
  bio: '新简介'
});
```

### 更改用户状态

```typescript
await updateUserStatus(userId, 'active'); // 'active' | 'disabled'
```

### 重置密码

```typescript
await resetUserPassword(userId, '新密码');
```

## 媒体 API

### 获取媒体列表

```typescript
import { getMedia } from '@/api/supabase/media';

const { data } = await getMedia({
  page: 1,
  pageSize: 20,
  mimeType: 'image', // 'image' | 'video' | 'application'
  keyword: '搜索词'
});
```

### 上传文件

```typescript
import { uploadMedia } from '@/api/supabase/media';

const file = document.querySelector('#file-input').files[0];
const media = await uploadMedia(file, uploaderId, {
  alt: '图片描述',
  width: 1920,
  height: 1080
});
```

### 删除媒体

```typescript
await deleteMedia(mediaId);
```

### 搜索媒体

```typescript
const media = await searchMedia('关键词', 20);
```

## 友链 API

### 获取友链列表

```typescript
import { getFlinks } from '@/api/supabase/flink';

const { data } = await getFlinks({
  page: 1,
  pageSize: 20,
  status: 'active',
  category: '技术'
});
```

### 创建友链

```typescript
const flinkData = {
  name: '网站名称',
  url: 'https://example.com',
  description: '网站描述',
  logo: 'Logo URL',
  category: '技术',
  status: 'active',
  sort_order: 0
};

const flink = await createFlink(flinkData);
```

### 更新友链

```typescript
await updateFlink(flinkId, {
  name: '新名称',
  status: 'inactive'
});
```

### 删除友链

```typescript
await deleteFlink(flinkId);
```

### 获取友链分类

```typescript
const categories = await getFlinkCategories();
```

## 页面 API

### 获取页面列表

```typescript
import { getPages } from '@/api/supabase/page';

const { data } = await getPages({
  page: 1,
  pageSize: 10,
  status: 'published'
});
```

### 创建页面

```typescript
const pageData = {
  title: '页面标题',
  slug: '页面slug',
  content: '页面内容',
  excerpt: '页面摘要',
  cover_image: '封面图',
  status: 'published',
  template: 'default'
};

const page = await createPage(pageData);
```

### 获取页面（根据slug）

```typescript
const page = await getPageBySlug('about');
```

### 更新页面

```typescript
await updatePage(pageId, {
  title: '新标题',
  content: '新内容'
});
```

### 删除页面

```typescript
await deletePage(pageId);
```

## 相册 API

### 获取相册列表

```typescript
import { getAlbums } from '@/api/supabase/album';

const { data } = await getAlbums({
  page: 1,
  pageSize: 10,
  status: 'active',
  categoryId: '分类ID'
});
```

### 创建相册

```typescript
const albumData = {
  title: '相册标题',
  description: '相册描述',
  cover_image: '封面图',
  category_id: '分类ID',
  status: 'active',
  sort_order: 0
};

const album = await createAlbum(albumData);
```

### 获取相册分类

```typescript
const categories = await getAlbumCategories();
```

### 创建相册分类

```typescript
const categoryData = {
  name: '分类名称',
  description: '分类描述',
  sort_order: 0
};

const category = await createAlbumCategory(categoryData);
```

## 音乐 API

### 获取音乐列表

```typescript
import { getMusic } from '@/api/supabase/music';

const { data } = await getMusic({
  page: 1,
  pageSize: 20,
  status: 'active',
  genre: '流行',
  keyword: '搜索词'
});
```

### 创建音乐

```typescript
const musicData = {
  title: '音乐标题',
  artist: '艺术家',
  album: '专辑',
  cover_image: '封面图',
  audio_url: '音频URL',
  duration: 240, // 秒
  genre: '流行',
  status: 'active'
};

const music = await createMusic(musicData);
```

### 搜索音乐

```typescript
const music = await searchMusic('关键词', 20);
```

### 增加播放次数

```typescript
await incrementMusicPlayCount(musicId);
```

## 设置 API

### 获取所有设置

```typescript
import { getSettings } from '@/api/supabase/settings';

const settings = await getSettings();
```

### 获取设置值

```typescript
import { getSettingValue } from '@/api/supabase/settings';

const siteTitle = await getSettingValue<string>('site_title');
const commentsEnabled = await getSettingValue<boolean>('comments_enabled');
```

### 更新设置

```typescript
await updateSetting('site_title', '新标题');

// 批量更新
await updateSettings({
  site_title: '新标题',
  site_description: '新描述'
});
```

### 初始化默认设置

```typescript
await initDefaultSettings();
```

## 统计 API

### 获取仪表盘统计

```typescript
import { getDashboardStatistics } from '@/api/supabase/statistics';

const stats = await getDashboardStatistics();
// {
//   totalPosts: number,
//   totalComments: number,
//   totalViews: number,
//   totalUsers: number,
//   todayViews: number,
//   publishedPosts: number,
//   pendingComments: number
// }
```

### 记录页面访问

```typescript
import { recordPageView } from '@/api/supabase/statistics';

await recordPageView(new Date(), referrer, userAgent);
```

### 获取访问统计（按日期范围）

```typescript
const statistics = await getStatisticsByDateRange(
  startDate,
  endDate
);
```

### 获取热门文章

```typescript
const topPosts = await getTopPosts(10);
```

### 获取活跃用户

```typescript
const activeUsers = await getActiveUsers(10);
```

## 错误处理

### 统一错误处理

```typescript
try {
  const { data } = await http.get(baseUrlApi('articles'));
  // 处理数据
} catch (error) {
  // 错误已被拦截器处理
  console.error('请求失败:', error.message);
}
```

### 错误类型

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权，需要登录
- `403 Forbidden`: 无权限访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

## 数据类型

### 文章类型

```typescript
interface Article {
  id: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'private';
  author_id?: string;
  category_id?: string;
  tags?: Tag[];
  views: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}
```

### 分类类型

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
  post_count: number;
  created_at: string;
}
```

### 标签类型

```typescript
interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  post_count: number;
}
```

### 评论类型

```typescript
interface Comment {
  id: string;
  post_id?: string;
  parent_id?: string;
  author_name?: string;
  author_email?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
```

## 使用示例

### 完整的 CRUD 示例

```typescript
import { http } from '@/utils/http';
import { baseUrlApi } from '@/utils/http/config';

// 文章 CRUD
export class ArticleService {
  // 创建
  static async create(data: any) {
    return http.post(baseUrlApi('articles'), data);
  }

  // 读取
  static async get(id: string) {
    return http.get(baseUrlApi(`articles/${id}`));
  }

  static async getList(params: any) {
    return http.get(baseUrlApi('articles'), { params });
  }

  // 更新
  static async update(id: string, data: any) {
    return http.put(baseUrlApi('articles'), { id, ...data });
  }

  // 删除
  static async delete(id: string) {
    return http.delete(baseUrlApi('articles'), { data: { id } });
  }
}

// 使用
await ArticleService.create({
  title: '新文章',
  content: '内容'
});

await ArticleService.getList({ page: 1, pageSize: 10 });
```

## 更多信息

- [前后端对接文档](./FRONTEND_BACKEND_INTEGRATION.md)
- [Supabase 教程](./SUPABASE_TUTORIAL.md)
- [部署文档](./DEPLOYMENT.md)
