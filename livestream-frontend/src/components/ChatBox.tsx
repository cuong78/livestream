import { useState, useEffect, useRef } from "react";
import type { Comment } from "@/types";

interface ChatBoxProps {
  comments: Comment[];
  onSendComment: (comment: Comment) => void;
}

const DISPLAY_NAME_KEY = "livestream_display_name";

const ChatBox: React.FC<ChatBoxProps> = ({ comments, onSendComment }) => {
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load display name from localStorage
    const savedName = localStorage.getItem(DISPLAY_NAME_KEY);
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  useEffect(() => {
    // Auto scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim() || !content.trim()) {
      return;
    }

    // Save display name to localStorage
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);

    // Send comment
    onSendComment({
      displayName: displayName.trim(),
      content: content.trim(),
    });

    // Clear content but keep display name
    setContent("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>💬 Chat trực tiếp</h3>
      </div>

      <div style={styles.messagesContainer}>
        {comments.length === 0 ? (
          <div style={styles.emptyState}>
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} style={styles.message}>
              <div style={styles.messageName}>{comment.displayName}</div>
              <div style={styles.messageContent}>{comment.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Tên hiển thị"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={styles.input}
          maxLength={50}
        />
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Nhập bình luận..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
            maxLength={500}
          />
          <button type="submit" style={styles.sendButton}>
            Gửi
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    padding: "16px",
    backgroundColor: "#1a1a1a",
    borderBottom: "2px solid #3a3a3a",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    textAlign: "center",
    color: "#888",
    padding: "40px 20px",
  },
  message: {
    padding: "8px 12px",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    borderLeft: "3px solid #007bff",
  },
  messageName: {
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "4px",
    fontSize: "14px",
  },
  messageContent: {
    color: "#ffffff",
    wordWrap: "break-word",
    fontSize: "14px",
  },
  form: {
    padding: "16px",
    backgroundColor: "#1a1a1a",
    borderTop: "2px solid #3a3a3a",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
  },
  input: {
    padding: "10px 12px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #3a3a3a",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  sendButton: {
    padding: "10px 24px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

export default ChatBox;
