# Vue + Node + HLS Streaming com Docker

Projeto mínimo para testar streaming estilo Netflix com Vue no front-end e Node.js servindo arquivos HLS.

A arquitetura é:

```txt
Vue + hls.js
   ↓
Node.js + Express
   ↓
arquivos HLS: index.m3u8 + segmentos .ts
```

## Requisitos

- Docker
- Docker Compose

Não precisa instalar Node.js nem FFmpeg na sua máquina. O FFmpeg fica dentro do container do backend.

---

## 1. Coloque seu vídeo

Coloque seu arquivo MP4 nesta pasta:

```txt
backend/videos/source/video.mp4
```

O nome precisa ser exatamente:

```txt
video.mp4
```

---

## 2. Suba os containers

Na raiz do projeto, rode:

```bash
docker compose up -d --build
```

Isso sobe:

```txt
backend  → http://localhost:3000
frontend → http://localhost:5173
```

---

## 3. Converter o vídeo para HLS

Com os containers rodando, execute:

```bash
docker compose exec backend npm run convert
```

Esse comando vai gerar:

```txt
backend/videos/hls/index.m3u8
backend/videos/hls/segment_000.ts
backend/videos/hls/segment_001.ts
...
```

---

## 4. Abrir o player

Acesse:

```txt
http://localhost:5173
```

O player vai carregar:

```txt
http://localhost:3000/stream/index.m3u8
```

---

## Comandos úteis

Parar os containers:

```bash
docker compose down
```

Ver logs:

```bash
docker compose logs -f
```

Ver logs só do backend:

```bash
docker compose logs -f backend
```

Converter novamente depois de trocar o vídeo:

```bash
docker compose exec backend npm run convert
```

---

## Estrutura

```txt
vue-node-hls-streaming/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── convert.js
│   ├── package.json
│   └── videos/
│       ├── source/
│       │   └── video.mp4
│       └── hls/
│           ├── index.m3u8
│           └── segment_000.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    └── src/
        ├── App.vue
        ├── main.js
        └── style.css
```

## Observação

Esse projeto é didático. Em produção, o ideal seria usar storage como S3/MinIO, CDN, autenticação, múltiplas qualidades de vídeo e processamento assíncrono com fila.
