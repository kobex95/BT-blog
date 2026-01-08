/**
 * 文章管理 Supabase API
 */
import { supabase, TABLES, paginatedQuery, handleSupabaseError } from '@/utils/supabase';
import type { Post, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取文章列表（分页）
 */
export async function getPosts(
  params: PaginationParams & {
    status?: string;
    categoryId?: string;
    authorId?: string;
    keyword?: string;
    isTop?: boolean;
  }
): Promise<PaginationResult<Post>> {
  const { page, pageSize, status, categoryId, authorId, keyword, isTop } = params;

  let query = supabase
    .from(TABLES.POSTS)
    .select(`
      *,
      author:author_id(id, username, avatar),
      category:category_id(id, name, slug)
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

  // 置顶过滤
  if (isTop !== undefined) {
    query = query.eq('is_top', isTop);
  }

  // 关键词搜索
  if (keyword) {
    query = query.ilike('title', `%${keyword}%`);
  }

  // 排序：置顶优先，然后按发布时间倒序
  query = query.order('is_top', { ascending: false })
             .order('published_at', { ascending: false, nullsFirst: false })
             .order('created_at', { ascending: false });

  // 分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
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
 * 根据ID获取文章详情
 */
export async function getPostById(id: string): Promise<Post> {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select(`
      *,
      author:author_id(id, username, avatar),
      category:category_id(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  // 获取文章标签
  const { data: tags } = await supabase
    .from(TABLES.POST_TAGS)
    .select('tag:tag_id(id, name, slug)')
    .eq('post_id', id);

  return {
    ...data,
    tags: tags?.map(t => t.tag) || []
  } as Post;
}

/**
 * 根据slug获取文章
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select(`
      *,
      author:author_id(id, username, avatar),
      category:category_id(id, name, slug)
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

  return data as Post;
}

/**
 * 创建文章
 */
export async function createPost(post: Partial<Post>): Promise<Post> {
  // 检查slug是否已存在
  if (post.slug) {
    const { data: existing } = await supabase
      .from(TABLES.POSTS)
      .select('id')
      .eq('slug', post.slug)
      .single();

    if (existing) {
      throw new Error('文章slug已存在');
    }
  }

  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .insert({
      ...post,
      published_at: post.status === 'published' ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  // 如果有标签，关联标签
  if (post.tags && post.tags.length > 0) {
    await updatePostTags(data.id, post.tags.map(t => t.id));
  }

  return data as Post;
}

/**
 * 更新文章
 */
export async function updatePost(id: string, post: Partial<Post>): Promise<Post> {
  // 检查slug是否与其他文章冲突
  if (post.slug) {
    const { data: existing } = await supabase
      .from(TABLES.POSTS)
      .select('id')
      .eq('slug', post.slug)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('文章slug已存在');
    }
  }

  const updateData: any = { ...post };

  // 如果状态改为发布且之前未发布，设置发布时间
  if (post.status === 'published' && !post.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  // 更新标签
  if (post.tags) {
    await updatePostTags(id, post.tags.map(t => t.id));
  }

  return data as Post;
}

/**
 * 删除文章
 */
export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.POSTS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除文章
 */
export async function deletePosts(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.POSTS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 更新文章标签
 */
async function updatePostTags(postId: string, tagIds: string[]): Promise<void> {
  // 删除现有标签关联
  await supabase
    .from(TABLES.POST_TAGS)
    .delete()
    .eq('post_id', postId);

  // 添加新标签关联
  if (tagIds.length > 0) {
    const tagRelations = tagIds.map(tagId => ({
      post_id: postId,
      tag_id: tagId
    }));

    await supabase
      .from(TABLES.POST_TAGS)
      .insert(tagRelations);
  }

  // 更新标签的文章计数
  for (const tagId of tagIds) {
    await updateTagPostCount(tagId);
  }
}

/**
 * 更新标签文章计数
 */
async function updateTagPostCount(tagId: string): Promise<void> {
  const { count } = await supabase
    .from(TABLES.POST_TAGS)
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', tagId);

  await supabase
    .from(TABLES.TAGS)
    .update({ post_count: count || 0 })
    .eq('id', tagId);
}

/**
 * 增加文章浏览量
 */
export async function incrementPostViews(id: string): Promise<void> {
  await supabase.rpc('increment_post_views', { post_id: id });
}

/**
 * 获取相关文章
 */
export async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  limit: number = 5
): Promise<Post[]> {
  let query = supabase
    .from(TABLES.POSTS)
    .select('id, title, slug, excerpt, cover_image, published_at')
    .eq('status', 'published')
    .neq('id', postId)
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  query = query.order('published_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error);
  }

  return data as Post[];
}

/**
 * 获取归档文章（按年月分组）
 */
export async function getArchives(): Promise<{ year: number; month: number; count: number }[]> {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select('published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    handleSupabaseError(error);
  }

  // 按年月分组统计
  const archives: Map<string, number> = new Map();

  data?.forEach(post => {
    if (post.published_at) {
      const date = new Date(post.published_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      archives.set(key, (archives.get(key) || 0) + 1);
    }
  });

  return Array.from(archives.entries()).map(([key, count]) => {
    const [year, month] = key.split('-').map(Number);
    return { year, month, count };
  });
}
