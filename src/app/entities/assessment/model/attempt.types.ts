import type { AdaptivePlanResponse } from '../../reasoning/model/reasoning.types';

export interface AttemptAnswerInput {
  question_id: number;
  selected_choice_id: number;
}

export interface AttemptSubmitInput {
  quizId: number;
  studentId: number;
  answers: AttemptAnswerInput[];
}

export interface AttemptSubmitRequest {
  quiz_id: number;
  student_id: number;
  answers: AttemptAnswerInput[];
}

export interface AttemptAdaptiveFallback {
  plan: unknown[];
  fallback: true;
  reason?: string;
}

export interface AttemptAdaptivePending {
  job_id: string;
  status?: string;
}

export type AttemptAdaptivePlanEnvelope =
  | AdaptivePlanResponse
  | AttemptAdaptiveFallback
  | AttemptAdaptivePending
  | null;

export interface AttemptAxiomError {
  error: string;
  details?: string;
  status_code?: number;
}

export interface AttemptResultResponse {
  id: number;
  student: number;
  quiz: number;
  start_time: string;
  end_time: string | null;
  final_score: string | null;
  is_submitted: boolean;
  adaptive_plan: AttemptAdaptivePlanEnvelope;
  score?: number;
  max_score?: number;
  failed_concepts?: string[];
  evaluation_id?: number;
  axiom_error?: AttemptAxiomError;
  job_id?: string;
}
