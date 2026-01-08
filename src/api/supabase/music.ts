/**
 * 音乐管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Music, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取音乐列表（分页）
 */
export async function getMusic(
  params: PaginationParams & {
    status?: string;
    genre?: string;
    keyword?: string;
  }
): Promise<PaginationResult<Music>> {
  const { page, pageSize, status, genre, keyword } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.MUSIC)
    .select('*', { count: 'exact' });

  // 状态过滤
  if (status) {
    query = query.eq('status', status);
  }

  // 类型过滤
  if (genre) {
    query = query.eq('genre', genre);
  }

  // 关键词搜索
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,artist.ilike.%${keyword}%,album.ilike.%${keyword}%`);
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
 * 获取所有音乐
 */
export async function getAllMusic(status?: string): Promise<Music[]> {
  let query = supabase
    .from(TABLES.MUSIC)
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error);
  }

  return data as Music[];
}

/**
 * 根据ID获取音乐
 */
export async function getMusicById(id: string): Promise<Music> {
  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Music;
}

/**
 * 创建音乐
 */
export async function createMusic(music: Partial<Music>): Promise<Music> {
  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .insert(music)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Music;
}

/**
 * 更新音乐
 */
export async function updateMusic(id: string, music: Partial<Music>): Promise<Music> {
  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .update(music)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Music;
}

/**
 * 删除音乐
 */
export async function deleteMusic(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.MUSIC)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除音乐
 */
export async function deleteMusicList(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from(TABLES.MUSIC)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 增加音乐播放次数
 */
export async function incrementMusicPlayCount(id: string): Promise<void> {
  await supabase.rpc('increment_music_play_count', { music_id: id });
}

/**
 * 获取音乐类型列表
 */
export async function getMusicGenres(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .select('genre')
    .not('genre', 'is', null);

  if (error) {
    handleSupabaseError(error);
  }

  // 去重并返回类型列表
  const genres = [...new Set(data?.map(m => m.genre) || [])];
  return genres;
}

/**
 * 搜索音乐
 */
export async function searchMusic(keyword: string, limit: number = 20): Promise<Music[]> {
  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .select('*')
    .or(`title.ilike.%${keyword}%,artist.ilike.%${keyword}%,album.ilike.%${keyword}%`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error);
  }

  return data as Music[];
}
