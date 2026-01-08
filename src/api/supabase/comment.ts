/**
 * 评论管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Comment, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取评论列表（分页）
 */
export async function getComments(
  params: PaginationParams & {
    postId?: string;
    status?: string;
    parentId?: string | null;
  }
): Promise<PaginationResult<Comment>> {
  const { page, pageSize, postId, status, parentId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.COMMENTS)
    .select(`
      *,
      post:post_id(id, title, slug),
      author:author_id(id, username, avatar),
      parent:parent_id(id, author_name)
    `, { count: 'exact' });

  // 文章过滤
  if (postId) {
    query = query.eq('post_id', postId);
  }

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 父评论过滤
  if (parentId !== undefined) {
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
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
 * 获取评论详情
 */
export async function getCommentById(id: string): Promise<Comment> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .select(`
      *,
      post:post_id(id, title, slug),
      author:author_id(id, username, avatar)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Comment;
}

/**
 * 获取评论回复列表
 */
export async function getCommentReplies(commentId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .select(`
      *,
      author:author_id(id, username, avatar)
    `)
    .eq('parent_id', commentId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as Comment[];
}

/**
 * 创建评论
 */
export async function createComment(comment: Partial<Comment>): Promise<Comment> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .insert({
      ...comment,
      status: 'pending' // 默认待审核
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  // 更新文章评论数
  if (comment.post_id) {
    await updatePostCommentCount(comment.post_id);
  }

  return data as Comment;
}

/**
 * 更新评论
 */
export async function updateComment(id: string, comment: Partial<Comment>): Promise<Comment> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .update(comment)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  // 如果状态改变，更新文章评论数
  if (comment.status && comment.post_id) {
    await updatePostCommentCount(comment.post_id);
  }

  return data as Comment;
}

/**
 * 删除评论
 */
export async function deleteComment(id: string): Promise<void> {
  // 先获取评论信息
  const { data: comment } = await supabase
    .from(TABLES.COMMENTS)
    .select('post_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }

  // 删除所有子评论
  await supabase
    .from(TABLES.COMMENTS)
    .delete()
    .eq('parent_id', id);

  // 更新文章评论数
  if (comment?.post_id) {
    await updatePostCommentCount(comment.post_id);
  }
}

/**
 * 批量删除评论
 */
export async function deleteComments(ids: string[]): Promise<void> {
  const { data: comments } = await supabase
    .from(TABLES.COMMENTS)
    .select('post_id')
    .in('id', ids);

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }

  // 更新文章评论数
  const postIds = [...new Set(comments?.map(c => c.post_id) || [])];
  for (const postId of postIds) {
    if (postId) {
      await updatePostCommentCount(postId);
    }
  }
}

/**
 * 批量审核评论
 */
export async function approveComments(ids: string[]): Promise<void> {
  const { data: comments } = await supabase
    .from(TABLES.COMMENTS)
    .select('post_id')
    .in('id', ids);

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .update({ status: 'approved' })
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }

  // 更新文章评论数
  const postIds = [...new Set(comments?.map(c => c.post_id) || [])];
  for (const postId of postIds) {
    if (postId) {
      await updatePostCommentCount(postId);
    }
  }
}

/**
 * 批量拒绝评论
 */
export async function rejectComments(ids: string[]): Promise<void> {
  const { data: comments } = await supabase
    .from(TABLES.COMMENTS)
    .select('post_id')
    .in('id', ids);

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .update({ status: 'rejected' })
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }

  // 更新文章评论数
  const postIds = [...new Set(comments?.map(c => c.post_id) || [])];
  for (const postId of postIds) {
    if (postId) {
      await updatePostCommentCount(postId);
    }
  }
}

/**
 * 更新文章评论数
 */
async function updatePostCommentCount(postId: string): Promise<void> {
  const { count } = await supabase
    .from(TABLES.COMMENTS)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('status', 'approved');

  await supabase
    .from(TABLES.POSTS)
    .update({ comments_count: count || 0 })
    .eq('id', postId);
}

/**
 * 获取最新评论
 */
export async function getRecentComments(limit: number = 10): Promise<Comment[]> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .select(`
      *,
      post:post_id(id, title, slug),
      author:author_id(id, username, avatar)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error);
  }

  return data as Comment[];
}
