import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CourseApiService } from '../api/course.api';
import { CourseDashboardSummary, CourseDetail, CourseListItem, CourseState } from './course.types';
import { QuizApiService } from '../../assessment/api/quiz.api';

const initialState: CourseState = {
  courses: [],
  selectedCourseId: null,
  selectedCourseDetail: null,
  selectedCourseDashboard: null,
  selectedCourseQuizzes: [],
  isLoading: false,
  isLoadingDashboard: false,
  isLoadingQuizzes: false,
  error: null,
  dashboardError: null,
};

export const CourseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedCourse: computed(() =>
      store.courses().find((course) => course.id === store.selectedCourseId()) ?? null,
    ),
  })),
  withMethods((store, courseApi = inject(CourseApiService)) => ({
    async loadCourses(): Promise<void> {
      patchState(store, { isLoading: true, error: null });

      try {
        const response = await firstValueFrom(courseApi.listCourses());
        patchState(store, {
          courses: response.results,
          isLoading: false,
        });
      } catch {
        patchState(store, {
          isLoading: false,
          error: 'No se pudieron cargar los cursos.',
        });
      }
    },
    selectCourse(courseId: number): void {
      patchState(store, {
        selectedCourseId: courseId,
        selectedCourseDashboard: null,
        dashboardError: null,
      });
    },
    async loadCourseDetail(courseId: number): Promise<void> {
      patchState(store, {
        isLoading: true,
        error: null,
      });

      try {
        const detail = await firstValueFrom(courseApi.getCourseDetail(courseId));
        patchState(store, {
          selectedCourseDetail: detail,
          selectedCourseId: detail.id,
          isLoading: false,
        });
      } catch {
        patchState(store, {
          isLoading: false,
          error: 'No se pudo cargar el detalle del curso.',
        });
      }
    },
    async loadCourseDashboard(courseId: number): Promise<void> {
      patchState(store, {
        isLoadingDashboard: true,
        dashboardError: null,
      });

      try {
        const dashboard = await firstValueFrom(courseApi.getCourseDashboard(courseId));
        patchState(store, {
          selectedCourseDashboard: dashboard,
          isLoadingDashboard: false,
        });
      } catch {
        patchState(store, {
          selectedCourseDashboard: null,
          isLoadingDashboard: false,
          dashboardError: 'No se pudieron cargar las metricas del curso.',
        });
      }
    },
    async loadCourseQuizzes(courseId: number): Promise<void> {
      patchState(store, { isLoadingQuizzes: true });
      const quizApi = inject(QuizApiService);
      try {
        const quizzes = await firstValueFrom(quizApi.getQuizzes(courseId));
        patchState(store, {
          selectedCourseQuizzes: quizzes,
          isLoadingQuizzes: false,
        });
      } catch {
        patchState(store, {
          selectedCourseQuizzes: [],
          isLoadingQuizzes: false,
        });
      }
    },
  })),
);

export type CourseStoreType = InstanceType<typeof CourseStore>;
