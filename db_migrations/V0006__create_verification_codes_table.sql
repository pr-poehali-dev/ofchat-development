CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX idx_verification_phone ON verification_codes(phone);
CREATE INDEX idx_verification_created ON verification_codes(created_at);