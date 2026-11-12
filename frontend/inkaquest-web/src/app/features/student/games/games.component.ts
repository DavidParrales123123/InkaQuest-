import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { GameService } from '../../../core/services/game.service';
import { ActividadJuego, Curso, Juego } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-games',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Minijuegos" descripcion="Actividades de juego asociadas a tus cursos y catálogo de juegos/motores." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="actividades().length === 0 && juegos().length === 0" (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Actividades de juego en mis cursos</h2>
            @if (actividades().length === 0) {
              <p class="mt-2 text-sm text-marine-500">No hay actividades de juego publicadas en tus cursos.</p>
            } @else {
              <ul class="mt-3 space-y-2">
                @for (a of actividades(); track a.id) {
                  <li class="card card-body text-sm">
                    <p class="font-medium text-marine-800">{{ a.titulo }}</p>
                    <p class="text-marine-500">Juego: {{ a.juego_id }} · Curso: {{ a.curso_id }}</p>
                    <div class="mt-2"><a [routerLink]="['/estudiante/jugar', a.id]" class="btn btn-primary btn-sm">▶ Jugar</a></div>
                  </li>
                }
              </ul>
            }
          </div>
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Catálogo de juegos</h2>
            @if (juegos().length === 0) {
              <p class="mt-2 text-sm text-marine-500">No hay juegos registrados.</p>
            } @else {
              <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @for (j of juegos(); track j.id) {
                  <article class="card card-body">
                    <h3 class="font-semibold text-marine-800">{{ j.nombre }}</h3>
                    <p class="mt-1 text-sm text-marine-500">{{ j.descripcion || 'Sin descripción.' }}</p>
                    <div class="mt-3"><a [routerLink]="['/estudiante/minijuegos', j.id]" class="btn btn-outline btn-sm">Ver detalle</a></div>
                  </article>
                }
              </div>
            }
          </div>
          <p class="text-xs text-marine-400">Las actividades de juego tienen ejecutor de juego (quiz, memoria, emparejamiento o tarjetas de estudio) y registran tus resultados y XP en el servidor de forma segura. El catálogo muestra juegos publicados; para jugarlos deben estar asignados a una de tus lecciones por tu docente.</p>
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
  protected readonly juegos = signal<Juego[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const acts = (await Promise.all(cursos.map((c: Curso) => this.gameService.listarActividadesJuego(c.id).catch(() => [] as ActividadJuego[])))).flat();
      const juegos = await this.gameService.listarJuegos().catch(() => [] as Juego[]);
      this.actividades.set(acts);
      this.juegos.set(juegos);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los juegos.'); }
    finally { this.cargando.set(false); }
  }
}
