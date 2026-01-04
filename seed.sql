-- Sample test data for local development, all users/modules are banned

-- Insert sample users
INSERT OR IGNORE INTO users (id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000'),
    ('550e8400-e29b-41d4-a716-446655440001');

-- Insert sample modules
INSERT OR IGNORE INTO modules (id) VALUES 
    ('660e8400-e29b-41d4-a716-446655440000'),
    ('660e8400-e29b-41d4-a716-446655440001');
