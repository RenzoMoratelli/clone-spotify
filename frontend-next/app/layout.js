import './player/spotify.css';
import { PlayerProvider } from '../context/PlayerContext';
import GlobalPlayerBar from '../components/GlobalPlayerBarWrapper';
import NowPlayingWrapper from '../components/NowPlayingWrapper';

export const metadata = {
  title: 'Spotify Clone — Next.js + HLS',
  description: 'Clone do Spotify com streaming HLS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: '#121212' }}>
        <PlayerProvider>
          {children}
          <GlobalPlayerBar />
          <NowPlayingWrapper />
        </PlayerProvider>
      </body>
    </html>
  );
}
