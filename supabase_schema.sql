-- Supabase table creation scripts
-- Run these in your Supabase SQL editor

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  message_type TEXT DEFAULT 'user'
);

-- Create conversation memory table
CREATE TABLE IF NOT EXISTS conversation_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  memory_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_session ON conversations(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_memory_user_session ON conversation_memory(user_id, session_id);

-- Enable Row Level Security (optional)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
CREATE POLICY "Users can access their own conversations" ON conversations
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access their own memory" ON conversation_memory
  FOR ALL USING (auth.uid()::text = user_id);