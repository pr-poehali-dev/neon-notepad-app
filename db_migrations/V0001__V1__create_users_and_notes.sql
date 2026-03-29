CREATE TABLE t_p80532359_neon_notepad_app.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p80532359_neon_notepad_app.notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p80532359_neon_notepad_app.users(id),
    title VARCHAR(500) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
