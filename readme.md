cat > /mnt/user-data/outputs/spotify-clone/README.md << 'ENDOFREADME'
# 🎵 Spotify Clone

Clone funcional do Spotify com streaming de áudio HLS, autenticação JWT, playlists, músicas curtidas e muito mais. Construído com Next.js 14, Express, MySQL e Docker.
---

## 📸 Funcionalidades

- 🔐 **Autenticação** — cadastro e login com JWT + bcrypt
- 🎵 **Player completo** — play, pause, próxima, anterior, shuffle, repeat
- 📻 **Streaming HLS** — áudio real convertido para HLS (mesmo protocolo do Netflix)
- ❤️ **Músicas curtidas** — salvas por usuário no banco de dados
- 📋 **Playlists** — criar, editar, adicionar/remover músicas
- 🎤 **Página do artista** — todas as músicas e álbuns por artista
- 🖼️ **Now Playing** — tela cheia com capa do álbum em blur
- 🌐 **Landing page** — página de apresentação com planos e features
- ⚡ **Hot reload** — mudanças no código refletem na hora sem rebuild

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14, React, CSS |
| Backend | Node.js, Express |
| Banco de dados | MySQL 8 |
| Autenticação | JWT, bcrypt |
| Streaming | HLS.js, FFmpeg |
| Infraestrutura | Docker, Docker Compose |

---

## 📋 Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e **em execução**
- Git

Não precisa instalar Node.js, MySQL ou FFmpeg na sua máquina — tudo roda dentro dos containers.

---

## 🚀 Como rodar do zero

### 1. Clone o repositório

```bash
git clone https://github.com/RenzoMoratelli/clone-spotify
cd spotify-clone
```

### 2. Suba os containers

```bash
docker compose up -d --build
```

Aguarde todos os containers iniciarem (cerca de 1–2 minutos na primeira vez).

### 3. Acesse o projeto

| Serviço | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **API** | http://localhost:3000 |
| **MySQL** | localhost:3307 |

### 4. Crie sua conta

Acesse `http://localhost:5173`, clique em **Cadastrar** e crie sua conta. Você será redirecionado automaticamente para o player.

---

## 🎵 Adicionando músicas

### Sem áudio real (metadados apenas)

No player, clique em **"+ Gerenciar"** no topo e preencha o formulário:

| Campo | Descrição |
|---|---|
| Título | Nome da música |
| Artista | Nome do artista |
| Álbum | Nome do álbum (opcional) |
| Duração | Em segundos (ex: `214` = 3min34s) |
| URL da capa | Link de uma imagem JPG/PNG |
| HLS slug | Deixe vazio por enquanto |
| Cor | Cor de destaque do player |

A música aparece na lista imediatamente. O player simula o progresso sem áudio real.

---

### Com áudio real (streaming HLS)

#### Passo 1 — Coloque o arquivo de áudio

Copie seu arquivo de áudio para a pasta:

```
backend/audio/source/
```

Formatos suportados: `.mp3`, `.m4a`, `.wav`, `.flac`, `.ogg`, `.aac`

#### Passo 2 — Instale o FFmpeg no container

Na primeira vez (ou após recriar o container):

```bash
docker compose exec backend apk add --no-cache ffmpeg
```

#### Passo 3 — Converta para HLS

```bash
docker compose exec backend node src/convert.js audio/source/nome-do-arquivo.mp3 meu-slug
```

**Exemplos:**

```bash
# Arquivo: Sparkle.mp3 → slug: sparkle
docker compose exec backend node src/convert.js audio/source/Sparkle.mp3 sparkle

# Arquivo: tonight.m4a → slug: tonight
docker compose exec backend node src/convert.js audio/source/tonight.m4a tonight
```

> ⚠️ Use slugs simples com letras minúsculas e hífens. Evite espaços, vírgulas e caracteres especiais.

A conversão gera os arquivos em `backend/audio/hls/meu-slug/`.

#### Passo 4 — Cadastre a música com o slug

No player, clique em **"+ Gerenciar"** e adicione a música preenchendo o campo **HLS slug** com o slug que você usou (ex: `sparkle`).

O player vai fazer streaming HLS real ao tocar a música. Um badge verde **HLS ●** aparece na barra inferior.

---

## 🗂️ Estrutura do projeto

```
spotify-clone/
├── docker-compose.yml
├── mysql/
│   └── init.sql                  ← schema + dados iniciais
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── audio/
│   │   ├── source/               ← coloque seus arquivos de áudio aqui
│   │   └── hls/                  ← gerado automaticamente pelo convert.js
│   └── src/
│       ├── index.js              ← API Express + todas as rotas
│       ├── auth.js               ← JWT + bcrypt
│       ├── db.js                 ← pool MySQL
│       └── convert.js            ← conversor de áudio → HLS via FFmpeg
└── frontend-next/
    ├── Dockerfile
    ├── package.json
    ├── context/
    │   └── PlayerContext.js      ← estado global do player
    ├── components/
    │   ├── PlayerBar.js          ← barra inferior fixa
    │   ├── NowPlaying.js         ← tela cheia ao clicar na capa
    │   └── GlobalPlayerBarWrapper.js
    └── app/
        ├── layout.js             ← layout raiz com PlayerProvider
        ├── page.js               ← landing page (/)
        ├── login/
        │   └── page.js           ← login e cadastro (/login)
        └── player/
            ├── page.js           ← player principal (/player)
            ├── liked/
            │   └── page.js       ← músicas curtidas (/player/liked)
            ├── artist/[name]/
            │   └── page.js       ← página do artista
            └── playlist/[id]/
                └── page.js       ← página da playlist
```

---

## 🔌 API Endpoints

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastrar usuário |
| POST | `/auth/login` | Fazer login |
| GET | `/auth/me` | Dados do usuário logado |

### Músicas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/tracks` | Listar todas as músicas |
| POST | `/tracks` | Adicionar música (auth) |
| PUT | `/tracks/:id` | Atualizar música (auth) |
| DELETE | `/tracks/:id` | Remover música (auth) |

### Streaming HLS
| Método | Rota | Descrição |
|---|---|---|
| GET | `/stream/:slug/index.m3u8` | Playlist HLS |
| GET | `/stream/:slug/:segment.ts` | Segmento de áudio |

### Playlists
| Método | Rota | Descrição |
|---|---|---|
| GET | `/playlists` | Listar playlists |
| POST | `/playlists` | Criar playlist (auth) |
| GET | `/playlists/:id` | Detalhes + faixas |
| PUT | `/playlists/:id` | Editar playlist (auth) |
| DELETE | `/playlists/:id` | Deletar playlist (auth) |
| POST | `/playlists/:id/tracks` | Adicionar faixa (auth) |
| DELETE | `/playlists/:id/tracks/:trackId` | Remover faixa (auth) |

### Artistas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/artists` | Listar artistas |
| GET | `/artists/:name` | Músicas de um artista |

### Músicas curtidas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/me/liked` | Músicas curtidas do usuário |
| GET | `/me/liked/ids` | IDs das músicas curtidas |
| POST | `/me/liked/:trackId` | Curtir música |
| DELETE | `/me/liked/:trackId` | Descurtir música |

---

## 🐳 Comandos Docker úteis

```bash
# Subir os containers
docker compose up -d --build

# Parar os containers
docker compose down

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f frontend
docker compose logs -f backend

# Reiniciar um serviço
docker compose restart backend

# Resetar tudo incluindo banco de dados
docker compose down -v
docker compose up -d --build
```

---

## 🗄️ Banco de dados

Conecte com qualquer cliente MySQL (DBeaver, TablePlus, etc.):

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `3307` |
| Usuário | `spotify_user` |
| Senha | `spotify_pass` |
| Banco | `spotify_db` |

### Criar tabela manualmente se necessário

```bash
docker compose exec mysql mysql -u spotify_user -pspotify_pass spotify_db -e "SHOW TABLES;"
```

---

## ⚠️ Observações

- O FFmpeg precisa ser instalado manualmente no container após cada recriação com `apk add --no-cache ffmpeg`
- As músicas sem HLS slug tocam em modo simulado sem áudio real
- O projeto é didático — em produção use S3/MinIO para armazenar os arquivos HLS e um CDN para servir os segmentos

---

