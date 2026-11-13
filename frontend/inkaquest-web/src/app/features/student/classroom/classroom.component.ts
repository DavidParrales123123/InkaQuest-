// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { ProgressService } from '../../../core/services/progress.service';
import { StorageService } from '../../../core/services/storage.service';
import { Contenido, Curso, Leccion, Modulo, ProgresoCurso, ProgresoLeccion, Recurso, Unidad } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { imagenDeCurso } from '../../../shared/utilities/curso-imagen.util';

interface LeccionDetalle { contenidos: Contenido[]; recursos: (Recurso & { urlResuelta?: string | null })[] }

@Component({
  selector: 'app-student-classroom',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, ButtonComponent, DataPanelComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <a routerLink="/estudiante/cursos" class="inline-flex items-center gap-1.5 text-sm font-medium text-marine-500 hover:text-brand-600">
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Volver a mis cursos
      </a>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="!curso()" tituloVacio="Curso no disponible" descripcionVacia="No se pudo cargar el aula del curso." (alReintentar)="cargar()">
        <div contenido class="space-y-6">
          @if (curso(); as c) {
            <div class="card overflow-hidden">
              <div class="grid md:grid-cols-[320px_1fr]">
                <img [src]="imagen()" [alt]="c.titulo" class="h-48 w-full object-cover md:h-full" />
                <div class="p-5">
                  <div class="flex flex-wrap items-center gap-2">
                    <h1 class="text-2xl font-bold text-marine-800">{{ c.titulo }}</h1>
                    @if (progreso()) { <app-status-badge [estado]="progreso()!.estado" /> }
                  </div>
                  <p class="mt-2 text-sm text-marine-600">{{ c.descripcion }}</p>
                  <div class="mt-3 flex flex-wrap gap-2 text-xs text-marine-500">
                    <span class="badge badge-default">{{ unidades().length }} unidad(es) / semanas</span>
                    <span class="badge badge-default">{{ totalLecciones() }} lección(es)</span>
                    <span class="badge badge-gold">{{ c.xp_total }} XP</span>
                  </div>
                  @if (progreso()) {
                    <div class="mt-4 max-w-xl">
                      <div class="h-2.5 overflow-hidden rounded-full bg-surface-100">
                        <div class="h-full rounded-full bg-brand-500 transition-all" [style.width.%]="progreso()!.porcentaje"></div>
                      </div>
                      <p class="mt-1 text-sm text-marine-600">{{ progreso()!.porcentaje }}% completado · {{ progreso()!.lecciones_completadas }} lecciones completadas</p>
                    </div>
                  } @else {
                    <p class="mt-3 text-sm text-marine-500">No hay registro de progreso para este curso (requiere matrícula activa).</p>
                  }
                  @if (mensaje()) {
                    <p class="mt-3 text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
                  }
                </div>
              </div>
            </div>

            @if (!matriculaActiva()) {
              <div class="rounded-button border border-gold-200 bg-gold-50 p-4 text-sm text-marine-700">
                <p class="font-medium">Acceso al contenido y registro de progreso</p>
                <p class="mt-1">Para ver y completar lecciones con seguimiento necesitas una matrícula activa en este curso.</p>
                @if (matriculaEstado() === 'pendiente_pago') {
                  <p class="mt-1">Tu matrícula está pendiente de pago/activación. La activación se realiza tras la confirmación en backend.</p>
                  <a routerLink="/estudiante/pagos" class="btn btn-primary btn-sm mt-3 inline-flex">Ir a mis pagos</a>
                }
              </div>
            }

            <div class="space-y-4">
              <div class="flex flex-wrap items-end justify-between gap-2">
                <h2 class="text-xl font-semibold text-marine-800">Plan de estudio (semanas / unidades)</h2>
                <p class="text-sm text-marine-500">Abre cada parte para ver las lecciones y los materiales que subió el docente.</p>
              </div>

              @if (unidades().length === 0) {
                <div class="card card-body text-sm text-marine-500">El contenido de este curso aún no está disponible o no hay unidades publicadas.</div>
              } @else {
                @for (u of unidades(); track u.id; let i = $index) {
                  <details class="card overflow-hidden" [open]="i === 0">
                    <summary class="flex cursor-pointer list-none items-center justify-between gap-3 bg-surface-50 p-4 hover:bg-surface-100">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">Semana {{ u.numero || (i + 1) }} · Unidad</p>
                        <h3 class="truncate font-semibold text-marine-800">{{ u.titulo }}</h3>
                        @if (u.descripcion) { <p class="mt-0.5 text-sm text-marine-500 line-clamp-2">{{ u.descripcion }}</p> }
                      </div>
                      <div class="flex shrink-0 items-center gap-2 text-xs text-marine-500">
                        <span class="badge badge-default">{{ contarLecciones(u) }} lección(es)</span>
                        <span class="badge badge-gold">{{ u.xp_otorgado }} XP</span>
                      </div>
                    </summary>

                    <div class="border-t border-surface-200 p-4 space-y-5">
                      @if (u.modulos.length === 0) {
                        <p class="text-sm text-marine-500">Esta parte aún no tiene módulos/lecciones publicadas.</p>
                      }
                      @for (m of u.modulos; track m.id) {
                        <div class="space-y-2">
                          <div class="flex items-center gap-2">
                            <span class="h-2 w-2 rounded-full bg-brand-500"></span>
                            <h4 class="text-sm font-semibold text-marine-700">{{ m.titulo }}</h4>
                            <span class="text-xs text-marine-400">{{ m.lecciones.length }} lección(es)</span>
                          </div>

                          @if (m.lecciones.length === 0) {
                            <p class="ml-4 text-sm text-marine-400">Sin lecciones.</p>
                          } @else {
                            <ul class="space-y-3">
                              @for (l of m.lecciones; track l.id) {
                                <li class="rounded-xl border border-surface-200 bg-white">
                                  <button type="button" class="w-full p-4 text-left" (click)="toggleLeccion(l)">
                                    <div class="flex flex-wrap items-start justify-between gap-3">
                                      <div class="min-w-0 flex-1">
                                        <div class="flex flex-wrap items-center gap-2">
                                          <p class="font-semibold text-marine-800">{{ l.numero }}. {{ l.titulo }}</p>
                                          @if (completada(l.id)) { <span class="badge badge-success">Completada</span> }
                                        </div>
                                        <p class="mt-0.5 text-xs text-marine-500">{{ l.duracion_minutos }} min · {{ l.xp_otorgado }} XP · {{ l.tipo_contenido }}</p>
                                        @if (l.descripcion) { <p class="mt-1 text-sm text-marine-600 line-clamp-2">{{ l.descripcion }}</p> }
                                      </div>
                                      <div class="flex shrink-0 items-center gap-2">
                                        <span class="text-xs text-brand-700 font-medium">{{ leccionAbierta() === l.id ? 'Ocultar materiales' : 'Ver materiales' }}</span>
                                        @if (!completada(l.id)) {
                                          @if (!tieneMateriales(l.id) && cargandoDetalle() !== l.id && detalleCargados(l.id)) {
                                            <span class="text-xs text-marine-400">Subí primero los materiales del docente; luego podrás marcarla completada.</span>
                                          }
                                          <span (click)="$event.stopPropagation()">
                                            <app-button variante="primario" tamano="sm" [deshabilitado]="!puedeMarcar() || marcando() === l.id || !tieneMateriales(l.id)" [cargando]="marcando() === l.id" (alPulsar)="marcar(l.id)">
                                              Marcar completada
                                            </app-button>
                                          </span>
                                        }</div>
                                    </div>
                                  </button>

                                  @if (leccionAbierta() === l.id) {
                                    <div class="border-t border-surface-200 bg-surface-50 p-4 space-y-4">
                                      @if (cargandoDetalle() === l.id) {
                                        <p class="text-sm text-marine-500">Cargando contenidos y materiales…</p>
                                      } @else {
                                        @if (errorDetalle()[l.id]) {
                                          <p class="text-sm text-danger-600">{{ errorDetalle()[l.id] }}</p>
                                        }
                                        @let det = detalle(l.id);
                                        <div>
                                          <h5 class="text-sm font-semibold text-marine-800">Contenidos de la lección</h5>
                                          @if (det.contenidos.length === 0) {
                                            <p class="mt-1 text-sm text-marine-500">El docente aún no ha publicado contenidos en esta lección.</p>
                                          } @else {
                                            <div class="mt-2 space-y-2">
                                              @for (ct of det.contenidos; track ct.id) {
                                                <article class="rounded-lg border border-surface-200 bg-white p-3">
                                                  <div class="flex flex-wrap items-center gap-2">
                                                    <span class="badge badge-default">{{ ct.tipo }}</span>
                                                    <p class="font-medium text-marine-800">{{ ct.titulo || ('Contenido ' + ct.orden) }}</p>
                                                  </div>
                                                  @if (ct.cuerpo) {
                                                    @if (esEnlace(ct.cuerpo)) {
                                                      <a [href]="ct.cuerpo" target="_blank" rel="noopener" class="mt-2 inline-flex text-sm text-brand-600 hover:underline break-all">{{ ct.cuerpo }}</a>
                                                    } @else {
                                                      <p class="mt-2 whitespace-pre-wrap text-sm text-marine-700">{{ ct.cuerpo }}</p>
                                                    }
                                                  }
                                                </article>
                                              }
                                            </div>
                                          }
                                        </div>

                                        <div>
                                          <h5 class="text-sm font-semibold text-marine-800">Materiales y recursos subidos por el docente</h5>
                                          @if (det.recursos.length === 0) {
                                            <p class="mt-1 text-sm text-marine-500">No hay materiales/archivos adjuntos en esta lección.</p>
                                          } @else {
                                            <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                                              @for (r of det.recursos; track r.id) {
                                                <li class="flex flex-col rounded-lg border border-surface-200 bg-white p-3">
                                                  <div class="flex items-start justify-between gap-3">
                                                    <div class="min-w-0">
                                                      <p class="truncate font-medium text-marine-800">{{ r.nombre }}</p>
                                                      <p class="text-xs text-marine-500">
                                                        {{ r.tipo }}
                                                        @if (r.tamano_bytes) { · {{ (r.tamano_bytes / 1024) | number:'1.0-0' }} KB }
                                                        @if (r.ruta_storage) { · archivo }
                                                      </p>
                                                    </div>
                                                    @if (urlRecurso(r)) {
                                                      <a [href]="urlRecurso(r)!" target="_blank" rel="noopener" download class="btn btn-outline btn-sm shrink-0">Descargar</a>
                                                    } @else if (r.ruta_storage) {
                                                      <span class="text-xs text-marine-400 shrink-0">Disponible con permisos</span>
                                                    } @else {
                                                      <span class="text-xs text-marine-400 shrink-0">Sin enlace</span>
                                                    }
                                                  </div>
                                                  @if (urlRecurso(r) && esVistaPrevia(r)) {
                                                    <div class="mt-3 overflow-hidden rounded-md border border-surface-200">
                                                      @if (extensionRecurso(r) === 'pdf') {
                                                        <iframe [src]="urlPrevia(urlRecurso(r)!)!" title="Vista previa del PDF: {{ r.nombre }}" class="h-96 w-full bg-surface-50"></iframe>
                                                        <div class="flex items-center justify-end border-t border-surface-200 bg-surface-50 px-3 py-1.5">
                                                          <a class="text-xs font-semibold text-brand-700 underline" [href]="urlRecurso(r)!" target="_blank" rel="noopener">Abrir el PDF en una pestaña nueva</a>
                                                        </div>
                                                      } @else {
                                                        <img [src]="urlRecurso(r)!" [alt]="r.nombre" class="max-h-80 w-full object-contain bg-surface-100" decoding="async" loading="lazy" />
                                                      }
                                                    </div>
                                                  }
                                                </li>
                                              }
                                            </ul>
                                            <p class="mt-2 text-xs text-marine-400">El acceso a archivos depende de tu matrícula/permisos y de las políticas de Storage.</p>
                                          }
                                        </div>
                                      }
                                    </div>
                                  }
                                </li>
                              }
                            </ul>
                          }
                        </div>
                      }
                    </div>
                  </details>
                }
              }
            </div>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ClassroomComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly progressService = inject(ProgressService);
  private readonly storageService = inject(StorageService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly curso = signal<Curso | null>(null);
  protected readonly unidades = signal<(Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] })[]>([]);
  protected readonly progreso = signal<ProgresoCurso | null>(null);
  protected readonly progresoLecciones = signal<ProgresoLeccion[]>([]);
  protected readonly matriculaActiva = signal(false);
  protected readonly matriculaEstado = signal<string | null>(null);
  protected readonly marcando = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  protected readonly leccionAbierta = signal<string | null>(null);
  protected readonly cargandoDetalle = signal<string | null>(null);
  private readonly detalles = signal<Record<string, LeccionDetalle>>({});

  protected readonly imagen = computed(() => imagenDeCurso(this.curso()?.slug, this.curso()?.portada_url));
  protected readonly totalLecciones = computed(() => this.unidades().reduce((a, u) => a + u.modulos.reduce((b, m) => b + m.lecciones.length, 0), 0));
  private readonly completadasSet = computed(() => new Set(this.progresoLecciones().filter((p) => p.estado === 'completado').map((p) => p.leccion_id)));

  ngOnInit(): void { void this.cargar(); }

  protected completada(id: string): boolean { return this.completadasSet().has(id); }
  protected puedeMarcar(): boolean { return this.matriculaActiva() && !!this.curso(); }
  protected contarLecciones(u: Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] }): number { return u.modulos.reduce((acc, m) => acc + m.lecciones.length, 0); }
  protected detalle(id: string): LeccionDetalle { return this.detalles()[id] ?? { contenidos: [], recursos: [] }; }
  protected detalleCargados(id: string): boolean { return !!this.detalles()[id]; }
  protected tieneMateriales(id: string): boolean {
    const d = this.detalles()[id];
    if (!d) return false;
    return (d.contenidos?.length ?? 0) + (d.recursos?.length ?? 0) > 0;
  }
  protected extensionRecurso(r: Recurso & { urlResuelta?: string | null }): string {
    const u = (r.urlResuelta || r.url || r.ruta_storage || '').toLowerCase();
    const q = u.split('?')[0].split('#')[0];
    const m = q.match(/\.([a-z0-9]{2,5})$/);
    return (m?.[1] ?? '').toLowerCase();
  }
  protected esVistaPrevia(r: Recurso & { urlResuelta?: string | null }): boolean {
    const ext = this.extensionRecurso(r);
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  }
  protected urlRecurso(r: Recurso & { urlResuelta?: string | null }): string | null { return r.urlResuelta || r.url || null; }
  protected urlPrevia(u: string | null): SafeResourceUrl | null { return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null; }
  protected esEnlace(texto: string | null | undefined): boolean { return !!texto && /^https?:\/\//i.test(texto.trim()); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    const cursoId = this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('cursoId');
    if (!user || !cursoId) { this.error.set('No se pudo identificar el curso.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const curso = await this.courseService.obtenerPorId(cursoId);
      this.curso.set(curso);
      if (!curso) return;
      const [estructura, matriculas, progreso] = await Promise.all([
        this.courseService.obtenerEstructura(curso.id),
        this.enrollmentService.listarMisMatriculas(),
        this.progressService.obtenerProgresoCurso(curso.id, user.id),
      ]);
      this.unidades.set(estructura.unidades);
      const mat = matriculas.find((m) => m.curso_id === curso.id);
      this.matriculaActiva.set(mat?.estado === 'activa');
      this.matriculaEstado.set(mat?.estado ?? null);
      this.progreso.set(progreso);
      if (progreso) {
        this.progresoLecciones.set(await this.progressService.listarProgresoLecciones(progreso.id));
      } else {
        this.progresoLecciones.set([]);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el aula.');
    } finally { this.cargando.set(false); }
  }

  protected readonly errorDetalle = signal<Record<string, string>>({});

  protected async toggleLeccion(l: Leccion): Promise<void> {
    if (this.leccionAbierta() === l.id) { this.leccionAbierta.set(null); return; }
    this.leccionAbierta.set(l.id);
    if (this.detalles()[l.id]) return;
    this.cargandoDetalle.set(l.id);
    this.errorDetalle.update((m) => ({ ...m, [l.id]: '' }));
    try {
      const [contenidosRes, recursosRes] = await Promise.allSettled([
        this.courseService.listarContenido(l.id),
        this.courseService.listarRecursos(l.id),
      ]);
      const contenidos = contenidosRes.status === 'fulfilled' ? contenidosRes.value : [];
      const recursos = recursosRes.status === 'fulfilled' ? recursosRes.value : [];
      if (contenidosRes.status === 'rejected' && recursosRes.status === 'rejected') {
        const msg = (contenidosRes.reason instanceof Error ? contenidosRes.reason.message : '') || 'No se pudieron cargar los materiales.';
        this.errorDetalle.update((m) => ({ ...m, [l.id]: msg }));
      }
      const recursosResueltos = await Promise.all(recursos.map(async (r) => {
        let urlResuelta = r.url;
        if (!urlResuelta && r.ruta_storage) {
          urlResuelta = await this.storageService.obtenerUrlRecurso(r.ruta_storage).catch(() => null);
        }
        return { ...r, urlResuelta };
      }));
      this.detalles.update((m) => ({ ...m, [l.id]: { contenidos, recursos: recursosResueltos } }));
    } finally {
      this.cargandoDetalle.set(null);
    }
  }

  // marcado se dispara desde app-button; la propagación se detiene en el contenedor del botón en la plantilla.

  protected async marcar(leccionId: string): Promise<void> {
    const user = this.auth.usuario();
    const curso = this.curso();
    if (!user || !curso) return;
    this.marcando.set(leccionId); this.mensaje.set('');
    try {
      const pct = await this.progressService.registrarLeccionCompletada(user.id, curso.id, leccionId, 0);
      this.exito.set(true);
      this.mensaje.set(`Lección registrada. Progreso del curso: ${pct}%.`);
      await this.cargar();
    } catch (e) {
      this.exito.set(false);
      this.mensaje.set(e instanceof Error ? e.message : 'No se pudo registrar la lección.');
    } finally {
      this.marcando.set(null);
    }
  }
}
