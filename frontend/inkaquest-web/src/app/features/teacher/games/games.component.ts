// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { GameService } from '../../../core/services/game.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { TeacherService } from '../../../core/services/teacher.service';
import {
  ActividadJuego,
  Curso,
  Juego,
  Leccion,
  Motor,
  MotorCurso,
} from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CrearMinijuegoModalComponent } from './crear-minijuego-modal.component';

type LeccionCtx = Leccion & { moduloTitulo: string; unidadTitulo: string; unidadNumero: number };

/**
 * Panel del docente para gestionar minijuegos de sus cursos.
 *
 * <p>Replicando el catálogo vigente, el docente:</p>
 * <ol>
 *   <li>Ve los 4 motores esenciales sembrados en la base (quiz, memoria,
 *       emparejamiento y arrastrar y soltar), listos para cualquier curso.</li>
 *   <li>Puede filtrar por motor y búsqueda.</li>
 *   <li>Selecciona un motor y crea el minijuego (flujo modal de 3 pasos).</li>
 *   <li>Ve sus juegos publicados en el curso actual.</li>
 *   <li>Asigna esos juegos a lecciones como actividades publicadas.</li>
 * </ol>
 */
@Component({
  selector: 'app-teacher-games',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent, CrearMinijuegoModalComponent, NgClass],
  template: `
    <section class="space-y-5">
      <app-page-header
        titulo="Minijuegos"
        descripcion="Diseña minijuegos interactivos con los 4 motores clásicos: quiz rápido, memoria, emparejamiento y arrastrar y soltar. Publica el juego en cualquier lección."
        [acciones]="true"
      >
        <div acciones><button class="btn btn-primary btn-sm" type="button" (click)="abrirModalLibre()" [disabled]="!cursoIdSel()">+ Nuevo minijuego</button></div>
      </app-page-header>

      <!-- ═══ PASO 1 · ELIGE MOTOR Y CREA ═══ -->
      <section class="card card-body space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-start gap-2">
            <span class="flex size-7 items-center justify-center rounded-full bg-brand-500 text-xs font-extrabold text-white">1</span>
            <div>
              <h2 class="text-base font-semibold text-marine-800">Elige un motor clásico</h2>
              <p class="text-xs text-marine-500">{{ totalMotores() }} motores disponibles · listos para cualquier curso.</p>
            </div>
          </div>
          <span class="badge badge-neutral">Catálogo esencial</span>
        </div>
        <div class="grid gap-2 sm:grid-cols-[1fr_260px_auto]">
          <input class="input" [value]="buscadorMotor()" (input)="buscadorMotor.set($any($event.target).value)" placeholder="Buscar motor…" autocomplete="off" aria-label="Buscar motor" />
          <select class="select" [value]="cursoIdSel()" (change)="onCursoChange($any($event.target).value)" aria-label="Curso asignado">
            @for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }
          </select>
          <span class="flex items-center gap-2 text-xs text-marine-500"><span class="badge badge-neutral">{{ motoresFiltrados().length }}</span> visibles</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          @for (m of motoresFiltrados(); track m.id) {
            <article class="group flex flex-col gap-2 overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10">
              <div class="flex items-start justify-between gap-2">
                <span class="flex size-12 items-center justify-center rounded-xl text-2xl shadow-sm" [ngClass]="infoMotor(m).tile">{{ infoMotor(m).icono }}</span>
                <span class="rounded-full bg-gold-100 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-widest text-gold-700">Esencial</span>
              </div>
              <h3 class="mt-1 text-sm font-bold leading-snug text-marine-800">{{ m.nombre }}</h3>
              <p class="min-h-8 text-[0.7rem] leading-snug text-marine-500">{{ infoMotor(m).tagline }}</p>
              <button type="button" class="btn btn-primary btn-sm mt-auto !py-2" (click)="abrirModalConMotor(m)" [disabled]="!cursoIdSel()">Crear minijuego</button>
            </article>
          } @empty {
            <div class="col-span-full rounded-2xl border border-dashed border-surface-300 py-8 text-center">
              <p class="text-3xl">🔍</p>
              <p class="mt-2 text-sm font-semibold text-marine-700">Ningún motor coincide con tu búsqueda</p>
              <p class="mt-0.5 text-xs text-marine-500">Prueba con «quiz», «memoria», «emparejamiento» o «arrastrar».</p>
            </div>
          }
        </div>
      </section>

      @if (msgGlobal()) {
        <div class="px-4 py-2 text-sm rounded-lg border" [class.border-success-200]="okGlobal()" [class.bg-success-50]="okGlobal()" [class.text-success-700]="okGlobal()" [class.border-danger-200]="!okGlobal()" [class.bg-danger-50]="!okGlobal()" [class.text-danger-700]="!okGlobal()">{{ msgGlobal() }}</div>
      }

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cursos().length === 0" tituloVacio="Sin cursos asignados" descripcionVacia="Asignación pendiente del administrador." (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-3">
          <!-- ═══ PASO 2 · MIS MINIJUEGOS ═══ -->
          <section class="card card-body space-y-3 lg:col-span-1">
            <div class="flex items-start gap-2">
              <span class="flex size-7 items-center justify-center rounded-full bg-gold-500 text-xs font-extrabold text-marine-800">2</span>
              <h2 class="text-base font-semibold text-marine-800">Mis minijuegos publicados</h2>
            </div>
            <p class="text-xs text-marine-500 -mt-1">Están listos para asignarse a lecciones desde el paso 3.</p>
            @if (misJuegos().length === 0) {
              <p class="text-sm text-marine-500">Aún no publicaste minijuegos. Elige un motor arriba.</p>
            } @else {
              <ul class="space-y-2">
                @for (j of misJuegos(); track j.id) {
                  <li class="flex items-start justify-between gap-2 rounded-lg border border-surface-200 p-2 text-sm">
                    <div class="min-w-0">
                      <p class="font-semibold text-marine-800">{{ j.nombre }}</p>
                      <p class="text-[0.65rem] text-marine-500">{{ j.motor?.nombre || 'Motor' }} · {{ j.dificultad }} · {{ j.xp_otorgado }} XP <app-status-badge class="ml-1 align-middle" [estado]="j.estado" /></p>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm text-danger-600 shrink-0" [disabled]="guardando() === j.id" (click)="eliminarJuego(j)">Eliminar</button>
                  </li>
                }
              </ul>
            }
          </section>

          <!-- ═══ PASO 3 · ASIGNA A UNA LECCIÓN ═══ -->
          <section class="card card-body space-y-3 lg:col-span-2">
            <div class="flex items-start gap-2">
              <span class="flex size-7 items-center justify-center rounded-full bg-marine-700 text-xs font-extrabold text-gold-400">3</span>
              <div class="min-w-0">
                <h2 class="text-base font-semibold text-marine-800">Asigna tu juego a una lección</h2>
                <p class="text-xs text-marine-500">{{ cursoSel()?.titulo ?? 'Sin curso' }}. Los estudiantes lo verán cuando se publique.</p>
              </div>
            </div>

            @if (lecciones().length === 0) {
              <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                Este curso no tiene lecciones. Crea la estructura en <a [routerLink]="['/docente/cursos']" class="underline font-medium">Mis cursos</a>.
              </div>
            } @else {
              <form class="space-y-3" [formGroup]="form" (ngSubmit)="guardar()">
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="label" for="juego">Juego</label>
                    <select id="juego" class="select" formControlName="juego_id">
                      <option value="">Elige un juego</option>
                      @for (j of juegos(); track j.id) { <option [value]="j.id">{{ j.nombre }} ({{ j.dificultad }})</option> }
                    </select>
                  </div>
                  <div>
                    <label class="label" for="leccion">Lección</label>
                    <select id="leccion" class="select" formControlName="leccion_id">
                      <option value="">Elige una lección</option>
                      @for (l of lecciones(); track l.id) { <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option> }
                    </select>
                  </div>
                </div>
                <div>
                  <label class="label" for="titulo">Título de la actividad</label>
                  <input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Quiz de repaso · Unidad 1" />
                </div>
                <div class="grid gap-2 sm:grid-cols-4 text-xs">
                  <div><label class="label" for="orden">Orden</label><input id="orden" type="number" min="0" class="input" formControlName="orden" /></div>
                  <div><label class="label" for="intentos">Intentos (0=ilimitado)</label><input id="intentos" type="number" min="0" class="input" formControlName="intentos_permitidos" /></div>
                  <div><label class="label" for="puntos">Puntos</label><input id="puntos" type="number" min="0" class="input" formControlName="puntos" /></div>
                  <div><label class="label" for="xp">XP otorgado</label><input id="xp" type="number" min="0" class="input" formControlName="xp_otorgado" /></div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <label class="inline-flex items-center gap-2 text-sm"><input type="checkbox" formControlName="publicado" /> Publicado</label>
                  <button class="btn btn-primary btn-sm" type="submit" [disabled]="form.invalid || guardando() === 'form'">{{ guardando() === 'form' ? 'Guardando…' : (editandoId() ? 'Guardar cambios' : 'Crear actividad') }}</button>
                </div>
              </form>
            }
          </section>

          <!-- ═══ LISTA DE ACTIVIDADES DEL CURSO ═══ -->
          <section class="card card-body space-y-3 lg:col-span-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-semibold text-marine-800">Actividades del curso</h2>
              <span class="badge badge-neutral">{{ actividades().length }}</span>
            </div>
            @if (cargandoCurso()) {
              <p class="text-sm text-marine-500">Cargando actividades…</p>
            } @else if (actividades().length === 0) {
              <p class="text-sm text-marine-500">Aún no hay actividades asignadas. Crea una en el formulario superior.</p>
            } @else {
              <ul class="grid gap-3 sm:grid-cols-2">
                @for (a of actividades(); track a.id) {
                  <li class="rounded-xl border border-surface-200 p-3 space-y-2 text-sm">
                    <div class="flex items-center gap-2"><app-status-badge [estado]="a.publicado ? 'publicado' : 'borrador'" /><p class="font-semibold text-marine-800">{{ a.titulo }}</p></div>
                    <p class="text-xs text-marine-500">{{ nombreJuego(a.juego_id) || ('Juego ' + a.juego_id.slice(0, 8)) }} · {{ nombreLeccion(a.leccion_id) }}</p>
                    <p class="text-xs text-marine-400">{{ a.puntos }} pts · {{ a.xp_otorgado }} XP · Intentos: {{ a.intentos_permitidos || '∞' }}</p>
                    <div class="flex flex-wrap gap-1.5 pt-1">
                      <button class="btn btn-outline btn-sm" type="button" (click)="editar(a)">Editar</button>
                      <button class="btn btn-outline btn-sm" type="button" (click)="togglePublicado(a)" [disabled]="guardando() === a.id">{{ a.publicado ? 'Ocultar' : 'Publicar' }}</button>
                      <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="eliminar(a)" [disabled]="guardando() === a.id">Eliminar</button>
                    </div>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      </app-data-panel>

      @if (cursoIdSel()) {
        <details class="rounded-xl border border-surface-100 bg-surface-50 p-3 text-sm">
          <summary class="cursor-pointer font-medium text-marine-700">Opciones avanzadas de motores del curso ({{ motoresCurso().length }})</summary>
          <div class="mt-3 space-y-2">
            @if (motoresCurso().length === 0) {
              <p class="text-xs text-marine-500">Sin motores asociados. Por defecto, el catálogo completo está disponible.</p>
            } @else {
              <ul class="grid gap-2 sm:grid-cols-2">
                @for (mc of motoresCurso(); track mc.id) {
                  <li class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-white p-2">
                    <div class="min-w-0"><p class="font-medium text-marine-800">{{ nombreMotor(mc.motor_id) }}</p><p class="text-xs text-marine-500">{{ mc.activo ? 'Activo' : 'Inactivo' }}</p></div>
                    <div class="flex gap-1"><button class="btn btn-outline btn-sm text-xs" type="button" (click)="toggleMotorCurso(mc)">{{ mc.activo ? 'Off' : 'On' }}</button><button class="btn btn-outline btn-sm text-xs text-danger-600" type="button" (click)="quitarMotorCurso(mc)">✕</button></div>
                  </li>
                }
              </ul>
            }
            <form class="flex flex-wrap items-end gap-2 border-t border-surface-200 pt-2" [formGroup]="formMotor" (ngSubmit)="asociarMotor()">
              <select class="select flex-1" formControlName="motor_id">
                <option value="">Asociar motor…</option>
                @for (m of motoresDisponiblesParaAsociar(); track m.id) { <option [value]="m.id">{{ m.nombre }} ({{ m.codigo }})</option> }
              </select>
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="formMotor.invalid || guardando() === 'motor'">Asociar</button>
            </form>
          </div>
        </details>
      }

      @if (cursoIdSel() && modalCrear()) {
        <app-crear-minijuego-modal
          [cursoId]="cursoIdSel()"
          [motorPreseleccionado]="motorPreseleccionado()"
          (cerrado)="modalCrear.set(false)"
          (creado)="onJuegoCreado()"
        />
      }
    </section>
  `,
})
export class GamesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly gameService = inject(GameService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);

  // ─── UI general ───
  protected readonly cargando = signal(true);
  protected readonly cargandoCurso = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal<string | null>(null);
  protected readonly msgGlobal = signal('');
  protected readonly okGlobal = signal(false);

  // ─── Panel admin (modo catálogo) ───
  protected readonly buscadorMotor = signal('');
  protected readonly modalCrear = signal(false);
  protected readonly motorPreseleccionado = signal<Motor | null>(null);

  /** Descripciones curadas por código de motor (las de BD son poco útiles). */
  private static readonly INFO_MOTORES: Record<string, { icono: string; tagline: string; tile: string }> = {
    'quiz-rapido': { icono: '❓', tagline: 'Preguntas con racha, puntaje y revisión inmediata.', tile: 'bg-brand-50' },
    'memoria': { icono: '🧠', tagline: 'Encuentra las parejas de tarjetas escondidas.', tile: 'bg-gold-50' },
    'emparejamiento': { icono: '🔗', tagline: 'Conecta cada concepto con su pareja correcta.', tile: 'bg-marine-100' },
    'arrastrar-soltar': { icono: '🎯', tagline: 'Arrastra los elementos a su contenedor correcto.', tile: 'bg-danger-50' },
  };

  protected infoMotor(m: Motor): { icono: string; tagline: string; tile: string } {
    return GamesComponent.INFO_MOTORES[m.codigo] ?? { icono: '🎮', tagline: m.descripcion || 'Motor de minijuego interactivo.', tile: 'bg-surface-100' };
  }

  // ─── Estado de datos ───
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly cursoIdSel = signal<string>('');
  protected readonly actividades = signal<ActividadJuego[]>([]);
  protected readonly juegos = signal<(Juego & { motor: Motor | null })[]>([]);
  protected readonly misJuegos = signal<(Juego & { motor: Motor | null })[]>([]);
  protected readonly lecciones = signal<LeccionCtx[]>([]);
  protected readonly motores = signal<Motor[]>([]);
  protected readonly motoresCurso = signal<MotorCurso[]>([]);
  protected readonly configs = signal<Record<string, { clave: string; valor: unknown }[]>>({});
  protected readonly editandoId = signal<string | null>(null);

  protected readonly cursoSel = computed(() => this.cursos().find((c) => c.id === this.cursoIdSel()) ?? null);
  protected juegoSeleccionado(): (Juego & { motor: Motor | null }) | null {
    const id = this.form?.controls.juego_id?.value ?? '';
    return this.juegos().find((j) => j.id === id) ?? null;
  }
  protected readonly motoresDisponiblesParaAsociar = computed(() => {
    const asociados = new Set(this.motoresCurso().map((m) => m.motor_id));
    return this.motores().filter((m) => !asociados.has(m.id));
  });

  // ─── Catálogo filtrable (4 motores esenciales) ───
  protected readonly motoresFiltrados = computed(() => {
    const q = this.buscadorMotor().trim().toLowerCase();
    return this.motores().filter((m) =>
      q === '' || m.nombre.toLowerCase().includes(q) || (m.descripcion ?? '').toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q),
    );
  });

  protected readonly totalMotores = computed(() => this.motores().length);

  protected readonly form = this.fb.nonNullable.group({
    juego_id: ['', Validators.required],
    leccion_id: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    orden: [0],
    intentos_permitidos: [0],
    puntos: [0],
    xp_otorgado: [0],
    publicado: [false],
  });
  protected readonly formMotor = this.fb.nonNullable.group({ motor_id: ['', Validators.required] });

  // ─── Carga inicial ───
  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [cursos, juegosCat, misJuegos, motores] = await Promise.all([
        this.teacherService.listarMisCursos(user.id),
        this.gameService.listarJuegosPublicados().catch(() => [] as (Juego & { motor: Motor | null })[]),
        this.gameService.listarMisJuegos().catch(() => [] as (Juego & { motor: Motor | null })[]),
        this.gameService.listarMotores().catch(() => [] as Motor[]),
      ]);
      this.cursos.set(cursos.map((c) => c.curso));
      this.juegos.set(juegosCat);
      this.misJuegos.set(misJuegos);
      this.motores.set(motores);
      if (!this.cursoIdSel() && cursos.length > 0) this.cursoIdSel.set(cursos[0].curso.id);
      if (this.cursoIdSel()) await this.cargarCurso(this.cursoIdSel());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la gestión de minijuegos.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async onCursoChange(id: string): Promise<void> {
    this.cursoIdSel.set(id);
    this.cancelarEdicion();
    if (id) await this.cargarCurso(id);
  }

  private async cargarCurso(cursoId: string): Promise<void> {
    this.cargandoCurso.set(true);
    try {
      const [acts, lecs, mcs] = await Promise.all([
        this.gameService.listarActividadesJuegoGestion(cursoId).catch(() => [] as ActividadJuego[]),
        this.gameService.listarLeccionesDeCurso(cursoId).catch(() => [] as LeccionCtx[]),
        this.gameService.listarMotoresCurso(cursoId).catch(() => [] as MotorCurso[]),
      ]);
      this.actividades.set(acts);
      this.lecciones.set(lecs);
      this.motoresCurso.set(mcs);
      await this.cargarConfigsPara(acts.map((a) => a.juego_id));
      const maxOrden = acts.reduce((m, a) => Math.max(m, a.orden ?? 0), 0);
      if (!this.editandoId()) this.form.patchValue({ orden: maxOrden + 1 }, { emitEvent: false });
    } finally {
      this.cargandoCurso.set(false);
    }
  }

  private async cargarConfigsPara(juegoIds: string[]): Promise<void> {
    const ids = [...new Set(juegoIds.filter(Boolean))].filter((id) => !this.configs()[id]);
    if (ids.length === 0) return;
    const entries = await Promise.all(ids.map(async (id): Promise<[string, { clave: string; valor: unknown }[]]> => {
      try {
        const cfg = await this.gameService.listarConfiguracionJuego(id);
        return [id, cfg.map((c) => ({ clave: c.clave, valor: (c as { valor?: unknown }).valor as unknown }))];
      } catch {
        return [id, []];
      }
    }));
    this.configs.update((m) => {
      const n = { ...m };
      for (const [id, v] of entries) n[id] = v;
      return n;
    });
  }

  protected nombreJuego(id: string): string {
    const j = this.juegos().find((x) => x.id === id);
    return j ? `${j.nombre}${j.motor?.nombre ? ' · ' + j.motor.nombre : ''}` : '';
  }
  protected nombreMotor(id: string): string { return this.motores().find((m) => m.id === id)?.nombre ?? id.slice(0, 8) + '…'; }
  protected nombreLeccion(id: string): string {
    const l = this.lecciones().find((x) => x.id === id);
    if (!l) return id.slice(0, 8) + '…';
    return `U${l.unidadNumero} ${l.unidadTitulo} · ${l.moduloTitulo} · ${l.titulo}`;
  }
  protected configResumen(juegoId: string): string[] {
    const cfg = this.configs()[juegoId] ?? [];
    return cfg.slice(0, 4).map((c) => {
      const v = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor);
      const corto = v.length > 40 ? v.slice(0, 40) + '…' : v;
      return `${c.clave}: ${corto}`;
    });
  }

  protected onMotorDemo(m: Motor): void {
    this.setMsg(true, `Previsualizando: ${m.nombre} — motor ${m.codigo}`);
  }

  private setMsg(ok: boolean, msg: string): void { this.okGlobal.set(ok); this.msgGlobal.set(msg); }

  protected abrirModalConMotor(m: Motor): void {
    this.motorPreseleccionado.set(m);
    this.modalCrear.set(true);
  }

  /** Abre el modal sin motor preseleccionado (que el docente elija el suyo). */
  protected abrirModalLibre(): void {
    this.motorPreseleccionado.set(null);
    this.modalCrear.set(true);
  }

  protected onJuegoCreado(): void {
    this.modalCrear.set(false);
    void this.cargar();
  }

  protected async guardar(): Promise<void> {
    const cursoId = this.cursoIdSel();
    if (!cursoId || this.form.invalid) return;
    this.guardando.set('form');
    try {
      const v = this.form.getRawValue();
      const payload = {
        juego_id: v.juego_id,
        leccion_id: v.leccion_id,
        curso_id: cursoId,
        titulo: v.titulo.trim(),
        descripcion: v.descripcion?.trim() || null,
        orden: Number(v.orden) || 0,
        intentos_permitidos: Number(v.intentos_permitidos) || 0,
        puntos: Number(v.puntos) || 0,
        xp_otorgado: Number(v.xp_otorgado) || 0,
        publicado: !!v.publicado,
      };
      if (this.editandoId()) {
        await this.gameService.actualizarActividadJuego(this.editandoId()!, payload);
        this.setMsg(true, 'Actividad de juego actualizada correctamente.');
      } else {
        await this.gameService.crearActividadJuego(payload);
        this.setMsg(true, 'Actividad de juego creada y asignada al curso/lección.');
      }
      this.cancelarEdicion();
      await this.cargarCurso(cursoId);
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo guardar la actividad de juego. Verifica permisos RLS y datos.');
    } finally {
      this.guardando.set(null);
    }
  }

  protected editar(a: ActividadJuego): void {
    this.editandoId.set(a.id);
    this.form.reset({
      juego_id: a.juego_id,
      leccion_id: a.leccion_id,
      titulo: a.titulo,
      descripcion: a.descripcion ?? '',
      orden: a.orden ?? 0,
      intentos_permitidos: a.intentos_permitidos ?? 0,
      puntos: Number(a.puntos ?? 0),
      xp_otorgado: a.xp_otorgado ?? 0,
      publicado: !!a.publicado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    const maxOrden = this.actividades().reduce((m, a) => Math.max(m, a.orden ?? 0), 0);
    this.form.reset({
      juego_id: '', leccion_id: '', titulo: '', descripcion: '',
      orden: maxOrden + 1, intentos_permitidos: 0, puntos: 0, xp_otorgado: 0, publicado: false,
    });
  }

  protected async togglePublicado(a: ActividadJuego): Promise<void> {
    this.guardando.set(a.id);
    try {
      await this.gameService.actualizarActividadJuego(a.id, { publicado: !a.publicado });
      this.setMsg(true, !a.publicado ? 'Actividad publicada.' : 'Actividad ocultada (borrador).');
      await this.cargarCurso(this.cursoIdSel());
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo cambiar el estado de publicación.');
    } finally { this.guardando.set(null); }
  }

  protected async eliminar(a: ActividadJuego): Promise<void> {
    if (!(await this.confirm.ask({ title: 'Eliminar actividad', mensaje: `¿Eliminar la actividad de juego "${a.titulo}"? Esta acción no se puede deshacer.`, textoConfirmar: 'Eliminar' }))) return;
    this.guardando.set(a.id);
    try {
      await this.gameService.eliminarActividadJuego(a.id);
      if (this.editandoId() === a.id) this.cancelarEdicion();
      this.setMsg(true, 'Actividad de juego eliminada.');
      await this.cargarCurso(this.cursoIdSel());
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo eliminar la actividad de juego.');
    } finally { this.guardando.set(null); }
  }

  protected async eliminarJuego(j: (Juego & { motor: Motor | null })): Promise<void> {
    if (!(await this.confirm.ask({ title: 'Eliminar minijuego', mensaje: `¿Eliminar el juego «${j.nombre}»? Se eliminarán también las actividades, intentos y configuraciones asociados. No se puede deshacer.`, textoConfirmar: 'Eliminar' }))) return;
    this.guardando.set(j.id);
    try {
      const r = await this.gameService.eliminarJuego(j.id);
      if (!r.ok) {
        this.setMsg(false, r.mensaje);
      } else {
        this.misJuegos.set(this.misJuegos().filter((x) => x.id !== j.id));
        this.juegos.set(this.juegos().filter((x) => x.id !== j.id));
        this.setMsg(true, r.mensaje);
      }
    } finally { this.guardando.set(null); }
  }

  protected async asociarMotor(): Promise<void> {
    const cursoId = this.cursoIdSel();
    const motorId = this.formMotor.controls.motor_id.value;
    if (!cursoId || !motorId) return;
    this.guardando.set('motor');
    try {
      await this.gameService.asignarMotorCurso(cursoId, motorId, this.auth.usuario()?.id ?? null);
      this.formMotor.reset({ motor_id: '' });
      this.setMsg(true, 'Motor asociado al curso.');
      await this.cargarCurso(cursoId);
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo asociar el motor (verifica permisos y si ya está asociado).');
    } finally { this.guardando.set(null); }
  }

  protected async toggleMotorCurso(mc: MotorCurso): Promise<void> {
    this.guardando.set(mc.id);
    try {
      await this.gameService.actualizarMotorCurso(mc.id, { activo: !mc.activo });
      await this.cargarCurso(this.cursoIdSel());
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo actualizar el motor del curso.');
    } finally { this.guardando.set(null); }
  }

  protected async quitarMotorCurso(mc: MotorCurso): Promise<void> {
    if (!(await this.confirm.ask({ title: 'Quitar motor del curso', mensaje: '¿Quitar este motor del curso?', textoConfirmar: 'Quitar' }))) return;
    this.guardando.set(mc.id);
    try {
      await this.gameService.eliminarMotorCurso(mc.id);
      this.setMsg(true, 'Motor quitado del curso.');
      await this.cargarCurso(this.cursoIdSel());
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo quitar el motor del curso.');
    } finally { this.guardando.set(null); }
  }
}
