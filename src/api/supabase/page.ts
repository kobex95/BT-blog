/**
 * 页面管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Page, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取页面列表（分页）
 */
export async function getPages(
  params: PaginationParams & {
    status?: string;
    authorId?: string;
  }
): Promise<PaginationResult<Page>> {
  const { page, pageSize, status, authorId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.PAGES)
    .select(`
      *,
      author:author_id(id, username)
    `, { count: 'exact' });

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 作者过滤
  if (authorId) {
    query = query.eq('author_id', authorId);
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
 * 根据ID获取页面
 */
export async function getPageById(id: string): Promise<Page> {
  const { data, error } = await supabase
    .from(TABLES.PAGES)
    .select(`
      *,
      author:author_id(id, username)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Page;
}

/**
 * 根据slug获取页面
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const { data, error } = await supabase
    .from(TABLES.PAGES)
    .select(`
      *,
      author:author_id(id, username)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data as Page;
}

/**
 * 创建页面
 */
export async function createPage(page: Partial<Page>): Promise<Page> {
  // 检查slug是否已存在
  if (page.slug) {
    const { data: existing } = await supabase
      .from(TABLES.PAGES)
      .select('id')
      .eq('slug', page.slug)
      .single();

    if (existing) {
      throw new Error('页面slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.PAGES)
    .insert(page)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Page;
}

/**
 * 更新页面
 */
export async function updatePage(id: string, page: Partial<Page>): Promise<Page> {
  // 检查slug是否与其他页面冲突
  if (page.slug) {
    const { data: existing } = await supabase
      .from(TABLES.PAGES)
      .select('id')
      .eq('slug', page.slug)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('页面slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.PAGES)
    .update(page)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Page;
}

/**
 * 删除页面
 */
export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.PAGES)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除页面
 */
export async function deletePages(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.PAGES)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 增加页面浏览量
 */
export async function incrementPageViews(id: string): Promise<void> {
  await supabase.rpc('increment_page_views', { page_id: id });
}
