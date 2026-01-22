# 🚀 Quick Start Guide - Xóa và Setup lại từ đầu

## ⚠️ XÓA HẾT DỮ LIỆU CŨ

### Cách 1: Sử dụng script tự động (Khuyến nghị)

```bash
# Upload script lên VPS
scp cleanup-and-setup.sh root@72.61.119.173:/root/

# SSH vào VPS và chạy script
ssh root@72.61.119.173
chmod +x /root/cleanup-and-setup.sh
/root/cleanup-and-setup.sh
```

### Cách 2: Chạy thủ công

```bash
ssh root@72.61.119.173
cd /var/www/livestream

# Dừng và xóa containers
docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Xóa containers
docker ps -a | grep livestream | awk '{print $1}' | xargs -r docker rm -f

# Xóa images
docker images | grep livestream | awk '{print $3}' | xargs -r docker rmi -f
docker images | grep ghcr.io | awk '{print $3}' | xargs -r docker rmi -f

# Xóa volumes
docker volume ls | grep livestream | awk '{print $2}' | xargs -r docker volume rm
docker volume ls | grep postgres_data | awk '{print $2}' | xargs -r docker volume rm
docker volume ls | grep redis_data | awk '{print $2}' | xargs -r docker volume rm
docker volume ls | grep srs_data | awk '{print $2}' | xargs -r docker volume rm
docker volume ls | grep recordings_data | awk '{print $2}' | xargs -r docker volume rm
docker volume ls | grep videos_data | awk '{print $2}' | xargs -r docker volume rm

# Xóa networks
docker network ls | grep livestream | awk '{print $1}' | xargs -r docker network rm

# Dọn dẹp (CẨN THẬN - xóa TẤT CẢ unused resources)
docker system prune -a --volumes -f

# Xóa file cấu hình (TÙY CHỌN)
rm -rf /var/www/livestream/*
```

## 📝 SETUP LẠI TỪ ĐẦU

### Bước 1: Tạo thư mục và file cấu hình

```bash
mkdir -p /var/www/livestream
cd /var/www/livestream
```

### Bước 2: Tạo file .env

Xem chi tiết trong `setup.md` - Bước 3, mục 2

### Bước 3: Tạo các file cấu hình

- `docker-compose.prod.yml` - Xem trong `setup.md` - Bước 3, mục 3
- `srs.conf` - Xem trong `setup.md` - Bước 3, mục 5
- `nginx-hls.conf` - Xem trong `setup.md` - Bước 3, mục 4

### Bước 4: Cấu hình Nginx reverse proxy

Xem trong `setup.md` - Bước 2

### Bước 5: Setup GitHub Secrets

1. Tạo SSH key pair
2. Thêm `SSH_PRIVATE_KEY` vào GitHub Secrets
3. Thêm `TOKEN` (GitHub Personal Access Token) vào GitHub Secrets

Xem chi tiết trong `setup.md` - Bước 5

### Bước 6: Push code và deploy

```bash
git push origin main
```

GitHub Actions sẽ tự động:
- Build backend và frontend
- Push Docker images lên GitHub Container Registry
- Deploy lên VPS

## 🔍 KIỂM TRA SAU KHI DEPLOY

```bash
# Kiểm tra containers
docker ps

# Kiểm tra logs
docker compose -f docker-compose.prod.yml logs -f

# Kiểm tra từng service
docker logs livestream-backend -f
docker logs livestream-frontend -f
docker logs livestream-srs -f
```

## 📚 Tài liệu chi tiết

Xem file `setup.md` để biết hướng dẫn đầy đủ.

## 🆘 Troubleshooting

### Backend không khởi động được

```bash
# Kiểm tra logs
docker logs livestream-backend

# Kiểm tra kết nối database
docker exec -it livestream-backend sh
env | grep SPRING_DATASOURCE
```

### Frontend không load được

```bash
# Kiểm tra build
docker exec -it livestream-frontend ls -la /usr/share/nginx/html

# Kiểm tra nginx config
docker exec -it livestream-frontend cat /etc/nginx/conf.d/default.conf
```

### SRS không stream được

```bash
# Kiểm tra logs
docker logs livestream-srs

# Kiểm tra cấu hình
docker exec -it livestream-srs cat /usr/local/srs/conf/srs.conf
```

### Không pull được images từ GitHub Container Registry

```bash
# Login lại
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Kiểm tra quyền truy cập
docker pull ghcr.io/YOUR_USERNAME/livestream/livestream-backend:latest
```
