import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ProctoringApiService } from '../../entities/proctoring/api/proctoring.api';
import {
  ProctoringEvent,
  ProctoringEventType,
} from '../../entities/proctoring/model/proctoring.types';

const FLUSH_INTERVAL_MS = 5000;
const SEVERITY_TABLE: Record<ProctoringEventType, number> = {
  tab_switched: 1.0,
  face_not_detected: 1.5,
  multiple_faces: 2.0,
};

/**
 * Wraps a quiz attempt with browser-side proctoring telemetry.
 *
 * Captures three event categories that the Django backend
 * (`POST /api/v1/proctoring/logs/`) understands today:
 *  - tab_switched: triggered by document.visibilitychange or window.blur.
 *  - multiple_faces / face_not_detected: stub hooks left for a future
 *    face-api.js integration. The component already sends them when
 *    requested via `reportFace*()` so the wiring is end-to-end.
 *
 * The buffer is flushed in bulk every FLUSH_INTERVAL_MS and on stop().
 */
interface BufferedEvent {
  event_type: ProctoringEventType;
  timestamp: string;
  severity_score: number;
}

@Component({
  selector: 'app-proctoring-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proctoring-monitor.component.html',
  styleUrl: './proctoring-monitor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProctoringMonitorComponent implements OnInit, OnDestroy {
  @Input() requireCamera: boolean = true;
  @Input() requireFullscreen: boolean = true;

  @ViewChild('preview') previewVideo?: ElementRef<HTMLVideoElement>;

  private readonly proctoringApi = inject(ProctoringApiService);

  readonly cameraStatus = signal<
    'idle' | 'requesting' | 'granted' | 'denied' | 'error'
  >('idle');
  readonly fullscreenActive = signal<boolean>(false);
  readonly tabSwitchCount = signal<number>(0);
  readonly fullscreenWarning = signal<boolean>(false);

  // Eventos sin attempt todavía (fase pre-submit). Se sellan al finalize().
  private buffer: BufferedEvent[] = [];
  // Eventos ya asociados a un attempt real, listos para POST.
  private dispatchQueue: ProctoringEvent[] = [];
  private attemptId: number | null = null;
  private mediaStream: MediaStream | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private fullscreenHandler: (() => void) | null = null;

  async ngOnInit(): Promise<void> {
    if (this.requireCamera) {
      await this.startCamera();
    }

    if (this.requireFullscreen) {
      await this.requestFullscreen();
    }

    this.attachVisibilityListeners();
    this.startFlushTimer();
  }

  ngOnDestroy(): void {
    void this.stop();
  }

  /**
   * External hook for a future face-api.js integration: report that no face
   * was detected during the current frame window.
   */
  reportFaceNotDetected(): void {
    this.queue('face_not_detected');
  }

  /**
   * External hook for a future face-api.js integration: report that more than
   * one face was simultaneously detected.
   */
  reportMultipleFaces(): void {
    this.queue('multiple_faces');
  }

  /**
   * Once the parent receives an `attempt.id` from `POST /attempts/`, it must
   * call this to seal the buffered events with that ID and flush them to the
   * backend. Subsequent events also use this ID.
   */
  async finalize(attemptId: number): Promise<void> {
    this.attemptId = attemptId;
    this.dispatchQueue.push(
      ...this.buffer.map<ProctoringEvent>((b) => ({
        attempt: attemptId,
        event_type: b.event_type,
        timestamp: b.timestamp,
        severity_score: b.severity_score,
      })),
    );
    this.buffer = [];
    await this.flush();
  }

  async stop(): Promise<void> {
    this.detachVisibilityListeners();
    this.stopFlushTimer();
    this.stopCamera();
    await this.exitFullscreen();
    if (this.attemptId !== null) {
      await this.flush();
    }
    // Si no se llamó finalize(), los buffered se descartan en silencio
    // — sin attempt válido el backend rechazaría con 400/FK constraint.
  }

  private async startCamera(): Promise<void> {
    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraStatus.set('error');
      return;
    }

    this.cameraStatus.set('requesting');
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      this.cameraStatus.set('granted');
      // The video element may not be available yet; assign on next tick.
      setTimeout(() => {
        if (this.previewVideo && this.mediaStream) {
          this.previewVideo.nativeElement.srcObject = this.mediaStream;
          void this.previewVideo.nativeElement.play().catch(() => {
            // Autoplay may be blocked; preview-only, no impact on telemetry.
          });
        }
      }, 0);
    } catch {
      this.cameraStatus.set('denied');
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.cameraStatus.set('idle');
  }

  private async requestFullscreen(): Promise<void> {
    try {
      const target = document.documentElement;
      if (target.requestFullscreen) {
        await target.requestFullscreen();
        this.fullscreenActive.set(true);
      }
    } catch {
      // Browser denied — proctor still records tab switches.
    }
  }

  private async exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Best-effort.
    }
    this.fullscreenActive.set(false);
  }

  private attachVisibilityListeners(): void {
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.queue('tab_switched');
        this.tabSwitchCount.update((v) => v + 1);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.blurHandler = () => {
      this.queue('tab_switched');
      this.tabSwitchCount.update((v) => v + 1);
    };
    window.addEventListener('blur', this.blurHandler);

    this.fullscreenHandler = () => {
      const active = !!document.fullscreenElement;
      this.fullscreenActive.set(active);
      if (!active && this.requireFullscreen) {
        this.fullscreenWarning.set(true);
        this.queue('tab_switched');
      } else {
        this.fullscreenWarning.set(false);
      }
    };
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
  }

  private detachVisibilityListeners(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
      this.blurHandler = null;
    }
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
      this.fullscreenHandler = null;
    }
  }

  private queue(eventType: ProctoringEventType): void {
    const evt: BufferedEvent = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      severity_score: SEVERITY_TABLE[eventType],
    };
    if (this.attemptId !== null) {
      this.dispatchQueue.push({ attempt: this.attemptId, ...evt });
    } else {
      this.buffer.push(evt);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async flush(): Promise<void> {
    if (this.dispatchQueue.length === 0 || this.attemptId === null) {
      return;
    }
    const events = this.dispatchQueue.splice(0, this.dispatchQueue.length);
    try {
      await firstValueFrom(this.proctoringApi.ingestEvents({ events }));
    } catch {
      // On failure, re-queue to retry on the next tick.
      this.dispatchQueue.unshift(...events);
    }
  }
}
