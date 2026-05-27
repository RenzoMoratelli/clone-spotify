'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Mock data ────────────────────────────────────────────────────────────────
const FEATURED = [
  {
    id: 1,
    title: 'Neon Horizons',
    artist: 'Synthwave Collective',
    album: 'Neon Horizons',
    duration: 214,
    cover: 'https://picsum.photos/seed/neon/400/400',
    color: '#1DB954',
    hlsUrl: null,
  },
  {
    id: 2,
    title: 'Midnight Drive',
    artist: 'The Wanderers',
    album: 'Late Night Tapes',
    duration: 187,
    cover: 'https://picsum.photos/seed/midnight/400/400',
    color: '#E91E63',
    hlsUrl: null,
  },
  {
    id: 3,
    title: 'Solar Flare',
    artist: 'Astral Project',
    album: 'Orbit',
    duration: 253,
    cover: 'https://picsum.photos/seed/solar/400/400',
    color: '#FF9800',
    hlsUrl: null,
  },
  {
    id: 4,
    title: 'Ocean Floor',
    artist: 'Deep Current',
    album: 'Submerge',
    duration: 198,
    cover: 'https://picsum.photos/seed/ocean/400/400',
    color: '#2196F3',
    hlsUrl: null,
  },
  {
    id: 5,
    title: 'City Lights',
    artist: 'Urban Echo',
    album: 'Concrete Jungle',
    duration: 221,
    cover: 'https://picsum.photos/seed/city/400/400',
    color: '#9C27B0',
    hlsUrl: null,
  },
  {
    id: 6,
    title: 'Fire Season',
    artist: 'Emberfield',
    album: 'Summer Burns',
    duration: 176,
    cover: 'https://picsum.photos/seed/fire/400/400',
    color: '#FF5722',
    hlsUrl: null,
  },
];

const PLAYLISTS = [
  { id: 'p1', name: 'Chill Vibes', cover: 'https://picsum.photos/seed/chill/200/200', tracks: [1, 3, 5] },
  { id: 'p2', name: 'Late Night Drive', cover: 'https://picsum.photos/seed/latenight/200/200', tracks: [2, 4, 6] },
  { id: 'p3', name: 'Morning Energy', cover: 'https://picsum.photos/seed/morning/200/200', tracks: [1, 2, 3, 4] },
  { id: 'p4', name: 'Focus Mode', cover: 'https://picsum.photos/seed/focus/200/200', tracks: [3, 5, 6] },
];

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
  const [queue, setQueue] = useState([...FEATURED]);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);
  const animRef = useRef(null);

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
      playTrack(FEATURED[0]);
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

  const filtered = FEATURED.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <audio ref={audioRef} />

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
          {PLAYLISTS.map((pl) => (
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
          </div>
        </header>

        {/* Content area */}
        <div className="content">
          {activeNav === 'home' && (
            <HomeView
              tracks={FEATURED}
              playlists={PLAYLISTS}
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
              playlists={PLAYLISTS}
              tracks={FEATURED}
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

      <style>{CSS}</style>
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

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;500;700;900&family=DM+Sans:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #121212;
    --surface: #181818;
    --surface-hover: #282828;
    --surface-active: #333333;
    --border: #282828;
    --text: #ffffff;
    --text-secondary: #b3b3b3;
    --text-dim: #727272;
    --green: #1DB954;
    --green-hover: #1ed760;
    --player-h: 90px;
    --sidebar-w: 240px;
    --font: 'DM Sans', sans-serif;
    --radius: 8px;
  }

  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font); overflow: hidden; }

  .app {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    grid-template-rows: 1fr var(--player-h);
    grid-template-areas: "sidebar main" "player player";
    height: 100vh;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .sidebar {
    grid-area: sidebar;
    background: #000;
    display: flex;
    flex-direction: column;
    padding: 8px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: #404040 transparent;
    gap: 4px;
  }
  .sidebar-logo { padding: 16px 12px 8px; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 10px 12px; border: none;
    background: transparent; color: var(--text-secondary);
    border-radius: var(--radius); cursor: pointer;
    font-family: var(--font); font-size: 14px; font-weight: 700;
    transition: color 0.15s, background 0.15s;
    text-align: left;
  }
  .nav-item:hover { color: var(--text); }
  .nav-item.active { color: var(--text); }

  .sidebar-section { padding: 16px 0 8px; display: flex; flex-direction: column; gap: 2px; }
  .sidebar-action {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 10px 12px; border: none;
    background: transparent; color: var(--text-secondary);
    cursor: pointer; font-family: var(--font); font-size: 14px; font-weight: 700;
    transition: color 0.15s; border-radius: var(--radius);
    text-align: left;
  }
  .sidebar-action:hover { color: var(--text); }

  .icon-wrap {
    width: 28px; height: 28px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .icon-wrap.green { background: var(--text); color: #000; }
  .icon-wrap.blue { background: #4b0082; color: var(--text); }

  .sidebar-divider { height: 1px; background: var(--border); margin: 8px 12px; }

  .sidebar-playlists { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .playlist-item {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 8px 12px; border: none;
    background: transparent; color: var(--text-secondary);
    cursor: pointer; font-size: 13px; font-family: var(--font);
    border-radius: var(--radius); transition: color 0.15s, background 0.15s;
    text-align: left;
  }
  .playlist-item:hover { color: var(--text); background: var(--surface-hover); }
  .playlist-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }

  .hls-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px; font-size: 11px; font-weight: 700;
    border-radius: var(--radius); margin: 8px;
    letter-spacing: 0.05em;
  }
  .hls-badge.ready { background: rgba(29,185,84,.15); color: var(--green); }
  .hls-badge.loading { background: rgba(255,152,0,.15); color: #FF9800; }
  .hls-badge.error { background: rgba(244,67,54,.15); color: #F44336; }

  /* ── Main ── */
  .main {
    grid-area: main;
    display: flex; flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, #1a1a2e 0%, var(--bg) 30%);
  }

  .topbar {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; flex-shrink: 0;
    position: relative; z-index: 10;
  }
  .topbar-nav { display: flex; gap: 8px; }
  .nav-arrow {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(0,0,0,.5); border: none;
    color: var(--text); font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    line-height: 1; transition: background 0.15s;
  }
  .nav-arrow:hover { background: rgba(255,255,255,.15); }

  .search-wrap {
    flex: 1; max-width: 360px; display: flex; align-items: center;
    gap: 10px; background: var(--text); color: #000;
    border-radius: 500px; padding: 8px 16px;
  }
  .search-wrap svg { flex-shrink: 0; opacity: 0.6; }
  .search-input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font); font-size: 14px; font-weight: 500; color: #000;
  }

  .topbar-right { margin-left: auto; display: flex; gap: 8px; }
  .topbar-btn {
    padding: 8px 16px; border-radius: 500px; font-family: var(--font);
    font-size: 13px; font-weight: 700; cursor: pointer; border: none;
    background: transparent; color: var(--text-secondary);
    transition: color 0.15s;
  }
  .topbar-btn:hover { color: var(--text); }
  .topbar-btn--outline {
    border: 1px solid #727272; color: var(--text);
    padding: 7px 16px;
  }
  .topbar-btn--outline:hover { border-color: var(--text); }
  .topbar-btn--filled { background: var(--text); color: #000; }
  .topbar-btn--filled:hover { background: #f0f0f0; transform: scale(1.04); }

  .content {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    scrollbar-width: thin; scrollbar-color: #404040 transparent;
  }
  .content::-webkit-scrollbar { width: 6px; }
  .content::-webkit-scrollbar-track { background: transparent; }
  .content::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }

  /* ── Views ── */
  .view { padding: 0 24px 24px; }
  .section { margin-bottom: 32px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .section-title { font-size: 22px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.3px; }
  .section-header .section-title { margin-bottom: 0; }
  .see-all {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-secondary);
    background: none; border: none; cursor: pointer; font-family: var(--font);
    padding: 4px;
  }
  .see-all:hover { color: var(--text); text-decoration: underline; }

  /* Quick grid */
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
  }
  .quick-card {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface-hover); border: none; border-radius: var(--radius);
    cursor: pointer; overflow: hidden; font-family: var(--font);
    font-size: 14px; font-weight: 700; color: var(--text);
    padding-right: 16px; position: relative;
    transition: background 0.15s;
  }
  .quick-card:hover { background: var(--surface-active); }
  .quick-card:hover .quick-play { opacity: 1; transform: translateY(0); }
  .quick-cover { width: 56px; height: 56px; object-fit: cover; flex-shrink: 0; }
  .quick-play {
    position: absolute; right: 12px;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--green); color: #000;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: translateY(4px);
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 8px 16px rgba(0,0,0,0.5);
  }

  /* Cards row */
  .cards-row {
    display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none;
  }
  .cards-row::-webkit-scrollbar { display: none; }

  .track-card {
    flex-shrink: 0; width: 160px;
    background: var(--surface); border-radius: var(--radius);
    padding: 16px; cursor: pointer;
    transition: background 0.2s;
  }
  .track-card:hover { background: var(--surface-hover); }
  .track-card.current { background: var(--surface-hover); }
  .track-card-img-wrap { position: relative; margin-bottom: 14px; }
  .track-card-img { width: 100%; aspect-ratio: 1; border-radius: 4px; object-fit: cover; display: block; }
  .track-card-play {
    position: absolute; bottom: 8px; right: 8px;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--accent, var(--green)); color: #000;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: translateY(8px);
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  }
  .track-card:hover .track-card-play,
  .track-card-play.visible { opacity: 1; transform: translateY(0); }
  .track-card-title { display: block; font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
  .track-card-artist { display: block; font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Categories */
  .categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .category-pill {
    padding: 8px 16px; border-radius: 500px;
    background: var(--surface-hover); border: none;
    color: var(--text); font-family: var(--font); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .category-pill:hover { background: var(--surface-active); }
  .category-pill.active { background: var(--text); color: #000; }

  /* Track list */
  .track-list { display: flex; flex-direction: column; }
  .track-row {
    display: grid;
    grid-template-columns: 40px 44px 1fr 1fr 32px 56px;
    align-items: center; gap: 12px;
    padding: 8px 12px; border-radius: var(--radius);
    cursor: pointer; transition: background 0.15s;
  }
  .track-row:hover { background: var(--surface-hover); }
  .track-row.current { background: rgba(255,255,255,0.06); }
  .track-row-num { display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px; }
  .track-row-img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
  .track-row-info { min-width: 0; }
  .track-row-title { display: block; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-row-title.green { color: var(--green); }
  .track-row-artist { display: block; font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-row-album { font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-row-like { background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; padding: 4px; border-radius: 4px; opacity: 0; transition: opacity 0.15s; }
  .track-row:hover .track-row-like { opacity: 1; }
  .track-row-like.active { opacity: 1; color: var(--green); }
  .track-row-duration { font-size: 13px; color: var(--text-secondary); text-align: right; }

  /* Equalizer animation */
  .equalizer { display: flex; align-items: flex-end; gap: 2px; height: 16px; }
  .equalizer span {
    width: 3px; background: var(--green); border-radius: 1px;
    animation: eq 0.8s ease-in-out infinite;
  }
  .equalizer span:nth-child(1) { animation-delay: 0s; }
  .equalizer span:nth-child(2) { animation-delay: 0.2s; }
  .equalizer span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes eq {
    0%, 100% { height: 4px; }
    50% { height: 16px; }
  }

  /* Library */
  .library-filters { display: flex; gap: 8px; margin-bottom: 16px; }
  .library-filter {
    padding: 6px 14px; border-radius: 500px;
    background: var(--surface-hover); border: none;
    color: var(--text); font-family: var(--font); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .library-filter:hover { background: var(--surface-active); }
  .library-list { display: flex; flex-direction: column; gap: 4px; }
  .library-item {
    display: flex; align-items: center; gap: 12px;
    padding: 8px 12px; border-radius: var(--radius);
    transition: background 0.15s; cursor: pointer;
  }
  .library-item:hover { background: var(--surface-hover); }
  .library-thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
  .library-name { display: block; font-size: 14px; font-weight: 600; }
  .library-meta { font-size: 12px; color: var(--text-secondary); }
  .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; border-radius: 4px; }
  .icon-btn:hover { color: var(--text); }

  .empty-hint { color: var(--text-secondary); font-size: 14px; padding: 20px 12px; }
  .empty-state { display: flex; align-items: center; justify-content: center; padding: 60px 0; color: var(--text-secondary); font-size: 15px; }

  /* ── Player ── */
  .player-bar {
    grid-area: player;
    display: grid; grid-template-columns: 1fr 2fr 1fr;
    align-items: center; gap: 8px;
    background: #181818; border-top: 1px solid #282828;
    padding: 0 16px;
    height: var(--player-h);
  }

  .player-track { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .player-cover { width: 56px; height: 56px; border-radius: 4px; object-fit: cover; flex-shrink: 0; transition: box-shadow 0.4s; }
  .player-info { min-width: 0; }
  .player-title { display: block; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .player-artist { display: block; font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .player-like { background: none; border: none; cursor: pointer; color: var(--text-secondary); flex-shrink: 0; padding: 4px; }
  .player-empty { font-size: 13px; color: var(--text-dim); }

  .player-center { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .player-controls { display: flex; align-items: center; gap: 16px; }

  .ctrl-btn {
    background: none; border: none; cursor: pointer;
    color: var(--text-secondary); padding: 4px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, transform 0.1s;
  }
  .ctrl-btn:hover { color: var(--text); transform: scale(1.06); }
  .ctrl-btn.active { color: var(--green); }
  .ctrl-btn.small svg { width: 18px; height: 18px; }

  .play-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--text); color: #000; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: transform 0.1s, background 0.15s;
    flex-shrink: 0;
  }
  .play-btn:hover { transform: scale(1.06); background: #f0f0f0; }

  .player-progress {
    display: flex; align-items: center; gap: 8px; width: 100%;
  }
  .time { font-size: 11px; color: var(--text-secondary); min-width: 36px; text-align: center; }
  .progress-bar {
    flex: 1; height: 4px; background: #4d4d4d; border-radius: 2px;
    cursor: pointer; position: relative;
    transition: height 0.1s;
  }
  .progress-bar:hover { height: 6px; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width 0.1s linear; pointer-events: none; }
  .progress-thumb {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 12px; height: 12px; border-radius: 50%;
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s, left 0.1s linear;
  }
  .progress-bar:hover .progress-thumb { opacity: 1; }

  .player-right { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .volume-wrap { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); }
  .volume-bar {
    width: 90px; height: 4px; background: #4d4d4d; border-radius: 2px;
    cursor: pointer; position: relative;
  }
  .volume-bar:hover { height: 6px; }
  .volume-fill { height: 100%; background: var(--text-secondary); border-radius: 2px; transition: width 0.05s; }
  .volume-bar:hover .volume-fill { background: var(--green); }
  .volume-thumb {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 12px; height: 12px; border-radius: 50%; background: var(--text);
    opacity: 0;
  }
  .volume-bar:hover .volume-thumb { opacity: 1; }

  /* Scrollbar */
  .sidebar::-webkit-scrollbar { width: 6px; }
  .sidebar::-webkit-scrollbar-track { background: transparent; }
  .sidebar::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }
`;
