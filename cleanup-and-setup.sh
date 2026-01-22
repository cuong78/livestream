#!/bin/bash

# Script để xóa sạch và setup lại dự án Livestream trên VPS
# Sử dụng: ./cleanup-and-setup.sh

set -e

echo "=========================================="
echo "  Livestream Cleanup and Setup Script"
echo "=========================================="
echo ""

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hàm in thông báo
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then 
    error "Vui lòng chạy script với quyền root (sudo)"
    exit 1
fi

PROJECT_DIR="/var/www/livestream"

echo "Bước 1: Dừng và xóa tất cả containers..."
cd $PROJECT_DIR 2>/dev/null || mkdir -p $PROJECT_DIR && cd $PROJECT_DIR

# Dừng containers
if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
fi

# Xóa containers
info "Xóa containers livestream..."
docker ps -a | grep livestream | awk '{print $1}' | xargs -r docker rm -f || true

echo ""
echo "Bước 2: Xóa images..."
info "Xóa images livestream..."
docker images | grep livestream | awk '{print $3}' | xargs -r docker rmi -f || true
docker images | grep ghcr.io | grep livestream | awk '{print $3}' | xargs -r docker rmi -f || true

echo ""
echo "Bước 3: Xóa volumes..."
info "Xóa volumes livestream..."
docker volume ls | grep livestream | awk '{print $2}' | xargs -r docker volume rm || true
docker volume ls | grep postgres_data | awk '{print $2}' | xargs -r docker volume rm || true
docker volume ls | grep redis_data | awk '{print $2}' | xargs -r docker volume rm || true
docker volume ls | grep srs_data | awk '{print $2}' | xargs -r docker volume rm || true
docker volume ls | grep recordings_data | awk '{print $2}' | xargs -r docker volume rm || true
docker volume ls | grep videos_data | awk '{print $2}' | xargs -r docker volume rm || true

echo ""
echo "Bước 4: Xóa networks..."
info "Xóa networks livestream..."
docker network ls | grep livestream | awk '{print $1}' | xargs -r docker network rm || true

echo ""
warn "Bước 5: Dọn dẹp hệ thống Docker..."
read -p "Bạn có muốn chạy 'docker system prune -a --volumes'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -a --volumes -f
    info "Đã dọn dẹp hệ thống Docker"
else
    info "Bỏ qua bước dọn dẹp hệ thống"
fi

echo ""
warn "Bước 6: Xóa file cấu hình cũ..."
read -p "Bạn có muốn xóa TẤT CẢ file trong $PROJECT_DIR? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf $PROJECT_DIR/*
    info "Đã xóa tất cả file trong $PROJECT_DIR"
else
    info "Giữ lại file cấu hình cũ"
fi

echo ""
info "=========================================="
info "  Cleanup hoàn tất!"
info "=========================================="
echo ""
info "Bây giờ bạn có thể:"
info "1. Chạy lại các lệnh setup từ file setup.md"
info "2. Hoặc chờ GitHub Actions tự động deploy"
echo ""
