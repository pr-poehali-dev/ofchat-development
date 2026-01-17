CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  chat_type VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  description TEXT,
  avatar_url TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);