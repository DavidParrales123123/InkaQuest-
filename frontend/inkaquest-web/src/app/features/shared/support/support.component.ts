// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';
import { Ticket } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

/**
 * Centro de soporte del usuario.
 *
 * <p>Permite crear tickets y consultar el historial propio usando
 * {@code SupportService}. Las respuestas internas no se exponen al usuario.</p>
 */
@Component({
  selector: 'app-support',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonComponent,
    DataPanelComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Soporte"
        descripcion="Crea una solicitud de ayuda y consulta el estado de tus tickets."
        [acciones]="true"
      >
        <div acciones>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button>
        </div>
      </app-page-header>

      <div class="card card-body">
        <h2 class="text-lg font-semibold text-marine-800">Nuevo ticket</h2>
        <p class="mt-1 text-sm text-marine-500">Describe tu problema con el mayor detalle posible.</p>
        <form class="mt-4 grid gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="crear()" novalidate>
          <div class="md:col-span-2">
            <label class="label" for="asunto">Asunto</label>
            <input id="asunto" class="input" formControlName="asunto" maxlength="200" />
          </div>
          <div>
            <label class="label" for="categoria">Categoria</label>
            <select id="categoria" class="select" formControlName="categoria">
              <option value="general">General</option>
              <option value="acceso">Acceso y cuenta</option>
              <option value="cursos">Cursos y contenido</option>
              <option value="pagos">Pagos y matrícula</option>
              <option value="tecnico">Problema tecnico</option>
            </select>
          </div>
          <div>
            <label class="label" for="prioridad">Prioridad</label>
            <select id="prioridad" class="select" formControlName="prioridad">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="label" for="descripcion">Descripcion</label>
            <textarea id="descripcion" class="textarea min-h-28" formControlName="descripcion" maxlength="4000"></textarea>
          </div>
          @if (mensajeForm()) {
            <p class="text-sm md:col-span-2" [class.text-success-600]="exitoForm()" [class.text-danger-600]="!exitoForm()">{{ mensajeForm() }}</p>
          }
          <div class="md:col-span-2">
            <app-button tipo="submit" variante="primario" [cargando]="enviando()" [deshabilitado]="form.invalid || enviando()">
              Enviar ticket
            </app-button>
          </div>
        </form>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="tickets().length === 0"
        tituloVacio="No tienes tickets"
        descripcionVacia="Cuando envies una solicitud de soporte, aparecera en este listado con su estado."
        (alReintentar)="cargar()"
      >
        <div contenido class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Asunto</th>
                <th scope="col">Categoria</th>
                <th scope="col">Prioridad</th>
                <th scope="col">Estado</th>
                <th scope="col">Creado</th>
              </tr>
            </thead>
            <tbody>
              @for (t of tickets(); track t.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ t.asunto }}</td>
                  <td>{{ t.categoria }}</td>
                  <td>{{ t.prioridad }}</td>
                  <td><app-status-badge [estado]="t.estado" /></td>
                  <td>{{ t.creado_en | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class SupportComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly support = inject(SupportService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly mensajeForm = signal('');
  protected readonly exitoForm = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    asunto: ['', [Validators.required, Validators.minLength(5)]],
    categoria: ['general', Validators.required],
    prioridad: ['media', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.error.set('Debes iniciar sesión para ver tus tickets.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.tickets.set(await this.support.listarMisTickets());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los tickets.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async crear(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario || this.form.invalid) return;
    this.enviando.set(true);
    this.mensajeForm.set('');
    try {
      const v = this.form.getRawValue();
      const res = await this.support.crearTicket({ asunto: v.asunto, descripcion: v.descripcion, categoria: v.categoria, prioridad: v.prioridad });
      this.mensajeForm.set(res.mensaje);
      this.exitoForm.set(res.ok);
      if (res.ok) {
        this.form.reset({ asunto: '', categoria: 'general', prioridad: 'media', descripcion: '' });
        await this.cargar();
      }
    } catch (e) {
      this.exitoForm.set(false);
      this.mensajeForm.set(e instanceof Error ? e.message : 'No se pudo crear el ticket.');
    } finally {
      this.enviando.set(false);
    }
  }
}
