// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { Leccion } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-lessons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Lecciones" descripcion="Consulta administrativa de lecciones. Gestión de contenido/publicación avanzada requiere integración backend autorizada." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="lecciones().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Módulo</th><th>N°</th><th>Título</th><th>Tipo</th><th>Publicado</th><th>XP</th></tr></thead>
            <tbody>
              @for (l of lecciones(); track l.id) {
                <tr>
                  <td class="font-mono text-xs">{{ l.modulo_id.slice(0,8) }}…</td>
                  <td>{{ l.numero }}</td>
                  <td class="font-medium text-marine-800">{{ l.titulo }}</td>
                  <td>{{ l.tipo_contenido }}</td>
                  <td>{{ l.publicado ? 'Sí' : 'No' }}</td>
                  <td>{{ l.xp_otorgado }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class LessonsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly lecciones = signal<Leccion[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.lecciones.set(await this.adminService.listarLeccionesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las lecciones.'); }
    finally { this.cargando.set(false); }
  }
}
