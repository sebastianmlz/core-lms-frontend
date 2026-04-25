import { Injectable, inject } from '@angular/core';
import { DjangoApiClient } from '../../../shared/api/django-api.client';
import { Observable } from 'rxjs';
import { CertificateGenerationResponse, CertificateVerifyResponse } from '../model/certificate.types';

@Injectable({ providedIn: 'root' })
export class CertificateApiService {
  private readonly client = inject(DjangoApiClient);

  generateCertificate(courseId: number, studentId: number): Observable<CertificateGenerationResponse> {
    return this.client.post<CertificateGenerationResponse, { course_id: number; student_id: number }>(
      '/api/v1/certificates/generate/',
      { course_id: courseId, student_id: studentId }
    );
  }

  verifyCertificate(hash: string): Observable<CertificateVerifyResponse> {
    return this.client.get<CertificateVerifyResponse>(`/api/v1/certificates/verify/${hash}/`);
  }
}
