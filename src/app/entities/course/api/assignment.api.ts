import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import {
  AssignmentItem,
  PaginatedDjangoResponse,
  SubmissionItem,
} from '../model/assignment.types';

@Injectable({ providedIn: 'root' })
export class AssignmentApiService {
  private readonly client = inject(DjangoApiClient);

  // Busca tareas especificas de una lección
  getAssignmentsByLesson(lessonId: number): Observable<AssignmentItem[]> {
    return this.client
      .get<
        PaginatedDjangoResponse<AssignmentItem>
      >(`/api/v1/assignments/?lesson=${lessonId}`)
      .pipe(map((res) => res.results));
  }

  // Verifica si el estudiante ya tiene una entrega para esta Tarea
  getSubmissionsByAssignment(
    assignmentId: number,
  ): Observable<SubmissionItem[]> {
    return this.client
      .get<
        PaginatedDjangoResponse<SubmissionItem>
      >(`/api/v1/submissions/?assignment=${assignmentId}`)
      .pipe(map((res) => res.results));
  }

  // Sube el archivo como multipart/form-data
  submitAssignment(
    assignmentId: number,
    studentId: number,
    file: File,
  ): Observable<SubmissionItem> {
    const formData = new FormData();
    formData.append('assignment', assignmentId.toString());
    formData.append('student', studentId.toString());
    formData.append('file', file);

    // El DjangoApiClient delega a HttpClient, que detecta FormData y emite
    // el boundary multipart correcto sin necesidad de tocar el header.
    return this.client.post<SubmissionItem, FormData>(
      `/api/v1/submissions/`,
      formData,
    );
  }

  listAssignments(): Observable<AssignmentItem[]> {
    return this.client
      .get<PaginatedDjangoResponse<AssignmentItem>>('/api/v1/assignments/')
      .pipe(map((res) => res.results));
  }

  createAssignment(payload: {
    lesson: number;
    title: string;
    description?: string;
    due_date?: string | null;
    max_score?: number;
  }): Observable<AssignmentItem> {
    return this.client.post<AssignmentItem, typeof payload>(
      '/api/v1/assignments/',
      payload,
    );
  }

  updateAssignment(
    id: number,
    payload: Partial<{
      title: string;
      description: string;
      due_date: string | null;
      max_score: number;
    }>,
  ): Observable<AssignmentItem> {
    return this.client.patch<AssignmentItem, typeof payload>(
      `/api/v1/assignments/${id}/`,
      payload,
    );
  }

  deleteAssignment(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/assignments/${id}/`);
  }
}
