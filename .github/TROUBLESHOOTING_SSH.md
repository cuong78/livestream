# Khắc phục lỗi SSH Timeout trong GitHub Actions

## Lỗi: `dial tcp 72.62.65.86:22: i/o timeout`

Lỗi này xảy ra khi GitHub Actions không thể kết nối SSH đến VPS của bạn.

## Nguyên nhân có thể

### 1. Firewall chặn IP của GitHub Actions ⚠️ (Phổ biến nhất)

GitHub Actions chạy trên các IP động, và firewall trên VPS có thể đang chặn các IP này.

**Giải pháp:**

#### Cách 1: Cho phép tất cả IP (Không an toàn, chỉ dùng để test)
```bash
# Trên VPS
sudo ufw allow 22/tcp
# hoặc
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

#### Cách 2: Cho phép IP range của GitHub Actions (Khuyến nghị)

GitHub Actions sử dụng các IP range. Bạn cần whitelist các IP này:

1. **Lấy danh sách IP của GitHub Actions:**
   - Vào: https://api.github.com/meta
   - Tìm section `actions` - đây là danh sách IP ranges

2. **Thêm vào firewall trên VPS:**
```bash
# Ví dụ với ufw
sudo ufw allow from 140.82.112.0/20 to any port 22
sudo ufw allow from 143.55.64.0/20 to any port 22
# ... thêm các IP ranges khác
```

3. **Hoặc dùng script tự động:**
```bash
#!/bin/bash
# Lấy IP ranges từ GitHub API và thêm vào firewall
curl -s https://api.github.com/meta | jq -r '.actions[]' | while read ip; do
  sudo ufw allow from $ip to any port 22
done
```

#### Cách 3: Sử dụng GitHub Actions IP ranges (Tốt nhất)

GitHub cung cấp webhook để cập nhật IP ranges tự động. Tham khảo: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses

### 2. SSH Service không chạy

Kiểm tra SSH service trên VPS:

```bash
# Kiểm tra SSH service
sudo systemctl status ssh
# hoặc
sudo systemctl status sshd

# Nếu không chạy, khởi động lại
sudo systemctl start ssh
sudo systemctl enable ssh
```

### 3. Port 22 bị chặn bởi Cloud Provider

Một số cloud provider (như AWS, DigitalOcean) có firewall riêng.

**Giải pháp:**
- Vào dashboard của cloud provider
- Tìm Security Groups / Firewall settings
- Cho phép inbound traffic trên port 22 từ tất cả IP (0.0.0.0/0) hoặc IP ranges của GitHub

### 4. VPS không accessible từ internet

Kiểm tra VPS có thể truy cập được không:

```bash
# Từ máy local của bạn
ping 72.62.65.86
telnet 72.62.65.86 22
```

Nếu không ping được, có thể VPS đang down hoặc network có vấn đề.

### 5. SSH key không đúng

Kiểm tra SSH key đã được cấu hình đúng chưa:

1. **Kiểm tra trên VPS:**
```bash
# Xem authorized_keys
cat ~/.ssh/authorized_keys

# Kiểm tra quyền
ls -la ~/.ssh/
# Phải có:
# - ~/.ssh/ có quyền 700
# - ~/.ssh/authorized_keys có quyền 600
```

2. **Test từ máy local:**
```bash
ssh -i ~/.ssh/your_private_key root@72.62.65.86
```

Nếu không kết nối được từ máy local, thì GitHub Actions cũng sẽ không kết nối được.

## Các bước kiểm tra nhanh

### Bước 1: Test SSH từ máy local
```bash
ssh root@72.62.65.86
```
Nếu không kết nối được → Vấn đề ở VPS, không phải GitHub Actions

### Bước 2: Kiểm tra firewall trên VPS
```bash
# Xem firewall rules
sudo ufw status
# hoặc
sudo iptables -L -n

# Xem SSH service
sudo systemctl status ssh
```

### Bước 3: Kiểm tra port 22 có mở không
```bash
# Trên VPS
sudo netstat -tlnp | grep :22
# hoặc
sudo ss -tlnp | grep :22
```

Nếu không thấy port 22 listening → SSH service không chạy

### Bước 4: Test từ GitHub Actions

Thêm step test vào workflow để kiểm tra:

```yaml
- name: Test SSH Connection
  uses: appleboy/ssh-action@master
  with:
    host: 72.62.65.86
    username: root
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: echo "Connection successful!"
```

## Giải pháp tạm thời: Sử dụng SSH Tunnel hoặc VPN

Nếu không thể whitelist IP của GitHub Actions, có thể:
1. Sử dụng self-hosted runner (chạy trên VPS của bạn)
2. Sử dụng SSH tunnel qua một server trung gian
3. Sử dụng VPN

## Cải thiện workflow

Workflow đã được cập nhật với:
- `timeout: 60s` - Tăng thời gian chờ kết nối
- `command_timeout: 10m` - Tăng thời gian chờ command chạy xong
- `port: 22` - Chỉ định port rõ ràng

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- Không nên mở port 22 cho tất cả IP (0.0.0.0/0) trong production
- Nên whitelist chỉ IP ranges của GitHub Actions
- Sử dụng fail2ban để bảo vệ khỏi brute force attacks
- Cân nhắc đổi SSH port từ 22 sang port khác (như 2222)

## Tham khảo

- GitHub Actions IP ranges: https://api.github.com/meta
- GitHub Actions documentation: https://docs.github.com/en/actions
- SSH security best practices: https://www.ssh.com/academy/ssh/security
