CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

CREATE TABLE IF NOT EXISTS uhi_cache (
    id          SERIAL PRIMARY KEY,
    city        VARCHAR(64) NOT NULL,
    layer       VARCHAR(32) NOT NULL,
    tile_url    TEXT NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city, layer)
);
