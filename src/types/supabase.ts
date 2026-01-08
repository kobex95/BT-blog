/**
 * Supabase 数据库类型定义
 * 根据数据库表结构生成 TypeScript 类型
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          email: string | null
          password: string | null
          avatar: string | null
          role_id: string | null
          status: string
          bio: string | null
          website: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email?: string | null
          password?: string | null
          avatar?: string | null
          role_id?: string | null
          status?: string
          bio?: string | null
          website?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string | null
          password?: string | null
          avatar?: string | null
          role_id?: string | null
          status?: string
          bio?: string | null
          website?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          cover_image: string | null
          sort_order: number
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          cover_image?: string | null
          sort_order?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          cover_image?: string | null
          sort_order?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string | null
          excerpt: string | null
          content: string
          content_type: string
          cover_image: string | null
          status: string
          visibility: string
          password: string | null
          author_id: string | null
          category_id: string | null
          views: number
          likes: number
          comments_count: number
          is_top: boolean
          is_sticky: boolean
          is_comment_enabled: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug?: string | null
          excerpt?: string | null
          content: string
          content_type?: string
          cover_image?: string | null
          status?: string
          visibility?: string
          password?: string | null
          author_id?: string | null
          category_id?: string | null
          views?: number
          likes?: number
          comments_count?: number
          is_top?: boolean
          is_sticky?: boolean
          is_comment_enabled?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string | null
          excerpt?: string | null
          content?: string
          content_type?: string
          cover_image?: string | null
          status?: string
          visibility?: string
          password?: string | null
          author_id?: string | null
          category_id?: string | null
          views?: number
          likes?: number
          comments_count?: number
          is_top?: boolean
          is_sticky?: boolean
          is_comment_enabled?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string | null
          parent_id: string | null
          author_id: string | null
          author_name: string | null
          author_email: string | null
          author_avatar: string | null
          author_website: string | null
          content: string
          status: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          parent_id?: string | null
          author_id?: string | null
          author_name?: string | null
          author_email?: string | null
          author_avatar?: string | null
          author_website?: string | null
          content: string
          status?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          parent_id?: string | null
          author_id?: string | null
          author_name?: string | null
          author_email?: string | null
          author_avatar?: string | null
          author_website?: string | null
          content?: string
          status?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          filename: string
          original_name: string | null
          mime_type: string | null
          file_size: number | null
          file_path: string
          file_url: string | null
          storage_type: string
          uploader_id: string | null
          alt: string | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          original_name?: string | null
          mime_type?: string | null
          file_size?: number | null
          file_path: string
          file_url?: string | null
          storage_type?: string
          uploader_id?: string | null
          alt?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          original_name?: string | null
          mime_type?: string | null
          file_size?: number | null
          file_path?: string
          file_url?: string | null
          storage_type?: string
          uploader_id?: string | null
          alt?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
      }
      flinks: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          logo: string | null
          category: string
          status: string
          sort_order: number
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          description?: string | null
          logo?: string | null
          category?: string
          status?: string
          sort_order?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          description?: string | null
          logo?: string | null
          category?: string
          status?: string
          sort_order?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string | null
          content: string | null
          excerpt: string | null
          cover_image: string | null
          status: string
          visibility: string
          author_id: string | null
          template: string
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug?: string | null
          content?: string | null
          excerpt?: string | null
          cover_image?: string | null
          status?: string
          visibility?: string
          author_id?: string | null
          template?: string
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string | null
          content?: string | null
          excerpt?: string | null
          cover_image?: string | null
          status?: string
          visibility?: string
          author_id?: string | null
          template?: string
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string | null
          value_type: string
          description: string | null
          group_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          value_type?: string
          description?: string | null
          group_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          value_type?: string
          description?: string | null
          group_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image: string | null
          category_id: string | null
          author_id: string | null
          status: string
          sort_order: number
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image?: string | null
          category_id?: string | null
          author_id?: string | null
          status?: string
          sort_order?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image?: string | null
          category_id?: string | null
          author_id?: string | null
          status?: string
          sort_order?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      album_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      music: {
        Row: {
          id: string
          title: string
          artist: string | null
          album: string | null
          cover_image: string | null
          audio_url: string
          duration: number | null
          genre: string | null
          status: string
          play_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          artist?: string | null
          album?: string | null
          cover_image?: string | null
          audio_url: string
          duration?: number | null
          genre?: string | null
          status?: string
          play_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist?: string | null
          album?: string | null
          cover_image?: string | null
          audio_url?: string
          duration?: number | null
          genre?: string | null
          status?: string
          play_count?: number
          created_at?: string
        }
      }
      statistics: {
        Row: {
          id: string
          date: string
          page_views: number
          unique_visitors: number
          referrer: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          page_views?: number
          unique_visitors?: number
          referrer?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          page_views?: number
          unique_visitors?: number
          referrer?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}
