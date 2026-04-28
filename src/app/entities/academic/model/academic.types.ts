export type SemesterPeriod = 'I' | 'II' | 'SUMMER';

export interface Career {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface CareerWritePayload {
  name: string;
  code: string;
  description?: string;
}

export interface Semester {
  id: number;
  career: number;
  name: string;
  number: number;
  year: number;
  period: SemesterPeriod;
  created_at: string;
}

export interface SemesterWritePayload {
  career: number;
  name: string;
  number: number;
  year: number;
  period: SemesterPeriod;
}

export interface Course {
  id: number;
  semester: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface CourseWritePayload {
  semester: number;
  name: string;
  code: string;
  description?: string;
}

export interface AcademicModule {
  id: number;
  course: number;
  title: string;
  description: string;
  order: number;
}

export interface ModuleWritePayload {
  course: number;
  title: string;
  description?: string;
  order: number;
}

export interface Lesson {
  id: number;
  module: number;
  title: string;
  content: string;
  order: number;
}

export interface LessonWritePayload {
  module: number;
  title: string;
  content?: string;
  order: number;
}
