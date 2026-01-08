/**
 * API 类型定义
 */

// 文章类型
export interface Post {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  content_type?: string;
  cover_image?: string;
  status?: string;
  visibility?: string;
  password?: string;
  author_id?: string;
  category_id?: string;
  views?: number;
  likes?: number;
  comments_count?: number;
  is_top?: boolean;
  is_sticky?: boolean;
  is_comment_enabled?: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
  sort_order?: number;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 评论类型
export interface Comment {
  id: string;
  post_id?: string;
  parent_id?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
  author_website?: string;
  content: string;
  status?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
  post?: {
    id: string;
    title: string;
    slug?: string;
  };
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  parent?: {
    id: string;
    author_name?: string;
  };
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  avatar?: string;
  role_id?: string;
  status?: string;
  bio?: string;
  website?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    permissions?: any;
  };
}

// 媒体文件类型
export interface Media {
  id: string;
  filename: string;
  original_name?: string;
  mime_type?: string;
  file_size?: number;
  file_path: string;
  file_url?: string;
  storage_type?: string;
  uploader_id?: string;
  alt?: string;
  width?: number;
  height?: number;
  created_at?: string;
  uploader?: {
    id: string;
    username: string;
  };
}

// 友链类型
export interface Flink {
  id: string;
  name: string;
  url: string;
  description?: string;
  logo?: string;
  category?: string;
  status?: string;
  sort_order?: number;
  views?: number;
  created_at?: string;
  updated_at?: string;
}

// 页面类型
export interface Page {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  status?: string;
  visibility?: string;
  author_id?: string;
  template?: string;
  views?: number;
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    username: string;
  };
}

// 设置类型
export interface Setting {
  id: string;
  key: string;
  value?: string;
  value_type?: string;
  description?: string;
  group_name?: string;
  created_at?: string;
  updated_at?: string;
}

// 相册类型
export interface Album {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  category_id?: string;
  author_id?: string;
  status?: string;
  sort_order?: number;
  views?: number;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    username: string;
  };
}

// 相册分类类型
export interface AlbumCategory {
  id: string;
  name: string;
  description?: string;
  sort_order?: number;
  created_at?: string;
}

// 音乐类型
export interface Music {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  cover_image?: string;
  audio_url: string;
  duration?: number;
  genre?: string;
  status?: string;
  play_count?: number;
  created_at?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
