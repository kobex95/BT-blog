#!/bin/bash

# 安装 Supabase 依赖脚本

echo "🚀 开始安装 Supabase 相关依赖..."

# 检查 pnpm 是否已安装
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    echo "运行: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm 已安装"

# 安装 Supabase 客户端
echo "📦 正在安装 @supabase/supabase-js..."
pnpm add @supabase/supabase-js

echo "✅ 依赖安装完成！"
echo ""
echo "📝 下一步："
echo "1. 复制 .env.example 到 .env.local"
echo "2. 填写 Supabase 配置信息"
echo "3. 在 Supabase 中执行 supabase/init.sql 初始化数据库"
echo ""
echo "🎉 准备就绪！"
