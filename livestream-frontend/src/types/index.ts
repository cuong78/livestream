export interface Stream {
  id: number;
  title: string;
  description: string;
  status: "IDLE" | "LIVE" | "ENDED";
  viewerCount: number;
  startedAt: string;
  hlsUrl: string;
}

export interface Comment {
  id?: number;
  displayName: string;
  content: string;
  createdAt?: string;
  parentId?: string;
  replyTo?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  streamKey: string;
  role: "ADMIN" | "USER";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
