'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../context/PlayerContext';

const Icon = {
  Down: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
    </svg>
  ),
};

export default function NowPlaying() {
  const {
    currentTrack, isPlaying,
    showNowPlaying, setShowNowPlaying,
  } = usePlayer();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showNowPlaying) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [showNowPlaying]);

  function close() {
    setVisible(false);
    setTimeout(() => setShowNowPlaying(false), 300);
  }

  const color = currentTrack?.color || '#1DB954';

  if (!showNowPlaying || !currentTrack) return null;

  return (
    <div
      className={`np-overlay ${visible ? 'np-visible' : ''}`}
      style={{ '--np-color': color }}
    >
      {/* Blurred background */}
      <div className="np-bg">
        <img src={currentTrack.cover} alt="" className="np-bg-img" />
        <div className="np-bg-blur" />
        <div className="np-bg-dark" />
      </div>

      {/* Header with track name top-left and close button top-right */}
      <header className="np-header">
        <div className="np-header-track">
          <span className="np-header-title">{currentTrack.title}</span>
          <Link
            href={`/player/artist/${encodeURIComponent(currentTrack.artist)}`}
            className="np-header-artist"
            onClick={close}
          >
            {currentTrack.artist}
          </Link>
        </div>
        <button className="np-icon-btn" onClick={close} title="Minimizar">
          <Icon.Down />
        </button>
      </header>

      {/* Fullscreen album cover */}
      <div className="np-cover-fullscreen">
        <img
          src={currentTrack.cover}
          alt={currentTrack.title}
          className={`np-artwork-full ${isPlaying ? 'np-artwork--playing' : ''}`}
          style={{ boxShadow: `0 40px 100px ${color}88` }}
        />
      </div>
    </div>
  );
}
