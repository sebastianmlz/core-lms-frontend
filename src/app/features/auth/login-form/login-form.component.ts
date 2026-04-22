import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import {
  SessionStore,
  SessionStoreType,
} from '../../../entities/session/model/session.store';
import { UserRole } from '../../../entities/session/model/session.types';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, Button],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly sessionStore = inject(SessionStore) as SessionStoreType;

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    role: ['STUDENT' as UserRole, [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.sessionStore.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const success = await this.sessionStore.login({
      username: this.form.controls.username.value,
      password: this.form.controls.password.value,
      preferredRole: this.form.controls.role.value,
    });

    if (!success) {
      return;
    }

    const role = this.sessionStore.activeRole();
    const targetRoute = role === 'TUTOR' ? '/tutor' : '/student';
    await this.router.navigate([targetRoute]);
  }
}
