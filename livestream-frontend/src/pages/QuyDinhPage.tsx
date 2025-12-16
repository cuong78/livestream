import { Link } from "react-router-dom";
import "./QuyDinhPage.css";

function QuyDinhPage() {
  return (
    <div className="quy-dinh-page">
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
          <Link to="/quy-dinh" className="active">
            Quy định
          </Link>
          <Link to="/video">Video</Link>
          <Link to="/lien-he">Liên hệ</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>⚠️ Quy Định & Nội Quy</h1>
          <p>Vui lòng đọc kỹ trước khi tham gia cộng đồng</p>
        </div>
      </section>

      {/* Rules Content */}
      <main className="rules-content">
        {/* Quy định chung */}
        <section className="rules-section">
          <h2>📋 Quy Định Chung</h2>
          <div className="rules-list">
            <div className="rule-item allowed">
              <span className="rule-icon">✅</span>
              <div className="rule-text">
                <h3>Giao lưu văn minh</h3>
                <p>
                  Xổ gà mua bán trên tinh thần giao lưu vui vẻ, lịch sự trên
                  Live Chat
                </p>
              </div>
            </div>
            <div className="rule-item allowed">
              <span className="rule-icon">✅</span>
              <div className="rule-text">
                <h3>Tôn trọng lẫn nhau</h3>
                <p>
                  Anh em tham gia cần giữ thái độ tôn trọng, không xúc phạm
                  người khác
                </p>
              </div>
            </div>
            <div className="rule-item allowed">
              <span className="rule-icon">✅</span>
              <div className="rule-text">
                <h3>Chia sẻ kinh nghiệm</h3>
                <p>
                  Khuyến khích chia sẻ kinh nghiệm nuôi dưỡng, chăm sóc gà chọi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Điều cấm */}
        <section className="rules-section warning">
          <h2>🚫 Điều Cấm</h2>
          <div className="rules-list">
            <div className="rule-item banned">
              <span className="rule-icon">❌</span>
              <div className="rule-text">
                <h3>Không để số điện thoại</h3>
                <p>Không được để số điện thoại trong phần chat livestream</p>
              </div>
            </div>
            <div className="rule-item banned">
              <span className="rule-icon">❌</span>
              <div className="rule-text">
                <h3>Không cá cược</h3>
                <p>
                  Nghiêm cấm mọi hình thức cá cược, đánh bạc dưới mọi hình thức
                </p>
              </div>
            </div>
            <div className="rule-item banned">
              <span className="rule-icon">❌</span>
              <div className="rule-text">
                <h3>Không spam</h3>
                <p>Không spam tin nhắn, quảng cáo trong phần chat</p>
              </div>
            </div>
            <div className="rule-item banned">
              <span className="rule-icon">❌</span>
              <div className="rule-text">
                <h3>Không ngôn từ thô tục</h3>
                <p>Không sử dụng ngôn từ thô tục, xúc phạm, kích động</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quy định mua bán */}
        <section className="rules-section">
          <h2>🐓 Quy Định Mua Bán Gà</h2>
          <div className="rules-list">
            <div className="rule-item info">
              <span className="rule-icon">📞</span>
              <div className="rule-text">
                <h3>Liên hệ trực tiếp</h3>
                <p>
                  Mọi giao dịch mua bán vui lòng liên hệ trực tiếp qua Zalo:
                  0869 801 559
                </p>
              </div>
            </div>
            <div className="rule-item info">
              <span className="rule-icon">📍</span>
              <div className="rule-text">
                <h3>Xem gà trực tiếp</h3>
                <p>
                  Khuyến khích anh em đến trực tiếp xem gà tại Thôn Giai Sơn, An
                  Mỹ, Tuy An, Phú Yên
                </p>
              </div>
            </div>
            <div className="rule-item info">
              <span className="rule-icon">🚚</span>
              <div className="rule-text">
                <h3>Giao gà các tỉnh</h3>
                <p>
                  Hỗ trợ giao gà đi các tỉnh, chi phí vận chuyển theo thỏa thuận
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lịch livestream */}
        <section className="rules-section schedule">
          <h2>⏰ Lịch Livestream</h2>
          <div className="schedule-box">
            <div className="schedule-time">
              <span className="time">18:00</span>
              <span className="period">Hàng ngày</span>
            </div>
            <p>Vần xổ gà trực tiếp mỗi ngày lúc 18h. Anh em nhớ theo dõi!</p>
          </div>
        </section>

        {/* Xử lý vi phạm */}
        <section className="rules-section violation">
          <h2>⚖️ Xử Lý Vi Phạm</h2>
          <div className="violation-list">
            <div className="violation-item">
              <span className="level">Lần 1</span>
              <span className="action">Cảnh cáo</span>
            </div>
            <div className="violation-item">
              <span className="level">Lần 2</span>
              <span className="action">Mute 24 giờ</span>
            </div>
            <div className="violation-item">
              <span className="level">Lần 3</span>
              <span className="action">Ban vĩnh viễn</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Đã Đọc Và Đồng Ý Quy Định?</h2>
          <p>Tham gia cộng đồng gà chọi lớn nhất Phú Yên ngay!</p>
          <div className="cta-buttons">
            <Link to="/" className="btn-watch">
              ▶️ Xem Livestream Ngay
            </Link>
            <a
              href="https://zalo.me/g/qrrpoi053"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-zalo"
            >
              📱 Tham Gia Nhóm Zalo VIP
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

export default QuyDinhPage;
