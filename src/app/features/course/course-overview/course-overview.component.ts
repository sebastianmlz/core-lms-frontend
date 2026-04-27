import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import { QuizApiService } from '../../../entities/assessment/api/quiz.api';
import { firstValueFrom } from 'rxjs';
import {
  CertificateStore,
  CertificateStoreType,
} from '../../../entities/certificate/model/certificate.store';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';

@Component({
  selector: 'app-course-overview',
  imports: [Button, DecimalPipe],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOverviewComponent {
  @Input() enableTutorAnalytics = false;
  @Input() inline = false;

  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly certificateStore = inject(CertificateStore) as CertificateStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  private readonly quizApi = inject(QuizApiService);
  private readonly router = inject(Router);

  constructor() {
    void this.courseStore.loadCourses();
  }

  loadDetail(courseId: number): void {
    if (this.inline) {
      void this.courseStore.loadCourseDetail(courseId);
      void this.courseStore.loadCourseQuizzes(courseId);
      if (this.enableTutorAnalytics) {
        void this.courseStore.loadCourseDashboard(courseId);
      }
      return;
    }
    this.navigateToCourse(courseId);
  }

  async deleteQuiz(quizId: number): Promise<void> {
    const courseId = this.courseStore.selectedCourseId();
    if (!courseId) return;

    const confirmDelete = confirm(
      '¿Estás seguro de que deseas eliminar esta evaluación? Esta acción no se puede deshacer.',
    );
    if (!confirmDelete) return;

    try {
      await firstValueFrom(this.quizApi.deleteQuiz(quizId));
      void this.courseStore.loadCourseQuizzes(courseId);
    } catch (err) {
      console.error('Error deleting quiz', err);
    }
  }

  navigateToCourse(courseId: number): void {
    if (!this.enableTutorAnalytics) {
      void this.router.navigate(['/student/course', courseId]);
      return;
    }
    void this.router.navigate(['/tutor/course', courseId]);
  }

  async generateCertificate(courseId: number): Promise<void> {
    const studentId = this.sessionStore.userId();
    if (!studentId) return;

    const hash = await this.certificateStore.generate(courseId, studentId);
    if (hash) {
      void this.router.navigate(['/certificate', hash]);
    }
  }
}
