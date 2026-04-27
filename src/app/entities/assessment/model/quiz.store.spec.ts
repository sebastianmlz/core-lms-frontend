import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, Mock } from 'vitest';
import { QuizApiService } from '../api/quiz.api';
import { QuizStore } from './quiz.store';
import { QuizDetailResponse, QuizListResponse } from './quiz.types';

describe('QuizStore', () => {
  let quizApiMock: { getQuizzes: Mock; getQuizDetail: Mock };

  beforeEach(() => {
    quizApiMock = {
      getQuizzes: vi.fn(),
      getQuizDetail: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        QuizStore,
        { provide: QuizApiService, useValue: quizApiMock },
      ],
    });
  });

  it('should initialize with default state', () => {
    const store = TestBed.inject(QuizStore);
    expect(store.quizzes()).toEqual([]);
    expect(store.selectedQuizDetail()).toBeNull();
    expect(store.isLoadingQuizzes()).toBeFalsy();
    expect(store.isLoadingDetail()).toBeFalsy();
    expect(store.error()).toBeNull();
  });

  it('should load quizzes successfully', async () => {
    const mockResponse: QuizListResponse[] = [
      { id: 1, title: 'Quiz 1' } as QuizListResponse,
    ];
    quizApiMock.getQuizzes.mockReturnValue(of(mockResponse));

    const store = TestBed.inject(QuizStore);
    await store.loadQuizzes();

    expect(store.quizzes()).toEqual(mockResponse);
    expect(store.isLoadingQuizzes()).toBeFalsy();
    expect(store.error()).toBeNull();
  });

  it('should handle error when loading quizzes', async () => {
    quizApiMock.getQuizzes.mockReturnValue(
      throwError(() => new Error('API Error')),
    );

    const store = TestBed.inject(QuizStore);
    await store.loadQuizzes();

    expect(store.quizzes()).toEqual([]);
    expect(store.isLoadingQuizzes()).toBeFalsy();
    expect(store.error()).toBe('Failed to load quizzes');
  });

  it('should load quiz detail successfully', async () => {
    const mockDetail: QuizDetailResponse = {
      id: 1,
      title: 'Quiz Details',
    } as QuizDetailResponse;
    quizApiMock.getQuizDetail.mockReturnValue(of(mockDetail));

    const store = TestBed.inject(QuizStore);
    await store.loadQuizDetail(1);

    expect(store.selectedQuizDetail()).toEqual(mockDetail);
    expect(store.isLoadingDetail()).toBeFalsy();
    expect(store.error()).toBeNull();
  });

  it('should handle error when loading quiz detail', async () => {
    quizApiMock.getQuizDetail.mockReturnValue(
      throwError(() => new Error('API Error')),
    );

    const store = TestBed.inject(QuizStore);
    await store.loadQuizDetail(1);

    expect(store.selectedQuizDetail()).toBeNull();
    expect(store.isLoadingDetail()).toBeFalsy();
    expect(store.error()).toBe('Failed to load quiz details');
  });

  it('should clear quiz detail', async () => {
    const mockDetail: QuizDetailResponse = {
      id: 1,
      title: 'Quiz Details',
    } as QuizDetailResponse;
    quizApiMock.getQuizDetail.mockReturnValue(of(mockDetail));

    const store = TestBed.inject(QuizStore);
    await store.loadQuizDetail(1); // Set it first

    store.clearQuizDetail();

    expect(store.selectedQuizDetail()).toBeNull();
    expect(store.error()).toBeNull();
  });
});
