/**
 * 网站设置 Supabase API
 */
import { supabase, TABLES, handleSupabaseError } from '@/utils/supabase';
import type { Setting } from '@/types/api';

/**
 * 获取所有设置
 */
export async function getSettings(): Promise<Setting[]> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .select('*')
    .order('group_name', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as Setting[];
}

/**
 * 根据组名获取设置
 */
export async function getSettingsByGroup(groupName: string): Promise<Setting[]> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .select('*')
    .eq('group_name', groupName)
    .order('key', { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return data as Setting[];
}

/**
 * 根据key获取设置
 */
export async function getSettingByKey(key: string): Promise<Setting | null> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data as Setting;
}

/**
 * 获取设置值
 */
export async function getSettingValue<T = any>(key: string): Promise<T | null> {
  const setting = await getSettingByKey(key);
  if (!setting) {
    return null;
  }

  // 根据value_type转换类型
  switch (setting.value_type) {
    case 'boolean':
      return setting.value === 'true' as any;
    case 'number':
      return Number(setting.value) as any;
    case 'json':
      return JSON.parse(setting.value || '{}') as any;
    default:
      return setting.value as any;
  }
}

/**
 * 批量获取设置值
 */
export async function getSettingsValues(keys: string[]): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .select('*')
    .in('key', keys);

  if (error) {
    handleSupabaseError(error);
  }

  const result: Record<string, any> = {};

  data?.forEach(setting => {
    switch (setting.value_type) {
      case 'boolean':
        result[setting.key] = setting.value === 'true';
        break;
      case 'number':
        result[setting.key] = Number(setting.value);
        break;
      case 'json':
        result[setting.key] = JSON.parse(setting.value || '{}');
        break;
      default:
        result[setting.key] = setting.value;
    }
  });

  return result;
}

/**
 * 创建或更新设置
 */
export async function upsertSetting(setting: Partial<Setting>): Promise<Setting> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .upsert(setting)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Setting;
}

/**
 * 更新设置
 */
export async function updateSetting(key: string, value: any, valueType?: string): Promise<Setting> {
  const { data, error } = await supabase
    .from(TABLES.SETTINGS)
    .update({
      value: String(value),
      value_type: valueType || typeof value
    })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  return data as Setting;
}

/**
 * 批量更新设置
 */
export async function updateSettings(settings: Record<string, any>): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    value_type: typeof value
  }));

  const { error } = await supabase
    .from(TABLES.SETTINGS)
    .upsert(updates);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 删除设置
 */
export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.SETTINGS)
    .delete()
    .eq('key', key);

  if (error) {
    handleSupabaseError(error);
  }
}

/**
 * 重置设置为默认值
 */
export async function resetSettingsToDefaults(groupName: string): Promise<void> {
  // 获取默认配置
  const defaults = getDefaultSettings();

  // 筛选指定组的设置
  const groupDefaults = defaults.filter(s => s.group_name === groupName);

  // 批量更新
  for (const setting of groupDefaults) {
    await upsertSetting(setting);
  }
}

/**
 * 获取默认设置
 */
function getDefaultSettings(): Partial<Setting>[] {
  return [
    // 基础设置
    { key: 'site_title', value: '安知鱼的博客', value_type: 'string', group_name: 'general', description: '网站标题' },
    { key: 'site_description', value: '一个分享技术与生活的博客', value_type: 'string', group_name: 'general', description: '网站描述' },
    { key: 'site_keywords', value: '博客,技术,Vue,前端', value_type: 'string', group_name: 'general', description: '网站关键词' },
    { key: 'site_logo', value: '', value_type: 'string', group_name: 'general', description: '网站Logo' },
    { key: 'site_favicon', value: '', value_type: 'string', group_name: 'general', description: '网站Favicon' },
    { key: 'site_copyright', value: '© 2024 安知鱼的博客', value_type: 'string', group_name: 'general', description: '版权信息' },
    { key: 'icp_number', value: '', value_type: 'string', group_name: 'general', description: 'ICP备案号' },

    // 分页设置
    { key: 'posts_per_page', value: '10', value_type: 'number', group_name: 'pagination', description: '每页显示文章数' },
    { key: 'comments_per_page', value: '10', value_type: 'number', group_name: 'pagination', description: '每页显示评论数' },

    // 评论设置
    { key: 'comments_enabled', value: 'true', value_type: 'boolean', group_name: 'comment', description: '是否启用评论' },
    { key: 'comment_audit', value: 'true', value_type: 'boolean', group_name: 'comment', description: '评论是否需要审核' },
    { key: 'comment_guest', value: 'true', value_type: 'boolean', group_name: 'comment', description: '是否允许游客评论' },

    // SEO设置
    { key: 'rss_enabled', value: 'true', value_type: 'boolean', group_name: 'seo', description: '是否启用RSS' },
    { key: 'sitemap_enabled', value: 'true', value_type: 'boolean', group_name: 'seo', description: '是否启用站点地图' },
  ];
}

/**
 * 初始化默认设置
 */
export async function initDefaultSettings(): Promise<void> {
  const defaults = getDefaultSettings();

  for (const setting of defaults) {
    // 检查设置是否已存在
    const existing = await getSettingByKey(setting.key!);
    if (!existing) {
      await upsertSetting(setting);
    }
  }
}
