import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Slider } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { UserApiService } from '../../../entities/user/api/user.api';
import { VarkOnboardingRequest } from '../../../entities/user/model/user.types';
import { backendToAxiomVark } from '../../../shared/lib/vark/vark.utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-onboarding-modal',
  imports: [Dialog, Button, Slider, FormsModule],
  templateUrl: './onboarding-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingModalComponent {
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  readonly userApi = inject(UserApiService);

  readonly visible = computed(() => {
    // Si el usuario esta logeado, tiene ID, pero NO tiene un VARK guardado, forzamos el Modal.
    return !!this.sessionStore.userId() && !this.sessionStore.dominantVark();
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  // Scores de 0 a 10 para cada modalidad
  visualScore = 5;
  auralScore = 5;
  readWriteScore = 5;
  kinestheticScore = 5;

  async submitAnswers(): Promise<void> {
    if (!this.sessionStore.userId()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: VarkOnboardingRequest = {
      answers: [
        { category: 'visual', value: this.visualScore },
        { category: 'aural', value: this.auralScore },
        { category: 'read_write', value: this.readWriteScore },
        { category: 'kinesthetic', value: this.kinestheticScore },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.userApi.submitVarkOnboarding(this.sessionStore.userId()!, payload),
      );

      // Guardamos en el Store para cerrar permanentemente el Modal y actualizar el Dashboard
      const mappedVark = backendToAxiomVark(response.vark_dominant);
      this.sessionStore.setDominantVark(mappedVark);
    } catch {
      this.errorMessage.set(
        'Ocurrió un error guardando tu perfil. Por favor, intenta de nuevo.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
