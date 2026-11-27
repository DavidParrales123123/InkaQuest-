// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { PaymentService, ConfiguracionPago, TarjetaGuardada, PedidoResponse } from '../../../core/services/payment.service';
import { CulqiService } from '../../../core/services/culqi.service';
import { Curso, Matricula, Pedido, Reembolso, Transaccion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface PagoPendiente {
  id: string;
  titulo: string;
  total: number;
  moneda: string;
  pedidoNumero: string | null;
  cursoSlug: string | null;
}

@Component({
  selector: 'app-student-payments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Pagos y matrícula" descripcion="Revisa tus solicitudes de matrícula, pedidos, transacciones y reembolsos." />

      @if (avisoMatricula()) {
        <div class="rounded-button border border-brand-200 bg-brand-50 p-5 text-sm text-marine-700">
          {{ avisoMatricula() }}
        </div>
      }

      @if (configPago(); as cfg) {
        <section class="card card-body space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-marine-800">Completar pago con Culqi 3DS</h2>
            <span class="badge badge-gold">{{ cfg.moneda }}</span>
          </div>

          @if (!cfg.habilitado) {
            <p class="text-sm text-warning-700">Los pagos aún no están configurados en el servidor. Contacta al administrador.</p>
          } @else {
            @if (mensajePago(); as mp) {
              <p class="rounded-lg border p-3 text-sm font-medium"
                [class]="mp.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'"
                role="status">{{ mp.texto }}</p>
            }

            @if (pagables().length === 0) {
              <p class="text-sm text-marine-500">No tienes pagos pendientes. Inscríbete a un curso de pago para verlo aquí.</p>
            } @else {
              <div>
                <label class="label" for="matricula-pago">Pago pendiente</label>
                <select id="matricula-pago" class="select" [value]="matriculaSel()"
                  (change)="matriculaSel.set($any($event.target).value)">
                  @for (p of pagables(); track p.id) {
                    <option [value]="p.id">{{ p.titulo }} — {{ moneda(p.total, p.moneda) }}</option>
                  }
                </select>
              </div>

              @if (tarjetas().length > 0) {
                <div>
                  <h3 class="text-sm font-bold uppercase tracking-wider text-marine-500">Tus tarjetas guardadas</h3>
                  <ul class="mt-2 space-y-2">
                    @for (t of tarjetas(); track t.id) {
                      <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200 p-3">
                        <span class="text-sm text-marine-700">{{ t.marca || 'Tarjeta' }} ···· {{ t.ultimos4 }}
                          @if (t.mesExpiracion && t.anioExpiracion) { <span class="text-xs text-marine-400">({{ t.mesExpiracion }}/{{ t.anioExpiracion }})</span> }
                        </span>
                        <span class="flex gap-2">
                          <button type="button" class="btn btn-primary btn-sm" [disabled]="procesandoPago()" (click)="pagarConTarjetaGuardada(t)">Pagar</button>
                          <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminarTarjeta(t.id)">Eliminar</button>
                        </span>
                      </li>
                    }
                  </ul>
                </div>
              }

              <details class="rounded-xl border border-surface-200 p-3">
                <summary class="cursor-pointer text-sm font-semibold text-marine-700">Pagar con una tarjeta nueva</summary>
                <div class="mt-3">
                  <label class="label" for="email-tarjeta">Correo asociado a la tarjeta</label>
                  <input id="email-tarjeta" class="input" type="email" autocomplete="email" [value]="emailTarjeta()" (input)="emailTarjeta.set($any($event.target).value)" placeholder="tu@correo.com" />
                </div>
                <label class="mt-3 flex items-center gap-2 text-sm text-marine-600">
                  <input type="checkbox" [checked]="guardarParaDespues()" (change)="guardarParaDespues.set($any($event.target).checked)" />
                  Guardar esta tarjeta para futuras compras
                </label>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn btn-primary btn-sm" [disabled]="procesandoPago()" (click)="pagarConNuevaTarjeta()">{{ procesandoPago() ? 'Procesando…' : 'Pagar con 3DS' }}</button>
                  <button type="button" class="btn btn-outline btn-sm" [disabled]="procesandoPago()" (click)="guardarTarjeta()">Solo guardar tarjeta</button>
                </div>
                <p class="mt-2 text-xs text-marine-400">Al pulsar el botón se abre el formulario seguro de Culqi: el número y el CVV se escriben allí, nunca en InkaQuest. Solo recibimos un token; si eliges guardar, se conservan únicamente la marca y los últimos 4 dígitos.</p>
              </details>
            }
          }
        </section>
      }

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="matriculas().length === 0 && pedidos().length === 0 && transacciones().length === 0 && reembolsos().length === 0" tituloVacio="Sin pagos ni matrículas" descripcionVacia="Cuando te inscribas en un curso o realices pagos, la información aparecerá aquí." (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Matrículas y solicitudes</h2>
            @if (matriculas().length === 0) {
              <p class="mt-5 text-sm text-marine-500">No tienes matrículas registradas.</p>
            } @else {
              <div class="mt-5 space-y-3">
                @for (m of matriculas(); track m.id) {
                  <article class="rounded-xl border border-surface-200 p-5">
                    <div class="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p class="font-semibold text-marine-900">{{ cursoDe(m.curso_id)?.titulo || 'Curso' }}</p>
                        <p class="mt-1 text-sm text-marine-600">Estado: <app-status-badge [estado]="m.estado" /></p>
                        <p class="mt-1 text-xs text-marine-500">Registrada: {{ m.creado_en | date: 'medium' }}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium text-marine-800">{{ moneda(cursoDe(m.curso_id)?.precio ?? m.precio_pagado, cursoDe(m.curso_id)?.moneda || m.moneda) }}</p>
                        @if (m.estado === 'activa' || m.estado === 'completada') {
                          <a [routerLink]="['/estudiante/aula', m.curso_id]" class="btn btn-primary btn-sm mt-2">Ir al aula</a>
                        } @else if (m.estado === 'pendiente_pago') {
                          <span class="badge badge-warning mt-2">Pago pendiente</span>
                        }
                      </div>
                    </div>
                    @if (m.estado === 'pendiente_pago') {
                      <div class="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-3 text-sm text-marine-700">
                        Tu solicitud está registrada. La creación del pedido, el pago (Culqi) y la activación automática de la matrícula tras confirmación se gestionan desde el backend. Cuando esa integración esté disponible, podrás completar el pago desde aquí.
                        <div class="mt-2 flex flex-wrap gap-2">
                          <a [routerLink]="['/cursos', cursoDe(m.curso_id)?.slug || m.curso_id]" class="btn btn-outline btn-sm">Ver curso</a>
                          <a routerLink="/estudiante/cursos" class="btn btn-ghost btn-sm">Mis cursos</a>
                        </div>
                      </div>
                    }
                  </article>
                }
              </div>
            }
          </div>
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Pedidos</h2>
            @if (pedidos().length === 0) {
              <p class="mt-5 text-sm text-marine-500">No tienes pedidos registrados.</p>
            } @else {
              <div class="mt-5 table-wrap">
                <div class="overflow-x-auto"><table class="table">
                  <thead><tr><th>Número</th><th>Estado</th><th>Total</th><th>Fecha</th></tr></thead>
                  <tbody>
                    @for (p of pedidos(); track p.id) {
                      <tr>
                        <td class="font-medium">{{ p.numero }}</td>
                        <td><app-status-badge [estado]="p.estado" /></td>
                        <td>{{ moneda(p.total, p.moneda) }}</td>
                        <td>{{ p.creado_en | date: 'medium' }}</td>
                      </tr>
                    }
                  </tbody>
                </table></div>
              </div>
            }
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Transacciones</h2>
            @if (transacciones().length === 0) {
              <p class="mt-5 text-sm text-marine-500">No hay transacciones.</p>
            } @else {
              <div class="mt-5 table-wrap">
                <div class="overflow-x-auto"><table class="table">
                  <thead><tr><th>Referencia</th><th>Estado</th><th>Monto</th><th>Fecha</th></tr></thead>
                  <tbody>
                    @for (t of transacciones(); track t.id) {
                      <tr>
                        <td>{{ t.referencia || t.codigo_autorizacion || t.id.slice(0, 8) }}</td>
                        <td><app-status-badge [estado]="t.estado" /></td>
                        <td>{{ moneda(t.monto, t.moneda) }}</td>
                        <td>{{ t.creado_en | date: 'medium' }}</td>
                      </tr>
                    }
                  </tbody>
                </table></div>
              </div>
            }
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Reembolsos</h2>
            @if (reembolsos().length === 0) {
              <p class="mt-5 text-sm text-marine-500">No hay reembolsos registrados.</p>
            } @else {
              <ul class="mt-5 space-y-2 text-sm">
                @for (r of reembolsos(); track r.id) {
                  <li class="flex items-center justify-between rounded-button border border-surface-200 p-3">
                    <span>{{ moneda(r.monto, 'PEN') }}</span>
                    <app-status-badge [estado]="r.estado" />
                  </li>
                }
              </ul>
            }
          </div>

          <div class="rounded-button border border-gold-200 bg-gold-50 p-5 text-sm text-marine-700">
            <strong>Checkout y cobro:</strong> el pago se procesa con Culqi 3DS desde el panel superior. La creación del pedido, la verificación del cargo y la activación de la matrícula las realiza el backend cuando Culqi confirma la operación. Aquí puedes consultar el historial real de matrículas, pedidos, transacciones y reembolsos.
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class PaymentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly courseService = inject(CourseService);
  private readonly culqi = inject(CulqiService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly avisoMatricula = signal<string | null>(null);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly transacciones = signal<Transaccion[]>([]);
  protected readonly reembolsos = signal<Reembolso[]>([]);
  protected readonly matriculas = signal<Matricula[]>([]);
  protected readonly cursosMap = signal<Record<string, Curso>>({});

  // === CHECKOUT CULQI 3DS ===
  protected readonly configPago = signal<ConfiguracionPago | null>(null);
  protected readonly tarjetas = signal<TarjetaGuardada[]>([]);
  protected readonly pedidosApi = signal<PedidoResponse[]>([]);

  /** Pedidos pendientes (lo que crea la inscripción) y matrículas sin pedido. */
  protected readonly pagables = computed<PagoPendiente[]>(() => {
    const pedidos = this.pedidosApi().filter((p) => ['pendiente', 'iniciado'].includes(p.estado));
    const out: PagoPendiente[] = pedidos.map((p) => ({
      id: p.numero,
      titulo: p.items?.[0]?.cursoTitulo || `Pedido ${p.numero}`,
      total: Number(p.total ?? 0),
      moneda: p.moneda || 'PEN',
      pedidoNumero: p.numero,
      cursoSlug: null,
    }));
    const cursosConPedido = new Set(
      pedidos.flatMap((p) => (p.items ?? []).map((i) => i.cursoId)),
    );
    for (const m of this.matriculas().filter((x) => x.estado === 'pendiente_pago')) {
      const curso = this.cursosMap()[m.curso_id];
      if (curso && cursosConPedido.has(curso.id)) continue;
      out.push({
        id: m.id,
        titulo: curso?.titulo || 'Curso',
        total: Number(curso?.precio ?? m.precio_pagado ?? 0),
        moneda: curso?.moneda || m.moneda || 'PEN',
        pedidoNumero: null,
        cursoSlug: curso?.slug ?? null,
      });
    }
    return out;
  });

  protected readonly matriculaSel = signal('');
  protected readonly procesandoPago = signal(false);
  protected readonly mensajePago = signal<{ ok: boolean; texto: string } | null>(null);

  protected readonly emailTarjeta = signal('');
  protected readonly guardarParaDespues = signal(false);

  ngOnInit(): void {
    const pendiente = this.route.snapshot.queryParamMap.get('matricula');
    if (pendiente === 'pendiente') {
      this.avisoMatricula.set('Solicitud de matrícula registrada. Revisa abajo el estado de tu inscripción y los pasos de pago.');
    }
    void this.cargar();
  }

  protected cursoDe(cursoId: string): Curso | undefined {
    return this.cursosMap()[cursoId];
  }

  protected moneda(valor: number | string, moneda: string): string {
    const n = typeof valor === 'string' ? Number(valor) : valor;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda || 'PEN' }).format(Number.isFinite(n) ? n : 0);
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [pedidos, transacciones, reembolsos, matriculas, configuracion, tarjetas, pedidosApi] = await Promise.all([
        this.paymentService.listarPedidos(user.id),
        this.paymentService.listarTransacciones(user.id),
        this.paymentService.listarReembolsos(user.id),
        this.enrollmentService.listarMisMatriculas(),
        this.paymentService.configuracionPago().catch(() => null),
        this.paymentService.listarTarjetas().catch(() => [] as TarjetaGuardada[]),
        this.paymentService.misPedidos().catch(() => [] as PedidoResponse[]),
      ]);
      this.pedidos.set(pedidos);
      this.transacciones.set(transacciones);
      this.reembolsos.set(reembolsos);
      this.matriculas.set(matriculas);
      this.configPago.set(configuracion);
      this.tarjetas.set(tarjetas);
      this.pedidosApi.set(pedidosApi);
      if (configuracion?.publicKey) this.culqi.configurar(configuracion.publicKey);
      const primera = pedidosApi.find((p) => ['pendiente', 'iniciado'].includes(p.estado));
      if (primera && !this.matriculaSel()) this.matriculaSel.set(primera.numero);

      const ids = [...new Set(matriculas.map((m) => m.curso_id))];
      const cursos = await Promise.all(ids.map((id) => this.courseService.obtenerPorId(id).catch(() => null)));
      const map: Record<string, Curso> = {};
      cursos.forEach((c) => { if (c) map[c.id] = c; });
      this.cursosMap.set(map);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los pagos.');
    } finally { this.cargando.set(false); }
  }

  private emailPago(): string {
    return this.emailTarjeta().trim() || this.auth.usuario()?.email || '';
  }

  private validarEmail(): string | null {
    return this.emailPago().includes('@') ? null : 'Ingresa el correo asociado a la tarjeta.';
  }

  protected async guardarTarjeta(): Promise<void> {
    const error = this.validarEmail();
    if (error) { this.mensajePago.set({ ok: false, texto: error }); return; }
    this.procesandoPago.set(true);
    this.mensajePago.set(null);
    try {
      const token = await this.culqi.tokenizarConModal({
        montoCentavos: 100,
        titulo: 'Guardar tarjeta · InkaQuest',
        moneda: this.configPago()?.moneda || 'PEN',
        email: this.emailPago(),
        ocultarMonto: true,
      });
      await this.paymentService.guardarTarjeta(token);
      this.tarjetas.set(await this.paymentService.listarTarjetas());
      this.mensajePago.set({ ok: true, texto: 'Tarjeta guardada de forma segura en Culqi. Solo se conservan la marca y los últimos 4 dígitos.' });
    } catch (e) {
      this.mensajePago.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo guardar la tarjeta.' });
    } finally {
      this.procesandoPago.set(false);
    }
  }

  private pagoSeleccionado(): PagoPendiente | null {
    return this.pagables().find((p) => p.id === this.matriculaSel()) ?? this.pagables()[0] ?? null;
  }

  private async completarPago(source: { culqiToken?: string; metodoPagoId?: string }): Promise<void> {
    const pago = this.pagoSeleccionado();
    if (!pago) { throw new Error('Selecciona un pago pendiente.'); }
    if (pago.pedidoNumero) {
      await this.paymentService.pagarPedido(pago.pedidoNumero, source);
      return;
    }
    if (pago.cursoSlug) {
      await this.paymentService.iniciarCompra({ cursoSlug: pago.cursoSlug, ...source });
      return;
    }
    throw new Error('No se pudo identificar el pago pendiente.');
  }

  protected async pagarConTarjetaGuardada(t: TarjetaGuardada): Promise<void> {
    this.procesandoPago.set(true);
    this.mensajePago.set(null);
    try {
      await this.completarPago({ metodoPagoId: t.id });
      this.mensajePago.set({ ok: true, texto: 'Pago enviado. La matrícula se activará automáticamente cuando Culqi confirme la operación.' });
      await this.cargar();
    } catch (e) {
      this.mensajePago.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo procesar el pago.' });
    } finally {
      this.procesandoPago.set(false);
    }
  }

  protected async pagarConNuevaTarjeta(): Promise<void> {
    const error = this.validarEmail();
    if (error) { this.mensajePago.set({ ok: false, texto: error }); return; }
    const pago = this.pagoSeleccionado();
    if (!pago) { this.mensajePago.set({ ok: false, texto: 'Selecciona un pago pendiente.' }); return; }
    this.procesandoPago.set(true);
    this.mensajePago.set(null);
    try {
      const token = await this.culqi.tokenizarConModal({
        montoCentavos: Math.round(Number(pago.total) * 100),
        titulo: pago.titulo,
        moneda: pago.moneda,
        email: this.emailPago(),
      });
      await this.culqi.confirmar3DS(token, this.emailPago());
      await this.completarPago({ culqiToken: token });
      if (this.guardarParaDespues()) {
        await this.paymentService.guardarTarjeta(token);
        this.tarjetas.set(await this.paymentService.listarTarjetas());
      }
      this.mensajePago.set({ ok: true, texto: 'Pago enviado con autenticación 3DS. La matrícula se activará cuando Culqi confirme.' });
      this.guardarParaDespues.set(false);
      await this.cargar();
    } catch (e) {
      this.mensajePago.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo procesar el pago.' });
    } finally {
      this.procesandoPago.set(false);
    }
  }

  protected async eliminarTarjeta(t: TarjetaGuardada): Promise<void> {
    try {
      await this.paymentService.eliminarTarjeta(t.id);
      this.tarjetas.set(await this.paymentService.listarTarjetas());
      this.mensajePago.set({ ok: true, texto: 'Tarjeta eliminada de Culqi.' });
    } catch (e) {
      this.mensajePago.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar la tarjeta.' });
    }
  }

}
