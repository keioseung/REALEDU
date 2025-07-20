-- AI 정보 테이블에 terms 컬럼들 추가
ALTER TABLE ai_info 
ADD COLUMN IF NOT EXISTS info1_terms TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS info2_terms TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS info3_terms TEXT DEFAULT '[]';

-- 기존 데이터의 terms 컬럼을 빈 배열로 초기화
UPDATE ai_info 
SET 
    info1_terms = '[]' WHERE info1_terms IS NULL,
    info2_terms = '[]' WHERE info2_terms IS NULL,
    info3_terms = '[]' WHERE info3_terms IS NULL; 