<template>
  <main class="page">
    <section class="card">
      <p class="eyebrow">Vue + Node + HLS</p>
      <h1>Player de Streaming</h1>
      <p class="subtitle">
        Coloque um vídeo em <code>backend/videos/source/video.mp4</code>, converta para HLS e assista aqui.
      </p>

      <video ref="videoRef" class="player" controls></video>

      <div class="info">
        <strong>URL do HLS:</strong>
        <code>{{ videoUrl }}</code>
      </div>

      <button @click="loadVideo">Carregar vídeo</button>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Hls from 'hls.js';

const videoRef = ref(null);
const videoUrl = import.meta.env.VITE_HLS_URL || 'http://localhost:3000/stream/index.m3u8';
const errorMessage = ref('');
let hls = null;

function loadVideo() {
  errorMessage.value = '';
  const video = videoRef.value;

  if (!video) return;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_, data) => {
      console.error('Erro HLS:', data);
      errorMessage.value = 'Não foi possível carregar o HLS. Verifique se o backend está rodando e se o vídeo foi convertido.';
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoUrl;
  } else {
    errorMessage.value = 'Seu navegador não suporta HLS diretamente e o hls.js não conseguiu iniciar.';
  }
}

onMounted(loadVideo);

onBeforeUnmount(() => {
  if (hls) hls.destroy();
});
</script>
