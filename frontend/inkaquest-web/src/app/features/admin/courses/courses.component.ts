// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { Categoria, Curso, DocenteCurso, Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Cursos" descripcion="Catálogo completo de cursos, estado de publicación, portadas, configuración (XP/precio) y docentes asignados." [acciones]="true">
        <div acciones class="flex flex-wrap gap-2">
          <button class="btn btn-primary btn-sm" type="button" (click)="formVisible.set(!formVisible())">{{ formVisible() ? 'Ocultar creador de curso' : 'Crear curso' }}</button>
          <a routerLink="/admin/docentes" class="btn btn-primary btn-sm">Asignar docentes a cursos</a>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button>
        </div>
      </app-page-header>
      @if (mensaje()) { <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p> }

      @if (formVisible()) {
        <div class="card card-body space-y-4">
          <h2 class="text-lg font-semibold text-marine-800">{{ editandoId() ? 'Editar curso del catálogo' : 'Crear nuevo curso' }}</h2>
          <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-4" [formGroup]="formCurso" (ngSubmit)="crearCurso()">
            <div class="xl:col-span-2"><label class="label" for="titulo">Nombre del curso</label><input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Base de Datos 1" /></div>
            <div><label class="label" for="slug">Slug (URL)</label><input id="slug" class="input font-mono" formControlName="slug" placeholder="Ej. base-de-datos-1 (opcional)" /></div>
            <div>
              <label class="label" for="categoria">Categoría</label>
              <select id="categoria" class="select" formControlName="categoria_id">
                <option value="">Sin categoría</option>
                @for (cat of categorias(); track cat.id) { <option [value]="cat.id">{{ cat.nombre }}</option> }
              </select>
            </div>
            <div class="md:col-span-2 xl:col-span-4"><label class="label" for="desc">Descripción / resumen</label><textarea id="desc" class="textarea" rows="2" formControlName="descripcion" placeholder="Breve explicación del curso"></textarea></div>
            <div class="md:col-span-2 xl:col-span-4"><label class="label" for="cont">Contenido (opcional)</label><textarea id="cont" class="textarea" rows="2" formControlName="contenido" placeholder="Temas principales"></textarea></div>
            <div><label class="label" for="precio">Precio</label><input id="precio" class="input" type="number" min="0" formControlName="precio" /></div>
            <div><label class="label" for="moneda">Moneda</label><select id="moneda" class="select" formControlName="moneda"><option value="PEN">PEN (S/)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>
            <div><label class="label" for="xp">XP total al completar</label><input id="xp" class="input" type="number" min="0" formControlName="xp_total" /></div>
            <div><label class="label" for="dur">Duración (min)</label><input id="dur" class="input" type="number" min="0" formControlName="duracion_minutos" /></div>
            <div><label class="label" for="estado">Estado inicial</label><select id="estado" class="select" formControlName="estado"><option value="publicado">Publicado (aparece en el catálogo)</option><option value="borrador">Borrador</option><option value="archivado">Archivado</option></select></div>
            <div class="xl:col-span-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
              <label class="label text-marine-800" for="portada">Foto de portada (se verá en el catálogo)</label>
              <input id="portada" type="file" class="block w-full text-sm" accept="image/*" (change)="onPortada($event)" [disabled]="creando()" />
              @if (portadaUrlPreview()) {
                <div class="mt-2 flex items-start gap-3">
                  <img [src]="portadaUrlPreview()!" alt="Previsualización de la portada" class="h-28 w-44 rounded-lg border border-surface-200 object-cover" />
                  <div class="space-y-1">
                    <p class="text-xs font-medium text-marine-600">{{ portadaNombre() }}</p>
                    @if (editandoId()) { <button type="button" class="link text-xs" (click)="quitarPortada()">Quitar portada</button> }
                  </div>
                </div>
              } @else {
                <p class="mt-1 text-xs text-marine-600">Sube una imagen (horizontal, ideal 16:9/16:10) para que el curso se vea en el catálogo y en su detalle.</p>
              }
            </div>
            <div class="md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-3 border-t border-surface-200 pt-3">
              <button class="btn btn-primary" type="submit" [disabled]="formCurso.invalid || creando()">{{ creando() ? (editandoId() ? 'Guardando…' : 'Creando…') : (editandoId() ? 'Guardar cambios' : 'Crear curso') }}</button>
              <button class="btn btn-outline" type="button" (click)="cancelarEdicion()">Cancelar</button>
              <p class="text-xs text-marine-500">La portada se sube al almacenamiento de imágenes y el curso se guarda en el catálogo.</p>
            </div>
          </form>
        </div>
      }

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cursos().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Título</th><th>Slug</th><th>Estado</th><th>Precio</th><th>XP</th><th>Docentes asignados</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (c of cursos(); track c.id) {
                <tr>
                  <td class="font-medium text-marine-800">
                    @if (c.portada_url) { <img [src]="c.portada_url" [alt]="'Portada de ' + c.titulo" class="mb-1 h-10 w-16 rounded object-cover border border-surface-200" loading="lazy" /> }
                    <a [routerLink]="['/cursos', c.slug]" class="hover:text-brand-600">{{ c.titulo }}</a>
                  </td>
                  <td>{{ c.slug }}</td>
                  <td><app-status-badge [estado]="c.estado" /></td>
                  <td>{{ c.precio }} {{ c.moneda }}</td>
                  <td>{{ c.xp_total }}</td>
                  <td class="text-sm">
                    @if (docentesDeCurso(c.id).length === 0) {
                      <span class="text-marine-400">Sin docentes</span>
                    } @else {
                      <ul class="space-y-1">
                        @for (d of docentesDeCurso(c.id); track d.id) {
                          <li>
                            <span class="font-medium text-marine-700">{{ d.nombre }}</span>
                            <span class="text-xs text-marine-500"> · {{ d.estadoCuenta }} · {{ d.activa ? 'activa' : 'inactiva' }}{{ d.responsable ? ' · responsable' : '' }}</span>
                          </li>
                        }
                      </ul>
                    }
                    <a routerLink="/admin/docentes" class="link text-xs mt-1 inline-block">Gestionar asignaciones</a>
                  </td>
                  <td class="space-x-2 whitespace-nowrap">
                    <button class="link text-sm" type="button" (click)="editarCurso(c)">Editar</button>
                    @if (c.estado !== 'publicado') { <button class="link text-sm" type="button" (click)="cambiar(c.id,'publicado')">Publicar</button> }
                    @if (c.estado === 'publicado') { <button class="link text-sm" type="button" (click)="cambiar(c.id,'borrador')">Pasar a borrador</button> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La asignación de docentes a cursos se realiza desde <a routerLink="/admin/docentes" class="underline">Docentes</a> (se listan todos los docentes, incluso inactivos).</p>
    </section>
  `,
})
export class CoursesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly asignaciones = signal<DocenteCurso[]>([]);
  protected readonly docentes = signal<Perfil[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly portada = signal<File | null>(null);
  protected readonly portadaNombre = signal<string>('');
  protected readonly portadaUrlPreview = signal<string | null>(null);

  protected readonly formCurso = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    slug: [''],
    categoria_id: [''],
    descripcion: [''],
    contenido: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    moneda: ['PEN', Validators.required],
    xp_total: [0, [Validators.required, Validators.min(0)]],
    duracion_minutos: [0, [Validators.required, Validators.min(0)]],
    estado: ['publicado', Validators.required],
  });

  ngOnInit(): void { void this.cargar(); }

  protected docentesDeCurso(cursoId: string): { id: string; nombre: string; estadoCuenta: string; activa: boolean; responsable: boolean }[] {
    const dMap = new Map(this.docentes().map((d) => [d.id, d]));
    return this.asignaciones()
      .filter((a) => a.curso_id === cursoId)
      .map((a) => {
        const d = dMap.get(a.docente_id);
        const nombre = d ? ([d.nombre, d.apellido].filter(Boolean).join(' ') || d.email) : a.docente_id.slice(0, 8) + '…';
        return { id: a.id, nombre, estadoCuenta: d?.estado_cuenta ?? 'desconocido', activa: a.activo, responsable: a.es_responsable };
      });
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [cursos, asignaciones, docentes, categorias] = await Promise.all([
        this.adminService.listarTodosLosCursos(),
        this.adminService.listarAsignacionesDocenteCurso().catch(() => [] as DocenteCurso[]),
        this.adminService.listarUsuarios({ rol: 'docente', limite: 1000 }).catch(() => [] as Perfil[]),
        this.adminService.listarCategoriasAdmin().catch(() => [] as Categoria[]),
      ]);
      this.cursos.set(cursos);
      this.asignaciones.set(asignaciones);
      this.docentes.set(docentes);
      this.categorias.set(categorias);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los cursos.');
    } finally {
      this.cargando.set(false);
    }
  }

  private resetFormCurso(): void {
    this.formCurso.reset({ titulo: '', slug: '', categoria_id: '', descripcion: '', contenido: '', precio: 0, moneda: 'PEN', xp_total: 0, duracion_minutos: 0, estado: 'publicado' });
    this.portada.set(null);
    this.portadaNombre.set('');
    this.portadaUrlPreview.set(null);
    this.editandoId.set(null);
  }

  protected editarCurso(c: Curso): void {
    this.editandoId.set(c.id);
    this.portada.set(null);
    this.portadaNombre.set(c.portada_url ? 'Portada actual del curso' : '');
    this.portadaUrlPreview.set(c.portada_url ?? null);
    this.formCurso.reset({
      titulo: c.titulo,
      slug: c.slug ?? '',
      categoria_id: c.categoria_id ?? '',
      descripcion: c.descripcion ?? '',
      contenido: c.contenido ?? '',
      precio: Number(c.precio ?? 0),
      moneda: c.moneda || 'PEN',
      xp_total: Number(c.xp_total ?? 0),
      duracion_minutos: Number(c.duracion_minutos ?? 0),
      estado: c.estado || 'publicado',
    });
    this.formVisible.set(true);
    this.mensaje.set('Editando curso del catálogo. Ajusta los datos y guarda los cambios.');
    this.exito.set(true);
  }

  protected cancelarEdicion(): void {
    this.resetFormCurso();
    this.formVisible.set(false);
  }

  protected quitarPortada(): void {
    this.portada.set(null);
    this.portadaNombre.set('');
    this.portadaUrlPreview.set(null);
  }

  protected onPortada(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.portada.set(file);
    this.portadaNombre.set(file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : '');
    if (file) { this.portadaUrlPreview.set(URL.createObjectURL(file)); }
  }

  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async crearCurso(): Promise<void> {
    if (this.formCurso.invalid) return;
    this.creando.set(true); this.setMsg(false, '');
    try {
      const v = this.formCurso.getRawValue();
      const file = this.portada();
      let portada_url: string | null = null;
      if (file) {
        const up = await this.storage.subirPortadaCurso(file);
        portada_url = up.url;
      } else if (this.editandoId()) {
        portada_url = this.portadaUrlPreview() ?? null;
      }

      if (this.editandoId()) {
        const cambios: Record<string, unknown> = {
          titulo: v.titulo.trim(),
          slug: v.slug?.trim() || null,
          descripcion: v.descripcion?.trim() || null,
          contenido: v.contenido?.trim() || null,
          categoria_id: v.categoria_id || null,
          portada_url,
          estado: v.estado,
          precio: Number(v.precio),
          moneda: v.moneda,
          xp_total: Number(v.xp_total),
          duracion_minutos: Number(v.duracion_minutos),
          publicado_en: v.estado === 'publicado' ? new Date().toISOString() : null,
        };
        const res = await this.adminService.actualizarCursoAdmin(this.editandoId()!, cambios);
        this.setMsg(res.ok, res.mensaje);
        if (res.ok) { this.resetFormCurso(); this.formVisible.set(false); await this.cargar(); }
        return;
      }

      const res = await this.adminService.crearCursoAdmin({
        titulo: v.titulo.trim(),
        slug: v.slug?.trim() || undefined,
        descripcion: v.descripcion?.trim() || null,
        contenido: v.contenido?.trim() || null,
        categoria_id: v.categoria_id || null,
        portada_url,
        estado: v.estado,
        precio: Number(v.precio),
        moneda: v.moneda,
        xp_total: Number(v.xp_total),
        duracion_minutos: Number(v.duracion_minutos),
        creado_por: this.auth.usuario()?.id ?? null,
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) {
        this.resetFormCurso();
        this.formVisible.set(false);
        await this.cargar();
      }
    } catch (e) {
      this.setMsg(false, e instanceof Error ? e.message : 'No se pudo crear el curso.');
    } finally { this.creando.set(false); }
  }

  protected async cambiar(id: string, estado: string): Promise<void> {
    const r = await this.adminService.cambiarEstadoCurso(id, estado);
    this.mensaje.set(r.mensaje); this.exito.set(r.ok);
    if (r.ok) await this.cargar();
  }
}
