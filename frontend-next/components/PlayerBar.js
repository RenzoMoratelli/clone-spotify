'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePlayer } from '../context/PlayerContext';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const Icon = {
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Prev: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>,
  Next: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>,
  Shuffle: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>,
  Repeat: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
  Volume: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Queue: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>,
  Mic: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>,
  HLS: () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8 3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>,
  ChevronUp: () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>,
};

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, currentTime, duration,
    volume, setVolume, shuffle, setShuffle, repeat, setRepeat,
    liked, toggleLike, hlsStatus, showNowPlaying, setShowNowPlaying,
    togglePlay, playNext, playPrev, seekTo,
  } = usePlayer();

  const progressRef = useRef(null);

  function handleProgressClick(e) {
    if (!currentTrack) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio);
  }

  function handleVolumeClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100));
  }

  const displayDuration = currentTrack?.hlsUrl ? duration : currentTrack?.duration;

  return (
    <footer className="player-bar">
      <div className="player-track">
        {currentTrack ? (
          <>
            {/* Clicking cover opens NowPlaying */}
            <div className="player-cover-wrap" onClick={() => setShowNowPlaying(true)} title="Ver agora tocando">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className="player-cover"
                style={{ boxShadow: `0 0 20px ${currentTrack.color}55` }}
              />
              <div className="player-cover-hover">
                <Icon.ChevronUp />
              </div>
            </div>
            <div className="player-info">
              <span className="player-title">{currentTrack.title}</span>
              <Link
                href={`/player/artist/${encodeURIComponent(currentTrack.artist)}`}
                className="player-artist artist-link"
              >
                {currentTrack.artist}
              </Link>
            </div>
            <button className="player-like" onClick={() => toggleLike(currentTrack.id)}>
              <Icon.Heart filled={liked.has(currentTrack.id)} />
            </button>
            {currentTrack.hlsUrl && (
              <span className={`player-hls-badge ${hlsStatus}`}>
                <Icon.HLS />
              </span>
            )}
          </>
        ) : (
          <div className="player-empty">Nenhuma faixa selecionada</div>
        )}
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className={`ctrl-btn ${shuffle ? 'active' : ''}`} onClick={() => setShuffle((s) => !s)} title="Aleatório">
            <Icon.Shuffle />
          </button>
          <button className="ctrl-btn" onClick={playPrev} title="Anterior">
            <Icon.Prev />
          </button>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? <Icon.Pause /> : <Icon.Play />}
          </button>
          <button className="ctrl-btn" onClick={playNext} title="Próxima">
            <Icon.Next />
          </button>
          <button className={`ctrl-btn ${repeat ? 'active' : ''}`} onClick={() => setRepeat((r) => !r)} title="Repetir">
            <Icon.Repeat />
          </button>
        </div>
        <div className="player-progress">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: currentTrack?.color || '#1DB954' }} />
            <div className="progress-thumb" style={{ left: `${progress}%`, background: currentTrack?.color || '#1DB954' }} />
          </div>
          <span className="time">{formatTime(displayDuration)}</span>
        </div>
      </div>

      <div className="player-right">
        <button className="ctrl-btn small"><Icon.Mic /></button>
        <button className="ctrl-btn small" onClick={() => setShowNowPlaying(true)} title="Ver agora tocando">
          <Icon.Queue />
        </button>
        <div className="volume-wrap">
          <Icon.Volume />
          <div className="volume-bar" onClick={handleVolumeClick}>
            <div className="volume-fill" style={{ width: `${volume}%` }} />
            <div className="volume-thumb" style={{ left: `${volume}%` }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
