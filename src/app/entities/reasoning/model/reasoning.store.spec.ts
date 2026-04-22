import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReasoningApiService } from '../api/reasoning.api';
import { ReasoningStore } from './reasoning.store';

describe('ReasoningStore', () => {
  it('should generate adaptive plan and update state', async () => {
    const apiMock = {
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

    TestBed.configureTestingModule({
      providers: [ReasoningStore, { provide: ReasoningApiService, useValue: apiMock }],
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
    expect(store.error()).toBeNull();
  });
});
