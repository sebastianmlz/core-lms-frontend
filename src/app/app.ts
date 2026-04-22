import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionStore, SessionStoreType } from './entities/session/model/session.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly sessionStore = inject(SessionStore) as SessionStoreType;

  constructor() {
    this.sessionStore.hydrate();
  }
}
