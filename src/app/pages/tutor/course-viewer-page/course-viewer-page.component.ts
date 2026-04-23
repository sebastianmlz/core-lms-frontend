import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { LessonItem } from '../../../entities/course/model/course.types';
import { GradingPanelComponent } from '../../../features/tutor/grading-panel/grading-panel.component';

@Component({
  selector: 'app-tutor-course-viewer-page',
  imports: [CommonModule, Button, ProgressBarModule, GradingPanelComponent],
  templateUrl: './course-viewer-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorCourseViewerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly courseStore = inject(CourseStore) as CourseStoreType;

  readonly selectedLesson = signal<LessonItem | null>(null);

  readonly courseName = computed(() => this.courseStore.selectedCourseDetail()?.name ?? 'Cargando curso...');
  readonly courseModules = computed(() => this.courseStore.selectedCourseDetail()?.modules ?? []);
  readonly dashboard = computed(() => this.courseStore.selectedCourseDashboard());

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const courseIdString = params.get('courseId');
      if (courseIdString) {
        const cId = Number(courseIdString);
        this.courseStore.selectCourse(cId);
        void this.courseStore.loadCourseDetail(cId);
        void this.courseStore.loadCourseDashboard(cId);
      }
    });
  }

  selectLesson(lesson: LessonItem): void {
    this.selectedLesson.set(lesson);
  }

  clearSelection(): void {
    this.selectedLesson.set(null);
  }

  goBack(): void {
    void this.router.navigate(['/tutor']);
  }
}
