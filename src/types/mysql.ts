/**
 * MySQL 数据库类型定义
 */

export interface Database {
  // 用户表
  users: User;
  // 角色表
  roles: Role;
  // 文章表
  posts: Post;
  // 分类表
  categories: Category;
  // 标签表
  tags: Tag;
  // 文章标签关联表
  post_tags: PostTag;
  // 评论表
  comments: Comment;
  // 媒体文件表
  media: Media;
  // 友链表
  flinks: Flink;
  // 页面表
  pages: Page;
  // 设置表
  settings: Setting;
  // 相册表
  albums: Album;
  // 相册分类表
  album_categories: AlbumCategory;
  // 音乐表
  music: Music;
  // 统计表
  statistics: Statistics;
}

// 基础类型
export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
}

// 用户表
export interface User extends BaseModel {
  username: string;
  email?: string;
  password?: string;
  avatar?: string;
  role_id?: string;
  status: 'active' | 'inactive' | 'banned';
  bio?: string;
  website?: string;
  last_login_at?: string;
}

// 角色表
export interface Role extends BaseModel {
  name: string;
  description?: string;
  permissions: Record<string, any>;
}

// 文章表
export interface Post extends BaseModel {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  content_type: 'markdown' | 'html' | 'text';
  cover_image?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'password';
  password?: string;
  author_id?: string;
  category_id?: string;
  views: number;
  likes: number;
  comments_count: number;
  is_top: boolean;
  is_sticky: boolean;
  is_comment_enabled: boolean;
  published_at?: string;
}

// 分类表
export interface Category extends BaseModel {
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
  sort_order: number;
  post_count: number;
}

// 标签表
export interface Tag extends BaseModel {
  name: string;
  slug: string;
  description?: string;
  post_count: number;
}

// 文章标签关联表
export interface PostTag extends BaseModel {
  post_id: string;
  tag_id: string;
}

// 评论表
export interface Comment extends BaseModel {
  post_id: string;
  parent_id?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
  author_website?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  ip_address?: string;
  user_agent?: string;
}

// 媒体文件表
export interface Media extends BaseModel {
  filename: string;
  original_name?: string;
  mime_type?: string;
  file_size?: number;
  file_path: string;
  file_url?: string;
  storage_type: 'local' | 'oss' | 'cos' | 'supabase';
  uploader_id?: string;
  alt?: string;
  width?: number;
  height?: number;
}

// 友链表
export interface Flink extends BaseModel {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  category: string;
  status: 'active' | 'inactive';
  sort_order: number;
  views: number;
}

// 页面表
export interface Page extends BaseModel {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  status: 'draft' | 'published';
  visibility: 'public' | 'private';
  author_id?: string;
  template: string;
  views: number;
}

// 设置表
export interface Setting extends BaseModel {
  key: string;
  value?: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  group_name: string;
}

// 相册表
export interface Album extends BaseModel {
  title: string;
  description?: string;
  cover_image?: string;
  category_id?: string;
  author_id?: string;
  status: 'active' | 'inactive';
  sort_order: number;
  views: number;
}

// 相册分类表
export interface AlbumCategory extends BaseModel {
  name: string;
  description?: string;
  sort_order: number;
}

// 音乐表
export interface Music extends BaseModel {
  title: string;
  artist?: string;
  album?: string;
  cover_image?: string;
  audio_url: string;
  duration?: number;
  genre?: string;
  status: 'active' | 'inactive';
  play_count: number;
}

// 统计表
export interface Statistics extends BaseModel {
  date: string;
  page_views: number;
  unique_visitors: number;
  referrer?: string;
  user_agent?: string;
}

// 联合查询类型
export interface PostWithTags extends Post {
  tags: Tag[];
  category?: Category;
  author?: User;
}

export interface CommentWithAuthor extends Comment {
  author?: User;
  post?: Post;
  children?: CommentWithAuthor[];
}
