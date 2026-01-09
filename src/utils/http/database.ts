/**
 * 本地数据库 HTTP 适配器
 * 用于统一本地数据库 API 调用和现有的 HTTP 请求接口
 */

import {
  query,
  queryOne,
  insert,
  update,
  remove,
  paginatedQuery,
  handleDatabaseError,
  transformSupabaseQuery
} from '@/utils/database';

/**
 * 将数据库查询结果转换为标准响应格式
 */
function transformDatabaseResponse<T>(data: T | null, error?: any) {
  if (error) {
    return {
      success: false,
      message: error.message || '操作失败',
      data: null,
      code: 'ERROR'
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
 * 数据库 HTTP 适配器类
 */
class DatabaseHttpAdapter {
  /**
   * GET 请求
   */
  async get<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const params = config?.params || {};

    try {
      // 处理分页查询
      if (params.page && params.pageSize) {
        const filters = this.extractFilters(params);
        const orderBy = params.orderBy
          ? { column: params.orderBy, ascending: params.ascending ?? false }
          : undefined;

        const result = await paginatedQuery<T>(tableName, {
          page: params.page,
          pageSize: params.pageSize,
          filters,
          orderBy
        });

        return transformDatabaseResponse(result);
      }

      // 处理单条记录查询
      if (params.id) {
        const result = await queryOne<T>(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [params.id]
        );
        return transformDatabaseResponse(result);
      }

      // 处理列表查询
      const { sql, params: queryParams } = transformSupabaseQuery(
        tableName,
        '*',
        this.extractFilters(params),
        params.orderBy ? { column: params.orderBy, ascending: params.ascending ?? false } : undefined,
        params.limit,
        params.offset
      );

      const result = await query<T>(sql, queryParams);
      return transformDatabaseResponse(result);
    } catch (error) {
      handleDatabaseError(error);
      return transformDatabaseResponse(null, error);
    }
  }

  /**
   * POST 请求（创建）
   */
  async post<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const data = config?.data || config;

    try {
      // 生成 ID
      const id = crypto.randomUUID();
      const insertData = { ...data, id, created_at: new Date(), updated_at: new Date() };

      const resultId = await insert(tableName, insertData);

      // 返回插入的记录
      const result = await queryOne<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [resultId]);

      return transformDatabaseResponse(result);
    } catch (error) {
      handleDatabaseError(error);
      return transformDatabaseResponse(null, error);
    }
  }

  /**
   * PUT 请求（更新）
   */
  async put<T>(url: string, config?: any) {
    const { id, ...data } = config?.data || config;
    const tableName = this.extractTableName(url);

    try {
      const updateData = { ...data, updated_at: new Date() };

      await update(tableName, updateData, { id });

      // 返回更新后的记录
      const result = await queryOne<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);

      return transformDatabaseResponse(result);
    } catch (error) {
      handleDatabaseError(error);
      return transformDatabaseResponse(null, error);
    }
  }

  /**
   * PATCH 请求（部分更新）
   */
  async patch<T>(url: string, config?: any) {
    const { id, ...data } = config?.data || config;
    const tableName = this.extractTableName(url);

    try {
      const updateData = { ...data, updated_at: new Date() };

      await update(tableName, updateData, { id });

      // 返回更新后的记录
      const result = await queryOne<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);

      return transformDatabaseResponse(result);
    } catch (error) {
      handleDatabaseError(error);
      return transformDatabaseResponse(null, error);
    }
  }

  /**
   * DELETE 请求
   */
  async delete<T>(url: string, config?: any) {
    const tableName = this.extractTableName(url);
    const params = config?.params || {};
    const data = config?.data || config;

    try {
      let affectedRows = 0;

      if (data?.id) {
        affectedRows = await remove(tableName, { id: data.id });
      } else if (data?.ids && Array.isArray(data.ids)) {
        // 批量删除
        for (const id of data.ids) {
          affectedRows += await remove(tableName, { id });
        }
      }

      return transformDatabaseResponse({ affectedRows } as T);
    } catch (error) {
      handleDatabaseError(error);
      return transformDatabaseResponse(null, error);
    }
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

    // 转换为复数形式（数据库表名约定）
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
   * 提取过滤条件
   */
  private extractFilters(params: any): Record<string, any> {
    const filters: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (
        key !== 'page' &&
        key !== 'pageSize' &&
        key !== 'orderBy' &&
        key !== 'ascending' &&
        key !== 'limit' &&
        key !== 'offset' &&
        key !== 'id' &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        filters[key] = value;
      }
    });

    return filters;
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
export const databaseHttp = new DatabaseHttpAdapter();
