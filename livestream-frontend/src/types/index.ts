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
  ipAddress?: string; // IP address (only visible to admin)
  isAdmin?: boolean; // Whether the commenter is an admin
  adminUsername?: string; // Admin username if commenter is logged in as admin
  // Location fields
  latitude?: number;
  longitude?: number;
  city?: string;
  address?: string;
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

export interface DailyRecording {
  id: number;
  recordingDate: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  segmentCount: number;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
  createdAt: string;
}

export interface UserLocation {
  id: number;
  userId?: number;
  username: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  country?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SaveLocationRequest {
  latitude: number;
  longitude: number;
  userAgent?: string;
}
