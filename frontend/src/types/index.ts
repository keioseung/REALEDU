// AI Info Types
export interface TermItem {
  term: string
  description: string
}

export interface AIInfoItem {
  title: string
  content: string
  terms?: TermItem[]
}

export interface AIInfoCreate {
  date: string
  infos: AIInfoItem[]
}

// Quiz Types
export interface Quiz {
  id: number
  topic: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct: number
  explanation: string
  created_at: string
}

export interface QuizCreate {
  topic: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct: number
  explanation: string
}

// User Progress Types
export interface UserProgress {
  [date: string]: number[];
  // terms_by_date, quiz_score_by_date 등은 별도 타입(UserProgressExtra)으로 확장해 사용하세요.
}

// UserProgress의 확장 속성 타입 예시
export interface UserProgressExtra {
  terms_by_date?: { [date: string]: any[] };
  quiz_score_by_date?: { [date: string]: any[] };
}

export interface UserStats {
  total_learned: number
  streak_days: number
  last_learned_date: string | null
  quiz_score: number
  achievements: string[]
  today_ai_info?: number
  today_terms?: number
  today_quiz_score?: number
  today_quiz_correct?: number
  today_quiz_total?: number
  total_terms_learned?: number
  total_terms_available?: number
  total_ai_info_available?: number
  cumulative_quiz_score?: number
  total_quiz_correct?: number
  total_quiz_questions?: number
  max_streak?: number
}

// Prompt Types
export interface Prompt {
  id: number
  title: string
  content: string
  category: string
  created_at: string
}

export interface PromptCreate {
  title: string
  content: string
  category: string
}

// Base Content Types
export interface BaseContent {
  id: number
  title: string
  content: string
  category: string
  created_at: string
}

export interface BaseContentCreate {
  title: string
  content: string
  category: string
}

// Achievement Types
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

// News Types
export interface NewsItem {
  title: string
  content: string
  link: string
}

export interface User {
  username: string
  password: string
  role: 'admin' | 'user'
} 