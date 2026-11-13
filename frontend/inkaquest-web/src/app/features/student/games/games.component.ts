// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { GameService } from '../../../core/services/game.service';
import { ActividadJuego, Curso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-games',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Minijuegos" descripcion="Solo aparecen las actividades de juego asignadas a tus cursos por tu docente." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="actividades().length === 0" tituloVacio="Aún no hay minijuegos" descripcionVacia="Cuando tu docente asigne un minijuego a una lección de tu curso, aparecerá aquí para que lo juegues." (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Mis actividades de juego</h2>
            <p class="mt-1 text-xs text-marine-500">Solo aparecen las actividades publicadas por tu docente para este curso/semana.</p>
            @if (misCursos().length > 1) {
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap gap-2 pb-1" role="tablist" aria-label="Curso">
                  <button type="button" class="rounded-full border px-4 py-2 text-xs font-semibold transition-all" [class.border-brand-500]="cursoId() === null" [class.bg-brand-500]="cursoId() === null" [class.text-white]="cursoId() === null" [class.border-surface-200]="cursoId() !== null" [class.bg-white]="cursoId() !== null" [class.text-marine-700]="cursoId() !== null" (click)="cursoId.set(null)">Todas ({{ actividades().length }})</button>
                  @for (c of misCursos(); track c.id) {
                    <button type="button" class="rounded-full border px-4 py-2 text-xs font-semibold transition-all" [class.border-brand-500]="cursoId() === c.id" [class.bg-brand-500]="cursoId() === c.id" [class.text-white]="cursoId() === c.id" [class.border-surface-200]="cursoId() !== c.id" [class.bg-white]="cursoId() !== c.id" [class.text-marine-700]="cursoId() !== c.id" (click)="cursoId.set(c.id)">{{ c.titulo }} ({{ contarActividades(c.id) }})</button>
                  }
                </div>
                @if (cursoId()) { <button type="button" class="btn btn-outline btn-sm" (click)="cursoId.set(null)">Limpiar</button> }
              </div>
            }
            @if (actividades().length === 0) {
              <p class="mt-2 text-sm text-marine-500">No hay actividades de juego publicadas en tus cursos.</p>
            } @else if (actividadesVisibles().length === 0) {
              <p class="mt-2 text-sm text-marine-500">Ninguna actividad coincide con el filtro. Prueba «Todas».</p>
            } @else {
              <ul class="mt-3 space-y-2">
                @for (a of actividadesVisibles(); track a.id) {
                  <li class="card card-body text-sm">
                    <p class="font-medium text-marine-800">{{ a.titulo }}</p>
                    <p class="text-marine-500">Juego publicado en {{ nombreCurso(a.curso_id) }} · Orden {{ a.orden }}</p>
                    <div class="mt-2"><a [routerLink]="['/estudiante/jugar', a.id]" class="btn btn-primary btn-sm">▶ Jugar</a></div>
                  </li>
                }
              </ul>
            }
          </div>
          <p class="text-xs text-marine-400">Las actividades de juego tienen ejecutor (quiz, memoria, emparejamiento o tarjetas); tu docente puede asignar una o varias por lección a tu curso.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class GamesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly gameService = inject(GameService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actividades = signal<ActividadJuego[]>([]);
  protected readonly misCursos = signal<Curso[]>([]);
  protected readonly cursoId = signal<string | null>(null);

  protected readonly actividadesVisibles = computed(() => {
    const f = this.cursoId();
    return f ? this.actividades().filter((a) => a.curso_id === f) : this.actividades();
  });

  protected contarActividades(cursoId: string): number {
    return this.actividades().filter((a) => a.curso_id === cursoId).length;
  }

  protected nombreCurso(cursoId: string): string {
    return this.misCursos().find((c) => c.id === cursoId)?.titulo ?? cursoId;
  }

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      this.misCursos.set(cursos);
      const acts = (await Promise.all(cursos.map((c: Curso) => this.gameService.listarActividadesJuego(c.id).catch(() => [] as ActividadJuego[])))).flat();
      this.actividades.set(acts);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los juegos.'); }
    finally { this.cargando.set(false); }
  }
}
