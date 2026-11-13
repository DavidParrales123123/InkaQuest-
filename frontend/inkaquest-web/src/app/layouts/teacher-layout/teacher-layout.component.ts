// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PanelLayoutComponent, SeccionPanel } from '../panel-layout/panel-layout.component';

/**
 * Layout del panel del docente.
 *
 * <p>El docente administra unicamente los cursos que tiene asignados: la
 * autorizacion la aplican la RLS y Spring Security, no este menu.</p>
 */
@Component({
  selector: 'app-teacher-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelLayoutComponent],
  template: `
    <app-panel-layout
      [secciones]="secciones"
      rutaInicio="/docente/dashboard"
      rutaNotificaciones="/docente/notificaciones"
    />
  `,
})
export class TeacherLayoutComponent {
  /** Secciones del menu del docente. */
  protected readonly secciones: readonly SeccionPanel[] = [
    {
      titulo: 'Gestión',
      elementos: [
        { texto: 'Panel', ruta: '/docente/dashboard', icono: 'dashboard', exacto: true },
        { texto: 'Mis cursos', ruta: '/docente/cursos', icono: 'book' },
        { texto: 'Recursos y archivos', ruta: '/docente/recursos', icono: 'inbox' },
      ],
    },
    {
      titulo: 'Actividades',
      elementos: [
        { texto: 'Tareas', ruta: '/docente/tareas', icono: 'clipboard' },
        { texto: 'Evaluaciones', ruta: '/docente/evaluaciones', icono: 'file' },
        { texto: 'Minijuegos', ruta: '/docente/minijuegos', icono: 'gamepad' },
      ],
    },
    {
      titulo: 'Seguimiento',
      elementos: [
        { texto: 'Estudiantes', ruta: '/docente/estudiantes', icono: 'users' },
        { texto: 'Seguimiento', ruta: '/docente/seguimiento', icono: 'chart' },
        { texto: 'Entregas', ruta: '/docente/entregas', icono: 'clipboard' },
        { texto: 'Calificaciones', ruta: '/docente/calificaciones', icono: 'trophy' },
        { texto: 'Analítica', ruta: '/docente/analitica', icono: 'chart' },
        { texto: 'Vista previa', ruta: '/docente/vista-previa', icono: 'book' },
      ],
    },
    {
      titulo: 'Comunicación',
      elementos: [
        { texto: 'Mensajes', ruta: '/docente/mensajes', icono: 'inbox' },
        { texto: 'Anuncios', ruta: '/docente/anuncios', icono: 'bell' },
        { texto: 'Calendario', ruta: '/docente/calendario', icono: 'calendar' },
        { texto: 'Notificaciones', ruta: '/docente/notificaciones', icono: 'bell' },
      ],
    },
    {
      titulo: 'Cuenta',
      elementos: [
        { texto: 'Mi perfil', ruta: '/docente/perfil', icono: 'users' },
        { texto: 'Soporte', ruta: '/docente/soporte', icono: 'settings' },
      ],
    },
  ];
}
