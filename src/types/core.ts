export type SubjectId = 'physics' | 'chemistry' | 'mathematics'

export type ExamId = 'jee-main' | 'jee-advanced' | 'practice'

export type PaperId = 'paper-1' | 'paper-2' | 'session-1' | 'session-2'

export type Difficulty = 1 | 2 | 3 | 4 | 5

export type QuestionTypeId =
  | 'single'
  | 'multiple'
  | 'integer'
  | 'numerical'
  | 'matrix'
  | 'paragraph'
  | 'assertion-reason'
  | 'match-columns'

export type TestModeId =
  | 'full'
  | 'custom'
  | 'chapter'
  | 'subject'
  | 'mixed-practice'
  | 'daily-challenge'
  | 'marathon'
  | 'speed'
  | 'revision'
  | 'pyq'
  | 'weak-chapter'
  | 'wrong-questions'
  | 'bookmarked'
  | 'formula-revision'
  | 'flashcards'

export type QuestionStatus = 'not-visited' | 'visited' | 'answered' | 'marked' | 'answered-marked'

export type AnswerScheme = 'correct-only' | 'correct-negative' | 'no-negative' | 'partial'

export type SectionType = 'physics' | 'chemistry' | 'mathematics' | 'aptitude' | 'mixed'
