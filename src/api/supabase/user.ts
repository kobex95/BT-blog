/**
 * 用户管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { User, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取用户列表（分页）
 */
export async function getUsers(
  params: PaginationParams & {
    status?: string;
    roleId?: string;
    keyword?: string;
  }
): Promise<PaginationResult<User>> {
  const { page, pageSize, status, roleId, keyword } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.USERS)
    .select(`
      *,
      role:role_id(id, name, description, permissions)
    `, { count: 'exact' });

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 角色过滤
  if (roleId) {
    query = query.eq('role_id', roleId);
  }

  // 关键词搜索
  if (keyword) {
    query = query.or(`username.ilike.%${keyword}%,email.ilike.%${keyword}%`);
  }

  // 排序
  query = query.order('created_at', { ascending: false });

  // 分页
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    handleSupabaseError(error);
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
 * 根据ID获取用户
 */
export async function getUserById(id: string): Promise<User> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select(`
      *,
      role:role_id(id, name, description, permissions)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as User;
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data as User;
}

/**
 * 创建用户
 */
export async function createUser(user: Partial<User>): Promise<User> {
  // 检查用户名是否已存在
  if (user.username) {
    const { data: existing } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', user.username)
      .single();

    if (existing) {
      throw new Error('用户名已存在');
    }
  }

  // 检查邮箱是否已存在
  if (user.email) {
    const { data: existing } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('email', user.email)
      .single();

    if (existing) {
      throw new Error('邮箱已被使用');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .insert(user)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as User;
}

/**
 * 更新用户
 */
export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  // 检查用户名是否与其他用户冲突
  if (user.username) {
    const { data: existing } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', user.username)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('用户名已存在');
    }
  }

  // 检查邮箱是否与其他用户冲突
  if (user.email) {
    const { data: existing } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('email', user.email)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('邮箱已被使用');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .update(user)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as User;
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.USERS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除用户
 */
export async function deleteUsers(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.USERS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 更新用户登录时间
 */
export async function updateUserLoginTime(id: string): Promise<void> {
  await supabase
    .from(TABLES.USERS)
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id);
}

/**
 * 更改用户状态
 */
export async function updateUserStatus(id: string, status: string): Promise<void> {
  await supabase
    .from(TABLES.USERS)
    .update({ status })
    .eq('id', id);
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await supabase
    .from(TABLES.USERS)
    .update({ password: newPassword })
    .eq('id', id);
}
