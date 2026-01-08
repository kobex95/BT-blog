# 安装 Supabase 依赖脚本 (PowerShell)

Write-Host "🚀 开始安装 Supabase 相关依赖..." -ForegroundColor Green

# 检查 pnpm 是否已安装
$pnpmCheck = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCheck) {
    Write-Host "❌ pnpm 未安装，请先安装 pnpm" -ForegroundColor Red
    Write-Host "运行: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ pnpm 已安装" -ForegroundColor Green

# 安装 Supabase 客户端
Write-Host "📦 正在安装 @supabase/supabase-js..." -ForegroundColor Yellow
pnpm add @supabase/supabase-js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 依赖安装完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 下一步：" -ForegroundColor Cyan
    Write-Host "1. 复制 .env.example 到 .env.local"
    Write-Host "2. 填写 Supabase 配置信息"
    Write-Host "3. 在 Supabase 中执行 supabase/init.sql 初始化数据库"
    Write-Host ""
    Write-Host "🎉 准备就绪！" -ForegroundColor Green
} else {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}
