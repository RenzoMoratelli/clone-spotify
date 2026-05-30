import express from 'express';
import cors from 'cors';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

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

// ─── HLS Streaming ────────────────────────────────────────────────────────────
// Serve HLS manifest and segments
// PUT audio files in: backend/audio/hls/<track-slug>/index.m3u8 + *.ts
app.get('/stream/:slug/index.m3u8', (req, res) => {
  const { slug } = req.params;
  const filePath = join(__dirname, 'audio', 'hls', slug, 'index.m3u8');

  if (!existsSync(filePath)) {
    return res.status(404).json({ message: `HLS stream '${slug}' não encontrado` });
  }

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

// ─── Tracks CRUD ─────────────────────────────────────────────────────────────
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

app.post('/tracks', async (req, res) => {
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

app.put('/tracks/:id', async (req, res) => {
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

app.delete('/tracks/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tracks WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Faixa não encontrada' });
    res.json({ message: 'Faixa removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover faixa', error: err.message });
  }
});

// ─── Playlists ────────────────────────────────────────────────────────────────
app.get('/playlists', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM playlists ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar playlists', error: err.message });
  }
});

app.post('/playlists', async (req, res) => {
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

app.delete('/playlists/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM playlists WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Playlist não encontrada' });
    res.json({ message: 'Playlist removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover playlist', error: err.message });
  }
});

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
