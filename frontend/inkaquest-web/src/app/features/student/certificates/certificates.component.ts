// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CertificateService } from '../../../core/services/certificate.service';
import { Certificado } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-student-certificates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Mis certificados" descripcion="Certificados emitidos por la plataforma. La emisión se realiza desde el backend cuando cumples los requisitos." />

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="certificados().length === 0"
        tituloVacio="Aún no tienes certificados"
        descripcionVacia="Completa los cursos y requisitos correspondientes. La emisión y entrega del certificado la gestiona el sistema."
        (alReintentar)="cargar()"
      >
        <div contenido class="grid gap-4 sm:grid-cols-2">
          @for (c of certificados(); track c.id) {
            <article class="card card-body">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs text-marine-400">Código</p>
                  <p class="font-mono text-sm font-semibold text-marine-800">{{ c.codigo }}</p>
                </div>
                <app-status-badge [estado]="c.estado" />
              </div>
              <p class="mt-3 text-sm text-marine-600">Emitido: {{ c.emitido_en | date: 'mediumDate' }}</p>
              @if (c.url_documento) {
                <a [href]="c.url_documento" target="_blank" rel="noopener" class="link mt-2 inline-block text-sm">Ver documento</a>
              }
              <a [routerLink]="['/verificar-certificado', c.codigo]" class="link mt-2 inline-block text-sm">Verificar en la plataforma</a>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La descarga de PDF o emision manual depende de endpoints del backend (pendiente). Consulta docs/frontend-pendientes.md.</p>
    </section>
  `,
})
export class CertificatesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly certificateService = inject(CertificateService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly certificados = signal<Certificado[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      this.certificados.set(await this.certificateService.listarCertificados(user.id));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los certificados.');
    } finally { this.cargando.set(false); }
  }
}
