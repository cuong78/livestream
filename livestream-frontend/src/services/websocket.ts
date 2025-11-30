import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Comment } from "@/types";

export class WebSocketService {
  private client: Client | null = null;
  private onMessageCallback: ((comment: Comment) => void) | null = null;

  connect(onMessage: (comment: Comment) => void): void {
    this.onMessageCallback = onMessage;

    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws/chat"),
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log("WebSocket Connected");
      this.client?.subscribe("/topic/live-comments", (message) => {
        const comment = JSON.parse(message.body) as Comment;
        this.onMessageCallback?.(comment);
      });
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
