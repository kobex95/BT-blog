#!/bin/bash

################################################################################
# 安知鱼博客 - 宝塔面板自动部署脚本
# 使用方法: bash deploy.sh
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_DIR="/www/wwwroot/anheyu"
BACKUP_DIR="/www/wwwroot/anheyu_backup"
LOG_FILE="/www/wwwlogs/deploy_$(date +%Y%m%d_%H%M%S).log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

################################################################################
# 日志函数
################################################################################
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

################################################################################
# 检查依赖
################################################################################
check_dependencies() {
    log "检查依赖..."

    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        error "pnpm 未安装"
        exit 1
    fi

    log "依赖检查通过"
}

################################################################################
# 备份当前版本
################################################################################
backup_current() {
    log "备份当前版本..."

    if [ -d "$PROJECT_DIR/dist" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$PROJECT_DIR/dist" "$BACKUP_DIR/dist_$TIMESTAMP"
        log "备份完成: $BACKUP_DIR/dist_$TIMESTAMP"
    else
        warn "没有可备份的 dist 目录"
    fi
}

################################################################################
# 拉取最新代码
################################################################################
pull_code() {
    log "拉取最新代码..."

    cd "$PROJECT_DIR"

    if [ -d ".git" ]; then
        git fetch origin
        git reset --hard origin/main
        log "代码拉取完成"
    else
        error "不是 git 仓库，无法拉取代码"
        exit 1
    fi
}

################################################################################
# 安装依赖
################################################################################
install_dependencies() {
    log "安装依赖..."

    cd "$PROJECT_DIR"

    # 使用国内镜像加速
    pnpm config set registry https://registry.npmmirror.com

    # 安装依赖
    pnpm install --frozen-lockfile

    log "依赖安装完成"
}

################################################################################
# 构建项目
################################################################################
build_project() {
    log "构建项目..."

    cd "$PROJECT_DIR"

    # 增加内存限制
    export NODE_OPTIONS="--max-old-space-size=8192"

    # 清理旧的构建
    rm -rf dist

    # 构建生产版本
    pnpm build

    log "项目构建完成"
}

################################################################################
# 重启 Nginx
################################################################################
restart_nginx() {
    log "重启 Nginx..."

    # 测试 Nginx 配置
    nginx -t

    if [ $? -eq 0 ]; then
        nginx -s reload
        log "Nginx 重启成功"
    else
        error "Nginx 配置测试失败"
        exit 1
    fi
}

################################################################################
# 清理旧备份
################################################################################
cleanup_old_backups() {
    log "清理旧备份（保留最近 7 份）..."

    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +8 | xargs -r rm -rf
        log "备份清理完成"
    fi
}

################################################################################
# 回滚函数
################################################################################
rollback() {
    error "部署失败，开始回滚..."

    if [ -d "$BACKUP_DIR/dist_$TIMESTAMP" ]; then
        rm -rf "$PROJECT_DIR/dist"
        cp -r "$BACKUP_DIR/dist_$TIMESTAMP" "$PROJECT_DIR/dist"
        restart_nginx
        error "回滚完成"
    else
        error "没有可用的备份"
    fi

    exit 1
}

################################################################################
# 主函数
################################################################################
main() {
    log "=========================================="
    log "安知鱼博客部署开始"
    log "=========================================="

    # 错误处理
    trap rollback ERR

    # 检查依赖
    check_dependencies

    # 备份当前版本
    backup_current

    # 拉取最新代码
    pull_code

    # 安装依赖
    install_dependencies

    # 构建项目
    build_project

    # 重启 Nginx
    restart_nginx

    # 清理旧备份
    cleanup_old_backups

    log "=========================================="
    log "安知鱼博客部署成功！"
    log "=========================================="

    # 显示部署信息
    info "项目目录: $PROJECT_DIR"
    info "构建时间: $TIMESTAMP"
    info "日志文件: $LOG_FILE"
    info "备份位置: $BACKUP_DIR/dist_$TIMESTAMP"

    # 可选：重启 PM2（如果使用 PM2）
    # if command -v pm2 &> /dev/null; then
    #     log "重启 PM2 进程..."
    #     pm2 restart anheyu-preview
    #     log "PM2 重启成功"
    # fi
}

################################################################################
# 执行主函数
################################################################################
main
