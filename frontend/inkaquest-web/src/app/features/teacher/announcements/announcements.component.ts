// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AnuncioService } from '../../../core/services/anuncio.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Anuncio, Curso, DocenteCurso, EstadoAnuncio } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Anuncios del docente (adaptado del proyecto anterior: crear, fijar, archivar).
 *
 * <p>Los anuncia llega a los estudiantes del curso; el listado permite
 * gestionarlos (publicado/borrador/archivado) y fijarlos.</p>
 */
@Component({
  selector: 'app-teacher-announcements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Anuncios"
        descripcion="Publica avisos y comunicados para tus cursos: publicación inmediata, borradores o archivo."
        [acciones]="true"
      >
        <div acciones class="flex items-center gap-2">
          <a routerLink="/docente/mensajes" class="btn btn-outline btn-sm">Mensajes</a>
        </div>
      </app-page-header>

      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Formulario -->
        <form class="card card-body space-y-4 lg:col-span-2" [formGroup]="form" (ngSubmit)="enviar()" aria-label="Crear anuncio">
          <h2 class="text-base font-bold text-marine-800">Nuevo anuncio</h2>

          <div>
            <label class="label" for="curso-a">Curso</label>
            <select id="curso-a" class="select" formControlName="curso_id">
              @for (c of cursos(); track c.curso.id) {
                <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="titulo-a">Título</label>
            <input id="titulo-a" class="input" formControlName="titulo" placeholder="Ej. Recordatorio: entrega de la tarea" maxlength="200" />
          </div>
          <div>
            <label class="label" for="cont-a">Contenido</label>
            <textarea id="cont-a" class="textarea" rows="5" formControlName="contenido" placeholder="Escribe aquí el comunicado…" maxlength="5000"></textarea>
            <p class="mt-1 text-right text-xs text-marine-400">{{ form.getRawValue().contenido.length }} / 5000</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="fijado" /> Fijar al inicio del listado</label>
            <select class="select w-auto" formControlName="estado" aria-label="Estado">
              <option value="publicado">Publicar ahora</option>
              <option value="borrador">Guardar como borrador</option>
            </select>
          </div>
          @if (msg()) {
            <p class="text-sm" [class.text-success-600]="ok()" [class.text-danger-600]="!ok()">{{ msg() }}</p>
          }
          <button type="submit" class="btn btn-primary btn-md w-full" [disabled]="form.invalid || enviando()">{{ enviando() ? 'Publicando…' : 'Publicar anuncio' }}</button>
        </form>

        <!-- Listado -->
        <div class="space-y-4 lg:col-span-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-bold text-marine-800">Mis anuncios</h2>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-full border px-3 py-1 text-xs font-semibold" [class.border-brand-500]="filtro() === 'todos'" [class.bg-brand-500]="filtro() === 'todos'" [class.text-white]="filtro() === 'todos'" [class.border-surface-200]="filtro() !== 'todos'" [class.text-marine-600]="filtro() !== 'todos'" (click)="filtro.set('todos')">Todos</button>
              <button type="button" class="rounded-full border px-3 py-1 text-xs font-semibold" [class.border-brand-500]="filtro() === 'publicado'" [class.bg-brand-500]="filtro() === 'publicado'" [class.text-white]="filtro() === 'publicado'" [class.border-surface-200]="filtro() !== 'publicado'" [class.text-marine-600]="filtro() !== 'publicado'" (click)="filtro.set('publicado')">Publicados</button>
              <button type="button" class="rounded-full border px-3 py-1 text-xs font-semibold" [class.border-brand-500]="filtro() === 'borrador'" [class.bg-brand-500]="filtro() === 'borrador'" [class.text-white]="filtro() === 'borrador'" [class.border-surface-200]="filtro() !== 'borrador'" [class.text-marine-600]="filtro() !== 'borrador'" (click)="filtro.set('borrador')">Borradores</button>
              <button type="button" class="rounded-full border px-3 py-1 text-xs font-semibold" [class.border-brand-500]="filtro() === 'archivado'" [class.bg-brand-500]="filtro() === 'archivado'" [class.text-white]="filtro() === 'archivado'" [class.border-surface-200]="filtro() !== 'archivado'" [class.text-marine-600]="filtro() !== 'archivado'" (click)="filtro.set('archivado')">Archivados</button>
            </div>
          </div>

          @if (cargando()) {
            <p class="py-8 text-center text-sm text-marine-500">Cargando anuncios…</p>
          } @else if (error()) {
            <div class="card card-body"><p class="text-sm text-danger-600">{{ error() }}</p></div>
          } @else if (anunciosFiltrados().length === 0) {
            <div class="card state-block">
              <svg class="size-12 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 11l18-5-5 18-2.5-7.5L3 11z" stroke-linejoin="round" /></svg>
              <p class="text-sm font-medium text-marine-600">Sin anuncios aún. Crea el primero.</p>
            </div>
          } @else {
            <ul class="space-y-3">
              @for (a of anunciosFiltrados(); track a.id) {
                <li class="card card-body">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        @if (a.fijado) {
                          <span class="inline-flex items-center text-gold-600" title="Fijado"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6l-1 9H10L9 3z"/><path d="M12 12v9"/></svg></span>
                        }
                        <p class="font-bold text-marine-800">{{ a.titulo }}</p>
                        <span class="badge" [class.badge-success]="a.estado === 'publicado'" [class.badge-neutral]="a.estado === 'borrador'" [class.badge-info]="a.estado === 'archivado'">{{ a.estado === 'publicado' ? 'Publicado' : a.estado === 'borrador' ? 'Borrador' : 'Archivado' }}</span>
                      </div>
                      <p class="mt-2 line-clamp-3 whitespace-pre-line text-sm text-marine-600">{{ a.contenido }}</p>
                      <p class="mt-2 text-[0.7rem] font-medium uppercase tracking-wider text-marine-400">{{ cursoTitulo(a.curso_id) }} · {{ formatearFecha(a.creado_en) }}</p>
                    </div>
                    <div class="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button type="button" class="btn btn-outline btn-sm !px-2 text-xs" (click)="toggleFijado(a)" [title]="a.fijado ? 'Quitar fijo' : 'Fijar'">{{ a.fijado ? 'Quitar' : 'Fijar' }}</button>
                      @if (a.estado !== 'publicado') {
                        <button type="button" class="btn btn-outline btn-sm !px-2 text-xs" (click)="publicar(a)">Publicar</button>
                      }
                      @if (a.estado !== 'archivado') {
                        <button type="button" class="btn btn-outline btn-sm !px-2 text-xs" (click)="archivar(a)">Archivar</button>
                      }
                      <button type="button" class="btn btn-outline btn-sm !px-2 text-xs text-danger-600" (click)="eliminar(a)">Eliminar</button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </section>
  `,
})
export class AnnouncementsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly anuncioService = inject(AnuncioService);
  private readonly teacherService = inject(TeacherService);

  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<(DocenteCurso & { curso: Curso })[]>([]);
  protected readonly anuncios = signal<Anuncio[]>([]);
  protected readonly filtro = signal<'todos' | 'publicado' | 'borrador' | 'archivado'>('todos');
  protected readonly msg = signal('');
  protected readonly ok = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    curso_id: ['', [Validators.required]],
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    contenido: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(5000)]],
    estado: ['publicado' as EstadoAnuncio],
    fijado: [false],
  });

  protected readonly anunciosFiltrados = computed(() => {
    const f = this.filtro();
    if (f === 'todos') return this.anuncios();
    return this.anuncios().filter((a) => a.estado === f);
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected cursoTitulo(cursoId: string): string {
    return this.cursos().find((c) => c.curso.id === cursoId)?.curso.titulo ?? '—';
  }

  protected formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return String(fecha);
    }
  }

  private async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (!this.form.value.curso_id && cursos[0]) {
        this.form.patchValue({ curso_id: cursos[0].curso.id });
      }
      this.anuncios.set(await this.anuncioService.listarMisAnuncios());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los anuncios.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid) return;
    this.enviando.set(true);
    this.msg.set('');
    try {
      const v = this.form.getRawValue();
      await this.anuncioService.crear({ curso_id: v.curso_id, titulo: v.titulo, contenido: v.contenido, estado: v.estado, fijado: v.fijado });
      this.form.patchValue({ titulo: '', contenido: '', fijado: false, estado: 'publicado' });
      this.msg.set(v.estado === 'borrador' ? 'Borrador guardado.' : 'Anuncio publicado.');
      this.ok.set(true);
      await this.cargar();
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo crear el anuncio.');
      this.ok.set(false);
    } finally {
      this.enviando.set(false);
    }
  }

  protected async archivar(a: Anuncio): Promise<void> {
    try {
      await this.anuncioService.actualizar(a.id, { estado: 'archivado' });
      await this.cargar();
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo archivar el anuncio.');
      this.ok.set(false);
    }
  }

  protected async publicar(a: Anuncio): Promise<void> {
    try {
      await this.anuncioService.actualizar(a.id, { estado: 'publicado' });
      await this.cargar();
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo publicar el anuncio.');
      this.ok.set(false);
    }
  }

  protected async toggleFijado(a: Anuncio): Promise<void> {
    try {
      await this.anuncioService.actualizar(a.id, { fijado: !a.fijado });
      await this.cargar();
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo actualizar el anuncio.');
      this.ok.set(false);
    }
  }

  protected async eliminar(a: Anuncio): Promise<void> {
    if (!confirm(`¿Eliminar el anuncio "${a.titulo}"?`)) return;
    try {
      await this.anuncioService.eliminar(a.id);
      await this.cargar();
      this.msg.set('Anuncio eliminado.');
      this.ok.set(true);
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo eliminar el anuncio.');
      this.ok.set(false);
    }
  }
}
