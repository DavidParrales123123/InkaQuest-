import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Categoria, Curso } from '../../../core/models/domain.models';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

/**
 * Catálogo público de cursos.
 *
 * <p>Permite buscar, filtrar por categoría, ordenar y paginar los resultados.
 * Los datos provienen de la base real con RLS aplicada: solo se ven cursos publicados.</p>
 */
@Component({
  selector: 'app-course-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CourseCardComponent, EmptyStateComponent, SkeletonComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-12 md:py-16">
        <p class="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.18em] text-gold-300 uppercase ring-1 ring-white/15">Catálogo</p>
        <h1 class="mt-4 max-w-3xl text-white">Cursos de programación con práctica real</h1>
        <p class="mt-4 max-w-2xl text-lg leading-relaxed text-marine-100">
          Teoría, ejercicios y retos evaluados. Explora por categoría, busca por tema y encuentra tu siguiente ruta de aprendizaje.
        </p>
      </div>
    </section>

    <section class="container-app py-10 md:py-12">
      <div class="card border-white/60 p-5 shadow-[0_16px_40px_rgba(27,42,74,0.10)] md:p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div class="md:col-span-2">
            <label class="label" for="busqueda">Buscar curso</label>
            <div class="relative">
              <svg class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marine-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" stroke-linecap="round" />
              </svg>
              <input
                id="busqueda"
                type="search"
                class="input pl-10"
                placeholder="Título, tema o tecnología…"
                [ngModel]="busqueda()"
                (ngModelChange)="aplicarBusqueda($event)"
              />
            </div>
          </div>

          <div>
            <label class="label" for="categoria">Categoría</label>
            <select id="categoria" class="select" [ngModel]="categoriaId()" (ngModelChange)="aplicarCategoria($event)">
              <option value="">Todas las categorías</option>
              @for (categoria of categorias(); track categoria.id) {
                <option [value]="categoria.id">{{ categoria.nombre }}</option>
              }
            </select>
          </div>

          <div>
            <label class="label" for="orden">Ordenar por</label>
            <select id="orden" class="select" [ngModel]="orden()" (ngModelChange)="aplicarOrden($event)">
              <option value="relevancia">Relevancia</option>
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        @if (categorias().length > 0) {
          <div class="mt-5 flex flex-wrap gap-2 border-t border-surface-200 pt-5">
            <button type="button" class="badge cursor-pointer transition-all" [class.bg-marine-700]="categoriaId() === ''" [class.text-white]="categoriaId() === ''" [class.bg-surface-100]="categoriaId() !== ''" [class.text-marine-600]="categoriaId() !== ''" (click)="aplicarCategoria('')">Todas</button>
            @for (categoria of categorias(); track categoria.id) {
              <button type="button" class="badge cursor-pointer transition-all" [class.bg-marine-700]="categoriaId() === categoria.id" [class.text-white]="categoriaId() === categoria.id" [class.bg-surface-100]="categoriaId() !== categoria.id" [class.text-marine-600]="categoriaId() !== categoria.id" (click)="aplicarCategoria(categoria.id)">{{ categoria.nombre }}</button>
            }
          </div>
        }
      </div>

      <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-marine-500" aria-live="polite">
          @if (cargando()) { Cargando cursos… } @else { {{ total() }} {{ total() === 1 ? 'curso encontrado' : 'cursos encontrados' }} }
        </p>
        @if (hayFiltros()) {
          <button type="button" class="text-xs font-bold text-brand-600 hover:underline" (click)="limpiarFiltros()">Limpiar filtros</button>
        }
      </div>

      <div class="mt-6">
        @if (cargando()) {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="card overflow-hidden">
                <app-skeleton alto="12rem" radio="0" />
                <div class="card-body space-y-3">
                  <app-skeleton alto="1.25rem" ancho="75%" />
                  <app-skeleton alto="0.875rem" />
                  <app-skeleton alto="0.875rem" ancho="60%" />
                </div>
              </div>
            }
          </div>
        } @else if (cursosPagina().length === 0) {
          <div class="card">
            <app-empty-state titulo="No encontramos cursos con esos filtros" descripcion="Prueba con otra categoría o limpia la búsqueda para ver todo el catálogo.">
              <svg icono viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" stroke-linecap="round" /></svg>
            </app-empty-state>
          </div>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (curso of cursosPagina(); track curso.id) {
              @if (estadoMatricula()[curso.id]; as estado) {
                <app-course-card [curso]="curso" contexto="aulas" [estado]="estado" />
              } @else {
                <app-course-card [curso]="curso" />
              }
            }
          </div>

          @if (totalPaginas() > 1) {
            <nav class="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación del catálogo">
              <button type="button" class="btn btn-outline btn-sm" [disabled]="pagina() <= 1" (click)="irAPagina(pagina() - 1)">Anterior</button>
              @for (p of paginas(); track p) {
                <button
                  type="button"
                  class="btn btn-sm"
                  [class.btn-primary]="p === pagina()"
                  [class.btn-outline]="p !== pagina()"
                  [attr.aria-current]="p === pagina() ? 'page' : null"
                  (click)="irAPagina(p)"
                >{{ p }}</button>
              }
              <button type="button" class="btn btn-outline btn-sm" [disabled]="pagina() >= totalPaginas()" (click)="irAPagina(pagina() + 1)">Siguiente</button>
            </nav>
          }
        }
      </div>
    </section>
  `,
})
export class CourseCatalogComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly auth = inject(AuthService);
  private readonly enrollmentService = inject(EnrollmentService);

  /** Cursos cargados/ordenados (todos los que cumplen filtros). */
  protected readonly cursos = signal<Curso[]>([]);
  /** Categorías disponibles. */
  protected readonly categorias = signal<Categoria[]>([]);
  /** Estado de carga. */
  protected readonly cargando = signal(true);
  /** Total de cursos que cumplen los filtros (según consulta). */
  protected readonly total = signal(0);
  /** Texto de búsqueda. */
  protected readonly busqueda = signal('');
  /** Categoría seleccionada. */
  protected readonly categoriaId = signal('');
  /** Criterio de ordenación. */
  protected readonly orden = signal('relevancia');
  /** Página actual (1-based). */
  protected readonly pagina = signal(1);
  /** Tamaño de página. */
  protected readonly tamanoPagina = 9;

  private temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  /** Estado de matrícula indexado por curso (solo para usuarios autenticados). */
  protected readonly estadoMatricula = signal<Record<string, string>>({});
  /** Indica si hay matrícula cargada (evita parpadeo mientras se resuelve). */
  protected readonly matriculasCargadas = signal(false);

  protected readonly hayFiltros = computed(
    () => this.busqueda().trim().length > 0 || this.categoriaId().length > 0,
  );

  protected readonly totalPaginas = computed(() => {
    const total = this.cursos().length;
    return Math.max(1, Math.ceil(total / this.tamanoPagina));
  });

  protected readonly cursosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.tamanoPagina;
    return this.cursos().slice(inicio, inicio + this.tamanoPagina);
  });

  protected readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const ventana = 5;
    let inicio = Math.max(1, actual - Math.floor(ventana / 2));
    const fin = Math.min(total, inicio + ventana - 1);
    if (fin - inicio + 1 < ventana) inicio = Math.max(1, fin - ventana + 1);
    const res: number[] = [];
    for (let i = inicio; i <= fin; i++) res.push(i);
    return res;
  });

  ngOnInit(): void {
    void this.cargarCategorias();
    void this.cargarCursos();
    void this.cargarMisMatriculas();
  }

  private async cargarMisMatriculas(): Promise<void> {
    if (!this.auth.autenticado()) {
      this.matriculasCargadas.set(true);
      return;
    }
    try {
      const matriculas = await this.enrollmentService.listarMisMatriculas();
      const vigentes = new Set(['activa', 'completada', 'pendiente_pago']);
      const mapa: Record<string, string> = {};
      for (const m of matriculas) {
        if (vigentes.has(m.estado)) mapa[m.curso_id] = m.estado;
      }
      this.estadoMatricula.set(mapa);
    } catch {
      this.estadoMatricula.set({});
    } finally {
      this.matriculasCargadas.set(true);
    }
  }

  private async cargarCategorias(): Promise<void> {
    try {
      this.categorias.set(await this.courseService.listarCategorias());
    } catch {
      this.categorias.set([]);
    }
  }

  protected async cargarCursos(): Promise<void> {
    this.cargando.set(true);
    try {
      const [cursos, total] = await Promise.all([
        this.courseService.listarPublicos({
          busqueda: this.busqueda().trim() || undefined,
          categoriaId: this.categoriaId() || undefined,
          limite: 60,
        }),
        this.courseService.contarPublicos({
          busqueda: this.busqueda().trim() || undefined,
          categoriaId: this.categoriaId() || undefined,
        }),
      ]);
      this.cursos.set(this.ordenar(cursos));
      this.total.set(total);
      this.pagina.set(1);
    } catch {
      this.cursos.set([]);
      this.total.set(0);
    } finally {
      this.cargando.set(false);
    }
  }

  private ordenar(cursos: Curso[]): Curso[] {
    const copia = [...cursos];
    switch (this.orden()) {
      case 'precio_asc':
        return copia.sort((a, b) => a.precio - b.precio);
      case 'precio_desc':
        return copia.sort((a, b) => b.precio - a.precio);
      case 'recientes':
        return copia.sort(
          (a, b) =>
            new Date(b.publicado_en ?? b.creado_en).getTime() -
            new Date(a.publicado_en ?? a.creado_en).getTime(),
        );
      default:
        return copia;
    }
  }

  protected aplicarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.temporizadorBusqueda) {
      clearTimeout(this.temporizadorBusqueda);
    }
    this.temporizadorBusqueda = setTimeout(() => void this.cargarCursos(), 350);
  }

  protected aplicarCategoria(valor: string): void {
    this.categoriaId.set(valor);
    void this.cargarCursos();
  }

  protected aplicarOrden(valor: string): void {
    this.orden.set(valor);
    this.cursos.set(this.ordenar(this.cursos()));
    this.pagina.set(1);
  }

  protected irAPagina(p: number): void {
    const max = this.totalPaginas();
    if (p < 1 || p > max) return;
    this.pagina.set(p);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoriaId.set('');
    this.orden.set('relevancia');
    void this.cargarCursos();
  }
}
