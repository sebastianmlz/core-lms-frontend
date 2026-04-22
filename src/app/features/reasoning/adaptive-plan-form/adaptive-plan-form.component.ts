import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';
import {
  AdaptivePlanInput,
  AdaptivePlanItem,
} from '../../../entities/reasoning/model/reasoning.types';

@Component({
  selector: 'app-adaptive-plan-form',
  imports: [ReactiveFormsModule, Button],
  templateUrl: './adaptive-plan-form.component.html',
  styleUrl: './adaptive-plan-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptivePlanFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;

  readonly form = this.formBuilder.nonNullable.group({
    studentId: ['', [Validators.required]],
    courseId: ['', [Validators.required]],
    failedTopics: ['', [Validators.required]],
    varkProfile: ['aural'],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.reasoningStore.isLoadingPlan()) {
      this.form.markAllAsTouched();
      return;
    }

    const topics = this.form.controls.failedTopics.value
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean);

    const payload: AdaptivePlanInput = {
      studentId: this.form.controls.studentId.value,
      courseId: this.form.controls.courseId.value,
      failedTopics: topics,
      varkProfile: this.form.controls.varkProfile.value as AdaptivePlanInput['varkProfile'],
    };

    await this.reasoningStore.generateAdaptivePlan(payload);
  }

  trackByTopic(index: number, item: AdaptivePlanItem): string {
    return `${item.topic}-${index}`;
  }
}
