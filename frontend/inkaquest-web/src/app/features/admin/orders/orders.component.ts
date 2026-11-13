// @ts-nocheck
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DetallePedido, Pedido, Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

/**
 * Pedidos de la plataforma (panel del administrador).
 *
 * <p><b>Nota de seguridad:</b> {@code AdminService} no expone los pedidos y
 * {@code PaymentService.listarPedidos} solo devuelve los del usuario
 * autenticado. Por eso el panel lee la tabla {@code pedido} directamente:
 * la politica RLS {@code pol_pedido_select} permite leerla al
 * administrador.</p>
 *
 * <p>Las lineas de cada pedido se cargan bajo demanda en
 * {@code detalle_pedido} para no traer el detalle de todos los pedidos.</p>
 */
@Component({
  selector: 'app-admin-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    DataPanelComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="Comercial"
        titulo="Pedidos"
        descripcion="Historial completo de pedidos, sus importes y las líneas de cada compra."
      />

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card
          etiqueta="Pedidos"
          [valor]="pedidos().length"
          [detalle]="detalleFiltro()"
          [icono]="true"
          tono="brand"
        >
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke-linejoin="round" />
              <path d="M14 3v5h5" stroke-linejoin="round" />
            </svg>
          </span>
        </app-stat-card>

        <app-stat-card
          etiqueta="Ingresos cobrados"
          [valor]="ingresosCobrados()"
          [detalle]="'Pedidos en estado pagado'"
          [icono]="true"
          tono="gold"
        >
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round" />
              <path d="M16 12h3" stroke-linecap="round" />
            </svg>
          </span>
        </app-stat-card>

        <app-stat-card
          etiqueta="Pendientes"
          [valor]="pedidosPendientes()"
          detalle="Aún sin confirmar el pago"
          [icono]="true"
          tono="info"
        >
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </app-stat-card>

        <app-stat-card
          etiqueta="Descuentos aplicados"
          [valor]="descuentosTotales()"
          detalle="Suma de los descuentos de los pedidos"
          [icono]="true"
          tono="surface"
        >
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="15" r="5" />
              <path d="m8.5 10.5-3-7h5l1.5 4 1.5-4h5l-3 7" stroke-linejoin="round" />
            </svg>
          </span>
        </app-stat-card>
      </div>

      <div class="card card-body">
        <form class="grid gap-4 md:grid-cols-3" [formGroup]="filtros" novalidate>
          <div>
            <label class="label" for="busqueda">Buscar por número</label>
            <input
              id="busqueda"
              type="search"
              class="input"
              formControlName="busqueda"
              placeholder="ORD-2026-0001"
            />
          </div>
          <div>
            <label class="label" for="estado">Estado</label>
            <select id="estado" class="select" formControlName="estado">
              <option value="">Todos los estados</option>
              @for (estado of estadosDisponibles; track estado) {
                <option [value]="estado">{{ etiquetaEstado(estado) }}</option>
              }
            </select>
          </div>
          <div class="flex items-end">
            <app-button variante="contorno" tamano="md" (alPulsar)="recargar()">
              Actualizar
            </app-button>
          </div>
        </form>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="pedidosFiltrados().length === 0"
        tituloVacio="Todavía no hay pedidos"
        descripcionVacia="Los pedidos aparecerán aquí en cuanto un estudiante complete una compra."
        (alReintentar)="cargar()"
      >
        <div contenido class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Número</th>
                <th scope="col">Usuario</th>
                <th scope="col">Estado</th>
                <th scope="col">Subtotal</th>
                <th scope="col">Descuento</th>
                <th scope="col">Total</th>
                <th scope="col">Moneda</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              @for (pedido of pedidosFiltrados(); track pedido.id) {
                <tr>
                  <td>
                    <button
                      type="button"
                      class="link font-semibold"
                      [attr.aria-expanded]="expandido() === pedido.id"
                      (click)="alternarDetalle(pedido.id)"
                    >
                      {{ pedido.numero }}
                    </button>
                  </td>
                  <td>{{ nombreUsuario(pedido.usuario_id) }}</td>
                  <td>
                    <app-status-badge [estado]="pedido.estado" />
                  </td>
                  <td>{{ formatearMoneda(pedido.subtotal, pedido.moneda) }}</td>
                  <td>{{ formatearMoneda(pedido.descuento, pedido.moneda) }}</td>
                  <td class="font-semibold">{{ formatearMoneda(pedido.total, pedido.moneda) }}</td>
                  <td>{{ pedido.moneda }}</td>
                  <td>{{ formatearFecha(pedido.creado_en) }}</td>
                </tr>
                @if (expandido() === pedido.id) {
                  <tr>
                    <td colspan="8" class="bg-surface-50/60">
                      <h3 class="text-sm font-semibold text-marine-700">
                        Líneas del pedido {{ pedido.numero }}
                      </h3>
                      @if (cargandoDetalle() === pedido.id) {
                        <p class="mt-2 text-sm text-marine-500">Cargando líneas…</p>
                      } @else if (lineasDe(pedido.id).length === 0) {
                        <p class="mt-2 text-sm text-marine-500">
                          Este pedido no tiene líneas registradas.
                        </p>
                      } @else {
                        <ul class="mt-2 space-y-1.5 text-sm">
                          @for (linea of lineasDe(pedido.id); track linea.id) {
                            <li class="flex flex-wrap items-center justify-between gap-2">
                              <span class="text-marine-700">{{ linea.titulo_snapshot }}</span>
                              <span class="text-marine-500">
                                {{ linea.cantidad }} x
                                {{ formatearMoneda(linea.precio_unitario, pedido.moneda) }} =
                                {{ formatearMoneda(linea.subtotal, pedido.moneda) }}
                              </span>
                            </li>
                          }
                        </ul>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  /** Pedidos leidos de la base de datos. */
  protected readonly pedidos = signal<Pedido[]>([]);
  /** Perfiles de los usuarios, para resolver nombres. */
  protected readonly usuarios = signal<Perfil[]>([]);
  /** Lineas cargadas bajo demanda, indexadas por pedido. */
  protected readonly lineas = signal<Record<string, DetallePedido[]>>({});
  /** Pedido cuyo detalle esta desplegado. */
  protected readonly expandido = signal<string | null>(null);
  /** Pedido cuyas lineas se estan cargando. */
  protected readonly cargandoDetalle = signal<string | null>(null);
  /** Estado de carga de la tabla. */
  protected readonly cargando = signal(true);
  /** Mensaje de error. */
  protected readonly error = signal<string | null>(null);

  /** Filtros del listado. */
  protected readonly filtros = this.fb.nonNullable.group({
    busqueda: [''],
    estado: [''],
  });

  /** Valores actuales de los filtros (reactivo). */
  private readonly valoresFiltro = toSignal(this.filtros.valueChanges, {
    initialValue: this.filtros.getRawValue(),
  });

  /** Estados posibles de un pedido segun el enum de la base de datos. */
  protected readonly estadosDisponibles: readonly string[] = [
    'pendiente',
    'pagado',
    'procesando',
    'cancelado',
    'reembolsado',
    'fallido',
  ];

  /** Pedidos filtrados por numero y estado. */
  protected readonly pedidosFiltrados = computed(() => {
    const { busqueda, estado } = this.valoresFiltro();
    const termino = (busqueda ?? '').trim().toLowerCase();
    return this.pedidos().filter((pedido) => {
      const coincideNumero = !termino || pedido.numero.toLowerCase().includes(termino);
      const coincideEstado = !estado || pedido.estado === estado;
      return coincideNumero && coincideEstado;
    });
  });

  /** Suma de los totales de los pedidos pagados. */
  protected readonly ingresosCobrados = computed(() => {
    const pedidos = this.pedidos().filter((pedido) => pedido.estado === 'pagado');
    if (pedidos.length === 0) {
      return 'S/ 0.00';
    }
    return this.formatearMoneda(
      pedidos.reduce((suma, pedido) => suma + this.aNumero(pedido.total), 0),
      pedidos[0].moneda,
    );
  });

  /** Cantidad de pedidos que aun no estan pagados. */
  protected readonly pedidosPendientes = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'pendiente').length,
  );

  /** Suma de los descuentos aplicados. */
  protected readonly descuentosTotales = computed(() => {
    const pedidos = this.pedidos();
    if (pedidos.length === 0) {
      return 'S/ 0.00';
    }
    return this.formatearMoneda(
      pedidos.reduce((suma, pedido) => suma + this.aNumero(pedido.descuento), 0),
      pedidos[0].moneda,
    );
  });

  /** Texto que indica si hay un filtro activo. */
  protected readonly detalleFiltro = computed(() => {
    const { busqueda, estado } = this.valoresFiltro();
    const termino = (busqueda ?? '').trim();
    const partes: string[] = [];
    if (termino) {
      partes.push(`busqueda "${termino}"`);
    }
    if (estado) {
      partes.push(`estado ${this.etiquetaEstado(estado).toLowerCase()}`);
    }
    return partes.length > 0 ? partes.join(' · ') : 'Sin filtros aplicados';
  });

  ngOnInit(): void {
    void this.cargar();
  }

  /** Recarga los pedidos y los perfiles de los usuarios. */
  protected recargar(): void {
    void this.cargar();
  }

  /** Carga los pedidos de la plataforma y los nombres de los usuarios. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.pedido)
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      this.pedidos.set((data ?? []) as Pedido[]);
      this.usuarios.set(await this.cargarUsuarios());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los pedidos.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Carga los perfiles visibles para el administrador. */
  private async cargarUsuarios(): Promise<Perfil[]> {
    try {
      return await this.adminService.listarUsuarios({ limite: 500 });
    } catch {
      return [];
    }
  }

  /** Despliega o contrae las lineas del pedido indicado. */
  protected async alternarDetalle(pedidoId: string): Promise<void> {
    if (this.expandido() === pedidoId) {
      this.expandido.set(null);
      return;
    }

    this.expandido.set(pedidoId);

    if (this.lineas()[pedidoId]) {
      return;
    }

    this.cargandoDetalle.set(pedidoId);
    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.detallePedido)
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('titulo_snapshot');

      if (error) {
        throw new Error(error.message);
      }

      this.lineas.update((actual) => ({
        ...actual,
        [pedidoId]: (data ?? []) as DetallePedido[],
      }));
    } catch {
      this.lineas.update((actual) => ({ ...actual, [pedidoId]: [] }));
    } finally {
      this.cargandoDetalle.set(null);
    }
  }

  /** Lineas cargadas de un pedido. */
  protected lineasDe(pedidoId: string): DetallePedido[] {
    return this.lineas()[pedidoId] ?? [];
  }

  /** Nombre legible del usuario que realizo el pedido. */
  protected nombreUsuario(usuarioId: string): string {
    const perfil = this.usuarios().find((p) => p.id === usuarioId);
    if (!perfil) {
      return 'Usuario';
    }
    return [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || perfil.email;
  }

  /** Etiqueta legible de un estado de pedido. */
  protected etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      procesando: 'Procesando',
      cancelado: 'Cancelado',
      reembolsado: 'Reembolsado',
      fallido: 'Fallido',
    };
    return etiquetas[estado] ?? estado;
  }

  /** Formatea un importe con la moneda del pedido. */
  protected formatearMoneda(valor: number, moneda: string): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda || 'PEN',
    }).format(this.aNumero(valor));
  }

  /** Formatea una fecha ISO en formato local legible. */
  protected formatearFecha(fecha: string): string {
    const fechaValida = new Date(fecha);
    if (Number.isNaN(fechaValida.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(fechaValida);
  }

  /** Convierte un valor numerico de la base de datos (numeric) en numero. */
  private aNumero(valor: number | string | null | undefined): number {
    const numero = typeof valor === 'string' ? Number(valor) : (valor ?? 0);
    return Number.isFinite(numero) ? numero : 0;
  }
}
