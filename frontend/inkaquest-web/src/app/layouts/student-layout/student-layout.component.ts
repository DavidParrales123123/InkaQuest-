// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PanelLayoutComponent, SeccionPanel } from '../panel-layout/panel-layout.component';

/**
 * Layout del panel del estudiante.
 *
 * <p>Agrupa la navegacion en areas de aprendizaje, progreso y recompensas,
 * mas las utilidades (notificaciones y soporte).</p>
 */
@Component({
  selector: 'app-student-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelLayoutComponent],
  template: `
    <app-panel-layout
      [secciones]="secciones"
      rutaInicio="/estudiante/dashboard"
      rutaNotificaciones="/estudiante/notificaciones"
    />
  `,
})
export class StudentLayoutComponent {
  /** Secciones del menu del estudiante. */
  protected readonly secciones: readonly SeccionPanel[] = [
    {
      titulo: 'Aprendizaje',
      elementos: [
        { texto: 'Panel', ruta: '/estudiante/dashboard', icono: 'dashboard', exacto: true },
        { texto: 'Mis cursos', ruta: '/estudiante/cursos', icono: 'book' },
        { texto: 'Explorar catálogo', ruta: '/cursos', icono: 'graduation' },
        { texto: 'Tareas', ruta: '/estudiante/tareas', icono: 'clipboard' },
        { texto: 'Evaluaciones', ruta: '/estudiante/evaluaciones', icono: 'file' },
      ],
    },
    {
      titulo: 'Práctica',
      elementos: [
        { texto: 'Minijuegos', ruta: '/estudiante/minijuegos', icono: 'gamepad' },
      ],
    },
    {
      titulo: 'Comunicación',
      elementos: [
        { texto: 'Mensajes', ruta: '/estudiante/mensajes', icono: 'inbox' },
        { texto: 'Avisos', ruta: '/estudiante/avisos', icono: 'bell' },
      ],
    },
    {
      titulo: 'Progreso',
      elementos: [
        { texto: 'Mi progreso', ruta: '/estudiante/progreso', icono: 'chart' },
        { texto: 'Rendimiento', ruta: '/estudiante/rendimiento', icono: 'chart' },
        { texto: 'Calendario', ruta: '/estudiante/calendario', icono: 'calendar' },
        { texto: 'Comunidad', ruta: '/estudiante/comunidad', icono: 'users' },
        { texto: 'Gamificación', ruta: '/estudiante/gamificacion', icono: 'trophy' },
        { texto: 'Insignias', ruta: '/estudiante/insignias', icono: 'medal' },
        { texto: 'Rankings', ruta: '/estudiante/rankings', icono: 'award' },
        { texto: 'Certificados', ruta: '/estudiante/certificados', icono: 'certificate' },
      ],
    },
    {
      titulo: 'Recompensas',
      elementos: [
        { texto: 'Recompensas', ruta: '/estudiante/recompensas', icono: 'medal' },
        { texto: 'Tienda', ruta: '/estudiante/tienda', icono: 'wallet' },
        { texto: 'Inventario', ruta: '/estudiante/inventario', icono: 'inbox' },
      ],
    },
    {
      titulo: 'Cuenta',
      elementos: [
        { texto: 'Mi perfil', ruta: '/estudiante/perfil', icono: 'users' },
        { texto: 'Mis pagos', ruta: '/estudiante/pagos', icono: 'wallet' },
        { texto: 'Notificaciones', ruta: '/estudiante/notificaciones', icono: 'bell' },
        { texto: 'Soporte', ruta: '/estudiante/soporte', icono: 'help' },
      ],
    },
  ];
}
