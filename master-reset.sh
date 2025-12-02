#!/bin/bash

###############################################################################
# Master Script: Khôi phục và Deploy lại toàn bộ hệ thống
###############################################################################

set -e

echo "════════════════════════════════════════════════════════════"
echo "   KHÔI PHỤC VÀ DEPLOY LẠI SERVER"
echo "════════════════════════════════════════════════════════════"
echo ""

# Bước 1: Dọn dẹp Docker
echo "📦 Bước 1: Dọn dẹp Docker images và cache..."
bash /opt/livestream-cicd/do-reset.sh

echo ""
echo "════════════════════════════════════════════════════════════"

# Bước 2: Tạo file .env
echo "📝 Bước 2: Tạo file .env với secrets mới..."
bash /opt/livestream-cicd/create-env.sh

echo ""
echo "════════════════════════════════════════════════════════════"

# Bước 3: Verify file .env
echo "✅ Bước 3: Kiểm tra file .env..."
if [ -f /opt/livestream-cicd/.env ]; then
    echo "✅ File .env tồn tại"
    echo "✅ Kiểm tra biến STREAM_HLS_BASE_URL..."
    if grep -q "STREAM_HLS_BASE_URL=https://anhcuong.space/hls" /opt/livestream-cicd/.env; then
        echo "✅ STREAM_HLS_BASE_URL: OK"
    else
        echo "❌ STREAM_HLS_BASE_URL: KHÔNG TÌM THẤY"
        exit 1
    fi
else
    echo "❌ File .env không tồn tại"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ KHÔI PHỤC SERVER HOÀN TẤT!"
echo ""
echo "📌 Các bước tiếp theo:"
echo "   1. Đẩy code lên GitHub (trên máy local)"
echo "   2. Chờ GitHub Actions build và deploy (~5-7 phút)"
echo "   3. Hoặc deploy thủ công bằng lệnh:"
echo ""
echo "      cd /opt/livestream-cicd"
echo "      docker-compose -f docker-compose.cicd.yml pull"
echo "      docker-compose -f docker-compose.cicd.yml up -d"
echo ""
echo "════════════════════════════════════════════════════════════"
