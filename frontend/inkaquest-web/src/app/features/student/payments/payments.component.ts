// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Curso, Matricula, Pedido, Reembolso, Transaccion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

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
                <table class="table">
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
                </table>
              </div>
            }
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Transacciones</h2>
            @if (transacciones().length === 0) {
              <p class="mt-5 text-sm text-marine-500">No hay transacciones.</p>
            } @else {
              <div class="mt-5 table-wrap">
                <table class="table">
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
                </table>
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
            <strong>Checkout y cobro:</strong> la creación/validación de pedidos, integración con pasarela (Culqi) y activación de matrícula tras pago confirmado se realizan en el backend. Este panel muestra el estado real disponible (matrículas, pedidos, transacciones y reembolsos) y te guía mientras la integración de pago esté pendiente.
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

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly avisoMatricula = signal<string | null>(null);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly transacciones = signal<Transaccion[]>([]);
  protected readonly reembolsos = signal<Reembolso[]>([]);
  protected readonly matriculas = signal<Matricula[]>([]);
  protected readonly cursosMap = signal<Record<string, Curso>>({});

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
      const [pedidos, transacciones, reembolsos, matriculas] = await Promise.all([
        this.paymentService.listarPedidos(user.id),
        this.paymentService.listarTransacciones(user.id),
        this.paymentService.listarReembolsos(user.id),
        this.enrollmentService.listarMisMatriculas(),
      ]);
      this.pedidos.set(pedidos);
      this.transacciones.set(transacciones);
      this.reembolsos.set(reembolsos);
      this.matriculas.set(matriculas);

      const ids = [...new Set(matriculas.map((m) => m.curso_id))];
      const cursos = await Promise.all(ids.map((id) => this.courseService.obtenerPorId(id).catch(() => null)));
      const map: Record<string, Curso> = {};
      cursos.forEach((c) => { if (c) map[c.id] = c; });
      this.cursosMap.set(map);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los pagos.');
    } finally { this.cargando.set(false); }
  }
}
