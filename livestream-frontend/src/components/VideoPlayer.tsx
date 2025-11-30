import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-big-play-centered";
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      liveui: true,
      sources: [
        {
          src: hlsUrl,
          type: "application/x-mpegURL",
        },
      ],
    });

    playerRef.current = player;
    setIsReady(true);

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [hlsUrl]);

  return (
    <div
      style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#000" }}
    >
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
