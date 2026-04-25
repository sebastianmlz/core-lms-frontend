export interface CertificateGenerationResponse {
  certificate_hash: string;
  issued_at: string;
  course_id: number;
  student_id: number;
}

export interface CertificateVerifyResponse {
  is_valid: boolean;
  hash: string;
  issued_at: string;
  student_name: string;
  course_name: string;
}
