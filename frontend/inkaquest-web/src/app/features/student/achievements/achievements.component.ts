// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Insignia, InsigniaUsuario } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Insignias y logros" descripcion="Insignias obtenidas y catálogo disponible en la plataforma." />
      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card etiqueta="Obtenidas" [valor]="obtenidas().length" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.21 13 5 22l7-3.5L19 22l-3.21-9"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Disponibles" [valor]="catalogo().length" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Pendientes" [valor]="pendientes()" [icono]="true" tono="surface"><span icono>…</span></app-stat-card>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="obtenidas().length === 0 && catalogo().length === 0" (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Mis insignias</h2>
            @if (obtenidas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">Todavía no has obtenido insignias. Completa cursos y retos para desbloquearlas.</p>
            } @else {
              <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (i of obtenidas(); track i.id) {
                  <article class="card card-body">
                    <h3 class="font-semibold text-marine-800">{{ i.insignia.nombre }}</h3>
                    <p class="mt-1 text-sm text-marine-500">{{ i.insignia.descripcion || 'Sin descripción.' }}</p>
                    <p class="mt-2 text-xs text-marine-400">Obtenida: {{ i.obtenida_en | date: 'mediumDate' }}</p>
                  </article>
                }
              </div>
            }
          </div>
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Catálogo</h2>
            @if (catalogo().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay insignias activas en el catálogo.</p>
            } @else {
              <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (b of catalogo(); track b.id) {
                  <article class="card card-body" [class.opacity-60]="!tengo(b.id)">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="font-semibold text-marine-800">{{ b.nombre }}</h3>
                      <span class="badge" [class.badge-success]="tengo(b.id)" [class.badge-neutral]="!tengo(b.id)">{{ tengo(b.id) ? 'Obtenida' : 'Pendiente' }}</span>
                    </div>
                    <p class="mt-1 text-sm text-marine-500">{{ b.descripcion || 'Sin descripción.' }}</p>
                  </article>
                }
              </div>
            }
          </div>
          <p class="text-xs text-marine-400">Las insignias se otorgan automáticamente por el sistema según las reglas definidas; no pueden reclamarse manualmente desde el cliente.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class AchievementsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly gamification = inject(GamificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly obtenidas = signal<(InsigniaUsuario & { insignia: Insignia })[]>([]);
  protected readonly catalogo = signal<Insignia[]>([]);
  private readonly idsObtenidas = computed(() => new Set(this.obtenidas().map((i) => i.insignia_id)));
  protected readonly pendientes = computed(() => Math.max(0, this.catalogo().length - this.obtenidas().length));

  ngOnInit(): void { void this.cargar(); }
  protected tengo(id: string): boolean { return this.idsObtenidas().has(id); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [obtenidas, catalogo] = await Promise.all([
        this.gamification.listarInsignias(user.id),
        this.gamification.listarCatalogoInsignias(),
      ]);
      this.obtenidas.set(obtenidas); this.catalogo.set(catalogo);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las insignias.');
    } finally { this.cargando.set(false); }
  }
}
