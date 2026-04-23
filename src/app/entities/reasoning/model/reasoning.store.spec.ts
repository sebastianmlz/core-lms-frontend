import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AttemptApiService } from '../../assessment/api/attempt.api';
import { ReasoningApiService } from '../api/reasoning.api';
import { ReasoningStore } from './reasoning.store';

describe('ReasoningStore', () => {
  it('should generate adaptive plan and update state', async () => {
    const reasoningApiMock = {
      generateAdaptivePlan: vi.fn().mockReturnValue(
        of({
          student_id: 's1',
          course_id: 'c1',
          items: [
            {
              topic: 'Polymorphism',
              priority: 1,
              prerequisite_chain: ['Inheritance'],
              explanation: 'Essential concept',
              resources: [],
            },
          ],
          _meta: {
            subgraph_tuples: 2,
            topics_processed: 1,
            items_generated: 1,
            items_after_validation: 1,
            llm_latency_ms: 10,
            total_latency_ms: 12,
          },
        }),
      ),
      getCognitiveGraph: vi.fn().mockReturnValue(
        of({
          student_id: 's1',
          nodes: [
            { id: 'Polymorphism', label: 'Polymorphism', status: 'failed' },
          ],
          edges: [],
        }),
      ),
    };

    const attemptApiMock = {
      submitAttempt: vi.fn(),
      getAttempt: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReasoningStore,
        { provide: ReasoningApiService, useValue: reasoningApiMock },
        { provide: AttemptApiService, useValue: attemptApiMock },
      ],
    });

    const store = TestBed.inject(ReasoningStore);

    await store.generateAdaptivePlan({
      studentId: 's1',
      courseId: 'c1',
      failedTopics: ['Polymorphism'],
      varkProfile: 'aural',
    });

    await store.loadCognitiveGraph('s1', ['Polymorphism']);

    expect(store.planItemsCount()).toBe(1);
    expect(store.graphNodeCount()).toBe(1);
    expect(store.diagnosticStatus()).toBe('success');
    expect(store.error()).toBeNull();
  });

  it('should run diagnostic from attempt and persist success state', async () => {
    const reasoningApiMock = {
      generateAdaptivePlan: vi.fn(),
      getCognitiveGraph: vi.fn(),
    };

    const attemptApiMock = {
      submitAttempt: vi.fn().mockReturnValue(
        of({
          id: 19,
          student: 7,
          quiz: 3,
          start_time: '2026-04-23T00:00:00Z',
          end_time: '2026-04-23T00:05:00Z',
          final_score: '3.00',
          is_submitted: true,
          adaptive_plan: {
            student_id: '7',
            course_id: 'C-101',
            items: [
              {
                topic: 'Recursion',
                priority: 1,
                prerequisite_chain: ['Functions'],
                explanation: 'Practice decomposition.',
                resources: [],
              },
            ],
            _meta: {
              subgraph_tuples: 2,
              topics_processed: 1,
              items_generated: 1,
              items_after_validation: 1,
              llm_latency_ms: 12,
              total_latency_ms: 15,
            },
          },
          score: 3,
          max_score: 5,
          failed_concepts: ['Recursion'],
          evaluation_id: 77,
        }),
      ),
      getAttempt: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReasoningStore,
        { provide: ReasoningApiService, useValue: reasoningApiMock },
        { provide: AttemptApiService, useValue: attemptApiMock },
      ],
    });

    const store = TestBed.inject(ReasoningStore);

    await store.runDiagnosticFromAttempt({
      quizId: 3,
      studentId: 7,
      answers: [{ question_id: 1, selected_choice_id: 2 }],
    });

    expect(store.diagnosticStatus()).toBe('success');
    expect(store.lastAttemptId()).toBe(19);
    expect(store.planItemsCount()).toBe(1);
    expect(store.error()).toBeNull();
  });

  it('should set fallback status when attempt returns fallback envelope', async () => {
    const reasoningApiMock = {
      generateAdaptivePlan: vi.fn(),
      getCognitiveGraph: vi.fn(),
    };

    const attemptApiMock = {
      submitAttempt: vi.fn().mockReturnValue(
        of({
          id: 21,
          student: 7,
          quiz: 4,
          start_time: '2026-04-23T00:00:00Z',
          end_time: '2026-04-23T00:06:00Z',
          final_score: '2.00',
          is_submitted: true,
          adaptive_plan: {
            plan: [],
            fallback: true,
          },
        }),
      ),
      getAttempt: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReasoningStore,
        { provide: ReasoningApiService, useValue: reasoningApiMock },
        { provide: AttemptApiService, useValue: attemptApiMock },
      ],
    });

    const store = TestBed.inject(ReasoningStore);

    await store.runDiagnosticFromAttempt({
      quizId: 4,
      studentId: 7,
      answers: [{ question_id: 5, selected_choice_id: 9 }],
    });

    expect(store.diagnosticStatus()).toBe('fallback');
    expect(store.fallbackReason()).toContain('fallback');
    expect(store.adaptivePlan()).toBeNull();
  });

  it('should move to pending when attempt returns job_id', async () => {
    const reasoningApiMock = {
      generateAdaptivePlan: vi.fn(),
      getCognitiveGraph: vi.fn(),
    };

    const attemptApiMock = {
      submitAttempt: vi.fn().mockReturnValue(
        of({
          id: 33,
          student: 9,
          quiz: 10,
          start_time: '2026-04-23T00:00:00Z',
          end_time: null,
          final_score: null,
          is_submitted: true,
          adaptive_plan: null,
          job_id: 'job-33',
        }),
      ),
      getAttempt: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReasoningStore,
        { provide: ReasoningApiService, useValue: reasoningApiMock },
        { provide: AttemptApiService, useValue: attemptApiMock },
      ],
    });

    const store = TestBed.inject(ReasoningStore);

    await store.runDiagnosticFromAttempt({
      quizId: 10,
      studentId: 9,
      answers: [{ question_id: 11, selected_choice_id: 12 }],
    });

    expect(store.diagnosticMode()).toBe('async');
    expect(store.diagnosticStatus()).toBe('pending');
    expect(store.jobId()).toBe('job-33');
    expect(store.lastAttemptId()).toBe(33);
  });
});
