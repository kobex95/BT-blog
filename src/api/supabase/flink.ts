/**
 * 友链管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Flink, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取友链列表（分页）
 */
export async function getFlinks(
  params: PaginationParams & {
    status?: string;
    category?: string;
  }
): Promise<PaginationResult<Flink>> {
  const { page, pageSize, status, category } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.FLINKS)
    .select('*', { count: 'exact' });

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 分类过滤
  if (category) {
    query = query.eq('category', category);
  }

  // 排序
  query = query.order('sort_order', { ascending: true })
             .order('created_at', { ascending: false });

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
 * 获取所有友链
 */
export async function getAllFlinks(status?: string): Promise<Flink[]> {
  let query = supabase
    .from(TABLES.FLINKS)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error);
  }

  return data as Flink[];
}

/**
 * 根据ID获取友链
 */
export async function getFlinkById(id: string): Promise<Flink> {
  const { data, error } = await supabase
    .from(TABLES.FLINKS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Flink;
}

/**
 * 创建友链
 */
export async function createFlink(flink: Partial<Flink>): Promise<Flink> {
  const { data, error } = await supabase
    .from(TABLES.FLINKS)
    .insert(flink)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Flink;
}

/**
 * 更新友链
 */
export async function updateFlink(id: string, flink: Partial<Flink>): Promise<Flink> {
  const { data, error } = await supabase
    .from(TABLES.FLINKS)
    .update(flink)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Flink;
}

/**
 * 删除友链
 */
export async function deleteFlink(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.FLINKS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除友链
 */
export async function deleteFlinks(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.FLINKS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 增加友链浏览量
 */
export async function incrementFlinkViews(id: string): Promise<void> {
  await supabase.rpc('increment_flink_views', { flink_id: id });
}

/**
 * 获取友链分类列表
 */
export async function getFlinkCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLES.FLINKS)
    .select('category')
    .not('category', 'is', null);

  if (error) {
    handleSupabaseError(error);
  }

  // 去重并返回分类列表
  const categories = [...new Set(data?.map(f => f.category) || [])];
  return categories;
}
