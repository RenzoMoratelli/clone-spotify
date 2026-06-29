'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import '../../../spotify.css';
import './playlist.css';
import { usePlayer } from '../../../../context/PlayerContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('spotify_user') || 'null'); } catch { return null; }
}
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('spotify_token');
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
  Back: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : 'currentColor'} strokeWidth="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
  Music: () => <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
};

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const playlistId = params.id;

  const [playlist, setPlaylist] = useState(null);
  const [allTracks, setAllTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [msg, setMsg] = useState('');

  const { currentTrack, isPlaying, liked, toggleLike, playTrack } = usePlayer();

  useEffect(() => {
    if (!getUser()) { router.push('/login'); return; }
    load();
    loadAllTracks();
  }, [playlistId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Playlist não encontrada');
      setPlaylist(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadAllTracks() {
    try {
      const res = await fetch(`${API_URL}/tracks`, { cache: 'no-store' });
      setAllTracks(await res.json());
    } catch {}
  }

  async function removeTrack(trackId) {
    if (!confirm('Remover esta música da playlist?')) return;
    await fetch(`${API_URL}/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setMsg('Música removida.');
    await load();
  }

  async function addTrack(trackId) {
    const res = await fetch(`${API_URL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ track_id: trackId }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) { setMsg(data.message); return; }
    setMsg(res.status === 409 ? 'Já está na playlist.' : 'Música adicionada!');
    await load();
  }

  function handlePlayAll() {
    if (!playlist?.tracks?.length) return;
    const tracks = playlist.tracks.map(normaliseTrack);
    playTrack(tracks[0], tracks);
  }

  function handlePlayTrack(track) {
    const tracks = playlist.tracks.map(normaliseTrack);
    playTrack(normaliseTrack(track), tracks);
  }

  const tracks = playlist?.tracks?.map(normaliseTrack) || [];
  const heroColor = tracks[0]?.color || '#1DB954';

  if (loading) {
    return (
      <div className="pl-loading">
        <div className="pl-spinner" />
        <p>Carregando playlist...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="pl-error-screen">
        <h2>Playlist não encontrada</h2>
        <button onClick={() => router.push('/player')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="pl-page">
      <button className="pl-back-btn" onClick={() => router.push('/player')}>
        <Icon.Back /> Voltar
      </button>

      {/* Hero */}
      <header className="pl-hero" style={{
        background: `linear-gradient(180deg, ${heroColor}88 0%, ${heroColor}33 50%, #121212 100%)`
      }}>
        <div className="pl-hero-cover">
          {tracks.length > 0 ? (
            <div className="pl-cover-grid">
              {tracks.slice(0, 4).map((t, i) => (
                <img key={i} src={t.cover} alt={t.title} />
              ))}
            </div>
          ) : (
            <div className="pl-cover-empty"><Icon.Music /></div>
          )}
        </div>
        <div className="pl-hero-info">
          <span className="pl-hero-type">Playlist</span>
          <h1 className="pl-hero-name">{playlist.name}</h1>
          <p className="pl-hero-meta">
            {tracks.length} {tracks.length === 1 ? 'música' : 'músicas'}
            {playlist.totalDuration > 0 && <> · {formatTotalDuration(playlist.totalDuration)}</>}
          </p>
        </div>
      </header>

      {/* Actions */}
      <div className="pl-actions">
        {tracks.length > 0 && (
          <button className="pl-play-btn" style={{ background: heroColor }} onClick={handlePlayAll}>
            <Icon.Play />
          </button>
        )}
        <button className="pl-action-btn" onClick={() => setShowAddModal(true)}>
          <Icon.Plus /> Adicionar músicas
        </button>
        <button className="pl-action-btn pl-action-btn--ghost" onClick={() => setShowEditModal(true)}>
          <Icon.Edit /> Editar
        </button>
      </div>

      {msg && <p className="pl-msg">{msg}</p>}

      {/* Track list */}
      {tracks.length > 0 ? (
        <section className="pl-section">
          <div className="pl-track-header">
            <span>#</span>
            <span>Título</span>
            <span>Álbum</span>
            <span>Duração</span>
          </div>
          <div className="pl-track-list">
            {tracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div key={track.id} className={`pl-track-row ${isCurrent ? 'current' : ''}`} onClick={() => handlePlayTrack(track)}>
                  <div className="pl-track-num">
                    {isCurrent && isPlaying
                      ? <span className="pl-equalizer"><span /><span /><span /></span>
                      : <span>{i + 1}</span>}
                  </div>
                  <img src={track.cover} alt={track.title} className="pl-track-img" />
                  <div className="pl-track-info">
                    <span className={`pl-track-title ${isCurrent ? 'active' : ''}`}>{track.title}</span>
                    <Link
                      href={`/player/artist/${encodeURIComponent(track.artist)}`}
                      className="pl-track-artist artist-link"
                      onClick={e => e.stopPropagation()}
                    >
                      {track.artist}
                    </Link>
                  </div>
                  <span className="pl-track-album">{track.album}</span>
                  <button
                    className={`pl-track-like ${liked.has(track.id) ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleLike(track.id); }}
                  >
                    <Icon.Heart filled={liked.has(track.id)} />
                  </button>
                  <span className="pl-track-duration">{formatTime(track.duration)}</span>
                  <button
                    className="pl-track-remove"
                    onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                    title="Remover da playlist"
                  >
                    <Icon.Trash />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="pl-empty">
          <Icon.Music />
          <h3>Playlist vazia</h3>
          <p>Adicione músicas para começar.</p>
          <button className="pl-empty-btn" onClick={() => setShowAddModal(true)}>
            Adicionar músicas
          </button>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showAddModal && (
        <AddTracksModal
          allTracks={allTracks}
          playlistTracks={tracks}
          onAdd={addTrack}
          onClose={() => { setShowAddModal(false); setMsg(''); }}
        />
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onSave={async (data) => {
            await fetch(`${API_URL}/playlists/${playlistId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify(data),
            });
            setShowEditModal(false);
            await load();
          }}
          onDelete={async () => {
            if (!confirm('Deletar esta playlist?')) return;
            await fetch(`${API_URL}/playlists/${playlistId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            router.push('/player');
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

// Add Tracks Modal
function AddTracksModal({ allTracks, playlistTracks, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const playlistIds = new Set(playlistTracks.map(t => t.id));

  const filtered = allTracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal pl-modal">
        <div className="modal-header">
          <h2>Adicionar músicas</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pl-modal-search">
          <Icon.Search />
          <input
            placeholder="Buscar músicas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="pl-modal-list">
          {filtered.map(t => {
            const inPlaylist = playlistIds.has(t.id);
            return (
              <div key={t.id} className="pl-modal-track">
                <img src={t.cover || `https://picsum.photos/seed/${t.id}/60/60`} alt={t.title} className="pl-modal-cover" />
                <div className="pl-modal-info">
                  <span className="pl-modal-title">{t.title}</span>
                  <span className="pl-modal-artist">{t.artist}</span>
                </div>
                <button
                  className={`pl-modal-add-btn ${inPlaylist ? 'added' : ''}`}
                  onClick={() => !inPlaylist && onAdd(t.id)}
                  disabled={inPlaylist}
                >
                  {inPlaylist ? '✓ Adicionada' : '+ Adicionar'}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="pl-modal-empty">Nenhuma música encontrada.</p>}
        </div>
      </div>
    </div>
  );
}

// Edit Playlist Modal
function EditPlaylistModal({ playlist, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ name: playlist.name, cover: playlist.cover || '' });

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal pl-edit-modal">
        <div className="modal-header">
          <h2>Editar playlist</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pl-edit-body">
          <div className="pl-edit-preview">
            {form.cover
              ? <img src={form.cover} alt="capa" className="pl-edit-cover" />
              : <div className="pl-cover-empty small"><Icon.Music /></div>}
          </div>
          <form className="pl-edit-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Nome da playlist</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Nome da playlist"
              />
            </div>
            <div className="auth-field">
              <label>URL da capa (opcional)</label>
              <input
                value={form.cover}
                onChange={e => setForm(f => ({ ...f, cover: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="pl-edit-actions">
              <button type="submit" className="admin-btn">Salvar</button>
              <button type="button" className="pl-delete-btn" onClick={onDelete}>
                <Icon.Trash /> Deletar playlist
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
