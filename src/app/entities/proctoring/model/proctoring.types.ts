export type ProctoringEventType =
  | 'tab_switched'
  | 'fullscreen_exit'
  | 'face_not_detected'
  | 'multiple_faces';

/** Shape used when POSTing proctoring events from the student client */
export interface ProctoringEvent {
  attempt: number;
  event_type: ProctoringEventType;
  timestamp: string; // ISO-8601
  severity_score: number;
}

/** Shape returned by GET /api/v1/proctoring/logs/?attempt=X (tutor read) */
export interface ProctoringLogItem {
  id: number;
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
