import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Perfil } from '../../../core/models/domain.models';
import { filtrarUsuarios, puedeAlternarEstado, siguienteEstadoCuenta } from './users-admin.util';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Usuarios" descripcion="Listado de cuentas registradas y su estado." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }
      <div class="card card-body">
        <form class="grid gap-4 md:grid-cols-4" [formGroup]="filtros">
          <div class="md:col-span-2"><label class="label" for="busqueda">Búsqueda</label><input id="busqueda" class="input" formControlName="busqueda" placeholder="Nombre o correo" /></div>
          <div><label class="label" for="rol">Rol</label><select id="rol" class="select" formControlName="rol"><option value="">Todos</option><option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="administrador">Administrador</option></select></div>
          <div class="flex items-end justify-between gap-3">
            <span class="text-sm text-marine-500">{{ filtrados().length }} de {{ usuarios().length }} usuario(s)</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </form>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filtrados().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>XP</th><th>Creado</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (u of filtrados(); track u.id) {
                <tr>
                  <td class="font-medium text-marine-800">
                    <div class="flex items-center gap-3">
                      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700" aria-hidden="true">{{ iniciales(u) }}</span>
                      <span class="min-w-0 truncate">{{ nombre(u) }}</span>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.rol }}</td>
                  <td><app-status-badge [estado]="u.estado_cuenta" /></td>
                  <td>{{ u.xp }}</td>
                  <td>{{ u.creado_en | date: 'mediumDate' }}</td>
                  <td>
                    @if (u.id === auth.usuario()?.id) {
                      <span class="text-xs text-marine-400">Tu cuenta</span>
                    } @else if (u.rol === 'administrador') {
                      <span class="text-xs text-marine-400">Administrador</span>
                    } @else if (u.estado_cuenta === 'eliminado') {
                      <span class="text-xs text-marine-400">Eliminada</span>
                    } @else {
                      <button type="button"
                              class="btn btn-sm"
                              [class.btn-danger]="u.estado_cuenta === 'activo'"
                              [class.btn-outline]="u.estado_cuenta !== 'activo'"
                              [disabled]="procesando() === u.id"
                              (click)="alternarEstado(u)">
                        @if (u.estado_cuenta === 'activo') {
                          {{ confirmando() === u.id ? '¿Confirmar suspensión?' : 'Suspender' }}
                        } @else if (u.estado_cuenta === 'suspendido') {
                          Reactivar
                        } @else {
                          Activar
                        }
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Suspender una cuenta bloquea su acceso (la confirmación es de doble clic). Los administradores y tu propia cuenta no se pueden modificar desde aquí. Cambios de rol, y otros cambios sensibles, pueden requerir validación adicional en backend/RLS.</p>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarios = signal<Perfil[]>([]);
  protected readonly procesando = signal<string | null>(null);
  protected readonly confirmando = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly filtros = this.fb.nonNullable.group({ busqueda: [''], rol: [''] });
  private readonly cambiosFiltros = toSignal(this.filtros.valueChanges, {
    initialValue: this.filtros.getRawValue(),
  });
  protected readonly filtrados = computed(() => {
    const { busqueda, rol } = this.cambiosFiltros();
    return filtrarUsuarios(this.usuarios(), busqueda ?? '', rol ?? '');
  });

  ngOnInit(): void { void this.cargar(); }
  protected nombre(u: Perfil): string { return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email; }
  protected iniciales(u: Perfil): string {
    const partes = [u.nombre, u.apellido].filter(Boolean);
    const base = partes.length ? partes.map((p) => p[0]?.toUpperCase() ?? '').join('') : (u.email?.[0]?.toUpperCase() ?? '?');
    return base.slice(0, 2);
  }
  protected limpiarFiltros(): void { this.filtros.reset({ busqueda: '', rol: '' }); this.confirmando.set(null); }
  protected async alternarEstado(u: Perfil): Promise<void> {
    const propio = this.auth.usuario()?.id ?? '';
    if (!puedeAlternarEstado(u, propio, u.id)) {
      this.exito.set(false);
      this.mensaje.set('No puedes suspender/reactivar esta cuenta.');
      return;
    }
    const siguiente = siguienteEstadoCuenta(u.estado_cuenta);
    if (siguiente === 'suspendido' && this.confirmando() !== u.id) {
      this.confirmando.set(u.id);
      return;
    }
    this.confirmando.set(null);
    this.procesando.set(u.id);
    this.mensaje.set('');
    this.exito.set(false);
    try {
      const res = await this.adminService.cambiarEstadoCuenta(u.id, siguiente);
      this.exito.set(res.ok);
      this.mensaje.set(res.mensaje);
      if (res.ok) await this.cargar();
    } catch (e) {
      this.exito.set(false);
      this.mensaje.set(e instanceof Error ? e.message : 'No se pudo actualizar el estado.');
    } finally {
      this.procesando.set(null);
    }
  }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.usuarios.set(await this.adminService.listarUsuarios({ limite: 500 })); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.'); }
    finally { this.cargando.set(false); }
  }
}
