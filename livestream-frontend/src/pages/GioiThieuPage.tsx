import { Link } from "react-router-dom";
import "./GioiThieuPage.css";

function GioiThieuPage() {
  return (
    <div className="gioi-thieu-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img
              src="https://res.cloudinary.com/duklfdbqf/image/upload/v1769088960/z7457929850853_bcb74ba3c41a23af4850bdca80ae7632_q6g4dl.jpg"
              alt="Logo ÚT GÀ CHỌI"
              className="header-logo"
            />
            <div className="header-text">
              <h1>ÚT GÀ CHỌI</h1>
              <p className="header-subtitle">
                Kích vào trang chủ để xem video trực tiếp
              </p>
            </div>
          </Link>
        </div>
        <nav className="main-nav">
          <Link to="/">Trang chủ</Link>
          <Link to="/gioi-thieu" className="active">
            Giới thiệu
          </Link>
          <Link to="/quy-dinh">Quy định</Link>
          <Link to="/lien-he">Liên hệ</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <h1>Giới Thiệu ÚT GÀ CHỌI</h1>
          <p>Nơi hội tụ đam mê - Giao lưu chiến kê toàn quốc</p>
        </div>
      </section>

      {/* About Content */}
      <main className="about-content">
        <section className="about-section">
          <h2>🐓 Về Chúng Tôi</h2>
          <p>
            <strong>Út Gà Chọi</strong> (ÚT GÀ CHỌI) được thành lập với mục
            đích tạo ra một cộng đồng giao lưu, chia sẻ kinh nghiệm nuôi dưỡng
            và chăm sóc gà chọi cho những người yêu thích bộ môn này trên khắp
            cả nước. Út Gà Chọi là CLB gà chọi hàng đầu tại Phú Yên, nơi hội tụ
            đam mê của anh em yêu thích gà chọi.
          </p>
          <p>
            Út Gà Chọi tổ chức{" "}
            <strong>vần xổ gà trực tiếp lúc 18h hàng ngày</strong>, mang đến cho
            anh em những trận đấu gay cấn, hấp dẫn với chất lượng hình ảnh HD.
            Đến với Út Gà Chọi, bạn sẽ được trải nghiệm những trận đấu gà chọi
            chất lượng cao nhất.
          </p>
        </section>

        <section className="about-section">
          <h2>📍 Địa Chỉ</h2>
          <div className="address-box">
            <p>
              <strong>Thôn Hòa Đa, Xã Tuy An Nam, Tỉnh Đắk Lắk</strong>
            </p>
            <p>
              📞 Hotline/Zalo: <a href="tel:0865232980">0865232980</a>
            </p>
          </div>
        </section>

        <section className="about-section">
          <h2>🎯 Dịch Vụ Của Chúng Tôi</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📺</div>
              <h3>Livestream Xổ Gà</h3>
              <p>Trực tiếp vần xổ gà 18h hàng ngày với chất lượng HD</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🐔</div>
              <h3>Mua Bán Gà Chọi</h3>
              <p>Giao lưu mua bán gà chọi cao cấp đi các tỉnh</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🤝</div>
              <h3>Giao Lưu Cộng Đồng</h3>
              <p>Kết nối anh em đam mê gà chọi trên cả nước</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💬</div>
              <h3>Tư Vấn Chăm Sóc</h3>
              <p>Chia sẻ kinh nghiệm nuôi dưỡng, chăm sóc gà chọi</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🏆 Tại Sao Chọn Chúng Tôi?</h2>
          <ul className="why-us-list">
            <li>✅ Uy tín hàng đầu tại Phú Yên</li>
            <li>✅ Livestream chất lượng cao, ổn định</li>
            <li>✅ Cộng đồng thân thiện, giao lưu văn minh</li>
            <li>✅ Hỗ trợ tư vấn 24/7</li>
            <li>✅ Gà chọi chất lượng, đa dạng dòng</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Tham Gia Cộng Đồng Ngay!</h2>
          <div className="cta-buttons">
            <a
              href="https://zalo.me/0865232980"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-zalo"
            >
              📱 Kết Bạn Zalo
            </a>
            <a
              href="https://www.facebook.com/ut.phu.yen.bonsai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-facebook"
            >
              📘 Theo Dõi Facebook
            </a>
            <Link to="/" className="btn-watch">
              ▶️ Xem Livestream
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>
          © 2025 ÚT GÀ CHỌI - Thôn Giai Sơn, An Mỹ, Tuy An, Phú
          Yên
        </p>
        <p>
          Hotline/Zalo: <a href="tel:0865232980">0865232980</a>
        </p>
      </footer>
    </div>
  );
}

export default GioiThieuPage;
