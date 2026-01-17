CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  contact_user_id INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, contact_user_id)
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);