# 本地数据库部署指南

本文档说明如何配置本地 MySQL 数据库来替代 Supabase。

## 📋 前提条件

- MySQL 5.7+ 或 8.0+
- Node.js >= 18.18.0
- pnpm >= 9

## 🚀 快速开始

### 1. 安装 MySQL

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

#### Linux (CentOS/RHEL)

```bash
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
sudo mysql_secure_installation
```

#### Windows

下载并安装 [MySQL Installer](https://dev.mysql.com/downloads/mysql/)

#### macOS

```bash
brew install mysql
brew services start mysql
```

### 2. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 在 MySQL 命令行中执行
```

或者直接执行初始化脚本：

```bash
mysql -u root -p < database/schema.sql
```

### 3. 创建数据库用户（可选）

```sql
-- 登录 MySQL 后执行
CREATE USER 'anheyu'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON anheyu_blog.* TO 'anheyu'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
# 数据库配置
VITE_DB_HOST=localhost
VITE_DB_PORT=3306
VITE_DB_USER=root
VITE_DB_PASSWORD=your_password
VITE_DB_NAME=anheyu_blog

# 数据库类型
VITE_DB_TYPE=local
```

### 5. 安装依赖

```bash
pnpm install
```

### 6. 验证连接

```bash
pnpm dev
```

如果没有报错，说明数据库连接成功。

## 📊 数据库结构

### 表列表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| roles | 角色表 |
| posts | 文章表 |
| categories | 分类表 |
| tags | 标签表 |
| post_tags | 文章标签关联表 |
| comments | 评论表 |
| media | 媒体文件表 |
| flinks | 友链表 |
| pages | 页面表 |
| settings | 网站设置表 |
| albums | 相册表 |
| album_categories | 相册分类表 |
| music | 音乐表 |
| statistics | 访问统计表 |

### 默认管理员账号

- 用户名：`admin`
- 密码：`admin123`（请登录后立即修改）

## 🔧 开发配置

### 数据库连接池配置

在 `src/utils/database.ts` 中调整连接池参数：

```typescript
const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: Number(import.meta.env.VITE_DB_PORT) || 3306,
  user: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  database: import.meta.env.VITE_DB_NAME || 'anheyu_blog',
  charset: 'utf8mb4',
  connectionLimit: 10,  // 连接池大小
  waitForConnections: true,
  queueLimit: 0
};
```

### API 切换

在 `src/utils/http/index.ts` 中切换数据库：

```typescript
// 使用本地 MySQL
export { databaseHttp as db } from './database';

// 使用 Supabase
// export { supabaseHttp as db } from './supabase';
```

## 📁 文件上传配置

### 本地存储配置

在宝塔面板中：

1. 创建上传目录：
   ```bash
   mkdir -p /www/wwwroot/anheyu/dist/uploads
   chmod 755 /www/wwwroot/anheyu/dist/uploads
   ```

2. 配置 Nginx：
   ```nginx
   location /uploads/ {
       alias /www/wwwroot/anheyu/dist/uploads/;
       expires 1y;
       add_header Cache-Control "public";
   }
   ```

3. 更新 `media` 表中的 `file_path` 和 `file_url`

## 🔐 安全建议

1. **修改默认密码**：
   ```sql
   USE anheyu_blog;
   UPDATE users SET password = '$2a$10$your_hashed_password' WHERE username = 'admin';
   ```

2. **限制数据库访问**：
   ```bash
   # 只允许本地访问
   sudo mysql -u root -p -e "CREATE USER 'anheyu'@'localhost' IDENTIFIED BY 'password';"
   ```

3. **定期备份**：
   ```bash
   # 备份数据库
   mysqldump -u root -p anheyu_blog > backup_$(date +%Y%m%d).sql

   # 恢复数据库
   mysql -u root -p anheyu_blog < backup_20240101.sql
   ```

## 🔄 数据迁移

### 从 Supabase 迁移到本地 MySQL

1. 导出 Supabase 数据（使用 pg_dump）
2. 转换数据格式（JSON → SQL）
3. 导入到本地 MySQL

### 脚本示例

创建迁移脚本 `scripts/migrate-from-supabase.js`：

```javascript
// 从 Supabase API 获取数据
const { supabase } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');

// 连接 Supabase 和 MySQL
// 迁移数据...
```

## 🐛 常见问题

### 1. 连接失败

**错误信息**：`Access denied for user 'root'@'localhost'`

**解决方案**：
```bash
# 重置 root 密码
sudo mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 2. 表不存在

**错误信息**：`Table 'anheyu_blog.posts' doesn't exist`

**解决方案**：
```bash
# 重新执行初始化脚本
mysql -u root -p anheyu_blog < database/schema.sql
```

### 3. 字符编码问题

**解决方案**：确保数据库使用 utf8mb4
```sql
ALTER DATABASE anheyu_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 连接池耗尽

**解决方案**：增加连接池大小
```typescript
connectionLimit: 20
```

## 📚 参考资料

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [Node.js MySQL 驱动](https://github.com/sidorares/node-mysql2)
- [bcrypt 密码加密](https://www.npmjs.com/package/bcrypt)

## 🆘 获取帮助

如果遇到问题：

1. 查看 MySQL 错误日志：`/var/log/mysql/error.log`
2. 检查数据库连接配置
3. 参考常见问题章节
4. 提交 Issue 到项目仓库

---

部署完成后，你的博客就可以使用本地 MySQL 数据库了！🎉
