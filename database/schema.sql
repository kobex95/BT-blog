-- ============================================
-- 博客系统 MySQL 数据库初始化脚本
-- 用于本地 MySQL 数据库（替代 Supabase）
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS anheyu_blog
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE anheyu_blog;

-- ============================================
-- 1. 用户角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认角色
INSERT INTO roles (id, name, description, permissions) VALUES
    (UUID(), 'admin', '超级管理员', '{"all": true}'),
    (UUID(), 'editor', '编辑', '{"post": ["read", "create", "update"], "comment": ["read", "delete"]}'),
    (UUID(), 'user', '普通用户', '{"post": ["read"], "comment": ["read", "create"]}'),
    (UUID(), 'guest', '访客', '{"post": ["read"], "comment": ["read"]}')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    avatar TEXT,
    role_id VARCHAR(36),
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    bio TEXT,
    website TEXT,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    cover_image TEXT,
    sort_order INT DEFAULT 0,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 标签表
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    post_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. 文章表
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    content_type ENUM('markdown', 'html', 'text') DEFAULT 'markdown',
    cover_image TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    visibility ENUM('public', 'private', 'password') DEFAULT 'public',
    password VARCHAR(100),
    author_id VARCHAR(36),
    category_id VARCHAR(36),
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_top BOOLEAN DEFAULT FALSE,
    is_sticky BOOLEAN DEFAULT FALSE,
    is_comment_enabled BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_posts_status (status),
    INDEX idx_posts_author (author_id),
    INDEX idx_posts_category (category_id),
    INDEX idx_posts_published (published_at),
    INDEX idx_posts_slug (slug),
    FULLTEXT INDEX idx_posts_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 文章标签关联表
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_tag (post_id, tag_id),
    INDEX idx_post_tags_post (post_id),
    INDEX idx_post_tags_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36),
    author_id VARCHAR(36),
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    author_avatar TEXT,
    author_website TEXT,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_parent (parent_id),
    INDEX idx_comments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. 媒体文件表
-- ============================================
CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INT,
    file_path TEXT NOT NULL,
    file_url TEXT,
    storage_type ENUM('local', 'oss', 'cos', 'supabase') DEFAULT 'local',
    uploader_id VARCHAR(36),
    alt TEXT,
    width INT,
    height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_media_uploader (uploader_id),
    INDEX idx_media_type (mime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. 友链表
-- ============================================
CREATE TABLE IF NOT EXISTS flinks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    category VARCHAR(50) DEFAULT 'default',
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. 自定义页面表
-- ============================================
CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT,
    excerpt TEXT,
    cover_image TEXT,
    status ENUM('draft', 'published') DEFAULT 'draft',
    visibility ENUM('public', 'private') DEFAULT 'public',
    author_id VARCHAR(36),
    template VARCHAR(50) DEFAULT 'default',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_pages_status (status),
    INDEX idx_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. 相册表
-- ============================================
CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    category_id VARCHAR(36),
    author_id VARCHAR(36),
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES album_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. 相册分类表
-- ============================================
CREATE TABLE IF NOT EXISTS album_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. 音乐表
-- ============================================
CREATE TABLE IF NOT EXISTS music (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    cover_image TEXT,
    audio_url TEXT NOT NULL,
    duration INT,
    genre VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. 网站设置表
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT,
    value_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    group_name VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认设置
INSERT INTO settings (id, `key`, `value`, value_type, description, group_name) VALUES
    (UUID(), 'site_title', '安知鱼的博客', 'string', '网站标题', 'general'),
    (UUID(), 'site_description', '一个分享技术与生活的博客', 'string', '网站描述', 'general'),
    (UUID(), 'site_keywords', '博客,技术,Vue,前端', 'string', '网站关键词', 'general'),
    (UUID(), 'site_logo', '', 'string', '网站Logo', 'general'),
    (UUID(), 'site_favicon', '', 'string', '网站Favicon', 'general'),
    (UUID(), 'posts_per_page', '10', 'number', '每页显示文章数', 'pagination'),
    (UUID(), 'comments_enabled', 'true', 'boolean', '是否启用评论', 'comment'),
    (UUID(), 'comment_audit', 'true', 'boolean', '评论是否需要审核', 'comment'),
    (UUID(), 'rss_enabled', 'true', 'boolean', '是否启用RSS', 'general')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- ============================================
-- 15. 访问统计表
-- ============================================
CREATE TABLE IF NOT EXISTS statistics (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_statistics_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 创建视图：文章详情（包含标签）
-- ============================================
CREATE OR REPLACE VIEW posts_with_tags AS
SELECT
    p.*,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
        )
    ) as tags
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id;

-- ============================================
-- 插入测试管理员用户（密码: admin123，请使用 bcrypt 加密后的密码）
-- ============================================
-- 注意：实际使用时需要使用 bcrypt 加密密码
-- 示例：const bcrypt = require('bcrypt'); const hash = bcrypt.hashSync('admin123', 10);
INSERT INTO users (id, username, email, password, role_id, status, avatar)
SELECT UUID(), 'admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', (SELECT id FROM roles WHERE name = 'admin' LIMIT 1), 'active', '/assets/user.jpg'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- ============================================
-- 创建存储过程：更新文章评论数
-- ============================================
DELIMITER $$

CREATE PROCEDURE update_post_comment_count(IN post_id_param VARCHAR(36))
BEGIN
    UPDATE posts
    SET comments_count = (
        SELECT COUNT(*)
        FROM comments
        WHERE post_id = post_id_param AND status = 'approved'
    )
    WHERE id = post_id_param;
END$$

DELIMITER ;

-- ============================================
-- 创建触发器：评论数量自动更新
-- ============================================
DELIMITER $$

CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' THEN
        CALL update_post_comment_count(NEW.post_id);
    END IF;
END$$

CREATE TRIGGER after_comment_update
AFTER UPDATE ON comments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        IF NEW.status = 'approved' THEN
            CALL update_post_comment_count(NEW.post_id);
        ELSEIF OLD.status = 'approved' THEN
            CALL update_post_comment_count(NEW.post_id);
        END IF;
    END IF;
END$$

CREATE TRIGGER after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    IF OLD.status = 'approved' THEN
        CALL update_post_comment_count(OLD.post_id);
    END IF;
END$$

DELIMITER ;
