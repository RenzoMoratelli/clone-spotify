# Spotify Clone — Next.js + Express + HLS

Clone funcional do Spotify como Single Page Application, com:

- **Frontend**: Next.js 14 (App Router, client components)
- **Backend**: Express + MySQL (CRUD de faixas e playlists)
- **Streaming**: HLS via hls.js (o mesmo padrão do Netflix/YouTube)
- **Docker**: tudo orquestrado com Docker Compose

---

## Estrutura

```
spotify-clone/
├── docker-compose.yml
├── mysql/
│   └── init.sql              ← schema + dados iniciais
├── backend/
│   ├── Dockerfile            ← Node + FFmpeg
│   ├── package.json
│   ├── audio/
│   │   ├── source/           ← coloque seus MP3s aqui
│   │   └── hls/              ← gerado pelo convert.js
│   └── src/
│       ├── index.js          ← API Express + rotas HLS
│       ├── db.js             ← pool MySQL
│       └── convert.js        ← converte MP3 → HLS
└── frontend-next/
    ├── Dockerfile
    ├── package.json
    └── app/
        ├── layout.js
        └── page.js           ← SPA completa (tudo em um arquivo)
```

---

## Subir o projeto

```bash
docker compose up -d --build
```

Acesse: **http://localhost:3001**

---

## Adicionar streaming HLS de verdade

### 1. Coloque seu áudio

```
backend/audio/source/minha-musica.mp3
```

### 2. Converta para HLS

```bash
docker compose exec backend npm run convert audio/source/minha-musica.mp3 minha-musica
```

Isso gera:
```
backend/audio/hls/minha-musica/index.m3u8
backend/audio/hls/minha-musica/segment_000.ts
...
```

### 3. Atualize o banco de dados

```sql
UPDATE tracks SET hls_slug = 'minha-musica' WHERE id = 1;
```

Ou via API:
```bash
curl -X PUT http://localhost:3000/tracks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha Música","artist":"Artista","duration":210,"hls_slug":"minha-musica"}'
```

A URL de stream será: `http://localhost:3000/stream/minha-musica/index.m3u8`

---

## API Endpoints

| Método | Rota                            | Descrição                  |
|--------|---------------------------------|----------------------------|
| GET    | /health                         | Status do servidor         |
| GET    | /tracks                         | Listar faixas              |
| GET    | /tracks/:id                     | Buscar faixa               |
| POST   | /tracks                         | Criar faixa                |
| PUT    | /tracks/:id                     | Atualizar faixa            |
| DELETE | /tracks/:id                     | Remover faixa              |
| GET    | /playlists                      | Listar playlists           |
| GET    | /stream/:slug/index.m3u8        | Playlist HLS               |
| GET    | /stream/:slug/:segment.ts       | Segmento HLS               |

---

## Como o HLS funciona

```
Frontend (hls.js)
      ↓
GET /stream/minha-musica/index.m3u8   ← manifesto com lista de segmentos
      ↓
GET /stream/minha-musica/segment_000.ts
GET /stream/minha-musica/segment_001.ts
...                                   ← streamed progressivamente
```

Faixas sem `hls_slug` funcionam em modo simulado (progress timer), prontas para receber áudio real.

---

## Comandos úteis

```bash
# Logs
docker compose logs -f

# Parar
docker compose down

# Resetar banco
docker compose down -v
docker compose up -d --build
```
