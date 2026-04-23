import { ChangeDetectionStrategy, Component, effect, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { Select } from 'primeng/select';
import { RadioButton } from 'primeng/radiobutton';
import { Timeline } from 'primeng/timeline';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { interval } from 'rxjs';
import {
  AttemptAnswerInput,
  AttemptSubmitInput,
} from '../../../entities/assessment/model/attempt.types';
import { QuizStore, QuizStoreType } from '../../../entities/assessment/model/quiz.store';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CourseStore,
  CourseStoreType,
} from '../../../entities/course/model/course.store';
import {
  ReasoningStore,
  ReasoningStoreType,
} from '../../../entities/reasoning/model/reasoning.store';
import { AdaptivePlanItem } from '../../../entities/reasoning/model/reasoning.types';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { extractJwtPayload } from '../../../shared/lib/auth/jwt.utils';

@Component({
  selector: 'app-adaptive-plan-form',
  imports: [ReactiveFormsModule, FormsModule, Button, ProgressSpinnerModule, SkeletonModule, Select, RadioButton, Timeline, TreeTableModule],
  templateUrl: './adaptive-plan-form.component.html',
  styleUrl: './adaptive-plan-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptivePlanFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly reasoningStore = inject(ReasoningStore) as ReasoningStoreType;
  readonly courseStore = inject(CourseStore) as CourseStoreType;
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  readonly quizStore = inject(QuizStore) as QuizStoreType;

  parseError: string | null = null;
  selectedAnswers = signal<Record<number, number>>({});

  readonly form = this.formBuilder.group({
    studentId: this.formBuilder.nonNullable.control('', [Validators.required]),
    quizId: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  cognitiveTreeNodes = computed<TreeNode[]>(() => {
    const graph = this.reasoningStore.cognitiveGraph();
    if (!graph) return [];

    const nodeMap = new Map<string, TreeNode>();
    
    graph.nodes.forEach(n => {
      nodeMap.set(n.id, {
        data: { id: n.id, name: n.label, status: n.status },
        expanded: true,
        children: []
      });
    });

    const roots: TreeNode[] = [];
    const childIds = new Set<string>();

    graph.edges.forEach(edge => {
      // source dependends on target? then target is parent of source?
      // For cognitive graph, typically source -> target means target is prerequisite
      const parent = nodeMap.get(edge.target);
      const child = nodeMap.get(edge.source);
      if (parent && child) {
        if (!parent.children) parent.children = [];
        parent.children.push(child);
        childIds.add(edge.source);
      }
    });

    graph.nodes.forEach(n => {
      if (!childIds.has(n.id)) {
        const rootNode = nodeMap.get(n.id);
        if (rootNode) roots.push(rootNode);
      }
    });

    return roots.length > 0 ? roots : Array.from(nodeMap.values());
  });

  constructor() {
    effect(() => {
      void this.quizStore.loadQuizzes();
    });
    effect(() => {
      const token = this.sessionStore.accessToken();
      const userId = this.extractUserIdFromToken(token);

      if (!userId) {
        return;
      }

      const studentControl = this.form.controls.studentId;
      if (!studentControl.value) {
        studentControl.setValue(String(userId));
      }
    });

    // (Removed Teacher loadCourseDashboard effect from Student view to prevent 403 Forbidden)

    const quizIdSignal = toSignal(this.form.controls.quizId.valueChanges, { 
      initialValue: this.form.controls.quizId.value 
    });

    effect(() => {
      const quizId = quizIdSignal();
      if (quizId) {
        void this.quizStore.loadQuizDetail(quizId);
        this.selectedAnswers.set({});
      } else {
        this.quizStore.clearQuizDetail();
      }
    });

    // Auto Long-Polling para asincronia
    effect((onCleanup) => {
      const status = this.reasoningStore.diagnosticStatus();
      if (status === 'pending' || status === 'fallback') {
        const sub = interval(4000).subscribe(() => {
          void this.refreshAttemptStatus(true);
        });

        onCleanup(() => {
          sub.unsubscribe();
        });
      }
    });

    effect(() => {
      const plan = this.reasoningStore.adaptivePlan();
      const studentIdStr = this.form.controls.studentId.value;
      const graph = this.reasoningStore.cognitiveGraph();
      const isLoading = this.reasoningStore.isLoadingGraph();

      if (plan && !graph && !isLoading && studentIdStr) {
        const topics = plan.items.map(i => i.topic);
        if (topics.length > 0) {
          void this.reasoningStore.loadCognitiveGraph(studentIdStr, topics);
        }
      }
    });
  }

  onAnswerSelected(questionId: number, choiceId: number): void {
    this.selectedAnswers.update((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  isUiSubmitDisabled(): boolean {
    if (this.reasoningStore.isLoadingPlan()) {
      return true;
    }
    const detail = this.quizStore.selectedQuizDetail();
    if (!detail) {
      return true;
    }
    const answers = this.selectedAnswers();
    return detail.questions.some((q) => answers[q.id] === undefined);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.reasoningStore.isLoadingPlan()) {
      this.form.markAllAsTouched();
      return;
    }

    this.parseError = null;

    const studentId = Number(this.form.controls.studentId.value);
    const quizId = this.form.controls.quizId.value;
    
    const selected = this.selectedAnswers();
    const answers: AttemptAnswerInput[] = Object.entries(selected).map(([qId, cId]) => ({
      question_id: Number(qId),
      selected_choice_id: cId,
    }));

    if (!Number.isInteger(studentId) || studentId <= 0) {
      this.parseError = 'Student ID debe ser un entero positivo.';
      return;
    }

    if (typeof quizId !== 'number' || !Number.isInteger(quizId) || quizId <= 0) {
      this.parseError = 'Quiz ID debe ser un entero positivo.';
      return;
    }

    if (answers.length === 0) {
      this.parseError = 'Debe seleccionar al menos una respuesta válida.';
      return;
    }

    const payload: AttemptSubmitInput = {
      studentId,
      quizId,
      answers,
    };

    await this.reasoningStore.runDiagnosticFromAttempt(payload);
  }

  async refreshAttemptStatus(silent = false): Promise<void> {
    const attemptId = this.reasoningStore.lastAttemptId();

    if (!attemptId || this.reasoningStore.isLoadingPlan()) {
      return;
    }

    await this.reasoningStore.refreshAttemptResult(attemptId, { silent });
  }

  trackByTopic(index: number, item: AdaptivePlanItem): string {
    return `${item.topic}-${index}`;
  }

  private extractUserIdFromToken(accessToken: string | null): number | null {
    if (!accessToken) {
      return null;
    }

    const payload = extractJwtPayload(accessToken);
    const rawUserId = payload?.['user_id'];

    if (typeof rawUserId === 'number' && Number.isInteger(rawUserId) && rawUserId > 0) {
      return rawUserId;
    }

    if (typeof rawUserId === 'string') {
      const parsed = Number(rawUserId);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

}
