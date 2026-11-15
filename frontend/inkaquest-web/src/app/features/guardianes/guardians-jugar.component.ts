// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Phaser from 'phaser';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CombateScene } from './combate-scene';

/** Guardia/guardián de partida — motor Phaser 3 top-down. */
@Component({
  selector: 'app-guardians-jugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-4">
      <app-page-header [titulo]="'Nivel ' + numero() + ' — Guardianes del Conocimiento'" descripcion="Sobrevive a las hordas del curso. Derrota enemigos y acumula XP." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          @if (enPausa()) {
            <button type="button" class="btn btn-primary btn-sm" (click)="reanudar()">Reanudar</button>
          } @else if (fase() === 'jugando') {
            <button type="button" class="btn btn-outline btn-sm" (click)="pausar()">Pausa</button>
          }
          <a routerLink="/estudiante/guardianes" class="btn btn-outline btn-sm">Abandonar nivel</a>
        </div>
      </app-page-header>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="card card-body lg:col-span-4 order-2 lg:order-1 space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-marine-500">Estado del combate</h2>
          <div>
            <div class="flex items-center justify-between text-xs text-marine-600"><span>Vida</span><span>{{ salud() }} / 100</span></div>
            <div class="mt-1 h-2 w-full rounded-full bg-surface-200"><div class="h-2 rounded-full bg-brand-500 transition-all duration-200" [style.width.%]="saludPct()"></div></div>
          </div>
          <div>
            <div class="flex items-center justify-between text-xs text-marine-600"><span>XP acumulada</span><span>{{ xp() }} XP</span></div>
            <div class="mt-1 h-2 w-full rounded-full bg-surface-200"><div class="h-2 rounded-full bg-gold-500" [style.width.%]="xpPct()"></div></div>
          </div>
          <div class="text-xs text-marine-500">
            <p>Enemigos activos: <strong>{{ enemigosVivos() }}</strong></p>
            <p>Tiempo: <strong>{{ tiempoFormateado() }}</strong></p>
          </div>
          <div class="rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-xs text-marine-700">
            <p class="font-bold text-marine-800">Controles</p>
            <p class="mt-1">
              <strong>WASD / ← → ↑ ↓</strong> para moverte<br/>
              Disparo automático a la dirección del enemigo más cercano<br/>
              Esc no hace nada — usa Pausa arriba
            </p>
          </div>
        </div>

        <div class="lg:col-span-8 order-1 lg:order-2 space-y-4">
          <div #juegoRoot class="h-[60vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-gold-500/30 bg-marine-900" aria-label="Área de juego. Combate top-down."></div>
          @if (fase() === 'victoria' || fase() === 'derrota') {
            <div class="rounded-2xl border border-gold-500/40 bg-marine-900 p-6 text-center">
              <p class="text-2xl font-extrabold text-gold-400">{{ fase() === 'victoria' ? '¡Nivel superado!' : 'Nivel perdido' }}</p>
              <p class="mt-2 text-sm text-marine-100">{{ fase() === 'victoria' ? 'Tu aula registra la victoria. Tu progreso se guarda automáticamente.' : 'Derrota más enemigos y sobrevive el tiempo suficiente.' }}</p>
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                <a routerLink="/estudiante/guardianes" class="btn btn-outline-light">Volver a la campaña</a>
                <button type="button" class="btn btn-gold" (click)="reiniciar()">Reintentar</button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class GuardiansJugarComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  protected readonly numero = signal(1);
  protected readonly fase = signal<'intro' | 'jugando' | 'victoria' | 'derrota'>('intro');
  protected readonly salud = signal(100);
  protected readonly xp = signal(0);
  protected readonly enemigosVivos = signal(0);
  protected readonly tiempo = signal(0);
  protected readonly enPausa = signal(false);

  protected readonly saludPct = computed(() => Math.max(0, Math.min(100, (this.salud() / 100) * 100)));
  protected readonly xpPct = computed(() => Math.min(100, (this.xp() % 200) / 2));
  protected readonly tiempoFormateado = computed(() => {
    const s = this.tiempo();
    const m = Math.floor(s / 60);
    const r = Math.max(0, Math.trunc(s % 60));
    return `${m}:${r.toString().padStart(2, '0')}`;
  });

  private game: Phaser.Game | null = null;
  private startMs = 0;
  private arrancarseMs = performance.now();
  private hudTimer: any;

  ngOnInit(): void {
    const n = Number(this.route.snapshot.paramMap.get('numero')) || 1;
    this.numero.set(n);
    queueMicrotask(() => this.arrancar());
  }

  ngOnDestroy(): void {
    if (this.hudTimer) clearInterval(this.hudTimer);
    if (this.game) { this.game.destroy(true); this.game = null; }
  }

  protected pausar(): void {
    this.enPausa.set(true);
    this.game?.pause();
  }

  protected reanudar(): void {
    this.enPausa.set(false);
    this.game?.resume();
  }

  protected reiniciar(): void {
    this.salud.set(100);
    this.xp.set(0);
    this.enemigosVivos.set(0);
    this.tiempo.set(0);
    this.fase.set('intro');
    if (this.game) { this.game.destroy(true); this.game = null; }
    queueMicrotask(() => this.arrancar());
  }

  private arrancar(): void {
    const root = this.route.snapshot.paramMap;
    // Cannot read #juegoRoot before DOM; rendered in @if false — but we set it in template
    // So we obtain element via DOM after route ; As fallback: use setTimeout after view init
    setTimeout(() => {
      const el = typeof document !== 'undefined' ? document.querySelector('app-guardians-jugar #juegoRoot, #juegoRoot') as unknown as HTMLElement : null;
      const host = el || (typeof document !== 'undefined' ? document.getElementById('juegoRoot') : null) || document.querySelector('.h-[60vh]');
      if (!host) return;

      const self = this;
      const onUpdate = () => self.crearTickHud();
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: host.clientWidth || 880,
        height: host.clientHeight || 520,
        backgroundColor: '#0f1a33',
        physics: { default: 'arcade', arcade: { gravity: { y: 0, x: 0 }, debug: false } },
        scene: [CombateScene],
      });

      // Populate the scene when ready
      this.game.events.once('ready', () => {
        const scene = this.game?.scene?.getScene('Combate') as any;
        if (scene) {
          scene.emitHud = () => this.crearTickHud(scene);
          scene.emitDestroy = () => {
            this.fase.set('derrota');
            if (this.hudTimer) clearInterval(this.hudTimer);
          };
        }
      });

      this.hudTimer = setInterval(() => this.crearTickHud(), 200);
      this.fase.set('jugando');
    }, 120);
  }

  private crearTickHud(scene?: any): void {
    this.tiempo.set(Math.floor((performance.now() - this.arrancarseMs) / 1000));
    const s = scene ?? this.game?.scene?.getScene('Combate') as any;
    if (s) {
      // @ts-ignore — typed loose in @ts-nocheck
      this.salud.set(s.salud ?? 0);
      this.xp.set(s.xp ?? 0);
      this.enemigosVivos.set(s.enemies?.filter((e: any) => e.active).length ?? 0);
      // Victory after 90s
      const t = this.tiempo();
      if (t >= 90 && this.fase() === 'jugando') this.fase.set('victoria');
    }
  }
}