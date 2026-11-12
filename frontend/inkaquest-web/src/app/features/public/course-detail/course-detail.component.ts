import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import {
  Actividad,
  Curso,
  Leccion,
  Modulo,
  Unidad,
} from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { imagenDeCurso } from '../../../shared/utilities/curso-imagen.util';

/**
 * Detalle público de un curso.
 *
 * <p>Muestra portada, información, precio, matrícula y estructura académica
 * (unidades, módulos, lecciones y actividades) con datos reales del catálogo.</p>
 */
@Component({
  selector: 'app-course-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    LogoComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="course-detail">
      <section class="detail-hero">
        <div class="container-app detail-hero__inner">
          <nav class="detail-breadcrumb" aria-label="Ruta de navegación">
            <a routerLink="/cursos">Cursos</a>
            <span aria-hidden="true">/</span>
            @if (curso()) {
              <span class="detail-breadcrumb__current">{{ curso()!.titulo }}</span>
            } @else {
              <span class="detail-breadcrumb__current">Detalle</span>
            }
          </nav>
          <a routerLink="/cursos" class="detail-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Volver al catálogo
          </a>

          @if (!cargando() && curso()) {
            <div class="detail-hero__content">
              <div class="detail-badges detail-badges--hero">
                <app-status-badge [estado]="curso()!.estado" />
                @if (curso()!.precio === 0) {
                  <span class="badge badge-gold">Gratuito</span>
                }
              </div>
              <h1 class="detail-hero__title">{{ curso()!.titulo }}</h1>
            </div>
          }
        </div>
      </section>

      <section class="detail-page">
        <div class="container-app">
          @if (cargando()) {
            <div class="detail-card card detail-loading">
              <div class="detail-loading__media"><app-skeleton alto="100%" radio="0" /></div>
              <div class="detail-loading__info">
                <app-skeleton alto="1rem" ancho="40%" />
                <app-skeleton alto="2rem" ancho="85%" />
                <app-skeleton alto="1rem" />
                <app-skeleton alto="1rem" ancho="90%" />
                <div class="detail-loading__meta">
                  <app-skeleton alto="4.5rem" radio="0.9rem" />
                  <app-skeleton alto="4.5rem" radio="0.9rem" />
                  <app-skeleton alto="4.5rem" radio="0.9rem" />
                  <app-skeleton alto="4.5rem" radio="0.9rem" />
                </div>
                <app-skeleton alto="3rem" radio="0.9rem" />
              </div>
            </div>
          } @else if (!curso()) {
            <div class="detail-empty card">
              <app-logo [alto]="56" />
              <h1>No encontramos ese curso</h1>
              <p>
                Puede que no esté publicado, que el enlace sea incorrecto o que no tengas acceso con tu sesión actual.
              </p>
              <a routerLink="/cursos" class="btn btn-primary btn-md">Ver el catálogo</a>
            </div>
          } @else {
            <article class="detail-article">
              <section class="detail-card card">
                <div class="detail-card__media">
                  <img
                    [src]="imagen()"
                    [alt]="'Portada del curso ' + curso()!.titulo"
                    class="detail-card__image"
                    decoding="async"
                  />
                </div>

                <div class="detail-card__info">
                  @if (curso()!.descripcion) {
                    <p class="detail-description">{{ curso()!.descripcion }}</p>
                  }

                  <div class="detail-meta" aria-label="Información del curso">
                    <div class="detail-meta__item">
                      <span class="detail-meta__label">Precio</span>
                      <span class="detail-meta__value detail-meta__value--price" [class.is-free]="curso()!.precio === 0">{{ precio() }}</span>
                    </div>
                    <div class="detail-meta__item">
                      <span class="detail-meta__label">Duración</span>
                      <span class="detail-meta__value">{{ duracion() }}</span>
                    </div>
                    <div class="detail-meta__item">
                      <span class="detail-meta__label">Unidades</span>
                      <span class="detail-meta__value">{{ unidades().length }}</span>
                    </div>
                    <div class="detail-meta__item">
                      <span class="detail-meta__label">Progresión</span>
                      <span class="detail-meta__value detail-meta__value--xp">{{ curso()!.xp_total }} XP</span>
                    </div>
                  </div>

                  @if (mensaje()) {
                    <p
                      class="detail-message"
                      [class.detail-message--ok]="exito()"
                      [class.detail-message--error]="!exito()"
                      role="status"
                    >{{ mensaje() }}</p>
                  }

                  <div class="detail-cta">
                    @if (auth.autenticado()) {
                      @if (yaMatriculado()) {
                        <a [routerLink]="['/estudiante/aula', curso()!.id]" class="btn btn-primary btn-lg w-full">
                          Ir al aula
                        </a>
                        <p class="detail-cta__hint">Ya tienes este curso. Apréndelo a tu ritmo desde tu aula.</p>
                      } @else if (estadoMatricula() === 'pendiente_pago') {
                        <a
                          routerLink="/estudiante/pagos"
                          [queryParams]="{ matricula: 'pendiente', curso: curso()!.id }"
                          class="btn btn-primary btn-lg w-full"
                        >
                          Completar pago
                        </a>
                        <p class="detail-cta__hint">Tu solicitud quedó pendiente de pago. Complétalo para activar el acceso al curso.</p>
                      } @else {
                        <app-button
                          variante="primario"
                          tamano="lg"
                          [cargando]="enviando()"
                          [deshabilitado]="false"
                          (alPulsar)="solicitarMatricula()"
                          class="w-full"
                        >
                          {{ curso()!.precio > 0 ? 'Inscribirme y pagar' : 'Inscribirme gratis' }}
                        </app-button>
                        @if (curso()!.precio > 0) {
                          <p class="detail-cta__hint">Al inscribirte se registrará tu solicitud y serás dirigido a pagos para completar el proceso.</p>
                        }
                      }
                    } @else {
                      <a routerLink="/registro" class="btn btn-primary btn-lg w-full">Crear cuenta para matricularme</a>
                      <p class="detail-cta__hint">
                        ¿Ya tienes cuenta? <a routerLink="/login" class="detail-link">Inicia sesión</a> para inscribirte.
                      </p>
                    }
                  </div>
                </div>
              </section>

              <div class="detail-layout">
                <div class="detail-content">
                  <section class="detail-section card">
                    <div class="detail-section__head">
                      <h2>Contenido del curso</h2>
                      <p>Programa organizado por unidades, módulos y lecciones.</p>
                    </div>

                    @if (unidades().length === 0) {
                      <div class="detail-placeholder">
                        <p>El contenido del curso se está preparando. Vuelve pronto para ver el programa completo.</p>
                      </div>
                    } @else {
                      <div class="detail-units">
                        @for (unidad of unidades(); track unidad.id; let i = $index) {
                          <details class="detail-unit" [open]="i === 0">
                            <summary class="detail-unit__summary">
                              <span class="detail-unit__index">{{ i + 1 }}</span>
                              <span class="detail-unit__text">
                                <span class="detail-unit__title">{{ unidad.titulo }}</span>
                                @if (unidad.descripcion) {
                                  <span class="detail-unit__desc">{{ unidad.descripcion }}</span>
                                }
                              </span>
                              <span class="detail-unit__meta">
                                <svg class="detail-unit__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                  <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </span>
                            </summary>
                            <div class="detail-unit__body">
                              @for (modulo of unidad.modulos; track modulo.id) {
                                <div class="detail-module">
                                  <h4>{{ modulo.titulo }}</h4>
                                  @if (modulo.lecciones.length > 0) {
                                    <ul class="detail-lessons">
                                      @for (leccion of modulo.lecciones; track leccion.id) {
                                        <li [class.detail-lessons__item--no-time]="!leccion.duracion_minutos">
                                          <span class="detail-lesson__dot" aria-hidden="true"></span>
                                          <span class="detail-lesson__title">{{ leccion.titulo }}</span>
                                          @if (leccion.duracion_minutos > 0) {
                                            <span class="detail-lesson__time">{{ leccion.duracion_minutos }} min</span>
                                          }
                                        </li>
                                      }
                                    </ul>
                                  } @else {
                                    <p class="detail-module__empty">Sin lecciones cargadas.</p>
                                  }
                                </div>
                              }
                              @if (unidad.modulos.length === 0) {
                                <p class="detail-module__empty">Sin módulos cargados en esta unidad.</p>
                              }
                            </div>
                          </details>
                        }
                      </div>
                    }
                  </section>

                  @if (actividades().length > 0) {
                    <section class="detail-section card">
                      <div class="detail-section__head">
                        <h2>Actividades</h2>
                        <p>Prácticas y evaluaciones asociadas al curso.</p>
                      </div>
                      <div class="detail-activities">
                        @for (actividad of actividades(); track actividad.id) {
                          <div class="detail-activity">
                            <span class="detail-activity__icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11l3 3L22 4" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </span>
                            <div class="detail-activity__content">
                              <h3>{{ actividad.titulo }}</h3>
                              @if (actividad.descripcion) {
                                <p>{{ actividad.descripcion }}</p>
                              }
                              <div class="detail-activity__tags">
                                <span class="badge badge-neutral">{{ actividad.tipo }}</span>
                                @if (actividad.xp_otorgado > 0) {
                                  <span class="badge badge-gold">{{ actividad.xp_otorgado }} XP</span>
                                }
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </section>
                  }
                </div>

                <aside class="detail-aside">
                  <div class="card detail-aside__card">
                    <h2>Qué incluye</h2>
                    <ul class="detail-benefits">
                      <li><span class="check" aria-hidden="true"></span>Acceso al contenido publicado del curso.</li>
                      <li><span class="check" aria-hidden="true"></span>Unidades, lecciones y actividades según disponibilidad.</li>
                      <li><span class="check" aria-hidden="true"></span>{{ curso()!.xp_total }} XP de progresión total.</li>
                      <li><span class="check" aria-hidden="true"></span>Seguimiento de avance y certificación según las reglas de la plataforma.</li>
                    </ul>
                  </div>

                  <div class="card detail-aside__card detail-aside__card--dark">
                    <h2>Explora más cursos</h2>
                    <p>Descubre otros cursos del catálogo y continúa tu ruta de aprendizaje.</p>
                    <a routerLink="/cursos" class="btn btn-gold btn-md w-full">Ir al catálogo</a>
                  </div>
                </aside>
              </div>
            </article>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .course-detail { background: #f3f7f6; min-height: 100%; }

    /* Hero: bloque azul independiente, sin solapamientos */
    .detail-hero {
      background: linear-gradient(135deg, #14233d 0%, #1b2a4a 60%, #153a47 100%);
      color: #fff;
    }
    .detail-hero__inner {
      padding: 1.1rem 1rem 1.6rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .detail-breadcrumb {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem;
      font-size: 0.82rem; color: #c7d8d5;
    }
    .detail-breadcrumb a { color: #dff0ec; text-decoration: none; font-weight: 600; }
    .detail-breadcrumb a:hover { color: #fff; text-decoration: underline; text-underline-offset: 2px; }
    .detail-breadcrumb__current { color: #fff; font-weight: 600; }
    .detail-back {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 0.45rem;
      color: #e7f2ef; text-decoration: none; font-size: 0.9rem; font-weight: 700;
      padding: 0.45rem 0.7rem; border-radius: 0.65rem; border: 1px solid rgba(255,255,255,.16);
      background: rgba(255,255,255,.06); transition: background 160ms ease;
    }
    .detail-back:hover { background: rgba(255,255,255,.12); }
    .detail-back svg { width: 1rem; height: 1rem; }
    .detail-hero__content { padding-top: 0.35rem; display: grid; gap: 0.65rem; max-width: 60rem; }
    .detail-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .detail-badges--hero :deep(.badge), .detail-badges--hero .badge { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
    .detail-hero__title {
      margin: 0; font-size: clamp(1.65rem, 2.6vw, 2.4rem); line-height: 1.18;
      font-weight: 800; letter-spacing: -0.02em; color: #fff;
    }

    /* Página: contenido sobre fondo claro, separado del hero */
    .detail-page { padding: 1.5rem 0 3rem; }
    .detail-article { display: grid; gap: 1.5rem; }

    /* Tarjeta principal (portada + info) */
    .detail-card {
      display: grid; grid-template-columns: 1fr; overflow: hidden;
      border: 1px solid #dde8e5; background: #fff;
      box-shadow: 0 10px 30px rgba(27,42,74,.08);
    }
    .detail-card__media {
      background: #eaf3f2; aspect-ratio: 16 / 9; max-height: 22rem; overflow: hidden;
    }
    .detail-card__image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .detail-card__info { padding: 1.25rem; display: flex; flex-direction: column; gap: 1.1rem; }

    .detail-description { margin: 0; color: #4b6079; font-size: 1rem; line-height: 1.7; }

    /* Gestalt: proximidad/agrupación en metadatos */
    .detail-meta { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.75rem; }
    .detail-meta__item {
      background: #f7fbfa; border: 1px solid #e2ece9; border-radius: 0.85rem;
      padding: 0.8rem 0.9rem; display: grid; gap: 0.2rem;
    }
    .detail-meta__label { font-size: 0.72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #6b8199; }
    .detail-meta__value { font-size: 1.05rem; font-weight: 800; color: #1b2a4a; line-height: 1.2; }
    .detail-meta__value--price { color: #12736b; }
    .detail-meta__value--price.is-free { color: #b45309; }
    .detail-meta__value--xp { color: #b45309; }

    .detail-message { margin: 0; padding: 0.8rem 1rem; border-radius: 0.8rem; font-size: 0.92rem; font-weight: 500; }
    .detail-message--ok { background: #ecfdf3; color: #166534; border: 1px solid #bbf7d0; }
    .detail-message--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .detail-cta { display: grid; gap: 0.55rem; margin-top: 0.1rem; }
    .detail-cta__hint { margin: 0; font-size: 0.85rem; color: #647b91; line-height: 1.55; }
    .detail-link { color: #12736b; font-weight: 700; }

    /* Layout inferior: contenido + aside alineados */
    .detail-layout { display: grid; gap: 1.25rem; align-items: start; }
    .detail-content { display: grid; gap: 1.25rem; min-width: 0; }
    .detail-section { border: 1px solid #dde8e5; background: #fff; padding: 1.25rem; }
    .detail-section__head { display: grid; gap: 0.25rem; margin-bottom: 1rem; }
    .detail-section__head h2 { margin: 0; font-size: 1.35rem; font-weight: 800; color: #1b2a4a; }
    .detail-section__head p { margin: 0; color: #5d7389; font-size: 0.95rem; }
    .detail-placeholder { padding: 1.25rem; border: 1px dashed #cfe0dc; border-radius: 0.8rem; color: #5d7389; text-align: center; }
    .detail-placeholder p { margin: 0; }

    .detail-units { display: grid; gap: 0.75rem; }
    .detail-unit { border: 1px solid #e2ece9; border-radius: 0.9rem; overflow: hidden; background: #fff; }
    .detail-unit__summary {
      list-style: none; cursor: pointer; display: grid; grid-template-columns: auto 1fr auto;
      align-items: center; gap: 0.85rem; padding: 0.95rem 1rem; background: #fff;
    }
    .detail-unit__summary::-webkit-details-marker { display: none; }
    .detail-unit__index {
      width: 2.15rem; height: 2.15rem; border-radius: 0.65rem; background: #12736b; color: #fff;
      display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;
    }
    .detail-unit__text { min-width: 0; display: grid; gap: 0.15rem; }
    .detail-unit__title { font-size: 0.98rem; font-weight: 800; color: #1b2a4a; }
    .detail-unit__desc { font-size: 0.87rem; color: #60758b; line-height: 1.45; }
    .detail-unit__meta { display: inline-flex; align-items: center; gap: 0.55rem; }
    .detail-unit__chevron { width: 1.1rem; height: 1.1rem; color: #7a90a6; transition: transform 160ms ease; }
    details[open] .detail-unit__chevron { transform: rotate(180deg); }
    .detail-unit__body { border-top: 1px solid #e8f0ee; background: #fbfdfd; padding: 0.95rem 1rem 1rem; display: grid; gap: 0.9rem; }
    .detail-module h4 { margin: 0 0 0.45rem; font-size: 0.93rem; font-weight: 800; color: #243b5a; }
    .detail-lessons { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35rem; }
    .detail-lessons li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.55rem; font-size: 0.9rem; color: #3f556d; padding: 0.25rem 0; }
    .detail-lessons li.detail-lessons__item--no-time { grid-template-columns: auto 1fr; }
    .detail-lesson__dot { width: 0.42rem; height: 0.42rem; border-radius: 999px; background: #12736b; }
    .detail-lesson__time { color: #7a90a6; font-size: 0.82rem; white-space: nowrap; }
    .detail-module__empty { margin: 0; font-size: 0.87rem; color: #7a90a6; }

    .detail-activities { display: grid; gap: 0.75rem; }
    .detail-activity {
      display: flex; gap: 0.85rem; align-items: flex-start; padding: 0.95rem 1rem;
      border: 1px solid #e2ece9; border-radius: 0.85rem; background: #fbfdfd;
    }
    .detail-activity__icon {
      width: 2.3rem; height: 2.3rem; border-radius: 0.7rem; background: #e8f4f2; color: #12736b;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .detail-activity__icon svg { width: 1.1rem; height: 1.1rem; }
    .detail-activity__content { min-width: 0; flex: 1; }
    .detail-activity__content h3 { margin: 0; font-size: 0.98rem; font-weight: 800; color: #1b2a4a; }
    .detail-activity__content p { margin: 0.25rem 0 0; font-size: 0.9rem; color: #5c7289; line-height: 1.55; }
    .detail-activity__tags { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; }

    .detail-aside { display: grid; gap: 1rem; }
    .detail-aside__card { padding: 1.2rem; border: 1px solid #dde8e5; }
    .detail-aside__card h2 { margin: 0; font-size: 1.12rem; font-weight: 800; color: #1b2a4a; }
    .detail-benefits { list-style: none; margin: 0.85rem 0 0; padding: 0; display: grid; gap: 0.65rem; }
    .detail-benefits li { display: flex; gap: 0.55rem; align-items: flex-start; color: #445d77; font-size: 0.92rem; line-height: 1.5; }
    .detail-benefits .check { width: 1rem; height: 1rem; border-radius: 999px; background: #12736b; flex-shrink: 0; margin-top: 0.12rem; position: relative; }
    .detail-benefits .check::after { content: ''; position: absolute; left: 0.3rem; top: 0.18rem; width: 0.26rem; height: 0.46rem; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
    .detail-aside__card--dark { background: linear-gradient(160deg, #1b2a4a, #223a52); border: none; color: #fff; }
    .detail-aside__card--dark h2 { color: #fff; }
    .detail-aside__card--dark p { margin: 0.45rem 0 0.95rem; color: #d6e4e1; font-size: 0.92rem; line-height: 1.55; }

    .detail-loading { grid-template-columns: 1fr; }
    .detail-loading__media { min-height: 14rem; aspect-ratio: 16/9; }
    .detail-loading__info { padding: 1.25rem; display: grid; gap: 0.8rem; align-content: start; }
    .detail-loading__meta { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.75rem; }
    .detail-empty { max-width: 40rem; margin: 0 auto; padding: 2.5rem 2rem; text-align: center; display: grid; justify-items: center; gap: 0.75rem; }
    .detail-empty h1 { margin: 0.25rem 0 0; font-size: 1.75rem; color: #1b2a4a; }
    .detail-empty p { margin: 0; color: #5c7289; max-width: 32rem; }

    @media (min-width: 960px) {
      .detail-hero__inner { padding: 1.25rem 1rem 2rem; }
      .detail-page { padding: 1.75rem 0 3.5rem; }
      .detail-card { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); align-items: stretch; }
      .detail-card__media { aspect-ratio: auto; max-height: none; min-height: 100%; }
      .detail-card__info { padding: 1.75rem 1.85rem; gap: 1.2rem; }
      .detail-layout { grid-template-columns: minmax(0, 1.7fr) minmax(18rem, 0.92fr); gap: 1.5rem; }
      .detail-aside { position: sticky; top: 5.75rem; }
      .detail-loading { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
      .detail-loading__media { min-height: 100%; aspect-ratio: auto; }
      .detail-loading__info { padding: 1.75rem; }
    }
    @media (max-width: 640px) {
      .detail-meta { grid-template-columns: 1fr 1fr; }
      .detail-unit__summary { grid-template-columns: auto 1fr; }
      .detail-unit__meta { grid-column: 2; justify-self: start; padding-left: 0; }
      .detail-lessons li { grid-template-columns: auto 1fr; }
      .detail-lesson__time { grid-column: 2; }
    }
  `],
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);

  /** Servicio de autenticacion. */
  protected readonly auth = inject(AuthService);

  /** Curso cargado. */
  protected readonly curso = signal<Curso | null>(null);
  /** Unidades del curso con sus modulos y lecciones. */
  protected readonly unidades = signal<(Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] })[]>([]);
  /** Actividades del curso. */
  protected readonly actividades = signal<Actividad[]>([]);
  /** Estado de carga. */
  protected readonly cargando = signal(true);
  /** Mensaje de resultado de la matricula. */
  protected readonly mensaje = signal('');
  /** Indica si el mensaje es de exito. */
  protected readonly exito = signal(false);
  /** Indica que la matricula se esta enviando. */
  protected readonly enviando = signal(false);
  /** Indica que el usuario está matriculado con acceso al aula. */
  protected readonly yaMatriculado = signal(false);
  /** Estado de la matrícula del usuario en este curso, si existe. */
  protected readonly estadoMatricula = signal<'activa' | 'completada' | 'pendiente_pago' | null>(null);

  /** Portada oficial del curso. */
  protected readonly imagen = computed(() => imagenDeCurso(this.curso()?.slug, this.curso()?.portada_url));

  /** Duracion formateada. */
  protected readonly duracion = computed(() => {
    const minutos = this.curso()?.duracion_minutos ?? 0;
    if (!minutos) {
      return 'A definir';
    }
    const minutosPorSemana = 7 * 24 * 60;
    if (minutos % minutosPorSemana === 0) {
      const semanas = minutos / minutosPorSemana;
      return `${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
    }
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (horas === 0) {
      return `${resto} min`;
    }
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  });

  /** Precio formateado. */
  protected readonly precio = computed(() => {
    const curso = this.curso();
    if (!curso) {
      return '';
    }
    if (curso.precio === 0) {
      return 'Gratuito';
    }
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: curso.moneda || 'PEN',
      maximumFractionDigits: 0,
    }).format(curso.precio);
  });

  ngOnInit(): void {
    void this.cargar();
  }

  /** Carga el curso, su estructura y las actividades. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const parametro = this.route.snapshot.paramMap.get('slug')?.trim() ?? '';
      if (!parametro) {
        this.curso.set(null);
        return;
      }

      let curso = await this.courseService.obtenerPorSlug(parametro);
      if (!curso) {
        curso = await this.courseService.obtenerPorId(parametro);
      }

      if (!curso) {
        this.curso.set(null);
        return;
      }

      this.curso.set(curso);

      const [estructuraRes, actividadesRes, matriculaRes] = await Promise.allSettled([
        this.courseService.obtenerEstructura(curso.id),
        this.courseService.listarActividades(curso.id),
        this.enrollmentService.obtenerMatriculaDeCurso(curso.id),
      ]);

      if (estructuraRes.status === 'fulfilled') {
        this.unidades.set(estructuraRes.value.unidades);
      } else {
        this.unidades.set([]);
      }

      if (actividadesRes.status === 'fulfilled') {
        this.actividades.set(actividadesRes.value);
      } else {
        this.actividades.set([]);
      }

      if (matriculaRes.status === 'fulfilled' && matriculaRes.value) {
        this.estadoMatricula.set(matriculaRes.value.estado as 'activa' | 'completada' | 'pendiente_pago');
        this.yaMatriculado.set(matriculaRes.value.estado === 'activa' || matriculaRes.value.estado === 'completada');
      } else {
        this.estadoMatricula.set(null);
        this.yaMatriculado.set(false);
      }
    } catch {
      this.curso.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Inscribe al usuario: gratis directo; de pago con solicitud + redirección a pagos. */
  protected async solicitarMatricula(): Promise<void> {
    const curso = this.curso();
    if (!curso) {
      return;
    }

    this.enviando.set(true);
    this.mensaje.set('');

    try {
      if (Number(curso.precio) === 0) {
        const resultado = await this.enrollmentService.inscribirCursoGratis(curso);
        this.mensaje.set(resultado.mensaje);
        this.exito.set(resultado.ok);
        if (resultado.ok) {
          this.estadoMatricula.set('activa');
          this.yaMatriculado.set(true);
          await this.router.navigate(['/estudiante/aula', curso.id]);
        }
        return;
      }

      const resultado = await this.enrollmentService.solicitarMatricula(curso);
      this.mensaje.set(resultado.mensaje);
      this.exito.set(resultado.ok);
      if (resultado.ok) {
        this.estadoMatricula.set('pendiente_pago');
        this.yaMatriculado.set(false);
        this.mensaje.set('Solicitud registrada. Te estamos llevando a la sección de pagos…');
        await this.router.navigate(['/estudiante/pagos'], {
          queryParams: { matricula: 'pendiente', curso: curso.id },
        });
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
