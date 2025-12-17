import { Link } from "react-router-dom";
import "./LienHePage.css";

function LienHePage() {
  return (
    <div className="lien-he-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <Link to="/trang-chu" className="logo-link">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1764830389/z7291002414848_46cd0bf4b57be31aa45972704457e36c_cwe4me.jpg"
              alt="Logo CLB Gà Chọi Long Thần Sói"
              className="header-logo"
            />
            <div className="header-text">
              <h1>CLB Gà Chọi Long Thần Sói</h1>
              <p className="header-subtitle">
                Kích vào trang chủ để xem video trực tiếp
              </p>
            </div>
          </Link>
        </div>
        <nav className="main-nav">
          <Link to="/trang-chu">Trang chủ</Link>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/quy-dinh">Quy định</Link>
          <Link to="/lien-he" className="active">
            Liên hệ
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>📞 Liên Hệ Với Chúng Tôi</h1>
          <p>Sẵn sàng hỗ trợ anh em 24/7</p>
        </div>
      </section>

      {/* Contact Content */}
      <main className="contact-content">
        {/* Main Contact Info */}
        <section className="contact-main">
          <div className="contact-card hotline">
            <div className="card-icon">📞</div>
            <h2>Hotline / Zalo</h2>
            <a href="tel:0869801559" className="phone-number">
              0869 801 559
            </a>
            <p>Gọi điện hoặc nhắn Zalo để được tư vấn nhanh nhất</p>
            <a
              href="https://zalo.me/0869801559"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contact btn-zalo"
            >
              💬 Nhắn Zalo Ngay
            </a>
          </div>

          <div className="contact-card address">
            <div className="card-icon">📍</div>
            <h2>Địa Chỉ</h2>
            <p className="address-text">
              <strong>Thôn Giai Sơn, An Mỹ, Tuy An, Phú Yên</strong>
            </p>
            <p>Anh em có thể đến trực tiếp xem gà và giao lưu</p>
            <a
              href="https://maps.google.com/?q=Thôn+Giai+Sơn,+An+Mỹ,+Tuy+An,+Phú+Yên"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contact btn-map"
            >
              🗺️ Xem Bản Đồ
            </a>
          </div>

          <div className="contact-card schedule">
            <div className="card-icon">⏰</div>
            <h2>Lịch Livestream</h2>
            <div className="schedule-time">
              <span className="time">18:00</span>
              <span className="period">Hàng Ngày</span>
            </div>
            <p>Vần xổ gà trực tiếp mỗi ngày</p>
            <Link to="/trang-chu" className="btn-contact btn-watch">
              ▶️ Xem Ngay
            </Link>
          </div>
        </section>

        {/* Social Links */}
        <section className="social-section">
          <h2>🌐 Kết Nối Mạng Xã Hội</h2>
          <div className="social-grid">
            <a
              href="https://zalo.me/0869801559"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card zalo"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771851/zalo1_fwawgm.png"
                alt="Zalo"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Zalo Cá Nhân</h3>
                <p>Kết bạn để giao lưu mua bán</p>
              </div>
            </a>

            <a
              href="https://zalo.me/g/qrrpoi053"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card zalo-group"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771858/zalo-vip-1_yx9lgh.png"
                alt="Nhóm Zalo VIP"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Nhóm Zalo VIP</h3>
                <p>Tham gia nhóm VIP tuyển gà chiến</p>
              </div>
            </a>

            <a
              href="https://www.facebook.com/ganhdua.trai"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card facebook"
            >
              <img
                src="https://res.cloudinary.com/duklfdbqf/image/upload/v1765771846/fb-1_xfr0sa.png"
                alt="Facebook"
                className="social-icon"
              />
              <div className="social-info">
                <h3>Facebook Fanpage</h3>
                <p>Theo dõi để nhận thông báo mới</p>
              </div>
            </a>
          </div>
        </section>

        {/* Bank Info */}
        <section className="bank-section">
          <h2>💳 Thông Tin Chuyển Khoản</h2>
          <div className="bank-card">
            <div className="bank-logo">🏦</div>
            <div className="bank-info">
              <p className="bank-name">Ngân hàng MB (MBBank)</p>
              <p className="account-number">0869801559</p>
              <p className="account-holder">VŨ THỊ MAI THẢO</p>
            </div>
            <button
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText("0869801559");
                alert("Đã sao chép số tài khoản!");
              }}
            >
              📋 Sao Chép STK
            </button>
          </div>
          <p className="bank-note">
            * Nội dung chuyển khoản ghi: [Tên] + [SĐT] + [Nội dung giao dịch]
          </p>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <h2>❓ Câu Hỏi Thường Gặp</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Làm sao để mua gà?</h3>
              <p>
                Anh em liên hệ trực tiếp qua Zalo 0869801559 để được tư vấn và
                xem gà. Hỗ trợ giao gà đi các tỉnh.
              </p>
            </div>
            <div className="faq-item">
              <h3>Livestream lúc mấy giờ?</h3>
              <p>
                Vần xổ gà trực tiếp lúc 18h hàng ngày. Anh em vào trang chủ để
                xem.
              </p>
            </div>
            <div className="faq-item">
              <h3>Có ship gà đi tỉnh không?</h3>
              <p>
                Có, chúng tôi hỗ trợ giao gà đi các tỉnh. Chi phí vận chuyển
                theo thỏa thuận.
              </p>
            </div>
            <div className="faq-item">
              <h3>Làm sao tham gia nhóm Zalo VIP?</h3>
              <p>
                Click vào nút "Nhóm Zalo VIP" ở trên hoặc liên hệ hotline để
                được thêm vào nhóm.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Liên Hệ Ngay Hôm Nay!</h2>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ anh em</p>
          <div className="cta-buttons">
            <a href="tel:0869801559" className="btn-call">
              📞 Gọi Ngay: 0869 801 559
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

export default LienHePage;
