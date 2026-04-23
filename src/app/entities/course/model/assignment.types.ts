export interface AssignmentItem {
  id: number;
  lesson: number;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
}

export interface SubmissionItem {
  id: number;
  assignment: number;
  student: number;
  file: string; // URL of the uploaded file
  submitted_at: string;
  grade: number | null;
  status: string; // e.g. "PENDING", "GRADED"
}

// Interfaz para la respuesta paginada general del DRF
export interface PaginatedDjangoResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
