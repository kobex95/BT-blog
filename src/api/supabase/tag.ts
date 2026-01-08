/**
 * 标签管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Tag, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取所有标签
 */
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .select('*')
    .order('post_count', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as Tag[];
}

/**
 * 获取标签列表（分页）
 */
export async function getTagsPaginated(
  params: PaginationParams
): Promise<PaginationResult<Tag>> {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from(TABLES.TAGS)
    .select('*', { count: 'exact' })
    .order('post_count', { ascending: false })
    .range(from, to);

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
 * 根据ID获取标签
 */
export async function getTagById(id: string): Promise<Tag> {
  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Tag;
}

/**
 * 根据slug获取标签
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data as Tag;
}

/**
 * 创建标签
 */
export async function createTag(tag: Partial<Tag>): Promise<Tag> {
  // 检查slug是否已存在
  if (tag.slug) {
    const { data: existing } = await supabase
      .from(TABLES.TAGS)
      .select('id')
      .eq('slug', tag.slug)
      .single();

    if (existing) {
      throw new Error('标签slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .insert(tag)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Tag;
}

/**
 * 更新标签
 */
export async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
  // 检查slug是否与其他标签冲突
  if (tag.slug) {
    const { data: existing } = await supabase
      .from(TABLES.TAGS)
      .select('id')
      .eq('slug', tag.slug)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('标签slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .update(tag)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Tag;
}

/**
 * 删除标签
 */
export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.TAGS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除标签
 */
export async function deleteTags(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.TAGS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 搜索标签
 */
export async function searchTags(keyword: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from(TABLES.TAGS)
    .select('*')
    .ilike('name', `%${keyword}%`)
    .order('post_count', { ascending: false })
    .limit(10);

  if (error) {
    handleSupabaseError(error);
  }

  return data as Tag[];
}
