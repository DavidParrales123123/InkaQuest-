import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Página pública de testimonios.
 *
 * <p>No se inventan opiniones ni identidades de usuarios. Se muestran
 * testimonios institucionales/ilustrativos de la experiencia de aprendizaje
 * que la plataforma busca ofrecer, claramente presentados como tales.</p>
 */
@Component({
  selector: 'app-testimonials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-16 md:py-20">
        <div class="mx-auto max-w-3xl text-center">
          <app-logo [alto]="64" variante="sobre-oscuro" class="mx-auto" />
          <p class="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.22em] text-gold-300 uppercase ring-1 ring-white/15">Testimonios</p>
          <h1 class="mt-4 text-white">Experiencias de aprendizaje</h1>
          <p class="mt-5 text-lg leading-relaxed text-marine-100">
            Conoce el tipo de experiencia educativa que InkaQuest promueve: práctica guiada, progreso visible y acompañamiento.
          </p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-app">
        <p class="mx-auto mb-8 max-w-3xl text-center text-sm text-marine-500">
          Los testimonios mostrados a continuación son referenciales e ilustran objetivos de la experiencia en la plataforma; no corresponden a opiniones verificadas de usuarios reales.
        </p>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (item of testimonios; track item.titulo) {
            <article class="card card-body h-full">
              <div class="flex items-center gap-2 text-gold-500" aria-hidden="true">
                @for (s of [1,2,3,4,5]; track s) {
                  <svg class="size-4 fill-current" viewBox="0 0 20 20"><path d="M10 1.5l2.47 5 5.53.8-4 3.9.95 5.5L10 14.2l-4.95 2.6.95-5.5-4-3.9 5.53-.8z"/></svg>
                }
              </div>
              <h2 class="mt-3 text-lg font-semibold text-marine-800">{{ item.titulo }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-marine-600">"{{ item.texto }}"</p>
              <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">{{ item.perfil }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <section class="section bg-surface-50">
      <div class="container-app text-center">
        <h2>Comienza tu propio recorrido</h2>
        <p class="mx-auto mt-3 max-w-2xl text-marine-600">Explora los cursos publicados y avanza con contenidos, actividades y seguimiento según tu matrícula y permisos.</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <a routerLink="/cursos" class="btn btn-primary btn-md">Explorar cursos</a>
          <a routerLink="/registro" class="btn btn-outline btn-md">Crear cuenta</a>
        </div>
      </div>
    </section>
  `,
})
export class TestimonialsComponent {
  protected readonly testimonios = [
    {
      titulo: 'Aprendizaje paso a paso',
      texto: 'Las rutas por unidades y lecciones ayudan a entender cada tema antes de pasar al siguiente, con práctica y seguimiento del avance.',
      perfil: 'Experiencia de estudiante (referencial)',
    },
    {
      titulo: 'Práctica con propósito',
      texto: 'Los retos, actividades y evaluaciones permiten aplicar lo aprendido y reforzar la lógica de programación de forma progresiva.',
      perfil: 'Experiencia de práctica (referencial)',
    },
    {
      titulo: 'Progreso visible',
      texto: 'Contar con indicadores de avance, logros y retroalimentación motiva a mantener la constancia en el aprendizaje.',
      perfil: 'Experiencia de seguimiento (referencial)',
    },
    {
      titulo: 'Acompañamiento docente',
      texto: 'El seguimiento académico y la retroalimentación en actividades y tareas fortalecen el proceso de aprendizaje.',
      perfil: 'Experiencia académica (referencial)',
    },
    {
      titulo: 'Contenido organizado',
      texto: 'Encontrar materiales, recursos y actividades en un solo lugar facilita estudiar y repasar cuando es necesario.',
      perfil: 'Experiencia de aula (referencial)',
    },
    {
      titulo: 'Motivación constante',
      texto: 'La gamificación y los objetivos claros hacen que cada sesión de estudio tenga un propósito y un avance medible.',
      perfil: 'Experiencia de motivación (referencial)',
    },
  ] as const;
}
