CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Agent tables (from ai-agent/migrations/001_create_ai_tables.sql)
CREATE TABLE IF NOT EXISTS ai_threads (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  channel_id UUID,
  thread_root_id UUID,
  title VARCHAR(200) NOT NULL,
  model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash',
  system_prompt JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (thread_root_id IS NULL OR channel_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ai_threads_user_id ON ai_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_threads_updated_at ON ai_threads(updated_at DESC);

DO $$ BEGIN
  CREATE TYPE ai_message_role AS ENUM ('user', 'assistant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY,
  ai_thread_id UUID NOT NULL REFERENCES ai_threads(id) ON DELETE CASCADE,
  role ai_message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_thread_id ON ai_messages(ai_thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(ai_thread_id, created_at);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE deleted_at IS NULL;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
