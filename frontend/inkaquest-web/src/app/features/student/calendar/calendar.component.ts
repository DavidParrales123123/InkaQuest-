// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CourseService } from '../../../core/services/course.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface Evento { fecha: string | null; titulo: string; tipo: string; curso: string; detalle?: string; enlace?: any[]; }

@Component({
  selector: 'app-student-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Calendario" descripcion="Fechas y actividades relevantes de tus cursos (tareas y actividades disponibles) según datos reales." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="eventos().length === 0" tituloVacio="Sin eventos" descripcionVacia="No hay fechas/actividades registradas para tus cursos en este momento." (alReintentar)="cargar()">
        <div contenido class="space-y-3">
          @for (e of eventos(); track e.titulo + e.fecha + e.curso) {
            <article class="card card-body flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-marine-800">{{ e.titulo }}</p>
                <p class="text-sm text-marine-600">{{ e.tipo }} · {{ e.curso }}</p>
                @if (e.detalle) { <p class="text-sm text-marine-500 mt-1">{{ e.detalle }}</p> }
                @if (e.enlace) { <a [routerLink]="e.enlace" class="text-sm text-brand-600 hover:underline mt-1 inline-block">Ir</a> }
              </div>
              <div class="text-right">
                @if (e.fecha) { <p class="font-medium text-marine-800">{{ e.fecha | date:'mediumDate' }}</p> }
                @else { <p class="text-sm text-marine-400">Disponible</p> }
              </div>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-500">Se muestran actividades/tareas visibles de tus cursos. Fechas específicas dependen de la información registrada por el docente.</p>
    </section>
  `,
})
export class CalendarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly activityService = inject(ActivityService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly eventos = signal<Evento[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const eventos: Evento[] = [];
      await Promise.all(cursos.map(async (c) => {
        const [acts, tareas] = await Promise.all([
          this.courseService.listarActividadesPublicadas(c.id).catch(() => []),
          this.activityService.listarTareasCurso(c.id, user.id).catch(() => []),
        ]);
        for (const t of tareas) {
          eventos.push({ fecha: t.fecha_entrega ?? null, titulo: t.actividad.titulo, tipo: 'Tarea', curso: c.titulo, detalle: t.entrega ? `Entrega: ${t.entrega.estado}` : 'Pendiente de entrega', enlace: ['/estudiante/tareas'] });
        }
        for (const a of acts) {
          if (a.tipo === 'tarea') continue;
          // Apunta cada actividad a su hogar funcional tras la consolidación.
          const enlace: string[] =
            a.tipo === 'quiz' || a.tipo === 'examen' ? ['/estudiante/evaluaciones']
            : a.tipo === 'minijuego' ? ['/estudiante/minijuegos']
            : ['/estudiante/cursos'];
          eventos.push({ fecha: a.creado_en, titulo: a.titulo, tipo: `Actividad (${a.tipo})`, curso: c.titulo, enlace });
        }
      }));
      eventos.sort((a, b) => (a.fecha && b.fecha ? new Date(a.fecha).getTime() - new Date(b.fecha).getTime() : 0));
      this.eventos.set(eventos.slice(0, 120));
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el calendario.'); }
    finally { this.cargando.set(false); }
  }
}
