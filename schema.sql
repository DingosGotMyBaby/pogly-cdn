-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (unixepoch()),
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (unixepoch()),
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_modules_id ON modules(id);
