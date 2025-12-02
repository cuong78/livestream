#!/bin/bash
# Script test stream sau khi deploy

echo "🔍 Testing HLS streaming..."
echo ""

echo "1️⃣ Test qua SRS HTTP server (từ host):"
ssh root@72.62.65.86 'curl -s http://localhost:8081/live/de7d95a348cb40bb9250977c822c2676.m3u8 | head -15'
echo ""

echo "2️⃣ Test qua Nginx (public URL):"
curl -s https://anhcuong.space/hls/live/de7d95a348cb40bb9250977c822c2676.m3u8 | head -15
echo ""

echo "3️⃣ Check API response:"
curl -s https://anhcuong.space/api/stream/current | python -m json.tool | grep hlsUrl
echo ""

echo "✅ Done! Nếu thấy #EXTINF và danh sách .ts files → THÀNH CÔNG! 🎉"
