import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

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
      liveTracker: {
        trackingThreshold: 0,
        liveTolerance: 3,
      },
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          fastQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [
        {
          src: hlsUrl,
          type: "application/x-mpegURL",
        },
      ],
    });

    playerRef.current = player;

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
