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
