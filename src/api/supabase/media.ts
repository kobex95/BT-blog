/**
 * 媒体文件管理 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Media, PaginationParams, PaginationResult } from '@/types/api';

/**
 * 获取媒体文件列表（分页）
 */
export async function getMedia(
  params: PaginationParams & {
    mimeType?: string;
    uploaderId?: string;
    keyword?: string;
  }
): Promise<PaginationResult<Media>> {
  const { page, pageSize, mimeType, uploaderId, keyword } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.MEDIA)
    .select(`
      *,
      uploader:uploader_id(id, username)
    `, { count: 'exact' });

  // MIME类型过滤
  if (mimeType) {
    query = query.ilike('mime_type', `${mimeType}%`);
  }

  // 上传者过滤
  if (uploaderId) {
    query = query.eq('uploader_id', uploaderId);
  }

  // 关键词搜索
  if (keyword) {
    query = query.ilike('original_name', `%${keyword}%`);
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
 * 根据ID获取媒体文件
 */
export async function getMediaById(id: string): Promise<Media> {
  const { data, error } = await supabase
    .from(TABLES.MEDIA)
    .select(`
      *,
      uploader:uploader_id(id, username)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Media;
}

/**
 * 上传文件
 */
export async function uploadMedia(
  file: File,
  uploaderId?: string,
  metadata?: {
    alt?: string;
    width?: number;
    height?: number;
  }
): Promise<Media> {
  // 生成唯一文件名
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

  // 上传到 Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('media')
    .upload(filename, file);

  if (uploadError) {
    throw new Error(`文件上传失败: ${uploadError.message}`);
  }

  // 获取公共URL
  const { data: publicUrlData } = supabase.storage
    .from('media')
    .getPublicUrl(filename);

  // 保存文件信息到数据库
  const mediaInfo: Partial<Media> = {
    filename,
    original_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    file_path: filename,
    file_url: publicUrlData.publicUrl,
    storage_type: 'supabase',
    uploader_id: uploaderId,
    alt: metadata?.alt,
    width: metadata?.width,
    height: metadata?.height
  };

  const { data, error } = await supabase
    .from(TABLES.MEDIA)
    .insert(mediaInfo)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Media;
}

/**
 * 删除媒体文件
 */
export async function deleteMedia(id: string): Promise<void> {
  // 先获取文件信息
  const { data: media } = await supabase
    .from(TABLES.MEDIA)
    .select('file_path')
    .eq('id', id)
    .single();

  if (media?.file_path) {
    // 删除 Storage 中的文件
    await supabase.storage
      .from('media')
      .remove([media.file_path]);
  }

  // 删除数据库记录
  const { error } = await supabase
    .from(TABLES.MEDIA)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 批量删除媒体文件
 */
export async function deleteMediaList(ids: string[]): Promise<void> {
  // 获取所有文件路径
  const { data: mediaList } = await supabase
    .from(TABLES.MEDIA)
    .select('file_path')
    .in('id', ids);

  // 删除 Storage 中的文件
  if (mediaList && mediaList.length > 0) {
    const filePaths = mediaList.map(m => m.file_path).filter(Boolean) as string[];
    await supabase.storage
      .from('media')
      .remove(filePaths);
  }

  // 删除数据库记录
  const { error } = await supabase
    .from(TABLES.MEDIA)
    .delete()
    .in('id', ids);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 获取图片列表
 */
export async function getImages(params: PaginationParams): Promise<PaginationResult<Media>> {
  return getMedia({
    ...params,
    mimeType: 'image'
  });
}

/**
 * 获取视频列表
 */
export async function getVideos(params: PaginationParams): Promise<PaginationResult<Media>> {
  return getMedia({
    ...params,
    mimeType: 'video'
  });
}

/**
 * 搜索媒体文件
 */
export async function searchMedia(keyword: string, limit: number = 20): Promise<Media[]> {
  const { data, error } = await supabase
    .from(TABLES.MEDIA)
    .select('*')
    .ilike('original_name', `%${keyword}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error);
  }

  return data as Media[];
}
