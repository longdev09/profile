"use client";

import React, { useState } from "react";

interface YouTubeEmbedProps {
  youtubeId: string;
  title: string;
  className?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
}

export default function YouTubeEmbed({
  youtubeId,
  title,
  className = "",
  isPlaying: controlledIsPlaying,
  onPlay,
}: YouTubeEmbedProps) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);

  // Use controlled state if provided, otherwise fallback to internal state
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      setInternalIsPlaying(true);
    }
  };

  // Default YouTube thumbnail URL (hqdefault is reliably available for all YouTube videos)
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 shadow-sm border border-slate-200 ${className}`}>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title || "YouTube Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={handlePlay}
      className={`relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 shadow-sm border border-slate-200 cursor-pointer group select-none ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePlay();
        }
      }}
      aria-label={`Phát video: ${title}`}
    >
      {/* Thumbnail Cover Image */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/50 transition-all duration-300" />

      {/* Central Clean Triangle Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[#f11c65] to-[#ff6f91] text-white flex items-center justify-center shadow-lg shadow-[#f11c65]/40 border border-white/30 backdrop-blur-xs group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#f11c65]/60 transition-all duration-300">
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-white translate-x-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
