'use client';

import { usePathname } from 'next/navigation';
import { usePlayer } from '../context/PlayerContext';
import NowPlaying from './NowPlaying';
import './NowPlaying.css';

export default function NowPlayingWrapper() {
  const pathname = usePathname();
  const { showNowPlaying, currentTrack } = usePlayer();

  const isPlayerArea = pathname?.startsWith('/player');
  if (!isPlayerArea || !currentTrack || !showNowPlaying) return null;

  return <NowPlaying />;
}
