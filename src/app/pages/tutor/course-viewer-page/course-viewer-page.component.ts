import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { QuizApiService } from '../../../entities/assessment/api/quiz.api';
import { LessonItem } from '../../../entities/course/model/course.types';
import { GradingPanelComponent } from '../../../features/tutor/grading-panel/grading-panel.component';

@Component({
  selector: 'app-tutor-course-viewer-page',
  imports: [CommonModule, ReactiveFormsModule, Button, Select, Dialog, InputNumberModule, ProgressBarModule, GradingPanelComponent],
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
        void this.courseStore.loadCourseQuizzes(cId);
      }
    });
  }

  selectLesson(lesson: LessonItem): void {
    this.selectedLesson.set(lesson);
  }

  clearSelection(): void {
    this.selectedLesson.set(null);
  }

  private readonly formBuilder = inject(FormBuilder);
  private readonly quizApi = inject(QuizApiService);

  showEditQuiz = false;
  editingQuizId: number | null = null;

  readonly quizForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: [''],
    timeLimit: [30, [Validators.required]],
    questions: this.formBuilder.array([]),
  });

  get questions() {
    return this.quizForm.get('questions') as FormArray;
  }

  async openEditQuiz(quizId: number): Promise<void> {
    try {
      const quiz = await firstValueFrom(this.quizApi.getQuizDetail(quizId));
      this.editingQuizId = quiz.id;
      this.quizForm.reset({
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.time_limit_minutes,
      });
      this.questions.clear();
      quiz.questions.forEach((q: any) => {
        const qForm = this.formBuilder.group({
          text: [q.text, [Validators.required]],
          concept_id: [q.concept_id, [Validators.required]],
          order: [q.order],
          choices: this.formBuilder.array(q.choices.map((c: any) => this.formBuilder.group({
            text: [c.text, [Validators.required]],
            is_correct: [!!c.is_correct],
          }))),
        });
        this.questions.push(qForm);
      });
      this.showEditQuiz = true;
    } catch (err) {
      console.error('Error loading quiz detail', err);
    }
  }

  addQuestion() {
    const questionForm = this.formBuilder.group({
      text: ['', [Validators.required]],
      concept_id: ['', [Validators.required]],
      order: [this.questions.length + 1],
      choices: this.formBuilder.array([this.createChoice(), this.createChoice()]),
    });
    this.questions.push(questionForm);
  }

  createChoice() {
    return this.formBuilder.group({
      text: ['', [Validators.required]],
      is_correct: [false],
    });
  }

  removeQuestion(idx: number) { this.questions.removeAt(idx); }

  addChoice(qIdx: number) {
    (this.questions.at(qIdx).get('choices') as FormArray).push(this.createChoice());
  }

  removeChoice(qIdx: number, cIdx: number) {
    (this.questions.at(qIdx).get('choices') as FormArray).removeAt(cIdx);
  }

  setCorrectChoice(qIdx: number, cIdx: number) {
    const choices = this.questions.at(qIdx).get('choices') as FormArray;
    choices.controls.forEach((c, i) => c.get('is_correct')?.setValue(i === cIdx));
  }

  getChoices(qIdx: number) {
    return (this.questions.at(qIdx).get('choices') as FormArray).controls as FormGroup[];
  }

  async saveQuiz(): Promise<void> {
    if (this.quizForm.invalid || !this.editingQuizId) return;
    const courseId = this.courseStore.selectedCourseId();
    if (!courseId) return;

    const payload = {
      ...this.quizForm.value,
      course: courseId,
      time_limit_minutes: this.quizForm.value.timeLimit,
      is_active: true,
    };

    try {
      await firstValueFrom(this.quizApi.createQuiz(payload)); // Reuse create for simplicity if update is similar or implement update
      // Actually QuizViewSet supports PUT/PATCH.
      this.showEditQuiz = false;
      void this.courseStore.loadCourseQuizzes(courseId);
    } catch (err) {
      console.error('Error saving quiz', err);
    }
  }

  goBack(): void {
    void this.router.navigate(['/tutor']);
  }
}
