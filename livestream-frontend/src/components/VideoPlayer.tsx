import { useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    // Clear previous content and error
    if (videoRef.current.firstChild) {
      videoRef.current.innerHTML = '';
    }
    setError(null);

    console.log("Initializing video player with HLS URL:", hlsUrl);

    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-big-play-centered vjs-theme-custom";
    videoRef.current.appendChild(videoElement);

    // Add a crossorigin attribute to handle CORS issues
    videoElement.setAttribute("crossorigin", "anonymous");

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false, // Changed to false to avoid immediate playback issues
      preload: "auto",
      fluid: true,
      liveui: true,
      liveTracker: {
        trackingThreshold: 0,
        liveTolerance: 15, // Increased tolerance
      },
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          handlePartialData: true, // Added to handle partial data
          smoothQualityChange: true,
          fastQualityChange: true,
          handleManifestRedirects: true, // Handle variant playlist redirects
          useBandwidthFromLocalStorage: false,
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

    // Add error handling
    player.on('error', function() {
      console.error('Video player error:', player.error());
      setError(`Lỗi phát video: ${player.error()?.message || 'Không xác định'}`);
    });

    // Log when metadata is loaded
    player.on('loadedmetadata', function() {
      console.log('Video metadata loaded successfully');
      try {
        // Use non-null assertion to tell TypeScript that play() is not null
        player.play()!.catch(error => console.error('Play error:', error));
      } catch (error) {
        console.error('Error playing video:', error);
      }
    });

    // Log when the player is ready
    player.ready(function() {
      console.log('Video player is ready');

      // Try to manually load the source
      try {
        const tech = player.tech({ IWillNotUseThisInPlugins: true });
        // Use type assertion to avoid TypeScript error
        if (tech && (tech as any).vhs) {
          console.log('VHS tech is available');
        }
      } catch (e) {
        console.error('Error accessing tech:', e);
      }
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
    <div className="video-player-wrapper">
      <div ref={videoRef} />
      {error && (
        <div className="video-error-message">
          <p>{error}</p>
          <p>Vui lòng thử lại sau hoặc chọn server khác.</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
