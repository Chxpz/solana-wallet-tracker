CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    initial_token_address TEXT NOT NULL,
    buyer_address TEXT NOT NULL UNIQUE
);
