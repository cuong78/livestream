import { useState, useEffect, useRef } from "react";
import type { Comment } from "@/types";
import "./ChatBox.css";

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
    <div className="chatbox-container">
      <div className="chatbox-header">
        <h3>💬 Chat trực tiếp</h3>
        <span className="live-indicator">🔴 LIVE</span>
      </div>

      <div className="chatbox-messages">
        {comments.length === 0 ? (
          <div className="chatbox-empty">
            <span className="empty-icon">💭</span>
            <p>Chưa có bình luận nào</p>
            <p className="empty-subtext">Hãy là người đầu tiên!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} className="chat-message">
              <div className="message-avatar">
                {comment.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="message-content-wrapper">
                <div className="message-name">{comment.displayName}</div>
                <div className="message-text">{comment.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chatbox-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="👤 Tên hiển thị"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="chat-input"
            maxLength={50}
          />
        </div>
        <div className="form-group input-with-button">
          <input
            type="text"
            placeholder="💬 Nhập bình luận..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="chat-input"
            maxLength={500}
          />
          <button type="submit" className="chat-send-btn">
            <span>Gửi</span>
            <span className="send-icon">➤</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
