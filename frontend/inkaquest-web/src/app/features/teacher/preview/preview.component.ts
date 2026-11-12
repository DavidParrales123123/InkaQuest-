import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { CourseService } from '../../../core/services/course.service';
import { Curso, DocenteCurso, Leccion, Modulo, Unidad } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface EstructuraPreview {
  unidades: (Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] })[];
}

/**
 * Vista previa como estudiante del curso.
 *
 * <p>Muestra la estructura publicada de cada curso (solo lo que el estudiante
 * vería) sin afectar progreso ni datos. Selección por curso.</p>
 */
@Component({
  selector: 'app-teacher-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Vista previa del estudiante"
        descripcion="Revisa qué ve tu estudiante al entrar al curso. No registra progreso ni cambia nada."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          @if (cursoSel()) {
            <a [routerLink]="['/cursos', cursoSel()!.slug]" class="btn btn-outline btn-sm" target="_blank" rel="noopener">Ver ficha pública</a>
          }
          <a routerLink="/docente/cursos" class="btn btn-outline btn-sm">Volver a mis cursos</a>
        </div>
      </app-page-header>

      <div class="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-xs font-semibold text-marine-700">
        Modo simulación: esta vista es de solo lectura. No registra tu progreso ni afecta a tus estudiantes.
      </div>

      @if (cargando()) {
        <p class="py-16 text-center text-sm font-medium text-marine-500">Cargando tus cursos…</p>
      } @else if (error()) {
        <div class="card card-body space-y-3">
          <p class="text-sm text-danger-600">{{ error() }}</p>
          <button type="button" class="btn btn-primary btn-sm w-fit" (click)="cargar()">Reintentar</button>
        </div>
      } @else if (cursos().length === 0) {
        <div class="card state-block">
          <svg class="size-12 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke-linejoin="round" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke-linejoin="round" /></svg>
          <p class="text-sm font-medium text-marine-600">Aún no tienes cursos asignados.</p>
        </div>
      } @else {
        <div>
          <label class="label" for="curso-preview">Curso para previsualizar</label>
          <select id="curso-preview" class="select max-w-md" [value]="cursoId()" (change)="seleccionar($any($event.target).value)">
            @for (c of cursos(); track c.curso.id) {
              <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
            }
          </select>
        </div>

        @if (estructura(); as e) {
          @if (e.unidades.length === 0) {
            <div class="card card-body text-sm text-marine-500">Este curso aún no publica contenido visible para el estudiante.</div>
          } @else {
            <ul class="space-y-3">
              @for (u of e.unidades; track u.id) {
                <li class="card overflow-hidden">
                  <div class="flex items-center gap-3 border-b border-surface-200 bg-surface-50 p-4">
                    <span class="flex size-10 items-center justify-center rounded-xl bg-marine-700 text-base font-extrabold text-gold-400">U{{ u.numero }}</span>
                    <div class="min-w-0">
                      <p class="font-bold text-marine-800">{{ u.titulo }}</p>
                      <p class="text-xs text-marine-500">{{ u.publicado ? 'Publicada' : 'Borrador (solo tú la ves)' }}</p>
                    </div>
                  </div>
                  <div class="p-4">
                    @for (m of u.modulos; track m.id) {
                      <div class="mt-2 first:mt-0">
                        <p class="text-xs font-bold uppercase tracking-widest text-marine-400">Módulo {{ m.numero }} · {{ m.titulo }}</p>
                        <ul class="mt-1.5 space-y-1.5 text-sm">
                          @for (l of m.lecciones; track l.id) {
                            <li class="flex items-center gap-2.5 rounded-xl border border-surface-100 bg-surface-50/50 px-3 py-2">
                              <svg class="size-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke-linejoin="round" /><path d="M14 3v5h5" stroke-linejoin="round" /></svg>
                              <span class="min-w-0 flex-1 font-medium text-marine-700">{{ l.titulo }}</span>
                              <span class="text-xs text-marine-400">{{ l.duracion_minutos }} min</span>
                            </li>
                          } @empty {
                            <li class="pl-1 text-xs text-marine-400">Sin lecciones en este módulo.</li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        }
      }
    </section>
  `,
})
export class PreviewComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<(DocenteCurso & { curso: Curso })[]>([]);
  protected readonly cursoId = signal<string | null>(null);
  protected readonly estructura = signal<EstructuraPreview | null>(null);

  protected readonly cursoSel = signal<Curso | null>(null);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async seleccionar(id: string): Promise<void> {
    if (id === this.cursoId()) return;
    this.cursoId.set(id);
    this.cursoSel.set(this.cursos().find((c) => c.curso.id === id)?.curso ?? null);
    await this.cargarEstructura();
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (cursos[0]) {
        this.cursoId.set(cursos[0].curso.id);
        this.cursoSel.set(cursos[0].curso);
        await this.cargarEstructura();
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar tus cursos.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarEstructura(): Promise<void> {
    const id = this.cursoId();
    if (!id) {
      this.estructura.set(null);
      return;
    }
    try {
      const est = await this.courseService.obtenerEstructura(id);
      this.estructura.set(est);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la estructura.');
    }
  }
}
