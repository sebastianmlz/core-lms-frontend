import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { CertificateStore, CertificateStoreType } from '../../../entities/certificate/model/certificate.store';
import { SessionStore, SessionStoreType } from '../../../entities/session/model/session.store';

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
