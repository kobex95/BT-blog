/**
 * 相册管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Album, AlbumCategory, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取相册列表（分页）
 */
export async function getAlbums(
  params: PaginationParams & {
    status?: string;
    categoryId?: string;
    authorId?: string;
  }
): Promise<PaginationResult<Album>> {
  const { page, pageSize, status, categoryId, authorId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.ALBUMS)
    .select(`
      *,
      category:category_id(id, name),
      author:author_id(id, username)
    `, { count: 'exact' });

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 分类过滤
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // 作者过滤
  if (authorId) {
    query = query.eq('author_id', authorId);
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
 * 获取所有相册
 */
export async function getAllAlbums(status?: string): Promise<Album[]> {
  let query = supabase
    .from(TABLES.ALBUMS)
    .select(`
      *,
      category:category_id(id, name)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error);
  }

  return data as Album[];
}

/**
 * 根据ID获取相册
 */
export async function getAlbumById(id: string): Promise<Album> {
  const { data, error } = await supabase
    .from(TABLES.ALBUMS)
    .select(`
      *,
      category:category_id(id, name),
      author:author_id(id, username)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Album;
}

/**
 * 创建相册
 */
export async function createAlbum(album: Partial<Album>): Promise<Album> {
  const { data, error } = await supabase
    .from(TABLES.ALBUMS)
    .insert(album)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Album;
}

/**
 * 更新相册
 */
export async function updateAlbum(id: string, album: Partial<Album>): Promise<Album> {
  const { data, error } = await supabase
    .from(TABLES.ALBUMS)
    .update(album)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Album;
}

/**
 * 删除相册
 */
export async function deleteAlbum(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.ALBUMS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除相册
 */
export async function deleteAlbums(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.ALBUMS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 增加相册浏览量
 */
export async function incrementAlbumViews(id: string): Promise<void> {
  await supabase.rpc('increment_album_views', { album_id: id });
}

/**
 * 获取相册分类列表
 */
export async function getAlbumCategories(): Promise<AlbumCategory[]> {
  const { data, error } = await supabase
    .from(TABLES.ALBUM_CATEGORIES)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as AlbumCategory[];
}

/**
 * 创建相册分类
 */
export async function createAlbumCategory(category: Partial<AlbumCategory>): Promise<AlbumCategory> {
  const { data, error } = await supabase
    .from(TABLES.ALBUM_CATEGORIES)
    .insert(category)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as AlbumCategory;
}

/**
 * 更新相册分类
 */
export async function updateAlbumCategory(id: string, category: Partial<AlbumCategory>): Promise<AlbumCategory> {
  const { data, error } = await supabase
    .from(TABLES.ALBUM_CATEGORIES)
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as AlbumCategory;
}

/**
 * 删除相册分类
 */
export async function deleteAlbumCategory(id: string): Promise<void> {
  // 检查是否有关联相册
  const { data: albums } = await supabase
    .from(TABLES.ALBUMS)
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (albums && albums.length > 0) {
    throw new Error('该分类下还有相册，无法删除');
  }

  const { error } = await supabase
    .from(TABLES.ALBUM_CATEGORIES)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}
