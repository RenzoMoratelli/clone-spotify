'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../spotify.css';
import './artist.css';
import { usePlayer } from '../../../../context/PlayerContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Back: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
  Verified: () => <svg viewBox="0 0 24 24" fill="#3D91F4" width="20" height="20"><path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 2.96 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21.04l3.4 1.42 1.89-3.18 3.61-.82-.34-3.68L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>,
};

export default function ArtistPage() {
  const router = useRouter();
  const params = useParams();
  const artistName = decodeURIComponent(params.name || '');

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { currentTrack, isPlaying, liked, toggleLike, playTrack } = usePlayer();

  useEffect(() => {
    if (!getUser()) { router.push('/login'); return; }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/artists/${encodeURIComponent(artistName)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Artista não encontrado');
        const data = await res.json();
        setArtist(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (artistName) load();
  }, [artistName]);

  function handlePlayTrack(track, allTracks) {
    playTrack(track, allTracks);
  }

  function handlePlayAll() {
    if (!artist?.tracks?.length) return;
    const normalisedTracks = artist.tracks.map(normaliseTrack);
    playTrack(normalisedTracks[0], normalisedTracks);
  }

  if (loading) {
    return (
      <div className="artist-loading">
        <div className="artist-spinner" />
        <p>Carregando artista...</p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="artist-error-screen">
        <h2>Artista não encontrado</h2>
        <p>Não foi possível encontrar &ldquo;{artistName}&rdquo;.</p>
        <button onClick={() => router.push('/player')}>Voltar ao player</button>
      </div>
    );
  }

  const tracks = artist.tracks.map(normaliseTrack);
  const heroColor = artist.color || '#1DB954';

  return (
    <div className="artist-page">
      <button className="artist-back-btn" onClick={() => router.push('/player')}>
        <Icon.Back /> Voltar
      </button>

      {/* Hero */}
      <header
        className="artist-hero"
        style={{
          background: `linear-gradient(180deg, ${heroColor}99 0%, ${heroColor}44 50%, var(--bg, #121212) 100%)`,
        }}
      >
        <img
          src={artist.cover || `https://picsum.photos/seed/${encodeURIComponent(artistName)}/600/600`}
          alt={artist.name}
          className="artist-hero-img"
        />
        <div className="artist-hero-info">
          <div className="artist-verified">
            <Icon.Verified />
            <span>Artista verificado</span>
          </div>
          <h1 className="artist-hero-name">{artist.name}</h1>
          <p className="artist-hero-meta">
            {artist.trackCount} {artist.trackCount === 1 ? 'música' : 'músicas'}
            {' · '}
            {formatTotalDuration(artist.totalDuration)}
            {artist.albums.length > 0 && (
              <> · {artist.albums.length} {artist.albums.length === 1 ? 'álbum' : 'álbuns'}</>
            )}
          </p>
        </div>
      </header>

      {/* Actions */}
      <div className="artist-actions">
        <button className="artist-play-btn" style={{ background: heroColor }} onClick={handlePlayAll}>
          <Icon.Play />
        </button>
        <button className="artist-follow-btn">Seguir</button>
      </div>

      {/* Tracks */}
      <section className="artist-section">
        <h2>Músicas populares</h2>
        <div className="artist-track-list">
          {tracks.map((track, i) => (
            <div key={track.id} className="artist-track-row" onClick={() => handlePlayTrack(track, tracks)}>
              <div className="artist-track-num">
                {currentTrack?.id === track.id && isPlaying ? (
                  <span className="artist-equalizer"><span /><span /><span /></span>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <img src={track.cover} alt={track.title} className="artist-track-img" />
              <div className="artist-track-info">
                <span className={`artist-track-title ${currentTrack?.id === track.id ? 'active' : ''}`}>{track.title}</span>
                {track.album && <span className="artist-track-album">{track.album}</span>}
              </div>
              <button
                className={`artist-track-like ${liked.has(track.id) ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
              >
                <Icon.Heart filled={liked.has(track.id)} />
              </button>
              <span className="artist-track-duration">{formatTime(track.duration)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Albums */}
      {artist.albums.length > 0 && (
        <section className="artist-section">
          <h2>Álbuns</h2>
          <div className="artist-albums-grid">
            {artist.albums.map((album) => {
              const albumTrack = tracks.find(t => t.album === album);
              return (
                <div key={album} className="artist-album-card">
                  <img src={albumTrack?.cover} alt={album} className="artist-album-cover" />
                  <span className="artist-album-name">{album}</span>
                  <span className="artist-album-meta">Álbum · {artist.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* About */}
      <section className="artist-section artist-about">
        <h2>Sobre</h2>
        <div className="artist-about-card" style={{ background: `linear-gradient(135deg, ${heroColor}33, transparent)` }}>
          <img
            src={artist.cover || `https://picsum.photos/seed/${encodeURIComponent(artistName)}/600/600`}
            alt={artist.name}
            className="artist-about-img"
          />
          <div className="artist-about-content">
            <h3>{artist.name}</h3>
            <p>
              {artist.name} tem {artist.trackCount} {artist.trackCount === 1 ? 'faixa' : 'faixas'} disponíveis
              na plataforma, com um total de {formatTotalDuration(artist.totalDuration)} de música.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
