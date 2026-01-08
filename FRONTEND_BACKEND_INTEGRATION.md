# 前后端对接文档

本文档详细说明前后端 API 对接方案，支持传统后端和 Supabase 后端的无缝切换。

## 📋 目录

- [架构设计](#架构设计)
- [环境配置](#环境配置)
- [API 调用方式](#api-调用方式)
- [数据转换](#数据转换)
- [切换后端](#切换后端)
- [最佳实践](#最佳实践)

## 架构设计

### 支持的后端类型

本系统支持两种后端：

1. **传统后端** (VUE-Pure-Admin 原生)
   - 使用 Axios 发送 HTTP 请求
   - 支持本地服务器代理
   - 适用于有独立后端服务的情况

2. **Supabase 后端** (新增)
   - 使用 Supabase 客户端直接访问数据库
   - 支持实时数据同步
   - 适用于 Serverless 架构

### 统一 HTTP 客户端

系统提供了一个统一的 HTTP 客户端，自动选择合适的后端：

```typescript
// src/utils/http/index.ts
export const http = new PureHttp();
```

## 环境配置

### 1. 环境变量配置

在 `.env.local` 中添加以下配置：

```env
# 后端类型选择: local | supabase
VITE_BACKEND_TYPE=local

# Supabase 配置（使用 Supabase 时需要）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 传统后端配置（使用传统后端时需要）
VITE_API_URL=http://localhost:8091
```

### 2. Vite 代理配置

根据选择的后端类型，配置 `vite.config.ts`：

#### 传统后端模式

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8091", // 传统后端地址
      changeOrigin: true
    }
  }
}
```

#### Supabase 后端模式

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: import.meta.env.VITE_SUPABASE_URL,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/rest/v1')
    }
  }
}
```

## API 调用方式

### 统一调用格式

无论使用哪种后端，API 调用方式保持一致：

```typescript
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// GET 请求
const { data } = await http.get(baseUrlApi("articles"), {
  params: { page: 1, pageSize: 10 }
});

// POST 请求
const { data } = await http.post(baseUrlApi("articles"), {
  title: "新文章",
  content: "文章内容"
});

// PUT 请求
const { data } = await http.put(baseUrlApi("articles"), {
  id: "article-id",
  title: "更新后的标题"
});

// DELETE 请求
await http.delete(baseUrlApi("articles"), {
  data: { id: "article-id" }
});
```

### 文章管理示例

#### 获取文章列表

```typescript
// src/api/post/index.ts
export const getArticleList = (params: GetArticleListParams) => {
  return http.request<ArticleListResponse>(
    "get",
    baseUrlApi("articles"),
    { params }
  );
};
```

#### 创建文章

```typescript
export const createArticle = (data: ArticleForm) => {
  return http.request<Article>(
    "post",
    baseUrlApi("articles"),
    { data }
  );
};
```

### 评论管理示例

```typescript
// src/api/comment/index.ts
export const getComments = (params: any) => {
  return http.get(baseUrlApi("comments"), {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status
    }
  });
};
```

## 数据转换

### 响应格式统一

无论使用哪种后端，响应格式都统一为：

```typescript
{
  success: true,      // 请求是否成功
  message: "操作成功", // 消息提示
  data: {},           // 实际数据
  code: "200"         // 状态码
}
```

### 传统后端响应

```json
{
  "code": 200,
  "data": {
    "list": [...],
    "total": 100
  },
  "msg": "success"
}
```

### Supabase 响应转换

```typescript
// Supabase 原始响应
{
  "data": [...],
  "error": null,
  "count": 100
}

// 自动转换为统一格式
{
  "success": true,
  "message": "操作成功",
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  },
  "code": "200"
}
```

## 切换后端

### 从传统后端切换到 Supabase

#### 1. 修改环境变量

```env
# .env.local
VITE_BACKEND_TYPE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2. 初始化数据库

```bash
# 在 Supabase SQL Editor 中执行 supabase/init.sql
```

#### 3. 无需修改代码

API 调用代码无需修改，HTTP 客户端会自动选择 Supabase 后端。

### 从 Supabase 切换到传统后端

#### 1. 修改环境变量

```env
# .env.local
VITE_BACKEND_TYPE=local
VITE_API_URL=http://localhost:8091
```

#### 2. 启动后端服务

```bash
# 启动您的后端服务
npm run server
```

#### 3. 无需修改代码

API 调用代码无需修改，HTTP 客户端会自动选择传统后端。

## 最佳实践

### 1. API 定义规范

```typescript
// ✅ 推荐：使用统一格式
export const getArticleList = (params: GetArticleListParams) => {
  return http.get(baseUrlApi("articles"), { params });
};

// ❌ 避免：直接调用 axios 或 supabase
export const getArticleListBad = (params: any) => {
  return axios.get('/api/articles', { params });
};
```

### 2. 类型定义

```typescript
// 定义请求参数类型
export interface GetArticleListParams {
  page: number;
  pageSize: number;
  status?: string;
  keyword?: string;
}

// 定义响应数据类型
export interface ArticleListResponse {
  data: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 3. 错误处理

```typescript
// ✅ 推荐：使用 try-catch
try {
  const { data } = await http.get(baseUrlApi("articles"));
  // 处理数据
} catch (error) {
  // 错误已被拦截器处理，可以直接显示
  console.error('获取文章列表失败:', error);
}

// ✅ 推荐：使用 async/await
export const loadData = async () => {
  try {
    const { data } = await http.get(baseUrlApi("articles"));
    return data;
  } catch (error) {
    showError(error.message);
    return null;
  }
};
```

### 4. 分页处理

```typescript
// 统一分页参数
const paginationParams = {
  page: 1,
  pageSize: 10,
  status: 'published'
};

// 调用 API
const { data } = await http.get(baseUrlApi("articles"), {
  params: paginationParams
});

// 使用响应数据
const { data: articles, total, totalPages } = data;
```

### 5. 文件上传

```typescript
// 传统后端
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return http.post(baseUrlApi("upload"), formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Supabase 后端
import { uploadMedia } from '@/api/supabase/media';

export const uploadFileSupabase = async (file: File) => {
  return uploadMedia(file);
};
```

## 混合使用

### 同时使用两种后端

某些场景下，可以同时使用两种后端：

```typescript
// 根据功能选择不同的后端

// 用户认证使用传统后端
export const login = (username: string, password: string) => {
  return http.post('/api/auth/login', { username, password });
};

// 文章数据使用 Supabase
export const getArticles = (params: any) => {
  return http.get('/api/supabase/articles', { params });
};

// 评论使用传统后端
export const getComments = (params: any) => {
  return http.get('/api/comments', { params });
};
```

### 自定义路由规则

在 `src/utils/http/index.ts` 中修改 `useSupabase` 方法：

```typescript
private useSupabase(url: string): boolean {
  // 明确指定使用 Supabase 的路由
  const supabaseRoutes = [
    '/api/supabase/articles',
    '/api/supabase/categories',
    '/api/supabase/tags'
  ];

  return supabaseRoutes.some(route => url.startsWith(route));
}
```

## 调试技巧

### 1. 查看请求日志

在浏览器控制台中查看网络请求：

```
Chrome DevTools → Network → Filter by "api"
```

### 2. 查看 Supabase 查询

在 Supabase Dashboard 中查看查询日志：

```
Supabase Dashboard → Database → Logs → Query Logs
```

### 3. 使用开发工具

安装 Vue DevTools 和 Supabase CLI 进行调试。

## 性能优化

### 1. 请求缓存

```typescript
// 使用缓存减少重复请求
import { useCache } from '@/composables/useCache';

const { getCachedData } = useCache();

export const getArticleList = async (params: any) => {
  const cacheKey = `articles_${JSON.stringify(params)}`;
  return getCachedData(cacheKey, () =>
    http.get(baseUrlApi("articles"), { params })
  );
};
```

### 2. 请求防抖

```typescript
// 使用 lodash.debounce
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((keyword: string) => {
  http.get(baseUrlApi("articles"), {
    params: { keyword }
  });
}, 300);
```

### 3. 批量请求

```typescript
// 使用 Promise.all 并行请求
const [articles, categories] = await Promise.all([
  http.get(baseUrlApi("articles")),
  http.get(baseUrlApi("categories"))
]);
```

## 常见问题

### 1. 如何处理跨域？

**传统后端**：
- 在 `vite.config.ts` 中配置代理
- 后端启用 CORS

**Supabase 后端**：
- Supabase 自动处理 CORS
- 无需额外配置

### 2. 如何处理认证？

两种后端都使用统一的 token 管理：

```typescript
// Token 自动添加到请求头
headers: {
  Authorization: formatToken(userStore.getToken)
}
```

### 3. 如何处理大文件上传？

**传统后端**：
- 使用分片上传
- 配置超时时间

**Supabase 后端**：
- 直接上传到 Storage
- 自动处理大文件

### 4. 如何实现实时功能？

Supabase 原生支持实时订阅：

```typescript
import { supabase } from '@/utils/supabase';

// 订阅文章更新
const subscription = supabase
  .channel('articles_channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    console.log('文章更新:', payload);
  })
  .subscribe();
```

## 迁移指南

### 从传统后端迁移到 Supabase

1. **初始化 Supabase 数据库**
   ```bash
   # 执行 supabase/init.sql
   ```

2. **数据迁移**
   ```sql
   -- 从传统数据库导出数据
   -- 导入到 Supabase
   ```

3. **修改环境变量**
   ```env
   VITE_BACKEND_TYPE=supabase
   ```

4. **测试验证**
   - 测试所有 API 接口
   - 验证数据一致性
   - 检查权限设置

### 从 Supabase 迁移到传统后端

1. **导出数据**
   ```bash
   supabase db dump -f backup.sql
   ```

2. **导入到传统数据库**
   ```bash
   psql -U user -d database < backup.sql
   ```

3. **修改环境变量**
   ```env
   VITE_BACKEND_TYPE=local
   ```

4. **实现后端 API**
   - 按照现有 API 规范实现
   - 保持响应格式一致

## 总结

本系统提供了灵活的前后端对接方案：

- ✅ 统一的 API 调用接口
- ✅ 自动后端选择
- ✅ 无缝切换后端
- ✅ 统一响应格式
- ✅ 完整的错误处理
- ✅ 类型安全支持

无论您使用传统后端还是 Supabase，都可以用相同的代码调用 API，实现真正的后端无关化开发！
