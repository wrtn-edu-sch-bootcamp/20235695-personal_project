-- =============================================
-- 편의점 재고 확인 시스템 - DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 재고 확인 세션 테이블
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  checked_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 재고 품목 테이블
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL DEFAULT 0,
  actual_quantity INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'mismatched')),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스: 세션별 품목 조회 최적화
CREATE INDEX IF NOT EXISTS idx_inventory_items_session_id ON inventory_items(session_id);

-- 인덱스: 바코드 검색 최적화
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items(session_id, barcode);

-- RLS (Row Level Security) - 공개 접근 허용 (인증 없이 사용)
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to inventory_sessions"
  ON inventory_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to inventory_items"
  ON inventory_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 학습 복습 시스템 - DB 스키마
-- =============================================

-- 학생 과목 테이블
CREATE TABLE IF NOT EXISTS student_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 복습 세션 테이블
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES student_subjects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0
);

-- 복습 내용 히스토리
CREATE TABLE IF NOT EXISTS study_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  content TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 설정
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to student_subjects"
  ON student_subjects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to study_sessions"
  ON study_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to study_reminders"
  ON study_reminders FOR ALL
  USING (true)
  WITH CHECK (true);
