'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import './login.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="#1DB954" width="40" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('spotify_user') || 'null');
      if (u) router.push('/player');
    } catch {}
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro inesperado');

      localStorage.setItem('spotify_token', data.token);
      localStorage.setItem('spotify_user', JSON.stringify(data.user));
      router.push('/player');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) {
    setTab(t);
    setError('');
    setForm({ name: '', email: '', password: '' });
  }

  const isLogin = tab === 'login';

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-content">
          <button className="login-back" onClick={() => router.push('/')}>← Voltar</button>
          <div className="login-brand">
            <SpotifyLogo />
            <span>Spotify</span>
          </div>
          <h1>
            {isLogin ? 'Bem-vindo de volta.' : 'Junte-se a nós.'}
          </h1>
          <p>
            {isLogin
              ? 'Entre na sua conta para continuar ouvindo suas músicas favoritas.'
              : 'Crie sua conta gratuita e comece a descobrir novas músicas hoje.'}
          </p>
          <div className="login-decoration">
            <div className="login-orb login-orb--1" />
            <div className="login-orb login-orb--2" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={tab === 'login' ? 'active' : ''}
              onClick={() => switchTab('login')}
            >
              Entrar
            </button>
            <button
              className={tab === 'register' ? 'active' : ''}
              onClick={() => switchTab('register')}
            >
              Criar conta
            </button>
          </div>

          <h2>{isLogin ? 'Entrar no Spotify' : 'Criar sua conta'}</h2>

          {error && <div className="login-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="login-field">
                <label>Seu nome</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Como podemos te chamar?"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="login-field">
              <label>E-mail</label>
              <input
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="login-field">
              <label>Senha</label>
              <input
                name="password"
                type="password"
                placeholder={isLogin ? 'Sua senha' : 'Mínimo 6 caracteres'}
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? 'Aguarde...'
                : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="login-divider"><span>ou</span></div>

          <p className="login-switch">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            {' '}
            <button onClick={() => switchTab(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Cadastre-se grátis' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#121212', height: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  );
}
