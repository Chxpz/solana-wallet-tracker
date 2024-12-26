CREATE TABLE IF NOT EXISTS wallet_tokens (
    id SERIAL PRIMARY KEY,
    buyer_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    token_amount NUMERIC,
    FOREIGN KEY (buyer_address) REFERENCES tokens(buyer_address)
);
