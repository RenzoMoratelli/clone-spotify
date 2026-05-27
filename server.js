FROM node:20-bookworm-slim

WORKDIR /app

# FFmpeg fica dentro do container para converter MP4 em HLS
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
