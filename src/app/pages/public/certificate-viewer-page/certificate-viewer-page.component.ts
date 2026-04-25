import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { CertificateStore, CertificateStoreType } from '../../../entities/certificate/model/certificate.store';

@Component({
  selector: 'app-certificate-viewer-page',
  imports: [CommonModule, Button],
  templateUrl: './certificate-viewer-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateViewerPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly certificateStore = inject(CertificateStore) as CertificateStoreType;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const hash = params.get('hash');
      if (hash) {
        void this.certificateStore.verify(hash);
      }
    });
  }

  printCertificate(): void {
    window.print();
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
