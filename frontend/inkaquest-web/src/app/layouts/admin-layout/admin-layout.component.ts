import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PanelLayoutComponent, SeccionPanel } from '../panel-layout/panel-layout.component';

/**
 * Layout del panel del administrador.
 *
 * <p>El administrador no puede registrarse publicamente: su cuenta se crea
 * desde la base de datos o desde el panel. El acceso lo autoriza la RLS con
 * {@code app_is_admin()}.</p>
 */
@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelLayoutComponent],
  template: `
    <app-panel-layout
      [secciones]="secciones"
      rutaInicio="/admin/dashboard"
      rutaNotificaciones="/admin/notificaciones"
    />
  `,
})
export class AdminLayoutComponent {
  /** Secciones del menu del administrador. */
  protected readonly secciones: readonly SeccionPanel[] = [
    {
      titulo: 'Visión general',
      elementos: [
        { texto: 'Panel', ruta: '/admin/dashboard', icono: 'dashboard', exacto: true },
        { texto: 'Reportes', ruta: '/admin/reportes', icono: 'chart' },
        { texto: 'Auditoría', ruta: '/admin/auditoria', icono: 'file' },
      ],
    },
    {
      titulo: 'Personas',
      elementos: [
        { texto: 'Usuarios', ruta: '/admin/usuarios', icono: 'users' },
        { texto: 'Estudiantes', ruta: '/admin/estudiantes', icono: 'users' },
        { texto: 'Docentes', ruta: '/admin/docentes', icono: 'users' },
        { texto: 'Solicitudes docentes', ruta: '/admin/solicitudes', icono: 'shield' },
        { texto: 'Roles', ruta: '/admin/roles', icono: 'cog' },
        { texto: 'Permisos', ruta: '/admin/permisos', icono: 'shield' },
      ],
    },
    {
      titulo: 'Académico',
      elementos: [
        { texto: 'Cursos', ruta: '/admin/cursos', icono: 'book' },
        { texto: 'Categorías', ruta: '/admin/categorias', icono: 'graduation' },
        { texto: 'Unidades', ruta: '/admin/unidades', icono: 'graduation' },
        { texto: 'Lecciones', ruta: '/admin/lecciones', icono: 'file' },
        { texto: 'Recursos', ruta: '/admin/recursos', icono: 'inbox' },
        { texto: 'Matrículas', ruta: '/admin/matriculas', icono: 'file' },
        { texto: 'Actividades', ruta: '/admin/actividades', icono: 'activity' },
        { texto: 'Evaluaciones', ruta: '/admin/evaluaciones', icono: 'clipboard' },
      ],
    },
    {
      titulo: 'Gamificación y juegos',
      elementos: [
        { texto: 'Motores de juegos', ruta: '/admin/motores-juegos', icono: 'gamepad' },
        { texto: 'Gamificación', ruta: '/admin/gamificacion', icono: 'trophy' },
        { texto: 'Insignias', ruta: '/admin/insignias', icono: 'medal' },
        { texto: 'Eventos', ruta: '/admin/eventos', icono: 'activity' },
        { texto: 'Rankings', ruta: '/admin/rankings', icono: 'award' },
        { texto: 'Recompensas', ruta: '/admin/recompensas', icono: 'medal' },
        { texto: 'Tienda', ruta: '/admin/tienda', icono: 'wallet' },
        { texto: 'Certificados', ruta: '/admin/certificados', icono: 'certificate' },
      ],
    },
    {
      titulo: 'Comercial',
      elementos: [
        { texto: 'Pedidos', ruta: '/admin/pedidos', icono: 'file' },
        { texto: 'Pagos', ruta: '/admin/pagos', icono: 'wallet' },
        { texto: 'Reembolsos', ruta: '/admin/reembolsos', icono: 'inbox' },
        { texto: 'Cupones', ruta: '/admin/cupones', icono: 'medal' },
      ],
    },
    {
      titulo: 'Cuenta y sistema',
      elementos: [
        { texto: 'Mi perfil', ruta: '/admin/perfil', icono: 'users' },
        { texto: 'Notificaciones', ruta: '/admin/notificaciones', icono: 'bell' },
        { texto: 'Soporte', ruta: '/admin/soporte', icono: 'help' },
        { texto: 'Configuración', ruta: '/admin/configuracion', icono: 'cog' },
      ],
    },
  ];
}
