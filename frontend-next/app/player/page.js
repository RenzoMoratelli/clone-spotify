'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from '../../context/PlayerContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store', ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('spotify_token');
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('spotify_user') || 'null'); } catch { return null; }
}
function clearAuth() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_user');
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

const CATEGORIES = ['Todos', 'Música', 'Podcasts', 'Ao Vivo', 'Lançamentos'];

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const Icon = {
  Home: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Library: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5H10V5h8v2zm0 4H10V9h8v2zm-3 4h-5v-2h5v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  HLS: () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8 3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>,
};

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="#1DB954" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export default function PlayerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const {
    queue, setQueue, currentTrack, isPlaying, liked, toggleLike, playTrack,
  } = usePlayer();

  // Auth guard
  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, []);

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const [rawTracks, rawPlaylists] = await Promise.all([
          apiFetch('/tracks'), apiFetch('/playlists'),
        ]);
        const normalised = rawTracks.map(normaliseTrack);
        setTracks(normalised);
        if (queue.length === 0) setQueue(normalised);
        setPlaylists(rawPlaylists);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const refreshTracks = useCallback(async () => {
    try {
      const raw = await apiFetch('/tracks');
      const n = raw.map(normaliseTrack);
      setTracks(n);
      setQueue(n);
    } catch (e) { console.error(e); }
  }, [setQueue]);

  const refreshPlaylists = useCallback(async () => {
    try { setPlaylists(await apiFetch('/playlists')); } catch (e) { console.error(e); }
  }, []);

  function handlePlay(track) {
    playTrack(track, tracks);
  }

  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  function handleLogout() { clearAuth(); router.push('/'); }

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
      {showAdmin && user && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
          onRefreshTracks={refreshTracks}
          onRefreshPlaylists={refreshPlaylists}
          token={getToken()}
        />
      )}
      {showCreatePlaylist && (
        <CreatePlaylistModal
          token={getToken()}
          onClose={() => setShowCreatePlaylist(false)}
          onCreated={async (pl) => {
            setShowCreatePlaylist(false);
            await refreshPlaylists();
          }}
        />
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo"><SpotifyLogo /></div>
        <nav className="sidebar-nav">
          {[
            { id: 'home', label: 'Início', icon: <Icon.Home /> },
            { id: 'search', label: 'Buscar', icon: <Icon.Search /> },
            { id: 'library', label: 'Sua Biblioteca', icon: <Icon.Library /> },
          ].map(({ id, label, icon }) => (
            <button key={id} className={`nav-item ${activeNav === id ? 'active' : ''}`} onClick={() => setActiveNav(id)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section">
          <button className="sidebar-action" onClick={() => setShowCreatePlaylist(true)}><span className="icon-wrap green"><Icon.Plus /></span>Criar playlist</button>
          <button className="sidebar-action" onClick={() => router.push('/player/liked')}><span className="icon-wrap blue"><Icon.Heart filled={false} /></span>Músicas curtidas</button>
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-playlists">
          {playlists.map(pl => (
            <Link
              key={pl.id}
              href={`/player/playlist/${pl.id}`}
              className="playlist-item"
            >
              <img src={pl.cover || `https://picsum.photos/seed/pl${pl.id}/200/200`} alt={pl.name} className="playlist-thumb" />
              <div className="pl-sidebar-info">
                <span className="pl-sidebar-name">{pl.name}</span>
                <span className="pl-sidebar-meta">Playlist · {pl.trackCount || 0} músicas</span>
              </div>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <div className="topbar-nav">
            <button className="nav-arrow" onClick={() => router.back()}>‹</button>
            <button className="nav-arrow" onClick={() => router.forward()}>›</button>
          </div>
          {activeNav === 'search' && (
            <div className="search-wrap">
              <Icon.Search />
              <input className="search-input" placeholder="O que você quer ouvir?" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            </div>
          )}
          <div className="topbar-right">
            {user && (
              <>
                <span className="topbar-user">Olá, {user.name.split(' ')[0]}</span>
                <button className="topbar-btn topbar-btn--admin" onClick={() => setShowAdmin(true)}>+ Gerenciar</button>
                <button className="topbar-btn topbar-btn--outline" onClick={handleLogout}>Sair</button>
              </>
            )}
          </div>
        </header>

        <div className="content">
          {activeNav === 'home' && <HomeView tracks={tracks} playlists={playlists} currentTrack={currentTrack} isPlaying={isPlaying} liked={liked} onPlay={handlePlay} onToggleLike={toggleLike} />}
          {activeNav === 'search' && <SearchView tracks={filtered} categories={CATEGORIES} activeCategory={activeCategory} onCategory={setActiveCategory} currentTrack={currentTrack} isPlaying={isPlaying} liked={liked} onPlay={handlePlay} onToggleLike={toggleLike} />}
          {activeNav === 'library' && <LibraryView playlists={playlists} liked={liked} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={handlePlay} onToggleLike={toggleLike} />}
        </div>
      </main>
    </div>
  );
}

// Views
function HomeView({ tracks, playlists, currentTrack, isPlaying, liked, onPlay, onToggleLike }) {
  return (
    <div className="view">
      <section className="section">
        <h2 className="section-title">Boa noite</h2>
        <div className="quick-grid">
          {playlists.map(pl => (
            <button key={pl.id} className="quick-card" onClick={() => tracks[0] && onPlay(tracks[0])}>
              <img src={pl.cover || `https://picsum.photos/seed/pl${pl.id}/200/200`} alt={pl.name} className="quick-cover" />
              <span>{pl.name}</span>
              <div className="quick-play"><Icon.Play /></div>
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
          {tracks.map(track => (
            <TrackCard key={track.id} track={track} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying && currentTrack?.id === track.id} liked={liked.has(track.id)} onPlay={onPlay} onLike={onToggleLike} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Tocadas recentemente</h2>
          <button className="see-all">Ver tudo</button>
        </div>
        <div className="cards-row">
          {[...tracks].reverse().map(track => (
            <TrackCard key={track.id} track={track} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying && currentTrack?.id === track.id} liked={liked.has(track.id)} onPlay={onPlay} onLike={onToggleLike} />
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
          {categories.map(cat => (
            <button key={cat} className={`category-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => onCategory(cat)}>{cat}</button>
          ))}
        </div>
      </section>
      {tracks.length > 0 ? (
        <section className="section">
          <h2 className="section-title">Resultados</h2>
          <div className="track-list">
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i + 1} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying && currentTrack?.id === track.id} liked={liked.has(track.id)} onPlay={onPlay} onLike={onToggleLike} />
            ))}
          </div>
        </section>
      ) : <div className="empty-state"><p>Nenhum resultado encontrado</p></div>}
      <section className="section">
        <h2 className="section-title">Todas as músicas</h2>
        <div className="cards-row">
          {tracks.map(track => (
            <TrackCard key={track.id} track={track} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying && currentTrack?.id === track.id} liked={liked.has(track.id)} onPlay={onPlay} onLike={onToggleLike} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LibraryView({ playlists, liked, currentTrack, isPlaying, onPlay, onToggleLike }) {
  const [likedTracks, setLikedTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiked() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('spotify_token') : null;
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/me/liked`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) setLikedTracks((await res.json()).map(normaliseTrack));
      } catch {}
      setLoading(false);
    }
    loadLiked();
  }, [liked]); // re-fetch whenever liked set changes

  return (
    <div className="view">
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Sua Biblioteca</h2>
        </div>
        <div className="library-filters">
          {['Playlists', 'Artistas', 'Álbuns'].map(f => <button key={f} className="library-filter">{f}</button>)}
        </div>
        <div className="library-list">
          {playlists.map(pl => (
            <Link key={pl.id} href={`/player/playlist/${pl.id}`} className="library-item" style={{ textDecoration: 'none' }}>
              <img src={pl.cover || `https://picsum.photos/seed/pl${pl.id}/200/200`} alt={pl.name} className="library-thumb" />
              <div className="library-info">
                <span className="library-name">{pl.name}</span>
                <span className="library-meta">Playlist · {pl.trackCount || 0} músicas</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Músicas curtidas</h2>
          <span className="see-all">{likedTracks.length} música{likedTracks.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <p className="empty-hint">Carregando...</p>
        ) : likedTracks.length > 0 ? (
          <div className="track-list">
            {likedTracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                liked={liked.has(track.id)}
                onPlay={() => onPlay(track, likedTracks)}
                onLike={onToggleLike}
              />
            ))}
          </div>
        ) : (
          <div className="liked-empty">
            <span className="liked-empty-icon">♡</span>
            <p>Curta músicas para vê-las aqui.</p>
            <span className="liked-empty-hint">Clique no ♡ em qualquer música</span>
          </div>
        )}
      </section>
    </div>
  );
}

function TrackCard({ track, isCurrent, isPlaying, liked, onPlay, onLike }) {
  return (
    <div className={`track-card ${isCurrent ? 'current' : ''}`} style={{ '--accent': track.color }}>
      <div className="track-card-img-wrap">
        <img src={track.cover} alt={track.title} className="track-card-img" />
        <button className={`track-card-play ${isCurrent && isPlaying ? 'visible' : ''}`} onClick={() => onPlay(track)}>
          {isCurrent && isPlaying ? <Icon.Pause /> : <Icon.Play />}
        </button>
      </div>
      <div className="track-card-body">
        <span className="track-card-title">{track.title}</span>
        <Link
          href={`/player/artist/${encodeURIComponent(track.artist)}`}
          className="track-card-artist artist-link"
          onClick={e => e.stopPropagation()}
        >
          {track.artist}
        </Link>
      </div>
    </div>
  );
}

function TrackRow({ track, index, isCurrent, isPlaying, liked, onPlay, onLike }) {
  return (
    <div className={`track-row ${isCurrent ? 'current' : ''}`} onClick={() => onPlay(track)}>
      <div className="track-row-num">
        {isCurrent && isPlaying ? <span className="equalizer"><span /><span /><span /></span> : <span>{index}</span>}
      </div>
      <img src={track.cover} alt={track.title} className="track-row-img" />
      <div className="track-row-info">
        <span className={`track-row-title ${isCurrent ? 'green' : ''}`}>{track.title}</span>
        <Link
          href={`/player/artist/${encodeURIComponent(track.artist)}`}
          className="track-row-artist artist-link"
          onClick={e => e.stopPropagation()}
        >
          {track.artist}
        </Link>
      </div>
      <span className="track-row-album">{track.album}</span>
      <button className={`track-row-like ${liked ? 'active' : ''}`} onClick={e => { e.stopPropagation(); onLike(track.id); }}><Icon.Heart filled={liked} /></button>
      <span className="track-row-duration">{formatTime(track.duration)}</span>
    </div>
  );
}

// Admin Modal
function AdminModal({ onClose, onRefreshTracks, onRefreshPlaylists, token }) {
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState('tracks');
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', artist: '', album: '', duration: '', cover: '', color: '#1DB954', hls_slug: '' });
  const [playlistForm, setPlaylistForm] = useState({ name: '', cover: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [t, p] = await Promise.all([
        fetch(`${API_URL}/tracks`, { cache: 'no-store' }).then(r => r.json()),
        fetch(`${API_URL}/playlists`, { cache: 'no-store' }).then(r => r.json()),
      ]);
      setTracks(t); setPlaylists(p);
    } catch { setMsg('Erro ao carregar dados'); }
  }

  async function addTrack(e) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/tracks`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ ...form, duration: Number(form.duration) }) });
      setMsg('Música adicionada!');
      setForm({ title: '', artist: '', album: '', duration: '', cover: '', color: '#1DB954', hls_slug: '' });
      await loadAll(); onRefreshTracks();
    } catch { setMsg('Erro ao adicionar música'); }
  }

  async function deleteTrack(id) {
    if (!confirm('Remover esta música?')) return;
    await fetch(`${API_URL}/tracks/${id}`, { method: 'DELETE', headers: authHeaders });
    setMsg('Música removida.'); await loadAll(); onRefreshTracks();
  }

  async function addPlaylist(e) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/playlists`, { method: 'POST', headers: authHeaders, body: JSON.stringify(playlistForm) });
      setMsg('Playlist criada!'); setPlaylistForm({ name: '', cover: '' });
      await loadAll(); onRefreshPlaylists();
    } catch { setMsg('Erro ao criar playlist'); }
  }

  async function deletePlaylist(id) {
    if (!confirm('Remover esta playlist?')) return;
    await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE', headers: authHeaders });
    setMsg('Playlist removida.'); await loadAll(); onRefreshPlaylists();
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
                <input name="title" placeholder="Título *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
                <input name="artist" placeholder="Artista *" value={form.artist} onChange={e => setForm(f => ({...f, artist: e.target.value}))} required />
                <input name="album" placeholder="Álbum" value={form.album} onChange={e => setForm(f => ({...f, album: e.target.value}))} />
                <input name="duration" placeholder="Duração (segundos)" type="number" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} />
                <input name="cover" placeholder="URL da capa" value={form.cover} onChange={e => setForm(f => ({...f, cover: e.target.value}))} />
                <input name="hls_slug" placeholder="HLS slug (ex: minha-musica)" value={form.hls_slug} onChange={e => setForm(f => ({...f, hls_slug: e.target.value}))} />
                <div className="color-row">
                  <label>Cor de destaque</label>
                  <input name="color" type="color" value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} />
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
                    <span>{t.artist}{t.album ? ` · ${t.album}` : ''}</span>
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
                <input name="name" placeholder="Nome da playlist *" value={playlistForm.name} onChange={e => setPlaylistForm(f => ({...f, name: e.target.value}))} required />
                <input name="cover" placeholder="URL da capa" value={playlistForm.cover} onChange={e => setPlaylistForm(f => ({...f, cover: e.target.value}))} />
              </div>
              <button type="submit" className="admin-btn">Criar</button>
            </form>
            <h3>Playlists ({playlists.length})</h3>
            <div className="admin-list">
              {playlists.map(p => (
                <div key={p.id} className="admin-item">
                  <img src={p.cover || `https://picsum.photos/seed/pl${p.id}/60/60`} alt={p.name} className="admin-thumb" />
                  <div className="admin-item-info"><strong>{p.name}</strong></div>
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

// Create Playlist Modal
function CreatePlaylistModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', cover: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, cover: form.cover || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao criar playlist');
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Criar playlist</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <p style={{ color: '#f44336', fontSize: 13 }}>{error}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="auth-field">
              <label>Nome da playlist *</label>
              <input
                placeholder="Dê um nome para sua playlist"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label>URL da capa (opcional)</label>
              <input
                placeholder="https://..."
                value={form.cover}
                onChange={e => setForm(f => ({ ...f, cover: e.target.value }))}
              />
            </div>
            {form.cover && (
              <img
                src={form.cover}
                alt="preview"
                style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'}
              />
            )}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? 'Criando...' : 'Criar playlist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
