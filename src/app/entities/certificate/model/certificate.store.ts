import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CertificateApiService } from '../api/certificate.api';
import { firstValueFrom } from 'rxjs';
import { CertificateVerifyResponse } from './certificate.types';
import { HttpErrorResponse } from '@angular/common/http';
import { GlobalToastService } from '../../../shared/lib/services/toast.service';

interface CertificateState {
  isGenerating: boolean;
  isVerifying: boolean;
  verifiedCertificate: CertificateVerifyResponse | null;
  error: string | null;
}

const initialState: CertificateState = {
  isGenerating: false,
  isVerifying: false,
  verifiedCertificate: null,
  error: null,
};

export const CertificateStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, api = inject(CertificateApiService), toast = inject(GlobalToastService)) => ({
    async generate(courseId: number, studentId: number): Promise<string | null> {
      patchState(store, { isGenerating: true, error: null });
      try {
        const result = await firstValueFrom(api.generateCertificate(courseId, studentId));
        patchState(store, { isGenerating: false });
        toast.success('¡Certificado generado!', 'Redirigiendo a tu diploma digital...');
        return result.certificate_hash;
      } catch (e) {
        const error = e as HttpErrorResponse;
        const msg = error.status === 403
          ? 'Aún no cumples los requisitos de aprobación (60%).'
          : 'Ocurrió un error al generar el certificado.';
        patchState(store, { isGenerating: false, error: msg });
        toast.error('Error al generar certificado', msg);
        return null;
      }
    },

    async verify(hash: string): Promise<void> {
      patchState(store, { isVerifying: true, error: null, verifiedCertificate: null });
      try {
        const result = await firstValueFrom(api.verifyCertificate(hash));
        patchState(store, { isVerifying: false, verifiedCertificate: result });
      } catch {
        patchState(store, { isVerifying: false, error: 'Certificado inválido o no encontrado.' });
      }
    },

    clearState() {
      patchState(store, initialState);
    }
  }))
);

export type CertificateStoreType = InstanceType<typeof CertificateStore>;

