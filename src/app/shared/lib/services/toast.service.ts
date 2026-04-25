import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * GlobalToastService — thin wrapper around PrimeNG MessageService.
 * Provides a single, consistent API for firing toast notifications
 * from stores, services, or components.
 *
 * Prerequisites: `MessageService` must be in `providers` of app.config.ts
 * and a `<p-toast>` must be placed in AppShellComponent.
 */
@Injectable({ providedIn: 'root' })
export class GlobalToastService {
  private readonly msg = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.msg.add({ severity: 'success', summary, detail, life: 4000 });
  }

  error(summary: string, detail?: string): void {
    this.msg.add({ severity: 'error', summary, detail, life: 6000 });
  }

  info(summary: string, detail?: string): void {
    this.msg.add({ severity: 'info', summary, detail, life: 4000 });
  }

  warn(summary: string, detail?: string): void {
    this.msg.add({ severity: 'warn', summary, detail, life: 5000 });
  }
}
