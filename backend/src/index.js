import express from 'express';
import cors from 'cors';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { registerUser, loginUser, signToken, authMiddleware } from './auth.js';

const __dirname = join(fileURLToPath(import.meta.url), '../..');
const app = express();
const PORT = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      return cb(null, true);
    return cb(new Error('Origin não permitida pelo CORS'));
  }
}));
app.use(express.json());

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: rows[0]?.ok === 1 ? 'connected' : 'unknown' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email e password são obrigatórios' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    const user = await registerUser({ name, email, password });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email e password são obrigatórios' });
    const user = await loginUser({ email, password });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── HLS Streaming ────────────────────────────────────────────────────────────
app.get('/stream/:slug/index.m3u8', (req, res) => {
  const { slug } = req.params;
  const filePath = join(__dirname, 'audio', 'hls', slug, 'index.m3u8');
  if (!existsSync(filePath))
    return res.status(404).json({ message: `HLS stream '${slug}' não encontrado` });
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache');
  createReadStream(filePath).pipe(res);
});

app.get('/stream/:slug/:segment', (req, res) => {
  const { slug, segment } = req.params;
  if (extname(segment) !== '.ts') return res.status(400).end();
  const filePath = join(__dirname, 'audio', 'hls', slug, segment);
  if (!existsSync(filePath)) return res.status(404).end();
  const stat = statSync(filePath);
  res.setHeader('Content-Type', 'video/MP2T');
  res.setHeader('Content-Length', stat.size);
  createReadStream(filePath).pipe(res);
});

// ─── Tracks (public read, auth write) ────────────────────────────────────────
app.get('/tracks', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tracks ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar faixas', error: err.message });
  }
});

app.get('/tracks/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Faixa não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar faixa', error: err.message });
  }
});

app.post('/tracks', authMiddleware, async (req, res) => {
  try {
    const { title, artist, album, duration, cover, color, hls_slug } = req.body;
    if (!title || !artist) return res.status(400).json({ message: 'title e artist são obrigatórios' });
    const [result] = await pool.query(
      'INSERT INTO tracks (title, artist, album, duration, cover, color, hls_slug) VALUES (?,?,?,?,?,?,?)',
      [title, artist, album || null, Number(duration) || 0, cover || null, color || '#1DB954', hls_slug || null]
    );
    const [rows] = await pool.query('SELECT * FROM tracks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar faixa', error: err.message });
  }
});

app.put('/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const { title, artist, album, duration, cover, color, hls_slug } = req.body;
    const [result] = await pool.query(
      'UPDATE tracks SET title=?, artist=?, album=?, duration=?, cover=?, color=?, hls_slug=? WHERE id=?',
      [title, artist, album || null, Number(duration) || 0, cover || null, color || '#1DB954', hls_slug || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Faixa não encontrada' });
    const [rows] = await pool.query('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar faixa', error: err.message });
  }
});

app.delete('/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tracks WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Faixa não encontrada' });
    res.json({ message: 'Faixa removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover faixa', error: err.message });
  }
});

// ─── Artists (derived from tracks.artist) ────────────────────────────────────
app.get('/artists', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT artist AS name,
             COUNT(*) AS trackCount,
             MIN(cover) AS cover,
             MIN(color) AS color
      FROM tracks
      GROUP BY artist
      ORDER BY artist ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar artistas', error: err.message });
  }
});

app.get('/artists/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const [tracks] = await pool.query(
      'SELECT * FROM tracks WHERE artist = ? ORDER BY id DESC',
      [name]
    );
    if (!tracks.length) return res.status(404).json({ message: 'Artista não encontrado' });

    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const albums = [...new Set(tracks.map(t => t.album).filter(Boolean))];

    res.json({
      name,
      cover: tracks.find(t => t.cover)?.cover || null,
      color: tracks.find(t => t.color)?.color || '#1DB954',
      trackCount: tracks.length,
      totalDuration,
      albums,
      tracks,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar artista', error: err.message });
  }
});

// ─── Playlists ────────────────────────────────────────────────────────────────
app.get('/playlists', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
             COUNT(pt.track_id) AS trackCount
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar playlists', error: err.message });
  }
});

app.get('/playlists/:id', async (req, res) => {
  try {
    const [plRows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (!plRows.length) return res.status(404).json({ message: 'Playlist não encontrada' });
    const playlist = plRows[0];

    const [tracks] = await pool.query(`
      SELECT t.*, pt.position
      FROM tracks t
      JOIN playlist_tracks pt ON pt.track_id = t.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC, t.id ASC
    `, [req.params.id]);

    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    res.json({ ...playlist, tracks, totalDuration });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar playlist', error: err.message });
  }
});

app.post('/playlists', authMiddleware, async (req, res) => {
  try {
    const { name, cover } = req.body;
    if (!name) return res.status(400).json({ message: 'name é obrigatório' });
    const [result] = await pool.query(
      'INSERT INTO playlists (name, cover) VALUES (?, ?)',
      [name, cover || null]
    );
    const [rows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar playlist', error: err.message });
  }
});

app.put('/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const { name, cover } = req.body;
    if (!name) return res.status(400).json({ message: 'name é obrigatório' });
    const [result] = await pool.query(
      'UPDATE playlists SET name = ?, cover = ? WHERE id = ?',
      [name, cover || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Playlist não encontrada' });
    const [rows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar playlist', error: err.message });
  }
});

app.delete('/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM playlists WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Playlist não encontrada' });
    res.json({ message: 'Playlist removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover playlist', error: err.message });
  }
});

// Add track to playlist
app.post('/playlists/:id/tracks', authMiddleware, async (req, res) => {
  try {
    const { track_id } = req.body;
    if (!track_id) return res.status(400).json({ message: 'track_id é obrigatório' });

    // Check if already in playlist
    const [existing] = await pool.query(
      'SELECT 1 FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [req.params.id, track_id]
    );
    if (existing.length) return res.status(409).json({ message: 'Faixa já está na playlist' });

    const [posRows] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = ?',
      [req.params.id]
    );
    const position = posRows[0].next_pos;

    await pool.query(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
      [req.params.id, track_id, position]
    );
    res.status(201).json({ message: 'Faixa adicionada à playlist' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao adicionar faixa', error: err.message });
  }
});

// Remove track from playlist
app.delete('/playlists/:id/tracks/:trackId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [req.params.id, req.params.trackId]
    );
    res.json({ message: 'Faixa removida da playlist' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover faixa', error: err.message });
  }
});

// ─── Liked Tracks ─────────────────────────────────────────────────────────────
app.get('/me/liked', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.* FROM tracks t
       JOIN liked_tracks lt ON lt.track_id = t.id
       WHERE lt.user_id = ?
       ORDER BY lt.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar curtidas', error: err.message });
  }
});

app.get('/me/liked/ids', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT track_id FROM liked_tracks WHERE user_id = ?',
      [req.user.id]
    );
    res.json(rows.map(r => r.track_id));
  } catch (err) {
    res.status(500).json({ message: 'Erro', error: err.message });
  }
});

app.post('/me/liked/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    await pool.query(
      'INSERT IGNORE INTO liked_tracks (user_id, track_id) VALUES (?, ?)',
      [req.user.id, trackId]
    );
    res.status(201).json({ message: 'Curtida adicionada' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao curtir', error: err.message });
  }
});

app.delete('/me/liked/:trackId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM liked_tracks WHERE user_id = ? AND track_id = ?',
      [req.user.id, req.params.trackId]
    );
    res.json({ message: 'Curtida removida' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover curtida', error: err.message });
  }
});

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
