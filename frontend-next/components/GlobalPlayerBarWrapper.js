'use client';

import { usePathname } from 'next/navigation';
import PlayerBar from './PlayerBar';
import { usePlayer } from '../context/PlayerContext';

export default function GlobalPlayerBarWrapper() {
  const pathname = usePathname();
  const { currentTrack } = usePlayer();

  // Only show the fixed player bar inside the app (/player and subpaths)
  const isPlayerArea = pathname?.startsWith('/player');

  if (!isPlayerArea) return null;
  if (!currentTrack) return null; // hide until something is actually loaded

  return <PlayerBar />;
}
