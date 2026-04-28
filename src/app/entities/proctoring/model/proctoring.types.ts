export type ProctoringEventType =
  | 'tab_switched'
  | 'face_not_detected'
  | 'multiple_faces';

export interface ProctoringEvent {
  attempt: number;
  event_type: ProctoringEventType;
  timestamp: string; // ISO-8601
  severity_score: number;
}

export interface ProctoringBulkRequest {
  events: ProctoringEvent[];
}

export interface ProctoringBulkResponse {
  ingested: number;
}
