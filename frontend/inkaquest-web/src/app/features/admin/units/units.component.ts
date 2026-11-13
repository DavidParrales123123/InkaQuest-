// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { Curso, Unidad } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-units',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Unidades" descripcion="Unidades por curso. Filtra por curso y crea/agrega unidades en el curso que elijas." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) { <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p> }

      <div class="card card-body space-y-4">
        <h2 class="text-lg font-semibold text-marine-800">{{ editandoId() ? 'Editar unidad' : 'Agregar unidad' }}</h2>
        <form class="grid gap-4 md:grid-cols-4" [formGroup]="form" (ngSubmit)="crear()">
          <div class="md:col-span-2">
            <label class="label" for="curso">Curso</label>
            <select id="curso" class="select" formControlName="curso_id">
              <option value="">Selecciona un curso</option>
              @for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }
            </select>
          </div>
          <div><label class="label" for="num">N° de unidad</label><input id="num" class="input" type="number" min="1" formControlName="numero" /></div>
          <div><label class="label" for="xp">XP de la unidad</label><input id="xp" class="input" type="number" min="0" formControlName="xp_otorgado" /></div>
          <div class="md:col-span-2"><label class="label" for="titulo">Título</label><input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Introducción a la base de datos" /></div>
          <div class="md:col-span-2"><label class="label" for="desc">Descripción (opcional)</label><input id="desc" class="input" formControlName="descripcion" placeholder="Qué aprenderá en esta unidad" /></div>
          <label class="inline-flex items-center gap-2 text-sm text-marine-700 self-end"><input type="checkbox" formControlName="publicado" /> Publicada</label>
          <div class="md:col-span-4 flex flex-wrap items-center gap-3 border-t border-surface-200 pt-3">
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || guardando()">{{ guardando() ? 'Guardando…' : (editandoId() ? 'Guardar cambios' : 'Agregar unidad') }}</button>
            @if (editandoId()) { <button class="btn btn-outline" type="button" (click)="cancelarEdicion()">Cancelar</button> }
            <p class="text-xs text-marine-500">La unidad se crea en el curso seleccionado y luego puedes gestionar módulos y lecciones en el editor de contenido.</p>
          </div>
        </form>
      </div>

      <div class="card card-body space-y-3">
        <label class="label" for="filtro">Filtrar por curso</label>
        <div class="flex flex-wrap items-end gap-3">
          <select id="filtro" class="select max-w-xl" [value]="filtroCursoId()" (change)="onFiltroChange($any($event.target).value)">
            <option value="">Todos los cursos</option>
            @for (c of cursos(); track c.id) { <option [value]="c.id">{{ c.titulo }}</option> }
          </select>
          @if (filtroCursoId()) { <button class="btn btn-outline btn-sm" type="button" (click)="filtroCursoId.set('')">Ver todos</button> }
          <span class="text-sm text-marine-500">{{ unidadesFiltradas().length }} unidad(es)</span>
        </div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="unidadesFiltradas().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Curso</th><th>N°</th><th>Título</th><th>Publicado</th><th>XP</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (u of unidadesFiltradas(); track u.id) {
                <tr>
                  <td>{{ cursoTitulo(u.curso_id) }}</td>
                  <td>{{ u.numero }}</td>
                  <td class="font-medium text-marine-800">{{ u.titulo }}</td>
                  <td>{{ u.publicado ? 'Sí' : 'No' }}</td>
                  <td>{{ u.xp_otorgado }}</td>
                  <td>
                    <button class="link text-sm" type="button" (click)="editarUnidad(u)">Editar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class UnitsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly unidades = signal<Unidad[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly filtroCursoId = signal('');

  protected readonly unidadesFiltradas = computed(() => {
    const f = this.filtroCursoId();
    const base = this.unidades();
    const filtradas = f ? base.filter((u) => u.curso_id === f) : base;
    return [...filtradas].sort((a,b) => this.cursoTitulo(a.curso_id).localeCompare(this.cursoTitulo(b.curso_id)) || a.numero - b.numero);
  });

  protected readonly form = this.fb.nonNullable.group({
    curso_id: ['', Validators.required],
    numero: [1, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    xp_otorgado: [0, [Validators.required, Validators.min(0)]],
    publicado: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  protected cursoTitulo(id: string): string { return this.cursos().find(c => c.id === id)?.titulo ?? id.slice(0,8) + '…'; }
  protected onFiltroChange(v: string): void { this.filtroCursoId.set(v); }
  protected limpiarFiltro(): void { this.filtroCursoId.set(''); }
  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [u, c] = await Promise.all([this.adminService.listarUnidadesAdmin(), this.adminService.listarTodosLosCursos().catch(() => [] as Curso[])]);
      this.unidades.set(u); this.cursos.set(c);
      if (!this.form.controls.curso_id.value && c.length) this.form.patchValue({ curso_id: c[0].id }, { emitEvent: false });
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las unidades.'); }
    finally { this.cargando.set(false); }
  }

  protected editarUnidad(u: Unidad): void {
    this.editandoId.set(u.id);
    this.form.reset({
      curso_id: u.curso_id,
      numero: Number(u.numero),
      titulo: u.titulo,
      descripcion: u.descripcion ?? '',
      xp_otorgado: Number(u.xp_otorgado ?? 0),
      publicado: !!u.publicado,
    });
    this.setMsg(true, 'Editando unidad. Ajusta los datos y guarda los cambios.');
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.patchValue({ titulo: '', descripcion: '', xp_otorgado: 0, publicado: true });
    this.mensaje.set('');
    this.exito.set(false);
  }

  protected async crear(): Promise<void> {
    if (this.form.invalid) return;
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const v = this.form.getRawValue();
      const id = this.editandoId();

      if (id) {
        const res = await this.adminService.actualizarUnidadAdmin(id, {
          curso_id: v.curso_id,
          numero: Number(v.numero),
          titulo: v.titulo.trim(),
          descripcion: v.descripcion?.trim() || null,
          xp_otorgado: Number(v.xp_otorgado),
          publicado: !!v.publicado,
        });
        this.setMsg(res.ok, res.mensaje);
        if (res.ok) {
          this.editandoId.set(null);
          this.form.patchValue({ titulo: '', descripcion: '', xp_otorgado: 0 });
          await this.cargar();
        }
        return;
      }

      const res = await this.adminService.crearUnidadAdmin({
        curso_id: v.curso_id, numero: Number(v.numero), titulo: v.titulo.trim(), descripcion: v.descripcion?.trim() || null,
        publicado: !!v.publicado, xp_otorgado: Number(v.xp_otorgado),
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) {
        this.form.patchValue({ numero: this.unidades().filter((u) => u.curso_id === v.curso_id).reduce((m,u)=>Math.max(m,u.numero),0)+1, titulo: '', descripcion: '', xp_otorgado: 0 });
        await this.cargar();
      }
    } finally { this.guardando.set(false); }
  }
}
