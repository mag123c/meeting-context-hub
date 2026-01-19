-- Meeting Context Hub Initial Schema

-- 태그
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 회의록
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  prd_summary JSONB,
  action_items JSONB,
  obsidian_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 컨텍스트
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('slack', 'notion', 'manual', 'meeting')),
  source_id TEXT,
  content TEXT NOT NULL,
  obsidian_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 회의록-태그 연결
CREATE TABLE meeting_tags (
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, tag_id)
);

-- 컨텍스트-태그 연결
CREATE TABLE context_tags (
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (context_id, tag_id)
);

-- 인덱스
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_contexts_user_id ON contexts(user_id);
CREATE INDEX idx_contexts_source ON contexts(source);
CREATE INDEX idx_contexts_created_at ON contexts(created_at DESC);
CREATE INDEX idx_tags_name ON tags(name);

-- RLS 정책
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_tags ENABLE ROW LEVEL SECURITY;

-- 회의록 RLS
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (auth.uid() = user_id);

-- 컨텍스트 RLS
CREATE POLICY "Users can view own contexts" ON contexts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contexts" ON contexts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contexts" ON contexts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contexts" ON contexts
  FOR DELETE USING (auth.uid() = user_id);

-- 태그는 모든 인증된 사용자가 접근 가능
CREATE POLICY "Authenticated users can view tags" ON tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tags" ON tags
  FOR INSERT TO authenticated WITH CHECK (true);

-- meeting_tags RLS
CREATE POLICY "Users can manage own meeting tags" ON meeting_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meetings WHERE meetings.id = meeting_tags.meeting_id AND meetings.user_id = auth.uid()
    )
  );

-- context_tags RLS
CREATE POLICY "Users can manage own context tags" ON context_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contexts WHERE contexts.id = context_tags.context_id AND contexts.user_id = auth.uid()
    )
  );

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contexts_updated_at
  BEFORE UPDATE ON contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
