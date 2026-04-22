import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
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

  constructor() {
    void this.courseStore.loadCourses();
  }

  loadDetail(courseId: number): void {
    this.courseStore.selectCourse(courseId);
    void this.courseStore.loadCourseDetail(courseId);

    if (this.enableTutorAnalytics) {
      void this.courseStore.loadCourseDashboard(courseId);
    }
  }
}
