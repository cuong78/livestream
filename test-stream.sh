#!/bin/bash
# Script test stream sau khi deploy

echo "🔍 Testing new HLS structure..."
echo ""

echo "1️⃣ Test new URL với /index.m3u8:"
ssh root@72.62.65.86 'docker exec livestream-frontend wget -qO- http://srs:8080/live/de7d95a348cb40bb9250977c822c2676/index.m3u8 | head -15'
echo ""

echo "2️⃣ Test qua Nginx (public URL):"
curl -s https://anhcuong.space/hls/live/de7d95a348cb40bb9250977c822c2676/index.m3u8 | head -15
echo ""

echo "3️⃣ Check API response:"
curl -s https://anhcuong.space/api/stream/current | python -m json.tool | grep hlsUrl
echo ""

echo "✅ Done! Nếu thấy #EXTINF thì THÀNH CÔNG! 🎉"
