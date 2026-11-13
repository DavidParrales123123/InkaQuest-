// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { StorageService } from '../../../core/services/storage.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Curso, Recurso } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type TipoArchivo = 'documento' | 'imagen' | 'archivo' | 'enlace' | 'video' | 'otro';
type Modo = 'archivo' | 'enlace';

/**
 * Recursos y archivos (docente).
 *
 * <p>Administrador centralizado del material de estudio: sube archivos (Word,
 * PDF, Excel, PowerPoint, imágenes, ZIP) o agrega enlaces a una lección de
 * tus cursos asignados; tus alumnos matriculados los verán y descargarán.</p>
 */
@Component({
  selector: 'app-teacher-resources',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PageHeaderComponent],
  styles: [`
    .tipo-btn { display:flex; align-items:center; gap:.5rem; border-radius:.6rem; border:1px solid var(--color-surface-200,#d5e6e4); padding:.45rem .75rem; font-size:.78rem; font-weight:600; color:var(--color-marine-700,#113331); transition:all .15s ease; }
    .tipo-btn:hover { border-color:#12736b; background:#e8f6f4; }
    .tipo-btn.active { border-color:#12736b; background:#e8f6f4; color:#0f5d57; }
  `],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Recursos y archivos" descripcion="Sube materiales (Word, PDF, Excel, PowerPoint, imágenes, ZIP) o enlaces a tus lecciones; tus estudiantes matriculados los verán y descargarán." [acciones]="true">
        <div acciones><a routerLink="/docente/cursos" class="btn btn-outline btn-sm">Gestión de cursos</a></div>
      </app-page-header>

      @if (mensaje(); as msg) {
        <p class="rounded-lg bg-opacity-50 p-3 text-sm font-medium"
          [class]="msg.ok ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'"
          role="status">{{ msg.texto }}</p>
      }

      @if (cargando()) {
        <p class="text-sm text-marine-500">Cargando tus cursos…</p>
      } @else if (cursos().length === 0) {
        <div class="card card-body text-center">
          <p class="text-sm text-marine-600">No tienes cursos asignados todavía. Cuando un administrador te asigne cursos, podrás subir aquí tus materiales.</p>
        </div>
      } @else {
        <!-- ════ Selector curso / lección ════ -->
        <div class="card card-body grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label" for="rec-curso">Curso</label>
            <select id="rec-curso" class="select" [value]="cursoSel()" (change)="cambiarCurso($any($event.target).value)">
              @for (c of cursos(); track c.curso.id) {
                <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="rec-lec">Lección</label>
            <select id="rec-lec" class="select" [value]="leccionSel()" (change)="cambiarLeccion($any($event.target).value)">
              <option value="">— Todas las lecciones del curso —</option>
              @for (l of lecciones(); track l.id) {
                <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option>
              }
            </select>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-5">
          <!-- ════ SUBIR MATERIAL ════ -->
          <div class="card card-body space-y-3 xl:col-span-2">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-extrabold text-marine-800">Agregar material</h2>
              @if (leccionSel()) {
                <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[0.7rem] font-bold text-brand-700">1 lección</span>
              } @else {
                <span class="text-[0.7rem] font-semibold text-warning-500">Elige una lección para subir</span>
              }
            </div>

            <div class="flex gap-2">
              <button type="button" class="tipo-btn grow" [class.active]="modo() === 'archivo'" (click)="modo.set('archivo')">📄 Archivo</button>
              <button type="button" class="tipo-btn grow" [class.active]="modo() === 'enlace'" (click)="modo.set('enlace')">🔗 Enlace</button>
            </div>

            @if (modo() === 'archivo') {
              <div class="rounded-xl border border-dashed border-brand-300 bg-brand-50/40 p-5 text-center">
                <p class="text-3xl">📎</p>
                <p class="mt-1 text-sm text-marine-700">Word, PDF, Excel, PowerPoint, imágenes o ZIP.</p>
                <p class="text-xs text-marine-500">Máx. 50 MB por archivo.</p>
                <input #fileUpload type="file" multiple class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt,.json,.mp4,.webm,.mov" [disabled]="!leccionSel() || subiendo()" (change)="subirArchivos(fileUpload)" />
                <button type="button" class="btn btn-primary mt-3" [disabled]="!leccionSel() || subiendo()" (click)="fileUpload.click()">
                  {{ subiendo() ? 'Subiendo…' : 'Seleccionar archivos' }}
                </button>
              </div>

              @if (archivosRecientes().length > 0) {
                <div class="space-y-2">
                  <p class="text-xs font-bold uppercase tracking-wider text-marine-500">Subidos en esta sesión</p>
                  <ul class="space-y-1">
                    @for (f of archivosRecientes(); track $index) {
                      <li class="flex items-center gap-2 rounded-lg bg-surface-50 px-2 py-1.5 text-xs">
                        <span aria-hidden="true">{{ iconoTipo(f.tipo) }}</span>
                        <span class="min-w-0 truncate font-medium text-marine-800" [title]="f.nombre">{{ f.nombre }}</span>
                        <span class="ml-auto text-marine-400">{{ tamanoKb(f.tamano_bytes) }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            } @else {
              <form [formGroup]="formEnlace" (ngSubmit)="crearEnlace()" class="space-y-3" aria-label="Agregar enlace">
                <div>
                  <label class="label" for="e-nombre">Nombre del recurso</label>
                  <input id="e-nombre" class="input" formControlName="nombre" placeholder="Ej. Guía: algoritmos de ordenamiento" />
                </div>
                <div>
                  <label class="label" for="e-url">URL</label>
                  <input id="e-url" type="url" class="input" formControlName="url" placeholder="https://…" />
                </div>
                <button type="submit" class="btn btn-primary" [disabled]="formEnlace.invalid || !leccionSel() || guardando()">{{ guardando() ? 'Guardando…' : 'Agregar enlace' }}</button>
              </form>
            }
          </div>

          <!-- ════ LISTA DE RECURSOS ════ -->
          <div class="space-y-4 xl:col-span-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-extrabold text-marine-800">Recursos de {{ cursoActual()?.titulo ?? 'este curso' }}</h2>
              <div class="flex flex-wrap items-center gap-2">
                <select class="select w-auto" [value]="filtroTipo()" (change)="filtroTipo.set($any($event.target).value)" aria-label="Filtrar por tipo">
                  <option value="">Todos los tipos</option>
                  <option value="documento">Documento</option>
                  <option value="imagen">Imagen</option>
                  <option value="video">Video</option>
                  <option value="archivo">Archivo</option>
                  <option value="enlace">Enlace</option>
                  <option value="otro">Otro</option>
                </select>
                <input type="search" class="input w-44 sm:w-56" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" placeholder="Buscar…" aria-label="Buscar recurso" />
              </div>
            </div>

            @if (cargandoRecursos()) {
              <p class="text-sm text-marine-500">Cargando recursos…</p>
            } @else if (recursos().length === 0) {
              <div class="card card-body">
                <p class="text-sm text-marine-500">Aún no hay materiales en este curso. Agrega tu primer archivo.</p>
              </div>
            } @else if (recursosFiltrados().length === 0) {
              <div class="card card-body">
                <p class="text-sm text-marine-500">Ningún recurso coincide con el filtro, cambia la búsqueda.</p>
              </div>
            } @else {
              <p class="text-xs text-marine-500">{{ recursosFiltrados().length }} de {{ recursos().length }} recursos</p>
              <ul class="space-y-2">
                @for (r of recursosFiltrados(); track r.id) {
                  <li class="card card-body flex flex-wrap items-center gap-3 py-3">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl" aria-hidden="true">{{ iconoTipo(r.tipo) }}</span>
                    <div class="min-w-0 grow">
                      <p class="truncate font-semibold text-marine-800" [title]="r.nombre">{{ r.nombre }}</p>
                      <p class="mt-0.5 text-xs text-marine-500">
                        {{ leccionDe(r.leccion_id)?.titulo ?? 'Lección' }} · {{ etiquetaTipo(r.tipo) }}
                        @if (r.tamano_bytes) { · {{ tamanoKb(r.tamano_bytes) }} } · {{ r.creado_en | date:'mediumDate' }}
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      @if (r.ruta_storage) {
                        <button type="button" class="btn btn-outline btn-sm" (click)="abrirRecurso(r)">Descargar</button>
                      } @else if (r.url) {
                        <a class="btn btn-outline btn-sm" [href]="r.url" target="_blank" rel="noopener">Abrir</a>
                      }
                      <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminarRecurso(r)">Eliminar</button>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
        <p class="text-xs text-marine-400">Un recurso vive dentro de una lección (obligatorio en el esquema). Los archivos quedan en Storage con acceso restringido a matriculados del curso.</p>
      }
    </section>
  `,
})
export class ResourcesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);
  private readonly storageService = inject(StorageService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly cargandoRecursos = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal<{ ok: boolean; texto: string } | null>(null);

  protected readonly cursos = signal<{ curso: Curso }[]>([]);
  protected readonly cursoSel = signal('');
  protected readonly leccionSel = signal('');
  protected readonly lecciones = signal<{ id: string; titulo: string; unidadNumero: number }[]>([]);
  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly archivosRecientes = signal<{ nombre: string; tipo: string; tamano_bytes: number | null }[]>([]);

  protected readonly busqueda = signal('');
  protected readonly filtroTipo = signal<string>('');
  protected readonly modo = signal<Modo>('archivo');

  protected readonly formEnlace = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/|mailto:)/i)]],
  });

  protected readonly cursoActual = computed(() => this.cursos().find((c) => c.curso.id === this.cursoSel())?.curso ?? null);

  protected readonly recursosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const tipo = this.filtroTipo();
    return this.recursos().filter((r) => {
      if (tipo && r.tipo !== tipo) return false;
      if (q && !r.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  ngOnInit(): void { void this.cargar(); }

  protected tamanoKb(bytes: number | null | undefined): string {
    const n = Number(bytes ?? 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected leccionDe(id: string): { titulo: string } | null {
    const l = this.lecciones().find((x) => x.id === id);
    return l ? { titulo: l.titulo } : null;
  }

  protected iconoTipo(tipo: string): string {
    switch ((tipo ?? '').toLowerCase()) {
      case 'documento': return '📄';
      case 'imagen': return '🖼️';
      case 'video': return '🎬';
      case 'archivo': return '🗜️';
      case 'enlace': return '🔗';
      case 'otro': return '📎';
      default: return '📎';
    }
  }

  protected etiquetaTipo(tipo: string): string {
    const map: Record<string, string> = {
      documento: 'Documento', imagen: 'Imagen', video: 'Video',
      zip: 'ZIP', enlace: 'Enlace', archivo: 'Archivo', otro: 'Otro',
    };
    return map[(tipo ?? '').toLowerCase()] ?? (tipo || 'Archivo');
  }

  protected tipoPorExtension(nombre: string): TipoArchivo {
    const ext = (nombre.split('.').pop() ?? '').toLowerCase();
    if (['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'rtf', 'odt', 'ods', 'odp', 'txt', 'md'].includes(ext)) return 'documento';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'imagen';
    if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archivo';
    return 'otro';
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true); this.mensaje.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.cargando.set(false); return; }
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (cursos.length) {
        this.cursoSel.set(cursos[0].curso.id);
        await this.cargarEstructuraYRecursos(cursos[0].curso.id);
      }
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los cursos.' });
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarLeccion(leccionId: string): Promise<void> {
    if (leccionId === this.leccionSel()) return;
    this.leccionSel.set(leccionId);
    this.cargandoRecursos.set(true);
    try { await this.refrescarRecursos(); } finally { this.cargandoRecursos.set(false); }
  }

  protected async cambiarCurso(cursoId: string): Promise<void> {
    if (cursoId === this.cursoSel()) return;
    this.cursoSel.set(cursoId);
    this.leccionSel.set('');
    this.archivosRecientes.set([]);
    await this.cargarEstructuraYRecursos(cursoId);
  }

  private async cargarEstructuraYRecursos(cursoId: string): Promise<void> {
    this.cargandoRecursos.set(true);
    try {
      const est = await this.courseService.obtenerEstructuraGestion(cursoId);
      const ls: { id: string; titulo: string; unidadNumero: number }[] = [];
      for (const u of est.unidades) for (const m of u.modulos) for (const l of m.lecciones) {
        ls.push({ id: l.id, titulo: l.titulo, unidadNumero: u.numero });
      }
      this.lecciones.set(ls);
      await this.refrescarRecursos();
    } catch (e) {
      this.lecciones.set([]);
      this.recursos.set([]);
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cargar el curso.' });
    } finally {
      this.cargandoRecursos.set(false);
    }
  }

  private async refrescarRecursos(): Promise<void> {
    const ls = this.leccionSel() ? this.lecciones().filter((l) => l.id === this.leccionSel()) : this.lecciones();
    try {
      const todo = (await Promise.all(ls.map((l) => this.courseService.listarRecursos(l.id).catch(() => [] as Recurso[])))).flat();
      this.recursos.set(todo);
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los recursos.' });
    }
  }

  protected async subirArchivos(input: HTMLInputElement): Promise<void> {
    const target = input;
    const files = Array.from(target.files ?? []);
    target.value = '';
    if (files.length === 0) return;

    const leccionId = this.leccionSel();
    const cursoId = this.cursoSel();
    if (!leccionId) { this.mensaje.set({ ok: false, texto: 'Elige una lección antes de subir archivos.' }); return; }

    this.subiendo.set(true);
    const fallidos: string[] = [];
    let ok = 0;
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) { this.mensaje.set({ ok: false, texto: `"${f.name}" supera 50 MB.` }); fallidos.push(f.name); continue; }
      try {
        const { ruta } = await this.storageService.subirRecursoCurso(cursoId, f);
        await this.courseService.crearRecurso(leccionId, {
          nombre: f.name,
          tipo: this.tipoPorExtension(f.name),
          ruta_storage: ruta,
          tamano_bytes: f.size,
          mime_type: f.type || null,
          descargable: true,
        });
        ok += 1;
        this.archivosRecientes.update((arr) => {
          const clave = `${f.name}:${f.size}`;
          return [{ nombre: f.name, tipo: this.tipoPorExtension(f.name), tamano_bytes: f.size }, ...arr.filter((x) => `${x.nombre}:${x.tamano_bytes}` !== clave)].slice(0, 12);
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : `No se pudo subir "${f.name}".`;
        this.mensaje.set({ ok: false, texto: msg });
        fallidos.push(f.name);
      }
    }
    if (ok > 0 && fallidos.length === 0) {
      await this.refrescarRecursos();
      this.mensaje.set({ ok: true, texto: ok === 1 ? 'Archivo subido.' : `${ok} archivos subidos.` });
    } else if (ok > 0) {
      await this.refrescarRecursos();
      this.mensaje.set({ ok: false, texto: `${ok} archivo(s) subido(s). Fallaron: ${fallidos.join(', ')}.` });
    }
    this.subiendo.set(false);
  }

  protected async crearEnlace(): Promise<void> {
    if (this.formEnlace.invalid || !this.leccionSel()) { this.formEnlace.markAllAsTouched(); return; }
    const v = this.formEnlace.getRawValue();
    this.guardando.set(true);
    try {
      await this.courseService.crearRecurso(this.leccionSel(), { nombre: v.nombre.trim(), tipo: 'enlace', url: v.url.trim(), descargable: false });
      this.formEnlace.reset({ nombre: '', url: '' });
      await this.refrescarRecursos();
      this.mensaje.set({ ok: true, texto: 'Enlace agregado.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo agregar el enlace.' });
    } finally {
      this.guardando.set(false);
    }
  }

  protected async abrirRecurso(r: Recurso): Promise<void> {
    if (!r.ruta_storage) return;
    const url = await this.storageService.obtenerUrlRecurso(r.ruta_storage);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else this.mensaje.set({ ok: false, texto: 'No se pudo generar el enlace de descarga.' });
  }

  protected async eliminarRecurso(r: Recurso): Promise<void> {
    if (!confirm(`¿Eliminar "${r.nombre}"?`)) return;
    try {
      if (r.ruta_storage) {
        try { await this.storageService.eliminarRecurso(r.ruta_storage); } catch { /* best effort */ }
      }
      await this.courseService.eliminarRecurso(r.id);
      this.recursos.update((arr) => arr.filter((x) => x.id !== r.id));
      this.mensaje.set({ ok: true, texto: 'Recurso eliminado.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar el recurso.' });
    }
  }
}
