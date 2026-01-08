/**
 * 分类管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Category, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取所有分类
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as Category[];
}

/**
 * 获取分类列表（分页）
 */
export async function getCategoriesPaginated(
  params: PaginationParams
): Promise<PaginationResult<Category>> {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
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
 * 根据ID获取分类
 */
export async function getCategoryById(id: string): Promise<Category> {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Category;
}

/**
 * 根据slug获取分类
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data as Category;
}

/**
 * 创建分类
 */
export async function createCategory(category: Partial<Category>): Promise<Category> {
  // 检查slug是否已存在
  if (category.slug) {
    const { data: existing } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .eq('slug', category.slug)
      .single();

    if (existing) {
      throw new Error('分类slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .insert(category)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Category;
}

/**
 * 更新分类
 */
export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  // 检查slug是否与其他分类冲突
  if (category.slug) {
    const { data: existing } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .eq('slug', category.slug)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('分类slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Category;
}

/**
 * 删除分类
 */
export async function deleteCategory(id: string): Promise<void> {
  // 检查是否有关联文章
  const { data: posts } = await supabase
    .from(TABLES.POSTS)
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (posts && posts.length > 0) {
    throw new Error('该分类下还有文章，无法删除');
  }

  const { error } = await supabase
    .from(TABLES.CATEGORIES)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 更新分类文章数量
 */
export async function updateCategoryPostCount(id: string): Promise<void> {
  const { count } = await supabase
    .from(TABLES.POSTS)
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('status', 'published');

  await supabase
    .from(TABLES.CATEGORIES)
    .update({ post_count: count || 0 })
    .eq('id', id);
}
