import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CourseStore } from '../../../entities/course/model/course.store';
import { ReasoningStore } from '../../../entities/reasoning/model/reasoning.store';
import { SessionStore } from '../../../entities/session/model/session.store';
import { QuizStore } from '../../../entities/assessment/model/quiz.store';
import { AdaptivePlanFormComponent } from './adaptive-plan-form.component';

describe('AdaptivePlanFormComponent', () => {
  it('should submit attempt payload when UI form answers are provided', async () => {
    const reasoningStoreMock = {
      isLoadingPlan: vi.fn(() => false),
      adaptivePlan: vi.fn(() => null),
      cognitiveGraph: vi.fn(() => null),
      isLoadingGraph: vi.fn(() => false),
      diagnosticStatus: vi.fn(() => 'idle'),
      jobId: vi.fn(() => null),
      lastAttemptId: vi.fn(() => null),
      fallbackReason: vi.fn(() => null),
      error: vi.fn(() => null),
      runDiagnosticFromAttempt: vi.fn().mockResolvedValue(undefined),
      refreshAttemptResult: vi.fn().mockResolvedValue(undefined),
      clearPlan: vi.fn(),
    };

    const courseStoreMock = {
      selectedCourse: vi.fn(() => null),
      selectedCourseDashboard: vi.fn(() => null),
      selectedCourseId: vi.fn(() => null),
      loadCourseDashboard: vi.fn().mockResolvedValue(undefined),
    };

    const sessionStoreMock = {
      accessToken: vi.fn(() => null),
    };

    const quizStoreMock = {
      quizzes: vi.fn(() => []),
      selectedQuizDetail: vi.fn(() => {
        return {
          id: 3,
          questions: [{ id: 1, text: 'Q1' }],
        };
      }),
      isLoadingQuizzes: vi.fn(() => false),
      isLoadingDetail: vi.fn(() => false),
      loadQuizzes: vi.fn().mockResolvedValue(undefined),
      loadQuizDetail: vi.fn().mockResolvedValue(undefined),
      clearQuizDetail: vi.fn(),
      error: vi.fn(() => null),
    };

    TestBed.configureTestingModule({
      imports: [AdaptivePlanFormComponent],
      providers: [
        { provide: ReasoningStore, useValue: reasoningStoreMock },
        { provide: CourseStore, useValue: courseStoreMock },
        { provide: SessionStore, useValue: sessionStoreMock },
        { provide: QuizStore, useValue: quizStoreMock },
      ],
    });

    const fixture = TestBed.createComponent(AdaptivePlanFormComponent);
    const component = fixture.componentInstance;

    component.form.controls.studentId.setValue('7');
    component.form.controls.quizId.setValue(3);
    component.selectedAnswers.set({ 1: 2 }); // format: { questionId: choiceId }

    await component.submit();

    expect(reasoningStoreMock.runDiagnosticFromAttempt).toHaveBeenCalledWith({
      studentId: 7,
      quizId: 3,
      answers: [{ question_id: 1, selected_choice_id: 2 }],
    });
    expect(component.parseError).toBeNull();
  });

  it('should not submit if answers are empty', async () => {
    const reasoningStoreMock = {
      isLoadingPlan: vi.fn(() => false),
      adaptivePlan: vi.fn(() => null),
      cognitiveGraph: vi.fn(() => null),
      isLoadingGraph: vi.fn(() => false),
      diagnosticStatus: vi.fn(() => 'idle'),
      jobId: vi.fn(() => null),
      lastAttemptId: vi.fn(() => null),
      fallbackReason: vi.fn(() => null),
      error: vi.fn(() => null),
      runDiagnosticFromAttempt: vi.fn().mockResolvedValue(undefined),
      refreshAttemptResult: vi.fn().mockResolvedValue(undefined),
      clearPlan: vi.fn(),
    };

    const courseStoreMock = {
      selectedCourse: vi.fn(() => null),
      selectedCourseDashboard: vi.fn(() => null),
      selectedCourseId: vi.fn(() => null),
      loadCourseDashboard: vi.fn().mockResolvedValue(undefined),
    };

    const sessionStoreMock = {
      accessToken: vi.fn(() => null),
    };

    const quizStoreMock = {
      quizzes: vi.fn(() => []),
      selectedQuizDetail: vi.fn(() => {
        return {
          id: 3,
          questions: [{ id: 1, text: 'Q1' }],
        };
      }),
      isLoadingQuizzes: vi.fn(() => false),
      isLoadingDetail: vi.fn(() => false),
      loadQuizzes: vi.fn().mockResolvedValue(undefined),
      loadQuizDetail: vi.fn().mockResolvedValue(undefined),
      clearQuizDetail: vi.fn(),
      error: vi.fn(() => null),
    };

    TestBed.configureTestingModule({
      imports: [AdaptivePlanFormComponent],
      providers: [
        { provide: ReasoningStore, useValue: reasoningStoreMock },
        { provide: CourseStore, useValue: courseStoreMock },
        { provide: SessionStore, useValue: sessionStoreMock },
        { provide: QuizStore, useValue: quizStoreMock },
      ],
    });

    const fixture = TestBed.createComponent(AdaptivePlanFormComponent);
    const component = fixture.componentInstance;

    component.form.controls.studentId.setValue('7');
    component.form.controls.quizId.setValue(3);
    component.selectedAnswers.set({}); // empty answers

    await component.submit();

    expect(reasoningStoreMock.runDiagnosticFromAttempt).not.toHaveBeenCalled();
    expect(component.parseError).toContain(
      'Debe seleccionar al menos una respuesta válida',
    );
  });
});
