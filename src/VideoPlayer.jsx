import React, { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import Vimeo from "@vimeo/player";

// Helper function to format time
const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const VideoWatchTracker = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("");
  const [watchTime, setWatchTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const vimeoPlayerRef = useRef(null);
  const fileVideoRef = useRef(null);

  useEffect(() => {
    if (videoType === "vimeo" && videoUrl) {
      const vimeoId = extractVimeoId(videoUrl);
      const vimeoPlayer = new Vimeo(vimeoPlayerRef.current, {
        id: vimeoId,
        width: 640,
      });

      vimeoPlayer.on("timeupdate", (data) => setWatchTime(data.seconds));
      vimeoPlayer.on("loaded", (data) => setTotalDuration(data.duration));
    }
  }, [videoType, videoUrl]);

  const handleUrlChange = (e) => {
    const url = e.target.value.trim();
    setVideoUrl(url);

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setVideoType("youtube");
    } else if (url.includes("vimeo.com")) {
      setVideoType("vimeo");
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
      setVideoType("file");
    } else {
      setVideoType("");
    }
  };

  const extractVimeoId = (url) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const handleFileVideoTimeUpdate = () => {
    if (fileVideoRef.current) {
      setWatchTime(fileVideoRef.current.currentTime);
      setTotalDuration(fileVideoRef.current.duration);
    }
  };

  const handleYouTubeReady = (event) => {
    setTotalDuration(event.target.getDuration());
  };

  const handleYouTubeStateChange = (event) => {
    if (event.data === 1) {
      // Playing
      const interval = setInterval(() => {
        setWatchTime(event.target.getCurrentTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  };

  const progress = totalDuration > 0 ? (watchTime / totalDuration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col items-center">
      {/* Header */}
      <header className="bg-blue-600 text-white w-full py-4 text-center shadow-md">
        <h1 className="text-3xl font-bold">Video Watch Tracker</h1>
        <p className="text-sm">Track your video watch time effortlessly!</p>
      </header>

      {/* Input and Video Container */}
      <div className="max-w-4xl w-full px-4 py-6">
        {/* Video URL Input */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={videoUrl}
            onChange={handleUrlChange}
            placeholder="Enter video URL (YouTube, Vimeo, .mp4, etc.)"
            className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-400 outline-none"
          />
        </div>

        {/* Video Display */}
        {videoType === "youtube" && videoUrl && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-2 text-blue-600">YouTube Video</h3>
            <YouTube
              videoId={new URLSearchParams(new URL(videoUrl).search).get("v")}
              onReady={handleYouTubeReady}
              onStateChange={handleYouTubeStateChange}
              opts={{ playerVars: { autoplay: 1 } }}
            />
          </div>
        )}

        {videoType === "vimeo" && videoUrl && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-2 text-blue-600">Vimeo Video</h3>
            <div ref={vimeoPlayerRef} className="w-full h-64 bg-gray-200 rounded-md" />
          </div>
        )}

        {videoType === "file" && videoUrl && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-2 text-blue-600">File Video</h3>
            <video
              ref={fileVideoRef}
              src={videoUrl}
              controls
              onTimeUpdate={handleFileVideoTimeUpdate}
              className="w-full bg-black rounded-md"
            />
          </div>
        )}

        {!videoUrl && (
          <p className="text-center text-gray-500 mt-4">
            Please enter a valid video URL (YouTube, Vimeo, .mp4, etc.).
          </p>
        )}
      </div>

      {/* Watch Time and Progress Bar */}
      <div className="w-full max-w-4xl px-4">
        <div className="bg-white p-4 rounded-md shadow-md text-center">
          <p className="text-red-600 text-xl font-semibold">
            Watch Time: {formatTime(watchTime)}
          </p>
          <p className="text-green-600 text-xl font-semibold">
            Total Duration: {formatTime(totalDuration)}
          </p>
          <div className="w-full bg-gray-300 rounded-full mt-4 overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white w-full py-4 mt-auto text-center">
        <p>&copy; {new Date().getFullYear()} Video Watch Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VideoWatchTracker;
