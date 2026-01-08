/**
 * Supabase 客户端工具类
 * 提供数据库连接和基础操作
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'anheyu-blog'
    }
  }
});

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  ROLES: 'roles',
  POSTS: 'posts',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  POST_TAGS: 'post_tags',
  COMMENTS: 'comments',
  MEDIA: 'media',
  FLINKS: 'flinks',
  PAGES: 'pages',
  SETTINGS: 'settings',
  ALBUMS: 'albums',
  ALBUM_CATEGORIES: 'album_categories',
  MUSIC: 'music',
  STATISTICS: 'statistics'
} as const;

// 通用查询构建器类型
export type QueryBuilder<T = any> = {
  select: (columns?: string) => QueryBuilder<T>;
  where: (column: keyof T, operator: string, value: any) => QueryBuilder<T>;
  order: (column: keyof T, ascending?: boolean) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  range: (from: number, to: number) => QueryBuilder<T>;
  single: () => Promise<T | null>;
  maybeSingle: () => Promise<T | null>;
  then: <U = T>(onfulfilled?: (value: T) => U | PromiseLike<U>) => Promise<U>;
};

// 分页参数接口
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果接口
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 通用分页查询函数
 */
export async function paginatedQuery<T>(
  table: string,
  params: PaginationParams & {
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }
): Promise<PaginationResult<T>> {
  const { page, pageSize, filters, orderBy } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(table).select('*', { count: 'exact' });

  // 应用过滤条件
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
  }

  // 应用排序
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
  }

  // 应用分页
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`查询失败: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

/**
 * 处理 Supabase 错误
 */
export function handleSupabaseError(error: any): never {
  console.error('Supabase Error:', error);

  if (error.code === 'PGRST116') {
    throw new Error('未找到相关记录');
  }

  if (error.code === '23505') {
    throw new Error('记录已存在');
  }

  if (error.code === '23503') {
    throw new Error('关联记录不存在');
  }

  if (error.code === 'PGRST301') {
    throw new Error('权限不足');
  }

  throw new Error(error.message || '操作失败');
}

/**
 * 格式化日期为 ISO 字符串
 */
export function toISOString(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * 创建 UUID (使用 Supabase 的 UUID 生成)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

export default supabase;
