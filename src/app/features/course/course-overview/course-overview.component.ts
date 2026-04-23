import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';

@Component({
  selector: 'app-course-overview',
  imports: [Button, DecimalPipe],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOverviewComponent {
  @Input() enableTutorAnalytics = false;

  readonly courseStore = inject(CourseStore) as CourseStoreType;
  private readonly router = inject(Router);

  constructor() {
    void this.courseStore.loadCourses();
  }

  loadDetail(courseId: number): void {
    if (!this.enableTutorAnalytics) {
       // Is Student -> Go to immersive Viewer
       void this.router.navigate(['/student/course', courseId]);
       return;
    }

    // Is Tutor -> Go to immersive Tutor Viewer
    void this.router.navigate(['/tutor/course', courseId]);
  }
}
