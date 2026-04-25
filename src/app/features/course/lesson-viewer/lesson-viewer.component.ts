import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { LessonItem } from '../../../entities/course/model/course.types';
import { AssignmentApiService } from '../../../entities/course/api/assignment.api';
import {
  AssignmentItem,
  SubmissionItem,
} from '../../../entities/course/model/assignment.types';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-lesson-viewer',
  imports: [CommonModule, Button],
  templateUrl: './lesson-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonViewerComponent implements OnChanges {
  @Input({ required: true }) lesson!: LessonItem;

  private readonly assignmentApi = inject(AssignmentApiService);
  private readonly sessionStore = inject(SessionStore) as SessionStoreType;

  readonly hasVideo = computed(
    () =>
      this.lesson.resources?.some((r) => r.resource_type === 'VIDEO') ?? false,
  );
  readonly mainVideo = computed(
    () =>
      this.lesson.resources?.find((r) => r.resource_type === 'VIDEO') ?? null,
  );

  readonly otherResources = computed(
    () =>
      this.lesson.resources?.filter((r) => r.resource_type !== 'VIDEO') ?? [],
  );

  // Assignment & Submissions state
  readonly assignment = signal<AssignmentItem | null>(null);
  readonly submission = signal<SubmissionItem | null>(null);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson'] && this.lesson?.id) {
      this.assignment.set(null);
      this.submission.set(null);
      void this.loadAssignmentData(this.lesson.id);
    }
  }

  private async loadAssignmentData(lessonId: number): Promise<void> {
    try {
      const assignments = await firstValueFrom(
        this.assignmentApi.getAssignmentsByLesson(lessonId),
      );
      if (assignments && assignments.length > 0) {
        const activeAssignment = assignments[0];
        this.assignment.set(activeAssignment);

        // Verifica si el estudiante ya entregó esta tarea
        const submissions = await firstValueFrom(
          this.assignmentApi.getSubmissionsByAssignment(activeAssignment.id),
        );
        if (submissions && submissions.length > 0) {
          this.submission.set(submissions[0]);
        }
      }
    } catch {
      console.error('Error cargando tareas de la lección.');
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const assignmentId = this.assignment()?.id;
    const studentId = this.sessionStore.userId();

    if (!assignmentId || !studentId) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    try {
      const result = await firstValueFrom(
        this.assignmentApi.submitAssignment(assignmentId, studentId, file),
      );
      this.submission.set(result); // Mostramos el success
    } catch {
      this.uploadError.set(
        'Error subiendo el archivo. Por favor, intenta de nuevo.',
      );
    } finally {
      this.isUploading.set(false);
    }
  }

  downloadFile(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
