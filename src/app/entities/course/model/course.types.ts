export interface ResourceItem {
  id: number;
  lesson: number;
  uploaded_by: number | null;
  file: string;
  resource_type: 'PDF' | 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'OTHER';
  title: string;
  created_at: string;
}

export interface LessonItem {
  id: number;
  module: number;
  title: string;
  content: string;
  order: number;
  resources?: ResourceItem[];
}

export interface ModuleItem {
  id: number;
  course: number;
  title: string;
  description: string;
  order: number;
  lessons?: LessonItem[];
}

export interface SemesterItem {
  id: number;
  career: number;
  name: string;
  number: number;
  year: number;
  period: string;
  created_at: string;
}

export interface CourseListItem {
  id: number;
  semester: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface CourseDetail {
  id: number;
  semester: SemesterItem;
  name: string;
  code: string;
  description: string;
  created_at: string;
  modules: ModuleItem[];
}

export interface FailedConceptItem {
  concept_id: string;
  fail_count: number;
}

export interface CourseDashboardSummary {
  course_id: number;
  course_code: string;
  course_name: string;
  total_enrolled_students: number;
  average_quiz_score: number;
  proctoring_alerts: Record<string, number>;
  vark_distribution: Record<string, number>;
  top_failed_concepts: FailedConceptItem[];
}

export interface CourseState {
  courses: CourseListItem[];
  selectedCourseId: number | null;
  selectedCourseDetail: CourseDetail | null;
  selectedCourseDashboard: CourseDashboardSummary | null;
  isLoading: boolean;
  isLoadingDashboard: boolean;
  error: string | null;
  dashboardError: string | null;
}
