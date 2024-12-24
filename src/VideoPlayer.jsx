import React, { useState, useEffect, useRef } from "react";

// Helper function to format seconds into hours, minutes, and seconds
const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds}s`;
};

const VideoPlayer = () => {
  const [videoUrl, setVideoUrl] = useState(""); // State for video URL
  const [videoType, setVideoType] = useState(""); // To track if it's a platform or direct file
  const [watchTime, setWatchTime] = useState(0); // State for watch time
  const [totalDuration, setTotalDuration] = useState(0); // State for total video duration
  const videoRef = useRef(null); // Ref for the <video> element
  const youtubePlayer = useRef(null); // Ref for the YouTube player
  const vimeoPlayer = useRef(null); // Ref for the Vimeo player

  const handleUrlChange = (e) => {
    const url = e.target.value.trim();
    setVideoUrl(url);

    // Detect if the URL is a direct video URL or a platform URL (YouTube/Vimeo)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setVideoType("youtube");
    } else if (url.includes("vimeo.com")) {
      setVideoType("vimeo");
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      setVideoType("file");
    } else {
      setVideoType(""); // If URL is unrecognized, reset type
    }
  };

  const extractVimeoId = (url) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setWatchTime(videoRef.current.currentTime);
    }
  };

  const initializeYouTubePlayer = () => {
    const videoId = videoUrl.split("v=")[1]?.split("&")[0];
    youtubePlayer.current = new window.YT.Player("youtube-player", {
      videoId,
      events: {
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            startYouTubeWatchTimer();
          } else {
            stopYouTubeWatchTimer();
          }
        },
        onReady: () => {
          setTotalDuration(Math.floor(youtubePlayer.current.getDuration())); // Get the duration
        }
      },
    });
  };

  const startYouTubeWatchTimer = () => {
    if (!youtubePlayer.current.timer) {
      youtubePlayer.current.timer = setInterval(() => {
        const currentTime = youtubePlayer.current.getCurrentTime();
        setWatchTime((prev) => Math.floor(currentTime));
      }, 1000);
    }
  };

  const stopYouTubeWatchTimer = () => {
    if (youtubePlayer.current && youtubePlayer.current.timer) {
      clearInterval(youtubePlayer.current.timer);
      youtubePlayer.current.timer = null;
    }
  };

  const initializeVimeoPlayer = () => {
    const videoId = extractVimeoId(videoUrl);
    const iframe = document.getElementById("vimeo-player");

    vimeoPlayer.current = new window.Vimeo.Player(iframe);
    vimeoPlayer.current.on("loaded", () => {
      vimeoPlayer.current.getDuration().then((duration) => {
        setTotalDuration(Math.floor(duration)); // Get the duration
      });
    });

    vimeoPlayer.current.on("play", () => {
      startVimeoWatchTimer();
    });

    vimeoPlayer.current.on("pause", () => {
      stopVimeoWatchTimer();
    });
  };

  const startVimeoWatchTimer = () => {
    if (!vimeoPlayer.current.timer) {
      vimeoPlayer.current.timer = setInterval(() => {
        vimeoPlayer.current.getCurrentTime().then((currentTime) => {
          setWatchTime(Math.floor(currentTime));
        });
      }, 1000);
    }
  };

  const stopVimeoWatchTimer = () => {
    if (vimeoPlayer.current && vimeoPlayer.current.timer) {
      clearInterval(vimeoPlayer.current.timer);
      vimeoPlayer.current.timer = null;
    }
  };

  useEffect(() => {
    if (videoType === "youtube" && window.YT && !youtubePlayer.current) {
      initializeYouTubePlayer();
    }

    if (videoType === "vimeo" && !vimeoPlayer.current) {
      initializeVimeoPlayer();
    }

    return () => {
      stopYouTubeWatchTimer();
      stopVimeoWatchTimer();
    };
  }, [videoUrl]);

  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    // Load Vimeo API if not already loaded
    if (!window.Vimeo) {
      const script = document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <input
        type="text"
        placeholder="Enter video URL"
        onChange={handleUrlChange}
        className="w-full p-3 border border-gray-300 rounded-md shadow-md mb-4"
      />

      {videoType === "youtube" && videoUrl && (
        <div>
          <h3 className="text-2xl font-semibold mb-2">Embedded YouTube Video</h3>
          <div id="youtube-player" className="w-full h-96" />
        </div>
      )}

      {videoType === "vimeo" && videoUrl && (
        <div>
          <h3 className="text-2xl font-semibold mb-2">Embedded Vimeo Video</h3>
          <iframe
            id="vimeo-player"
            src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
            width="640"
            height="360"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full max-h-96"
          ></iframe>
        </div>
      )}

      {videoType === "file" && videoUrl && (
        <div>
          <h3 className="text-2xl font-semibold mb-2">Direct Video Playback</h3>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleVideoTimeUpdate}
            className="w-full max-h-96 bg-black"
          />
        </div>
      )}

      {!videoUrl && (
        <p className="text-center text-gray-500 mt-4">Please enter a valid video URL (YouTube, Vimeo, .mp4, etc.).</p>
      )}

      <p className="text-center text-red-600 mt-4">
        Watch Time: {formatTime(watchTime)}
      </p>
      <p className="text-center text-green-600 mt-4">
        Total Duration: {formatTime(totalDuration)}
      </p>
    </div>
  );
};

export default VideoPlayer;
