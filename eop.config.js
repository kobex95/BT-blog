/**
 * EdgeOne Pages 部署配置
 * 用于将博客前端和后台一起部署到 EdgeOne 平台
 */

module.exports = {
  // 项目名称
  name: 'anheyu-blog',

  // 构建配置
  build: {
    // 构建命令
    command: 'pnpm build',

    // 输出目录
    outputDir: 'dist',

    // 环境变量
    env: {
      // Supabase 配置（从 EdgeOne 环境变量读取）
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,

      // 应用配置
      VITE_APP_TITLE: process.env.VITE_APP_TITLE || '安知鱼的博客',
      VITE_APP_DESCRIPTION: process.env.VITE_APP_DESCRIPTION || '一个分享技术与生活的博客',

      // API 配置
      VITE_API_URL: process.env.VITE_API_URL,

      // 路由模式
      VITE_ROUTER_HISTORY: process.env.VITE_ROUTER_HISTORY || 'hash'
    }
  },

  // 路由配置
  routes: [
    {
      // 静态资源路由
      src: '/assets/(.*)',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    {
      // 图片资源路由
      src: '/images/(.*)',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    {
      // 所有路由重定向到 index.html（支持 Vue Router）
      src: '/(.*)',
      dest: '/index.html',
      status: 200
    }
  ],

  // 重定向配置
  redirects: [
    // 重定向 HTTP 到 HTTPS
    {
      from: 'http://(.*)',
      to: 'https://$1',
      statusCode: 301
    }
  ],

  // 缓存配置
  cache: {
    // 静态资源缓存
    '/assets/*': {
      edge: {
        maxAge: 31536000
      },
      browser: {
        maxAge: 31536000
      }
    },
    // HTML 文件缓存
    '/*.html': {
      edge: {
        maxAge: 3600
      },
      browser: {
        maxAge: 0
      }
    }
  },

  // 压缩配置
  compression: {
    // 启用 Brotli 压缩
    brotli: true,
    // 启用 Gzip 压缩
    gzip: true
  },

  // 安全头配置
  headers: [
    {
      // 所有路由应用这些头部
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()'
        }
      ]
    }
  ]
};
