CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER,
  sender_id INTEGER,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);