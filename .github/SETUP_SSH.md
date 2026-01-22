# Hướng dẫn cấu hình SSH_PRIVATE_KEY cho GitHub Actions

## Bước 1: Tạo SSH Key Pair

Trên máy local của bạn, chạy lệnh sau:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy"
```

Hoặc nếu hệ thống không hỗ trợ ed25519:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
```

**Lưu ý quan trọng:**
- Khi được hỏi "Enter passphrase", **KHÔNG đặt passphrase** (nhấn Enter 2 lần)
- Điều này cho phép GitHub Actions sử dụng key tự động mà không cần nhập passphrase

Sau khi tạo xong, bạn sẽ có 2 file:
- `~/.ssh/id_ed25519` (hoặc `id_rsa`) - **PRIVATE KEY** - giữ bí mật
- `~/.ssh/id_ed25519.pub` (hoặc `id_rsa.pub`) - **PUBLIC KEY** - có thể chia sẻ

## Bước 2: Thêm Public Key lên VPS

### 2.1. Copy nội dung public key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy toàn bộ nội dung (bắt đầu từ `ssh-ed25519` hoặc `ssh-rsa`)

### 2.2. SSH vào VPS và thêm public key

```bash
ssh root@72.62.65.86
```

Sau khi đăng nhập vào VPS, chạy các lệnh sau:

```bash
# Tạo thư mục .ssh nếu chưa có
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

**Có 3 cách để thêm public key (chọn 1 trong 3):**

#### Cách 1: Dùng echo với dấu ngoặc kép (khuyến nghị)
```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGkp3VfYFVlfv34iWdtmk1eeyImooghJ9QjebR2ZBIMS student@gmail.com" >> ~/.ssh/authorized_keys
```

⚠️ **Lưu ý:** 
- **KHÔNG được có dấu xuống dòng** ở cuối key
- Key phải nằm trên **1 dòng duy nhất**
- Nếu copy key có xuống dòng, hãy xóa dấu xuống dòng trước khi paste

#### Cách 2: Dùng echo không dấu ngoặc kép
```bash
echo ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGkp3VfYFVlfv34iWdtmk1eeyImooghJ9QjebR2ZBIMS student@gmail.com >> ~/.ssh/authorized_keys
```

#### Cách 3: Dùng editor (an toàn nhất)
```bash
# Mở file bằng nano hoặc vi
nano ~/.ssh/authorized_keys

# Paste key vào cuối file (mỗi key 1 dòng)
# Nhấn Ctrl+X, sau đó Y, sau đó Enter để lưu
```

Sau khi thêm key, đặt quyền đúng:
```bash
chmod 600 ~/.ssh/authorized_keys
```

**Ví dụ key của bạn:**
```bash
# ✅ ĐÚNG - không có dấu xuống dòng ở cuối
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGkp3VfYFVlfv34iWdtmk1eeyImooghJ9QjebR2ZBIMS student@gmail.com" >> ~/.ssh/authorized_keys

# ❌ SAI - có dấu xuống dòng thừa ở cuối (sẽ gây lỗi)
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGkp3VfYFVlfv34iWdtmk1eeyImooghJ9QjebR2ZBIMS student@gmail.com
" >> ~/.ssh/authorized_keys
```

### 2.3. Test kết nối (từ máy local)

```bash
ssh -i ~/.ssh/id_ed25519 root@72.62.65.86
```

Nếu kết nối thành công mà không cần nhập password, bạn đã cấu hình đúng!

## Bước 3: Thêm Private Key vào GitHub Secrets

1. Vào repository trên GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Điền thông tin:
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: Copy toàn bộ nội dung của **PRIVATE KEY** (file `~/.ssh/id_ed25519` hoặc `id_rsa`)

   Để xem nội dung private key:
   ```bash
   cat ~/.ssh/id_ed25519
   ```
   
   Copy **TOÀN BỘ** nội dung, bao gồm cả:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ...
   -----END OPENSSH PRIVATE KEY-----
   ```

5. Click **Add secret**

## Bước 4: Kiểm tra

Sau khi cấu hình xong, mỗi khi push code lên branch `main`, GitHub Actions sẽ:
1. Build Docker images
2. Push lên GitHub Container Registry
3. SSH vào VPS và deploy tự động

Bạn có thể xem logs trong tab **Actions** của repository để kiểm tra.

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG BAO GIỜ** commit private key vào Git
- **KHÔNG BAO GIỜ** chia sẻ private key với ai
- Chỉ thêm **PUBLIC KEY** lên VPS
- Chỉ thêm **PRIVATE KEY** vào GitHub Secrets
- Nếu private key bị lộ, hãy tạo key mới ngay lập tức

## Troubleshooting

### Lỗi "Permission denied (publickey)"
- Kiểm tra public key đã được thêm đúng vào `~/.ssh/authorized_keys` trên VPS
- Kiểm tra quyền file: `chmod 600 ~/.ssh/authorized_keys`
- Kiểm tra quyền thư mục: `chmod 700 ~/.ssh`

### Lỗi "Host key verification failed"
- Thêm VPS vào known_hosts hoặc bỏ qua kiểm tra (không khuyến khích)
- Có thể thêm option `--strict-host-key-checking=no` trong workflow (không an toàn cho production)
