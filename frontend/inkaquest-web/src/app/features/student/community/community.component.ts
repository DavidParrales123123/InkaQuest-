import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-community',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Comunidad" descripcion="Espacios de interacción y apoyo en la plataforma." />
      <div class="grid gap-4 md:grid-cols-2">
        <div class="card card-body space-y-2">
          <h2 class="text-lg font-semibold text-marine-800">Mensajes y soporte</h2>
          <p class="text-sm text-marine-600">Comunícate con docentes/soporte y da seguimiento a tus consultas mediante los canales disponibles.</p>
          <div class="flex flex-wrap gap-2 pt-2">
            <a routerLink="/estudiante/soporte" class="btn btn-primary btn-sm">Ir a soporte</a>
            <a routerLink="/estudiante/notificaciones" class="btn btn-outline btn-sm">Notificaciones</a>
          </div>
        </div>
        <div class="card card-body space-y-2">
          <h2 class="text-lg font-semibold text-marine-800">Aprendizaje colaborativo</h2>
          <p class="text-sm text-marine-600">Participa en actividades, minijuegos y rankings de tus cursos. Los foros/comunidades por curso dependen de módulos específicos habilitados en la plataforma.</p>
          <div class="flex flex-wrap gap-2 pt-2">
            <a routerLink="/estudiante/minijuegos" class="btn btn-outline btn-sm">Minijuegos</a>
            <a routerLink="/estudiante/rankings" class="btn btn-outline btn-sm">Rankings</a>
          </div>
        </div>
      </div>
      <p class="text-xs text-marine-500">Esta sección se adapta a las capacidades reales disponibles (mensajería, notificaciones, soporte y actividades). Funciones de foro/comunidad dedicadas pueden requerir módulos adicionales en backend/BD.</p>
    </section>
  `,
})
export class CommunityComponent {}
