'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import './spotify.css';

// API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function normaliseTrack(t) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album || '',
    duration: Number(t.duration) || 0,
    cover: t.cover || `https://picsum.photos/seed/${t.id}/400/400`,
    color: t.color || '#1DB954',
    hlsUrl: t.hls_slug ? `${API_URL}/stream/${t.hls_slug}/index.m3u8` : null,
  };
}

const CATEGORIES = ['Todos', 'Música', 'Podcasts', 'Ao Vivo', 'Lançamentos'];

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Library: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5H10V5h8v2zm0 4H10V9h8v2zm-3 4h-5v-2h5v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  Prev: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  ),
  Next: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  ),
  Shuffle: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  ),
  Repeat: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  ),
  Volume: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  ),
  Heart: ({ filled }) => (
    <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="20" height="20">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  Dots: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  Queue: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </svg>
  ),
  Mic: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  ),
  HLS: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8 3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </svg>
  ),
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function SpotifyClone() {
  const [activeNav, setActiveNav] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [liked, setLiked] = useState(new Set());
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hlsStatus, setHlsStatus] = useState('idle');
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);
  const animRef = useRef(null);

  // Load tracks & playlists from API
  useEffect(() => {
    async function load() {
      try {
        const [rawTracks, rawPlaylists] = await Promise.all([
          apiFetch('/tracks'),
          apiFetch('/playlists'),
        ]);
        const normalised = rawTracks.map(normaliseTrack);
        setTracks(normalised);
        setQueue(normalised);
        setPlaylists(rawPlaylists);
      } catch (e) {
        console.error('Erro ao carregar dados da API:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Refresh tracks from API (called after add/delete)
  const refreshTracks = useCallback(async () => {
    try {
      const raw = await apiFetch('/tracks');
      const normalised = raw.map(normaliseTrack);
      setTracks(normalised);
      setQueue(normalised);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshPlaylists = useCallback(async () => {
    try {
      const raw = await apiFetch('/playlists');
      setPlaylists(raw);
    } catch (e) {
      console.error(e);
    }
  }, []);


  // ─── HLS Player logic ────────────────────────────────────────────────────
  const loadHlsTrack = useCallback((track) => {
    if (!track.hlsUrl || !audioRef.current) return;
    setHlsStatus('loading');

    const run = (Hls) => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(track.hlsUrl);
        hls.attachMedia(audioRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setHlsStatus('ready');
          audioRef.current.play();
          setIsPlaying(true);
        });
        hls.on(Hls.Events.ERROR, () => setHlsStatus('error'));
      } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        audioRef.current.src = track.hlsUrl;
        audioRef.current.play();
        setHlsStatus('ready');
        setIsPlaying(true);
      }
    };

    // Load hls.js from CDN at runtime (avoids SSR/bundler issues)
    if (window.Hls) {
      run(window.Hls);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      script.onload = () => run(window.Hls);
      script.onerror = () => setHlsStatus('error');
      document.head.appendChild(script);
    }
  }, []);

  const playTrack = useCallback((track) => {
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);

    if (track.hlsUrl) {
      loadHlsTrack(track);
    } else {
      // Mock play: just simulate with timer
      if (audioRef.current) {
        audioRef.current.src = '';
      }
      setIsPlaying(true);
      setDuration(track.duration);
    }
  }, [loadHlsTrack]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      playTrack(tracks[0]);
      return;
    }
    if (currentTrack.hlsUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying((p) => !p);
  }, [currentTrack, isPlaying, playTrack]);

  const playNext = useCallback(() => {
    if (!currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (idx + 1) % queue.length;
    playTrack(queue[nextIdx]);
  }, [currentTrack, queue, shuffle, playTrack]);

  const playPrev = useCallback(() => {
    if (!currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    playTrack(queue[prevIdx]);
  }, [currentTrack, queue, playTrack]);

  // ─── Simulate progress for mock tracks ────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    if (currentTrack.hlsUrl) return; // Real audio handles its own time

    const totalDuration = currentTrack.duration;

    const tick = () => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= totalDuration) {
          setIsPlaying(false);
          if (repeat) {
            setCurrentTime(0);
            setProgress(0);
            setIsPlaying(true);
            return 0;
          }
          playNext();
          return 0;
        }
        setProgress((next / totalDuration) * 100);
        return next;
      });
    };

    animRef.current = setInterval(tick, 250);
    return () => clearInterval(animRef.current);
  }, [isPlaying, currentTrack, repeat, playNext]);

  // ─── Audio element events ──────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play(); }
      else playNext();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeat, playNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleProgressClick = (e) => {
    if (!currentTrack) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = currentTrack.hlsUrl ? (audioRef.current?.duration || 0) : currentTrack.duration;
    const newTime = ratio * dur;
    if (currentTrack.hlsUrl && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setProgress(ratio * 100);
    setCurrentTime(newTime);
  };

  const toggleLike = (id) => {
    setLiked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filtered = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <SpotifyLogo />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <audio ref={audioRef} />
      {showAdmin && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
          onRefreshTracks={refreshTracks}
          onRefreshPlaylists={refreshPlaylists}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <SpotifyLogo />
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'home', label: 'Início', icon: <Icon.Home /> },
            { id: 'search', label: 'Buscar', icon: <Icon.Search /> },
            { id: 'library', label: 'Sua Biblioteca', icon: <Icon.Library /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-item ${activeNav === id ? 'active' : ''}`}
              onClick={() => setActiveNav(id)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-section">
          <button className="sidebar-action">
            <span className="icon-wrap green"><Icon.Plus /></span>
            Criar playlist
          </button>
          <button className="sidebar-action">
            <span className="icon-wrap blue"><Icon.Heart filled={false} /></span>
            Músicas curtidas
          </button>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-playlists">
          {playlists.map((pl) => (
            <button key={pl.id} className="playlist-item">
              <img src={pl.cover} alt={pl.name} className="playlist-thumb" />
              <span>{pl.name}</span>
            </button>
          ))}
        </div>

        {/* HLS Status badge */}
        {currentTrack?.hlsUrl && (
          <div className={`hls-badge ${hlsStatus}`}>
            <Icon.HLS />
            <span>HLS {hlsStatus === 'ready' ? '● AO VIVO' : hlsStatus === 'loading' ? 'carregando…' : hlsStatus === 'error' ? 'erro' : ''}</span>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-nav">
            <button className="nav-arrow" onClick={() => {}}>‹</button>
            <button className="nav-arrow" onClick={() => {}}>›</button>
          </div>

          {activeNav === 'search' && (
            <div className="search-wrap">
              <Icon.Search />
              <input
                className="search-input"
                placeholder="O que você quer ouvir?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="topbar-right">
            <button className="topbar-btn">Instalar app</button>
            <button className="topbar-btn topbar-btn--outline">Cadastrar</button>
            <button className="topbar-btn topbar-btn--filled">Entrar</button>
            <button className="topbar-btn topbar-btn--admin" onClick={() => setShowAdmin(true)}>+ Gerenciar</button>
          </div>
        </header>

        {/* Content area */}
        <div className="content">
          {activeNav === 'home' && (
            <HomeView
              tracks={tracks}
              playlists={playlists}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              liked={liked}
              onPlay={playTrack}
              onToggleLike={toggleLike}
            />
          )}
          {activeNav === 'search' && (
            <SearchView
              tracks={filtered}
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategory={setActiveCategory}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              liked={liked}
              onPlay={playTrack}
              onToggleLike={toggleLike}
            />
          )}
          {activeNav === 'library' && (
            <LibraryView
              playlists={playlists}
              tracks={tracks}
              liked={liked}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={playTrack}
            />
          )}
        </div>
      </main>

      {/* ── Player Bar ── */}
      <footer className="player-bar">
        {/* Left: current track info */}
        <div className="player-track">
          {currentTrack ? (
            <>
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className="player-cover"
                style={{ boxShadow: `0 0 20px ${currentTrack.color}55` }}
              />
              <div className="player-info">
                <span className="player-title">{currentTrack.title}</span>
                <span className="player-artist">{currentTrack.artist}</span>
              </div>
              <button className="player-like" onClick={() => toggleLike(currentTrack.id)}>
                <Icon.Heart filled={liked.has(currentTrack.id)} />
              </button>
            </>
          ) : (
            <div className="player-empty">Nenhuma faixa selecionada</div>
          )}
        </div>

        {/* Center: controls + progress */}
        <div className="player-center">
          <div className="player-controls">
            <button
              className={`ctrl-btn ${shuffle ? 'active' : ''}`}
              onClick={() => setShuffle((s) => !s)}
              title="Aleatório"
            >
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
            <button
              className={`ctrl-btn ${repeat ? 'active' : ''}`}
              onClick={() => setRepeat((r) => !r)}
              title="Repetir"
            >
              <Icon.Repeat />
            </button>
          </div>
          <div className="player-progress">
            <span className="time">{formatTime(currentTime)}</span>
            <div
              className="progress-bar"
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: currentTrack?.color || '#1DB954',
                }}
              />
              <div
                className="progress-thumb"
                style={{
                  left: `${progress}%`,
                  background: currentTrack?.color || '#1DB954',
                }}
              />
            </div>
            <span className="time">{formatTime(currentTrack?.hlsUrl ? duration : currentTrack?.duration)}</span>
          </div>
        </div>

        {/* Right: volume & extras */}
        <div className="player-right">
          <button className="ctrl-btn small"><Icon.Mic /></button>
          <button className="ctrl-btn small"><Icon.Queue /></button>
          <div className="volume-wrap">
            <Icon.Volume />
            <div className="volume-bar" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100));
            }}>
              <div className="volume-fill" style={{ width: `${volume}%` }} />
              <div className="volume-thumb" style={{ left: `${volume}%` }} />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── View Components ───────────────────────────────────────────────────────────

function HomeView({ tracks, playlists, currentTrack, isPlaying, liked, onPlay, onToggleLike }) {
  return (
    <div className="view">
      <section className="section">
        <h2 className="section-title">Boa noite</h2>
        <div className="quick-grid">
          {playlists.map((pl) => (
            <button key={pl.id} className="quick-card" onClick={() => onPlay(tracks[0])}>
              <img src={pl.cover} alt={pl.name} className="quick-cover" />
              <span>{pl.name}</span>
              <div className="quick-play">
                <Icon.Play />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Feito para você</h2>
          <button className="see-all">Ver tudo</button>
        </div>
        <div className="cards-row">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              liked={liked.has(track.id)}
              onPlay={onPlay}
              onLike={onToggleLike}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Tocadas recentemente</h2>
          <button className="see-all">Ver tudo</button>
        </div>
        <div className="cards-row">
          {[...tracks].reverse().map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              liked={liked.has(track.id)}
              onPlay={onPlay}
              onLike={onToggleLike}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchView({ tracks, categories, activeCategory, onCategory, currentTrack, isPlaying, liked, onPlay, onToggleLike }) {
  return (
    <div className="view">
      <section className="section">
        <h2 className="section-title">Procurar por categoria</h2>
        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {tracks.length > 0 ? (
        <section className="section">
          <h2 className="section-title">Resultados</h2>
          <div className="track-list">
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                liked={liked.has(track.id)}
                onPlay={onPlay}
                onLike={onToggleLike}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <p>Nenhum resultado encontrado</p>
        </div>
      )}

      <section className="section">
        <h2 className="section-title">Todos os artistas</h2>
        <div className="cards-row">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              liked={liked.has(track.id)}
              onPlay={onPlay}
              onLike={onToggleLike}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function LibraryView({ playlists, tracks, liked, currentTrack, isPlaying, onPlay }) {
  return (
    <div className="view">
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Sua Biblioteca</h2>
          <button className="icon-btn"><Icon.Plus /></button>
        </div>

        <div className="library-filters">
          {['Playlists', 'Artistas', 'Álbuns'].map((f) => (
            <button key={f} className="library-filter">{f}</button>
          ))}
        </div>

        <div className="library-list">
          {playlists.map((pl) => (
            <div key={pl.id} className="library-item">
              <img src={pl.cover} alt={pl.name} className="library-thumb" />
              <div className="library-info">
                <span className="library-name">{pl.name}</span>
                <span className="library-meta">Playlist • {pl.tracks.length} músicas</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Músicas curtidas</h2>
        <div className="track-list">
          {tracks
            .filter((t) => liked.has(t.id))
            .map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                liked
                onPlay={onPlay}
                onLike={() => {}}
              />
            ))}
          {!tracks.some((t) => liked.has(t.id)) && (
            <p className="empty-hint">Curta algumas músicas para vê-las aqui.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function TrackCard({ track, isCurrent, isPlaying, liked, onPlay, onLike }) {
  return (
    <div className={`track-card ${isCurrent ? 'current' : ''}`} style={{ '--accent': track.color }}>
      <div className="track-card-img-wrap">
        <img src={track.cover} alt={track.title} className="track-card-img" />
        <button
          className={`track-card-play ${isCurrent && isPlaying ? 'visible' : ''}`}
          onClick={() => onPlay(track)}
        >
          {isCurrent && isPlaying ? <Icon.Pause /> : <Icon.Play />}
        </button>
      </div>
      <div className="track-card-body">
        <span className="track-card-title">{track.title}</span>
        <span className="track-card-artist">{track.artist}</span>
      </div>
    </div>
  );
}

function TrackRow({ track, index, isCurrent, isPlaying, liked, onPlay, onLike }) {
  return (
    <div className={`track-row ${isCurrent ? 'current' : ''}`} onClick={() => onPlay(track)}>
      <div className="track-row-num">
        {isCurrent && isPlaying ? (
          <span className="equalizer">
            <span /><span /><span />
          </span>
        ) : (
          <span>{index}</span>
        )}
      </div>
      <img src={track.cover} alt={track.title} className="track-row-img" />
      <div className="track-row-info">
        <span className={`track-row-title ${isCurrent ? 'green' : ''}`}>{track.title}</span>
        <span className="track-row-artist">{track.artist}</span>
      </div>
      <span className="track-row-album">{track.album}</span>
      <button
        className={`track-row-like ${liked ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onLike(track.id); }}
      >
        <Icon.Heart filled={liked} />
      </button>
      <span className="track-row-duration">{formatTime(track.duration)}</span>
    </div>
  );
}

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 167 50" fill="none" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 0C11.193 0 0 11.193 0 25s11.193 25 25 25 25-11.193 25-25S38.807 0 25 0zm11.457 36.075a1.558 1.558 0 01-2.143.518c-5.867-3.583-13.25-4.397-21.942-2.408a1.557 1.557 0 11-.696-3.031c9.516-2.175 17.683-1.238 24.263 2.78a1.557 1.557 0 01.518 2.141zm3.057-6.8a1.948 1.948 0 01-2.678.641c-6.716-4.126-16.952-5.32-24.9-2.91a1.948 1.948 0 11-1.131-3.726c9.076-2.752 20.356-1.42 28.067 3.317a1.947 1.947 0 01.642 2.678zm.262-7.081c-8.06-4.787-21.356-5.228-29.053-2.891a2.337 2.337 0 11-1.358-4.472c8.836-2.683 23.52-2.165 32.811 3.344a2.338 2.338 0 01-2.4 4.019z" fill="#1DB954"/>
      <path d="M67.441 21.706c-3.965-.946-4.671-1.609-4.671-3.003 0-1.316 1.239-2.201 3.086-2.201 1.789 0 3.562.673 5.422 2.059a.308.308 0 00.432-.077l2.155-3.042a.308.308 0 00-.067-.423c-2.198-1.709-4.673-2.541-7.893-2.541-4.447 0-7.55 2.667-7.55 6.482 0 4.07 2.664 5.509 7.135 6.592 3.781.867 4.412 1.591 4.412 2.919 0 1.449-1.291 2.35-3.37 2.35-2.307 0-4.19-.774-6.288-2.589a.31.31 0 00-.435.033l-2.42 2.88a.31.31 0 00.029.432c2.406 2.146 5.367 3.278 8.999 3.278 4.795 0 7.894-2.632 7.894-6.705 0-3.396-2.025-5.264-6.87-6.444zm18.056-5.538c-2.162 0-3.939.852-5.407 2.592V16.5a.31.31 0 00-.31-.31h-3.954a.31.31 0 00-.31.31V39.09a.31.31 0 00.31.31h3.954a.31.31 0 00.31-.31v-7.239c1.468 1.636 3.245 2.432 5.407 2.432 4.021 0 8.09-3.096 8.09-9.059 0-5.964-4.069-9.057-8.09-9.057zm3.504 9.057c0 3.003-1.849 5.093-4.499 5.093-2.621 0-4.591-2.188-4.591-5.093 0-2.905 1.97-5.093 4.591-5.093 2.627 0 4.499 2.126 4.499 5.093zm12.67-9.057c-5.125 0-9.142 3.96-9.142 9.057 0 5.038 3.988 8.962 9.081 8.962 5.136 0 9.16-3.945 9.16-9.025 0-5.053-3.999-8.994-9.099-8.994zm0 13.762c-2.672 0-4.668-2.078-4.668-5.04 0-2.971 1.924-4.97 4.607-4.97 2.681 0 4.685 2.077 4.685 5.032 0 2.973-1.933 4.978-4.624 4.978zm20.073-13.573l-4.34 12.536-4.265-12.53a.31.31 0 00-.293-.21h-4.152a.31.31 0 00-.293.411l6.393 17.27-.045.113c-.674 1.664-1.33 2.303-2.557 2.303-.914 0-1.773-.271-2.664-.834a.313.313 0 00-.413.094l-2.032 2.796a.309.309 0 00.084.434c1.437.968 2.998 1.436 4.784 1.436 3.319 0 5.158-1.547 6.787-5.706l6.607-17.866a.31.31 0 00-.291-.417h-4.018a.311.311 0 00-.292.21zm10.484-4.606h-3.954a.31.31 0 00-.31.31v18.524a.31.31 0 00.31.31h3.954a.31.31 0 00.31-.31V16.061a.31.31 0 00-.31-.31zm2.43-4.896c0 1.697-1.379 3.069-3.086 3.069-1.706 0-3.084-1.372-3.084-3.069 0-1.699 1.378-3.072 3.084-3.072 1.707 0 3.086 1.373 3.086 3.072zm13.024 9.286h-4.355V11.15a.31.31 0 00-.31-.31h-3.954a.31.31 0 00-.31.31v5.051h-1.899a.31.31 0 00-.31.31v3.527a.31.31 0 00.31.31h1.899v8.837c0 3.573 1.778 5.383 5.282 5.383 1.424 0 2.604-.295 3.716-.927a.308.308 0 00.155-.268v-3.356a.31.31 0 00-.448-.278c-.762.382-1.496.558-2.317.558-1.267 0-1.834-.579-1.834-1.878v-8.071h4.355a.31.31 0 00.31-.31V16.5a.31.31 0 00-.29-.316zm16.27.077l-.021-.003a9.177 9.177 0 00-1.685-.157c-2.079 0-3.826.826-5.074 2.41V16.5a.31.31 0 00-.31-.31h-3.954a.31.31 0 00-.31.31v18.095a.31.31 0 00.31.31h3.954a.31.31 0 00.31-.31v-9.105c0-3.037 1.634-4.645 4.611-4.645.544 0 1.114.06 1.818.193a.31.31 0 00.361-.305v-3.87a.31.31 0 00-.21-.295z" fill="white"/>
    </svg>
  );
}



// ─── Admin Modal ──────────────────────────────────────────────────────────────
function AdminModal({ onClose, onRefreshTracks, onRefreshPlaylists }) {
  const [tab, setTab] = useState('tracks');
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', artist: '', album: '', duration: '', cover: '', color: '#1DB954', hls_slug: '' });
  const [playlistForm, setPlaylistForm] = useState({ name: '', cover: '' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [t, p] = await Promise.all([
        fetch(`${API_URL}/tracks`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`${API_URL}/playlists`, { cache: 'no-store' }).then(r => r.json()),
      ]);
      setTracks(t);
      setPlaylists(p);
    } catch (e) { setMsg('Erro ao carregar dados'); }
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handlePlaylistChange(e) {
    setPlaylistForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function addTrack(e) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: Number(form.duration) }),
      });
      setMsg('Música adicionada!');
      setForm({ title: '', artist: '', album: '', duration: '', cover: '', color: '#1DB954', hls_slug: '' });
      await loadAll();
      onRefreshTracks();
    } catch (e) { setMsg('Erro ao adicionar música'); }
  }

  async function deleteTrack(id) {
    if (!confirm('Remover esta música?')) return;
    await fetch(`${API_URL}/tracks/${id}`, { method: 'DELETE' });
    setMsg('Música removida.');
    await loadAll();
    onRefreshTracks();
  }

  async function addPlaylist(e) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistForm),
      });
      setMsg('Playlist criada!');
      setPlaylistForm({ name: '', cover: '' });
      await loadAll();
      onRefreshPlaylists();
    } catch (e) { setMsg('Erro ao criar playlist'); }
  }

  async function deletePlaylist(id) {
    if (!confirm('Remover esta playlist?')) return;
    await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE' });
    setMsg('Playlist removida.');
    await loadAll();
    onRefreshPlaylists();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Gerenciar Biblioteca</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button className={tab === 'tracks' ? 'active' : ''} onClick={() => setTab('tracks')}>Músicas</button>
          <button className={tab === 'playlists' ? 'active' : ''} onClick={() => setTab('playlists')}>Playlists</button>
        </div>

        {msg && <p className="modal-msg">{msg}</p>}

        {tab === 'tracks' && (
          <div className="modal-body">
            <form className="admin-form" onSubmit={addTrack}>
              <h3>Adicionar Música</h3>
              <div className="admin-form-grid">
                <input name="title" placeholder="Título *" value={form.title} onChange={handleChange} required />
                <input name="artist" placeholder="Artista *" value={form.artist} onChange={handleChange} required />
                <input name="album" placeholder="Álbum" value={form.album} onChange={handleChange} />
                <input name="duration" placeholder="Duração (segundos)" type="number" value={form.duration} onChange={handleChange} />
                <input name="cover" placeholder="URL da capa" value={form.cover} onChange={handleChange} />
                <input name="hls_slug" placeholder="HLS slug (ex: minha-musica)" value={form.hls_slug} onChange={handleChange} />
                <div className="color-row">
                  <label>Cor de destaque</label>
                  <input name="color" type="color" value={form.color} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="admin-btn">Adicionar</button>
            </form>

            <h3>Músicas cadastradas ({tracks.length})</h3>
            <div className="admin-list">
              {tracks.map(t => (
                <div key={t.id} className="admin-item">
                  <img src={t.cover || `https://picsum.photos/seed/${t.id}/60/60`} alt={t.title} className="admin-thumb" />
                  <div className="admin-item-info">
                    <strong>{t.title}</strong>
                    <span>{t.artist} {t.album ? `· ${t.album}` : ''}</span>
                    {t.hls_slug && <span className="hls-tag">HLS: {t.hls_slug}</span>}
                  </div>
                  <button className="admin-del" onClick={() => deleteTrack(t.id)}>✕</button>
                </div>
              ))}
              {tracks.length === 0 && <p className="empty-hint">Nenhuma música cadastrada.</p>}
            </div>
          </div>
        )}

        {tab === 'playlists' && (
          <div className="modal-body">
            <form className="admin-form" onSubmit={addPlaylist}>
              <h3>Criar Playlist</h3>
              <div className="admin-form-grid">
                <input name="name" placeholder="Nome da playlist *" value={playlistForm.name} onChange={handlePlaylistChange} required />
                <input name="cover" placeholder="URL da capa" value={playlistForm.cover} onChange={handlePlaylistChange} />
              </div>
              <button type="submit" className="admin-btn">Criar</button>
            </form>

            <h3>Playlists ({playlists.length})</h3>
            <div className="admin-list">
              {playlists.map(p => (
                <div key={p.id} className="admin-item">
                  <img src={p.cover || `https://picsum.photos/seed/pl${p.id}/60/60`} alt={p.name} className="admin-thumb" />
                  <div className="admin-item-info">
                    <strong>{p.name}</strong>
                  </div>
                  <button className="admin-del" onClick={() => deletePlaylist(p.id)}>✕</button>
                </div>
              ))}
              {playlists.length === 0 && <p className="empty-hint">Nenhuma playlist criada.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
