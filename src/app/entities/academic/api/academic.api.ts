import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { PaginatedResponse } from '../../../shared/lib/models/pagination.types';
import {
  AcademicModule,
  Career,
  CareerWritePayload,
  Course,
  CourseWritePayload,
  Lesson,
  LessonWritePayload,
  ModuleWritePayload,
  Semester,
  SemesterWritePayload,
} from '../model/academic.types';

/**
 * AcademicApiService — Tutor-facing CRUD for the academic ontology
 * (Career → Semester → Course → Module → Lesson).
 *
 * The backend protects writes with IsTutor and reads with IsAuthenticated.
 * The DjangoApiClient already injects the JWT via the auth interceptor and
 * handles 401 refresh transparently, so individual methods only need to
 * shape the URL and payload.
 */
@Injectable({ providedIn: 'root' })
export class AcademicApiService {
  private readonly client = inject(DjangoApiClient);

  // ── Careers ──────────────────────────────────────────────────────
  listCareers(page: number = 1): Observable<PaginatedResponse<Career>> {
    return this.client.get<PaginatedResponse<Career>>('/api/v1/careers/', {
      params: { page },
    });
  }

  createCareer(body: CareerWritePayload): Observable<Career> {
    return this.client.post<Career, CareerWritePayload>(
      '/api/v1/careers/',
      body,
    );
  }

  updateCareer(
    id: number,
    body: Partial<CareerWritePayload>,
  ): Observable<Career> {
    return this.client.patch<Career, Partial<CareerWritePayload>>(
      `/api/v1/careers/${id}/`,
      body,
    );
  }

  deleteCareer(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/careers/${id}/`);
  }

  // ── Semesters ────────────────────────────────────────────────────
  listSemesters(
    careerId?: number,
    page: number = 1,
  ): Observable<PaginatedResponse<Semester>> {
    return this.client.get<PaginatedResponse<Semester>>(
      '/api/v1/semesters/',
      { params: { career: careerId, page } },
    );
  }

  createSemester(body: SemesterWritePayload): Observable<Semester> {
    return this.client.post<Semester, SemesterWritePayload>(
      '/api/v1/semesters/',
      body,
    );
  }

  updateSemester(
    id: number,
    body: Partial<SemesterWritePayload>,
  ): Observable<Semester> {
    return this.client.patch<Semester, Partial<SemesterWritePayload>>(
      `/api/v1/semesters/${id}/`,
      body,
    );
  }

  deleteSemester(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/semesters/${id}/`);
  }

  // ── Courses ──────────────────────────────────────────────────────
  listCourses(
    semesterId?: number,
    page: number = 1,
  ): Observable<PaginatedResponse<Course>> {
    return this.client.get<PaginatedResponse<Course>>('/api/v1/courses/', {
      params: { semester: semesterId, page },
    });
  }

  createCourse(body: CourseWritePayload): Observable<Course> {
    return this.client.post<Course, CourseWritePayload>(
      '/api/v1/courses/',
      body,
    );
  }

  updateCourse(
    id: number,
    body: Partial<CourseWritePayload>,
  ): Observable<Course> {
    return this.client.patch<Course, Partial<CourseWritePayload>>(
      `/api/v1/courses/${id}/`,
      body,
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/courses/${id}/`);
  }

  // ── Modules ──────────────────────────────────────────────────────
  listModules(
    courseId?: number,
    page: number = 1,
  ): Observable<PaginatedResponse<AcademicModule>> {
    return this.client.get<PaginatedResponse<AcademicModule>>(
      '/api/v1/modules/',
      { params: { course: courseId, page } },
    );
  }

  createModule(body: ModuleWritePayload): Observable<AcademicModule> {
    return this.client.post<AcademicModule, ModuleWritePayload>(
      '/api/v1/modules/',
      body,
    );
  }

  updateModule(
    id: number,
    body: Partial<ModuleWritePayload>,
  ): Observable<AcademicModule> {
    return this.client.patch<AcademicModule, Partial<ModuleWritePayload>>(
      `/api/v1/modules/${id}/`,
      body,
    );
  }

  deleteModule(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/modules/${id}/`);
  }

  // ── Lessons ──────────────────────────────────────────────────────
  listLessons(
    moduleId?: number,
    page: number = 1,
  ): Observable<PaginatedResponse<Lesson>> {
    return this.client.get<PaginatedResponse<Lesson>>('/api/v1/lessons/', {
      params: { module: moduleId, page },
    });
  }

  createLesson(body: LessonWritePayload): Observable<Lesson> {
    return this.client.post<Lesson, LessonWritePayload>(
      '/api/v1/lessons/',
      body,
    );
  }

  updateLesson(
    id: number,
    body: Partial<LessonWritePayload>,
  ): Observable<Lesson> {
    return this.client.patch<Lesson, Partial<LessonWritePayload>>(
      `/api/v1/lessons/${id}/`,
      body,
    );
  }

  deleteLesson(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/lessons/${id}/`);
  }
}
