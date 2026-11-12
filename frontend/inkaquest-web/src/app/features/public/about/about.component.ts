import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Pagina institucional "Sobre nosotros".
 *
 * <p>El contenido es editorial estatico: describe la institucion (historia,
 * mision, vision, objetivos y valores), por lo que no consulta la base de
 * datos.</p>
 *
 * <p>El bloque de equipo <b>no se inventa</b>: se muestra un estado honesto
 * que explica que el catalogo de docentes se publicara cuando el
 * administrador habilite la lectura publica de los perfiles.</p>
 */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <!-- ================= HERO ================= -->
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-16 md:py-24">
        <div class="mx-auto max-w-3xl text-center">
          <app-logo [alto]="68" variante="sobre-oscuro" class="mx-auto" />
          <p class="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.22em] text-gold-300 uppercase ring-1 ring-white/15">Sobre InkaQuest</p>
          <h1 class="mt-4 text-white">Aprende · Codifica · Avanza</h1>
          <p class="mt-5 text-lg leading-relaxed text-marine-100">
            Somos una plataforma educativa que enseña programación con práctica real, rutas claras y una progresión que hace visible cada avance.
          </p>
        </div>
      </div>
    </section>

    <!-- ================= HISTORIA ================= -->
    <section class="section">
      <div class="container-app grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase">Historia</p>
          <h2 class="mt-2">De la idea al aula virtual</h2>
        </div>
        <div class="space-y-4 text-marine-600">
          @for (parrafo of historia; track parrafo) {
            <p class="leading-relaxed">{{ parrafo }}</p>
          }
        </div>
      </div>
    </section>

    <!-- ================= MISION Y VISION ================= -->
    <section class="section bg-surface-50">
      <div class="container-app grid gap-6 md:grid-cols-2">
        <article class="card card-body border-l-4 border-l-brand-500">
          <span
            class="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600"
          >
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          </span>
          <h2 class="mt-4 text-xl">Mision</h2>
          <p class="mt-3 leading-relaxed text-marine-600">{{ mision }}</p>
        </article>

        <article class="card card-body border-l-4 border-l-gold-500">
          <span
            class="flex size-11 items-center justify-center rounded-full bg-gold-50 text-gold-600"
          >
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke-linejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <h2 class="mt-4 text-xl">Vision</h2>
          <p class="mt-3 leading-relaxed text-marine-600">{{ vision }}</p>
        </article>
      </div>
    </section>

    <!-- ================= OBJETIVOS ================= -->
    <section class="section">
      <div class="container-app">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase">Proposito</p>
          <h2 class="mt-2">Objetivos académicos</h2>
          <p class="mt-3 text-marine-500">
            Lo que la plataforma persigue medir en cada estudiante.
          </p>
        </div>

        <ol class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (objetivo of objetivos; track objetivo.numero) {
            <li class="card card-body">
              <span
                class="flex size-10 items-center justify-center rounded-full bg-marine-700 text-sm font-bold text-white"
              >
                {{ objetivo.numero }}
              </span>
              <h3 class="mt-4 text-lg font-semibold text-marine-700">{{ objetivo.titulo }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-marine-500">{{ objetivo.descripcion }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- ================= VALORES ================= -->
    <section class="section bg-marine-700 text-white">
      <div class="container-app">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">Identidad</p>
          <h2 class="mt-2 text-white">Los valores que nos guian</h2>
        </div>

        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (valor of valores; track valor.titulo) {
            <article class="rounded-card border border-white/10 bg-white/10 p-6 backdrop-blur">
              <h3 class="text-lg font-semibold text-white">{{ valor.titulo }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-marine-200">{{ valor.descripcion }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- ================= EQUIPO ================= -->
    <section class="section">
      <div class="container-app">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase">Equipo</p>
          <h2 class="mt-2">Equipo docente</h2>
        </div>

        <!--
          Estado honesto: la tabla perfil solo es legible por el propio
          usuario, por los administradores y por los docentes del curso
          (politicas RLS). Mientras el administrador no habilite la lectura
          publica de los perfiles, esta pantalla no puede mostrar nombres.
        -->
        <div class="card mx-auto mt-10 max-w-3xl">
          <div class="state-block">
            <div
              class="flex size-14 items-center justify-center rounded-full bg-surface-100 text-brand-500"
            >
              <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="9.5" cy="7.5" r="3.5" />
                <path d="M17 11.5a3 3 0 1 0 0-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-marine-700">
              El equipo docente aún no es público
            </h3>
            <p class="max-w-lg text-sm leading-relaxed text-marine-500">
              La ficha de cada docente vive en la tabla de perfiles, que por
              proteccion de datos solo puede leer el propio docente, los
              administradores y los docentes responsables de un curso. El
              equipo se publicará en esta página cuando el administrador
              habilite expresamente esa lectura publica.
            </p>
            <a routerLink="/docentes" class="btn btn-outline btn-md mt-2">
              Ver los cursos del catálogo
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= IDENTIDAD ================= -->
    <section class="section bg-surface-50">
      <div class="container-app grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase">
            Identidad institucional
          </p>
          <h2 class="mt-2">Una marca construida para la comunidad educativa</h2>
          <p class="mt-4 leading-relaxed text-marine-600">
            InkaQuest reúne la rigor de la formación universitaria con la
            práctica diaria del aula virtual. El nombre hace honor a la
            civilización andina que inspira nuestra identidad gráfica: los rombos
            del fondo institucional y el dorado de las recompensas.
          </p>

          <dl class="mt-8 grid gap-4 sm:grid-cols-2">
            @for (tono of paleta; track tono.nombre) {
              <div class="card flex items-center gap-3 p-4">
                <span
                  class="size-10 shrink-0 rounded-card border border-surface-200"
                  [class.bg-marine-700]="tono.clase === 'bg-marine-700'"
                  [class.bg-brand-500]="tono.clase === 'bg-brand-500'"
                  [class.bg-gold-500]="tono.clase === 'bg-gold-500'"
                  [class.bg-surface-100]="tono.clase === 'bg-surface-100'"
                  aria-hidden="true"
                ></span>
                <div class="min-w-0">
                  <dt class="text-sm font-semibold text-marine-700">{{ tono.nombre }}</dt>
                  <dd class="text-xs text-marine-500">{{ tono.hex }}</dd>
                </div>
              </div>
            }
          </dl>
        </div>

        <div class="card card-body bg-white text-center">
          <app-logo [alto]="96" class="mx-auto" />
          <p class="mt-5 text-2xl font-bold text-marine-700">InkaQuest</p>
          <p class="mt-1 text-xs font-semibold tracking-[0.25em] text-brand-600 uppercase">
            Aprende · Codifica · Avanza
          </p>
          <p class="mt-4 text-sm text-marine-500">
            Logotipo oficial utilizado en toda la plataforma. Su uso en documentos
            oficiales, certificados y comunicaciones de la institucion esta
            reservado a los administradores.
          </p>
        </div>
      </div>
    </section>

    <!-- ================= CTA ================= -->
    <section class="section">
      <div class="container-app">
        <div class="card overflow-hidden bg-brand-gradient p-10 text-center md:p-14">
          <h2 class="mx-auto max-w-2xl text-white">Conoce la plataforma por dentro</h2>
          <p class="mx-auto mt-4 max-w-xl text-marine-100">
            Explora el catálogo de cursos, sus retos y el sistema de progreso que
            registra cada avance.
          </p>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a routerLink="/cursos" class="btn btn-gold btn-lg">Ver el catálogo</a>
            <a routerLink="/contacto" class="btn btn-outline-light btn-lg">Contáctanos</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  /** Parrafos de la historia institucional. */
  protected readonly historia: readonly string[] = [
    'InkaQuest nació de una convicción simple: aprender a programar no se explica, se practica. Las clases presenciales mostraban el algoritmo, pero el estudiante no se enteraba de por qué su código fallaba hasta la entrega del trabajo.',
    'Por eso construimos una plataforma donde cada lección termina en algo ejecutable. Los retos se evalúan al instante, cada error explica en qué caso de prueba falló y el avance queda registrado con XP, insignias y certificados verificables.',
    'La plataforma hoy sostiene un catálogo completo de cursos de programación, con teoría, práctica, evaluaciones y retos, y un panel docente para que cada profesor acompañe a sus estudiantes con datos reales y no con intuiciones.',
  ];

  /** Declaracion de mision. */
  protected readonly mision =
    'Formar a estudiantes de programación con una práctica sostenida y verificable, en lugar de un uso pasivo, y con el acompañamiento de docentes que tienen datos reales del progreso de cada alumno.';

  /** Declaracion de vision. */
  protected readonly vision =
    'Ser el referente de la enseñanza de programación en el país: una comunidad donde aprender a codificar sea accesible, medible y sostenible, y donde cada certificado emitido pueda verificarse en un clic.';

  /** Objetivos academicos de la plataforma. */
  protected readonly objetivos: readonly {
    numero: number;
    titulo: string;
    descripcion: string;
  }[] = [
    {
      numero: 1,
      titulo: 'Práctica deliberada',
      descripcion:
        'Cada concepto se aplica en un reto evaluado automáticamente, con retroalimentación inmediata sobre los casos que fallan.',
    },
    {
      numero: 2,
      titulo: 'Progreso medible',
      descripcion:
        'El avance se registra en la base de datos: porcentaje completado, XP otorgado y tiempo de estudio real.',
    },
    {
      numero: 3,
      titulo: 'Seguimiento docente',
      descripcion:
        'Los docentes responsables de cada curso ven entregas, calificaciones y datos de sus propios estudiantes.',
    },
    {
      numero: 4,
      titulo: 'Certificación verificable',
      descripcion:
        'Al completar un curso se emite un certificado con código único que cualquier persona puede comprobar.',
    },
    {
      numero: 5,
      titulo: 'Acceso universal',
      descripcion:
        'Los cursos gratuitos permiten empezar sin fricción: crear cuenta, matricularse y aprender el mismo día.',
    },
    {
      numero: 6,
      titulo: 'Calidad sostenida',
      descripcion:
        'El contenido se versiona en la plataforma y cada curso tiene un responsable docente asignado.',
    },
  ];

  /** Valores institucionales. */
  protected readonly valores: readonly { titulo: string; descripcion: string }[] = [
    {
      titulo: 'Rigor',
      descripcion:
        'El contenido se explica con precisión y los retos tienen casos de prueba reales, no ejercicios de juguete.',
    },
    {
      titulo: 'Transparencia',
      descripcion:
        'El progreso, el precio y el estado de cada certificado son datos verificables por cualquier persona.',
    },
    {
      titulo: 'Accesibilidad',
      descripcion:
        'Cursos gratuitos de entrada y acceso desde cualquier dispositivo, para que las circunstancias no decidan quién aprende.',
    },
    {
      titulo: 'Respeta al docente',
      descripcion:
        'Quien enseña tiene herramientas propias para calificar, comparar y acompañar a cada estudiante.',
    },
    {
      titulo: 'Aprendizaje visible',
      descripcion:
        'Nada de progreso oculto: cada lección completada deja una huella que el estudiante puede mostrar.',
    },
    {
      titulo: 'Comunidad',
      descripcion:
        'La plataforma conecta estudiantes y docentes de distintas instituciones alrededor de un mismo objetivo.',
    },
  ];

  /** Paleta institucional con su codigo hexadecimal. */
  protected readonly paleta: readonly { nombre: string; hex: string; clase: string }[] = [
    { nombre: 'Azul marino', hex: '#1B2A4A', clase: 'bg-marine-700' },
    { nombre: 'Verde azulado', hex: '#12736B', clase: 'bg-brand-500' },
    { nombre: 'Dorado', hex: '#F2A541', clase: 'bg-gold-500' },
    { nombre: 'Superficie', hex: '#EAF3F2', clase: 'bg-surface-100' },
  ];
}
