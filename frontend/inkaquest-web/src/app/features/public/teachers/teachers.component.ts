import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Página pública de docentes.
 *
 * <p>Los perfiles de docentes no se exponen públicamente por defecto debido a
 * las políticas RLS de `public.perfil`. Esta vista presenta información
 * institucional honesta y orienta al usuario sin inventar datos personales.</p>
 */
@Component({
  selector: 'app-teachers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-16 md:py-20">
        <div class="mx-auto max-w-3xl text-center">
          <app-logo [alto]="64" variante="sobre-oscuro" class="mx-auto" />
          <p class="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.22em] text-gold-300 uppercase ring-1 ring-white/15">Docentes</p>
          <h1 class="mt-4 text-white">Acompañamiento académico con experiencia</h1>
          <p class="mt-5 text-lg leading-relaxed text-marine-100">
            En InkaQuest, los docentes diseñan y guían los cursos, actividades y evaluaciones según los contenidos publicados en la plataforma.
          </p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-app grid gap-8 lg:grid-cols-2">
        <article class="card card-body">
          <h2 class="text-xl font-semibold text-marine-800">Rol docente en la plataforma</h2>
          <ul class="mt-4 space-y-3 text-sm leading-relaxed text-marine-600">
            <li class="flex gap-3"><span class="mt-1 size-2 shrink-0 rounded-full bg-brand-500"></span><span>Gestionan cursos, unidades, lecciones, recursos y actividades autorizadas.</span></li>
            <li class="flex gap-3"><span class="mt-1 size-2 shrink-0 rounded-full bg-brand-500"></span><span>Revisan entregas, brindan retroalimentación y acompañan el progreso académico.</span></li>
            <li class="flex gap-3"><span class="mt-1 size-2 shrink-0 rounded-full bg-brand-500"></span><span>Configuran contenidos de minijuegos y retos dentro de los límites y permisos definidos.</span></li>
            <li class="flex gap-3"><span class="mt-1 size-2 shrink-0 rounded-full bg-brand-500"></span><span>El acceso docente se otorga por solicitud y aprobación administrativa (no autoasignable).</span></li>
          </ul>
        </article>

        <article class="card card-body bg-surface-50">
          <h2 class="text-xl font-semibold text-marine-800">Perfiles públicos</h2>
          <p class="mt-3 text-sm leading-relaxed text-marine-600">
            Por protección de datos y políticas de seguridad (RLS), los perfiles personales de docentes no se muestran de forma pública en esta versión.
            La información del equipo responsable se publicará cuando exista una política/canal explícito y autorizado para su exposición.
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <a routerLink="/cursos" class="btn btn-primary btn-md">Ver catálogo de cursos</a>
            <a routerLink="/sobre-nosotros" class="btn btn-outline btn-md">Conocer InkaQuest</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section pt-0">
      <div class="container-app">
        <div class="card border-brand-100 bg-brand-50/60 p-6 md:p-8">
          <h2 class="text-xl font-semibold text-marine-800">¿Deseas enseñar en InkaQuest?</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-marine-600">
            Crea tu cuenta como estudiante y envía una solicitud de acceso docente. Un administrador revisará tu información y aprobará el rol si corresponde.
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <a routerLink="/registro" class="btn btn-primary btn-md">Crear cuenta</a>
            <a routerLink="/solicitar-acceso-docente" class="btn btn-outline btn-md">Solicitar acceso docente</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TeachersComponent {}
