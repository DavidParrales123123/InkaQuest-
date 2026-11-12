import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';
import { Curso, Recurso } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type LeccionCtx = { id: string; titulo: string; numero: number; moduloTitulo: string; unidadTitulo: string; unidadNumero: number };

@Component({
  selector: 'app-admin-resources',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Recursos" descripcion="Crea, sube y elimina recursos educativos y materiales asociados a lecciones de los cursos." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="card card-body space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">Subir archivo (Storage)</h2>
          <form class="space-y-3" [formGroup]="formArchivo" (ngSubmit)="subirArchivo()">
            <div>
              <label class="label" for="curso-a">Curso</label>
              <select id="curso-a" class="select" formControlName="curso_id" (change)="onCursoChange($any($event.target).value, true)">
                <option value="">Selecciona un curso</option>
                @for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }
              </select>
            </div>
            <div>
              <label class="label" for="leccion-a">Lección</label>
              <select id="leccion-a" class="select" formControlName="leccion_id">
                <option value="">Selecciona una lección</option>
                @for (l of leccionesArchivo(); track l.id) {
                  <option [value]="l.id">U{{ l.unidadNumero }} {{ l.unidadTitulo }} · {{ l.moduloTitulo }} · {{ l.titulo }}</option>
                }
              </select>
              @if (formArchivo.controls.curso_id.value && leccionesArchivo().length === 0) {
                <p class="mt-1 text-xs text-amber-700">Este curso no tiene lecciones. Crea la estructura primero en el módulo académico.</p>
              }
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label class="label" for="nombre-a">Nombre</label><input id="nombre-a" class="input" formControlName="nombre" placeholder="Ej. Guía de práctica.pdf" /></div>
              <div>
                <label class="label" for="tipo-a">Tipo</label>
                <select id="tipo-a" class="select" formControlName="tipo">
                  <option value="archivo">Archivo</option>
                  <option value="documento">Documento</option>
                  <option value="imagen">Imagen</option>
                  <option value="video">Video</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="descargable" /> Descargable</label>
            <div>
              <label class="label" for="file-a">Archivo</label>
              <input id="file-a" type="file" class="block w-full text-sm" (change)="onArchivo($event)" [attr.accept]="'*/*'" [disabled]="subiendo()" />
              @if (archivoNombre()) { <p class="mt-1 text-xs text-marine-500">{{ archivoNombre() }}</p> }
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="formArchivo.invalid || subiendo()">{{ subiendo() ? 'Subiendo…' : 'Subir recurso' }}</button>
          </form>
        </div>

        <div class="card card-body space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">Agregar recurso por enlace</h2>
          <form class="space-y-3" [formGroup]="formEnlace" (ngSubmit)="crearEnlace()">
            <div>
              <label class="label" for="curso-e">Curso</label>
              <select id="curso-e" class="select" formControlName="curso_id" (change)="onCursoChange($any($event.target).value, false)">
                <option value="">Selecciona un curso</option>
                @for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }
              </select>
            </div>
            <div>
              <label class="label" for="leccion-e">Lección</label>
              <select id="leccion-e" class="select" formControlName="leccion_id">
                <option value="">Selecciona una lección</option>
                @for (l of leccionesEnlace(); track l.id) {
                  <option [value]="l.id">U{{ l.unidadNumero }} {{ l.unidadTitulo }} · {{ l.moduloTitulo }} · {{ l.titulo }}</option>
                }
              </select>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label class="label" for="nombre-e">Nombre</label><input id="nombre-e" class="input" formControlName="nombre" placeholder="Ej. Documentación oficial" /></div>
              <div>
                <label class="label" for="tipo-e">Tipo</label>
                <select id="tipo-e" class="select" formControlName="tipo"><option value="enlace">Enlace</option><option value="video">Video</option><option value="documento">Documento</option><option value="imagen">Imagen</option></select>
              </div>
            </div>
            <div><label class="label" for="url-e">URL</label><input id="url-e" class="input" formControlName="url" placeholder="https://…" /></div>
            <label class="inline-flex items-center gap-2 text-sm text-marine-700"><input type="checkbox" formControlName="descargable" /> Descargable / abre como referencia</label>
            <button class="btn btn-primary" type="submit" [disabled]="formEnlace.invalid || guardando()">{{ guardando() ? 'Guardando…' : 'Agregar enlace' }}</button>
          </form>
        </div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="recursos().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Lección</th><th>Descargable</th><th>MIME</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (r of recursos(); track r.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ r.nombre }}</td>
                  <td>{{ r.tipo }}</td>
                  <td class="font-mono text-xs">{{ r.leccion_id.slice(0,8) }}…</td>
                  <td>{{ r.descargable ? 'Sí' : 'No' }}</td>
                  <td class="text-xs">{{ r.mime_type || '—' }}</td>
                  <td><button class="link text-danger-600 text-sm" type="button" (click)="eliminar(r)" [disabled]="eliminandoId() === r.id">{{ eliminandoId() === r.id ? 'Eliminando…' : 'Eliminar' }}</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ResourcesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly storage = inject(StorageService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly subiendo = signal(false);
  protected readonly guardando = signal(false);
  protected readonly eliminandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly leccionesArchivo = signal<LeccionCtx[]>([]);
  protected readonly leccionesEnlace = signal<LeccionCtx[]>([]);
  protected readonly archivo = signal<File | null>(null);
  protected readonly archivoNombre = signal<string>('');

  protected readonly formArchivo = this.fb.nonNullable.group({
    curso_id: ['', Validators.required],
    leccion_id: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    tipo: ['archivo'],
    descargable: [true],
  });
  protected readonly formEnlace = this.fb.nonNullable.group({
    curso_id: ['', Validators.required],
    leccion_id: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    tipo: ['enlace'],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    descargable: [false],
  });

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [cursos, recursos] = await Promise.all([
        this.adminService.listarTodosLosCursos().catch(() => [] as Curso[]),
        this.adminService.listarRecursosAdmin().catch(() => [] as Recurso[]),
      ]);
      this.cursos.set(cursos);
      this.recursos.set(recursos);
      const cursoSel = this.formArchivo.controls.curso_id.value;
      const cursoSelE = this.formEnlace.controls.curso_id.value;
      if (cursoSel) await this.onCursoChange(cursoSel, true);
      if (cursoSelE) await this.onCursoChange(cursoSelE, false);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los recursos.');
    } finally { this.cargando.set(false); }
  }

  protected async onCursoChange(cursoId: string, esArchivo: boolean): Promise<void> {
    if (!cursoId) { esArchivo ? this.leccionesArchivo.set([]) : this.leccionesEnlace.set([]); return; }
    const lecciones = await this.adminService.listarLeccionesDeCursoAdmin(cursoId).catch(() => [] as LeccionCtx[]);
    if (esArchivo) {
      this.leccionesArchivo.set(lecciones);
      this.formArchivo.patchValue({ leccion_id: '' });
    } else {
      this.leccionesEnlace.set(lecciones);
      this.formEnlace.patchValue({ leccion_id: '' });
    }
  }

  protected onArchivo(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.archivo.set(file);
    this.archivoNombre.set(file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : '');
    if (file && !this.formArchivo.controls.nombre.value.trim()) this.formArchivo.patchValue({ nombre: file.name });
  }

  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async subirArchivo(): Promise<void> {
    const cursoId = this.formArchivo.controls.curso_id.value;
    if (!cursoId || this.formArchivo.invalid) return;
    const file = this.archivo();
    if (!file) { this.setMsg(false, 'Selecciona un archivo para subir.'); return; }
    this.subiendo.set(true); this.setMsg(false, '');
    try {
      const v = this.formArchivo.getRawValue();
      const { ruta, url } = await this.storage.subirRecursoCurso(cursoId, file);
      const res = await this.adminService.crearRecursoAdmin({
        leccion_id: v.leccion_id,
        nombre: v.nombre.trim(),
        tipo: v.tipo,
        url,
        ruta_storage: ruta,
        tamano_bytes: file.size,
        mime_type: file.type || null,
        descargable: !!v.descargable,
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) {
        this.archivo.set(null); this.archivoNombre.set('');
        this.formArchivo.reset({ curso_id: cursoId, leccion_id: '', nombre: '', tipo: 'archivo', descargable: true });
        await this.cargar();
      }
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo subir el archivo.');
    } finally { this.subiendo.set(false); }
  }

  protected async crearEnlace(): Promise<void> {
    if (this.formEnlace.invalid) return;
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const v = this.formEnlace.getRawValue();
      const res = await this.adminService.crearRecursoAdmin({
        leccion_id: v.leccion_id,
        nombre: v.nombre.trim(),
        tipo: v.tipo,
        url: v.url.trim(),
        descargable: !!v.descargable,
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) {
        const keepCurso = v.curso_id;
        this.formEnlace.reset({ curso_id: keepCurso, leccion_id: '', nombre: '', tipo: 'enlace', url: '', descargable: false });
        await this.cargar();
      }
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo crear el enlace.');
    } finally { this.guardando.set(false); }
  }

  protected async eliminar(r: Recurso): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar el recurso "${r.nombre}"?`)) return;
    this.eliminandoId.set(r.id);
    try {
      const res = await this.adminService.eliminarRecursoAdmin(r.id);
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) await this.cargar();
    } finally { this.eliminandoId.set(null); }
  }
}
