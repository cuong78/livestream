import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import ChatBox from "@/components/ChatBox";
import { streamApi } from "@/services/api";
import { websocketService } from "@/services/websocket";
import type { Stream, Comment } from "@/types";
import "./ViewerPage.css";

const ViewerPage = () => {
  const [stream, setStream] = useState<Stream | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState("HD1");
  const [showIntro, setShowIntro] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    // Fetch current stream
    const fetchStream = async () => {
      try {
        const currentStream = await streamApi.getCurrentStream();
        setStream(currentStream);
        setLoading(false);

        // Fetch existing comments after stream is loaded
        const existingComments = await streamApi.getCurrentStreamComments();
        if (existingComments.length > 0) {
          setComments(existingComments);
        }
      } catch (err) {
        setError("Không thể tải stream. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchStream();

    // Connect WebSocket for real-time comments
    websocketService.connect((comment) => {
      setComments((prev) => [...prev, comment]);
    });

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const handleSendComment = (comment: Comment) => {
    websocketService.sendComment(comment);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const copyBankAccount = () => {
    navigator.clipboard.writeText("0966689355");
    alert("Đã sao chép số tài khoản!");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{error}</div>
        <button className="btn-reload" onClick={handleReload}>
          Tải lại trang
        </button>
      </div>
    );
  }

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="viewer-page">
      {/* Header with Logo */}
      <header className="site-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521032/logo_delivf.jpg"
                alt="CLB Gà Chọi Cao Đổi"
                className="logo"
              />
              <div className="site-title">
                <h1>CLB GÀ CHỌI CAO ĐỔI</h1>
                <p className="subtitle">Tinh Hoa Việt</p>
              </div>
            </div>
            <button
              className="menu-toggle"
              onClick={() => setShowIntro(!showIntro)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="main-nav">
        <div className="container">
          <button onClick={() => setShowIntro(true)} className="nav-link">
            Giới thiệu
          </button>
          <button onClick={() => setShowRules(true)} className="nav-link">
            Nội Quy Xổ Gà
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Live Stream Title */}
        <div className="stream-header">
          <h2 className="stream-title">
            Xổ gà Server {activeServer} trực tiếp 18h ngày {getCurrentDate()}
          </h2>

          {/* Server Selection */}
          <div className="server-selection">
            <span className="server-label">Đổi Server:</span>
            {["HD1", "HD2", "HD3", "HD4"].map((server) => (
              <button
                key={server}
                className={`server-btn ${
                  activeServer === server ? "active" : ""
                }`}
                onClick={() => setActiveServer(server)}
              >
                {server}
              </button>
            ))}
            <a href="tel:0387683857" className="phone-btn">
              📞
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-content">
          {/* Video Player Section */}
          <div className="video-section">
            {!stream || stream.status !== "LIVE" ? (
              <div className="video-placeholder">
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521034/anhbia_wmfcto.png"
                  alt="CLB Gà Chọi Cao Đổi"
                  className="cover-image"
                />
                <div className="offline-overlay">
                  <div className="offline-icon">📡</div>
                  <h3>STREAM ĐANG OFFLINE</h3>
                  <p>Vần xổ gà trực tiếp 18h hàng ngày</p>
                  <button className="btn-reload" onClick={handleReload}>
                    🔄 LOAD LẠI TRANG
                  </button>
                  <div className="phone-contact">
                    📱 <a href="tel:0387683857">0387683857</a>
                  </div>
                </div>
              </div>
            ) : (
              <VideoPlayer hlsUrl={stream.hlsUrl} />
            )}

            {/* Warning Banner */}
            <div className="warning-banner">
              <span className="warning-icon">⛔</span>
              <strong>CẤM CÁ CƯỢC, CHỬI THỀ, KHOÁ NICK!</strong>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <ChatBox comments={comments} onSendComment={handleSendComment} />
          </div>
        </div>

        {/* Contact Section */}
        <section className="contact-section">
          <h2 className="section-title">Kết Nối Đam Mê</h2>
          <div className="contact-card">
            <div className="phone-display">
              <a href="tel:0387683857" className="phone-number">
                0387 683 857
              </a>
              <p className="contact-label">Hotline/Zalo liên hệ</p>
            </div>

            <div className="social-links">
              <a
                href="https://zalo.me/0387683857"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn zalo-personal"
              >
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521032/zalo_c2phtl.jpg"
                  alt="Zalo"
                  className="zalo-qr"
                />
                <span>AE KẾT BẠN ZALO</span>
                <small>📱 Giao Lưu Mua Bán Chiến Kê Trên Cả Nước</small>
              </a>

              <a
                href="https://zalo.me/g/knfyuk510"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn zalo-group"
              >
                <span>NHÓM VIP ZALO</span>
                <small>AE Vào Nhóm VIP Tuyển Gà Chiến Nhé!</small>
              </a>

              <a
                href="https://www.facebook.com/ang.cuong.77"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn facebook"
              >
                <span>AE KẾT BẠN FACEBOOK</span>
                <small>📱 Giao Lưu Mua Bán Chiến Kê Trên Cả Nước</small>
              </a>
            </div>

            <div className="address-info">
              <p>
                📍 <strong>Địa chỉ:</strong> Ngọc Lâm 2, Hòa Mỹ Tây, Tây Hòa,
                Phú Yên
              </p>
            </div>
          </div>
        </section>

        {/* Bank Info Section */}
        <section className="bank-section">
          <div className="bank-card">
            <div className="bank-icon">💳</div>
            <h3>Thông Tin Chuyển Khoản</h3>
            <div className="bank-details">
              <p>
                <strong>Ngân hàng Vietcombank</strong>
              </p>
              <p>
                Tên người nhận: <strong>Cao Văn Đổi</strong>
              </p>
              <p>
                Số tài khoản: <strong>0966689355</strong>
              </p>
              <button className="btn-copy" onClick={copyBankAccount}>
                📋 Sao chép STK
              </button>
            </div>
          </div>
        </section>

        {/* Rules Section */}
        <section className="rules-section">
          <div className="rules-card">
            <div className="rules-icon">⚠️</div>
            <h3>Quy định</h3>
            <ul className="rules-list">
              <li>
                <span className="check-icon">☑️</span>
                Xổ Gà Mua Bán Trên Tinh Thần Giao Lưu Vui Vẻ, Lịch Sự Trên Live
                Chat
              </li>
              <li>
                <span className="ban-icon">🚫</span>
                Không Để Số Điện Thoại, Không Cá Cược Dưới Mọi Hình Thức
              </li>
            </ul>
            <button
              className="btn-chat"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              💬 Chat Ngay
            </button>
          </div>
        </section>

        {/* Video Archive Section */}
        <section className="video-archive">
          <h2 className="section-title">
            <span className="play-icon">▶️</span>
            VIDEO XEM LẠI
          </h2>
          <p className="archive-desc">
            Nơi lưu trữ các video vần xổ gà chọi được quay trực tiếp hàng ngày
            18h tại Ngọc Lâm 2, Hòa Mỹ Tây, Tây Hòa, Phú Yên
          </p>

          <div className="video-grid">
            {[
              {
                date: "30/11/2025",
                title: "Video Xem Lại Tối 30/11 – CLB Gà Chọi Cao Đổi",
              },
              {
                date: "29/11/2025",
                title: "Video Xem Lại Tối 29/11 – CLB Gà Chọi Cao Đổi",
              },
              {
                date: "28/11/2025",
                title: "Video Xem Lại Tối 28/11 – CLB Gà Chọi Cao Đổi",
              },
              {
                date: "27/11/2025",
                title: "Video Xem Lại Tối 27/11 – CLB Gà Chọi Cao Đổi",
              },
            ].map((video, index) => (
              <div key={index} className="video-card">
                <div className="video-thumbnail">
                  <img
                    src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521034/anhbia_wmfcto.png"
                    alt={video.title}
                  />
                  <div className="play-overlay">▶️</div>
                </div>
                <div className="video-info">
                  <h4>{video.title}</h4>
                  <p className="video-date">{video.date}</p>
                  <span className="video-category">VIDEO XỔ GÀ XEM LẠI</span>
                </div>
              </div>
            ))}
          </div>

          <div className="archive-note">
            <p>
              <strong>XEM LIVE HÔM NAY</strong> - Truy cập trực tiếp để xem vần
              xổ gà diễn ra lúc 18h hàng ngày
            </p>
          </div>
        </section>

        {/* Introduction Modal */}
        {showIntro && (
          <div className="modal-overlay" onClick={() => setShowIntro(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowIntro(false)}
              >
                ✕
              </button>
              <div className="modal-header">
                <img
                  src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521032/logo_delivf.jpg"
                  alt="Logo"
                  className="modal-logo"
                />
                <h2>Giới thiệu</h2>
              </div>
              <div className="modal-body">
                <p>
                  • Chào mừng bạn đến với <strong>gachoicaodoi.com</strong> nơi
                  tạo ra sân chơi phục vụ niềm đam mê gà đòn cho anh em 24/7.
                  Đây là website của CLB Gà Chọi Cao Đổi
                </p>
                <p>
                  • Tại CLB Gà Chọi Cao Đổi bạn có thể tìm hiểu về kiến thức về
                  gà đòn, hay đơn giản là thưởng thức những video xổ gà trong
                  những lúc rảnh rỗi. CLB Gà Chọi Cao Đổi sẽ đưa đến cho bạn
                  những thông tin mới nhất về giống gà đòn, kinh nghiệm chăm sóc
                  gà, cách huấn luyện gà chọi và nhiều hơn thế nữa.
                </p>
                <p>
                  • <strong>gachoicaodoi.com</strong> còn cung cấp con giống gà
                  đòn cho những ai đang quan tâm đến việc nuôi gà đòn.
                </p>
                <div className="intro-images">
                  <img
                    src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764521034/anhbia_wmfcto.png"
                    alt="CLB Gà Chọi"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRules && (
          <div className="modal-overlay" onClick={() => setShowRules(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowRules(false)}
              >
                ✕
              </button>
              <div className="modal-header">
                <h2>⚠️ Nội Quy Xổ Gà</h2>
              </div>
              <div className="modal-body">
                <ul className="rules-list-detail">
                  <li>
                    <strong>☑️ Tinh thần giao lưu:</strong> Xổ Gà Mua Bán Trên
                    Tinh Thần Giao Lưu Vui Vẻ, Lịch Sự Trên Live Chat
                  </li>
                  <li>
                    <strong>🚫 Không cá cược:</strong> Không Để Số Điện Thoại,
                    Không Cá Cược Dưới Mọi Hình Thức
                  </li>
                  <li>
                    <strong>🚫 Không chửi thề:</strong> Tuyệt đối không sử dụng
                    ngôn từ thiếu văn hóa, xúc phạm người khác
                  </li>
                  <li>
                    <strong>⛔ Vi phạm sẽ bị khoá nick:</strong> Mọi hành vi vi
                    phạm sẽ bị khoá tài khoản vĩnh viễn
                  </li>
                </ul>
                <p className="disclaimer">
                  <strong>Lưu ý pháp lý:</strong> Website CLB Gà Chọi Cao Đổi
                  hoạt động với hình thức giải trí, vui lòng không cá độ dưới
                  mọi hình thức vi phạm pháp luật Việt Nam.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>CLB Gà Chọi Cao Đổi</h3>
              <ul>
                <li>• Vần xổ gà trực tiếp 18h hàng ngày</li>
                <li>• Giao lưu mua bán gà chọi đi các tỉnh</li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>
                <a href="tel:0387683857">0387 683 857</a>
              </h3>
              <p>Ngọc Lâm 2, Hòa Mỹ Tây, Tây Hòa, Phú Yên</p>
            </div>
            <div className="footer-col">
              <h3>Quy Định</h3>
              <ul>
                <li>
                  • Website CLB Gà Chọi Cao Đổi hoạt động với hình thức giải
                  trí, vui lòng không cá độ dưới mọi hình thức vi phạm pháp luật
                  Việt Nam
                </li>
                <li>
                  • Xổ Gà Mua Bán Trên Tinh Thần Giao Lưu Vui Vẻ, Lịch Sự trên
                  Live Chat
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Thiết kế bởi Anh Cương - ĐT/Zalo tư vấn liên hệ: 0387683857</p>
            <p>Bản quyền thuộc về CLB Gà Chọi Cao Đổi © 2025</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="floating-buttons">
        <a href="tel:0387683857" className="fab-btn fab-phone" title="Gọi Ngay">
          <span className="fab-icon">📞</span>
          <span className="fab-text">Gọi Ngay</span>
        </a>
        <a
          href="https://zalo.me/0387683857"
          target="_blank"
          rel="noopener noreferrer"
          className="fab-btn fab-zalo"
          title="Zalo"
        >
          <span className="fab-icon">💬</span>
          <span className="fab-text">Zalo</span>
        </a>
        <a
          href="https://zalo.me/g/knfyuk510"
          target="_blank"
          rel="noopener noreferrer"
          className="fab-btn fab-zalo-vip"
          title="Zalo VIP"
        >
          <span className="fab-icon">👑</span>
          <span className="fab-text">Zalo VIP</span>
        </a>
      </div>
    </div>
  );
};

export default ViewerPage;
