CREATE TABLE chat_members (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER,
  user_id INTEGER,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chat_id, user_id)
);