import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import {
  CertificateStore,
  CertificateStoreType,
} from '../../../entities/certificate/model/certificate.store';

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

  @ViewChild('certificateContainer')
  certificateContainer?: ElementRef<HTMLElement>;

  readonly isExporting = signal<boolean>(false);

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

  /**
   * Captures the certificate DOM into a high-DPI canvas via html2canvas
   * and embeds it in a landscape A4 PDF via jsPDF. The dependencies are
   * dynamically imported so the visitor only pays the bundle cost when
   * they actually click "Descargar PDF".
   */
  async downloadPdf(): Promise<void> {
    const node = this.certificateContainer?.nativeElement;
    const cert = this.certificateStore.verifiedCertificate();
    if (!node || !cert) {
      return;
    }

    this.isExporting.set(true);
    try {
      const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const JsPdfCtor =
        (jsPdfModule as { jsPDF?: typeof import('jspdf').jsPDF }).jsPDF ??
        (jsPdfModule as { default: typeof import('jspdf').jsPDF }).default;

      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const pdf = new JsPdfCtor({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height,
      );
      const drawWidth = canvas.width * ratio;
      const drawHeight = canvas.height * ratio;
      const offsetX = (pageWidth - drawWidth) / 2;
      const offsetY = (pageHeight - drawHeight) / 2;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        offsetX,
        offsetY,
        drawWidth,
        drawHeight,
      );

      const safeStudent = cert.student_name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_');
      pdf.save(`certificado-${safeStudent || 'axiom'}.pdf`);
    } catch (error) {
      console.error('Error exporting certificate to PDF', error);
    } finally {
      this.isExporting.set(false);
    }
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
