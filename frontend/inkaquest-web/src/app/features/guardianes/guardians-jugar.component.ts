// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Phaser from 'phaser';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { CombateScene, MEJORAS } from './combate-scene';

/** Juego completo de supervivencia por hordas con mejoras entre hordas y progreso persistido. */
@Component({
  selector: 'app-guardians-jugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-4">
      <app-page-header [titulo]="'Nivel ' + numero() + ' — Guardianes del Conocimiento'" descripcion="Sobrevive 9 hordas (≈5 min), recibe mejoras entre hordas y desbloquea la siguiente lekcción del curso." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          @if (enPausa()) { <button type="button" class="btn btn-primary btn-sm" (click)="reanudar()">Reanudar</button> }
          @else if (fase() === 'jugando') { <button type="button" class="btn btn-outline btn-sm" (click)="pausar()">Pausa</button> }
          <a routerLink="/estudiante/guardianes" class="btn btn-outline btn-sm">Abandonar nivel</a>
        </div>
      </app-page-header>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="card card-body lg:col-span-4 order-2 lg:order-1 space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-marine-500">Estado de combate</h2>
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
            <p>Horda <strong>{{ hordaActual() }} / 9</strong></p>
          </div>
          <div class="rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-xs text-marine-700">
            <p class="font-bold text-marine-800">Controles</p>
            <p class="mt-1"><strong>WASD / ← → ↑ ↓</strong><br/>Disparo automático al enemigo más cercano</p>
          </div>
        </div>

        <div class="lg:col-span-8 order-1 lg:order-2 space-y-4">
          <div id="juego-root" class="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-gold-500/30 bg-marine-900" aria-label="Área de juego. Combate top-down.">
            <!-- Overlay de mejoras entre hordas -->
            @if (elegirMejora()) {
              <div class="absolute inset-0 z-10 flex items-center justify-center bg-marine-900/80 p-3 backdrop-blur-sm">
                <div class="w-full max-w-2xl space-y-3 rounded-2xl border border-gold-400/40 bg-gradient-to-br from-marine-900 to-marine-800 p-4 text-white">
                  <div>
                    <p class="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-gold-400">Selecciona una mejora</p>
                    <h3 class="text-lg font-extrabold">¡Horda {{ hordaActual() }} superada!</h3>
                    <p class="text-xs text-marine-200">Elige un beneficio académico antes de la próxima horda.</p>
                  </div>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    @for (m of candidatosMejora(); track m.id) {
                      <button type="button" class="flex flex-col items-start justify-between gap-2 rounded-xl border border-gold-400/25 bg-marine-900/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-gold-400 hover:bg-marine-800" (click)="aplicarMejora(m)">
                        <div class="space-y-1">
                          <p class="text-sm font-bold text-gold-400">{{ m.nombre }}</p>
                          <p class="text-[0.7rem] text-marine-200">{{ m.descripcion }}</p>
                        </div>
                        <span class="text-[0.65rem] font-extrabold uppercase tracking-widest" [class.text-gold-400]="m.rareza === 'academic'" [class.text-white]="m.rareza === 'comun'" [class.text-rose-400]="m.rareza === 'legendario'">{{ m.rareza === 'comun' ? 'COMÚN' : m.rareza === 'academic' ? 'ACADÉMICA' : 'LEGENDARIA' }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          @if (fase() === 'victoria' || fase() === 'derrota') {
            <div class="rounded-2xl border border-gold-500/40 bg-marine-900 p-6 text-center">
              <p class="text-2xl font-extrabold text-gold-400">{{ fase() === 'victoria' ? '¡Nivel superado!' : 'Nivel perdido' }}</p>
              <p class="mt-2 text-sm text-marine-100">
                @if (fase() === 'victoria') { +{{ xpGanado() }} XP · +{{ monedasGanadas() }} monedas }
              </p>
              <p class="mt-2 text-[0.7rem] uppercase tracking-widest text-marine-400">{{ mensajeResultado() }}</p>
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
  private readonly supabase = inject(SupabaseService);

  protected readonly numero = signal(1);
  protected readonly fase = signal<'intro' | 'jugando' | 'victoria' | 'derrota'>('intro');
  protected readonly salud = signal(100);
  protected readonly saludMax = signal(100);
  protected readonly xp = signal(0);
  protected readonly enemigosVivos = signal(0);
  protected readonly tiempo = signal(0);
  protected readonly hordaActual = signal(1);
  protected readonly enPausa = signal(false);
  protected readonly xpGanado = signal(0);
  protected readonly monedasGanadas = signal(0);
  protected readonly mensajeResultado = signal('');
  protected readonly elegirMejora = signal(false);
  protected readonly candidatosMejora = signal<readonly { id: string; nombre: string; descripcion: string; rareza: string }[]>([]);

  protected readonly saludPct = computed(() => Math.max(0, Math.min(100, (this.salud() / this.saludMax()) * 100)));
  protected readonly xpPct = computed(() => Math.min(100, (this.xp() % 200) / 2));
  protected readonly tiempoFormateado = computed(() => {
    const s = this.tiempo();
    const m = Math.floor(s / 60);
    const r = Math.max(0, Math.trunc(s % 60));
    return `${m}:${r.toString().padStart(2, '0')}`;
  });

  private game: Phaser.Game | null = null;
  private hudTimer: any;
  private arrancarseMs = 0;
  private intentoId: string | null = null;

  ngOnInit(): void {
    const n = Number(this.route.snapshot.paramMap.get('numero')) || 1;
    this.numero.set(n);
    queueMicrotask(() => this.arrancar());
  }

  ngOnDestroy(): void { this.limpiar(); }

  protected pausar(): void { this.enPausa.set(true); this.game?.pause(); }
  protected reanudar(): void { this.enPausa.set(false); this.game?.resume(); }

  protected reiniciar(): void {
    this.salud.set(100); this.saludMax.set(100); this.xp.set(0); this.enemigosVivos.set(0); this.tiempo.set(0); this.hordaActual.set(1);
    this.fase.set('intro'); this.xpGanado.set(0); this.monedasGanadas.set(0); this.mensajeResultado.set(''); this.intentoId = null; this.elegirMejora.set(false);
    if (this.game) { this.game.destroy(true); this.game = null; }
    if (this.hudTimer) clearInterval(this.hudTimer);
    queueMicrotask(() => this.arrancar());
  }

  protected aplicarMejora(m: { id: string; nombre: string }): void {
    const scene = this.game?.scene?.getScene('Combate') as any;
    if (scene) {
      scene.applyUpgrade(m.id);
      scene.comenzarSiguienteHorda?.();
    }
    this.elegirMejora.set(false);
    this.hordaActual.set((this.game?.scene?.getScene('Combate') as any)?.hordaActual ?? 1);
  }

  private limpiar(): void {
    if (this.hudTimer) clearInterval(this.hudTimer);
    if (this.game) { this.game.destroy(true); this.game = null; }
  }

  private async resolverNivelId(numero: number): Promise<string | null> {
    const sb = this.supabase.client;
    const { data: cs } = await sb.from('guardianes_campana').select('id').limit(1).maybeSingle();
    const { data } = await sb.from('guardianes_nivel').select('id').eq('campana_id', cs?.id ?? '').eq('numero', numero).maybeSingle();
    return data?.id ?? null;
  }

  private async arrancar(): Promise<void> {
    const nivelId = await this.resolverNivelId(this.numero());
    const sb = this.supabase.client;

    // Iniciar intento
    if (nivelId) {
      try {
        const { data: id } = await sb.rpc('guardianes_iniciar_intento', { p_nivel_id: nivelId });
        this.intentoId = id as string | null;
      } catch (e) { console.warn('[guardianes] iniciar_intento:', e); }
    }

    setTimeout(() => {
      const el = typeof document !== 'undefined' ? document.querySelector('#juego-root') : null;
      const host = (el as HTMLElement) || (typeof document !== 'undefined' ? document.getElementById('juego-root') : null);
      if (!host) return;

      this.game = new Phaser.Game({
        type: Phaser.AUTO, parent: host,
        width: host.clientWidth || 880, height: host.clientHeight || 520,
        backgroundColor: '#0f1a33',
        physics: { default: 'arcade', arcade: { gravity: { y: 0, x: 0 }, debug: false } },
        scene: [CombateScene],
      });

      this.game.events.once('ready', () => {
        const scene = this.game?.scene?.getScene('Combate') as any;
        const nivelIdLocal = nivelId;
        if (scene && nivelIdLocal) {
          scene.emitHud = () => this.crearTickHud(scene);
          scene.emitUpgradePick = () => this.abrirMenuMejoras();
          scene.emitDestroy = (victoria: boolean, matados: number, tiempoSeg: number) => {
            void this.persistirIntento(nivelIdLocal, victoria, matados, tiempoSeg);
          };
        }
      });

      this.hudTimer = setInterval(() => this.crearTickHud(), 150);
      this.fase.set('jugando');
      this.arrancarseMs = performance.now();
    }, 120);
  }

  private abrirMenuMejoras(): void {
    // La escena ya queda congelada con pickingUpgrade; aquí sólo mostramos el overlay
    this.elegirMejora.set(true);
    this.hordaActual.set((this.game?.scene?.getScene('Combate') as any)?.hordaActual ?? 1);

    const pool = [...MEJORAS];
    const picks: typeof pool = [];
    while (picks.length < 3 && pool.length) { picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); }
    this.candidatosMejora.set(picks.map((m) => ({ id: m.id, nombre: m.nombre, descripcion: m.descripcion, rareza: m.rareza })));
  }

  private async persistirIntento(nivelId: string, victoria: boolean, matados: number, tiempoSeg: number): Promise<void> {
    this.fase.set(victoria ? 'victoria' : 'derrota');
    if (this.hudTimer) clearInterval(this.hudTimer);
    // Capturar la horda antes de destruir el juego
    const hordasActuales = (this.game?.scene?.getScene('Combate') as any)?.hordaActual ?? (victoria ? 9 : 1);
    // Destruir el juego fuera del callback de la escena para evitar reentrancia
    setTimeout(() => { if (this.game) { this.game.destroy(true); this.game = null; } }, 50);
    if (!this.intentoId) {
      this.mensajeResultado.set('Estado no persistido (sin intentoId).');
      return;
    }
    const sb = this.supabase.client;
    try {
      const { data } = await sb.rpc('guardianes_finalizar_intento', {
        p_intento_id: this.intentoId,
        p_resultado: victoria ? 'victoria' : 'derrota',
        p_matados: matados,
        p_hordas: hordasActuales,
        p_tiempo: tiempoSeg,
        p_precision: 100,
      });
      const payload = data as any;
      this.xpGanado.set(payload?.xp ?? 0);
      this.monedasGanadas.set(payload?.monedas ?? 0);
      this.mensajeResultado.set(victoria ? 'Progreso guardado en tu perfil.' : 'No se acreditó XP.');
    } catch (e) { this.mensajeResultado.set(e instanceof Error ? `Error: ${e.message}` : 'Error de red.'); }
  }

  private crearTickHud(scene?: any): void {
    const elapsed = Math.floor((performance.now() - this.arrancarseMs) / 1000);
    this.tiempo.set(elapsed);
    const s = scene ?? (this.game?.scene?.getScene('Combate') as any);
    if (s) {
      this.salud.set(s.salud ?? 0);
      this.saludMax.set(s.saludMax ?? 100);
      this.xp.set(s.xp ?? 0);
      this.hordaActual.set(s.hordaActual ?? 1);
      this.enemigosVivos.set(s.enemies?.filter((e: any) => e.active).length ?? 0);
    }
  }
}