// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService, InsigniaCatalogoResponse } from '../../../core/services/gamification.service';
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
        <app-stat-card etiqueta="Obtenidas" [valor]="obtenidas().length" tono="gold" />
        <app-stat-card etiqueta="Disponibles" [valor]="catalogo().length" tono="brand" />
        <app-stat-card etiqueta="Pendientes" [valor]="pendientes()" tono="surface" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="catalogo().length === 0" tituloVacio="Aún no hay insignias en el catálogo" descripcionVacia="Cuando se publiquen insignias de la plataforma aparecerán aquí." (alReintentar)="cargar()">
        <div contenido class="space-y-8">
          <div>
            <h2 class="text-lg font-semibold text-marine-800">Mis insignias</h2>
            @if (obtenidas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">Todavía no has obtenido insignias. Completa cursos y retos para desbloquearlas.</p>
            } @else {
              <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (i of obtenidas(); track i.id) {
                  <article class="card card-body border-l-4 border-l-gold-500">
                    <h3 class="font-semibold text-marine-800">{{ i.nombre }}</h3>
                    <p class="mt-1 text-sm text-marine-500">{{ i.descripcion || 'Sin descripción.' }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span class="badge badge-gold">{{ i.rareza }}</span>
                      <span class="badge badge-neutral">+{{ i.xpRequerido }} XP</span>
                    </div>
                    <p class="mt-2 text-xs text-marine-400">Obtenida: {{ i.obteidaEn | date: 'mediumDate' }}</p>
                  </article>
                }
              </div>
            }
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Catálogo completo</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (b of catalogo(); track b.id) {
                <article class="card card-body" [class.opacity-60]="!b.obtenida">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="font-semibold text-marine-800">{{ b.nombre }}</h3>
                    <span class="badge" [class.badge-success]="b.obtenida" [class.badge-neutral]="!b.obtenida">{{ b.obtenida ? 'Obtenida' : 'Pendiente' }}</span>
                  </div>
                  <p class="mt-1 text-sm text-marine-500">{{ b.descripcion || 'Sin descripción.' }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span class="badge badge-gold">{{ b.rareza }}</span>
                    <span class="badge badge-neutral">+{{ b.xpRequerido }} XP</span>
                  </div>
                </article>
              }
            </div>
          </div>
          <p class="text-xs text-marine-400">Las insignias se otorgan automáticamente por el sistema según las reglas definidas.</p>
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
  protected readonly catalogo = signal<InsigniaCatalogoResponse[]>([]);

  protected readonly obtenidas = computed(() => this.catalogo().filter((i) => i.obtenida));
  protected readonly pendientes = computed(() => Math.max(0, this.catalogo().length - this.obtenidas().length));

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [catalogo] = await Promise.all([this.gamification.listarInsignias()]);
      this.catalogo.set(catalogo);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las insignias.');
    } finally { this.cargando.set(false); }
  }
}
