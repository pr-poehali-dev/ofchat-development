CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER,
  receiver_id INTEGER,
  call_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration INTEGER,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_receiver_id ON calls(receiver_id);