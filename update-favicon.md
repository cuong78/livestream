# 🖼️ Hướng dẫn cập nhật Favicon từ Cloudinary

## Cách 1: Sử dụng trực tiếp URL Cloudinary (Nhanh nhất)

Cập nhật `index.html` để sử dụng trực tiếp URL Cloudinary:

```html
<link rel="icon" type="image/jpeg" href="https://res.cloudinary.com/duklfdbqf/image/upload/v1769088960/z7457929850853_bcb74ba3c41a23af4850bdca80ae7632_q6g4dl.jpg" />
```

## Cách 2: Tải về và tạo các file favicon chuẩn (Khuyến nghị)

### Bước 1: Tải hình ảnh về

```bash
# Tải hình ảnh từ Cloudinary
curl -o livestream-frontend/public/favicon-source.jpg "https://res.cloudinary.com/duklfdbqf/image/upload/v1769088960/z7457929850853_bcb74ba3c41a23af4850bdca80ae7632_q6g4dl.jpg"
```

### Bước 2: Tạo các file favicon từ hình ảnh

Bạn cần sử dụng tool để convert sang các kích thước khác nhau:

**Option A: Sử dụng online tool**
1. Vào https://favicon.io/favicon-converter/
2. Upload file `favicon-source.jpg`
3. Download và extract vào `livestream-frontend/public/`

**Option B: Sử dụng ImageMagick (nếu đã cài)**
```bash
# Convert sang PNG các kích thước
convert favicon-source.jpg -resize 32x32 favicon-32x32.png
convert favicon-source.jpg -resize 16x16 favicon-16x16.png
convert favicon-source.jpg -resize 180x180 apple-touch-icon.png
convert favicon-source.jpg -resize 192x192 android-chrome-192x192.png
convert favicon-source.jpg -resize 512x512 android-chrome-512x512.png

# Tạo favicon.ico
convert favicon-source.jpg -resize 32x32 favicon.ico
```

**Option C: Sử dụng Python với PIL**
```python
from PIL import Image

img = Image.open('favicon-source.jpg')

# Tạo các kích thước
sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512
}

for filename, size in sizes.items():
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(filename)

# Tạo favicon.ico
img32 = img.resize((32, 32), Image.Resampling.LANCZOS)
img32.save('favicon.ico', format='ICO', sizes=[(32, 32)])
```

## Cách 3: Sử dụng trực tiếp URL trong index.html (Tạm thời)

Nếu muốn nhanh, có thể cập nhật `index.html` để sử dụng trực tiếp URL Cloudinary.
