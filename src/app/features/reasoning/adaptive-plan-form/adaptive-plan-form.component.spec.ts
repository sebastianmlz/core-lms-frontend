import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  CourseStore,
} from '../../../entities/course/model/course.store';
import {
  ReasoningStore,
} from '../../../entities/reasoning/model/reasoning.store';
import {
  SessionStore,
} from '../../../entities/session/model/session.store';
import { AdaptivePlanFormComponent } from './adaptive-plan-form.component';

describe('AdaptivePlanFormComponent', () => {
  it('should submit attempt payload when form values are valid', async () => {
    const reasoningStoreMock = {
      isLoadingPlan: vi.fn(() => false),
      adaptivePlan: vi.fn(() => null),
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

    TestBed.configureTestingModule({
      imports: [AdaptivePlanFormComponent],
      providers: [
        { provide: ReasoningStore, useValue: reasoningStoreMock },
        { provide: CourseStore, useValue: courseStoreMock },
        { provide: SessionStore, useValue: sessionStoreMock },
      ],
    });

    const fixture = TestBed.createComponent(AdaptivePlanFormComponent);
    const component = fixture.componentInstance;

    component.form.controls.studentId.setValue('7');
    component.form.controls.quizId.setValue(3);
    component.form.controls.answersJson.setValue('[{"question_id":1,"selected_choice_id":2}]');

    await component.submit();

    expect(reasoningStoreMock.runDiagnosticFromAttempt).toHaveBeenCalledWith({
      studentId: 7,
      quizId: 3,
      answers: [{ question_id: 1, selected_choice_id: 2 }],
    });
    expect(component.parseError).toBeNull();
  });

  it('should keep parse error when answers json is invalid', async () => {
    const reasoningStoreMock = {
      isLoadingPlan: vi.fn(() => false),
      adaptivePlan: vi.fn(() => null),
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

    TestBed.configureTestingModule({
      imports: [AdaptivePlanFormComponent],
      providers: [
        { provide: ReasoningStore, useValue: reasoningStoreMock },
        { provide: CourseStore, useValue: courseStoreMock },
        { provide: SessionStore, useValue: sessionStoreMock },
      ],
    });

    const fixture = TestBed.createComponent(AdaptivePlanFormComponent);
    const component = fixture.componentInstance;

    component.form.controls.studentId.setValue('7');
    component.form.controls.quizId.setValue(3);
    component.form.controls.answersJson.setValue('[{"question_id":"bad"}]');

    await component.submit();

    expect(reasoningStoreMock.runDiagnosticFromAttempt).not.toHaveBeenCalled();
    expect(component.parseError).toContain('Answers JSON invalido');
  });
});
