import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { LessonItem } from '../../../entities/course/model/course.types';
import { LessonViewerComponent } from '../../../features/course/lesson-viewer/lesson-viewer.component';

@Component({
  selector: 'app-course-viewer-page',
  imports: [CommonModule, Button, LessonViewerComponent],
  templateUrl: './course-viewer-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseViewerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly courseStore = inject(CourseStore) as CourseStoreType;

  readonly selectedLesson = signal<LessonItem | null>(null);

  // Deriva el nombre del curso activo
  readonly courseName = computed(() => this.courseStore.selectedCourseDetail()?.name ?? 'Cargando curso...');
  readonly courseModules = computed(() => this.courseStore.selectedCourseDetail()?.modules ?? []);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const courseIdString = params.get('courseId');
      if (courseIdString) {
        const cId = Number(courseIdString);
        this.courseStore.selectCourse(cId);
        void this.courseStore.loadCourseDetail(cId);
      }
    });
  }

  selectLesson(lesson: LessonItem): void {
    this.selectedLesson.set(lesson);
  }

  goBack(): void {
    void this.router.navigate(['/student']);
  }
}
