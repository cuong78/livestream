#!/bin/bash

echo "🔧 Đang dọn dẹp Docker images và cache..."

# Xóa dangling images
docker image prune -af

# Xóa volumes không dùng
docker volume prune -f

# Kiểm tra kết quả
echo ""
echo "✅ Containers còn lại:"
docker ps -a

echo ""
echo "✅ Images còn lại:"
docker images

echo ""
echo "✅ Volumes còn lại:"
docker volume ls

echo ""
echo "✅ Khôi phục server hoàn tất!"
