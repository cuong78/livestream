import React, { useEffect, useState } from "react";
import "./MatchScoreboard.css";

interface MatchInfo {
  matchNumber: number;
  redWeight: number;
  blueWeight: number;
  status?: string;
  action?: string;
}

interface MatchScoreboardProps {
  stompClient: any;
}

const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ stompClient }) => {
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!stompClient) return;

    let subscription: any = null;

    // Wait for connection to be established
    const setupSubscription = () => {
      if (!stompClient.connected) {
        console.log("MatchScoreboard: Waiting for connection...");
        return;
      }

      try {
        // Subscribe to match info updates
        subscription = stompClient.subscribe(
          "/topic/match-info",
          (message: any) => {
            try {
              const data = JSON.parse(message.body);
              console.log("Received match info:", data);

              if (data.action === "clear") {
                // Start hide animation
                setIsHiding(true);
                // Remove after animation completes
                setTimeout(() => {
                  setMatchInfo(null);
                  setIsHiding(false);
                }, 400);
              } else if (data.action === "update" || data.matchNumber) {
                setMatchInfo({
                  matchNumber: data.matchNumber,
                  redWeight: data.redWeight,
                  blueWeight: data.blueWeight,
                  status: data.status || "active",
                });
                setIsHiding(false);
              }
            } catch (error) {
              console.error("Error parsing match info:", error);
            }
          }
        );

        // Request current match info
        stompClient.publish({
          destination: "/app/match-info/request",
          body: JSON.stringify({}),
        });

        console.log("MatchScoreboard: Subscribed to match info");
      } catch (error) {
        console.error("Failed to subscribe to match info:", error);
      }
    };

    // Check if already connected
    if (stompClient.connected) {
      setupSubscription();
    } else {
      // Wait for connection
      const onConnect = stompClient.onConnect;
      stompClient.onConnect = (frame: any) => {
        if (onConnect) onConnect(frame);
        setupSubscription();
      };
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      }
    };
  }, [stompClient]);

  if (!matchInfo) {
    return null;
  }

  return (
    <div className={`match-scoreboard ${isHiding ? "hiding" : ""}`}>
      <div className="scoreboard-content">
        <div className="fighter-info fighter-red">
          <span className="fighter-label">Đỏ:</span>
          <span className="fighter-weight">
            {matchInfo.redWeight.toFixed(2)} kg
          </span>
        </div>

        <div className="match-info">
          <span className="match-label">Cặp: {matchInfo.matchNumber}</span>
        </div>

        <div className="fighter-info fighter-blue">
          <span className="fighter-label">Đen:</span>
          <span className="fighter-weight">
            {matchInfo.blueWeight.toFixed(2)} kg
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreboard;
