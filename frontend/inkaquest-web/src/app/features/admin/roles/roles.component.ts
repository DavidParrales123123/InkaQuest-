import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-roles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Roles y permisos" descripcion="Modelo de roles de la plataforma y reglas de acceso." />
      <div class="grid gap-4 md:grid-cols-3">
        <div class="card card-body"><h2 class="font-semibold text-marine-800">Estudiante</h2><p class="mt-2 text-sm text-marine-600">Rol por defecto al registrarse. Accede a cursos, progreso, actividades y recompensas propias.</p></div>
        <div class="card card-body"><h2 class="font-semibold text-marine-800">Docente</h2><p class="mt-2 text-sm text-marine-600">Asignado tras solicitud y aprobación administrativa. Gestiona cursos/asignaciones autorizadas.</p></div>
        <div class="card card-body"><h2 class="font-semibold text-marine-800">Administrador</h2><p class="mt-2 text-sm text-marine-600">Cuenta creada por medios controlados. Acceso global sujeto a RLS y políticas de backend.</p></div>
      </div>
      <div class="card card-body text-sm text-marine-600">
        <p>La autorización real se aplica en PostgreSQL (RLS) y en el backend (Spring Security). El frontend solo refleja permisos para UX.</p>
        <p class="mt-2">La administración granular de permisos/roles y su persistencia puede requerir endpoints y tablas de administración adicionales expuestas por backend.</p>
      </div>
    </section>
  `,
})
export class RolesComponent {}
