import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AcademicApiService } from '../../../entities/academic/api/academic.api';
import {
  AcademicModule,
  Career,
  Course,
  Lesson,
  Semester,
  SemesterPeriod,
} from '../../../entities/academic/model/academic.types';
import { GlobalToastService } from '../../../shared/lib/services/toast.service';

type EntityKind = 'career' | 'semester' | 'course' | 'module' | 'lesson';

@Component({
  selector: 'app-tutor-academic-page',
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
    SelectModule,
    TabsModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './tutor-academic-page.component.html',
  styleUrl: './tutor-academic-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorAcademicPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AcademicApiService);
  private readonly toast = inject(GlobalToastService);

  readonly periodOptions: { label: string; value: SemesterPeriod }[] = [
    { label: 'Primer (I)', value: 'I' },
    { label: 'Segundo (II)', value: 'II' },
    { label: 'Verano', value: 'SUMMER' },
  ];

  readonly careers = signal<Career[]>([]);
  readonly semesters = signal<Semester[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly modules = signal<AcademicModule[]>([]);
  readonly lessons = signal<Lesson[]>([]);

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Filtros padre seleccionado para drill-down (CU-03 spec).
  readonly selectedCareerId = signal<number | null>(null);
  readonly selectedSemesterId = signal<number | null>(null);
  readonly selectedCourseId = signal<number | null>(null);
  readonly selectedModuleId = signal<number | null>(null);

  readonly dialogOpen = signal<boolean>(false);
  readonly dialogKind = signal<EntityKind>('career');
  readonly editingId = signal<number | null>(null);

  readonly careerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
  });

  readonly semesterForm = this.fb.nonNullable.group({
    career: this.fb.control<number | null>(null, Validators.required),
    name: ['', Validators.required],
    number: [1, [Validators.required, Validators.min(1)]],
    year: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(2000)],
    ],
    period: this.fb.control<SemesterPeriod>('I', Validators.required),
  });

  readonly courseForm = this.fb.nonNullable.group({
    semester: this.fb.control<number | null>(null, Validators.required),
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
  });

  readonly moduleForm = this.fb.nonNullable.group({
    course: this.fb.control<number | null>(null, Validators.required),
    title: ['', Validators.required],
    description: [''],
    order: [0, [Validators.required, Validators.min(0)]],
  });

  readonly lessonForm = this.fb.nonNullable.group({
    module: this.fb.control<number | null>(null, Validators.required),
    title: ['', Validators.required],
    content: [''],
    order: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    void this.refreshCareers();
    void this.refreshSemesters();
    void this.refreshCourses();
    void this.refreshModules();
    void this.refreshLessons();
  }

  // ── Refresh helpers ─────────────────────────────────────────────
  async refreshCareers(): Promise<void> {
    this.isLoading.set(true);
    try {
      const r = await firstValueFrom(this.api.listCareers());
      this.careers.set(r.results);
    } catch (err) {
      this.handleError(err, 'No se pudieron cargar las carreras.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshSemesters(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.api.listSemesters(this.selectedCareerId() ?? undefined),
      );
      this.semesters.set(r.results);
    } catch (err) {
      this.handleError(err, 'No se pudieron cargar los semestres.');
    }
  }

  async refreshCourses(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.api.listCourses(this.selectedSemesterId() ?? undefined),
      );
      this.courses.set(r.results);
    } catch (err) {
      this.handleError(err, 'No se pudieron cargar los cursos.');
    }
  }

  async refreshModules(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.api.listModules(this.selectedCourseId() ?? undefined),
      );
      this.modules.set(r.results);
    } catch (err) {
      this.handleError(err, 'No se pudieron cargar los módulos.');
    }
  }

  async refreshLessons(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.api.listLessons(this.selectedModuleId() ?? undefined),
      );
      this.lessons.set(r.results);
    } catch (err) {
      this.handleError(err, 'No se pudieron cargar las lecciones.');
    }
  }

  // ── Drill-down: clic en una fila filtra la pestaña siguiente ─────
  selectCareer(career: Career): void {
    this.selectedCareerId.set(career.id);
    this.selectedSemesterId.set(null);
    this.selectedCourseId.set(null);
    this.selectedModuleId.set(null);
    void this.refreshSemesters();
    void this.refreshCourses();
    void this.refreshModules();
    void this.refreshLessons();
  }

  selectSemester(semester: Semester): void {
    this.selectedSemesterId.set(semester.id);
    this.selectedCourseId.set(null);
    this.selectedModuleId.set(null);
    void this.refreshCourses();
    void this.refreshModules();
    void this.refreshLessons();
  }

  selectCourse(course: Course): void {
    this.selectedCourseId.set(course.id);
    this.selectedModuleId.set(null);
    void this.refreshModules();
    void this.refreshLessons();
  }

  selectModule(mod: AcademicModule): void {
    this.selectedModuleId.set(mod.id);
    void this.refreshLessons();
  }

  clearFilters(): void {
    this.selectedCareerId.set(null);
    this.selectedSemesterId.set(null);
    this.selectedCourseId.set(null);
    this.selectedModuleId.set(null);
    void this.refreshSemesters();
    void this.refreshCourses();
    void this.refreshModules();
    void this.refreshLessons();
  }

  // ── Dialog helpers ──────────────────────────────────────────────
  openCreate(kind: EntityKind): void {
    this.editingId.set(null);
    this.dialogKind.set(kind);
    this.errorMessage.set(null);
    switch (kind) {
      case 'career':
        this.careerForm.reset({ name: '', code: '', description: '' });
        break;
      case 'semester':
        this.semesterForm.reset({
          career: this.selectedCareerId(),
          name: '',
          number: 1,
          year: new Date().getFullYear(),
          period: 'I',
        });
        break;
      case 'course':
        this.courseForm.reset({
          semester: this.selectedSemesterId(),
          name: '',
          code: '',
          description: '',
        });
        break;
      case 'module':
        this.moduleForm.reset({
          course: this.selectedCourseId(),
          title: '',
          description: '',
          order: 0,
        });
        break;
      case 'lesson':
        this.lessonForm.reset({
          module: this.selectedModuleId(),
          title: '',
          content: '',
          order: 0,
        });
        break;
    }
    this.dialogOpen.set(false);
    setTimeout(() => this.dialogOpen.set(true), 0);
  }

  openEdit(kind: EntityKind, item: Record<string, unknown>): void {
    this.dialogKind.set(kind);
    this.editingId.set(item['id'] as number);
    this.errorMessage.set(null);
    switch (kind) {
      case 'career':
        this.careerForm.reset({
          name: (item['name'] as string) ?? '',
          code: (item['code'] as string) ?? '',
          description: (item['description'] as string) ?? '',
        });
        break;
      case 'semester':
        this.semesterForm.reset({
          career: item['career'] as number,
          name: (item['name'] as string) ?? '',
          number: (item['number'] as number) ?? 1,
          year: (item['year'] as number) ?? new Date().getFullYear(),
          period: (item['period'] as SemesterPeriod) ?? 'I',
        });
        break;
      case 'course':
        this.courseForm.reset({
          semester: item['semester'] as number,
          name: (item['name'] as string) ?? '',
          code: (item['code'] as string) ?? '',
          description: (item['description'] as string) ?? '',
        });
        break;
      case 'module':
        this.moduleForm.reset({
          course: item['course'] as number,
          title: (item['title'] as string) ?? '',
          description: (item['description'] as string) ?? '',
          order: (item['order'] as number) ?? 0,
        });
        break;
      case 'lesson':
        this.lessonForm.reset({
          module: item['module'] as number,
          title: (item['title'] as string) ?? '',
          content: (item['content'] as string) ?? '',
          order: (item['order'] as number) ?? 0,
        });
        break;
    }
    this.dialogOpen.set(false);
    setTimeout(() => this.dialogOpen.set(true), 0);
  }

  // ── Save ────────────────────────────────────────────────────────
  async save(): Promise<void> {
    const kind = this.dialogKind();
    const editingId = this.editingId();
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      switch (kind) {
        case 'career':
          await this.saveCareer(editingId);
          await this.refreshCareers();
          break;
        case 'semester':
          await this.saveSemester(editingId);
          await this.refreshSemesters();
          break;
        case 'course':
          await this.saveCourse(editingId);
          await this.refreshCourses();
          break;
        case 'module':
          await this.saveModule(editingId);
          await this.refreshModules();
          break;
        case 'lesson':
          await this.saveLesson(editingId);
          await this.refreshLessons();
          break;
      }
      this.dialogOpen.set(false);
      this.toast.success(
        editingId ? 'Actualizado correctamente' : 'Creado correctamente',
      );
    } catch (err) {
      this.handleError(err, 'No se pudo guardar el registro.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private async saveCareer(editingId: number | null): Promise<void> {
    if (this.careerForm.invalid) {
      this.careerForm.markAllAsTouched();
      throw new Error('form_invalid');
    }
    const raw = this.careerForm.getRawValue();
    if (editingId) {
      await firstValueFrom(this.api.updateCareer(editingId, raw));
    } else {
      await firstValueFrom(this.api.createCareer(raw));
    }
  }

  private async saveSemester(editingId: number | null): Promise<void> {
    if (this.semesterForm.invalid) {
      this.semesterForm.markAllAsTouched();
      throw new Error('form_invalid');
    }
    const raw = this.semesterForm.getRawValue();
    const payload = {
      career: raw.career!,
      name: raw.name,
      number: raw.number,
      year: raw.year,
      period: (raw.period ?? 'I') as SemesterPeriod,
    };
    if (editingId) {
      await firstValueFrom(this.api.updateSemester(editingId, payload));
    } else {
      await firstValueFrom(this.api.createSemester(payload));
    }
  }

  private async saveCourse(editingId: number | null): Promise<void> {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      throw new Error('form_invalid');
    }
    const raw = this.courseForm.getRawValue();
    const payload = {
      semester: raw.semester!,
      name: raw.name,
      code: raw.code,
      description: raw.description,
    };
    if (editingId) {
      await firstValueFrom(this.api.updateCourse(editingId, payload));
    } else {
      await firstValueFrom(this.api.createCourse(payload));
    }
  }

  private async saveModule(editingId: number | null): Promise<void> {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      throw new Error('form_invalid');
    }
    const raw = this.moduleForm.getRawValue();
    const payload = {
      course: raw.course!,
      title: raw.title,
      description: raw.description,
      order: raw.order,
    };
    if (editingId) {
      await firstValueFrom(this.api.updateModule(editingId, payload));
    } else {
      await firstValueFrom(this.api.createModule(payload));
    }
  }

  private async saveLesson(editingId: number | null): Promise<void> {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      throw new Error('form_invalid');
    }
    const raw = this.lessonForm.getRawValue();
    const payload = {
      module: raw.module!,
      title: raw.title,
      content: raw.content,
      order: raw.order,
    };
    if (editingId) {
      await firstValueFrom(this.api.updateLesson(editingId, payload));
    } else {
      await firstValueFrom(this.api.createLesson(payload));
    }
  }

  // ── Delete ──────────────────────────────────────────────────────
  async deleteCareer(item: Career): Promise<void> {
    if (!confirm(`¿Eliminar la carrera "${item.name}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteCareer(item.id));
      this.toast.success('Carrera eliminada', item.name);
      await this.refreshCareers();
    } catch (err) {
      this.handleError(err, 'No se pudo eliminar la carrera.');
    }
  }

  async deleteSemester(item: Semester): Promise<void> {
    if (!confirm(`¿Eliminar el semestre "${item.name}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteSemester(item.id));
      this.toast.success('Semestre eliminado', item.name);
      await this.refreshSemesters();
    } catch (err) {
      this.handleError(err, 'No se pudo eliminar el semestre.');
    }
  }

  async deleteCourse(item: Course): Promise<void> {
    if (!confirm(`¿Eliminar el curso "${item.name}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteCourse(item.id));
      this.toast.success('Curso eliminado', item.name);
      await this.refreshCourses();
    } catch (err) {
      this.handleError(err, 'No se pudo eliminar el curso.');
    }
  }

  async deleteModule(item: AcademicModule): Promise<void> {
    if (!confirm(`¿Eliminar el módulo "${item.title}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteModule(item.id));
      this.toast.success('Módulo eliminado', item.title);
      await this.refreshModules();
    } catch (err) {
      this.handleError(err, 'No se pudo eliminar el módulo.');
    }
  }

  async deleteLesson(item: Lesson): Promise<void> {
    if (!confirm(`¿Eliminar la lección "${item.title}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteLesson(item.id));
      this.toast.success('Lección eliminada', item.title);
      await this.refreshLessons();
    } catch (err) {
      this.handleError(err, 'No se pudo eliminar la lección.');
    }
  }

  // ── Error handling ──────────────────────────────────────────────
  private handleError(err: unknown, fallback: string): void {
    if (err instanceof Error && err.message === 'form_invalid') {
      this.errorMessage.set('Revisa los campos requeridos.');
      return;
    }
    if (err instanceof HttpErrorResponse) {
      let detail = '';
      if (err.error && typeof err.error === 'object') {
        detail = JSON.stringify(err.error);
      } else if (typeof err.error === 'string') {
        detail = err.error;
      }
      switch (err.status) {
        case 400:
          this.errorMessage.set(`Error de validación: ${detail || fallback}`);
          this.toast.error('Validación falló', detail || fallback);
          return;
        case 401:
          this.toast.error('Sesión expirada', 'Vuelve a iniciar sesión.');
          return;
        case 403:
          this.toast.error(
            'Permiso denegado',
            'Esta acción es solo para tutores.',
          );
          return;
        case 404:
          this.toast.error('No encontrado', 'El registro ya no existe.');
          return;
      }
    }
    this.errorMessage.set(fallback);
    this.toast.error('Error', fallback);
  }
}
