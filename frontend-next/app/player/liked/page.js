'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../spotify.css';
import './liked.css';
import { usePlayer } from '../../../context/PlayerContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('spotify_token');
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('spotify_user') || 'null'); } catch { return null; }
}

function normaliseTrack(t) {
  return {
    id: t.id, title: t.title, artist: t.artist, album: t.album || '',
    duration: Number(t.duration) || 0,
    cover: t.cover || `https://picsum.photos/seed/${t.id}/400/400`,
    color: t.color || '#1DB954',
    hlsUrl: t.hls_slug ? `${API_URL}/stream/${t.hls_slug}/index.m3u8` : null,
  };
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const Icon = {
  Back: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

export default function LikedPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const { currentTrack, isPlaying, liked, toggleLike, playTrack } = usePlayer();

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    load();
  }, []);

  // Reload when liked set changes (track uncurtido disappears)
  useEffect(() => {
    if (user) load();
  }, [liked]);

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/me/liked`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) setTracks((await res.json()).map(normaliseTrack));
    } catch {}
    setLoading(false);
  }

  function handlePlayAll() {
    if (!tracks.length) return;
    playTrack(tracks[0], tracks);
  }

  function handlePlayTrack(track) {
    playTrack(track, tracks);
  }

  const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);
  const heroColor = '#1DB954';

  if (loading) {
    return (
      <div className="liked-loading">
        <div className="liked-spinner" />
        <p>Carregando músicas curtidas...</p>
      </div>
    );
  }

  return (
    <div className="liked-page">
      <button className="liked-back-btn" onClick={() => router.push('/player')}>
        <Icon.Back /> Voltar
      </button>

      {/* Hero */}
      <header className="liked-hero">
        <div className="liked-hero-cover">
          {tracks.length > 0 ? (
            <div className="liked-cover-grid">
              {tracks.slice(0, 4).map((t, i) => (
                <img key={i} src={t.cover} alt={t.title} />
              ))}
            </div>
          ) : (
            <div className="liked-cover-empty">♡</div>
          )}
        </div>
        <div className="liked-hero-info">
          <span className="liked-hero-type">Playlist</span>
          <h1 className="liked-hero-name">Músicas curtidas</h1>
          {user && <p className="liked-hero-user">{user.name}</p>}
          <p className="liked-hero-meta">
            {tracks.length} {tracks.length === 1 ? 'música' : 'músicas'}
            {totalDuration > 0 && <> · {formatTotalDuration(totalDuration)}</>}
          </p>
        </div>
      </header>

      {/* Actions */}
      <div className="liked-actions">
        {tracks.length > 0 && (
          <button className="liked-play-btn" onClick={handlePlayAll}>
            <Icon.Play />
          </button>
        )}
      </div>

      {/* Track list */}
      {tracks.length > 0 ? (
        <section className="liked-section">
          <div className="liked-track-header">
            <span>#</span>
            <span>Título</span>
            <span>Álbum</span>
            <span>Duração</span>
          </div>
          <div className="liked-track-list">
            {tracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`liked-track-row ${isCurrent ? 'current' : ''}`}
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="liked-track-num">
                    {isCurrent && isPlaying
                      ? <span className="liked-eq"><span /><span /><span /></span>
                      : <span>{i + 1}</span>}
                  </div>
                  <img src={track.cover} alt={track.title} className="liked-track-img" />
                  <div className="liked-track-info">
                    <span className={`liked-track-title ${isCurrent ? 'active' : ''}`}>{track.title}</span>
                    <Link
                      href={`/player/artist/${encodeURIComponent(track.artist)}`}
                      className="liked-track-artist artist-link"
                      onClick={e => e.stopPropagation()}
                    >
                      {track.artist}
                    </Link>
                  </div>
                  <span className="liked-track-album">{track.album}</span>
                  <button
                    className="liked-track-heart active"
                    onClick={e => { e.stopPropagation(); toggleLike(track.id); }}
                    title="Remover dos curtidos"
                  >
                    <Icon.Heart filled={liked.has(track.id)} />
                  </button>
                  <span className="liked-track-duration">{formatTime(track.duration)}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="liked-empty-state">
          <span>♡</span>
          <h3>Nenhuma música curtida</h3>
          <p>Clique no ♡ em qualquer música para salvá-la aqui.</p>
          <button onClick={() => router.push('/player')}>Explorar músicas</button>
        </div>
      )}
    </div>
  );
}
