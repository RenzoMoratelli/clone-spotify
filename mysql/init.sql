CREATE DATABASE IF NOT EXISTS spotify_db;
USE spotify_db;

CREATE TABLE IF NOT EXISTS tracks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  artist     VARCHAR(200) NOT NULL,
  album      VARCHAR(200) NULL,
  duration   INT          NOT NULL DEFAULT 0,
  cover      VARCHAR(500) NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#1DB954',
  hls_slug   VARCHAR(100) NULL COMMENT 'Slug para stream HLS: /stream/{slug}/index.m3u8',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  cover      VARCHAR(500) NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id INT NOT NULL,
  track_id    INT NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id)    REFERENCES tracks(id)    ON DELETE CASCADE
);

-- Faixas de exemplo (sem HLS — adicione hls_slug para streaming real)
INSERT INTO tracks (title, artist, album, duration, cover, color, hls_slug) VALUES
('Neon Horizons',  'Synthwave Collective', 'Neon Horizons',    214, 'https://picsum.photos/seed/neon/400/400',     '#1DB954', NULL),
('Midnight Drive', 'The Wanderers',        'Late Night Tapes', 187, 'https://picsum.photos/seed/midnight/400/400', '#E91E63', NULL),
('Solar Flare',    'Astral Project',       'Orbit',            253, 'https://picsum.photos/seed/solar/400/400',    '#FF9800', NULL),
('Ocean Floor',    'Deep Current',         'Submerge',         198, 'https://picsum.photos/seed/ocean/400/400',    '#2196F3', NULL),
('City Lights',    'Urban Echo',           'Concrete Jungle',  221, 'https://picsum.photos/seed/city/400/400',     '#9C27B0', NULL),
('Fire Season',    'Emberfield',           'Summer Burns',     176, 'https://picsum.photos/seed/fire/400/400',     '#FF5722', NULL);

INSERT INTO playlists (name, cover) VALUES
('Chill Vibes',       'https://picsum.photos/seed/chill/200/200'),
('Late Night Drive',  'https://picsum.photos/seed/latenight/200/200'),
('Morning Energy',    'https://picsum.photos/seed/morning/200/200'),
('Focus Mode',        'https://picsum.photos/seed/focus/200/200');

INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
(1, 1, 1), (1, 3, 2), (1, 5, 3),
(2, 2, 1), (2, 4, 2), (2, 6, 3),
(3, 1, 1), (3, 2, 2), (3, 3, 3), (3, 4, 4),
(4, 3, 1), (4, 5, 2), (4, 6, 3);
