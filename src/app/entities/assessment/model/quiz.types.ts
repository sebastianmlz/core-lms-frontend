export interface AnswerChoice {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}

export interface Question {
  id: number;
  text: string;
  concept_id: string;
  order: number;
  choices: AnswerChoice[];
}

export interface QuizListResponse {
  id: number;
  title: string;
  course: number;
  time_limit_minutes: number;
  is_active: boolean;
  question_count: number;
}

export interface QuizDetailResponse {
  id: number;
  title: string;
  description: string;
  course: number;
  time_limit_minutes: number;
  is_active: boolean;
  questions: Question[];
}
