import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./VideoPlayer.css";
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
    videoElement.className = "video-js vjs-big-play-centered vjs-theme-custom";
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      autoplay: "muted", // Start muted to allow autoplay
      muted: true, // Start muted
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

    // Handle autoplay failures and try to play
    player.ready(() => {
      const playPromise = player.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, show play button
          console.log("Autoplay was prevented, waiting for user interaction");
        });
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [hlsUrl]);

  return (
    <div className="video-player-wrapper">
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
