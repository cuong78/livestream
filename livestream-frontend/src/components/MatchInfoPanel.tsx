import React, { useState } from "react";
import "./MatchInfoPanel.css";

interface MatchInfoPanelProps {
  stompClient: any;
}

interface MatchInfo {
  matchNumber: number;
  redWeight: number;
  blueWeight: number;
}

const MatchInfoPanel: React.FC<MatchInfoPanelProps> = ({ stompClient }) => {
  const [matchNumber, setMatchNumber] = useState<string>("");
  const [redWeight, setRedWeight] = useState<string>("");
  const [blueWeight, setBlueWeight] = useState<string>("");
  const [currentMatch, setCurrentMatch] = useState<MatchInfo | null>(null);

  const handleSendMatchInfo = () => {
    if (!stompClient || !matchNumber || !redWeight || !blueWeight) {
      alert("Vui lòng điền đầy đủ thông tin cặp đấu!");
      return;
    }

    const matchInfo = {
      matchNumber: parseInt(matchNumber),
      redWeight: parseFloat(redWeight),
      blueWeight: parseFloat(blueWeight),
    };

    // Validate input
    if (isNaN(matchInfo.matchNumber) || matchInfo.matchNumber < 1) {
      alert("Số cặp phải là số nguyên dương!");
      return;
    }

    if (isNaN(matchInfo.redWeight) || matchInfo.redWeight <= 0) {
      alert("Trọng lượng gà đỏ phải là số dương!");
      return;
    }

    if (isNaN(matchInfo.blueWeight) || matchInfo.blueWeight <= 0) {
      alert("Trọng lượng gà đen phải là số dương!");
      return;
    }

    try {
      stompClient.publish({
        destination: "/app/match-info/update",
        body: JSON.stringify(matchInfo),
      });

      // Update current match display
      setCurrentMatch(matchInfo);

      console.log("Match info sent:", matchInfo);

      // Optional: Clear form after sending
      // setMatchNumber('');
      // setRedWeight('');
      // setBlueWeight('');
    } catch (error) {
      console.error("Failed to send match info:", error);
      alert("Không thể gửi thông tin cặp đấu!");
    }
  };

  const handleClearMatchInfo = () => {
    if (!stompClient) {
      alert("Chưa kết nối WebSocket!");
      return;
    }

    if (
      !window.confirm("Bạn có chắc muốn xóa thông tin cặp đấu khỏi màn hình?")
    ) {
      return;
    }

    try {
      stompClient.publish({
        destination: "/app/match-info/clear",
        body: JSON.stringify({}),
      });

      // Clear current match display
      setCurrentMatch(null);

      // Clear form
      setMatchNumber("");
      setRedWeight("");
      setBlueWeight("");

      console.log("Match info cleared");
    } catch (error) {
      console.error("Failed to clear match info:", error);
      alert("Không thể xóa thông tin cặp đấu!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMatchInfo();
    }
  };

  return (
    <div className="match-info-panel">
      <h3>Thông Tin Cặp Đấu</h3>

      <div className="match-form">
        <div className="form-group">
          <label htmlFor="matchNumber">Số Cặp</label>
          <input
            id="matchNumber"
            type="number"
            min="1"
            value={matchNumber}
            onChange={(e) => setMatchNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="VD: 1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="redWeight">Gà Đỏ (kg)</label>
          <input
            id="redWeight"
            type="number"
            step="0.01"
            min="0"
            value={redWeight}
            onChange={(e) => setRedWeight(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="VD: 1.45"
            className="red-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="blueWeight">Gà Đen (kg)</label>
          <input
            id="blueWeight"
            type="number"
            step="0.01"
            min="0"
            value={blueWeight}
            onChange={(e) => setBlueWeight(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="VD: 1.50"
            className="blue-input"
          />
        </div>
      </div>

      <div className="match-actions">
        <button
          className="btn-send-match"
          onClick={handleSendMatchInfo}
          disabled={!stompClient}
        >
          📢 Gửi Thông Tin
        </button>

        <button
          className="btn-clear-match"
          onClick={handleClearMatchInfo}
          disabled={!stompClient}
        >
          🗑️ Xóa Hiển Thị
        </button>
      </div>

      {currentMatch && (
        <div className="current-match-display">
          <h4>Đang Hiển Thị:</h4>
          <div className="match-display-info">
            <div className="match-number-display">
              Cặp #{currentMatch.matchNumber}
            </div>
            <div className="weights-display">
              <div className="weight-item">
                <span>🔴</span>
                <span className="weight-red">{currentMatch.redWeight} kg</span>
              </div>
              <div className="weight-item">
                <span>🔵</span>
                <span className="weight-blue">
                  {currentMatch.blueWeight} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchInfoPanel;
