/**
 * Converter áudio MP3/MP4 para HLS
 * Uso: node src/convert.js <arquivo.mp3> <slug>
 * Exemplo: node src/convert.js audio/source/neon-horizons.mp3 neon-horizons
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const [,, inputFile, slug] = process.argv;

if (!inputFile || !slug) {
  console.error('\nUso: node src/convert.js <arquivo> <slug>');
  console.error('Exemplo: node src/convert.js audio/source/musica.mp3 minha-musica\n');
  process.exit(1);
}

const inputPath = path.isAbsolute(inputFile)
  ? inputFile
  : path.join(rootDir, inputFile);

if (!fs.existsSync(inputPath)) {
  console.error(`\nArquivo não encontrado: ${inputPath}\n`);
  process.exit(1);
}

const outputDir = path.join(rootDir, 'audio', 'hls', slug);
const outputM3u8 = path.join(outputDir, 'index.m3u8');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const args = [
  '-i', inputPath,
  '-codec:a', 'aac',
  '-b:a', '128k',
  '-hls_time', '6',
  '-hls_playlist_type', 'vod',
  '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
  outputM3u8,
];

console.log(`\nConvertendo "${inputPath}" → HLS slug: "${slug}"...\n`);

const ffmpeg = spawn('ffmpeg', args, { stdio: 'inherit' });

ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log(`\n✅ Conversão concluída!`);
    console.log(`   Playlist: audio/hls/${slug}/index.m3u8`);
    console.log(`   URL de stream: http://localhost:3000/stream/${slug}/index.m3u8\n`);
    console.log(`   No banco de dados, defina hls_slug = '${slug}' na faixa desejada.\n`);
  } else {
    console.error(`\n❌ FFmpeg terminou com erro. Código: ${code}\n`);
  }
});
