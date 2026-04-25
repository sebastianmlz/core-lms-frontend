import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { Dialog } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { CourseOverviewComponent } from '../../../features/course/course-overview/course-overview.component';
import { CognitiveShadowComponent } from '../../../features/reasoning/cognitive-shadow/cognitive-shadow.component';
import { QuizApiService } from '../../../entities/assessment/api/quiz.api';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';

@Component({
  selector: 'app-tutor-dashboard-page',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    MultiSelect,
    Dialog,
    InputNumberModule,
    CourseOverviewComponent,
    CognitiveShadowComponent,
  ],
  templateUrl: './tutor-dashboard-page.component.html',
  styleUrl: './tutor-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorDashboardPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  private readonly quizApi = inject(QuizApiService);
  private lastDashboardCourseId: number | null = null;

  showCreateQuiz = false;

  readonly quizForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: [''],
    timeLimit: [30, [Validators.required, Validators.min(1)]],
    questions: this.formBuilder.array([]),
  });

  get questions() {
    return this.quizForm.get('questions') as FormArray;
  }

  addQuestion() {
    const questionForm = this.formBuilder.group({
      text: ['', [Validators.required]],
      concept_id: ['', [Validators.required]],
      order: [this.questions.length + 1],
      choices: this.formBuilder.array([
        this.createChoice(),
        this.createChoice(),
      ]),
    });
    this.questions.push(questionForm);
  }

  createChoice() {
    return this.formBuilder.group({
      text: ['', [Validators.required]],
      is_correct: [false],
    });
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  addChoice(questionIndex: number) {
    const choices = this.questions.at(questionIndex).get('choices') as FormArray;
    choices.push(this.createChoice());
  }

  removeChoice(questionIndex: number, choiceIndex: number) {
    const choices = this.questions.at(questionIndex).get('choices') as FormArray;
    choices.removeAt(choiceIndex);
  }

  setCorrectChoice(questionIndex: number, choiceIndex: number) {
    const choices = this.questions.at(questionIndex).get('choices') as FormArray;
    choices.controls.forEach((control, i) => {
      control.get('is_correct')?.setValue(i === choiceIndex);
    });
  }

  getChoices(questionIndex: number) {
    const choices = this.questions.at(questionIndex).get('choices') as FormArray;
    return choices.controls as FormGroup[];
  }

  readonly graphForm = this.formBuilder.nonNullable.group({
    studentId: ['', [Validators.required]],
    topics: [<string[]>[], [Validators.required]],
    targetTopic: [''],
  });

  constructor() {
    effect(() => {
      const dashboard = this.courseStore.selectedCourseDashboard();
      console.log('[TutorDashboard] Dashboard data:', dashboard);
      
      if (!dashboard || dashboard.course_id === this.lastDashboardCourseId) {
        return;
      }
 
      this.lastDashboardCourseId = dashboard.course_id;
      const suggestedTopics = dashboard.top_failed_concepts.map((topic) => topic.concept_id);
      this.graphForm.patchValue({ topics: suggestedTopics });
    });
  }

  useSuggestedTopics(): void {
    const dashboard = this.courseStore.selectedCourseDashboard();
    if (!dashboard) {
      return;
    }

    const suggestedTopics = dashboard.top_failed_concepts.map((topic) => topic.concept_id);
    this.graphForm.patchValue({ topics: suggestedTopics });
  }

  async loadGraph(): Promise<void> {
    if (this.graphForm.invalid || this.reasoningStore.isLoadingGraph()) {
      this.graphForm.markAllAsTouched();
      return;
    }

    const topics = this.graphForm.controls.topics.value;
    const target = this.graphForm.controls.targetTopic.value || undefined;
    await this.reasoningStore.loadCognitiveGraph(this.graphForm.controls.studentId.value, topics, target);
  }
 
  async submitQuiz(): Promise<void> {
    const course = this.courseStore.selectedCourseDashboard();
    if (this.quizForm.invalid || !course) {
      this.quizForm.markAllAsTouched();
      return;
    }
 
    const payload = {
      course: course.course_id,
      title: this.quizForm.value.title,
      description: this.quizForm.value.description,
      time_limit_minutes: this.quizForm.value.timeLimit,
      is_active: true,
      questions: this.quizForm.value.questions?.map((q: any) => ({
        text: q.text,
        concept_id: q.concept_id,
        order: q.order,
        choices: q.choices.map((c: any) => ({
          text: c.text,
          is_correct: !!c.is_correct,
        })),
      })),
    };
 
    try {
      await firstValueFrom(this.quizApi.createQuiz(payload));
      this.showCreateQuiz = false;
      this.quizForm.reset({ timeLimit: 30 });
      this.questions.clear();
      void this.courseStore.loadCourseQuizzes(course.course_id);
    } catch (err) {
      console.error('Error creating quiz', err);
    }
  }
}
