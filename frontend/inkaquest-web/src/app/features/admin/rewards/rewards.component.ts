import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { Insignia, Mision, Curso, EventoGamificacion } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-rewards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Recompensas y misiones" descripcion="Gestiona misiones de gamificación e insignias del catálogo: crea, edita y activa/desactiva recompensas." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }

      <div class="grid gap-4 sm:grid-cols-4">
        <div class="card card-body"><p class="text-xs text-marine-500">Misiones totales</p><p class="text-2xl font-extrabold text-marine-800">{{ misiones().length }}</p></div>
        <div class="card card-body"><p class="text-xs text-marine-500">Misiones activas</p><p class="text-2xl font-extrabold text-marine-800">{{ misionesActivas() }}</p></div>
        <div class="card card-body"><p class="text-xs text-marine-500">Insignias</p><p class="text-2xl font-extrabold text-marine-800">{{ insignias().length }}</p></div>
        <div class="card card-body"><p class="text-xs text-marine-500">Insignias activas</p><p class="text-2xl font-extrabold text-marine-800">{{ insigniasActivas() }}</p></div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="card card-body space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">{{ editandoMisionId() ? 'Editar misión' : 'Crear misión' }}</h2>
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="formMision" (ngSubmit)="guardarMision()">
            <div><label class="label" for="m-nombre">Nombre</label><input id="m-nombre" class="input" formControlName="nombre" placeholder="Ej. Completa 10 lecciones" /></div>
            <div>
              <label class="label" for="m-tipo">Tipo</label>
              <select id="m-tipo" class="select" formControlName="tipo"><option value="diaria">Diaria</option><option value="semanal">Semanal</option><option value="evento">Evento</option><option value="permanente">Permanente</option></select>
            </div>
            <div class="md:col-span-2"><label class="label" for="m-desc">Descripción (opcional)</label><input id="m-desc" class="input" formControlName="descripcion" placeholder="Describe qué debe hacer el estudiante" /></div>
            <div>
              <label class="label" for="m-obj">Objetivo</label>
              <select id="m-obj" class="select" formControlName="objetivo_tipo">
                <option value="lecciones_completadas">Lecciones completadas</option>
                <option value="actividades_completadas">Actividades completadas</option>
                <option value="evaluaciones_perfectas">Evaluaciones perfectas</option>
                <option value="minijuegos_completados">Minijuegos completados</option>
                <option value="retos_completados">Retos completados</option>
              </select>
            </div>
            <div><label class="label" for="m-cant">Cantidad</label><input id="m-cant" class="input" type="number" min="1" formControlName="objetivo_cantidad" /></div>
            <div><label class="label" for="m-xp">XP recompensa</label><input id="m-xp" class="input" type="number" min="0" formControlName="xp_recompensa" /></div>
            <div><label class="label" for="m-monedas">Monedas recompensa</label><input id="m-monedas" class="input" type="number" min="0" formControlName="monedas_recompensa" /></div>
            <div>
              <label class="label" for="m-ins">Insignia (opcional)</label>
              <select id="m-ins" class="select" formControlName="insignia_id"><option value="">Sin insignia</option>@for (i of insignias(); track i.id) { <option [value]="i.id">{{ i.nombre }}</option> }</select>
            </div>
            <div>
              <label class="label" for="m-curso">Curso (opcional)</label>
              <select id="m-curso" class="select" formControlName="curso_id"><option value="">General</option>@for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }</select>
            </div>
            <div>
              <label class="label" for="m-evento">Evento (opcional)</label>
              <select id="m-evento" class="select" formControlName="evento_id"><option value="">Sin evento</option>@for (e of eventos(); track e.id) { <option [value]="e.id">{{ e.nombre }}</option> }</select>
            </div>
            <div><label class="label" for="m-ini">Inicio (opcional)</label><input id="m-ini" class="input" type="datetime-local" formControlName="fecha_inicio" /></div>
            <div><label class="label" for="m-fin">Fin (opcional)</label><input id="m-fin" class="input" type="datetime-local" formControlName="fecha_fin" /></div>
            <label class="inline-flex items-center gap-2 text-sm text-marine-700 self-end"><input type="checkbox" formControlName="activa" /> Misión activa</label>
            <div class="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-surface-200 pt-3">
              <button class="btn btn-primary" type="submit" [disabled]="formMision.invalid || guardando()">{{ guardando() ? 'Guardando…' : (editandoMisionId() ? 'Guardar cambios' : 'Crear misión') }}</button>
              @if (editandoMisionId()) { <button class="btn btn-outline" type="button" (click)="cancelarEdicionMision()">Cancelar</button> }
            </div>
          </form>
        </div>

        <div class="card card-body space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">{{ editandoInsigniaId() ? 'Editar insignia' : 'Crear insignia' }}</h2>
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="formInsignia" (ngSubmit)="guardarInsignia()">
            <div><label class="label" for="i-codigo">Código</label><input id="i-codigo" class="input font-mono" formControlName="codigo" placeholder="Ej. RACHA_7_DIAS" /></div>
            <div><label class="label" for="i-nombre">Nombre</label><input id="i-nombre" class="input" formControlName="nombre" placeholder="Racha 7 días" /></div>
            <div class="md:col-span-2"><label class="label" for="i-desc">Descripción (opcional)</label><input id="i-desc" class="input" formControlName="descripcion" placeholder="Qué representa esta insignia" /></div>
            <div><label class="label" for="i-icono">Icono / emoji / imagen</label><input id="i-icono" class="input" formControlName="icono" placeholder="Ej. 🔥 o nombre del icono" /></div>
            <div><label class="label" for="i-xp">XP otorgado</label><input id="i-xp" class="input" type="number" min="0" formControlName="xp_otorgado" /></div>
            <div>
              <label class="label" for="i-rareza">Rareza</label>
              <select id="i-rareza" class="select" formControlName="rareza"><option value="comun">Común</option><option value="rara">Rara</option><option value="epica">Épica</option><option value="legendaria">Legendaria</option></select>
            </div>
            <label class="inline-flex items-center gap-2 text-sm text-marine-700 self-end"><input type="checkbox" formControlName="activa" /> Insignia activa</label>
            <div class="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-surface-200 pt-3">
              <button class="btn btn-primary" type="submit" [disabled]="formInsignia.invalid || guardando()">{{ guardando() ? 'Guardando…' : (editandoInsigniaId() ? 'Guardar cambios' : 'Crear insignia') }}</button>
              @if (editandoInsigniaId()) { <button class="btn btn-outline" type="button" (click)="cancelarEdicionInsignia()">Cancelar</button> }
            </div>
          </form>
        </div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="misiones().length === 0" tituloVacio="Sin misiones" descripcionVacia="Crea la primera misión con el formulario de arriba." (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Misión</th><th>Tipo</th><th>Objetivo</th><th>Recompensa</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (m of misiones(); track m.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ m.nombre }} @if (m.descripcion) { <span class="text-xs text-marine-500 block">{{ m.descripcion }}</span> }</td>
                  <td>{{ m.tipo }}</td>
                  <td>{{ m.objetivo_tipo }} · {{ m.objetivo_cantidad }}</td>
                  <td>{{ m.xp_recompensa }} XP / {{ m.monedas_recompensa }} monedas @if (m.insignia_id && insigniaNombre(m.insignia_id)) { <span class="text-xs text-marine-500 block">+ {{ insigniaNombre(m.insignia_id) }}</span> }</td>
                  <td><span class="badge" [class.badge-success]="m.activa" [class.badge-neutral]="!m.activa">{{ m.activa ? 'Sí' : 'No' }}</span></td>
                  <td class="space-x-2 whitespace-nowrap">
                    <button class="link text-sm" type="button" (click)="editarMision(m)">Editar</button>
                    <button class="link text-sm" type="button" (click)="toggleMisionActiva(m)">{{ m.activa ? 'Desactivar' : 'Activar' }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>

      <app-data-panel [cargando]="cargando()" [error]="null" [vacio]="insignias().length === 0" tituloVacio="Sin insignias" descripcionVacia="Crea insignias para asociarlas a misiones o entregarlas como recompensa.">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Insignia</th><th>Rareza</th><th>XP</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (i of insignias(); track i.id) {
                <tr>
                  <td><div class="flex items-center gap-2">@if (i.icono) { <span class="text-lg">{{ i.icono }}</span> }<div><p class="font-medium text-marine-800">{{ i.nombre }}</p><p class="text-xs text-marine-500 font-mono">{{ i.codigo }}</p></div></div></td>
                  <td>{{ i.rareza }}</td>
                  <td>{{ i.xp_otorgado }}</td>
                  <td><span class="badge" [class.badge-success]="i.activa" [class.badge-neutral]="!i.activa">{{ i.activa ? 'Sí' : 'No' }}</span></td>
                  <td class="space-x-2 whitespace-nowrap"><button class="link text-sm" type="button" (click)="editarInsignia(i)">Editar</button><button class="link text-sm" type="button" (click)="toggleInsigniaActiva(i)">{{ i.activa ? 'Desactivar' : 'Activar' }}</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class RewardsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  protected readonly misiones = signal<Mision[]>([]);
  protected readonly insignias = signal<Insignia[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly eventos = signal<EventoGamificacion[]>([]);

  protected readonly editandoMisionId = signal<string | null>(null);
  protected readonly editandoInsigniaId = signal<string | null>(null);

  protected readonly misionesActivas = () => this.misiones().filter((m) => m.activa).length;
  protected readonly insigniasActivas = () => this.insignias().filter((i) => i.activa).length;

  protected readonly formMision = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    tipo: ['permanente', Validators.required],
    objetivo_tipo: ['lecciones_completadas', Validators.required],
    objetivo_cantidad: [1, [Validators.required, Validators.min(1)]],
    xp_recompensa: [100, [Validators.required, Validators.min(0)]],
    monedas_recompensa: [0, [Validators.required, Validators.min(0)]],
    insignia_id: [''],
    curso_id: [''],
    evento_id: [''],
    fecha_inicio: [''],
    fecha_fin: [''],
    activa: [true],
  });

  protected readonly formInsignia = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    icono: [''],
    xp_otorgado: [50, [Validators.required, Validators.min(0)]],
    rareza: ['comun', Validators.required],
    activa: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected insigniaNombre(id: string): string { return this.insignias().find((i) => i.id === id)?.nombre ?? ''; }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [misiones, insignias, cursos, eventos] = await Promise.all([
        this.adminService.listarMisionesAdmin().catch(() => [] as Mision[]),
        this.adminService.listarInsigniasAdmin().catch(() => [] as Insignia[]),
        this.adminService.listarTodosLosCursos().catch(() => [] as Curso[]),
        this.adminService.listarEventosParaMision().catch(() => [] as EventoGamificacion[]),
      ]);
      this.misiones.set(misiones);
      this.insignias.set(insignias);
      this.cursos.set(cursos);
      this.eventos.set(eventos);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las misiones/recompensas.');
    } finally { this.cargando.set(false); }
  }

  // ----------------------------- Misiones -----------------------------
  protected editarMision(m: Mision): void {
    this.editandoMisionId.set(m.id);
    this.formMision.reset({
      nombre: m.nombre, descripcion: m.descripcion ?? '', tipo: m.tipo, objetivo_tipo: m.objetivo_tipo,
      objetivo_cantidad: Number(m.objetivo_cantidad ?? 1), xp_recompensa: Number(m.xp_recompensa ?? 0),
      monedas_recompensa: Number(m.monedas_recompensa ?? 0), insignia_id: m.insignia_id ?? '', curso_id: m.curso_id ?? '',
      evento_id: m.evento_id ?? '',
      fecha_inicio: m.fecha_inicio ? m.fecha_inicio.slice(0, 16) : '', fecha_fin: m.fecha_fin ? m.fecha_fin.slice(0, 16) : '',
      activa: !!m.activa,
    });
    this.setMsg(true, 'Editando misión. Guarda para aplicar cambios.');
  }

  protected cancelarEdicionMision(): void {
    this.editandoMisionId.set(null);
    this.formMision.reset({ nombre: '', descripcion: '', tipo: 'permanente', objetivo_tipo: 'lecciones_completadas', objetivo_cantidad: 1, xp_recompensa: 100, monedas_recompensa: 0, insignia_id: '', curso_id: '', evento_id: '', fecha_inicio: '', fecha_fin: '', activa: true });
    this.mensaje.set(''); this.exito.set(false);
  }

  protected async guardarMision(): Promise<void> {
    if (this.formMision.invalid) return;
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const v = this.formMision.getRawValue();
      const payload = {
        nombre: v.nombre.trim(), descripcion: v.descripcion?.trim() || null, tipo: v.tipo,
        objetivo_tipo: v.objetivo_tipo, objetivo_cantidad: Number(v.objetivo_cantidad),
        xp_recompensa: Number(v.xp_recompensa), monedas_recompensa: Number(v.monedas_recompensa),
        insignia_id: v.insignia_id || null, curso_id: v.curso_id || null, evento_id: v.evento_id || null,
        fecha_inicio: v.fecha_inicio ? new Date(v.fecha_inicio).toISOString() : null,
        fecha_fin: v.fecha_fin ? new Date(v.fecha_fin).toISOString() : null,
        activa: !!v.activa,
      };
      if (this.editandoMisionId()) {
        const res = await this.adminService.actualizarMisionAdmin(this.editandoMisionId()!, payload);
        this.setMsg(res.ok, res.mensaje);
        if (res.ok) { this.cancelarEdicionMision(); await this.cargar(); }
        return;
      }
      const res = await this.adminService.crearMisionAdmin(payload);
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) { this.cancelarEdicionMision(); await this.cargar(); }
    } finally { this.guardando.set(false); }
  }

  protected async toggleMisionActiva(m: Mision): Promise<void> {
    const res = await this.adminService.actualizarMisionAdmin(m.id, { activa: !m.activa });
    this.setMsg(res.ok, res.mensaje);
    if (res.ok) await this.cargar();
  }

  // ----------------------------- Insignias -----------------------------
  protected editarInsignia(i: Insignia): void {
    this.editandoInsigniaId.set(i.id);
    this.formInsignia.reset({ codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion ?? '', icono: i.icono ?? '', xp_otorgado: Number(i.xp_otorgado ?? 0), rareza: i.rareza, activa: !!i.activa });
    this.setMsg(true, 'Editando insignia. Guarda para aplicar cambios.');
  }

  protected cancelarEdicionInsignia(): void {
    this.editandoInsigniaId.set(null);
    this.formInsignia.reset({ codigo: '', nombre: '', descripcion: '', icono: '', xp_otorgado: 50, rareza: 'comun', activa: true });
    this.mensaje.set(''); this.exito.set(false);
  }

  protected async guardarInsignia(): Promise<void> {
    if (this.formInsignia.invalid) return;
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const v = this.formInsignia.getRawValue();
      const payload = { codigo: v.codigo.trim().toUpperCase(), nombre: v.nombre.trim(), descripcion: v.descripcion?.trim() || null, icono: v.icono?.trim() || null, xp_otorgado: Number(v.xp_otorgado), rareza: v.rareza, activa: !!v.activa };
      if (this.editandoInsigniaId()) {
        const res = await this.adminService.actualizarInsigniaAdmin(this.editandoInsigniaId()!, payload);
        this.setMsg(res.ok, res.mensaje);
        if (res.ok) { this.cancelarEdicionInsignia(); await this.cargar(); }
        return;
      }
      const res = await this.adminService.crearInsigniaAdmin(payload);
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) { this.cancelarEdicionInsignia(); await this.cargar(); }
    } finally { this.guardando.set(false); }
  }

  protected async toggleInsigniaActiva(i: Insignia): Promise<void> {
    const res = await this.adminService.actualizarInsigniaAdmin(i.id, { activa: !i.activa });
    this.setMsg(res.ok, res.mensaje);
    if (res.ok) await this.cargar();
  }
}
