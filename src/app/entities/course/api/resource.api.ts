import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { ResourceItem, ResourceType } from '../model/course.types';
import { PaginatedDjangoResponse } from '../model/assignment.types';

@Injectable({ providedIn: 'root' })
export class ResourceApiService {
  private readonly client = inject(DjangoApiClient);

  list(lessonId?: number): Observable<ResourceItem[]> {
    const url = lessonId
      ? `/api/v1/resources/?lesson=${lessonId}`
      : '/api/v1/resources/';
    return this.client
      .get<PaginatedDjangoResponse<ResourceItem>>(url)
      .pipe(map((res) => res.results));
  }

  create(payload: {
    lessonId: number;
    title: string;
    type: ResourceType;
    file: File;
  }): Observable<ResourceItem> {
    const formData = new FormData();
    formData.append('lesson', payload.lessonId.toString());
    formData.append('resource_type', payload.type);
    formData.append('title', payload.title);
    formData.append('file', payload.file);
    return this.client.post<ResourceItem, FormData>(
      '/api/v1/resources/',
      formData,
    );
  }

  delete(id: number): Observable<void> {
    return this.client.delete<void>(`/api/v1/resources/${id}/`);
  }
}
