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
                <span class="badge" [class.badge-success]="c.estado === 'publicado'" [class.badge-neutral]="c.estado !== 'publicado'">{{ c.estado }}</span>
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
                                <div class="space-y-3">
                                  <h4 class="font-semibold text-marine-800">Contenido de la lección</h4>
                                  <p class="text-xs text-marine-500">Esto es exactamente lo que el estudiante verá en su aula, en este orden. Cada bloque es numerado y titulado.</p>
                                  @if (contenidos()[l.id]?.length || recursosHuerfanos()[l.id]?.length) {
                                    <ol class="space-y-2 text-sm">
                                      @for (ct of contenidos()[l.id] ?? []; track ct.id) {
                                        <li class="rounded border border-surface-200 p-2.5">
                                          <div class="flex items-start justify-between gap-2">
                                            <div class="min-w-0">
                                              <p class="font-medium">{{ ct.orden }}. {{ ct.titulo }} <span class="text-marine-400">[{{ etiquetaTipoContenido(ct.tipo) }}]</span></p>
                                              @if (ct.cuerpo) { <p class="mt-1 whitespace-pre-wrap text-marine-600">{{ ct.cuerpo }}</p> }
                                              @if (adjuntosDe(l.id, ct.id).length) {
                                                <ul class="mt-2 space-y-1">
                                                  @for (r of adjuntosDe(l.id, ct.id); track r.id) {
                                                    <li class="flex items-center gap-2 rounded bg-surface-50 px-2 py-1 text-xs text-marine-600">
                                                      <span>{{ iconoTipoRecurso(r.tipo) }}</span>
                                                      <span class="min-w-0 truncate font-medium text-marine-800" [title]="r.nombre">{{ r.nombre }}</span>
                                                      @if (r.tamano_bytes) { <span class="text-marine-400">· {{ (r.tamano_bytes / 1024) | number:'1.0-0' }} KB</span> }
                                                      @if (r.url) { <a [href]="r.url" target="_blank" rel="noopener" class="text-brand-700 underline">Abrir</a> }
                                                    </li>
                                                  }
                                                </ul>
                                              }
                                            </div>
                                            <div class="flex shrink-0 flex-col items-end gap-1">
                                              <button class="text-xs font-semibold text-brand-700 hover:underline" type="button" (click)="iniciarEdicion(l, ct)">{{ materialEditorId() === ct.id ? 'Cerrar' : 'Editar' }}</button>
                                              <button class="text-xs text-danger-600 hover:underline" type="button" (click)="eliminarContenido(l.id, ct)">Eliminar</button>
                                            </div>
                                          </div>

                                          <!-- Editor inline: título, descripción, tipo, URL y reemplazo de archivo -->
                                          @if (materialEditorId() === ct.id) {
                                            <form class="mt-2 space-y-2 rounded border border-brand-200 bg-surface-50 p-3" [formGroup]="editFormGroup" (ngSubmit)="guardarEdicion(l, ct)">
                                              <p class="text-xs font-bold uppercase tracking-wide text-marine-500">Editar material</p>
                                              <div>
                                                <label class="label" for="edit-titulo">Título</label>
                                                <input id="edit-titulo" class="input" formControlName="titulo" />
                                              </div>
                                              <div>
                                                <label class="label" for="edit-desc">Descripción / instrucciones</label>
                                                <textarea id="edit-desc" class="textarea" rows="2" formControlName="cuerpo"></textarea>
                                              </div>
                                              @let adj = adjuntoEditar(l.id, ct.id);
                                              <div class="grid gap-2 sm:grid-cols-2">
                                                <div>
                                                  <label class="label" for="edit-tipo">Tipo</label>
                                                  <select id="edit-tipo" class="select" formControlName="tipo">
                                                    <option value="texto">Texto</option>
                                                    <option value="video">Video</option>
                                                    <option value="enlace">Enlace</option>
                                                    <option value="documento">Documento</option>
                                                    <option value="imagen">Imagen</option>
                                                    <option value="otro">Otro</option>
                                                  </select>
                                                </div>
                                                @if (adj && adj.url != null || adj?.tipo === 'enlace' || adj?.tipo === 'video' || adj?.url) {
                                                  <div>
                                                    <label class="label" for="edit-url">URL</label>
                                                    <input id="edit-url" class="input" formControlName="url" placeholder="https://…" />
                                                  </div>
                                                }
                                              </div>
                                              <div class="flex flex-wrap items-center justify-between gap-2">
                                                @if (adj?.ruta_storage) {
                                                  <input #reemplazarInput type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.json,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.mov" [disabled]="reemplazando() === ct.id" (change)="reemplazarArchivo($event, l, ct, adj)" />
                                                  <button type="button" class="btn btn-outline btn-sm" [disabled]="reemplazando() === ct.id" (click)="reemplazarInput.click()">{{ reemplazando() === ct.id ? 'Reemplazando…' : 'Reemplazar archivo' }}</button>
                                                } @else {
                                                  <span class="text-xs text-marine-500">Sin archivo adjunto en este bloque.</span>
                                                }
                                                <div class="flex flex-wrap gap-2">
                                                  <button type="button" class="btn btn-outline btn-sm" (click)="cancelarEdicion()">Cancelar</button>
                                                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="editFormGroup.invalid || guardandoEdicion() === ct.id">{{ guardandoEdicion() === ct.id ? 'Guardando…' : 'Guardar cambios' }}</button>
                                                </div>
                                              </div>
                                            </form>
                                          }
                                        </li>
                                      }
                                      @for (r of recursosHuerfanos()[l.id] ?? []; track r.id) {
                                        <li class="rounded border border-dashed border-surface-200 p-2.5 text-xs text-marine-500">
                                          <div class="flex items-center justify-between gap-2">
                                            <div class="min-w-0">
                                              <span class="font-semibold text-marine-700">Archivo:</span>
                                              <span class="ml-1 truncate" [title]="r.nombre">{{ r.nombre }}</span>
                                              @if (r.tamano_bytes) { <span class="ml-1">· {{ (r.tamano_bytes / 1024) | number:'1.0-0' }} KB</span> }
                                            </div>
                                            <div class="flex shrink-0 items-center gap-2">
                                              <button class="text-xs font-semibold text-brand-700 hover:underline" type="button" (click)="iniciarEdicionSuelta(r)">{{ materialEditorId() === 'res-' + r.id ? 'Cerrar' : 'Editar' }}</button>
                                              @if (r.ruta_storage) {
                                                <input #reemplazarSuelta type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.json,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.mov" [disabled]="reemplazando() === 'res-' + r.id" (change)="reemplazarArchivo($event, l, null, r)" />
                                                <button class="text-xs text-brand-700 hover:underline" type="button" [disabled]="reemplazando() === 'res-' + r.id" (click)="reemplazarSuelta.click()">{{ reemplazando() === 'res-' + r.id ? 'Reemplazando…' : 'Reemplazar' }}</button>
                                              }
                                              <button class="text-xs text-danger-600 hover:underline" type="button" (click)="eliminarRecurso(l.id, r)">Eliminar</button>
                                            </div>
                                          </div>
                                          <!-- Editor inline para recursos sueltos -->
                                          @if (materialEditorId() === 'res-' + r.id) {
                                            <form class="mt-2 space-y-2 rounded border border-brand-200 bg-surface-50 p-3" [formGroup]="editFormGroup" (ngSubmit)="guardarEdicionRecurso(l, r)">
                                              <p class="text-xs font-bold uppercase tracking-wide text-marine-500">Editar recurso</p>
                                              <div><label class="label" for="edit-res-tit">Título</label><input id="edit-res-tit" class="input" formControlName="titulo" placeholder="Nombre del archivo/enlace" /></div>
                                              <div class="grid gap-2 sm:grid-cols-2">
                                                <div><label class="label" for="edit-res-tipo">Tipo</label><select id="edit-res-tipo" class="select" formControlName="tipo"><option value="documento">Documento</option><option value="imagen">Imagen</option><option value="video">Video</option><option value="archivo">Archivo</option><option value="enlace">Enlace</option><option value="otro">Otro</option></select></div>
                                                <div><label class="label" for="edit-res-url">URL</label><input id="edit-res-url" class="input" formControlName="url" placeholder="https://…" /></div>
                                              </div>
                                              <div class="flex items-center justify-end gap-2">
                                                <button type="button" class="btn btn-outline btn-sm" (click)="cancelarEdicion()">Cancelar</button>
                                                <button type="submit" class="btn btn-primary btn-sm" [disabled]="editFormGroup.invalid || guardandoEdicion() === 'res-' + r.id">{{ guardandoEdicion() === 'res-' + r.id ? 'Guardando…' : 'Guardar cambios' }}</button>
                                              </div>
                                            </form>
                                          }
                                        </li>
                                      }
                                    </ol>
                                  } @else {
                                    <p class="text-sm text-marine-500">Aún no agregas material a esta lección. Usa el formulario de abajo: creas el contenido y (opcionalmente) el archivo adjunto en un solo paso.</p>
                                  }

                                  <!-- Formulario único: creas todo en un solo paso (orden auto) -->
                                  <form class="space-y-3 rounded-lg border border-brand-100 bg-brand-50/40 p-3" [formGroup]="formMaterial" (ngSubmit)="agregarMaterial(l)">
                                    <p class="text-sm font-semibold text-marine-800">Agregar material a la lección</p>
                                    <div>
                                      <label class="label" for="material-titulo">Título <span class="text-danger-600">*</span></label>
                                      <input id="material-titulo" class="input" formControlName="titulo" placeholder="Ej. Clase: normalización (FN1–FN3)" required />
                                      @if (formMaterial.controls.titulo.invalid && formMaterial.controls.titulo.touched) { <p class="mt-1 text-xs text-danger-600">El título es obligatorio.</p> }
                                    </div>
                                    <div>
                                      <label class="label" for="material-desc">Descripción / instrucciones</label>
                                      <textarea id="material-desc" class="textarea" rows="3" formControlName="cuerpo" placeholder="(Opcional) Qué debe hacer el estudiante aquí"></textarea>
                                    </div>
                                    <div class="grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <label class="label" for="material-tipo">Tipo de material</label>
                                        <select id="material-tipo" class="select" formControlName="tipo">
                                          <option value="texto">Texto (el estudiante lo lee aquí)</option>
                                          <option value="video">Video (pega el enlace del video)</option>
                                          <option value="enlace">Enlace externo</option>
                                          <option value="archivo">Archivo (PDF/Word/Imagen/Video/ZIP)</option>
                                        </select>
                                      </div>
                                      @if (formMaterial.controls.tipo.value === 'archivo') {
                                        <div>
                                          <label class="label" for="material-file">Archivo</label>
                                          <input id="material-file" #archivoInput type="file" class="block w-full text-sm" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.json,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.mov" [disabled]="subiendo() === l.id" (change)="onArchivoMaterial($event, l)" />
                                          @if (subiendo() === l.id) { <p class="mt-1 text-xs text-marine-500">Subiendo archivo…</p> }
                                          @else if (archivoMaterialNombre()) { <p class="mt-1 text-xs text-success-600">Listo: {{ archivoMaterialNombre() }}</p> }
                                        </div>
                                      } @else if (formMaterial.controls.tipo.value === 'texto') {
                                        <p class="self-end text-xs text-marine-500">Sin archivo ni enlace: el texto va directo dentro del aula.</p>
                                      } @else {
                                        <div>
                                          <label class="label" for="material-url">URL</label>
                                          <input id="material-url" class="input" formControlName="url" placeholder="https://…" />
                                          @if (formMaterial.controls.url.invalid && formMaterial.controls.url.touched) { <p class="mt-1 text-xs text-danger-600">Ingresa una URL (https://…).</p> }
                                        </div>
                                      }
                                    </div>
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                      <p class="text-[0.7rem] text-marine-400">El orden se numera solo (1, 2, 3…). El archivo y el contenido se crean juntos.</p>
                                      <button class="btn btn-primary btn-sm" type="submit" [disabled]="guardando() || formMaterial.invalid || (formMaterial.controls.tipo.value === 'archivo' && !archivoMaterial()) || ((formMaterial.controls.tipo.value === 'video' || formMaterial.controls.tipo.value === 'enlace') && formMaterial.controls.url.invalid)">{{ subiendo() === l.id ? 'Subiendo…' : 'Guardar en la lección' }}</button>
                                    </div>
                                  </form>
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
  protected readonly formMaterial = this.fb.nonNullable.group({
    tipo: ['texto' as 'texto' | 'video' | 'enlace' | 'archivo'],
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    cuerpo: [''],
    url: [''],
  });
  /** Archivo elegido con el tipo 'archivo' (se sube adentro de agregarMaterial). */
  protected readonly archivoMaterial = signal<File | null>(null);
  /** Nombre legible del archivo elegido. */
  protected readonly archivoMaterialNombre = signal<string>('');
  /** Bloque de contenido (o 'res-<id>' para recurso suelto) en edición desde la lista. */
  protected readonly materialEditorId = signal<string | null>(null);
  /** Id del bloque/recurso guardándose o reemplazando archivo. */
  protected readonly guardandoEdicion = signal<string | null>(null);
  /** Id del bloque cuyo adjunto se está reemplazando. */
  protected readonly reemplazando = signal<string | null>(null);
  /** Formulario activo para la fila en edición. */
  protected readonly editFormGroup = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    cuerpo: [''],
    tipo: ['texto' as string],
    url: [''],
  });

  private cursoId(): string | null { return this.route.snapshot.paramMap.get('id'); }

  ngOnInit(): void {
    void this.cargar();
    this.formMaterial.controls.tipo.valueChanges.subscribe((t) => {
      if (t !== 'archivo') {
        this.archivoMaterial.set(null);
        this.archivoMaterialNombre.set('');
      }
    });
  }

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
      this.formUnidad.patchValue({ numero: (this.estructura().unidades.length + 1), titulo: '', descripcion: '', publicado: false });
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
      f.patchValue({ numero: ((u.modulos?.length ?? 0) + 1), titulo: '', publicado: false });
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
      f.patchValue({ numero: ((m.lecciones?.length ?? 0) + 1), titulo: '', duracion_minutos: 10, publicado: false });
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

  protected async cargarDetalleLeccion(leccionId: string): Promise<void> {
    try {
      const [cs, rs] = await Promise.all([
        this.courseService.listarContenido(leccionId),
        this.courseService.listarRecursos(leccionId),
      ]);
      this.contenidos.update((m) => ({ ...m, [leccionId]: cs }));
      this.recursos.update((m) => ({ ...m, [leccionId]: rs }));
    } catch (e) {
      this.setMsgL(leccionId, false, e instanceof Error ? e.message : 'No se pudo cargar el detalle de la lección.');
    }
  }

  /** Recursos adjuntos a un bloque de contenido (mismo material). */
  protected adjuntosDe(leccionId: string, contenidoId: string): Recurso[] {
    return (this.recursos()[leccionId] ?? []).filter((r) => r.contenido_id === contenidoId);
  }

  /** Primer adjunto editable/reemplazable de un bloque (null si es texto puro). */
  protected adjuntoEditar(leccionId: string, contenidoId: string): Recurso | null {
    return this.adjuntosDe(leccionId, contenidoId)[0] ?? null;
  }

  protected iniciarEdicion(l: Leccion, ct: Contenido): void {
    this.materialEditorId.set(ct.id);
    const r = this.adjuntoEditar(l.id, ct.id);
    this.editFormGroup.reset({
      titulo: ct.titulo ?? '',
      cuerpo: ct.cuerpo ?? '',
      tipo: ct.tipo ?? 'texto',
      url: r?.url ?? '',
    });
  }

  protected iniciarEdicionSuelta(r: Recurso): void {
    this.materialEditorId.set('res-' + r.id);
    this.editFormGroup.reset({
      titulo: r.nombre,
      cuerpo: '',
      tipo: r.tipo ?? 'archivo',
      url: r.url ?? '',
    });
  }

  protected cancelarEdicion(): void {
    this.materialEditorId.set(null);
  }

  /** Guarda título/descripción/tipo del bloque + (si hay) ajusta su adjunto. */
  protected async guardarEdicion(l: Leccion, ct: Contenido): Promise<void> {
    if (this.editFormGroup.invalid) {
      this.editFormGroup.markAllAsTouched();
      this.setMsgL(l.id, false, 'El título es obligatorio.');
      return;
    }
    const v = this.editFormGroup.getRawValue();
    this.guardandoEdicion.set(ct.id);
    try {
      await this.courseService.actualizarContenido(ct.id, {
        titulo: v.titulo.trim(),
        cuerpo: v.cuerpo?.trim() || null,
        tipo: v.tipo,
      });
      const r = this.adjuntoEditar(l.id, ct.id);
      if (r) {
        const tipoRec = ['texto', 'otro'].includes(v.tipo) ? 'otro' : ['enlace', 'video', 'imagen', 'documento'].includes(v.tipo) ? v.tipo : 'documento';
        await this.courseService.actualizarRecurso(r.id, {
          nombre: v.titulo.trim(),
          tipo: tipoRec,
          url: v.url?.trim() || null,
        });
      }
      await this.cargarDetalleLeccion(l.id);
      this.materialEditorId.set(null);
      this.setMsgL(l.id, true, 'Material actualizado.');
    } catch (e) {
      this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo actualizar.');
    } finally {
      this.guardandoEdicion.set(null);
    }
  }

  /** Guarda cambios de un recurso suelto (rename/url/tipo). */
  protected async guardarEdicionRecurso(l: Leccion, r: Recurso): Promise<void> {
    if (this.editFormGroup.invalid) {
      this.editFormGroup.markAllAsTouched();
      this.setMsgL(l.id, false, 'El título es obligatorio.');
      return;
    }
    const v = this.editFormGroup.getRawValue();
    this.guardandoEdicion.set('res-' + r.id);
    try {
      await this.courseService.actualizarRecurso(r.id, {
        nombre: v.titulo.trim(),
        tipo: v.tipo,
        url: v.url?.trim() || null,
      });
      await this.cargarDetalleLeccion(l.id);
      this.materialEditorId.set(null);
      this.setMsgL(l.id, true, 'Recurso actualizado.');
    } catch (e) {
      this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo actualizar.');
    } finally {
      this.guardandoEdicion.set(null);
    }
  }

  /** Reemplaza el archivo adjunto de un bloque/recurso (actualiza el mismo, no duplica). */
  protected async reemplazarArchivo(event: Event, l: Leccion, ct: Contenido | null, r: Recurso | null): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !r) return;
    if (file.size > 50 * 1024 * 1024) { this.setMsgL(l.id, false, 'El archivo supera 50 MB.'); return; }
    const curso = this.curso();
    if (!curso) return;
    const clave = r.contenido_id ?? ('res-' + r.id);
    this.reemplazando.set(clave);
    try {
      const rutaAntigua = r.ruta_storage ?? '';
      const up = await this.storageService.subirRecursoCurso(curso.id, file);
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      const tipoRec = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'rtf', 'odt', 'ods', 'odp', 'txt', 'md'].includes(ext)
        ? 'documento'
        : file.type.startsWith('image/') ? 'imagen'
        : file.type.startsWith('video/') ? 'video'
        : ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext) ? 'archivo'
        : 'otro';
      await this.courseService.actualizarRecurso(r.id, {
        ruta_storage: up.ruta,
        mime_type: file.type || null,
        tamano_bytes: file.size,
        tipo: tipoRec,
      });
      if (rutaAntigua) await this.storageService.eliminarRecurso(rutaAntigua).catch(() => undefined);
      await this.cargarDetalleLeccion(l.id);
      this.setMsgL(l.id, true, 'Archivo reemplazado.');
    } catch (e) {
      this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo reemplazar el archivo.');
    } finally {
      this.reemplazando.set(null);
    }
  }

  /** Recursos sin bloque de contenido asociado (antiguos o sueltos). */
  protected recursosHuerfanos(leccionId: string): Recurso[] {
    return (this.recursos()[leccionId] ?? []).filter((r) => !r.contenido_id);
  }

  protected etiquetaTipoContenido(tipo: string): string {
    const map: Record<string, string> = {
      texto: 'Texto', video: 'Video', imagen: 'Imagen', documento: 'Documento',
      enlace: 'Enlace', quiz: 'Quiz', examen: 'Examen', reto: 'Reto',
      minijuego: 'Minijuego', foro: 'Foro', otro: 'Otro',
    };
    return map[(tipo ?? '').toLowerCase()] ?? tipo;
  }

  protected iconoTipoRecurso(tipo: string): string {
    const map: Record<string, string> = {
      documento: '📄', imagen: '🖼️', video: '🎬', archivo: '🗜️', enlace: '🔗', otro: '📎',
    };
    return map[(tipo ?? '').toLowerCase()] ?? '📎';
  }

  /** Archivo elegido en el formulario único (se sube dentro de agregarMaterial). */
  protected onArchivoMaterial(event: Event, l: Leccion): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.archivoMaterial.set(file);
    this.archivoMaterialNombre.set(file.name);
    this.setMsgL(l.id, true, '');
  }

  /** Formulario único de material: crea el bloque de contenido + (si corresponde) el recurso adjunto, enlazados. */
  protected async agregarMaterial(l: Leccion): Promise<void> {
    const v = this.formMaterial.getRawValue();
    if (!v.titulo.trim()) {
      this.setMsgL(l.id, false, 'El título es obligatorio.');
      this.formMaterial.controls.titulo.markAsTouched();
      return;
    }
    const tipo = v.tipo;
    const url = (v.url ?? '').trim();
    const file = this.archivoMaterial();
    if (tipo === 'archivo' && !file) { this.setMsgL(l.id, false, 'Elige el archivo a subir.'); return; }
    if ((tipo === 'video' || tipo === 'enlace') && !url) { this.setMsgL(l.id, false, 'Ingresa la URL del video o enlace.'); return; }
    const curso = this.curso();
    if (!curso) return;

    this.guardando.set(true);
    this.subiendo.set(l.id);
    const cs = this.contenidos()[l.id] ?? [];
    const orden = cs.length ? Math.max(...cs.map((c) => c.orden ?? 0)) + 1 : 1;

    try {
      const mime = (file?.type ?? '').toLowerCase();
      const tipoContenido = tipo === 'texto' ? 'texto'
        : tipo === 'video' ? 'video'
        : tipo === 'enlace' ? 'enlace'
        : mime.startsWith('image/') ? 'imagen' : 'documento';

      const ct = await this.courseService.crearContenido(l.id, {
        orden,
        tipo: tipoContenido,
        titulo: v.titulo.trim(),
        cuerpo: v.cuerpo?.trim() || null,
      });

      if (tipo === 'archivo' && file) {
        const up = await this.storageService.subirRecursoCurso(curso.id, file);
        const ext = (file.name.split('.').pop() ?? '').toLowerCase();
        const tipoRec = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'rtf', 'odt', 'ods', 'odp', 'txt', 'md'].includes(ext)
          ? 'documento'
          : file.type.startsWith('image/') ? 'imagen'
          : file.type.startsWith('video/') ? 'video'
          : ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext) ? 'archivo'
          : 'otro';
        await this.courseService.crearRecurso(l.id, {
          nombre: v.titulo.trim(),
          tipo: tipoRec,
          ruta_storage: up.ruta,
          tamano_bytes: file.size,
          mime_type: file.type || null,
          descargable: true,
          contenido_id: ct.id,
        });
      } else if ((tipo === 'video' || tipo === 'enlace') && url) {
        await this.courseService.crearRecurso(l.id, {
          nombre: v.titulo.trim(),
          tipo: tipo === 'video' ? 'video' : 'enlace',
          url,
          descargable: false,
          contenido_id: ct.id,
        });
      }

      await this.cargarDetalleLeccion(l.id);
      this.formMaterial.reset({ tipo: 'texto', titulo: '', cuerpo: '', url: '' });
      this.archivoMaterial.set(null);
      this.archivoMaterialNombre.set('');
      this.setMsgL(l.id, true, 'Material guardado en la lección.');
    } catch (e) {
      this.setMsgL(l.id, false, e instanceof Error ? e.message : 'No se pudo guardar el material.');
    } finally {
      this.guardando.set(false);
      this.subiendo.set(null);
    }
  }

  protected async eliminarContenido(leccionId: string, c: Contenido): Promise<void> {
    if (!confirm('¿Eliminar este bloque de contenido y sus archivos adjuntos?')) return;
    try {
      // Best-effort: borra los adjuntos asociados primero (si el docente quiere, elimina desde aquí).
      const adjuntos = this.adjuntosDe(leccionId, c.id);
      for (const r of adjuntos) {
        try { if (r.ruta_storage) await this.storageService.eliminarRecurso(r.ruta_storage); } catch { /* best effort */ }
        await this.courseService.eliminarRecurso(r.id);
      }
      await this.courseService.eliminarContenido(c.id);
      await this.cargarDetalleLeccion(leccionId);
      this.setMsgL(leccionId, true, 'Contenido eliminado.');
    } catch (e) {
      this.setMsgL(leccionId, false, e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
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
