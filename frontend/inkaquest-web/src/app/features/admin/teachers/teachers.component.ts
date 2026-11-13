import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Curso, DocenteCurso, Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface AsignacionView extends DocenteCurso {
  curso?: Curso;
  docente?: Perfil;
}

@Component({
  selector: 'app-admin-teachers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Docentes y asignación de cursos"
        descripcion="Gestiona docentes (incluye inactivos) y asígnales cursos. La visibilidad y gestión en el panel docente dependen de las asignaciones activas en docente_curso y de las políticas RLS."
        [acciones]="true"
      >
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }

      <div class="grid gap-4 sm:grid-cols-4">
        <app-stat-card etiqueta="Docentes (todos)" [valor]="docentes().length" tono="brand" />
        <app-stat-card etiqueta="Activos" [valor]="activos()" tono="info" />
        <app-stat-card etiqueta="Cursos" [valor]="cursos().length" tono="info" />
        <app-stat-card etiqueta="Asignaciones activas" [valor]="asignacionesActivas()" tono="gold" />
      </div>

      <!-- Asignar curso a docente -->
      <div class="card card-body space-y-4">
        <h2 class="text-lg font-semibold text-marine-800">Asignar docente a curso</h2>
        <p class="text-sm text-marine-600">Selecciona un docente y un curso. Se creará o reactivará la asignación (incluso si el docente está inactivo). El docente verá el curso en su panel cuando la asignación esté activa y tenga los permisos/RLS correspondientes.</p>
        <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-end" [formGroup]="formAsignacion" (ngSubmit)="asignar()">
          <div class="xl:col-span-2">
            <label class="label" for="docente">Docente</label>
            <select id="docente" class="select" formControlName="docenteId">
              <option value="">Selecciona un docente</option>
              @for (d of docentesOrdenados(); track d.id) {
                <option [value]="d.id">{{ nombre(d) }} · {{ d.email }} · {{ d.estado_cuenta }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="curso">Curso</label>
            <select id="curso" class="select" formControlName="cursoId">
              <option value="">Selecciona un curso</option>
              @for (c of cursos(); track c.id) {
                <option [value]="c.id">{{ c.titulo }} ({{ c.estado }})</option>
              }
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="esResponsable" /> Docente responsable</label>
            <button class="btn btn-primary" type="submit" [disabled]="formAsignacion.invalid || guardando()">{{ guardando() ? 'Asignando…' : 'Asignar curso' }}</button>
          </div>
        </form>
        @if (docentes().length === 0) {
          <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">No hay usuarios con rol docente. Aprueba una solicitud en <strong>Solicitudes docentes</strong> o asigna el rol desde la base de datos/backend autorizado.</p>
        }
      </div>

      <!-- Docentes -->
      <div class="card card-body space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-marine-800">Todos los docentes</h2>
          <div class="grid gap-3 sm:grid-cols-3">
            <input class="input" [value]="filtros.controls.busqueda.value" (input)="filtros.controls.busqueda.setValue($any($event.target).value)" placeholder="Buscar por nombre o correo" />
            <select class="select" [value]="filtros.controls.estado.value" (change)="filtros.controls.estado.setValue($any($event.target).value)">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="pendiente_verificacion">Pendiente verificación</option>
              <option value="suspendido">Suspendido</option>
              <option value="eliminado">Eliminado</option>
            </select>
            <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar filtros</button>
          </div>
        </div>
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="docentesFiltrados().length === 0" tituloVacio="Sin docentes" descripcionVacia="No se encontraron docentes con los filtros seleccionados." (alReintentar)="cargar()">
          <div contenido class="table-wrap">
            <table class="table">
              <thead><tr><th>Docente</th><th>Correo</th><th>Estado cuenta</th><th>Registro</th><th>Cursos asignados</th><th>Acción</th></tr></thead>
              <tbody>
                @for (d of docentesFiltrados(); track d.id) {
                  <tr [class.opacity-70]="d.estado_cuenta !== 'activo'">
                    <td class="font-medium text-marine-800">{{ nombre(d) }}</td>
                    <td>{{ d.email }}</td>
                    <td><app-status-badge [estado]="d.estado_cuenta" /></td>
                    <td>{{ d.creado_en | date: 'mediumDate' }}</td>
                    <td class="text-sm">{{ resumenAsignaciones(d.id) }}</td>
                    <td><button type="button" class="link text-sm" (click)="seleccionarDocente(d.id)">Seleccionar para asignar</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-data-panel>
      </div>

      <!-- Asignaciones -->
      <div class="card card-body space-y-4">
        <h2 class="text-lg font-semibold text-marine-800">Asignaciones docente-curso</h2>
        <app-data-panel [cargando]="cargando()" [error]="null" [vacio]="asignacionesView().length === 0" tituloVacio="Sin asignaciones" descripcionVacia="Aún no hay docentes asignados a cursos.">
          <div contenido class="table-wrap">
            <table class="table">
              <thead><tr><th>Docente</th><th>Curso</th><th>Responsable</th><th>Estado</th><th>Asignado en</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (a of asignacionesView(); track a.id) {
                  <tr>
                    <td>
                      <p class="font-medium text-marine-800">{{ a.docente ? nombre(a.docente) : a.docente_id }}</p>
                      <p class="text-xs text-marine-500">{{ a.docente?.email || '' }} @if (a.docente) { · {{ a.docente.estado_cuenta }} }</p>
                    </td>
                    <td>
                      <p class="font-medium text-marine-800">{{ a.curso?.titulo || a.curso_id }}</p>
                      <p class="text-xs text-marine-500">{{ a.curso?.estado || '' }}</p>
                    </td>
                    <td><span class="badge" [class.badge-success]="a.es_responsable" [class.badge-neutral]="!a.es_responsable">{{ a.es_responsable ? 'Sí' : 'No' }}</span></td>
                    <td><span class="badge" [class.badge-success]="a.activo" [class.badge-neutral]="!a.activo">{{ a.activo ? 'Activa' : 'Inactiva' }}</span></td>
                    <td class="text-sm text-marine-600">{{ a.asignado_en | date: 'medium' }}</td>
                    <td class="space-x-2 whitespace-nowrap">
                      <button type="button" class="link text-sm" (click)="toggleActiva(a)">{{ a.activo ? 'Desactivar' : 'Activar' }}</button>
                      <button type="button" class="link text-sm" (click)="toggleResponsable(a)">{{ a.es_responsable ? 'Quitar responsable' : 'Hacer responsable' }}</button>
                      <button type="button" class="link text-sm text-danger-600" (click)="eliminar(a)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-data-panel>
        <p class="text-xs text-marine-500">Las asignaciones activas determinan qué cursos aparecen en "Mis cursos" del docente. Un docente inactivo puede tener cursos asignados, pero su acceso general a la plataforma depende de su estado de cuenta y políticas de autenticación/RLS.</p>
      </div>
    </section>
  `,
})
export class TeachersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly docentes = signal<Perfil[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly asignaciones = signal<DocenteCurso[]>([]);

  protected readonly filtros = this.fb.nonNullable.group({ busqueda: [''], estado: [''] });
  protected readonly formAsignacion = this.fb.nonNullable.group({
    docenteId: ['', Validators.required],
    cursoId: ['', Validators.required],
    esResponsable: [true],
  });

  protected readonly docentesOrdenados = computed(() =>
    [...this.docentes()].sort((a, b) => this.nombre(a).localeCompare(this.nombre(b)))
  );

  protected readonly docentesFiltrados = computed(() => {
    const b = this.filtros.controls.busqueda.value.toLowerCase().trim();
    const e = this.filtros.controls.estado.value;
    return this.docentesOrdenados().filter(
      (u) => (!e || u.estado_cuenta === e) && (!b || `${u.nombre} ${u.apellido ?? ''} ${u.email}`.toLowerCase().includes(b))
    );
  });

  protected readonly activos = computed(() => this.docentes().filter((u) => u.estado_cuenta === 'activo').length);
  protected readonly asignacionesActivas = computed(() => this.asignaciones().filter((a) => a.activo).length);

  protected readonly asignacionesView = computed<AsignacionView[]>(() => {
    const cursos = new Map(this.cursos().map((c) => [c.id, c]));
    const docentes = new Map(this.docentes().map((d) => [d.id, d]));
    return this.asignaciones().map((a) => ({ ...a, curso: cursos.get(a.curso_id), docente: docentes.get(a.docente_id) }));
  });

  ngOnInit(): void { void this.cargar(); }

  protected nombre(u: Perfil): string { return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email; }
  protected limpiarFiltros(): void { this.filtros.reset({ busqueda: '', estado: '' }); }
  protected seleccionarDocente(id: string): void { this.formAsignacion.patchValue({ docenteId: id }); }

  protected resumenAsignaciones(docenteId: string): string {
    const asigs = this.asignaciones().filter((a) => a.docente_id === docenteId && a.activo);
    if (asigs.length === 0) return 'Sin cursos activos';
    const cursos = new Map(this.cursos().map((c) => [c.id, c.titulo]));
    const nombres = asigs.map((a) => cursos.get(a.curso_id) || a.curso_id.slice(0, 8) + '…');
    return nombres.slice(0, 2).join(', ') + (nombres.length > 2 ? ` (+${nombres.length - 2})` : '');
  }

  private setMensaje(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [docentes, cursos, asignaciones] = await Promise.all([
        this.adminService.listarUsuarios({ rol: 'docente', limite: 1000 }),
        this.adminService.listarTodosLosCursos(),
        this.adminService.listarAsignacionesDocenteCurso().catch(() => [] as DocenteCurso[]),
      ]);
      this.docentes.set(docentes);
      this.cursos.set(cursos);
      this.asignaciones.set(asignaciones);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los datos de docentes/asignaciones.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async asignar(): Promise<void> {
    if (this.formAsignacion.invalid) return;
    const admin = this.auth.usuario();
    const v = this.formAsignacion.getRawValue();
    this.guardando.set(true);
    try {
      const r = await this.adminService.asignarDocenteACurso({
        cursoId: v.cursoId,
        docenteId: v.docenteId,
        esResponsable: !!v.esResponsable,
        asignadoPor: admin?.id ?? null,
      });
      this.setMensaje(r.ok, r.mensaje);
      if (r.ok) {
        this.formAsignacion.patchValue({ cursoId: '' });
        await this.cargar();
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected async toggleActiva(a: DocenteCurso): Promise<void> {
    const r = await this.adminService.actualizarAsignacionDocenteCurso(a.id, { activo: !a.activo });
    this.setMensaje(r.ok, r.mensaje);
    if (r.ok) await this.cargar();
  }

  protected async toggleResponsable(a: DocenteCurso): Promise<void> {
    const r = await this.adminService.actualizarAsignacionDocenteCurso(a.id, { es_responsable: !a.es_responsable });
    this.setMensaje(r.ok, r.mensaje);
    if (r.ok) await this.cargar();
  }

  protected async eliminar(a: DocenteCurso): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar esta asignación docente-curso?')) return;
    const r = await this.adminService.eliminarAsignacionDocenteCurso(a.id);
    this.setMensaje(r.ok, r.mensaje);
    if (r.ok) await this.cargar();
  }
}
