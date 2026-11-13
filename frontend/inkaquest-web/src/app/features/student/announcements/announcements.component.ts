// @ts-nocheck
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CourseService } from '../../../core/services/course.service';
import { Anuncio, Curso, Perfil } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Avisos del estudiante: anuncios publicados por el docente de los cursos
 * en los que está matriculado.
 */
@Component({
  selector: 'app-student-announcements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Avisos"
        descripcion="Anuncios de tus docentes: avisos importantes de cada curso."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <a routerLink="/estudiante/mensajes" class="btn btn-outline btn-sm">Chat</a>
          <a routerLink="/estudiante/calendario" class="btn btn-outline btn-sm">Calendario</a>
        </div>
      </app-page-header>

      @if (cargando()) {
        <p class="py-16 text-center text-sm font-medium text-marine-500">Cargando avisos…</p>
      } @else if (error()) {
        <div class="card card-body space-y-3">
          <p class="text-sm text-danger-600">{{ error() }}</p>
          <button type="button" class="btn btn-primary btn-sm w-fit" (click)="cargar()">Reintentar</button>
        </div>
      } @else {
        <!-- Filtro por curso -->
        @if (misCursos().length > 1) {
          <div class="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Curso">
            <button type="button" class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all" [class.border-brand-500]="cursoId() === null" [class.bg-brand-500]="cursoId() === null" [class.text-white]="cursoId() === null" [class.border-surface-200]="cursoId() !== null" [class.bg-white]="cursoId() !== null" [class.text-marine-700]="cursoId() !== null" (click)="cursoId.set(null)">Todos</button>
            @for (c of misCursos(); track c.id) {
              <button type="button" class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all" [class.border-brand-500]="cursoId() === c.id" [class.bg-brand-500]="cursoId() === c.id" [class.text-white]="cursoId() === c.id" [class.border-surface-200]="cursoId() !== null" [class.bg-white]="cursoId() !== null" [class.text-marine-700]="cursoId() !== null" (click)="cursoId.set(c.id)">{{ c.titulo }}</button>
            }
          </div>
        }

        @if (visibles().length === 0) {
          <div class="card state-block">
            <svg class="size-12 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" stroke-linejoin="round" /><path d="M10.3 20a2 2 0 0 0 3.4 0" stroke-linecap="round" /></svg>
            <p class="text-sm font-medium text-marine-600">Aún no hay avisos publicados en tus cursos.</p>
          </div>
        } @else {
          <ul class="space-y-4">
            @for (a of visibles(); track a.id) {
              <li class="card overflow-hidden">
                <div class="border-b border-surface-100 bg-surface-50 px-5 py-3">
                  <div class="flex flex-wrap items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-marine-400">
                    <span>{{ cursoTitulo(a.curso_id) }}</span>
                    @if (a.fijado) {
                      <span class="inline-flex items-center gap-1 text-gold-600" title="Fijado"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6l-1 9H10L9 3z"/><path d="M12 12v9"/></svg> Fijado</span>
                    }
                  </div>
                  <h2 class="mt-1 text-lg font-extrabold text-marine-800">{{ a.titulo }}</h2>
                </div>
                <div class="p-5">
                  <p class="whitespace-pre-line text-sm leading-relaxed text-marine-700">{{ a.contenido }}</p>
                  <div class="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-marine-400">
                    <span class="font-semibold uppercase tracking-wider">{{ docenteNombre(a.docente_id) }}</span>
                    <span>{{ a.creado_en | date:'medium' }}</span>
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class StudentAnnouncementsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly courseService = inject(CourseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly misCursos = signal<Curso[]>([]);
  protected readonly anuncios = signal<Anuncio[]>([]);
  protected readonly docentes = signal<Map<string, Perfil>>(new Map());
  protected readonly cursoId = signal<string | null>(null);

  protected readonly visibles = computed(() => {
    const f = this.cursoId();
    const listado = this.anuncios().filter((a) => a.estado === 'publicado');
    return listado.filter((a) => (f ? a.curso_id === f : true));
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected cursoTitulo(id: string): string {
    return this.misCursos().find((c) => c.id === id)?.titulo ?? 'Curso';
  }

  protected docenteNombre(id: string): string {
    const p = this.docentes().get(id);
    return p ? ([p.nombre, p.apellido].filter(Boolean).join(' ').trim() || p.email) : 'Docente';
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const misCursos = await this.courseService.listarCursosDeEstudiante(user.id).catch(() => [] as Curso[]);
      // RLS garantiza solo los publicados de mis cursos.
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.anuncio)
        .select('*')
        .eq('estado', 'publicado')
        .order('fijado', { ascending: false })
        .order('creado_en', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      const anuncios = (data ?? []) as Anuncio[];

      // Nombres de los docentes (visibles por RLS tras la migración de chat).
      const docenteIds = [...new Set(anuncios.map((a) => a.docente_id))];
      const docentes = new Map<string, Perfil>();
      if (docenteIds.length > 0) {
        const { data: perfiles } = await this.supabase.client
          .from(this.supabase.tabla.perfil)
          .select('*')
          .in('id', docenteIds);
        for (const p of (perfiles ?? []) as Perfil[]) {
          docentes.set(p.id, p);
        }
      }

      this.misCursos.set(misCursos);
      this.anuncios.set(anuncios);
      this.docentes.set(docentes);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los avisos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
