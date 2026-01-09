/**
 * 安知鱼博客 - PM2 进程管理配置
 * 用于生产环境的 Node.js 进程管理
 *
 * 使用方法：
 * 1. 安装 PM2: npm install -g pm2
 * 2. 启动进程: pm2 start ecosystem.config.js
 * 3. 保存进程列表: pm2 save
 * 4. 设置开机自启: pm2 startup
 *
 * 常用命令：
 * pm2 start ecosystem.config.js      # 启动
 * pm2 stop anheyu-preview            # 停止
 * pm2 restart anheyu-preview         # 重启
 * pm2 delete anheyu-preview          # 删除
 * pm2 logs anheyu-preview            # 查看日志
 * pm2 monit                          # 监控
 * pm2 list                           # 列出所有进程
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'anheyu-preview',

      // 启动脚本
      script: 'node_modules/.bin/vite',

      // 启动参数
      args: 'preview --host 0.0.0.0 --port 3000',

      // 应用目录
      cwd: '/www/wwwroot/anheyu',

      // 实例数量（0 表示 CPU 核心数）
      instances: 1,

      // 运行模式（cluster 或 fork）
      exec_mode: 'fork',

      // 自动重启
      autorestart: true,

      // 监听文件变化（生产环境建议关闭）
      watch: false,

      // 最大内存限制，超过则重启
      max_memory_restart: '1G',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // 错误日志文件
      error_file: '/www/wwwlogs/anheyu-preview-error.log',

      // 输出日志文件
      out_file: '/www/wwwlogs/anheyu-preview-out.log',

      // 日志时间戳格式
      time: true,

      // 合并日志
      merge_logs: true,

      // 日志文件最大大小（单位：字节）
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 进程启动超时时间（单位：毫秒）
      listen_timeout: 10000,

      // 进程重启之间的等待时间
      kill_timeout: 5000,

      // 进程等待就绪的时间
      wait_ready: true,

      // 最小正常运行时间（秒），低于此时间重启算作异常重启
      min_uptime: '10s',

      // 最大重启次数
      max_restarts: 10,

      // 异常重启延迟时间
      restart_delay: 4000
    }
  ],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'www',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/anheyu-blog.git',
      path: '/www/wwwroot/anheyu',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
