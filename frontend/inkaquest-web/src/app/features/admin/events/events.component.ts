import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { EventoGamificacion } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Eventos de gamificación" descripcion="Crea, edita y desactiva eventos (temporadas, misiones o eventos de progreso) para la gamificación." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }

      <div class="card card-body space-y-4">
        <h2 class="text-lg font-semibold text-marine-800">Crear evento</h2>
        <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-4" [formGroup]="form" (ngSubmit)="crear()">
          <div class="md:col-span-2 xl:col-span-1"><label class="label" for="nombre">Nombre</label><input id="nombre" class="input" formControlName="nombre" placeholder="Ej. Semana de código" /></div>
          <div class="xl:col-span-2"><label class="label" for="desc">Descripción (opcional)</label><input id="desc" class="input" formControlName="descripcion" placeholder="Desafíos, recompensas o reglas del evento" /></div>
          <div><label class="label" for="inicio">Inicio</label><input id="inicio" class="input" type="datetime-local" formControlName="fecha_inicio" /></div>
          <div><label class="label" for="fin">Fin</label><input id="fin" class="input" type="datetime-local" formControlName="fecha_fin" /></div>
          <label class="inline-flex items-center gap-2 text-sm text-marine-700 self-end"><input type="checkbox" formControlName="activo" /> Evento activo</label>
          <div class="md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-3">
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || guardando()">{{ guardando() ? 'Creando…' : 'Crear evento' }}</button>
            <p class="text-xs text-marine-500">La activación/entrega de recompensas se procesa por la plataforma según las reglas del evento.</p>
          </div>
        </form>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="eventos().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Evento</th><th>Inicio</th><th>Fin</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (e of eventos(); track e.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ e.nombre }}</td>
                  <td>{{ e.fecha_inicio ? (e.fecha_inicio | date: 'medium') : '—' }}</td>
                  <td>{{ e.fecha_fin ? (e.fecha_fin | date: 'medium') : '—' }}</td>
                  <td><span class="badge" [class.badge-success]="e.activo" [class.badge-default]="!e.activo">{{ e.activo ? 'Sí' : 'No' }}</span></td>
                  <td><button class="link text-sm" type="button" (click)="toggleActivo(e)" [disabled]="guardandoId() === e.id">{{ guardandoId() === e.id ? 'Guardando…' : (e.activo ? 'Desactivar' : 'Activar') }}</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class EventsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly guardandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly eventos = signal<EventoGamificacion[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    fecha_inicio: ['', Validators.required],
    fecha_fin: ['', Validators.required],
    activo: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.eventos.set(await this.adminService.listarEventosGamificacionAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los eventos.'); }
    finally { this.cargando.set(false); }
  }

  protected async crear(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (new Date(v.fecha_fin) < new Date(v.fecha_inicio)) { this.setMsg(false, 'La fecha de fin debe ser posterior al inicio.'); return; }
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const res = await this.adminService.crearEventoGamificacionAdmin({
        nombre: v.nombre.trim(),
        descripcion: v.descripcion?.trim() || null,
        fecha_inicio: new Date(v.fecha_inicio).toISOString(),
        fecha_fin: new Date(v.fecha_fin).toISOString(),
        activo: !!v.activo,
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) { this.form.reset({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', activo: true }); await this.cargar(); }
    } finally { this.guardando.set(false); }
  }

  protected async toggleActivo(e: EventoGamificacion): Promise<void> {
    this.guardandoId.set(e.id);
    try {
      const res = await this.adminService.actualizarEventoGamificacionAdmin(e.id, { activo: !e.activo });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) await this.cargar();
    } finally { this.guardandoId.set(null); }
  }
}
