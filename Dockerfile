FROM node:20-bookworm-slim
WORKDIR /app

# FFmpeg para converter áudio em HLS
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Diretórios de áudio
RUN mkdir -p audio/source audio/hls

EXPOSE 3000
CMD ["npm", "run", "dev"]
