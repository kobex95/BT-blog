/**
 * Supabase HTTP 适配器
 * 用于统一 Supabase API 调用和现有的 HTTP 请求接口
 */

import { supabase } from '@/utils/supabase';

/**
 * 将 Supabase 查询结果转换为标准响应格式
 */
function transformSupabaseResponse<T>(data: T | null, error: any) {
  if (error) {
    return {
      success: false,
      message: error.message || '操作失败',
      data: null,
      code: error.code || 'ERROR'
    };
  }

  return {
    success: true,
    message: '操作成功',
    data,
    code: '200'
  };
}

/**
 * Supabase HTTP 适配器类
 */
class SupabaseHttpAdapter {
  /**
   * GET 请求
   */
  async get<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const params = config?.params || {};

    let query = supabase.from(tableName).select('*');

    // 处理查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'page' || key === 'pageSize') return;

      if (key === 'eq') {
        Object.entries(value as any).forEach(([k, v]) => {
          query = query.eq(k, v);
        });
      } else if (key === 'neq') {
        Object.entries(value as any).forEach(([k, v]) => {
          query = query.neq(k, v);
        });
      } else if (key === 'like') {
        Object.entries(value as any).forEach(([k, v]) => {
          query = query.ilike(k, `%${v}%`);
        });
      } else if (key === 'in') {
        Object.entries(value as any).forEach(([k, v]) => {
          query = query.in(k, v);
        });
      } else {
        query = query.eq(key, value);
      }
    });

    // 处理分页
    const { page = 1, pageSize = 10 } = params as any;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (config?.pagination !== false) {
      query = query.range(from, to);
    }

    // 处理排序
    if (config?.order) {
      const { column, ascending = false } = config.order;
      query = query.order(column, { ascending });
    }

    const { data, error, count } = await query;

    return transformSupabaseResponse<T>(
      config?.pagination !== false
        ? {
            data: data || [],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize)
          }
        : data,
      error
    );
  }

  /**
   * POST 请求（创建）
   */
  async post<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const data = config?.data || config;

    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    return transformSupabaseResponse<T>(result, error);
  }

  /**
   * PUT 请求（更新）
   */
  async put<T>(url: string, config?: any) {
    const { id, ...data } = config?.data || config;
    const tableName = this.extractTableName(url);

    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    return transformSupabaseResponse<T>(result, error);
  }

  /**
   * PATCH 请求（部分更新）
   */
  async patch<T>(url: string, config?: any) {
    const { id, ...data } = config?.data || config;
    const tableName = this.extractTableName(url);

    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    return transformSupabaseResponse<T>(result, error);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const params = config?.params || {};
    const data = config?.data || config;

    let query = supabase.from(tableName).delete();

    if (data?.id) {
      query = query.eq('id', data.id);
    }

    if (data?.ids && Array.isArray(data.ids)) {
      query = query.in('id', data.ids);
    }

    const { error } = await query;

    return transformSupabaseResponse<T>(null, error);
  }

  /**
   * 从 URL 提取表名
   */
  private extractTableName(url: string): string {
    // 移除 /api 前缀
    let cleanUrl = url.replace(/^\/api\//, '');

    // 移除查询参数
    cleanUrl = cleanUrl.split('?')[0];

    // 移除末尾斜杠和 ID
    cleanUrl = cleanUrl.replace(/\/\d+$/, '').replace(/\/$/, '');

    // 转换为复数形式（Supabase 表名约定）
    const singularToPlural: Record<string, string> = {
      article: 'posts',
      category: 'categories',
      tag: 'tags',
      comment: 'comments',
      user: 'users',
      media: 'media',
      flink: 'flinks',
      page: 'pages',
      setting: 'settings',
      album: 'albums',
      'album-category': 'album_categories',
      music: 'music',
      statistics: 'statistics'
    };

    // 如果是单数形式，转换为复数
    const singularKey = cleanUrl.replace(/s$/, '');
    return singularToPlural[cleanUrl] || singularToPlural[singularKey] || cleanUrl;
  }

  /**
   * 通用请求方法
   */
  async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    config?: any
  ): Promise<T> {
    switch (method) {
      case 'get':
        return this.get<T>(url, config);
      case 'post':
        return this.post<T>(url, config);
      case 'put':
        return this.put<T>(url, config);
      case 'patch':
        return this.patch<T>(url, config);
      case 'delete':
        return this.delete<T>(url, config);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
}

// 创建单例
export const supabaseHttp = new SupabaseHttpAdapter();
