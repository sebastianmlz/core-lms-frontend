import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { LessonItem } from '../../../entities/course/model/course.types';
import { AssignmentApiService } from '../../../entities/course/api/assignment.api';
import {
  AssignmentItem,
  SubmissionItem,
} from '../../../entities/course/model/assignment.types';
import { firstValueFrom } from 'rxjs';
import { DjangoApiClient } from '../../../shared/api/django-api.client';

export interface GradingPayload {
  grade: number;
}

@Component({
  selector: 'app-grading-panel',
  imports: [CommonModule, Button, FormsModule, InputNumberModule],
  templateUrl: './grading-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradingPanelComponent implements OnChanges {
  @Input({ required: true }) lesson!: LessonItem;

  private readonly assignmentApi = inject(AssignmentApiService);
  private readonly client = inject(DjangoApiClient);

  readonly assignment = signal<AssignmentItem | null>(null);
  readonly submissions = signal<SubmissionItem[]>([]);
  readonly isLoading = signal(false);

  // Mapeamos temporalmente el grado que el tutor está tipeando por Submission.id
  draftGrades = new Map<number, number>();
  readonly isSubmitting = signal<number | null>(null); // Submission ID que está siendo guardado

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson'] && this.lesson?.id) {
      this.assignment.set(null);
      this.submissions.set([]);
      this.draftGrades.clear();
      void this.loadAssignmentAndSubmissions(this.lesson.id);
    }
  }

  private async loadAssignmentAndSubmissions(lessonId: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const assignments = await firstValueFrom(
        this.assignmentApi.getAssignmentsByLesson(lessonId),
      );
      if (assignments && assignments.length > 0) {
        const activeAssignment = assignments[0];
        this.assignment.set(activeAssignment);

        // Fetch ALL submissions (IsTutor returns everyone)
        const subs = await firstValueFrom(
          this.assignmentApi.getSubmissionsByAssignment(activeAssignment.id),
        );
        this.submissions.set(subs ?? []);

        // Poblamos el cache de notas en draft de una vez para los ya calificados
        subs.forEach((s) => {
          if (s.grade !== null) {
            this.draftGrades.set(s.id, s.grade);
          }
        });
      }
    } catch (e) {
      console.error('Error cargando el panel de calificaciones.', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  getDraftGrade(submissionId: number): number | undefined {
    return this.draftGrades.get(submissionId);
  }

  setDraftGrade(submissionId: number, value: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixVal = (value as any)?.value ?? value;
    this.draftGrades.set(submissionId, Number(fixVal));
  }

  downloadSubmission(url: string): void {
    window.open(url, '_blank');
  }

  async saveGrade(submission: SubmissionItem): Promise<void> {
    const grade = this.draftGrades.get(submission.id);
    if (grade === undefined) return;

    this.isSubmitting.set(submission.id);

    try {
      const result = await firstValueFrom(
        this.client.patch<SubmissionItem, GradingPayload>(
          `/api/v1/submissions/${submission.id}/grade/`,
          { grade },
        ),
      );

      // Update local state without refreshing everything
      const currentSubs = this.submissions();
      const idx = currentSubs.findIndex((s) => s.id === submission.id);
      if (idx !== -1) {
        currentSubs[idx] = result;
        this.submissions.set([...currentSubs]);
      }
    } catch {
      console.error('Error guardando calificacion.');
    } finally {
      this.isSubmitting.set(null);
    }
  }
}
