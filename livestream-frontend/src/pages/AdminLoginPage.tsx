import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Check if user is admin
        if (data.user && data.user.role === "ADMIN") {
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("adminUser", JSON.stringify(data.user));
          navigate("/admin/dashboard");
        } else {
          setError("Bạn không có quyền truy cập Admin!");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 Admin Login</h1>
          <p style={styles.subtitle}>Đăng nhập tài khoản quản trị</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Nhập username"
              required
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Nhập password"
              required
            />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div style={styles.footer}>
          <button onClick={() => navigate("/")} style={styles.backButton}>
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
  },
  loginBox: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
    maxWidth: "450px",
    width: "100%",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "28px",
    color: "#2d3748",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#718096",
    margin: 0,
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#2d3748",
    fontSize: "14px",
    fontWeight: "600",
  },
  input: {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#2d3748",
    backgroundColor: "#ffffff",
    transition: "all 0.3s ease",
    outline: "none",
  },
  error: {
    backgroundColor: "#fed7d7",
    color: "#c53030",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid #fc8181",
  },
  button: {
    padding: "14px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "10px",
  },
  footer: {
    marginTop: "20px",
    textAlign: "center",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "8px",
    transition: "all 0.3s ease",
  },
};

export default AdminLoginPage;
