const AdminDashboardPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1>Admin Dashboard</h1>
        <p style={styles.subtitle}>Coming soon...</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    padding: "20px",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#ffffff",
  },
  subtitle: {
    color: "#aaa",
    marginTop: "10px",
  },
};

export default AdminDashboardPage;
