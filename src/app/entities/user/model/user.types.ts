export type BackendVarkCategory = 'visual' | 'aural' | 'read_write' | 'kinesthetic';

export interface VarkAnswer {
  category: BackendVarkCategory;
  value: number;
}

export interface VarkOnboardingRequest {
  answers: VarkAnswer[];
}

export interface VarkOnboardingResponse {
  student_id: number;
  vark_scores: Record<BackendVarkCategory, number>;
  vark_dominant: BackendVarkCategory;
}
