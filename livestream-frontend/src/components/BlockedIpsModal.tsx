import { useState, useEffect } from "react";
import "./BlockedIpsModal.css";

interface BlockedIp {
  id: number;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
}

interface BlockedIpsModalProps {
  onClose: () => void;
}

const BlockedIpsModal: React.FC<BlockedIpsModalProps> = ({ onClose }) => {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const fetchBlockedIps = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/blocked-ips", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data);
      } else {
        setError("Không thể tải danh sách IP đã chặn");
      }
    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id: number, ipAddress: string) => {
    if (!confirm(`Bạn có chắc muốn mở khóa IP: ${ipAddress}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blocked-ips/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (response.ok) {
        alert(`IP ${ipAddress} đã được mở khóa!`);
        fetchBlockedIps(); // Reload list
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.error || "Không thể mở khóa IP"}`);
      }
    } catch (err) {
      alert("Không thể kết nối đến server");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="blocked-ips-modal-overlay" onClick={onClose}>
      <div
        className="blocked-ips-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="blocked-ips-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="blocked-ips-modal-header">
          <div className="blocked-ips-icon">🚫</div>
          <h2>Quản lý IP đã chặn</h2>
          <p>Danh sách các IP address bị chặn khỏi chat</p>
        </div>

        <div className="blocked-ips-modal-body">
          {loading ? (
            <div className="blocked-ips-loading">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : error ? (
            <div className="blocked-ips-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="btn-retry" onClick={fetchBlockedIps}>
                Thử lại
              </button>
            </div>
          ) : blockedIps.length === 0 ? (
            <div className="blocked-ips-empty">
              <span className="empty-icon">✅</span>
              <p>Chưa có IP nào bị chặn</p>
            </div>
          ) : (
            <div className="blocked-ips-table-container">
              <table className="blocked-ips-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Lý do</th>
                    <th>Bị chặn bởi</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.map((ip) => (
                    <tr key={ip.id}>
                      <td>
                        <span className="ip-badge">{ip.ipAddress}</span>
                      </td>
                      <td>{ip.reason}</td>
                      <td>
                        <span className="admin-name">👑 {ip.blockedBy}</span>
                      </td>
                      <td className="date-cell">{formatDate(ip.blockedAt)}</td>
                      <td>
                        <button
                          className="btn-unblock"
                          onClick={() => handleUnblock(ip.id, ip.ipAddress)}
                        >
                          🔓 Mở khóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="blocked-ips-modal-footer">
          <p className="blocked-ips-count">
            Tổng: <strong>{blockedIps.length}</strong> IP bị chặn
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockedIpsModal;
