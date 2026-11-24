// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface Evento { fecha: string | null; titulo: string; tipo: string; curso: string; detalle?: string; enlace?: any[]; }

@Component({
  selector: 'app-student-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Calendario" descripcion="Tareas y evaluaciones que tienes pendientes en tus cursos, con sus fechas límite." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="eventos().length === 0" tituloVacio="Todo al día" descripcionVacia="No tienes tareas ni evaluaciones pendientes en este momento." (alReintentar)="cargar()">
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
      <p class="text-xs text-marine-500">Solo aparecen actividades por desarrollar: tareas no enviadas con plazo vigente y evaluaciones pendientes dentro de su ventana de acceso. Las entregadas, vencidas o ya rendidas se omiten.</p>
    </section>
  `,
})
export class CalendarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly activityService = inject(ActivityService);
  private readonly evaluationService = inject(EvaluationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly eventos = signal<Evento[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    const ahora = Date.now();
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const eventos: Evento[] = [];
      await Promise.all(cursos.map(async (c) => {
        const [tareas, evaluaciones] = await Promise.all([
          this.activityService.listarTareasCurso(c.id, user.id).catch(() => []),
          this.evaluationService.listarEvaluacionesCurso(c.id).catch(() => []),
        ]);

        // Tareas: solo pendientes de entrega y con el plazo aún vigente.
        for (const t of tareas) {
          const estado = t.entrega?.estado;
          if (estado && ['enviado', 'en_revision', 'revisada'].includes(estado)) continue;
          if (t.fecha_entrega && new Date(t.fecha_entrega).getTime() < ahora) continue;
          eventos.push({
            fecha: t.fecha_entrega ?? null,
            titulo: t.actividad.titulo,
            tipo: 'Tarea',
            curso: c.titulo,
            detalle: estado === 'devuelta'
              ? 'Devuelta: revisa los comentarios y vuelve a entregar'
              : 'Pendiente de entrega',
            enlace: ['/estudiante/tareas'],
          });
        }

        // Evaluaciones: solo las que aún puedes rendir y cuya ventana no cerró.
        for (const e of evaluaciones) {
          const limite = e.fecha_limite_acceso ? new Date(e.fecha_limite_acceso).getTime() : null;
          if (limite !== null && limite < ahora) continue;
          const intentos = await this.evaluationService.listarIntentos(e.id, user.id).catch(() => []);
          if (intentos.some((i) => i.estado === 'entregado' || i.estado === 'expirado')) continue;
          const permitidos = Math.max(1, Number(e.intentos_permitidos ?? 1));
          if (intentos.length >= permitidos) continue;
          eventos.push({
            fecha: e.fecha_limite_acceso ?? e.fecha_inicio ?? null,
            titulo: e.actividad.titulo,
            tipo: e.actividad.tipo === 'examen' ? 'Examen' : 'Evaluación',
            curso: c.titulo,
            detalle: intentos.length ? 'Intento en curso: puedes continuar' : 'Pendiente de rendir',
            enlace: ['/estudiante/evaluaciones'],
          });
        }
      }));
      eventos.sort((a, b) => {
        if (!a.fecha && !b.fecha) return a.titulo.localeCompare(b.titulo);
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      });
      this.eventos.set(eventos.slice(0, 120));
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el calendario.'); }
    finally { this.cargando.set(false); }
  }
}
