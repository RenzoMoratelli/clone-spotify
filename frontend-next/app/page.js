'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './landing.css';

function SpotifyLogo({ size = 32 }) {
  return (
    <svg viewBox="0 0 24 24" fill="#1DB954" width={size} height={size}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

const FEATURES = [
  { icon: '🎵', title: 'Milhões de músicas', desc: 'Explore um catálogo enorme de faixas de todos os gêneros e artistas.' },
  { icon: '📻', title: 'Streaming HLS', desc: 'Áudio em alta qualidade com tecnologia de streaming adaptativo.' },
  { icon: '📋', title: 'Suas playlists', desc: 'Crie e gerencie playlists personalizadas com suas músicas favoritas.' },
  { icon: '❤️', title: 'Curta e salve', desc: 'Favorite músicas e acesse sua biblioteca a qualquer momento.' },
];

const PLANS = [
  {
    name: 'Gratuito', price: 'R$ 0', period: 'para sempre', color: '#535353',
    features: ['Acesso ao catálogo completo', 'Qualidade padrão', 'Com anúncios'],
    cta: 'Começar grátis', highlight: false,
  },
  {
    name: 'Premium', price: 'R$ 21,90', period: 'por mês', color: '#1DB954',
    features: ['Tudo do plano gratuito', 'Sem anúncios', 'Qualidade máxima', 'Download offline'],
    cta: 'Assinar Premium', highlight: true,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('spotify_user') || 'null')); } catch {}
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_user');
    setUser(null);
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className={`l-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="l-nav-inner">
          <div className="l-nav-logo" onClick={() => router.push('/')} style={{cursor:'pointer'}}>
            <SpotifyLogo size={28} />
            <span>Spotify</span>
          </div>
          <div className="l-nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#plans">Planos</a>
          </div>
          <div className="l-nav-actions">
            {user ? (
              <>
                <span className="l-nav-user">Olá, {user.name.split(' ')[0]}</span>
                <button className="l-btn l-btn--outline" onClick={handleLogout}>Sair</button>
                <button className="l-btn l-btn--filled" onClick={() => router.push('/player')}>Abrir app</button>
              </>
            ) : (
              <>
                <button className="l-btn l-btn--ghost" onClick={() => router.push('/login')}>Entrar</button>
                <button className="l-btn l-btn--filled" onClick={() => router.push('/login?tab=register')}>Cadastrar</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <div className="l-hero-bg">
          <div className="l-hero-orb l-hero-orb--1" />
          <div className="l-hero-orb l-hero-orb--2" />
          <div className="l-hero-orb l-hero-orb--3" />
        </div>
        <div className="l-hero-content">
          <div className="l-hero-badge"><SpotifyLogo size={16} /><span>Streaming de música</span></div>
          <h1 className="l-hero-title">
            Música para <br />
            <span className="l-hero-gradient">todos os momentos</span>
          </h1>
          <p className="l-hero-sub">
            Ouça milhões de músicas, crie playlists e descubra novos artistas.
            Tudo em um só lugar, com streaming de alta qualidade.
          </p>
          <div className="l-hero-ctas">
            {user ? (
              <button className="l-cta-primary" onClick={() => router.push('/player')}>Abrir player</button>
            ) : (
              <>
                <button className="l-cta-primary" onClick={() => router.push('/login?tab=register')}>Começar grátis</button>
                <button className="l-cta-secondary" onClick={() => router.push('/login')}>Já tenho conta</button>
              </>
            )}
          </div>
          <div className="l-hero-card">
            <div className="l-player-mock">
              <img src="https://picsum.photos/seed/hero/64/64" alt="cover" className="l-mock-cover" />
              <div className="l-mock-info">
                <span className="l-mock-title">Neon Horizons</span>
                <span className="l-mock-artist">Synthwave Collective</span>
              </div>
              <div className="l-mock-controls">
                <div className="l-mock-btn">⏮</div>
                <div className="l-mock-play">▶</div>
                <div className="l-mock-btn">⏭</div>
              </div>
            </div>
            <div className="l-mock-bar"><div className="l-mock-fill" /></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="l-section" id="features">
        <div className="l-container">
          <div className="l-section-header">
            <span className="l-eyebrow">Por que nos escolher</span>
            <h2>Tudo que você precisa em um player</h2>
            <p>Uma experiência completa de streaming de música, direto no seu navegador.</p>
          </div>
          <div className="l-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="l-feature-card">
                <div className="l-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="l-section l-section--dark" id="plans">
        <div className="l-container">
          <div className="l-section-header">
            <span className="l-eyebrow">Planos</span>
            <h2>Escolha seu plano</h2>
            <p>Comece gratuitamente e faça upgrade quando quiser.</p>
          </div>
          <div className="l-plans-grid">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`l-plan-card ${plan.highlight ? 'highlight' : ''}`}>
                {plan.highlight && <div className="l-plan-badge">Mais popular</div>}
                <div className="l-plan-header">
                  <h3>{plan.name}</h3>
                  <div className="l-plan-price">
                    <span className="l-plan-amount">{plan.price}</span>
                    <span className="l-plan-period">{plan.period}</span>
                  </div>
                </div>
                <ul className="l-plan-features">
                  {plan.features.map((feat) => (
                    <li key={feat}><span style={{ color: plan.color }}>✓</span> {feat}</li>
                  ))}
                </ul>
                <button className="l-plan-cta" style={{ background: plan.color }} onClick={() => router.push('/login?tab=register')}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="l-banner">
        <div className="l-container">
          <div className="l-banner-inner">
            <SpotifyLogo size={48} />
            <h2>Pronto para começar?</h2>
            <p>Junte-se a milhares de ouvintes e descubra sua próxima música favorita.</p>
            <button className="l-cta-primary" onClick={() => router.push('/login?tab=register')}>Criar conta gratuita</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer">
        <div className="l-container">
          <div className="l-footer-inner">
            <div className="l-footer-logo"><SpotifyLogo size={24} /><span>Spotify Clone</span></div>
            <p className="l-footer-copy">© 2024 Spotify Clone. Projeto educacional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
