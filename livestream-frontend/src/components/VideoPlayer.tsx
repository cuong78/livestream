import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    const video = videoRef.current;
    setError(null);

    console.log("Initializing HLS.js with URL:", hlsUrl);

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed successfully");
        // Try to play with sound first
        video.muted = false;
        video.play().catch((err) => {
          console.log("Autoplay with sound prevented, trying muted:", err);
          // If failed, try muted autoplay
          video.muted = true;
          setIsMuted(true);
          video.play().catch((err2) => {
            console.log("Autoplay prevented:", err2);
          });
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              setError("Lỗi phát video: " + data.details);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        // Try to play with sound first
        video.muted = false;
        video.play().catch((err) => {
          console.log("Autoplay with sound prevented, trying muted:", err);
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .catch((err2) => console.log("Autoplay prevented:", err2));
        });
      });
    } else {
      setError("Trình duyệt không hỗ trợ HLS streaming");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        controls
        className="video-player"
        playsInline
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        style={{ objectFit: "contain" }}
      />
      {isMuted && (
        <button className="unmute-button" onClick={handleUnmute}>
          🔊 Bật tiếng
        </button>
      )}
      {error && (
        <div className="video-error-message">
          <p>{error}</p>
          <p>Vui lòng thử lại sau.</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
