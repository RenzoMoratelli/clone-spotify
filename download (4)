import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputVideo = path.join(__dirname, 'videos', 'source', 'video.mp4');
const outputDir = path.join(__dirname, 'videos', 'hls');
const outputM3u8 = path.join(outputDir, 'index.m3u8');

if (!fs.existsSync(inputVideo)) {
  console.error('\nERRO: coloque seu vídeo em:');
  console.error(inputVideo);
  console.error('\nO nome do arquivo precisa ser: video.mp4\n');
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const args = [
  '-i', inputVideo,
  '-codec:v', 'libx264',
  '-codec:a', 'aac',
  '-hls_time', '6',
  '-hls_playlist_type', 'vod',
  '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
  outputM3u8
];

console.log('\nConvertendo vídeo para HLS...\n');

const ffmpeg = spawn('ffmpeg', args, { stdio: 'inherit' });

ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log('\nConversão finalizada!');
    console.log('Arquivo gerado:');
    console.log(outputM3u8);
    console.log('\nAgora rode: npm run dev\n');
  } else {
    console.error(`\nFFmpeg terminou com erro. Código: ${code}\n`);
  }
});
