// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Contenido, Curso, Leccion, Modulo, Recurso, Unidad } from '../../../core/models/domain.models';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { StorageService } from '../../../core/services/storage.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface Estructura { unidades: (Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] })[] }

@Component({
  selector: 'app-teacher-course-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DataPanelComponent, PageHeaderComponent, DecimalPipe],
  template: `
    <section class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <app-page-header
          [titulo]="curso()?.titulo ? 'Gestionar: ' + curso()!.titulo : 'Gestion de curso'"
          descripcion="Crea y organiza unidades, módulos, lecciones, contenidos y recursos/materiales. Los cambios dependen de permisos RLS y de tu asignación al curso."
        />
        <div class="flex flex-wrap gap-2">
          <a routerLink="/docente/cursos" class="btn btn-outline btn-sm">Volver a mis cursos</a>
          <a routerLink="/docente/minijuegos" class="btn btn-outline btn-sm">Minijuegos por curso</a>
          @if (curso()) {
            <a [routerLink]="['/cursos', curso()!.slug]" class="btn btn-outline btn-sm">Ficha pública</a>
          }
        </div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="!curso()" tituloVacio="Curso no disponible" descripcionVacia="No se encontro el curso o no tienes acceso." (alReintentar)="cargar()">
        <div contenido class="space-y-6">
          @if (curso(); as c) {
            <div class="card card-body">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm text-marine-500">Estado: <strong>{{ c.estado }}</strong> · {{ c.duracion_minutos }} min · {{ c.xp_total }} XP</p>
                  <p class="mt-1 text-sm text-marine-600">{{ c.descripcion || 'Sin descripción.' }}</p>
                </div>
                <span class="badge" [class.badge-success]="c.estado === 'publicado'" [class.badge-default]="c.estado !== 'publicado'">{{ c.estado }}</span>
              </div>
              @if (mensajeGlobal()) {
                <p class="mt-3 text-sm" [class.text-success-600]="exitoGlobal()" [class.text-danger-600]="!exitoGlobal()">{{ mensajeGlobal() }}</p>
              }
            </div>

            <div class="card card-body space-y-4">
              <h2 class="text-lg font-semibold text-marine-800">Nueva unidad</h2>
              <form class="grid gap-3 md:grid-cols-4 items-end" [formGroup]="formUnidad" (ngSubmit)="crearUnidad()">
                <div><label class="label" for="u-num">N°</label><input id="u-num" type="number" min="1" class="input" formControlName="numero" /></div>
                <div class="md:col-span-2"><label class="label" for="u-tit">Título</label><input id="u-tit" class="input" formControlName="titulo" placeholder="Ej. Introducción" /></div>
                <button class="btn btn-primary" type="submit" [disabled]="formUnidad.invalid || guardando()">Agregar unidad</button>
                <div class="md:col-span-4"><label class="label" for="u-desc">Descripción (opcional)</label><input id="u-desc" class="input" formControlName="descripcion" /></div>
                <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="publicado" /> Publicada</label>
              </form>
            </div>

            @if (estructura().unidades.length === 0) {
              <div class="card card-body text-sm text-marine-500">Este curso aún no tiene unidades. Crea la primera para comenzar a organizar módulos y lecciones.</div>
            }

            @for (u of estructura().unidades; track u.id) {
              <article class="card overflow-hidden">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 bg-surface-50 p-4">
                  <div>
                    <h3 class="font-semibold text-marine-800">Unidad {{ u.numero }}: {{ u.titulo }}</h3>
                    <p class="text-xs text-marine-500">{{ u.descripcion || 'Sin descripción' }} · {{ u.publicado ? 'Publicada' : 'Borrador' }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button class="btn btn-outline btn-sm" type="button" (click)="togglePublicacionUnidad(u)">{{ u.publicado ? 'Ocultar' : 'Publicar' }}</button>
                    <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="eliminarUnidad(u)">Eliminar</button>
                  </div>
                </div>
                <div class="p-4 space-y-4">
                  <form class="grid gap-2 md:grid-cols-5 items-end rounded-lg border border-surface-200 p-3" [formGroup]="moduloForm(u.id)" (ngSubmit)="crearModulo(u)">
                    <div><label class="label">N° mod.</label><input type="number" min="1" class="input" formControlName="numero" /></div>
                    <div class="md:col-span-2"><label class="label">Nuevo modulo</label><input class="input" formControlName="titulo" placeholder="Título del módulo" /></div>
                    <label class="inline-flex items-center gap-2 text-sm mb-2"><input type="checkbox" formControlName="publicado" /> Publicado</label>
                    <button class="btn btn-primary btn-sm" type="submit" [disabled]="moduloForm(u.id).invalid || guardando()">Agregar módulo</button>
                  </form>

                  @if (u.modulos.length === 0) {
                    <p class="text-sm text-marine-500">Sin módulos. Agrega un módulo para poder crear lecciones.</p>
                  }

                  @for (m of u.modulos; track m.id) {
                    <div class="rounded-lg border border-surface-200 p-3 space-y-3">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p class="font-medium text-marine-800">Módulo {{ m.numero }}: {{ m.titulo }}</p>
                          <p class="text-xs text-marine-500">{{ m.publicado ? 'Publicado' : 'Borrador' }}</p>
                        </div>
                        <div class="flex gap-2">
                          <button class="btn btn-outline btn-sm" type="button" (click)="togglePublicacionModulo(m)">{{ m.publicado ? 'Ocultar' : 'Publicar' }}</button>
                          <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="eliminarModulo(m)">Eliminar</button>
                        </div>
                      </div>

                      <form class="grid gap-2 md:grid-cols-6 items-end bg-surface-50 rounded p-3" [formGroup]="leccionForm(m.id)" (ngSubmit)="crearLeccion(m)">
                        <div><label class="label">N°</label><input type="number" min="1" class="input" formControlName="numero" /></div>
                        <div class="md:col-span-2"><label class="label">Nueva lección</label><input class="input" formControlName="titulo" placeholder="Título de la lección" /></div>
                        <div><label class="label">Min</label><input type="number" min="0" class="input" formControlName="duracion_minutos" /></div>
                        <label class="inline-flex items-center gap-2 text-sm mb-2"><input type="checkbox" formControlName="publicado" /> Publicada</label>
                        <button class="btn btn-primary btn-sm" type="submit" [disabled]="leccionForm(m.id).invalid || guardando()">Agregar</button>
                      </form>

                      @if (m.lecciones.length === 0) {
                        <p class="text-sm text-marine-500">Sin lecciones.</p>
                      }

                      <ul class="space-y-3">
                        @for (l of m.lecciones; track l.id) {
                          <li class="rounded border border-surface-200 p-3">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p class="font-medium text-marine-800">Lección {{ l.numero }}: {{ l.titulo }}</p>
                                <p class="text-xs text-marine-500">{{ l.duracion_minutos }} min · {{ l.xp_otorgado }} XP · {{ l.publicado ? 'Publicada' : 'Borrador' }}</p>
                              </div>
                              <div class="flex flex-wrap gap-2">
                                <button class="btn btn-outline btn-sm" type="button" (click)="abrirLeccion(l)">{{ leccionAbierta() === l.id ? 'Cerrar' : 'Gestionar contenido' }}</button>
                                <button class="btn btn-outline btn-sm" type="button" (click)="togglePublicacionLeccion(l)">{{ l.publicado ? 'Ocultar' : 'Publicar' }}</button>
                                <button class="btn btn-outline btn-sm text-danger-600" type="button" (click)="eliminarLeccion(l)">Eliminar</button>
                              </div>
                            </div>

                            @if (leccionAbierta() === l.id) {
                              <div class="mt-3 space-y-4 border-t border-surface-200 pt-3">
                                <div class="grid gap-4 lg:grid-cols-2">
                                  <div class="space-y-3">
                                    <h4 class="font-semibold text-marine-800">Contenidos</h4>
                                    @if (contenidos()[l.id]?.length) {
                                      <ul class="space-y-2 text-sm">
                                        @for (ct of contenidos()[l.id]; track ct.id) {
                                          <li class="rounded border border-surface-200 p-2">
                                            <div class="flex items-start justify-between gap-2">
                                              <div>
                                                <p class="font-medium">{{ ct.orden }}. {{ ct.titulo || '(Sin titulo)' }} <span class="text-marine-400">[{{ ct.tipo }}]</span></p>
                                                @if (ct.cuerpo) { <p class="mt-1 whitespace-pre-wrap text-marine-600">{{ ct.cuerpo }}</p> }
                                              </div>
                                              <button class="text-xs text-danger-600 hover:underline" type="button" (click)="eliminarContenido(l.id, ct)">Eliminar</button>
                                            </div>
                                          </li>
                                        }
                                      </ul>
                                    } @else {
                                      <p class="text-sm text-marine-500">Sin contenidos. Agrega texto o material de apoyo.</p>
                                    }
                                    <form class="space-y-2 rounded bg-surface-50 p-3" [formGroup]="formContenido" (ngSubmit)="crearContenido(l)">
                                      <p class="text-sm font-medium text-marine-700">Agregar contenido</p>
                                      <div class="grid gap-2 sm:grid-cols-3">
                                        <div><label class="label">Orden</label><input type="number" min="1" class="input" formControlName="orden" /></div>
                                        <div><label class="label">Tipo</label>
                                          <select class="select" formControlName="tipo">
                                            <option value="texto">Texto</option><option value="video">Video</option><option value="enlace">Enlace</option><option value="archivo">Archivo</option><option value="html">HTML</option>
                                          </select>
                                        </div>
                                        <div><label class="label">Titulo</label><input class="input" formControlName="titulo" /></div>
                                      </div>
                                      <div><label class="label">Cuerpo / descripción</label><textarea class="textarea" rows="3" formControlName="cuerpo" placeholder="Texto, URL o instrucciones"></textarea></div>
                                      <button class="btn btn-primary btn-sm" type="submit" [disabled]="guardando()">Guardar contenido</button>
                                    </form>
                                  </div>

                                  <div class="space-y-3">
                                    <h4 class="font-semibold text-marine-800">Recursos y archivos</h4>
                                    @if (recursos()[l.id]?.length) {
                                      <ul class="space-y-2 text-sm">
                                        @for (r of recursos()[l.id]; track r.id) {
                                          <li class="flex items-center justify-between gap-2 rounded border border-surface-200 p-2">
                                            <div class="min-w-0">
                                              <p class="truncate font-medium">{{ r.nombre }}</p>
                                              <p class="text-xs text-marine-500">{{ r.tipo }} @if (r.tamano_bytes) { · {{ (r.tamano_bytes / 1024) | number:'1.0-0' }} KB } @if (r.ruta_storage) { · almacenamiento }</p>
                                            </div>
                                            <div class="flex items-center gap-2">
                                              @if (r.url) { <a [href]="r.url" target="_blank" rel="noopener" class="text-xs text-brand-600 hover:underline">Abrir</a> }
                                              <button class="text-xs text-danger-600 hover:underline" type="button" (click)="eliminarRecurso(l.id, r)">Eliminar</button>
                                            </div>
                                          </li>
                                        }
                                      </ul>
                                    } @else {
                                      <p class="text-sm text-marine-500">Sin recursos. Sube archivos (PDF, imagen, etc.) o agrega enlaces.</p>
                                    }

                                    <div class="space-y-2 rounded bg-surface-50 p-3">
                                      <p class="text-sm font-medium text-marine-700">Subir archivo (Storage)</p>
                                      <input type="file" class="block w-full text-sm" (change)="onArchivoRecurso($event, l)" [disabled]="subiendo() === l.id" />
                                      @if (subiendo() === l.id) { <p class="text-xs text-marine-500">Subiendo archivo...</p> }
                                      <p class="text-xs text-marine-500">El archivo se guarda en el bucket <code>recursos</code> bajo la carpeta del curso (según políticas de Storage/RLS).</p>
                                    </div>

                                    <form class="space-y-2 rounded bg-surface-50 p-3" [formGroup]="formRecurso" (ngSubmit)="crearRecursoEnlace(l)">
                                      <p class="text-sm font-medium text-marine-700">Agregar recurso por enlace</p>
                                      <div><label class="label">Nombre</label><input class="input" formControlName="nombre" /></div>
                                      <div><label class="label">URL</label><input class="input" formControlName="url" placeholder="https://…" /></div>
                                      <button class="btn btn-outline btn-sm" type="submit" [disabled]="formRecurso.invalid || guardando()">Guardar enlace</button>
                                    </form>
                                  </div>
                                </div>
                                @if (mensajeLeccion() && leccionMensajeId() === l.id) {
                                  <p class="text-sm" [class.text-success-600]="exitoLeccion()" [class.text-danger-600]="!exitoLeccion()">{{ mensajeLeccion() }}</p>
                                }
                              </div>
                            }
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </article>
            }

            <div class="rounded-button border border-gold-200 bg-gold-50 p-4 text-sm text-marine-700 space-y-1">
              <p><strong>Contenido y materiales:</strong> organiza por Unidad/Módulo/Lección y sube recursos (archivos/enlaces) visibles para estudiantes según publicación y permisos.</p>
              <p><strong>Minijuegos:</strong> asigna y publica actividades de juego por lección desde <a routerLink="/docente/minijuegos" class="underline font-medium">Minijuegos por curso</a> (usa juegos/motores del catálogo disponibles; configuración interna y resultados autoritativos dependen de administración/backend).</p>
            </div>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class CourseEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);
  private readonly storageService = inject(StorageService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly curso = signal<Curso | null>(null);
  protected readonly estructura = signal<Estructura>({ unidades: [] });
  protected readonly leccionAbierta = signal<string | null>(null);
  protected readonly contenidos = signal<Record<string, Contenido[]>>({});
  protected readonly recursos = signal<Record<string, Recurso[]>>({});
  protected readonly subiendo = signal<string | null>(null);
  protected readonly mensajeGlobal = signal('');
  protected readonly exitoGlobal = signal(false);
  protected readonly mensajeLeccion = signal('');
  protected readonly exitoLeccion = signal(false);
  protected readonly leccionMensajeId = signal<string | null>(null);

  protected readonly formUnidad = this.fb.nonNullable.group({
    numero: [1, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    publicado: [false],
  });
  protected formsModulo: Record<string, FormGroup> = {};
  protected formsLeccion: Record<string, FormGroup> = {};

  protected moduloForm(id: string): FormGroup {
    if (!this.formsModulo[id]) {
      this.formsModulo[id] = this.fb.nonNullable.group({ numero: [1, [Validators.required, Validators.min(1)]], titulo: ['', Validators.required], publicado: [false] });
    }
    return this.formsModulo[id];
  }
  protected leccionForm(id: string): FormGroup {
    if (!this.formsLeccion[id]) {
      this.formsLeccion[id] = this.fb.nonNullable.group({ numero: [1, [Validators.required, Validators.min(1)]], titulo: ['', Validators.required], duracion_minutos: [10], publicado: [false] });
    }
    return this.formsLeccion[id];
  }
  protected readonly formContenido = this.fb.nonNullable.group({
    orden: [1, [Validators.required, Validators.min(1)]],
    tipo: ['texto'],
    titulo: [''],
    cuerpo: [''],
  });
  protected readonly formRecurso = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    url: ['', [Validators.required]],
  });

  private cursoId(): string | null { return this.route.snapshot.paramMap.get('id'); }

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    const id = this.cursoId();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    if (!id) { this.error.set('No se indico el curso a gestionar.'); this.cargando.set(false); return; }

    this.cargando.set(true); this.error.set(null);
    try {
      const [asignados, curso] = await Promise.all([
        this.teacherService.listarMisCursos(user.id),
        this.courseService.obtenerPorId(id),
      ]);
      const permitido = asignados.some((a) => a.curso_id === id || a.curso?.id === id);
      if (!permitido && this.auth.rol() !== 'administrador') {
        this.error.set('No tienes acceso para gestionar este curso.');
        this.curso.set(null);
        return;
      }
      if (!curso) { this.error.set('Curso no encontrado.'); return; }
      this.curso.set(curso);
      await this.cargarEstructura(id);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el curso.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarEstructura(cursoId: string): Promise<void> {
    const est = await this.courseService.obtenerEstructuraGestion(cursoId);
    this.estructura.set(est);
    const unidades = est.unidades as (Unidad & { modulos: (Modulo & { lecciones: Leccion[] })[] })[];
    for (const u of unidades) {
      const mods = u.modulos ?? [];
      this.moduloForm(u.id).patchValue({ numero: (mods.length || 0) + 1 }, { emitEvent: false });
      for (const m of mods) {
        const lecs = m.lecciones ?? [];
        this.leccionForm(m.id).patchValue({ numero: (lecs.length || 0) + 1 }, { emitEvent: false });
      }
    }
    const abierta = this.leccionAbierta();
    if (abierta) await this.cargarDetalleLeccion(abierta);
  }

  private async refrescar(): Promise<void> {
    const id = this.cursoId();
    if (id) await this.cargarEstructura(id);
  }

  private setMsg(ok: boolean, msg: string): void { this.exitoGlobal.set(ok); this.mensajeGlobal.set(msg); }
  private setMsgL(leccionId: string, ok: boolean, msg: string): void { this.leccionMensajeId.set(leccionId); this.exitoLeccion.set(ok); this.mensajeLeccion.set(msg); }

  protected async crearUnidad(): Promise<void> {
    const id = this.cursoId(); if (!id || this.formUnidad.invalid) return;
    this.guardando.set(true);
    try {
      const v = this.formUnidad.getRawValue();
      await this.courseService.crearUnidad(id, { numero: Number(v.numero), titulo: v.titulo, descripcion: v.descripcion || null, publicado: v.publicado });
      this.formUnidad.patchValue({ numero: (this.estructura().unidades.length + 2), titulo: '', descripcion: '', publicado: false });
      await this.refrescar();
      this.setMsg(true, 'Unidad creada.');
    } catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo crear la unidad.'); }
    finally { this.guardando.set(false); }
  }
  protected async togglePublicacionUnidad(u: Unidad): Promise<void> {
    try { await this.courseService.actualizarUnidad(u.id, { publicado: !u.publicado }); await this.refrescar(); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo actualizar la unidad.'); }
  }
  protected async eliminarUnidad(u: Unidad): Promise<void> {
    if (!confirm(`¿Eliminar la unidad "${u.titulo}" y su contenido?`)) return;
    try { await this.courseService.eliminarUnidad(u.id); await this.refrescar(); this.setMsg(true, 'Unidad eliminada.'); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo eliminar la unidad.'); }
  }

  protected async crearModulo(u: any): Promise<void> {
    const f = this.formsModulo[u.id]; if (!f || f.invalid) return;
    this.guardando.set(true);
    try {
      const v = f.getRawValue();
      await this.courseService.crearModulo(u.id, { numero: Number(v.numero), titulo: v.titulo, publicado: v.publicado });
      f.patchValue({ numero: ((u.modulos?.length ?? 0) + 2), titulo: '', publicado: false });
      await this.refrescar();
      this.setMsg(true, 'Módulo creado.');
    } catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo crear el módulo.'); }
    finally { this.guardando.set(false); }
  }
  protected async togglePublicacionModulo(m: Modulo): Promise<void> {
    try { await this.courseService.actualizarModulo(m.id, { publicado: !m.publicado }); await this.refrescar(); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo actualizar el módulo.'); }
  }
  protected async eliminarModulo(m: Modulo): Promise<void> {
    if (!confirm(`¿Eliminar el módulo "${m.titulo}" y sus lecciones?`)) return;
    try { await this.courseService.eliminarModulo(m.id); await this.refrescar(); this.setMsg(true, 'Módulo eliminado.'); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo eliminar el módulo.'); }
  }

  protected async crearLeccion(m: any): Promise<void> {
    const f = this.formsLeccion[m.id]; if (!f || f.invalid) return;
    this.guardando.set(true);
    try {
      const v = f.getRawValue();
      await this.courseService.crearLeccion(m.id, { numero: Number(v.numero), titulo: v.titulo, duracion_minutos: Number(v.duracion_minutos ?? 0), publicado: v.publicado, tipo_contenido: 'texto' });
      f.patchValue({ numero: ((m.lecciones?.length ?? 0) + 2), titulo: '', duracion_minutos: 10, publicado: false });
      await this.refrescar();
      this.setMsg(true, 'Lección creada.');
    } catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo crear la lección.'); }
    finally { this.guardando.set(false); }
  }
  protected async togglePublicacionLeccion(l: Leccion): Promise<void> {
    try { await this.courseService.actualizarLeccion(l.id, { publicado: !l.publicado }); await this.refrescar(); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo actualizar la lección.'); }
  }
  protected async eliminarLeccion(l: Leccion): Promise<void> {
    if (!confirm(`¿Eliminar la lección "${l.titulo}" y sus contenidos/recursos?`)) return;
    try { await this.courseService.eliminarLeccion(l.id); if (this.leccionAbierta() === l.id) this.leccionAbierta.set(null); await this.refrescar(); this.setMsg(true, 'Lección eliminada.'); }
    catch (e) { this.setMsg(false, e instanceof Error ? e.message : 'No se pudo eliminar la lección.'); }
  }

  protected async abrirLeccion(l: Leccion): Promise<void> {
    if (this.leccionAbierta() === l.id) { this.leccionAbierta.set(null); return; }
    this.leccionAbierta.set(l.id);
    await this.cargarDetalleLeccion(l.id);
  }

  private async cargarDetalleLeccion(leccionId: string): Promise<void> {
    try {
      const [cs, rs] = await Promise.all([
        this.courseService.listarContenido(leccionId),
        this.courseService.listarRecursos(leccionId),
      ]);
      this.contenidos.update((m) => ({ ...m, [leccionId]: cs }));
      this.recursos.update((m) => ({ ...m, [leccionId]: rs }));
      this.formContenido.patchValue({ orden: (cs.length || 0) + 1, tipo: 'texto', titulo: '', cuerpo: '' });
    } catch (e) {
      this.setMsgL(leccionId, false, e instanceof Error ? e.message : 'No se pudo cargar el detalle de la lección.');
    }
  }

  protected async crearContenido(l: Leccion): Promise<void> {
    if (this.formContenido.invalid) return;
    this.guardando.set(true);
    try {
      const v = this.formContenido.getRawValue();
      await this.courseService.crearContenido(l.id, { orden: Number(v.orden), tipo: v.tipo, titulo: v.titulo || null, cuerpo: v.cuerpo || null });
      await this.cargarDetalleLeccion(l.id);
      this.setMsgL(l.id, true, 'Contenido agregado.');
    } catch (e) { this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo crear el contenido.'); }
    finally { this.guardando.set(false); }
  }
  protected async eliminarContenido(leccionId: string, c: Contenido): Promise<void> {
    if (!confirm('¿Eliminar este contenido?')) return;
    try { await this.courseService.eliminarContenido(c.id); await this.cargarDetalleLeccion(leccionId); this.setMsgL(leccionId, true, 'Contenido eliminado.'); }
    catch (e) { this.setMsgL(leccionId, false, e instanceof Error ? e.message : 'No se pudo eliminar.'); }
  }

  protected async onArchivoRecurso(event: Event, l: Leccion): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const curso = this.curso();
    if (!file || !curso) return;
    this.subiendo.set(l.id);
    try {
      const up = await this.storageService.subirRecursoCurso(curso.id, file);
      const tipo = file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'imagen' : file.type.startsWith('video/') ? 'video' : 'archivo';
      await this.courseService.crearRecurso(l.id, {
        nombre: file.name,
        tipo,
        url: up.url,
        ruta_storage: up.ruta,
        tamano_bytes: file.size,
        mime_type: file.type || null,
        descargable: true,
      });
      await this.cargarDetalleLeccion(l.id);
      this.setMsgL(l.id, true, 'Archivo subido y registrado como recurso.');
    } catch (e) {
      this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo subir el archivo (revisa permisos de Storage/RLS y tu asignacion al curso).');
    } finally {
      this.subiendo.set(null);
      input.value = '';
    }
  }

  protected async crearRecursoEnlace(l: Leccion): Promise<void> {
    if (this.formRecurso.invalid) return;
    this.guardando.set(true);
    try {
      const v = this.formRecurso.getRawValue();
      await this.courseService.crearRecurso(l.id, { nombre: v.nombre, tipo: 'enlace', url: v.url, descargable: false });
      this.formRecurso.reset({ nombre: '', url: '' });
      await this.cargarDetalleLeccion(l.id);
      this.setMsgL(l.id, true, 'Recurso agregado.');
    } catch (e) { this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo agregar el recurso.'); }
    finally { this.guardando.set(false); }
  }
  protected async eliminarRecurso(leccionId: string, r: Recurso): Promise<void> {
    if (!confirm(`¿Eliminar el recurso "${r.nombre}"?`)) return;
    try {
      // eliminar registro; opcionalmente podríamos borrar del storage si ruta_storage existe, pero para evitar fallos por permisos lo dejamos como best-effort separado si se requiere
      if (r.ruta_storage) {
        try { await this.storageService.eliminarRecurso(r.ruta_storage); } catch { /* best effort */ }
      }
      await this.courseService.eliminarRecurso(r.id);
      await this.cargarDetalleLeccion(leccionId);
      this.setMsgL(leccionId, true, 'Recurso eliminado.');
    } catch (e) { this.setMsgL(leccionId, false, e instanceof Error ? e.message : 'No se pudo eliminar el recurso.'); }
  }
}
