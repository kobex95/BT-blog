/**
 * 统计数据 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';

/**
 * 记录页面访问
 */
export async function recordPageView(
  date: Date,
  referrer: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  const dateStr = date.toISOString().split('T')[0];

  // 检查当日记录是否存在
  const { data: existing } = await supabase
    .from(TABLES.STATISTICS)
    .select('id, page_views, unique_visitors')
    .eq('date', dateStr)
    .single();

  if (existing) {
    // 更新现有记录
    await supabase
      .from(TABLES.STATISTICS)
      .update({
        page_views: existing.page_views + 1,
        referrer: referrer || existing.referrer,
        user_agent: userAgent || existing.user_agent
      })
      .eq('id', existing.id);
  } else {
    // 创建新记录
    await supabase
      .from(TABLES.STATISTICS)
      .insert({
        date: dateStr,
        page_views: 1,
        unique_visitors: 1,
        referrer,
        user_agent: userAgent
      });
  }
}

/**
 * 获取访问统计（按日期范围）
 */
export async function getStatisticsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: string;
  page_views: number;
  unique_visitors: number;
}>> {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(TABLES.STATISTICS)
    .select('date, page_views, unique_visitors')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data || [];
}

/**
 * 获取总访问量
 */
export async function getTotalViews(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLES.STATISTICS)
    .select('page_views');

  if (error) {
    handleSupabaseError(error);
  }

  return data?.reduce((sum, stat) => sum + stat.page_views, 0) || 0;
}

/**
 * 获取总访客数
 */
export async function getTotalVisitors(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLES.STATISTICS)
    .select('unique_visitors');

  if (error) {
    handleSupabaseError(error);
  }

  return data?.reduce((sum, stat) => sum + stat.unique_visitors, 0) || 0;
}

/**
 * 获取今日访问量
 */
export async function getTodayViews(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(TABLES.STATISTICS)
    .select('page_views')
    .eq('date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return 0;
    }
    handleSupabaseError(error);
  }

  return data?.page_views || 0;
}

/**
 * 获取最近N天的访问统计
 */
export async function getRecentStatistics(days: number = 30): Promise<Array<{
  date: string;
  page_views: number;
  unique_visitors: number;
}>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getStatisticsByDateRange(startDate, endDate);
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStatistics(): Promise<{
  totalPosts: number;
  totalComments: number;
  totalViews: number;
  totalUsers: number;
  todayViews: number;
  publishedPosts: number;
  pendingComments: number;
}> {
  // 获取文章总数
  const { count: totalPosts } = await supabase
    .from(TABLES.POSTS)
    .select('*', { count: 'exact', head: true });

  // 获取已发布文章数
  const { count: publishedPosts } = await supabase
    .from(TABLES.POSTS)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // 获取评论总数
  const { count: totalComments } = await supabase
    .from(TABLES.COMMENTS)
    .select('*', { count: 'exact', head: true });

  // 获取待审核评论数
  const { count: pendingComments } = await supabase
    .from(TABLES.COMMENTS)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 获取用户总数
  const { count: totalUsers } = await supabase
    .from(TABLES.USERS)
    .select('*', { count: 'exact', head: true });

  // 获取总访问量和今日访问量
  const totalViews = await getTotalViews();
  const todayViews = await getTodayViews();

  return {
    totalPosts: totalPosts || 0,
    totalComments: totalComments || 0,
    totalViews,
    totalUsers: totalUsers || 0,
    todayViews,
    publishedPosts: publishedPosts || 0,
    pendingComments: pendingComments || 0
  };
}

/**
 * 获取热门文章（按浏览量）
 */
export async function getTopPosts(limit: number = 10): Promise<Array<{
  id: string;
  title: string;
  views: number;
  comments_count: number;
}>> {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select('id, title, views, comments_count')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error);
  }

  return data || [];
}

/**
 * 获取活跃用户（按文章数）
 */
export async function getActiveUsers(limit: number = 10): Promise<Array<{
  id: string;
  username: string;
  post_count: number;
}>> {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select('author_id(id, username)')
    .eq('status', 'published');

  if (error) {
    handleSupabaseError(error);
  }

  // 统计每个用户的文章数
  const userStats = new Map<string, { id: string; username: string; count: number }>();

  data?.forEach(post => {
    const author = post.author_id as any;
    if (author) {
      const key = author.id;
      const existing = userStats.get(key);
      if (existing) {
        existing.count++;
      } else {
        userStats.set(key, {
          id: author.id,
          username: author.username,
          count: 1
        });
      }
    }
  });

  // 排序并返回前N个
  return Array.from(userStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ id, username, count }) => ({
      id,
      username,
      post_count: count
    }));
}
