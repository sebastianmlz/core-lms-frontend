import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { AssignmentApiService } from '../../../entities/course/api/assignment.api';
import { ResourceApiService } from '../../../entities/course/api/resource.api';
import {
  AssignmentItem,
} from '../../../entities/course/model/assignment.types';
import {
  LessonItem,
  ResourceItem,
  ResourceType,
} from '../../../entities/course/model/course.types';
import { GlobalToastService } from '../../../shared/lib/services/toast.service';

@Component({
  selector: 'app-tutor-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TabsModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './tutor-admin-page.component.html',
  styleUrl: './tutor-admin-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assignmentApi = inject(AssignmentApiService);
  private readonly resourceApi = inject(ResourceApiService);
  private readonly toast = inject(GlobalToastService);
  readonly courseStore = inject(CourseStore) as CourseStoreType;

  readonly resourceTypes: { label: string; value: ResourceType }[] = [
    { label: 'PDF', value: 'PDF' },
    { label: 'Video', value: 'VIDEO' },
    { label: 'Documento', value: 'DOCUMENT' },
    { label: 'Imagen', value: 'IMAGE' },
    { label: 'Otro', value: 'OTHER' },
  ];

  readonly assignments = signal<AssignmentItem[]>([]);
  readonly resources = signal<ResourceItem[]>([]);
  readonly lessons = signal<LessonItem[]>([]);

  readonly assignmentDialogOpen = signal<boolean>(false);
  readonly resourceDialogOpen = signal<boolean>(false);
  readonly editingAssignmentId = signal<number | null>(null);
  readonly isSavingAssignment = signal<boolean>(false);
  readonly isUploadingResource = signal<boolean>(false);

  readonly assignmentForm = this.fb.nonNullable.group({
    lesson: this.fb.control<number | null>(null, Validators.required),
    title: ['', Validators.required],
    description: [''],
    due_date: this.fb.control<Date | null>(null),
    max_score: [100, [Validators.required, Validators.min(1)]],
  });

  readonly resourceForm = this.fb.nonNullable.group({
    lesson: this.fb.control<number | null>(null, Validators.required),
    title: ['', Validators.required],
    type: this.fb.control<ResourceType>('PDF', Validators.required),
  });

  selectedFile: File | null = null;

  ngOnInit(): void {
    void this.courseStore.loadCourses();
    void this.refreshAssignments();
    void this.refreshResources();
  }

  // Cuando se selecciona un curso, cargar su detalle para enumerar las lecciones disponibles.
  async onSelectCourse(courseId: number | null): Promise<void> {
    if (courseId === null) {
      this.lessons.set([]);
      return;
    }
    await this.courseStore.loadCourseDetail(courseId);
    const detail = this.courseStore.selectedCourseDetail();
    const flat: LessonItem[] = [];
    detail?.modules?.forEach((m) =>
      m.lessons?.forEach((l) => flat.push(l)),
    );
    this.lessons.set(flat);
  }

  // ── Assignments ─────────────────────────────────────────────────
  async refreshAssignments(): Promise<void> {
    try {
      const items = await firstValueFrom(this.assignmentApi.listAssignments());
      this.assignments.set(items);
    } catch {
      this.toast.error('Error', 'No se pudieron cargar las asignaciones.');
    }
  }

  openAssignmentDialog(): void {
    this.editingAssignmentId.set(null);
    this.assignmentForm.reset({
      lesson: null,
      title: '',
      description: '',
      due_date: null,
      max_score: 100,
    });
    this.assignmentDialogOpen.set(true);
  }

  editAssignment(item: AssignmentItem): void {
    this.editingAssignmentId.set(item.id);
    this.assignmentForm.reset({
      lesson: item.lesson,
      title: item.title,
      description: item.description ?? '',
      due_date: item.due_date ? new Date(item.due_date) : null,
      max_score: item.max_score ?? 100,
    });
    this.assignmentDialogOpen.set(true);
  }

  async saveAssignment(): Promise<void> {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }
    this.isSavingAssignment.set(true);
    const raw = this.assignmentForm.getRawValue();
    const payload = {
      lesson: raw.lesson!,
      title: raw.title,
      description: raw.description ?? '',
      due_date: raw.due_date ? raw.due_date.toISOString() : null,
      max_score: raw.max_score,
    };
    const editingId = this.editingAssignmentId();
    try {
      if (editingId) {
        await firstValueFrom(
          this.assignmentApi.updateAssignment(editingId, {
            title: payload.title,
            description: payload.description,
            due_date: payload.due_date,
            max_score: payload.max_score,
          }),
        );
        this.toast.success('Asignación actualizada', payload.title);
      } else {
        await firstValueFrom(this.assignmentApi.createAssignment(payload));
        this.toast.success('Asignación creada', payload.title);
      }
      this.assignmentDialogOpen.set(false);
      await this.refreshAssignments();
    } catch {
      this.toast.error('Error', 'No se pudo guardar la asignación.');
    } finally {
      this.isSavingAssignment.set(false);
    }
  }

  async deleteAssignment(item: AssignmentItem): Promise<void> {
    if (!confirm(`¿Eliminar la asignación "${item.title}"?`)) {
      return;
    }
    try {
      await firstValueFrom(this.assignmentApi.deleteAssignment(item.id));
      this.toast.success('Asignación eliminada', item.title);
      await this.refreshAssignments();
    } catch {
      this.toast.error('Error', 'No se pudo eliminar la asignación.');
    }
  }

  // ── Resources ───────────────────────────────────────────────────
  async refreshResources(): Promise<void> {
    try {
      const items = await firstValueFrom(this.resourceApi.list());
      this.resources.set(items);
    } catch {
      this.toast.error('Error', 'No se pudieron cargar los recursos.');
    }
  }

  openResourceDialog(): void {
    this.selectedFile = null;
    this.resourceForm.reset({
      lesson: null,
      title: '',
      type: 'PDF',
    });
    this.resourceDialogOpen.set(true);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  async uploadResource(): Promise<void> {
    if (this.resourceForm.invalid || !this.selectedFile) {
      this.resourceForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.toast.error('Falta archivo', 'Selecciona un archivo para subir.');
      }
      return;
    }
    this.isUploadingResource.set(true);
    const raw = this.resourceForm.getRawValue();
    const resourceType = raw.type ?? 'OTHER';
    try {
      await firstValueFrom(
        this.resourceApi.create({
          lessonId: raw.lesson!,
          title: raw.title,
          type: resourceType,
          file: this.selectedFile,
        }),
      );
      this.toast.success('Recurso subido', raw.title);
      this.resourceDialogOpen.set(false);
      await this.refreshResources();
    } catch {
      this.toast.error('Error', 'No se pudo subir el recurso.');
    } finally {
      this.isUploadingResource.set(false);
    }
  }

  async deleteResource(item: ResourceItem): Promise<void> {
    if (!confirm(`¿Eliminar el recurso "${item.title}"?`)) {
      return;
    }
    try {
      await firstValueFrom(this.resourceApi.delete(item.id));
      this.toast.success('Recurso eliminado', item.title);
      await this.refreshResources();
    } catch {
      this.toast.error('Error', 'No se pudo eliminar el recurso.');
    }
  }
}
