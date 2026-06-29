'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const PlayerContext = createContext(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [hlsStatus, setHlsStatus] = useState('idle');
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  // Helper: get auth token
  function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('spotify_token');
  }

  // Auto-logout if token is invalid
  function handleUnauthorized() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_user');
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/player')) {
      window.location.href = '/login';
    }
  }

  // Load liked track IDs from API on mount
  useEffect(() => {
    async function loadLiked() {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/me/liked/ids`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        const ids = await res.json();
        setLiked(new Set(ids));
      } catch {}
    }
    loadLiked();
  }, []);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const animRef = useRef(null);

  // Lazily create the single shared <audio> element once, on the client
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = volume / 100;
      audioRef.current = audio;
    }
  }, []);

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

    if (typeof window !== 'undefined' && window.Hls) {
      run(window.Hls);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      script.onload = () => run(window.Hls);
      script.onerror = () => setHlsStatus('error');
      document.head.appendChild(script);
    }
  }, []);

  const playTrack = useCallback((track, newQueue) => {
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);
    setHlsStatus('idle');
    if (newQueue) setQueue(newQueue);

    if (track.hlsUrl) {
      loadHlsTrack(track);
    } else {
      if (audioRef.current) {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(true);
      setDuration(track.duration);
    }
  }, [loadHlsTrack]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue[0]) playTrack(queue[0]);
      return;
    }
    if (currentTrack.hlsUrl && audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
    setIsPlaying((p) => !p);
  }, [currentTrack, isPlaying, playTrack, queue]);

  const playNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (idx + 1) % queue.length;
    playTrack(queue[nextIdx]);
  }, [currentTrack, queue, shuffle, playTrack]);

  const playPrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    playTrack(queue[(idx - 1 + queue.length) % queue.length]);
  }, [currentTrack, queue, playTrack]);

  // Simulated progress for tracks without real HLS audio
  useEffect(() => {
    if (!isPlaying || !currentTrack || currentTrack.hlsUrl) return;
    const totalDuration = currentTrack.duration;
    animRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= totalDuration) {
          setIsPlaying(false);
          if (repeat) { setCurrentTime(0); setProgress(0); setIsPlaying(true); return 0; }
          playNext();
          return 0;
        }
        setProgress((next / totalDuration) * 100);
        return next;
      });
    }, 250);
    return () => clearInterval(animRef.current);
  }, [isPlaying, currentTrack, repeat, playNext]);

  // Real <audio> element events (for HLS tracks)
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
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const seekTo = useCallback((ratio) => {
    if (!currentTrack) return;
    const dur = currentTrack.hlsUrl ? (audioRef.current?.duration || 0) : currentTrack.duration;
    if (currentTrack.hlsUrl && audioRef.current) audioRef.current.currentTime = ratio * dur;
    setProgress(ratio * 100);
    setCurrentTime(ratio * dur);
  }, [currentTrack]);

  const toggleLike = useCallback(async (id) => {
    const token = getToken();
    const isLiked = liked.has(id);

    // Optimistic update
    setLiked((prev) => {
      const n = new Set(prev);
      isLiked ? n.delete(id) : n.add(id);
      return n;
    });

    if (!token) {
      console.warn('toggleLike: no token found, like not saved to server');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/me/liked/${id}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { handleUnauthorized(); return; }
        console.error('toggleLike error:', res.status, data);
        // Rollback
        setLiked((prev) => {
          const n = new Set(prev);
          isLiked ? n.add(id) : n.delete(id);
          return n;
        });
      }
    } catch (err) {
      console.error('toggleLike fetch error:', err);
      // Rollback
      setLiked((prev) => {
        const n = new Set(prev);
        isLiked ? n.add(id) : n.delete(id);
        return n;
      });
    }
  }, [liked]);

  const value = {
    queue, setQueue,
    currentTrack, isPlaying, progress, currentTime, duration,
    volume, setVolume, shuffle, setShuffle, repeat, setRepeat,
    liked, toggleLike, hlsStatus,
    showNowPlaying, setShowNowPlaying,
    playTrack, togglePlay, playNext, playPrev, seekTo,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
