# 宝塔面板部署指南

本文档详细说明如何使用宝塔面板部署安知鱼博客系统。

## 📋 部署前准备

### 环境要求

- 宝塔面板（Linux 服务器）
- Node.js >= 18.18.0（建议使用 20.x）
- Nginx（宝塔自带）
- MySQL 5.7+ 或 8.0+（用于数据库）
- pm2 进程管理器（用于生产环境）

### 所需账号

- 服务器访问权限
- MySQL 数据库管理员权限

## 🚀 部署步骤

### 第一步：安装 Node.js 和 PM2

1. 登录宝塔面板
2. 进入「软件商店」
3. 搜索并安装：
   - Node.js 版本管理器（推荐使用 20.x）
   - PM2 管理器

或者使用命令行安装：

```bash
# 安装 Node.js 20.x（如果没有安装）
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 pm2（可选，用于进程管理）
npm install -g pm2
```

### 第二步：上传项目文件

1. 在宝塔面板中创建网站目录，例如：`/www/wwwroot/anheyu`
2. 通过以下方式之一上传项目文件：
   - 使用宝塔面板的「文件管理」上传压缩包并解压
   - 使用 git 命令克隆项目：
     ```bash
     cd /www/wwwroot
     git clone https://github.com/your-username/anheyu-blog.git anheyu
     ```

### 第三步：安装项目依赖

**重要**：项目已移除 pnpm 限制，现在支持使用 npm 安装依赖。

1. 进入项目目录：
   ```bash
   cd /www/wwwroot/anheyu
   ```

2. **使用 npm 安装依赖**（推荐，宝塔面板原生支持）：
   ```bash
   npm install
   ```

3. 如果遇到网络问题，使用国内镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

**可选**：如果希望使用 pnpm 以获得更好的性能：
```bash
# 安装 pnpm
npm install -g pnpm

# 使用 pnpm 安装依赖
pnpm install
```

### 第四步：配置 MySQL 数据库

1. 在宝塔面板中创建数据库：
   - 进入「数据库」
   - 点击「添加数据库」
   - 数据库名：`anheyu_blog`
   - 用户名：自动生成
   - 密码：记住密码
   - 点击「提交」

2. 导入数据库结构（可选）：
   - 点击数据库后的「管理」或「导入」
   - 选择数据库初始化脚本（如果有）
   - 点击「导入」

或者通过命令行操作：

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE anheyu_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户并授权
CREATE USER 'anheyu'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON anheyu_blog.* TO 'anheyu'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 第五步：配置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.baota.example .env.production
   ```

2. 编辑 `.env.production` 文件：
   ```bash
   nano .env.production
   ```

3. 填写以下配置：
   ```env
   # MySQL 数据库配置
   VITE_DB_HOST=localhost
   VITE_DB_PORT=3306
   VITE_DB_USER=anheyu
   VITE_DB_PASSWORD=your_strong_password
   VITE_DB_NAME=anheyu_blog

   # 应用配置
   VITE_APP_TITLE=安知鱼的博客
   VITE_APP_DESCRIPTION=一个分享技术与生活的博客
   VITE_API_URL=http://localhost:8848/api

   # 部署配置 - 重要！
   VITE_PUBLIC_PATH=/          # 如果部署在根目录使用 /，子目录使用 /your-path/
   VITE_ROUTER_HISTORY=history  # 使用 history 模式，需要 Nginx 配置支持

   # 构建配置
   VITE_PORT=8848
   VITE_CDN=false
   VITE_COMPRESSION=all
   ```

### 第六步：构建项目

使用 npm 构建项目：
```bash
npm run build
```

构建完成后，生成的静态文件将在 `dist` 目录中。

### 第七步：配置 Nginx

#### 方法一：使用宝塔面板配置

1. 在宝塔面板中点击「网站」
2. 点击「添加站点」
   - 域名：填写你的域名（如 blog.example.com）
   - 根目录：`/www/wwwroot/anheyu/dist`
   - PHP 版本：纯静态
3. 点击「设置」→「配置文件」

4. 替换为以下配置：

```nginx
server {
    listen 80;
    server_name blog.example.com;  # 修改为你的域名
    root /www/wwwroot/anheyu/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # 访问日志和错误日志
    access_log /www/wwwlogs/anheyu_access.log;
    error_log /www/wwwlogs/anheyu_error.log;

    # SPA 路由配置 - 重要！
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全配置
    location ~ /\. {
        deny all;
    }

    # 禁止访问敏感文件
    location ~* \.(env|git|svn)$ {
        deny all;
    }
}
```

5. 保存配置并重启 Nginx

#### 方法二：手动编辑配置文件

配置文件位置：`/www/server/panel/vhost/nginx/你的域名.conf`

粘贴上述 Nginx 配置，然后执行：
```bash
nginx -t  # 测试配置
nginx -s reload  # 重载配置
```

### 第八步：配置 HTTPS（推荐）

1. 在宝塔面板网站设置中点击「SSL」
2. 选择「Let's Encrypt」免费证书
3. 填写邮箱和域名，点击「申请」
4. 开启「强制 HTTPS」

### 第九步：测试部署

1. 在浏览器访问你的域名
2. 检查页面是否正常加载
3. 测试以下功能：
   - 文章列表和详情
   - 评论功能
   - 管理后台
   - 图片上传

## 🔧 生产环境优化

### 使用 PM2 管理（可选）

如果需要运行 Node.js 服务（如 SSR 或 API 服务），使用 PM2：

1. 创建 `ecosystem.config.js`：
   ```javascript
   module.exports = {
     apps: [{
       name: 'anheyu-preview',
       script: 'node_modules/.bin/vite',
       args: 'preview --host 0.0.0.0 --port 3000',
       cwd: '/www/wwwroot/anheyu',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production'
       }
     }]
   };
   ```

2. 启动服务：
   ```bash
   cd /www/wwwroot/anheyu
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### 自动化部署脚本

创建 `deploy.sh` 脚本：

```bash
#!/bin/bash
set -e

echo "开始部署..."

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建项目
npm run build

# 重启 Nginx
nginx -s reload

echo "部署完成！"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

### 配置自动备份

在宝塔面板中：

1. 进入「计划任务」
2. 添加任务：
   - 任务类型：备份数据库
   - 数据库选择：`anheyu_blog`
   - 执行周期：每天
   - 保留份数：7 份

3. 备份到云存储（可选）：
   - 配置宝塔云存储（如阿里云OSS、腾讯云COS）
   - 设置自动上传

## 📊 监控和维护

### 查看访问日志

```bash
tail -f /www/wwwlogs/anheyu_access.log
```

### 查看错误日志

```bash
tail -f /www/wwwlogs/anheyu_error.log
```

### 性能优化建议

1. **启用 CDN**：推荐使用 CDN 加速静态资源
2. **图片优化**：使用 WebP 格式
3. **启用 Brotli 压缩**：在宝塔面板中启用
4. **配置缓存规则**：合理设置缓存时间
5. **定期清理日志**：避免日志文件过大

## 🔐 安全配置

### 1. 配置防火墙

在宝塔面板中：

1. 进入「安全」
2. 允许端口：80, 443, 22（SSH）
3. 关闭不必要的端口

### 2. 定期更新

```bash
# 更新系统
apt update && apt upgrade -y

# 更新 Node.js 依赖
cd /www/wwwroot/anheyu
npm update
```

### 3. 文件权限设置

```bash
# 设置合适的文件权限
chown -R www:www /www/wwwroot/anheyu
chmod -R 755 /www/wwwroot/anheyu
```

## 🐛 常见问题

### 1. 访问页面显示 404

**原因**：Nginx 配置问题，路由模式不支持

**解决**：确保 Nginx 配置中包含：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. 静态资源加载失败

**原因**：路径配置错误

**解决**：检查 `.env.production` 中的 `VITE_PUBLIC_PATH` 配置

### 3. 图片上传失败

**原因**：
- 上传目录权限不足
- 文件大小超过限制
- 磁盘空间不足

**解决**：
```bash
# 创建上传目录
mkdir -p /www/wwwroot/anheyu/dist/uploads

# 设置权限
chmod 755 /www/wwwroot/anheyu/dist/uploads
chown -R www:www /www/wwwroot/anheyu/dist

# 检查磁盘空间
df -h
```

### 4. 页面样式错乱

**原因**：构建问题或资源路径错误

**解决**：
```bash
# 重新构建
npm run build
# 清除浏览器缓存后重试
```

### 5. 数据库连接失败

**原因**：
- MySQL 配置错误
- 数据库服务未启动
- 权限不足

**解决**：
```bash
# 检查 MySQL 服务状态
systemctl status mysql

# 启动 MySQL
systemctl start mysql

# 测试数据库连接
mysql -u anheyu -p anheyu_blog

# 检查防火墙
systemctl status firewalld
# 如果需要，开放 3306 端口
firewall-cmd --add-port=3306/tcp --permanent
firewall-cmd --reload
```

同时检查 `.env.production` 中的数据库配置是否正确。

### 6. 内存不足导致构建失败

**解决**：
```bash
# 增加内存限制
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

## 🔄 更新部署流程

当需要更新项目时：

```bash
# 1. 备份当前版本
cp -r /www/wwwroot/anheyu/dist /www/wwwroot/anheyu/dist_backup

# 2. 拉取最新代码
cd /www/wwwroot/anheyu
git pull origin main

# 3. 更新依赖（如果需要）
npm install

# 4. 重新构建
npm run build

# 5. 如果新版本有问题，可以快速回滚
# cp -r /www/wwwroot/anheyu/dist_backup/* /www/wwwroot/anheyu/dist/
```

## 📚 参考文档

- [宝塔面板官方文档](https://www.bt.cn/bbs/)
- [Vite 部署文档](https://cn.vitejs.dev/guide/build.html)
- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [Nginx 配置指南](https://nginx.org/en/docs/)

## 🆘 获取帮助

如果遇到问题：

1. 查看日志文件定位错误
2. 检查宝塔面板错误日志
3. 参考本文档常见问题章节
4. 提交 Issue 到项目仓库

---

部署完成后，你的博客就可以通过域名访问了！🎉
