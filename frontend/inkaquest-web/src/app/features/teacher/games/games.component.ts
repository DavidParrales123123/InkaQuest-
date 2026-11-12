import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { GameService } from '../../../core/services/game.service';
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
 * <p>Replicando la experiencia del proyecto anterior, el docente:</p>
 * <ol>
 *   <li>Ve el catálogo completo de motores (96) sembrados en la base.</li>
 *   <li>Puede filtrar por curso, familia y búsqueda.</li>
 *   <li>Selecciona un motor y crea el minijuego (flujo modal de 3 pasos).</li>
 *   <li>Ve sus juegos publicados en el curso actual.</li>
 *   <li>Asigna esos juegos a lecciones como actividades publicadas.</li>
 * </ol>
 */
@Component({
  selector: 'app-teacher-games',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent, CrearMinijuegoModalComponent],
  template: `
    <section class="space-y-6">
      <!-- Header -->
      <app-page-header
        titulo="Minijuegos"
        descripcion="Crea minijuegos sobre motores listos, asígnalos a lecciones y deja que tus estudiantes jueguen aprendiendo."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <button class="btn btn-primary btn-sm" type="button" (click)="abrirModalLibre()" [disabled]="!filtroCurso()">+ Crear minijuego</button>
        </div>
      </app-page-header>

      <!-- ═══ STATS ROW ═══ -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div class="card card-body">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-marine-400">Motores en catálogo</p>
          <p class="mt-1 text-3xl font-extrabold text-marine-800">{{ stats().total }}</p>
          <p class="mt-1 text-xs text-marine-500">Disponibles para crear juegos</p>
        </div>
        <div class="card card-body">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-marine-400">Genéricos</p>
          <p class="mt-1 text-3xl font-extrabold text-brand-700">{{ stats().genericos }}</p>
          <p class="mt-1 text-xs text-marine-500">Quiz Rápido · Memoria · Emparejamiento · Arrastrar</p>
        </div>
        <div class="card card-body">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-marine-400">Específicos</p>
          <p class="mt-1 text-3xl font-extrabold text-info-600">{{ stats().especificos }}</p>
          <p class="mt-1 text-xs text-marine-500">Motores por curso</p>
        </div>
        <div class="card card-body">
          <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-marine-400">Tus juegos publicados</p>
          <p class="mt-1 text-3xl font-extrabold text-gold-700">{{ stats().misPublicados }}</p>
          <p class="mt-1 text-xs text-marine-500">Listos para asignar por lección</p>
        </div>
      </div>

      @if (msgGlobal()) {
        <div class="px-4 py-2 text-sm rounded-lg border" [class.border-success-200]="okGlobal()" [class.bg-success-50]="okGlobal()" [class.text-success-700]="okGlobal()" [class.border-danger-200]="!okGlobal()" [class.bg-danger-50]="!okGlobal()" [class.text-danger-700]="!okGlobal()">{{ msgGlobal() }}</div>
      }

      <!-- ═══ PASO 0 · FILTROS DEL CATÁLOGO ═══ -->
      <div class="card card-body space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Catálogo de motores</h2>
            <p class="text-xs text-marine-500">96 motores especializados por curso. Crea el tuyo directamente aquí.</p>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            @for (t of familiaTabs; track t.value) {
              <button type="button" class="btn btn-outline btn-sm !py-1" [class.bg-marine-800]="filtroFamiliaMotor() === t.value" [class.text-white]="filtroFamiliaMotor() === t.value" (click)="filtroFamiliaMotor.set(t.value)">{{ t.label }}</button>
            }
          </div>
        </div>
        <div class="grid gap-2 sm:grid-cols-3">
          <div class="sm:col-span-1">
            <input class="input" [value]="buscadorMotor()" (input)="buscadorMotor.set($any($event.target).value)" placeholder="Buscar motor…" autocomplete="off" aria-label="Buscar motor" />
          </div>
          <div>
            <select class="select" [value]="filtroCurso()" (change)="filtroCurso.set($any($event.target).value)" aria-label="Curso para crear">
              <option value="">Elige el curso</option>
              @for (c of cursos(); track c.id) {
                <option [value]="c.id">{{ c.titulo }}</option>
              }
            </select>
          </div>
          <div class="flex items-center gap-2 text-xs text-marine-500"><span class="badge badge-default">{{ motoresFiltrados().length }}</span> motores visibles</div>
        </div>
      </div>

      <!-- ═══ GRID DE MOTORES ═══ -->
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        @for (m of motoresFiltrados(); track m.id) {
          <article class="card overflow-hidden flex flex-col p-4 gap-2 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <div class="flex items-start justify-between gap-2">
              <span class="text-2xl leading-none">{{ iconoFamilia(m) }}</span>
              <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-marine-600">{{ m.familia }}</span>
            </div>
            <h3 class="font-semibold text-marine-800 leading-snug">{{ m.nombre }}</h3>
            <p class="line-clamp-2 text-[0.72rem] text-marine-500">{{ m.descripcion }}</p>
            <p class="text-[0.65rem] font-mono text-marine-400">{{ m.codigo }}</p>
            <div class="mt-auto flex items-center justify-between gap-2 border-t border-surface-100 pt-2">
              <button type="button" class="btn btn-primary btn-sm !py-1.5" (click)="abrirModalConMotor(m)" [disabled]="!filtroCurso()">Crear aquí</button>
              <button type="button" class="btn btn-ghost btn-sm !py-1.5" (click)="onMotorDemo(m)" title="Previsualizar">👁</button>
            </div>
          </article>
        } @empty {
          <p class="col-span-full py-6 text-center text-sm text-marine-500">Ningún motor aparece con este filtro.</p>
        }
      </div>

      <!-- Cursor empty state -->
      @if (!filtroCurso()) {
        <p class="text-center text-xs text-marine-500 bg-surface-50 border border-surface-200 rounded-xl p-3">Selecciona un curso arriba para habilitar "Crear aquí".</p>
      }

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cursos().length === 0" tituloVacio="Sin cursos asignados" descripcionVacia="Asignación pendiente del administrador." (alReintentar)="cargar()">
        <div contenido class="space-y-6">
          <!-- ═══ MIS MINIJUEGOS PUBLICADOS ═══ -->
          <div class="card card-body space-y-3">
            <h2 class="text-lg font-semibold text-marine-800">Mis minijuegos publicados</h2>
            <p class="text-xs text-marine-500">Tus juegos listos para asignar a lecciones como actividades.</p>
            @if (misJuegos().length === 0) {
              <p class="text-sm text-marine-500">Aún no has publicado un minijuego. Elige un motor arriba y haz clic en "Crear aquí".</p>
            } @else {
              <ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @for (j of misJuegos(); track j.id) {
                  <li class="rounded-xl border border-surface-200 p-3 text-sm">
                    <p class="font-medium text-marine-800">{{ j.nombre }}</p>
                    <p class="text-[0.7rem] text-marine-500">{{ j.motor?.nombre || 'Motor' }} · {{ j.dificultad }} · {{ j.xp_otorgado }} XP</p>
                    <app-status-badge [estado]="j.estado" />
                  </li>
                }
              </ul>
            }
          </div>

          <!-- ═══ GESTIÓN DE ACTIVIDADES POR CURSO ═══ -->
          <div class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <div class="space-y-6">
              <div class="card card-body space-y-4">
                <div class="flex items-center justify-between gap-2">
                  <h2 class="text-lg font-semibold text-marine-800">Actividades de juego del curso</h2>
                  <span class="badge badge-default">{{ actividades().length }} en total</span>
                </div>
                @if (cargandoCurso()) {
                  <p class="text-sm text-marine-500">Cargando actividades, lecciones y catálogo…</p>
                } @else if (actividades().length === 0) {
                  <p class="text-sm text-marine-500">Aún no hay actividades de juego asignadas en este curso. Crea una desde el formulario.</p>
                } @else {
                  <div class="space-y-3">
                    @for (a of actividades(); track a.id) {
                      <article class="rounded-lg border border-surface-200 p-4 space-y-3">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                              <p class="font-semibold text-marine-800">{{ a.titulo }}</p>
                              <app-status-badge [estado]="a.publicado ? 'publicado' : 'borrador'" />
                            </div>
                            <p class="mt-1 text-sm text-marine-600">{{ nombreJuego(a.juego_id) || 'Juego: ' + a.juego_id.slice(0, 8) + '…' }}</p>
                            <p class="text-xs text-marine-500">Lección: {{ nombreLeccion(a.leccion_id) }}</p>
                            @if (a.descripcion) { <p class="mt-1 text-sm text-marine-600">{{ a.descripcion }}</p> }
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-marine-500">
                              <span class="badge badge-default">Orden {{ a.orden }}</span>
                              <span class="badge badge-default">{{ a.puntos }} pts</span>
                              <span class="badge badge-default">{{ a.xp_otorgado }} XP</span>
                              <span class="badge badge-default">Intentos: {{ a.intentos_permitidos || 'ilimitados' }}</span>
                            </div>
                          </div>
                          <div class="flex flex-wrap gap-2">
                            <button class="btn btn-outline btn-sm" type="button" (click)="editar(a)">Editar</button>
                            <button class="btn btn-outline btn-sm" type="button" (click)="togglePublicado(a)" [disabled]="guardando() === a.id">{{ a.publicado ? 'Ocultar' : 'Publicar' }}</button>
                            <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="eliminar(a)" [disabled]="guardando() === a.id">Eliminar</button>
                          </div>
                        </div>
                        @if (configResumen(a.juego_id).length > 0) {
                          <div class="rounded bg-surface-50 p-2 text-xs text-marine-600">
                            <span class="font-medium">Configuración del juego (solo lectura):</span>
                            {{ configResumen(a.juego_id).join(' · ') }}
                          </div>
                        }
                      </article>
                    }
                  </div>
                }
              </div>

              <div class="card card-body space-y-3">
                <h2 class="text-lg font-semibold text-marine-800">Motores asociados al curso</h2>
                <p class="text-sm text-marine-500">Asocia motores a tu curso para garantizar que los juegos estén disponibles. La disponibilidad depende de motores activos y permisos.</p>
                @if (motoresCurso().length === 0) {
                  <p class="text-sm text-marine-500">No hay motores asociados explícitamente a este curso.</p>
                } @else {
                  <ul class="space-y-2">
                    @for (mc of motoresCurso(); track mc.id) {
                      <li class="flex flex-wrap items-center justify-between gap-2 rounded border border-surface-200 p-2 text-sm">
                        <div>
                          <p class="font-medium text-marine-800">{{ nombreMotor(mc.motor_id) }}</p>
                          <p class="text-xs text-marine-500">{{ mc.activo ? 'Activo' : 'Inactivo' }}{{ mc.es_comun ? ' · Común' : '' }}</p>
                        </div>
                        <div class="flex gap-2">
                          <button class="btn btn-outline btn-sm" type="button" (click)="toggleMotorCurso(mc)">{{ mc.activo ? 'Desactivar' : 'Activar' }}</button>
                          <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="quitarMotorCurso(mc)">Quitar</button>
                        </div>
                      </li>
                    }
                  </ul>
                }
                <form class="flex flex-wrap items-end gap-2 border-t border-surface-200 pt-3" [formGroup]="formMotor" (ngSubmit)="asociarMotor()">
                  <div class="min-w-[220px] flex-1">
                    <label class="label" for="motor-add">Asociar motor</label>
                    <select id="motor-add" class="select" formControlName="motor_id">
                      <option value="">Selecciona un motor</option>
                      @for (m of motoresDisponiblesParaAsociar(); track m.id) {
                        <option [value]="m.id">{{ m.nombre }} ({{ m.codigo }})</option>
                      }
                    </select>
                  </div>
                  <button class="btn btn-primary btn-sm" type="submit" [disabled]="formMotor.invalid || guardando() === 'motor'">Asociar</button>
                </form>
              </div>
            </div>

            <div class="space-y-6">
              <div class="card card-body space-y-4">
                <h2 class="text-lg font-semibold text-marine-800">{{ editandoId() ? 'Editar actividad de juego' : 'Nueva actividad de juego' }}</h2>
                <label class="label" for="curso-cf">Curso</label>
                <select id="curso-cf" class="select max-w-xl mb-1" [value]="cursoIdSel()" (change)="onCursoChange($any($event.target).value)">
                  @for (c of cursos(); track c.id) {
                    <option [value]="c.id">{{ c.titulo }}</option>
                  }
                </select>
                @if (lecciones().length === 0) {
                  <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    Este curso no tiene lecciones registradas. Crea la estructura en <a [routerLink]="['/docente/cursos']" class="underline font-medium">Mis cursos</a> antes de asignar minijuegos.
                  </div>
                }
                @if (misJuegos().length === 0 && juegos().length === 0) {
                  <div class="rounded-lg bg-surface-50 border border-surface-200 p-3 text-sm text-marine-700">
                    Aún no tienes juegos disponibles. Elige un motor arriba y haz clic en "Crear aquí" para publicar tu primer minijuego.
                  </div>
                }

                <form class="space-y-3" [formGroup]="form" (ngSubmit)="guardar()">
                  <div>
                    <label class="label" for="juego">Juego (catálogo publicado)</label>
                    <select id="juego" class="select" formControlName="juego_id">
                      <option value="">Selecciona un juego</option>
                      @for (j of juegos(); track j.id) {
                        <option [value]="j.id">{{ j.nombre }}{{ j.motor?.nombre ? ' · ' + j.motor!.nombre : '' }} ({{ j.dificultad }})</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="label" for="leccion">Lección del curso</label>
                    <select id="leccion" class="select" formControlName="leccion_id">
                      <option value="">Selecciona una lección</option>
                      @for (l of lecciones(); track l.id) {
                        <option [value]="l.id">U{{ l.unidadNumero }} {{ l.unidadTitulo }} · {{ l.moduloTitulo }} · {{ l.titulo }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="label" for="titulo">Título de la actividad</label>
                    <input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Quiz de repaso · Unidad 1" />
                  </div>
                  <div>
                    <label class="label" for="desc">Descripción (opcional)</label>
                    <textarea id="desc" class="textarea" rows="3" formControlName="descripcion" placeholder="Instrucciones o contexto para el estudiante"></textarea>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div><label class="label" for="orden">Orden</label><input id="orden" type="number" min="0" class="input" formControlName="orden" /></div>
                    <div><label class="label" for="intentos">Intentos permitidos (0 = ilimitado)</label><input id="intentos" type="number" min="0" class="input" formControlName="intentos_permitidos" /></div>
                    <div><label class="label" for="puntos">Puntos</label><input id="puntos" type="number" min="0" class="input" formControlName="puntos" /></div>
                    <div><label class="label" for="xp">XP otorgado</label><input id="xp" type="number" min="0" class="input" formControlName="xp_otorgado" /></div>
                  </div>
                  <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="publicado" /> Publicar para estudiantes (visible en la lección/curso si hay acceso)</label>

                  @if (juegoSeleccionado(); as jsel) {
                    <div class="rounded-lg bg-surface-50 border border-surface-200 p-3 text-sm space-y-1">
                      <p class="font-medium text-marine-800">Juego seleccionado</p>
                      <p class="text-marine-700">{{ jsel.nombre }} · {{ jsel.dificultad }} · {{ jsel.estado }}</p>
                      @if (jsel.descripcion) { <p class="text-marine-600">{{ jsel.descripcion }}</p> }
                      <p class="text-xs text-marine-500">Motor: {{ jsel.motor?.nombre || '—' }} · XP base: {{ jsel.xp_otorgado }} · Monedas: {{ jsel.monedas_otorgadas }}</p>
                    </div>
                  }

                  <div class="flex flex-wrap gap-2 pt-1">
                    <button class="btn btn-primary" type="submit" [disabled]="form.invalid || lecciones().length === 0 || guardando() === 'form'">
                      {{ guardando() === 'form' ? 'Guardando…' : (editandoId() ? 'Guardar cambios' : 'Crear actividad de juego') }}
                    </button>
                    @if (editandoId()) {
                      <button class="btn btn-outline" type="button" (click)="cancelarEdicion()">Cancelar</button>
                    }
                  </div>
                </form>
              </div>

              <div class="card card-body space-y-3">
                <h2 class="text-lg font-semibold text-marine-800">Catálogo de juegos disponibles</h2>
                @if (juegos().length === 0) {
                  <p class="text-sm text-marine-500">Aún no tienes juegos en el catálogo publicado o no creaste el primero. Usa el catálogo de motores arriba y haz clic en "Crear aquí".</p>
                } @else {
                  <ul class="space-y-2 max-h-72 overflow-auto pr-1">
                    @for (j of juegos(); track j.id) {
                      <li class="rounded border border-surface-200 p-2 text-sm">
                        <p class="font-medium text-marine-800">{{ j.nombre }}</p>
                        <p class="text-xs text-marine-500">{{ j.motor?.nombre || 'Motor' }} · {{ j.dificultad }} · {{ j.estado }} · {{ j.xp_otorgado }} XP</p>
                        @if (j.descripcion) { <p class="mt-1 text-marine-600 line-clamp-2">{{ j.descripcion }}</p> }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </div>
        </div>
      </app-data-panel>

      <!-- Modal: crear minijuego desde un motor del catálogo -->
      @if (filtroCurso() && modalCrear()) {
        <app-crear-minijuego-modal
          [cursoId]="filtroCurso()"
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

  // ─── UI general ───
  protected readonly cargando = signal(true);
  protected readonly cargandoCurso = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal<string | null>(null);
  protected readonly msgGlobal = signal('');
  protected readonly okGlobal = signal(false);

  // ─── Panel admin (modo catálogo) ───
  protected readonly buscadorMotor = signal('');
  protected readonly filtroFamiliaMotor = signal<'generico' | 'especifico' | 'adicional' | ''>('');
  protected readonly filtroCurso = signal<string>('');
  protected readonly modalCrear = signal(false);
  protected readonly motorPreseleccionado = signal<Motor | null>(null);

  protected readonly familiaTabs: { value: '' | 'generico' | 'especifico' | 'adicional'; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'generico', label: 'Genéricos' },
    { value: 'especifico', label: 'Específicos' },
    { value: 'adicional', label: 'Adicionales' },
  ];

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
  protected readonly juegoSeleccionado = computed(() => this.juegos().find((j) => j.id === this.form.controls.juego_id.value) ?? null);
  protected readonly motoresDisponiblesParaAsociar = computed(() => {
    const asociados = new Set(this.motoresCurso().map((m) => m.motor_id));
    return this.motores().filter((m) => !asociados.has(m.id));
  });

  // ─── Catálogo filtrable (96 motores del común) ───
  protected readonly motoresFiltrados = computed(() => {
    const q = this.buscadorMotor().trim().toLowerCase();
    const f = this.filtroFamiliaMotor();
    return this.motores().filter((m) =>
      (f === '' || m.familia === f) &&
      (q === '' || m.nombre.toLowerCase().includes(q) || (m.descripcion ?? '').toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q)),
    );
  });

  protected readonly stats = computed(() => ({
    total: this.motores().length,
    genericos: this.motores().filter((m) => m.familia === 'generico').length,
    especificos: this.motores().filter((m) => m.familia === 'especifico').length,
    adicionales: this.motores().filter((m) => m.familia === 'adicional').length,
    misPublicados: this.misJuegos().filter((j) => j.estado === 'publicado').length,
  }));

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
      if (!this.filtroCurso() && cursos.length > 0) this.filtroCurso.set(cursos[0].curso.id);
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

  protected iconoFamilia(m: Motor): string {
    const g = m.familia === 'generico';
    if (g) {
      const nombre = (m.nombre || '').toLowerCase();
      if (nombre.includes('quiz')) return '❓';
      if (nombre.includes('memoria')) return '🧠';
      if (nombre.includes('emparejamiento')) return '🔗';
      if (nombre.includes('arrastrar')) return '🎯';
      return '🎮';
    }
    if (m.familia === 'especifico') return '🎯';
    return '✨';
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
    if (!confirm(`¿Eliminar la actividad de juego "${a.titulo}"? Esta acción no se puede deshacer.`)) return;
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
    if (!confirm('¿Quitar este motor del curso?')) return;
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
