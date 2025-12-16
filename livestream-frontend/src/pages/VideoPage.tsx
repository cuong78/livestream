import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./VideoPage.css";

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
  date: string;
}

function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    // Fetch videos from API
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "https://api.gachoilongthansoi.com"
          }/api/recordings`
        );
        if (response.ok) {
          const data = await response.json();
          setVideos(data);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="video-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764830389/z7291002414848_46cd0bf4b57be31aa45972704457e36c_cwe4me.jpg"
              alt="Logo CLB Gà Chọi Long Thần Sói"
              className="header-logo"
            />
            <h1>CLB Gà Chọi Long Thần Sói</h1>
          </Link>
        </div>
        <nav className="main-nav">
          <Link to="/">Trang chủ</Link>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/quy-dinh">Quy định</Link>
          <Link to="/video" className="active">
            Video
          </Link>
          <Link to="/lien-he">Liên hệ</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>▶️ Video Xem Lại</h1>
          <p>Tổng hợp các trận xổ gà hay nhất</p>
        </div>
      </section>

      {/* Video Content */}
      <main className="video-content">
        {/* Live Now Banner */}
        <section className="live-banner">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
          <p>Xổ gà trực tiếp lúc 18h hàng ngày</p>
          <Link to="/" className="btn-watch-live">
            Xem Trực Tiếp Ngay
          </Link>
        </section>

        {/* Video Grid */}
        <section className="video-section">
          <h2>📹 Danh Sách Video</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải video...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📹</div>
              <h3>Chưa có video nào</h3>
              <p>Các video xổ gà sẽ được cập nhật sau mỗi buổi livestream</p>
              <Link to="/" className="btn-watch-live">
                Xem Livestream Ngay
              </Link>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="video-card"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="video-thumbnail">
                    <img src={video.thumbnail} alt={video.title} />
                    <span className="video-duration">{video.duration}</span>
                    <div className="play-overlay">
                      <span className="play-icon">▶</span>
                    </div>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p className="video-date">📅 {formatDate(video.date)}</p>
                    <p className="video-desc">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Video Modal */}
        {selectedVideo && (
          <div className="video-modal" onClick={() => setSelectedVideo(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-btn"
                onClick={() => setSelectedVideo(null)}
              >
                ✕
              </button>
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                className="modal-video"
              />
              <div className="modal-info">
                <h3>{selectedVideo.title}</h3>
                <p>{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <section className="info-section">
          <h2>📺 Về Video Xem Lại</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🎬</div>
              <h3>Chất Lượng HD</h3>
              <p>Tất cả video được ghi lại với chất lượng cao, rõ nét</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📅</div>
              <h3>Cập Nhật Hàng Ngày</h3>
              <p>Video được upload sau mỗi buổi livestream xổ gà</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🆓</div>
              <h3>Miễn Phí</h3>
              <p>Xem video hoàn toàn miễn phí, không giới hạn</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Đừng Bỏ Lỡ Trận Đấu Nào!</h2>
          <p>Theo dõi kênh để nhận thông báo mỗi khi có livestream mới</p>
          <div className="cta-buttons">
            <a
              href="https://zalo.me/0869801559"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-zalo"
            >
              📱 Theo Dõi Zalo
            </a>
            <a
              href="https://www.facebook.com/ganhdua.trai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-facebook"
            >
              📘 Theo Dõi Facebook
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>
          © 2025 CLB Gà Chọi Long Thần Sói - Thôn Giai Sơn, An Mỹ, Tuy An, Phú
          Yên
        </p>
        <p>
          Hotline/Zalo: <a href="tel:0869801559">0869 801 559</a>
        </p>
      </footer>
    </div>
  );
}

export default VideoPage;
