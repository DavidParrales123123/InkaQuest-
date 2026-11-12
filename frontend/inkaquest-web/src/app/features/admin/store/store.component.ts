import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { TiendaItem } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-store',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Tienda virtual (admin)" descripcion="Catálogo y disponibilidad de artículos. Crea items, edita precios y controla el stock; las compras se procesan por backend con validaciones." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      @if (mensaje()) {
        <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
      }

      <div class="card card-body space-y-4">
        <h2 class="text-lg font-semibold text-marine-800">Agregar artículo a la tienda</h2>
        <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-4" [formGroup]="form" (ngSubmit)="crear()">
          <div><label class="label" for="codigo">Código</label><input id="codigo" class="input font-mono" formControlName="codigo" placeholder="Ej. AVATAR-001" /></div>
          <div><label class="label" for="nombre">Nombre</label><input id="nombre" class="input" formControlName="nombre" placeholder="Ej. Avatar exclusivo" /></div>
          <div class="xl:col-span-2"><label class="label" for="desc">Descripción</label><input id="desc" class="input" formControlName="descripcion" placeholder="Detalle del artículo" /></div>
          <div>
            <label class="label" for="tipo">Tipo</label>
            <select id="tipo" class="select" formControlName="tipo">
              <option value="item">Item</option>
              <option value="cosmetic">Cosmético</option>
              <option value="insignia">Insignia</option>
              <option value="xp">XP</option>
              <option value="moneda">Moneda</option>
              <option value="descuento">Descuento</option>
              <option value="certificado">Certificado</option>
            </select>
          </div>
          <div><label class="label" for="pm">Precio (monedas)</label><input id="pm" class="input" type="number" min="0" formControlName="precio_monedas" /></div>
          <div><label class="label" for="px">Precio (XP)</label><input id="px" class="input" type="number" min="0" formControlName="precio_xp" /></div>
          <div><label class="label" for="stock">Stock (vacío = ilimitado)</label><input id="stock" class="input" type="number" min="0" formControlName="stock" placeholder="Ilimitado" /></div>
          <div><label class="label" for="lim">Límite por usuario</label><input id="lim" class="input" type="number" min="0" formControlName="limite_por_usuario" placeholder="Sin límite" /></div>
          <div class="xl:col-span-2"><label class="label" for="img">Imagen (URL, opcional)</label><input id="img" class="input" formControlName="imagen_url" placeholder="https://…" /></div>
          <label class="inline-flex items-center gap-2 text-sm text-marine-700 self-end"><input type="checkbox" formControlName="activo" /> Artículo activo (visible en tienda)</label>
          <div class="md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-3">
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || guardando()">{{ guardando() ? 'Creando…' : 'Agregar a la tienda' }}</button>
            <p class="text-xs text-marine-500">El precio final y la compra/redención se validan en el backend.</p>
          </div>
        </form>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="items().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Artículo</th><th>Código</th><th>Tipo</th><th>Precio (monedas/XP)</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (i of items(); track i.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ i.nombre }}</td>
                  <td class="font-mono text-xs">{{ i.codigo }}</td>
                  <td>{{ i.tipo }}</td>
                  <td>{{ i.precio_monedas }} / {{ i.precio_xp }}</td>
                  <td>{{ i.stock ?? 'sin límite' }}</td>
                  <td><span class="badge" [class.badge-success]="i.activo" [class.badge-default]="!i.activo">{{ i.activo ? 'Activo' : 'Inactivo' }}</span></td>
                  <td><button class="link text-sm" type="button" (click)="toggleActivo(i)" [disabled]="guardandoId() === i.id">{{ guardandoId() === i.id ? 'Guardando…' : (i.activo ? 'Desactivar' : 'Activar') }}</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class StoreComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly guardandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly items = signal<TiendaItem[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(2)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    tipo: ['item', Validators.required],
    precio_monedas: [0, [Validators.min(0)]],
    precio_xp: [0, [Validators.min(0)]],
    stock: [null as number | null],
    limite_por_usuario: [null as number | null],
    imagen_url: [''],
    activo: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  private setMsg(ok: boolean, msg: string): void { this.exito.set(ok); this.mensaje.set(msg); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.items.set(await this.adminService.listarTiendaItemsAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los artículos.'); }
    finally { this.cargando.set(false); }
  }

  protected async crear(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.guardando.set(true); this.setMsg(false, '');
    try {
      const res = await this.adminService.crearTiendaItemAdmin({
        codigo: v.codigo.trim(),
        nombre: v.nombre.trim(),
        descripcion: v.descripcion?.trim() || null,
        tipo: v.tipo,
        precio_monedas: Number(v.precio_monedas ?? 0),
        precio_xp: Number(v.precio_xp ?? 0),
        imagen_url: v.imagen_url?.trim() || null,
        stock: v.stock === null || (v.stock as unknown as string) === '' ? null : Number(v.stock),
        limite_por_usuario: v.limite_por_usuario === null || (v.limite_por_usuario as unknown as string) === '' ? null : Number(v.limite_por_usuario),
        activo: !!v.activo,
      });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) { this.form.reset({ codigo: '', nombre: '', descripcion: '', tipo: 'item', precio_monedas: 0, precio_xp: 0, stock: null, limite_por_usuario: null, imagen_url: '', activo: true }); await this.cargar(); }
    } finally { this.guardando.set(false); }
  }

  protected async toggleActivo(i: TiendaItem): Promise<void> {
    this.guardandoId.set(i.id);
    try {
      const res = await this.adminService.actualizarTiendaItemAdmin(i.id, { activo: !i.activo });
      this.setMsg(res.ok, res.mensaje);
      if (res.ok) await this.cargar();
    } finally { this.guardandoId.set(null); }
  }
}
