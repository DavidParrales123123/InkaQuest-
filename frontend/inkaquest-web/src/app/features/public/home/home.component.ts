// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Curso } from '../../../core/models/domain.models';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card.component';

/**
 * Página de inicio pública.
 * Diseño adaptado para coincidir con la referencia visual del proyecto, usando
 * rutas, autenticación y recursos propios de InkaQuest.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCardComponent],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="home-hero" aria-labelledby="home-title" role="banner">
        <div class="home-hero__grid">
          <div class="home-hero__copy">
            <p class="home-hero__eyebrow" role="status" aria-live="polite">
              <svg class="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Aprende con rutas claras · práctica real
            </p>
            <h1 id="home-title">
              Piensa en grande.
              <br />
              <span class="title-highlight">Programa tu camino.</span>
            </h1>
            <p class="home-hero__lead">
              Explora rutas de programación, algoritmos y tecnología con una experiencia clara, práctica y pensada para avanzar paso a paso.
            </p>
            <div class="home-hero__actions" role="group" aria-label="Acciones principales">
              @if (!auth.autenticado()) {
                <a routerLink="/registro" class="home-action home-action--primary" aria-label="Comenzar en InkaQuest - Crear cuenta">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                  <span>Comenzar mi aventura</span>
                </a>
              } @else {
                <a [routerLink]="rutaPanel()" class="home-action home-action--primary" aria-label="Ir a mi panel">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="9"/>
                    <rect x="14" y="3" width="7" height="5"/>
                    <rect x="14" y="12" width="7" height="9"/>
                    <rect x="3" y="16" width="7" height="5"/>
                  </svg>
                  <span>Ir a mi panel</span>
                </a>
              }
              <a routerLink="/cursos" class="home-action home-action--secondary" aria-label="Explorar el catálogo de cursos">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span>Explorar el catálogo</span>
              </a>
            </div>
            <nav class="home-hero__quicklinks" aria-label="Atajos de navegación rápida">
              <button (click)="scrollToSection('ruta')" (keydown.enter)="scrollToSection('ruta')" class="quicklink-btn" type="button" aria-label="Ir a la sección: Conoce la ruta de aprendizaje">Conoce la ruta</button>
              <span class="quicklink-separator" aria-hidden="true">·</span>
              <button (click)="scrollToSection('formatos')" (keydown.enter)="scrollToSection('formatos')" class="quicklink-btn" type="button" aria-label="Ir a la sección: Mira cómo practicar">Mira cómo practicar</button>
            </nav>
          </div>

          <figure class="home-hero__art" role="img" aria-label="Emblema de InkaQuest con órbitas decorativas">
            <div class="home-hero__orbit home-hero__orbit--outer" aria-hidden="true"></div>
            <div class="home-hero__orbit home-hero__orbit--inner" aria-hidden="true"></div>
            <div class="home-hero__seal">
              <img src="/assets/images/brand/logo.png" alt="Logo de InkaQuest" width="400" height="400" loading="eager" fetchpriority="high" />
            </div>
            <div class="home-float home-float--top" aria-hidden="true">
              <svg class="float-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Aprende
            </div>
            <div class="home-float home-float--bottom" aria-hidden="true">
              <svg class="float-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Codifica
            </div>
            <figcaption>Tu próxima misión empieza aquí</figcaption>
          </figure>
        </div>

        <ol class="home-pillars" aria-label="Tres etapas del proceso de aprendizaje">
          <li class="pillar-item">
            <span class="home-pillars__icon" aria-hidden="true">01</span>
            <svg class="pillar-decoration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span class="pillar-content"><strong>Aprende</strong><small>conceptos y fundamentos</small></span>
          </li>
          <li class="pillar-item">
            <span class="home-pillars__icon" aria-hidden="true">02</span>
            <svg class="pillar-decoration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
            <span class="pillar-content"><strong>Práctica</strong><small>retos y actividades</small></span>
          </li>
          <li class="pillar-item">
            <span class="home-pillars__icon" aria-hidden="true">03</span>
            <svg class="pillar-decoration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            <span class="pillar-content"><strong>Domina</strong><small>progreso y logros</small></span>
          </li>
        </ol>
      </section>

      <!-- Ruta de aprendizaje -->
      <section id="ruta" class="home-section home-route" aria-labelledby="route-title" role="region">
        <div class="home-section__heading home-reveal">
          <p class="home-kicker">Una ruta clara para aprender</p>
          <h2 id="route-title">Cada concepto te acerca<br class="desktop-break" /> a tu siguiente logro.</h2>
          <p>Explora cursos de programación y tecnología organizados con claridad. El contenido y el avance se basan en la información real de la plataforma.</p>
        </div>
        <div class="home-route__grid" role="list">
          <article class="home-route-card home-reveal" role="listitem">
            <span class="home-route-card__number" aria-label="Paso uno">01</span>
            <svg class="home-route-card__symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <h3>Elige tu curso</h3>
            <p>Descubre el catálogo publicado y encuentra la ruta que mejor se adapta a tus objetivos.</p>
          </article>
          <article class="home-route-card home-reveal" role="listitem">
            <span class="home-route-card__number" aria-label="Paso dos">02</span>
            <svg class="home-route-card__symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h3>Avanza por unidades</h3>
            <p>Progresa con lecciones y actividades estructuradas según el contenido disponible de cada curso.</p>
          </article>
          <article class="home-route-card home-reveal" role="listitem">
            <span class="home-route-card__number" aria-label="Paso tres">03</span>
            <svg class="home-route-card__symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3>Construye tu perfil</h3>
            <p>Consolida tu aprendizaje con seguimiento real, siempre que las funciones estén habilitadas en la plataforma.</p>
          </article>
        </div>
      </section>

      <!-- Formatos de práctica -->
      <section id="formatos" class="home-section home-practice" aria-labelledby="practice-title" role="region">
        <div class="home-section__heading home-section__heading--light home-reveal">
          <p class="home-kicker">Práctica con variedad</p>
          <h2 id="practice-title">Formatos para entrenar<br class="desktop-break" /> tu pensamiento lógico.</h2>
          <p>La plataforma contempla distintos formatos de aprendizaje y práctica, según el contenido y las actividades disponibles.</p>
        </div>
        <div class="home-practice__grid" role="list">
          <article class="home-practice-card home-reveal" role="listitem"><svg class="practice-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div class="practice-content"><small>01 · Reconoce</small><h3>Preguntas guiadas</h3><p>Refuerza conceptos con retroalimentación.</p></div><svg class="practice-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></article>
          <article class="home-practice-card home-reveal" role="listitem"><svg class="practice-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg><div class="practice-content"><small>02 · Ordena</small><h3>Pasos y secuencias</h3><p>Organiza instrucciones para resolver.</p></div><svg class="practice-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></article>
          <article class="home-practice-card home-reveal" role="listitem"><svg class="practice-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg><div class="practice-content"><small>03 · Completa</small><h3>Ejercicios prácticos</h3><p>Aplica lo aprendido paso a paso.</p></div><svg class="practice-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></article>
          <article class="home-practice-card home-reveal" role="listitem"><svg class="practice-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg><div class="practice-content"><small>04 · Resuelve</small><h3>Retos de programación</h3><p>Piensa soluciones con entradas y salidas.</p></div><svg class="practice-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></article>
        </div>
      </section>

      <!-- Aventura -->
      <section id="aventura" class="home-section home-adventure" aria-labelledby="adventure-title" role="region">
        <div class="home-adventure__copy home-reveal">
          <p class="home-kicker">Aprender también puede sentirse como una aventura</p>
          <h2 id="adventure-title">Avanza con curiosidad.<br /><span class="adventure-highlight">Gana confianza.</span></h2>
          <p>InkaQuest combina tecnología y una identidad inspirada en los Andes para acompañar tu recorrido de aprendizaje.</p>
          <a routerLink="/cursos" class="home-text-link" aria-label="Explorar cursos">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Explorar cursos disponibles
          </a>
        </div>
        <div class="home-adventure__visual home-reveal" role="img" aria-label="Visual de progreso y logros">
          <div class="adventure-orbit adventure-orbit--one" aria-hidden="true"></div>
          <div class="adventure-orbit adventure-orbit--two" aria-hidden="true"></div>
          <div class="adventure-token adventure-token--xp"><svg class="token-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><b>XP</b><small>experiencia</small></div>
          <div class="adventure-token adventure-token--streak"><svg class="token-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg><b>Racha</b><small>constancia</small></div>
          <div class="adventure-token adventure-token--badge"><svg class="token-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg><b>Logros</b><small>metas</small></div>
          <img class="adventure-mascot" src="/assets/images/brand/logo.png" alt="" width="400" height="400" loading="lazy" />
        </div>
      </section>

      <!-- Cursos destacados -->
      <section class="home-section" aria-labelledby="featured-title" role="region">
        <div class="home-section__heading home-reveal">
          <p class="home-kicker">Cursos destacados</p>
          <h2 id="featured-title">Explora cursos publicados y comienza hoy</h2>
          <p>Conoce parte del catálogo disponible en la plataforma. Cada curso muestra su información, contenido y condiciones según los datos publicados.</p>
        </div>
        <div class="container-app" style="max-width:74rem; margin:0 auto;">
          @if (cargandoCursos()) {
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              @for (i of [1,2,3]; track i) {
                <div class="card overflow-hidden animate-pulse">
                  <div class="h-44 bg-surface-200"></div>
                  <div class="p-5 space-y-3"><div class="h-4 w-3/4 rounded bg-surface-200"></div><div class="h-3 rounded bg-surface-200"></div><div class="h-3 w-2/3 rounded bg-surface-200"></div></div>
                </div>
              }
            </div>
          } @else if (cursosDestacados().length === 0) {
            <div class="card p-8 text-center text-marine-600">Aún no hay cursos destacados disponibles. <a routerLink="/cursos" class="text-brand-600 font-semibold hover:underline">Ver catálogo</a></div>
          } @else {
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              @for (curso of cursosDestacados(); track curso.id) {
                @if (estadoMatricula()[curso.id]; as estado) {
                  <app-course-card [curso]="curso" contexto="aulas" [estado]="estado" />
                } @else {
                  <app-course-card [curso]="curso" />
                }
              }
            </div>
            <div class="mt-8 text-center">
              <a routerLink="/cursos" class="home-action home-action--dark" style="display:inline-flex;">Ver todo el catálogo</a>
            </div>
          }
        </div>
      </section>

      <!-- Docentes y testimonios -->
      <section class="home-section" aria-labelledby="community-title" role="region" style="background:#fff;">
        <div class="home-section__heading home-reveal">
          <p class="home-kicker">Comunidad educativa</p>
          <h2 id="community-title">Docentes y experiencias de aprendizaje</h2>
          <p>Conoce el rol docente en InkaQuest y las experiencias que la plataforma busca ofrecer a sus estudiantes.</p>
        </div>
        <div class="container-app grid gap-6 md:grid-cols-2" style="max-width:74rem; margin:0 auto;">
          <article class="card card-body">
            <h3 class="text-xl font-semibold text-marine-800">Presentación de docentes</h3>
            <p class="mt-2 text-marine-600">Los docentes diseñan y acompañan los cursos publicados, gestionan contenidos y actividades, y brindan seguimiento académico según sus asignaciones y permisos.</p>
            <a routerLink="/docentes" class="btn btn-outline btn-md mt-4 w-fit">Conocer a los docentes</a>
          </article>
          <article class="card card-body">
            <h3 class="text-xl font-semibold text-marine-800">Testimonios</h3>
            <p class="mt-2 text-marine-600">Descubre experiencias referenciales sobre el aprendizaje, la práctica y el progreso que promueve la plataforma.</p>
            <a routerLink="/testimonios" class="btn btn-outline btn-md mt-4 w-fit">Ver testimonios</a>
          </article>
        </div>
      </section>
      <!-- Preguntas frecuentes -->
      <section id="preguntas" class="home-section home-faq" aria-labelledby="faq-title" role="region">
        <div class="home-section__heading home-reveal">
          <p class="home-kicker">Antes de empezar</p>
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <p>Información clara sobre el uso de la plataforma.</p>
        </div>
        <div class="home-faq__list" role="list">
          <details class="home-faq__item" role="listitem">
            <summary><span>¿Cómo accedo a los cursos?</span><svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <p>Crea una cuenta o inicia sesión. Desde el catálogo puedes explorar los cursos publicados y ver su detalle según tu acceso y el estado del curso.</p>
          </details>
          <details class="home-faq__item" role="listitem">
            <summary><span>¿El progreso y las recompensas son reales?</span><svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <p>El progreso, matrículas, pagos y recompensas dependen de los datos y reglas configuradas en la plataforma (base de datos, políticas y servicios). No se simulan en el cliente.</p>
          </details>
          <details class="home-faq__item" role="listitem">
            <summary><span>¿Cómo solicito acceso como docente?</span><svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <p>Regístrate y, desde tu cuenta, envía la solicitud de acceso docente. Un administrador la revisará y aprobará si corresponde; el rol no se asigna automáticamente.</p>
          </details>
        </div>
      </section>

      <!-- CTA Final -->
      <section class="home-final-cta home-reveal" aria-labelledby="final-cta-title" role="complementary">
        <svg class="home-final-cta__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <div class="cta-content">
          <p class="home-kicker">Tu aventura de aprendizaje comienza aquí</p>
          <h2 id="final-cta-title">¿Listo para dar el primer paso?</h2>
          <p>Explora el catálogo y descubre rutas para aprender, practicar y avanzar.</p>
        </div>
        <a routerLink="/cursos" class="home-action home-action--dark" aria-label="Ver el catálogo de cursos">
          <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>Ver cursos</span>
        </a>
      </section>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes rotateOrbit { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .home-page { overflow: hidden; background: #eaf3f2; color: #1b2a4a; }
    .home-hero { position: relative; padding: clamp(3.5rem, 8vw, 7rem) max(1.25rem, calc((100vw - 78rem) / 2)) 2.5rem; overflow: hidden; color: #fff; background: radial-gradient(ellipse at 78% 35%, rgb(18 115 107 / 45%), transparent 35rem), linear-gradient(135deg, #1b2a4a, #14213b 72%, #1b2a4a); }
    .home-hero::before, .home-hero::after { position: absolute; width: 28rem; height: 28rem; border: 1px solid rgb(242 165 65 / 12%); border-radius: 50%; content: ""; pointer-events: none; }
    .home-hero::before { top: -20rem; left: -12rem; } .home-hero::after { right: -19rem; bottom: -20rem; }
    .home-hero__grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr); align-items: center; gap: clamp(2.5rem, 7vw, 7rem); width: min(100%, 76rem); margin: 0 auto; }
    .home-hero__copy { max-width: 48rem; animation: fadeInUp 0.8s ease-out; }
    .home-hero__eyebrow, .home-kicker { margin: 0; color: #a8ded8; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.12em; line-height: 1.5; text-transform: uppercase; }
    .home-hero__eyebrow { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.9rem; border: 1px solid rgb(242 165 65 / 42%); border-radius: 999px; background: rgb(242 165 65 / 9%); color: #ffdcaa; letter-spacing: 0.04em; text-transform: none; }
    .eyebrow-icon { width: 16px; height: 16px; animation: pulse 2s ease-in-out infinite; }
    .home-hero__copy h1 { max-width: 13ch; margin: 1.35rem 0 1rem; color: #fff; font-size: clamp(2.8rem, 6.8vw, 5.25rem); font-weight: 900; letter-spacing: -0.055em; line-height: 1.02; font-family: var(--font-display);}
    .home-hero__copy h1 span, .home-adventure__copy h2 span { color: #ffd18a; }
    .home-hero__lead { max-width: 43rem; margin: 0; color: #e0eeec; font-size: clamp(1rem, 1.5vw, 1.2rem); line-height: 1.75; }
    .home-hero__actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1.8rem; }
    .home-action { display: inline-flex; min-height: 3.25rem; align-items: center; justify-content: center; gap: 0.65rem; padding: 0.8rem 1.25rem; border: 1px solid transparent; border-radius: 0.85rem; font-weight: 800; text-align: center; text-decoration: none; transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease; cursor: pointer; }
    .home-action:hover { transform: translateY(-2px); }
    .home-action--primary { background: #f2a541; box-shadow: 0 0.6rem 1.5rem rgb(242 165 65 / 18%); color: #1b2a4a; }
    .home-action--primary:hover { background: #ffc56d; }
    .home-action--secondary { border-color: rgb(234 243 242 / 42%); background: rgb(234 243 242 / 7%); color: #fff; }
    .home-action--secondary:hover { background: rgb(234 243 242 / 14%); }
    .action-icon { width: 20px; height: 20px; transition: transform 300ms ease; }
    .home-action:hover .action-icon { transform: translateX(4px); }
    .home-hero__quicklinks { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem; margin-top: 1.5rem; color: #acc5c2; font-size: 0.9rem; }
    .home-hero__quicklinks a, .home-text-link { color: #ffdcaa; text-underline-offset: 0.22em; }
    .quicklink-btn { background: none; border: none; color: #ffdcaa; font-weight: 600; cursor: pointer; transition: color 200ms ease; padding: 0.4rem; font-family: inherit; font-size: 0.9rem; }
    .quicklink-btn:hover { color: #fff; text-decoration: underline; }
    .quicklink-separator { color: #acc5c2; }
    .home-hero__art { position: relative; display: grid; justify-items: center; width: min(100%, 27rem); margin: 0 auto; padding: 1rem; animation: fadeIn 1s ease-out 0.3s both; }
    .home-hero__seal { position: relative; z-index: 1; width: min(100%, 23rem); padding: 0.45rem; border: 1px solid rgb(255 255 255 / 55%); border-radius: 50%; background: rgb(234 243 242 / 12%); box-shadow: 0 1.8rem 4rem rgb(0 0 0 / 30%), 0 0 0 0.6rem rgb(242 165 65 / 9%); animation: float 6s ease-in-out infinite; }
    .home-hero__seal img { display: block; width: 100%; aspect-ratio: 1; border-radius: 50%; object-fit: contain; background: #fff; padding: 1.5rem; }
    .home-hero__orbit { position: absolute; top: 50%; left: 50%; aspect-ratio: 1; border: 1px solid rgb(242 165 65 / 42%); border-radius: 50%; transform: translate(-50%, -50%); animation: rotateOrbit 30s linear infinite; }
    .home-hero__orbit--outer { width: 108%; }
    .home-hero__orbit--inner { width: 96%; border-color: rgb(168 222 216 / 45%); transform: translate(-50%, -50%) rotate(-18deg) scaleY(0.78); animation: rotateOrbit 20s linear infinite reverse; }
    .home-float { position: absolute; z-index: 2; display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.9rem; border: 1px solid rgb(255 255 255 / 22%); border-radius: 0.9rem; background: #fff; box-shadow: 0 0.7rem 1.8rem rgb(0 0 0 / 20%); color: #1b2a4a; font-size: 0.83rem; font-weight: 800; animation: float 4s ease-in-out infinite; }
    .home-float span { color: #12736b; }
    .home-float--top { top: 16%; right: -1.25rem; animation-delay: 0.5s; }
    .home-float--bottom { bottom: 19%; left: -1rem; animation-delay: 1s; }
    .float-icon { width: 18px; height: 18px; }
    .home-hero__art figcaption { position: relative; z-index: 2; margin-top: -0.15rem; padding: 0.55rem 1rem; border: 1px solid rgb(242 165 65 / 42%); border-radius: 999px; background: #14213b; color: #ffdcaa; font-size: 0.78rem; font-weight: 800; }
    .home-pillars { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; width: min(100%, 76rem); margin: 2rem auto 0; padding: 0; list-style: none; }
    .pillar-item { display: flex; min-height: 4.75rem; align-items: center; gap: 0.85rem; padding: 0.85rem 1rem; border: 1px solid rgb(234 243 242 / 15%); border-radius: 1rem; background: rgb(234 243 242 / 6%); transition: transform 200ms ease, box-shadow 200ms ease; }
    .pillar-item:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
    .home-pillars__icon { display: grid; width: 2.5rem; height: 2.5rem; flex: 0 0 auto; place-items: center; border-radius: 0.8rem; background: rgb(242 165 65 / 13%); color: #ffd18a; font-size: 0.8rem; font-weight: 900; }
    .pillar-decoration { width: 24px; height: 24px; color: #ffd18a; flex-shrink: 0; }
    .pillar-content strong, .pillar-content small { display: block; }
    .pillar-content strong { color: #fff; font-size: 0.92rem; }
    .pillar-content small { margin-top: 0.12rem; color: #c4d7d4; font-size: 0.78rem; }
    .home-section { padding: clamp(3.75rem, 8vw, 6rem) max(1.25rem, calc((100vw - 74rem) / 2)); }
    .home-section__heading { max-width: 48rem; margin: 0 auto 2.5rem; text-align: center; }
    .home-section__heading h2, .home-adventure__copy h2, .home-final-cta h2 { margin: 0.7rem 0 0.8rem; color: #1b2a4a; font-size: clamp(2rem, 4vw, 3.15rem); font-weight: 900; letter-spacing: -0.04em; line-height: 1.1; font-family: var(--font-display);}
    .home-section__heading > p:last-child { max-width: 43rem; margin: 0 auto; color: #53667b; font-size: 1.02rem; line-height: 1.7; }
    .home-kicker { color: #12736b; }
    .home-reveal { animation: fadeInUp 0.6s ease-out; }
    .home-route__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; width: min(100%, 74rem); margin: 0 auto; }
    .home-route-card { position: relative; min-height: 14rem; padding: 1.4rem; overflow: hidden; border: 1px solid #d4e2df; border-radius: 1.25rem; background: #fff; box-shadow: 0 0.7rem 1.8rem rgb(27 42 74 / 5%); transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease; }
    .home-route-card:hover { transform: translateY(-8px); box-shadow: 0 15px 35px rgb(27 42 74 / 12%); border-color: #12736b; }
    .home-route-card::after { position: absolute; right: -2.5rem; bottom: -3rem; width: 8rem; height: 8rem; border: 1px solid #e4efed; border-radius: 50%; content: ""; }
    .home-route-card__number { color: #12736b; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.1em; }
    .home-route-card__symbol { display: block; width: 2.8rem; height: 2.8rem; margin: 1rem 0; padding: 0.55rem; border-radius: 0.9rem; background: #eaf3f2; color: #12736b; }
    .home-route-card h3 { margin: 0; color: #1b2a4a; font-size: 1.15rem; font-weight: 850; }
    .home-route-card p { max-width: 38ch; margin: 0.55rem 0 0; color: #53667b; line-height: 1.6; }
    .home-practice { background: #1b2a4a; color: #eaf3f2; }
    .home-section__heading--light h2 { color: #fff; }
    .home-section__heading--light > p:last-child { color: #cbd9d7; }
    .home-section__heading--light .home-kicker { color: #ffd18a; }
    .home-practice__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; width: min(100%, 74rem); margin: 0 auto; }
    .home-practice-card { display: grid; grid-template-columns: 3rem minmax(0, 1fr) auto; align-items: center; gap: 1rem; min-height: 7rem; padding: 1rem 1.2rem; border: 1px solid rgb(234 243 242 / 14%); border-radius: 1rem; background: rgb(234 243 242 / 5%); transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease; }
    .home-practice-card:hover { transform: translateY(-4px); border-color: rgb(242 165 65 / 55%); background: rgb(234 243 242 / 8%); }
    .practice-symbol { display: block; width: 3rem; height: 3rem; padding: 0.65rem; border: 1px solid rgb(242 165 65 / 35%); border-radius: 0.9rem; background: rgb(242 165 65 / 9%); color: #ffd18a; }
    .practice-content small { color: #9bd4ce; font-size: 0.73rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .practice-content h3 { margin: 0.2rem 0; color: #fff; font-size: 1rem; font-weight: 850; }
    .practice-content p { margin: 0; color: #cbd9d7; font-size: 0.87rem; line-height: 1.5; }
    .practice-arrow { width: 24px; height: 24px; color: #cbd9d7; }
    .home-adventure { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.9fr); align-items: center; gap: 2.5rem; }
    .home-adventure__copy { max-width: 40rem; }
    .home-adventure__copy h2 { font-size: clamp(2.2rem, 4.5vw, 3.5rem); }
    .home-adventure__copy > p:not(.home-kicker) { color: #53667b; font-size: 1.02rem; line-height: 1.75; }
    .home-text-link { display: inline-flex; gap: 0.5rem; margin-top: 0.5rem; color: #12736b; font-weight: 800; text-decoration: none; }
    .link-icon { width: 20px; height: 20px; }
    .home-adventure__visual { position: relative; display: grid; min-height: 20rem; place-items: center; overflow: hidden; border: 1px solid #d4e2df; border-radius: 1.5rem; background: radial-gradient(circle, #fff 0%, #f5faf9 60%, #eaf3f2 100%); }
    .adventure-orbit { position: absolute; width: 15rem; height: 15rem; border: 1px solid #bad8d3; border-radius: 50%; animation: rotateOrbit 40s linear infinite; }
    .adventure-orbit--two { width: 19rem; height: 9rem; transform: rotate(-25deg); animation-direction: reverse; animation-duration: 30s; }
    .adventure-mascot { position: relative; z-index: 1; width: 8.5rem; height: 8.5rem; border-radius: 50%; object-fit: cover; box-shadow: 0 0.7rem 1.3rem rgb(27 42 74 / 15%); animation: float 6s ease-in-out infinite; animation-delay: 0.5s; background: #fff; }
    .adventure-token { position: absolute; z-index: 2; display: grid; min-width: 5.2rem; justify-items: center; padding: 0.65rem 0.8rem; border: 1px solid #d4e2df; border-radius: 1rem; background: #fff; box-shadow: 0 0.6rem 1.5rem rgb(27 42 74 / 9%); animation: float 5s ease-in-out infinite; }
    .adventure-token b { color: #1b2a4a; font-size: 0.83rem; }
    .adventure-token small { color: #637487; font-size: 0.68rem; }
    .adventure-token--xp { top: 18%; left: 12%; }
    .adventure-token--streak { top: 16%; right: 10%; animation-delay: 0.7s; }
    .adventure-token--badge { right: 17%; bottom: 10%; animation-delay: 1.4s; }
    .token-icon { width: 32px; height: 32px; margin-bottom: 0.3rem; color: #12736b; }
    .home-faq { background: #f5f9f8; }
    .home-faq__list { display: grid; gap: 0.75rem; width: min(100%, 54rem); margin: 0 auto; }
    .home-faq__item { padding: 1rem 1.2rem; border: 1px solid #d4e2df; border-radius: 0.9rem; background: #fff; transition: border-color 200ms ease, box-shadow 200ms ease; }
    .home-faq__item:hover { border-color: #12736b; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
    .home-faq__item summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #1b2a4a; font-weight: 800; cursor: pointer; list-style: none; }
    .home-faq__item summary::-webkit-details-marker { display: none; }
    .faq-chevron { width: 24px; height: 24px; color: #12736b; transition: transform 200ms ease; flex-shrink: 0; }
    .home-faq__item[open] .faq-chevron { transform: rotate(180deg); }
    .home-faq__item p { max-width: 68ch; margin: 0.8rem 0 0; color: #53667b; line-height: 1.65; }
    .home-final-cta { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 1.3rem; width: min(calc(100% - 2.5rem), 74rem); margin: 0 auto clamp(3rem, 7vw, 5rem); padding: clamp(1.4rem, 4vw, 2.5rem); border: 1px solid #d2dedb; border-radius: 1.4rem; background: #fff; box-shadow: 0 1rem 2.5rem rgb(27 42 74 / 7%); }
    .home-final-cta__mark { display: block; width: 3.4rem; height: 3.4rem; padding: 0.7rem; border-radius: 1rem; background: #fff2dd; color: #b36b08; }
    .home-final-cta .home-kicker { color: #12736b; }
    .home-final-cta h2 { margin: 0.35rem 0; font-size: clamp(1.4rem, 2.8vw, 2.1rem); }
    .home-final-cta p:last-child { margin: 0; color: #53667b; line-height: 1.6; }
    .home-action--dark { background: #1b2a4a; color: #fff; }
    .home-action--dark:hover { background: #12736b; }
    .desktop-break { display: inline; }
    @media (max-width: 800px) {
      .home-hero__grid { grid-template-columns: 1fr; gap: 2rem; }
      .home-adventure { grid-template-columns: 1fr; }
      .home-adventure__visual { width: min(100%, 34rem); margin: 0 auto; }
    }
    @media (max-width: 620px) {
      .home-hero { padding: 3rem 1rem 1.5rem; }
      .home-hero__copy { margin-inline: auto; text-align: center; }
      .home-hero__actions, .home-hero__quicklinks { justify-content: center; }
      .home-hero__art { width: min(76vw, 21rem); }
      .home-float--top { right: -0.7rem; } .home-float--bottom { left: -0.7rem; }
      .home-pillars { grid-template-columns: 1fr; width: min(100%, 24rem); }
      .home-route__grid, .home-practice__grid { grid-template-columns: 1fr; }
      .home-final-cta { grid-template-columns: auto minmax(0, 1fr); width: calc(100% - 2rem); }
      .home-final-cta .home-action { grid-column: 1 / -1; }
      .desktop-break { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .home-action, .home-practice-card, .home-route-card, .home-final-cta, .home-hero__seal, .adventure-mascot, .adventure-token, .home-float, .home-hero__orbit, .adventure-orbit { animation: none; transition: none; }
    }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(EnrollmentService);
  private keyboardListener?: (event: KeyboardEvent) => void;

  protected readonly cursosDestacados = signal<Curso[]>([]);
  protected readonly cargandoCursos = signal(true);
  protected readonly estadoMatricula = signal<Record<string, string>>({});

  protected readonly rutaPanel = computed(() => {
    switch (this.auth.rol()) {
      case 'administrador': return '/admin/dashboard';
      case 'docente': return '/docente/dashboard';
      case 'estudiante': return '/estudiante/dashboard';
      default: return '/login';
    }
  });

  ngOnInit(): void {
    void this.cargarCursosDestacados();
    void this.cargarMisMatriculas();
    this.keyboardListener = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
        const sectionMap: Record<string, string> = { '1': 'ruta', '2': 'formatos', '3': 'aventura', '4': 'preguntas' };
        const sectionId = sectionMap[event.key];
        if (sectionId) {
          event.preventDefault();
          this.scrollToSection(sectionId);
        }
      }
    };
    document.addEventListener('keydown', this.keyboardListener);
  }

  private async cargarMisMatriculas(): Promise<void> {
    if (!this.auth.autenticado()) {
      return;
    }
    try {
      const matriculas = await this.enrollmentService.listarMisMatriculas();
      const vigentes = new Set(['activa', 'completada', 'pendiente_pago']);
      const mapa: Record<string, string> = {};
      for (const m of matriculas) {
        if (vigentes.has(m.estado)) mapa[m.curso_id] = m.estado;
      }
      this.estadoMatricula.set(mapa);
    } catch {
      this.estadoMatricula.set({});
    }
  }

  protected async cargarCursosDestacados(): Promise<void> {
    this.cargandoCursos.set(true);
    try {
      const cursos = await this.courseService.listarPublicos({ limite: 6 });
      this.cursosDestacados.set(cursos);
    } catch {
      this.cursosDestacados.set([]);
    } finally {
      this.cargandoCursos.set(false);
    }
  }
  ngOnDestroy(): void {
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  protected scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

