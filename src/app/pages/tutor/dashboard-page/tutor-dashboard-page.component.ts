import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { CourseOverviewComponent } from '../../../features/course/course-overview/course-overview.component';
import { CognitiveShadowComponent } from '../../../features/reasoning/cognitive-shadow/cognitive-shadow.component';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';

@Component({
  selector: 'app-tutor-dashboard-page',
  imports: [ReactiveFormsModule, Button, CourseOverviewComponent, CognitiveShadowComponent],
  templateUrl: './tutor-dashboard-page.component.html',
  styleUrl: './tutor-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorDashboardPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  private lastDashboardCourseId: number | null = null;

  readonly graphForm = this.formBuilder.nonNullable.group({
    studentId: ['', [Validators.required]],
    topics: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const dashboard = this.courseStore.selectedCourseDashboard();
      if (!dashboard || dashboard.course_id === this.lastDashboardCourseId) {
        return;
      }

      this.lastDashboardCourseId = dashboard.course_id;
      const suggestedTopics = dashboard.top_failed_concepts.map((topic) => topic.concept_id).join(', ');
      this.graphForm.patchValue({ topics: suggestedTopics });
    });
  }

  useSuggestedTopics(): void {
    const dashboard = this.courseStore.selectedCourseDashboard();
    if (!dashboard) {
      return;
    }

    const suggestedTopics = dashboard.top_failed_concepts.map((topic) => topic.concept_id).join(', ');
    this.graphForm.patchValue({ topics: suggestedTopics });
  }

  async loadGraph(): Promise<void> {
    if (this.graphForm.invalid || this.reasoningStore.isLoadingGraph()) {
      this.graphForm.markAllAsTouched();
      return;
    }

    const topics = this.graphForm.controls.topics.value
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean);

    await this.reasoningStore.loadCognitiveGraph(this.graphForm.controls.studentId.value, topics);
  }
}
