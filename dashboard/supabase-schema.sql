-- Run this entire script in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

-- 1. Leads table
CREATE TABLE IF NOT EXISTS leads (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL UNIQUE,
  interest    TEXT,
  status      TEXT        DEFAULT 'new'
                CHECK (status IN ('new','contacted','qualified','booked','lost')),
  source      TEXT        DEFAULT 'WhatsApp',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone       TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  car         TEXT        NOT NULL,
  date        TEXT        NOT NULL,   -- stored as DD-MM-YYYY
  time        TEXT        NOT NULL,
  status      TEXT        DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','completed','cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Messages table (WhatsApp conversation history)
CREATE TABLE IF NOT EXISTS messages (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone         TEXT        NOT NULL,
  name          TEXT,
  text          TEXT        NOT NULL,
  direction     TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  wa_message_id TEXT        UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_phone      ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_date    ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_messages_phone   ON messages(phone);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
