/**
 * HTTP 请求统一入口
 * 根据环境变量自动选择数据库类型（本地 MySQL 或 Supabase）
 */

import { databaseHttp } from './database';
import { supabaseHttp } from './supabase';

// 数据库类型
type DatabaseType = 'local' | 'supabase';

// 获取当前数据库类型
const dbType = (import.meta.env.VITE_DB_TYPE || 'supabase') as DatabaseType;

// 根据数据库类型选择适配器
export const db = dbType === 'local' ? databaseHttp : supabaseHttp;

// 导出当前数据库类型
export const currentDbType = dbType;

// 导出适配器实例
export { databaseHttp, supabaseHttp };
