import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { vi, Mock } from 'vitest';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { QuizApiService } from './quiz.api';
import {
  PaginatedResponse,
  QuizDetailResponse,
  QuizListResponse,
} from '../model/quiz.types';

describe('QuizApiService', () => {
  let service: QuizApiService;
  let djangoApiMock: { get: Mock };

  beforeEach(() => {
    djangoApiMock = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        QuizApiService,
        { provide: DjangoApiClient, useValue: djangoApiMock },
      ],
    });

    service = TestBed.inject(QuizApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get quizzes', async () => {
    const mockList: QuizListResponse[] = [
      {
        id: 1,
        title: 'Test Quiz',
        course: 10,
        time_limit_minutes: 30,
        is_active: true,
        question_count: 5,
      },
    ];

    const mockResponse: PaginatedResponse<QuizListResponse[]> = {
      count: 1,
      next: null,
      previous: null,
      results: mockList,
    };
    djangoApiMock.get.mockReturnValue(of(mockResponse));

    const quizzes = await firstValueFrom(service.getQuizzes());
    expect(quizzes).toEqual(mockList);
    expect(djangoApiMock.get).toHaveBeenCalledWith('/api/v1/quizzes/');
  });

  it('should get quiz details', async () => {
    const mockDetail: QuizDetailResponse = {
      id: 1,
      title: 'Test Quiz',
      description: 'Desc',
      course: 10,
      time_limit_minutes: 30,
      is_active: true,
      questions: [],
    };
    djangoApiMock.get.mockReturnValue(of(mockDetail));

    const detail = await firstValueFrom(service.getQuizDetail(1));
    expect(detail).toEqual(mockDetail);
    expect(djangoApiMock.get).toHaveBeenCalledWith('/api/v1/quizzes/1/');
  });
});
