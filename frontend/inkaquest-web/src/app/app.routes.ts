import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/guards/auth.guard';

/**
 * Tablero de rutas de InkaQuest.
 *
 * <p>Todas las rutas de funcionalidad usan <b>lazy loading</b>: cada modulo
 * se carga solo cuando se visita, de modo que el bundle inicial se mantiene
 * pequeno.</p>
 *
 * <p>La proteccion se aplica en dos capas:
 * <ul>
 *   <li><b>Frontend</b> (guards): experiencia de usuario, evita pantallas
 *       inaccesibles.</li>
 *   <li><b>Backend</b> (Spring Security) y <b>base de datos</b> (RLS): la
 *       autorizacion real. Manipular el navegador no da acceso a los datos.</li>
 * </ul>
 */
export const routes: Routes = [
  /* ===========================================================================
     Layout publico
     ========================================================================= */
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),
    children: [
      {
        path: 'solicitar-acceso-docente',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/auth/teacher-request/teacher-request.component').then(
            (m) => m.TeacherRequestComponent,
          ),
        title: 'Solicitar acceso docente · InkaQuest',
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/public/home/home.component').then((m) => m.HomeComponent),
        title: 'InkaQuest · Aprende, codifica y avanza',
        data: {
          descripcion: 'Plataforma educativa universitaria con retos, progreso y recompensas.',
        },
      },
      {
        path: 'inicio',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/public/course-catalog/course-catalog.component').then(
            (m) => m.CourseCatalogComponent,
          ),
        title: 'Catálogo de cursos · InkaQuest',
      },
      {
        path: 'cursos/:slug',
        loadComponent: () =>
          import('./features/public/course-detail/course-detail.component').then(
            (m) => m.CourseDetailComponent,
          ),
        title: 'Curso · InkaQuest',
      },
      {
        path: 'sobre-nosotros',
        loadComponent: () =>
          import('./features/public/about/about.component').then((m) => m.AboutComponent),
        title: 'Sobre nosotros · InkaQuest',
      },
      {
        path: 'planes',
        loadComponent: () =>
          import('./features/public/pricing/pricing.component').then((m) => m.PricingComponent),
        title: 'Planes y precios · InkaQuest',
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./features/public/teachers/teachers.component').then((m) => m.TeachersComponent),
        title: 'Docentes · InkaQuest',
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('./features/public/faq/faq.component').then((m) => m.FaqComponent),
        title: 'Preguntas frecuentes · InkaQuest',
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('./features/public/contact/contact.component').then((m) => m.ContactComponent),
        title: 'Contacto · InkaQuest',
      },
      {
        path: 'testimonios',
        loadComponent: () =>
          import('./features/public/testimonials/testimonials.component').then(
            (m) => m.TestimonialsComponent,
          ),
        title: 'Testimonios · InkaQuest',
      },
      {
        path: 'verificar-certificado',
        loadComponent: () =>
          import('./features/public/certificate-verify/certificate-verify.component').then(
            (m) => m.CertificateVerifyComponent,
          ),
        title: 'Verificar certificado · InkaQuest',
      },
      {
        path: 'verificar-certificado/:codigo',
        loadComponent: () =>
          import('./features/public/certificate-verify/certificate-verify.component').then(
            (m) => m.CertificateVerifyComponent,
          ),
        title: 'Verificar certificado · InkaQuest',
      },
      {
        path: 'terminos',
        loadComponent: () =>
          import('./features/public/legal/legal.component').then((m) => m.LegalComponent),
        title: 'Términos y condiciones · InkaQuest',
        data: { tipo: 'terminos' },
      },
      {
        path: 'privacidad',
        loadComponent: () =>
          import('./features/public/legal/legal.component').then((m) => m.LegalComponent),
        title: 'Política de privacidad · InkaQuest',
        data: { tipo: 'privacidad' },
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/public/legal/legal.component').then((m) => m.LegalComponent),
        title: 'Pagos y reembolsos · InkaQuest',
        data: { tipo: 'pagos' },
      },
    ],
  },

  /* ===========================================================================
     Autenticacion
     ========================================================================= */
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Iniciar sesión · InkaQuest',
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Crear cuenta · InkaQuest',
      },
      {
        path: 'recuperar-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
        title: 'Recuperar contraseña · InkaQuest',
      },
      {
        path: 'auth/callback',
        loadComponent: () =>
          import('./features/auth/callback/auth-callback.component').then(
            (m) => m.AuthCallbackComponent,
          ),
        title: 'Confirmando correo · InkaQuest',
      },
      {
        path: 'auth/reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
        title: 'Restablecer contraseña · InkaQuest',
      },
    ],
  },

  /* ===========================================================================
     Solicitud de acceso docente (requiere sesion de estudiante)
     ========================================================================= */
  {
    path: 'solicitud-docente',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['estudiante'] },
    loadComponent: () =>
      import('./features/auth/teacher-request/teacher-request.component').then(
        (m) => m.TeacherRequestComponent,
      ),
    title: 'Solicitar acceso docente · InkaQuest',
  },

  /* ===========================================================================
     Panel del estudiante
     ========================================================================= */
  {
    path: 'estudiante',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['estudiante'] },
    loadComponent: () =>
      import('./layouts/student-layout/student-layout.component').then(
        (m) => m.StudentLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        title: 'Mi panel · InkaQuest',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/student/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Mi perfil · InkaQuest',
      },
      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/student/my-courses/my-courses.component').then(
            (m) => m.MyCoursesComponent,
          ),
        title: 'Mis cursos · InkaQuest',
      },
      {
        path: 'aula/:id',
        loadComponent: () =>
          import('./features/student/classroom/classroom.component').then(
            (m) => m.ClassroomComponent,
          ),
        title: 'Aula virtual · InkaQuest',
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('./features/student/assignments/assignments.component').then(
            (m) => m.AssignmentsComponent,
          ),
        title: 'Tareas · InkaQuest',
      },
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./features/student/evaluaciones/evaluaciones.component').then(
            (m) => m.EvaluationsComponent,
          ),
        title: 'Evaluaciones · InkaQuest',
      },
      {
        path: 'minijuegos',
        loadComponent: () =>
          import('./features/student/games/games.component').then((m) => m.GamesComponent),
        title: 'Minijuegos · InkaQuest',
      },
      {
        path: 'minijuegos/:id',
        loadComponent: () =>
          import('./features/student/game-detail/game-detail.component').then(
            (m) => m.GameDetailComponent,
          ),
        title: 'Detalle de minijuego · InkaQuest',
      },
      {
        path: 'jugar/:actividadJuegoId',
        loadComponent: () =>
          import('./features/student/jugar/juego-jugador.component').then(
            (m) => m.JuegoJugadorComponent,
          ),
        title: 'Jugar · InkaQuest',
      },
      {
        path: 'progreso',
        loadComponent: () =>
          import('./features/student/progress/progress.component').then(
            (m) => m.ProgressComponent,
          ),
        title: 'Mi progreso · InkaQuest',
      },
      {
        path: 'rendimiento',
        loadComponent: () =>
          import('./features/student/performance/performance.component').then(
            (m) => m.PerformanceComponent,
          ),
        title: 'Rendimiento · InkaQuest',
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/student/calendar/calendar.component').then(
            (m) => m.CalendarComponent,
          ),
        title: 'Calendario · InkaQuest',
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('./features/shared/chat/chat.component').then((m) => m.ChatComponent),
        title: 'Chat · InkaQuest',
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./features/student/announcements/announcements.component').then(
            (m) => m.StudentAnnouncementsComponent,
          ),
        title: 'Avisos · InkaQuest',
      },
      {
        path: 'comunidad',
        loadComponent: () =>
          import('./features/student/community/community.component').then(
            (m) => m.CommunityComponent,
          ),
        title: 'Comunidad · InkaQuest',
      },
      {
        path: 'gamificacion',
        loadComponent: () =>
          import('./features/student/gamification/gamification.component').then(
            (m) => m.GamificationComponent,
          ),
        title: 'Gamificación · InkaQuest',
      },
      {
        path: 'insignias',
        loadComponent: () =>
          import('./features/student/achievements/achievements.component').then(
            (m) => m.AchievementsComponent,
          ),
        title: 'Insignias · InkaQuest',
      },
      {
        path: 'rankings',
        loadComponent: () =>
          import('./features/student/rankings/rankings.component').then(
            (m) => m.RankingsComponent,
          ),
        title: 'Ranking · InkaQuest',
      },
      {
        path: 'recompensas',
        loadComponent: () =>
          import('./features/student/rewards/rewards.component').then(
            (m) => m.RewardsComponent,
          ),
        title: 'Recompensas · InkaQuest',
      },
      {
        path: 'tienda',
        loadComponent: () =>
          import('./features/student/store/store.component').then((m) => m.StoreComponent),
        title: 'Tienda · InkaQuest',
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/student/inventory/inventory.component').then(
            (m) => m.InventoryComponent,
          ),
        title: 'Inventario · InkaQuest',
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('./features/student/certificates/certificates.component').then(
            (m) => m.CertificatesComponent,
          ),
        title: 'Certificados · InkaQuest',
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/student/payments/payments.component').then(
            (m) => m.PaymentsComponent,
          ),
        title: 'Mis pagos · InkaQuest',
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/shared/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
        title: 'Notificaciones · InkaQuest',
      },
      {
        path: 'soporte',
        loadComponent: () =>
          import('./features/shared/support/support.component').then((m) => m.SupportComponent),
        title: 'Soporte · InkaQuest',
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('./features/shared/chatbot/chatbot.component').then((m) => m.ChatbotComponent),
        title: 'Asistente · InkaQuest',
      },    ],
  },

  /* ===========================================================================
     Panel del docente
     ========================================================================= */
  {
    path: 'docente',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['docente', 'administrador'] },
    loadComponent: () =>
      import('./layouts/teacher-layout/teacher-layout.component').then(
        (m) => m.TeacherLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        title: 'Panel docente · InkaQuest',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/teacher/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Perfil docente · InkaQuest',
      },
      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/teacher/courses/courses.component').then((m) => m.CoursesComponent),
        title: 'Mis cursos · InkaQuest',
      },
      {
        path: 'cursos/:id',
        loadComponent: () =>
          import('./features/teacher/course-editor/course-editor.component').then(
            (m) => m.CourseEditorComponent,
          ),
        title: 'Editar curso · InkaQuest',
      },
      {
        path: 'recursos',
        loadComponent: () =>
          import('./features/teacher/resources/resources.component').then(
            (m) => m.ResourcesComponent,
          ),
        title: 'Recursos y archivos · InkaQuest',
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('./features/teacher/assignments/assignments.component').then(
            (m) => m.AssignmentsComponent,
          ),
        title: 'Tareas · InkaQuest',
      },
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./features/teacher/evaluaciones/evaluaciones.component').then(
            (m) => m.EvaluationsComponent,
          ),
        title: 'Evaluaciones · InkaQuest',
      },
      {
        path: 'minijuegos',
        loadComponent: () =>
          import('./features/teacher/games/games.component').then((m) => m.GamesComponent),
        title: 'Minijuegos · InkaQuest',
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./features/teacher/students/students.component').then((m) => m.StudentsComponent),
        title: 'Estudiantes · InkaQuest',
      },
      {
        path: 'entregas',
        loadComponent: () =>
          import('./features/teacher/submissions/submissions.component').then(
            (m) => m.SubmissionsComponent,
          ),
        title: 'Entregas · InkaQuest',
      },
      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./features/teacher/grades/grades.component').then((m) => m.GradesComponent),
        title: 'Calificaciones · InkaQuest',
      },
      {
        path: 'analitica',
        loadComponent: () =>
          import('./features/teacher/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent,
          ),
        title: 'Analítica · InkaQuest',
      },
      {
        path: 'vista-previa',
        loadComponent: () =>
          import('./features/teacher/preview/preview.component').then((m) => m.PreviewComponent),
        title: 'Vista previa · InkaQuest',
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('./features/shared/chat/chat.component').then((m) => m.ChatComponent),
        title: 'Chat · InkaQuest',
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/teacher/calendar/calendar.component').then((m) => m.CalendarComponent),
        title: 'Calendario · InkaQuest',
      },
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./features/teacher/seguimiento/seguimiento.component').then(
            (m) => m.SeguimientoComponent,
          ),
        title: 'Seguimiento · InkaQuest',
      },
      {
        path: 'anuncios',
        loadComponent: () =>
          import('./features/teacher/announcements/announcements.component').then(
            (m) => m.AnnouncementsComponent,
          ),
        title: 'Anuncios · InkaQuest',
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/shared/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
        title: 'Notificaciones · InkaQuest',
      },
      {
        path: 'soporte',
        loadComponent: () =>
          import('./features/shared/support/support.component').then((m) => m.SupportComponent),
        title: 'Soporte · InkaQuest',
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('./features/shared/chatbot/chatbot.component').then((m) => m.ChatbotComponent),
        title: 'Asistente · InkaQuest',
      },    ],
  },

  /* ===========================================================================
     Panel del administrador
     ========================================================================= */
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['administrador'] },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Panel admin · InkaQuest',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/users/users.component').then((m) => m.UsersComponent),
        title: 'Usuarios · InkaQuest',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/admin/teacher-requests/teacher-requests.component').then(
            (m) => m.TeacherRequestsComponent,
          ),
        title: 'Solicitudes docentes · InkaQuest',
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./features/admin/students/students.component').then((m) => m.StudentsComponent),
        title: 'Estudiantes · InkaQuest',
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./features/admin/teachers/teachers.component').then((m) => m.TeachersComponent),
        title: 'Docentes · InkaQuest',
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/admin/roles/roles.component').then((m) => m.RolesComponent),
        title: 'Roles · InkaQuest',
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./features/admin/permissions/permissions.component').then(
            (m) => m.PermissionsComponent,
          ),
        title: 'Permisos · InkaQuest',
      },
      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/admin/courses/courses.component').then((m) => m.CoursesComponent),
        title: 'Gestión de cursos · InkaQuest',
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/admin/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
        title: 'Categorías · InkaQuest',
      },
      {
        path: 'unidades',
        loadComponent: () =>
          import('./features/admin/units/units.component').then((m) => m.UnitsComponent),
        title: 'Unidades · InkaQuest',
      },
      {
        path: 'lecciones',
        loadComponent: () =>
          import('./features/admin/lessons/lessons.component').then((m) => m.LessonsComponent),
        title: 'Lecciones · InkaQuest',
      },
      {
        path: 'recursos',
        loadComponent: () =>
          import('./features/admin/resources/resources.component').then((m) => m.ResourcesComponent),
        title: 'Recursos · InkaQuest',
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./features/admin/enrollments/enrollments.component').then(
            (m) => m.EnrollmentsComponent,
          ),
        title: 'Matrículas · InkaQuest',
      },
      {
        path: 'actividades',
        loadComponent: () =>
          import('./features/admin/activities/activities.component').then(
            (m) => m.ActivitiesComponent,
          ),
        title: 'Actividades · InkaQuest',
      },
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./features/admin/evaluations/evaluations.component').then(
            (m) => m.EvaluationsComponent,
          ),
        title: 'Evaluaciones · InkaQuest',
      },
      {
        path: 'motores-juegos',
        loadComponent: () =>
          import('./features/admin/game-engines/game-engines.component').then(
            (m) => m.GameEnginesComponent,
          ),
        title: 'Motores de juegos · InkaQuest',
      },
      {
        path: 'gamificacion',
        loadComponent: () =>
          import('./features/admin/gamification/gamification.component').then(
            (m) => m.GamificationComponent,
          ),
        title: 'Gamificación · InkaQuest',
      },
      {
        path: 'insignias',
        loadComponent: () =>
          import('./features/admin/badges/badges.component').then((m) => m.BadgesComponent),
        title: 'Insignias · InkaQuest',
      },
      {
        path: 'eventos',
        loadComponent: () =>
          import('./features/admin/events/events.component').then((m) => m.EventsComponent),
        title: 'Eventos · InkaQuest',
      },
      {
        path: 'rankings',
        loadComponent: () =>
          import('./features/admin/rankings/rankings.component').then((m) => m.RankingsComponent),
        title: 'Rankings · InkaQuest',
      },
      {
        path: 'recompensas',
        loadComponent: () =>
          import('./features/admin/rewards/rewards.component').then((m) => m.RewardsComponent),
        title: 'Recompensas · InkaQuest',
      },
      {
        path: 'tienda',
        loadComponent: () =>
          import('./features/admin/store/store.component').then((m) => m.StoreComponent),
        title: 'Tienda · InkaQuest',
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('./features/admin/certificates/certificates.component').then(
            (m) => m.CertificatesComponent,
          ),
        title: 'Certificados · InkaQuest',
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/admin/orders/orders.component').then((m) => m.OrdersComponent),
        title: 'Pedidos · InkaQuest',
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/admin/payments/payments.component').then((m) => m.PaymentsComponent),
        title: 'Pagos · InkaQuest',
      },
      {
        path: 'reembolsos',
        loadComponent: () =>
          import('./features/admin/refunds/refunds.component').then((m) => m.RefundsComponent),
        title: 'Reembolsos · InkaQuest',
      },
      {
        path: 'cupones',
        loadComponent: () =>
          import('./features/admin/coupons/coupons.component').then((m) => m.CouponsComponent),
        title: 'Cupones · InkaQuest',
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/admin/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
        title: 'Notificaciones · InkaQuest',
      },
      {
        path: 'soporte',
        loadComponent: () =>
          import('./features/admin/support/support.component').then((m) => m.SupportComponent),
        title: 'Soporte · InkaQuest',
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('./features/shared/chatbot/chatbot.component').then((m) => m.ChatbotComponent),
        title: 'Asistente · InkaQuest',
      },      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then((m) => m.ReportsComponent),
        title: 'Reportes · InkaQuest',
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/admin/audit/audit.component').then((m) => m.AuditComponent),
        title: 'Auditoría · InkaQuest',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/admin/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Mi perfil · InkaQuest',
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Configuración · InkaQuest',
      },
    ],
  },

  /* ===========================================================================
     Wildcard
     ========================================================================= */
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Página no encontrada · InkaQuest',
  },
];
