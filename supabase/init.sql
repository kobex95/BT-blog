-- ============================================
-- 博客系统 Supabase 数据库初始化脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', '超级管理员', '{"all": true}'),
    ('editor', '编辑', '{"post": ["read", "create", "update"], "comment": ["read", "delete"]}'),
    ('user', '普通用户', '{"post": ["read"], "comment": ["read", "create"]}'),
    ('guest', '访客', '{"post": ["read"], "comment": ["read"]}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    avatar TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL DEFAULT (SELECT id FROM roles WHERE name = 'user'),
    status VARCHAR(20) DEFAULT 'active',
    bio TEXT,
    website TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- 3. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    cover_image TEXT,
    sort_order INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 标签表
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 文章表
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'markdown',
    cover_image TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    password VARCHAR(100),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_top BOOLEAN DEFAULT FALSE,
    is_sticky BOOLEAN DEFAULT FALSE,
    is_comment_enabled BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- ============================================
-- 6. 文章标签关联表
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

-- ============================================
-- 7. 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    author_avatar TEXT,
    author_website TEXT,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- ============================================
-- 8. 媒体文件表
-- ============================================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    file_path TEXT NOT NULL,
    file_url TEXT,
    storage_type VARCHAR(20) DEFAULT 'local',
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    alt TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(mime_type);

-- ============================================
-- 9. 友链表
-- ============================================
CREATE TABLE IF NOT EXISTS flinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    category VARCHAR(50) DEFAULT 'default',
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. 自定义页面表
-- ============================================
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content TEXT,
    excerpt TEXT,
    cover_image TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    template VARCHAR(50) DEFAULT 'default',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ============================================
-- 11. 相册表
-- ============================================
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    category_id UUID REFERENCES album_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. 相册分类表
-- ============================================
CREATE TABLE IF NOT EXISTS album_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. 音乐表
-- ============================================
CREATE TABLE IF NOT EXISTS music (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    cover_image TEXT,
    audio_url TEXT NOT NULL,
    duration INTEGER,
    genre VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. 网站设置表
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    group_name VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认设置
INSERT INTO settings (key, value, value_type, description, group_name) VALUES
    ('site_title', '安知鱼的博客', 'string', '网站标题', 'general'),
    ('site_description', '一个分享技术与生活的博客', 'string', '网站描述', 'general'),
    ('site_keywords', '博客,技术,Vue,前端', 'string', '网站关键词', 'general'),
    ('site_logo', '', 'string', '网站Logo', 'general'),
    ('site_favicon', '', 'string', '网站Favicon', 'general'),
    ('posts_per_page', '10', 'number', '每页显示文章数', 'pagination'),
    ('comments_enabled', 'true', 'boolean', '是否启用评论', 'comment'),
    ('comment_audit', 'true', 'boolean', '评论是否需要审核', 'comment'),
    ('rss_enabled', 'true', 'boolean', '是否启用RSS', 'general')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 15. 访问统计表
-- ============================================
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- ============================================
-- 创建更新时间戳触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加自动更新updated_at的触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flinks_updated_at BEFORE UPDATE ON flinks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 创建视图：文章详情（包含标签）
-- ============================================
CREATE OR REPLACE VIEW posts_with_tags AS
SELECT 
    p.*,
    COALESCE(json_agg(
        json_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
        ) ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id;

-- ============================================
-- 创建视图：文章统计
-- ============================================
CREATE OR REPLACE VIEW posts_stats AS
SELECT 
    c.name as category_name,
    COUNT(*) as post_count
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'published'
GROUP BY c.name
ORDER BY post_count DESC;

-- ============================================
-- 插入测试管理员用户（密码: admin123，实际使用时请修改）
-- ============================================
INSERT INTO users (username, email, password, role_id, status, avatar) VALUES
    ('admin', 'admin@example.com', '$2b$10$abcdefghijklmnopqrstuv', (SELECT id FROM roles WHERE name = 'admin'), 'active', '/assets/user.jpg')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Row Level Security (RLS) 配置
-- ============================================
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- 创建策略示例（根据实际需求调整）
-- 公开读取策略
CREATE POLICY "Public read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Public read access to posts" ON posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public read access to comments" ON comments
    FOR SELECT USING (status = 'approved');

-- 管理员完全访问策略（需要根据实际认证方式调整）
-- CREATE POLICY "Admin full access to posts" ON posts
--     ALL USING (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.id = auth.uid()
--             AND users.role_id = (SELECT id FROM roles WHERE name = 'admin')
--         )
--     );
