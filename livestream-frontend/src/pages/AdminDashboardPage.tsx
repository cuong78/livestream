import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import MatchInfoPanel from "../components/MatchInfoPanel";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Connect to WebSocket
    connectWebSocket();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/api/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("Admin WebSocket connected");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("Admin WebSocket disconnected");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    client.activate();
    setStompClient(client);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    if (stompClient) {
      stompClient.deactivate();
    }
    navigate("/admin/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎯 Admin Dashboard</h1>
        <div style={styles.headerActions}>
          <div style={styles.connectionStatus}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: isConnected ? "#4caf50" : "#f44336",
              }}
            ></span>
            <span style={styles.statusText}>
              {isConnected ? "Đã kết nối" : "Chưa kết nối"}
            </span>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Match Info Panel */}
        {stompClient && <MatchInfoPanel stompClient={stompClient} />}

        {/* Other admin features can be added here */}
        <div style={styles.infoPanel}>
          <h3 style={styles.infoTitle}>📊 Thống Kê</h3>
          <p style={styles.infoText}>
            Các tính năng quản lý khác sẽ được thêm vào đây...
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f0f0f",
    padding: "20px",
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 30px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  title: {
    color: "#ffffff",
    margin: 0,
    fontSize: "28px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  connectionStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "20px",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  statusText: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 500,
  },
  logoutBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  infoPanel: {
    background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "20px",
  },
  infoTitle: {
    color: "#ffffff",
    margin: "0 0 10px 0",
    fontSize: "18px",
  },
  infoText: {
    color: "#aaa",
    margin: 0,
  },
};

export default AdminDashboardPage;
