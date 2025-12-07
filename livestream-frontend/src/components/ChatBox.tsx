import { useState, useEffect, useRef } from "react";
import type { Comment } from "@/types";
import "./ChatBox.css";

interface ChatBoxProps {
  comments: Comment[];
  onSendComment: (comment: Comment) => void;
  viewerCount?: number;
  isAdmin?: boolean;
  adminUser?: { username: string; role?: string } | null;
  onDeleteComment?: (comment: Comment) => void;
  onBlockIp?: (ipAddress: string) => void;
}

const DISPLAY_NAME_KEY = "livestream_display_name";
const MAX_COMMENTS = 50; // Giới hạn tối đa 50 comments
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_CONTENT_LENGTH = 500;

const ChatBox: React.FC<ChatBoxProps> = ({
  comments,
  onSendComment,
  viewerCount = 0,
  isAdmin = false,
  adminUser = null,
  onDeleteComment,
  onBlockIp,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    comment: Comment;
    x: number;
    y: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  const handleReloadPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Load display name from localStorage
    const savedName = localStorage.getItem(DISPLAY_NAME_KEY);
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to top for new messages (since newest is at top)
    const container = messagesContainerRef.current;
    if (container && shouldScrollRef.current) {
      const isNearTop = container.scrollTop < 100;

      if (isNearTop) {
        // Scroll to top to see newest messages
        container.scrollTop = 0;
      }
    }
  }, [comments]);

  const handleScroll = () => {
    // Track if user scrolled away from top
    const container = messagesContainerRef.current;
    if (container) {
      const isAtTop = container.scrollTop < 50;
      shouldScrollRef.current = isAtTop;
    }
  };

  useEffect(() => {
    // Clear error after 5 seconds
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    // Close context menu when clicking outside
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCommentClick = (comment: Comment, e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ comment, x: e.clientX, y: e.clientY });
    } else {
      handleReplyClick(comment);
    }
  };

  const handleDeleteComment = () => {
    if (contextMenu && onDeleteComment) {
      onDeleteComment(contextMenu.comment);
      setContextMenu(null);
    }
  };

  const handleViewIp = () => {
    if (contextMenu?.comment.ipAddress) {
      alert(`IP Address: ${contextMenu.comment.ipAddress}`);
    }
    setContextMenu(null);
  };

  const handleBlockIp = () => {
    if (contextMenu?.comment.ipAddress && onBlockIp) {
      if (
        confirm(`Bạn có chắc muốn chặn IP: ${contextMenu.comment.ipAddress}?`)
      ) {
        onBlockIp(contextMenu.comment.ipAddress);
      }
    }
    setContextMenu(null);
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    // Set content with @ mention
    setContent(`@${comment.displayName} `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMessage("");

    if (!displayName.trim()) {
      setErrorMessage("Vui lòng nhập tên hiển thị");
      return;
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      setErrorMessage(
        `Tên hiển thị không được vượt quá ${MAX_DISPLAY_NAME_LENGTH} ký tự`
      );
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Vui lòng nhập nội dung bình luận");
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setErrorMessage(
        `Nội dung không được vượt quá ${MAX_CONTENT_LENGTH} ký tự`
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());

      // Lưu giá trị trước khi clear để tránh bug miss content
      const commentToSend = {
        displayName: displayName.trim(),
        content: content.trim(),
        parentId: replyingTo?.id?.toString(),
        replyTo: replyingTo?.displayName,
      };

      // Clear form trước
      setContent("");
      setReplyingTo(null);

      // Sau đó mới gửi comment (với giá trị đã lưu)
      onSendComment(commentToSend);
    } catch (error: any) {
      if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Không thể gửi bình luận. Vui lòng thử lại.");
      }
    } finally {
      setTimeout(() => setIsSubmitting(false), 3000);
    }
  };

  // Only show last 50 comments and reverse to show newest first
  const displayedComments = comments.slice(-MAX_COMMENTS).reverse();

  // Function to render content with highlighted mentions
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /@(\S+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>
        );
      }
      // Add highlighted mention
      parts.push(
        <span key={match.index} className="mention-highlight">
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="chatbox-container">
      {/* Header với nút Load lại trang và viewer count */}
      <div className="chatbox-header">
        <div className="header-left">
          <h3>💬 Chat trực tiếp</h3>
          <span className="viewer-count">👁️ {viewerCount} đang xem</span>
        </div>
        <button
          className="reload-btn"
          onClick={handleReloadPage}
          title="Load lại trang"
        >
          🔄 LOAD LẠI TRANG
        </button>
      </div>

      {/* Form nhập liệu ở trên */}
      <form onSubmit={handleSubmit} className="chatbox-form">
        {errorMessage && (
          <div className="chatbox-error">
            <span className="error-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {replyingTo && (
          <div className="replying-to-banner">
            <span>
              ↩️ Đang trả lời <strong>@{replyingTo.displayName}</strong>
            </span>
            <button
              type="button"
              className="cancel-reply-btn"
              onClick={() => {
                setReplyingTo(null);
                setContent("");
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="form-group">
          <input
            type="text"
            placeholder="👤 Tên hiển thị"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="chat-input"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            disabled={isSubmitting}
          />
          <small className="input-hint">
            {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
          </small>
        </div>

        <div className="form-group input-with-button">
          <input
            type="text"
            placeholder="💬 Nhập bình luận..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="chat-input"
            maxLength={MAX_CONTENT_LENGTH}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Đợi..." : "Gửi"}</span>
            <span className="send-icon">➤</span>
          </button>
        </div>
        <small className="input-hint">
          {content.length}/{MAX_CONTENT_LENGTH}
        </small>
      </form>

      {/* Phần chat scroll ở dưới */}
      <div
        className="chatbox-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {displayedComments.length === 0 ? (
          <div className="chatbox-empty">
            <span className="empty-icon">💭</span>
            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          displayedComments.map((comment, index) => {
            const isAdminComment = comment.isAdmin === true;
            return (
            <div
              key={comment.id || `${comment.displayName}-${index}`}
              className={`chat-message ${comment.parentId ? "is-reply" : ""} ${isAdminComment ? "is-admin" : ""}`}
              onClick={(e) => handleCommentClick(comment, e)}
              style={{ cursor: "pointer" }}
            >
              <div className="message-avatar">
                {isAdminComment ? "👑" : comment.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="message-content-wrapper">
                <div className="message-header">
                  <div className="message-name">
                    {comment.displayName}
                  </div>
                  {isAdmin && comment.ipAddress && (
                    <span className="admin-ip-badge" title="IP Address">
                      🌐 {comment.ipAddress}
                    </span>
                  )}
                </div>
                {comment.replyTo && comment.parentId && (
                  <div className="reply-quote-container">
                    <div className="reply-quote-header">
                      ↩️ Trả lời <strong>@{comment.replyTo}</strong>
                    </div>
                  </div>
                )}
                <div className="message-text">
                  {renderContentWithMentions(comment.content)}
                </div>
              </div>
            </div>
          );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Admin Context Menu */}
      {contextMenu && isAdmin && (
        <div
          className="admin-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item delete"
            onClick={handleDeleteComment}
          >
            🗑️ Xóa bình luận
          </button>
          {contextMenu.comment.ipAddress && (
            <>
              <button className="context-menu-item" onClick={handleViewIp}>
                🔍 Xem IP
              </button>
              <button
                className="context-menu-item block"
                onClick={handleBlockIp}
              >
                🚫 Chặn IP
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBox;
