/**
 * 本地数据库客户端（MySQL）
 * 用于替代 Supabase，连接本地 MySQL 数据库
 */
import mysql from 'mysql2/promise';
import type { Database } from '@/types/mysql';

// 数据库配置
const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: Number(import.meta.env.VITE_DB_PORT) || 3306,
  user: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  database: import.meta.env.VITE_DB_NAME || 'anheyu_blog',
  charset: 'utf8mb4',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

/**
 * 执行 SQL 查询
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error: any) {
    console.error('Database Query Error:', error);
    throw new Error(`数据库查询失败: ${error.message}`);
  }
}

/**
 * 执行 SQL 查询（单条记录）
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * 执行插入操作
 */
export async function insert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const results = await query<any>(sql, values);

  return results.insertId as T;
}

/**
 * 执行更新操作
 */
export async function update(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<number> {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  const params = [...Object.values(data), ...Object.values(where)];

  const results = await query<any>(sql, params);
  return results.affectedRows;
}

/**
 * 执行删除操作
 */
export async function remove(
  table: string,
  where: Record<string, any>
): Promise<number> {
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const params = Object.values(where);

  const results = await query<any>(sql, params);
  return results.affectedRows;
}

/**
 * 分页查询
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function paginatedQuery<T>(
  table: string,
  params: PaginationParams & {
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }
): Promise<PaginationResult<T>> {
  const { page, pageSize, filters, orderBy } = params;
  const offset = (page - 1) * pageSize;

  // 构建查询条件
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          conditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
          queryParams.push(...value);
        } else {
          conditions.push(`${key} = ?`);
          queryParams.push(value);
        }
      }
    });
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
  const countResult = await query<{ total: number }>(countSql, queryParams);
  const total = countResult[0]?.total || 0;

  // 查询数据
  const orderClause = orderBy
    ? `ORDER BY ${orderBy.column} ${orderBy.ascending ? 'ASC' : 'DESC'}`
    : '';

  const dataSql = `SELECT * FROM ${table} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
  const data = await query<T>(dataSql, [...queryParams, pageSize, offset]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * 事务执行
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 处理数据库错误
 */
export function handleDatabaseError(error: any): never {
  console.error('Database Error:', error);

  if (error.code === 'ER_DUP_ENTRY') {
    throw new Error('记录已存在');
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new Error('关联记录不存在');
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new Error('该记录被其他记录引用，无法删除');
  }

  throw new Error(error.message || '数据库操作失败');
}

/**
 * 转换 Supabase 风格的查询为 MySQL 查询
 */
export function transformSupabaseQuery(
  table: string,
  select: string = '*',
  filters?: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean },
  limit?: number,
  offset?: number
): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && value?.ilike) {
          conditions.push(`${key} LIKE ?`);
          params.push(`%${value.ilike}%`);
        } else if (Array.isArray(value)) {
          conditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
          params.push(...value);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    });
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = orderBy
    ? `ORDER BY ${orderBy.column} ${orderBy.ascending ? 'ASC' : 'DESC'}`
    : '';
  const limitClause = limit ? `LIMIT ?` : '';
  const offsetClause = offset !== undefined ? `OFFSET ?` : '';

  const sql = `SELECT ${select} FROM ${table} ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;

  return { sql, params: limit && offset !== undefined ? [...params, limit, offset] : params };
}

/**
 * 生成 UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

export default pool;
