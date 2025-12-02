#!/bin/bash

###############################################################################
# Script: Khôi phục Server về Trạng thái Ban Đầu
# Description: Dừng tất cả containers, xóa volumes, chuẩn bị deploy lại
# Usage: bash reset-server.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${YELLOW}╔════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   KHÔI PHỤC SERVER - RESET TOÀN BỘ       ║${NC}"
echo -e "${YELLOW}╔════════════════════════════════════════════╗${NC}"
echo ""

# Confirm action
read -p "⚠️  Bạn có chắc chắn muốn RESET toàn bộ server? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_warning "Hủy bỏ thao tác"
    exit 0
fi

PROJECT_DIR="/opt/livestream-cicd"

log_info "Bước 1: Dừng tất cả containers..."
cd "$PROJECT_DIR" || exit 1
docker-compose -f docker-compose.cicd.yml down -v
log_success "Đã dừng containers"

log_info "Bước 2: Xóa images cũ..."
docker rmi ghcr.io/cuong78/livestream-backend:latest -f 2>/dev/null || true
docker rmi ghcr.io/cuong78/livestream-frontend:latest -f 2>/dev/null || true
log_success "Đã xóa images cũ"

log_info "Bước 3: Xóa dangling images và cache..."
docker image prune -af
docker system prune -af --volumes
log_success "Đã dọn dẹp hệ thống"

log_info "Bước 4: Kiểm tra volumes còn lại..."
docker volume ls

log_info "Bước 5: Kiểm tra containers đang chạy..."
docker ps -a

echo ""
log_success "════════════════════════════════════════"
log_success "   KHÔI PHỤC HOÀN TẤT!"
log_success "════════════════════════════════════════"
echo ""
log_info "Các bước tiếp theo:"
echo "  1. Cập nhật file .env với cấu hình mới"
echo "  2. Push code lên GitHub để trigger CI/CD"
echo "  3. Hoặc chạy: bash deploy-cicd.sh"
echo ""
log_warning "Lưu ý: Database và Redis data đã bị XÓA. Backend sẽ tự tạo lại schema."
echo ""
