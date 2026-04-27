import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { PaginatedResponse } from '../../../shared/lib/models/pagination.types';
import {
  CourseDashboardSummary,
  CourseDetail,
  CourseListItem,
} from '../model/course.types';

@Injectable({ providedIn: 'root' })
export class CourseApiService {
  private readonly djangoApi = inject(DjangoApiClient);

  listCourses(params?: {
    semester?: number;
    career?: number;
  }): Observable<PaginatedResponse<CourseListItem>> {
    return this.djangoApi.get<PaginatedResponse<CourseListItem>>(
      '/api/v1/courses/',
      {
        params: {
          semester: params?.semester,
          semester__career: params?.career,
        },
      },
    );
  }

  getCourseDetail(courseId: number): Observable<CourseDetail> {
    return this.djangoApi.get<CourseDetail>(`/api/v1/courses/${courseId}/`);
  }

  getCourseDashboard(courseId: number): Observable<CourseDashboardSummary> {
    return this.djangoApi.get<CourseDashboardSummary>(
      `/api/v1/analytics/course/${courseId}/dashboard/`,
    );
  }
}
