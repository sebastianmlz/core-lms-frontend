import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { SessionStore, SessionStoreType } from '../../entities/session/model/session.store';
import { UserRole } from '../../entities/session/model/session.types';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly sessionStore = inject(SessionStore) as SessionStoreType;

  setRole(role: UserRole): void {
    this.sessionStore.setActiveRole(role);
  }

  logout(): void {
    this.sessionStore.logout();
  }
}
