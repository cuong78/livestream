import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import ChatBox from "@/components/ChatBox";
import { streamApi } from "@/services/api";
import { websocketService } from "@/services/websocket";
import type { Stream, Comment } from "@/types";

const ViewerPage = () => {
  const [stream, setStream] = useState<Stream | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current stream
    const fetchStream = async () => {
      try {
        const currentStream = await streamApi.getCurrentStream();
        setStream(currentStream);
        setLoading(false);
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  if (!stream || stream.status !== "LIVE") {
    return (
      <div style={styles.offlineContainer}>
        <div style={styles.offlineIcon}>📡</div>
        <h2>Stream đang offline</h2>
        <p style={styles.offlineText}>
          Hiện tại không có stream nào đang phát. Vui lòng quay lại sau.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🔴 {stream.title || "Live Stream"}</h1>
        <div style={styles.viewerCount}>
          👥 {stream.viewerCount || 0} người đang xem
        </div>
      </header>

      <div style={styles.content}>
        {/* Desktop layout */}
        <div style={styles.desktopLayout}>
          <div style={styles.videoSection}>
            <VideoPlayer hlsUrl={stream.hlsUrl} />
            {stream.description && (
              <div style={styles.description}>{stream.description}</div>
            )}
          </div>
          <div style={styles.chatSection}>
            <ChatBox comments={comments} onSendComment={handleSendComment} />
          </div>
        </div>

        {/* Mobile layout - Video on top, chat below */}
        <div style={styles.mobileLayout}>
          <div style={styles.videoMobile}>
            <VideoPlayer hlsUrl={stream.hlsUrl} />
          </div>
          <div style={styles.chatMobile}>
            <ChatBox comments={comments} onSendComment={handleSendComment} />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  },
  header: {
    padding: "20px",
    backgroundColor: "#2a2a2a",
    borderBottom: "2px solid #3a3a3a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: 0,
  },
  viewerCount: {
    fontSize: "16px",
    color: "#aaa",
  },
  content: {
    padding: "20px",
  },
  desktopLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "20px",
    height: "calc(100vh - 120px)",
  },
  mobileLayout: {
    display: "none",
  },
  videoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  description: {
    padding: "16px",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
  },
  chatSection: {
    height: "100%",
  },
  videoMobile: {},
  chatMobile: {
    height: "500px",
    marginTop: "20px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    fontSize: "24px",
    color: "#ffffff",
  },
  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
  },
  errorText: {
    fontSize: "20px",
    color: "#ff4444",
  },
  offlineContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    textAlign: "center",
    padding: "20px",
  },
  offlineIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  offlineText: {
    color: "#aaa",
    marginTop: "10px",
  },
};

// Add media query via style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @media (max-width: 768px) {
    [style*="desktopLayout"] {
      display: none !important;
    }
    [style*="mobileLayout"] {
      display: block !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ViewerPage;
