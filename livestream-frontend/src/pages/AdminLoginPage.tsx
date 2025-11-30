const AdminLoginPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Coming soon...</p>
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
    backgroundColor: "#1a1a1a",
  },
  loginBox: {
    backgroundColor: "#2a2a2a",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
  },
  title: {
    marginBottom: "20px",
  },
  subtitle: {
    color: "#aaa",
  },
};

export default AdminLoginPage;
