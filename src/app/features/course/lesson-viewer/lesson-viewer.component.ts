import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import {
  LessonItem,
  ResourceItem,
} from '../../../entities/course/model/course.types';
import { AssignmentApiService } from '../../../entities/course/api/assignment.api';
import { ResourceApiService } from '../../../entities/course/api/resource.api';
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
  imports: [CommonModule, Button, SkeletonModule],
  templateUrl: './lesson-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonViewerComponent implements OnChanges {
  @Input({ required: true }) lesson!: LessonItem;
  @Output() openGrading = new EventEmitter<void>();

  private readonly assignmentApi = inject(AssignmentApiService);
  private readonly resourceApi = inject(ResourceApiService);
  private readonly sessionStore = inject(SessionStore) as SessionStoreType;

  readonly activeRole = computed(() => this.sessionStore.activeRole());

  // Resources fetched on lesson change (not embedded in CourseDetail)
  readonly resources = signal<ResourceItem[]>([]);
  readonly isLoadingResources = signal(false);

  readonly mainVideo = computed(
    () => this.resources().find((r) => r.resource_type === 'VIDEO') ?? null,
  );

  readonly otherResources = computed(() =>
    this.resources().filter((r) => r.resource_type !== 'VIDEO'),
  );

  // Assignment & Submissions state
  readonly assignment = signal<AssignmentItem | null>(null);
  readonly submission = signal<SubmissionItem | null>(null);
  readonly totalSubmissions = signal<number>(0);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson'] && this.lesson?.id) {
      this.assignment.set(null);
      this.submission.set(null);
      this.totalSubmissions.set(0);
      this.resources.set([]);
      void this.loadAssignmentData(this.lesson.id);
      void this.loadResourcesData(this.lesson.id);
    }
  }

  private async loadResourcesData(lessonId: number): Promise<void> {
    this.isLoadingResources.set(true);
    try {
      const items = await firstValueFrom(this.resourceApi.list(lessonId));
      this.resources.set(items ?? []);
    } catch {
      this.resources.set([]);
    } finally {
      this.isLoadingResources.set(false);
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

        // Verifica las entregas dependiendo del rol
        const submissions = await firstValueFrom(
          this.assignmentApi.getSubmissionsByAssignment(activeAssignment.id),
        );
        if (submissions && submissions.length > 0) {
          if (this.activeRole() === 'TUTOR') {
            this.totalSubmissions.set(submissions.length);
          } else {
            this.submission.set(submissions[0]);
          }
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
