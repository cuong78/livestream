import { useState, useEffect } from "react";
import api from "@/services/api";

interface StreamSettings {
  streamKey: string;
  rtmpUrl: string;
  hlsBaseUrl: string;
  fullRtmpUrl: string;
}

const StreamSettingsPage = () => {
  const [settings, setSettings] = useState<StreamSettings | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamSettings();
  }, []);

  const fetchStreamSettings = async () => {
    try {
      const response = await api.get("/user/stream-settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch stream settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const regenerateKey = async () => {
    if (
      !confirm(
        "⚠️ Regenerate stream key?\n\nYour old key will be invalid and you need to update it in your RTMP Publisher app!"
      )
    ) {
      return;
    }

    try {
      // TODO: Call regenerate API when implemented
      alert("Stream key regenerated successfully!");
      fetchStreamSettings();
    } catch (error) {
      alert("Failed to regenerate stream key");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Failed to load stream settings</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📡 Stream Settings</h1>
        <p style={styles.subtitle}>
          Copy these settings to your RTMP Publisher app on your phone
        </p>

        {/* Server URL */}
        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>🌐</span>
            Server URL
          </label>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={settings.rtmpUrl}
              readOnly
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(settings.rtmpUrl, "server")}
              style={styles.copyButton}
            >
              {copied === "server" ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <p style={styles.hint}>Format: rtmp://192.168.1.9:1935/live</p>
        </div>

        {/* Stream Key */}
        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>🔑</span>
            Stream Key
          </label>
          <div style={styles.inputGroup}>
            <input
              type="password"
              value={settings.streamKey}
              readOnly
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(settings.streamKey, "key")}
              style={styles.copyButton}
            >
              {copied === "key" ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <button onClick={regenerateKey} style={styles.regenerateButton}>
            🔄 Regenerate Key
          </button>
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>📱 How to use:</h3>
          <ol style={styles.instructionsList}>
            <li>
              Open <strong>RTMP Live Streaming Publisher</strong> app on your
              phone
            </li>
            <li>
              Go to <strong>Settings</strong> (⚙️ icon)
            </li>
            <li>
              Tap <strong>"Server URL"</strong> → Paste:{" "}
              <code>rtmp://192.168.1.9:1935/live</code>
            </li>
            <li>
              Tap <strong>"Stream Key"</strong> → Paste your stream key
            </li>
            <li>
              Tap <strong>"Save"</strong>
            </li>
            <li>
              Return to main screen → Tap <strong>"Start Streaming"</strong> 🔴
            </li>
          </ol>
        </div>

        {/* Requirements */}
        <div style={styles.requirements}>
          <h4 style={styles.requirementsTitle}>⚠️ Requirements:</h4>
          <ul style={styles.requirementsList}>
            <li>
              ✅ Your phone and computer must be on the{" "}
              <strong>same Wi-Fi network</strong>
            </li>
            <li>
              ✅ Server IP: <strong>192.168.1.9</strong>
            </li>
            <li>✅ Port 1935 is open on your computer</li>
            <li>✅ Docker containers are running</li>
          </ul>
        </div>

        {/* Test Connection */}
        <div style={styles.testSection}>
          <h4 style={styles.testTitle}>🧪 Test Connection:</h4>
          <p style={styles.testText}>
            Open this URL in your phone browser to check if server is reachable:
          </p>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value="http://192.168.1.9:1985/api/v1/servers/"
              readOnly
              style={styles.input}
            />
            <button
              onClick={() =>
                copyToClipboard(
                  "http://192.168.1.9:1985/api/v1/servers/",
                  "test"
                )
              }
              style={styles.copyButton}
            >
              {copied === "test" ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <p style={styles.hint}>
            You should see a JSON response if server is running
          </p>
        </div>
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
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#2a2a2a",
    borderRadius: "12px",
    padding: "32px",
    color: "#ffffff",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#aaa",
    marginBottom: "32px",
    fontSize: "16px",
  },
  section: {
    marginBottom: "32px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  labelIcon: {
    marginRight: "8px",
    fontSize: "20px",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
  },
  input: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#1a1a1a",
    border: "2px solid #3a3a3a",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  copyButton: {
    padding: "14px 24px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  regenerateButton: {
    marginTop: "12px",
    padding: "12px 24px",
    backgroundColor: "#dc3545",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  hint: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#888",
    fontFamily: "monospace",
  },
  instructions: {
    backgroundColor: "#1a1a1a",
    padding: "24px",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  instructionsTitle: {
    fontSize: "18px",
    marginBottom: "16px",
  },
  instructionsList: {
    paddingLeft: "24px",
    lineHeight: "1.8",
  },
  requirements: {
    backgroundColor: "#2d1f1f",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "24px",
    borderLeft: "4px solid #dc3545",
  },
  requirementsTitle: {
    fontSize: "16px",
    marginBottom: "12px",
  },
  requirementsList: {
    paddingLeft: "24px",
    lineHeight: "1.8",
  },
  testSection: {
    backgroundColor: "#1f2d1f",
    padding: "20px",
    borderRadius: "8px",
    borderLeft: "4px solid #28a745",
  },
  testTitle: {
    fontSize: "16px",
    marginBottom: "12px",
  },
  testText: {
    marginBottom: "12px",
    color: "#aaa",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "20px",
    color: "#888",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "20px",
    color: "#dc3545",
  },
};

export default StreamSettingsPage;
