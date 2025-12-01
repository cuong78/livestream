import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Comment } from "@/types";

export class WebSocketService {
  private client: Client | null = null;
  private onMessageCallback: ((comment: Comment) => void) | null = null;
  private onHistoryCallback: ((comments: Comment[]) => void) | null = null;

  connect(
    onMessage: (comment: Comment) => void,
    onHistory?: (comments: Comment[]) => void
  ): void {
    this.onMessageCallback = onMessage;
    this.onHistoryCallback = onHistory || null;

    this.client = new Client({
      webSocketFactory: () => new SockJS("/api/ws/chat"),
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log("WebSocket Connected");

      // Subscribe to new comments
      this.client?.subscribe("/topic/live-comments", (message) => {
        const comment = JSON.parse(message.body) as Comment;
        this.onMessageCallback?.(comment);
      });

      // Subscribe to comments history
      if (this.onHistoryCallback) {
        this.client?.subscribe("/topic/comments-history", (message) => {
          const commentsJson = JSON.parse(message.body) as string[];
          const comments: Comment[] = commentsJson.map((json) =>
            JSON.parse(json)
          );
          this.onHistoryCallback?.(comments);
        });

        // Request comments history after connection
        this.client?.publish({
          destination: "/app/comments/history",
          body: JSON.stringify({}),
        });
      }
    };

    this.client.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    this.client.activate();
  }

  sendComment(comment: Comment): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: "/app/comment",
        body: JSON.stringify(comment),
      });
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const websocketService = new WebSocketService();
