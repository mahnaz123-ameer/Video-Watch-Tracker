import React, { useState, useEffect, useRef } from "react";

const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds}s`;
};

const VideoPlayer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("");
  const [watchTime, setWatchTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const youtubePlayer = useRef(null);
  const vimeoPlayer = useRef(null);

  const handleUrlChange = (e) => {
    const url = e.target.value.trim();
    setVideoUrl(url);
    setLoading(true);
    setError(null);

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setVideoType("youtube");
      setLoading(false);
    } else if (url.includes("vimeo.com")) {
      setVideoType("vimeo");
      setLoading(false);
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      setVideoType("file");
      setLoading(false);
    } else {
      setVideoType("");
      setError("Invalid video URL. Please enter a valid URL.");
      setLoading(false);
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
          setTotalDuration(Math.floor(youtubePlayer.current.getDuration()));
        },
      },
    });
  };

  const startYouTubeWatchTimer = () => {
    if (!youtubePlayer.current.timer) {
      youtubePlayer.current.timer = setInterval(() => {
        const currentTime = youtubePlayer.current.getCurrentTime();
        setWatchTime(Math.floor(currentTime));
      }, 1000);
    }
  };

  const stopYouTubeWatchTimer = () => {
    if (youtubePlayer.current?.timer) {
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
        setTotalDuration(Math.floor(duration));
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
    if (vimeoPlayer.current?.timer) {
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
    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    if (!window.Vimeo) {
      const script = document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="bg-blue-50 min-h-screen flex justify-center items-center">
      <div className="w-4/5 mx-auto p-12 bg-white shadow-xl rounded-xl transition-all duration-300 transform hover:scale-105">
        <div className="bg-blue-600 text-white p-8 rounded-t-xl shadow-md mb-8">
          <h2 className="text-4xl font-semibold text-center animate-pulse">Video Watch Tracker</h2>
        </div>

        <input
          type="text"
          placeholder="Enter video URL (YouTube, Vimeo, MP4, etc.)"
          onChange={handleUrlChange}
          className="w-full p-6 border-2 border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none mb-8"
        />

        {loading && (
          <div className="flex justify-center items-center mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500 border-solid"></div>
          </div>
        )}

        {error && <p className="text-center text-red-600 mb-8">{error}</p>}

        {videoType === "youtube" && videoUrl && (
          <div>
            <h3 className="text-2xl font-semibold text-blue-600 mb-6">YouTube Video</h3>
            <div id="youtube-player" className="w-full h-96 border-2 border-gray-300 rounded-lg shadow-lg mb-6" />
          </div>
        )}

        {videoType === "vimeo" && videoUrl && (
          <div>
            <h3 className="text-2xl font-semibold text-blue-600 mb-6">Vimeo Video</h3>
            <iframe
              id="vimeo-player"
              src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
              className="w-full h-96 border-2 border-gray-300 rounded-lg shadow-lg mb-6"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {videoType === "file" && videoUrl && (
          <div>
            <h3 className="text-2xl font-semibold text-blue-600 mb-6">Direct Video</h3>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={handleVideoTimeUpdate}
              className="w-full h-96 border-2 border-gray-300 rounded-lg shadow-lg bg-black mb-6"
            />
          </div>
        )}

        {!videoUrl && !loading && (
          <p className="text-center text-gray-500 mt-6">Enter a valid video URL to begin playback.</p>
        )}

        <div className="flex justify-center items-center gap-8 mt-8">
          <p className="text-xl font-medium text-red-600">Watch Time: {formatTime(watchTime)}</p>
          <p className="text-xl font-medium text-green-600">Total Duration: {formatTime(totalDuration)}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
