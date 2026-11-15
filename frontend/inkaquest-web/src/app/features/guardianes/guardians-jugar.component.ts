// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import Phaser from 'phaser';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { CombateScene, MEJORAS, MEJORAS_EXTRA } from './combate-scene';

/** Juego completo de supervivencia por hordas con mejoras entre hordas y progreso persistido. */
@Component({
  selector: 'app-guardians-jugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, NgClass],
  template: `
    <section class="space-y-4">
      <app-page-header [titulo]="'Nivel ' + numero() + ' — Guardianes del Conocimiento'" descripcion="Sobrevive 9 hordas (≈5 min), recibe mejoras y responde chequeos académicos entre hordas." [acciones]="true">
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
                    <h3 class="text-lg font-extrabold">¡Horda {{ hordaActual() }} de 9 superada!</h3>
                    <p class="text-xs text-marine-200">{{ hordaActual() >= 9 ? 'Ceremonia final: elige tu última mejora y vencerás el nivel.' : 'Elige un beneficio académico antes de la próxima horda.' }}</p>
                  </div>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    @for (m of candidatosMejora(); track m.id) {
                      <button type="button" class="flex flex-col items-start justify-between gap-2 rounded-xl border border-gold-400/25 bg-marine-900/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-gold-400 hover:bg-marine-800" (click)="aplicarMejora(m)">
                        <div class="space-y-1">
                          <p class="text-sm font-bold text-gold-400">{{ m.nombre }}</p>
                          <p class="text-[0.7rem] text-marine-200">{{ m.descripcion }}</p>
                          <p class="text-[0.65rem] font-bold uppercase tracking-widest text-brand-300">{{ m.rango > 0 ? 'Mejora a Nv. ' + (m.rango + 1) : 'Nueva adquisición' }}</p>
                        </div>
                        <div class="flex w-full items-center justify-between gap-2">
                          <span class="text-[0.65rem] font-extrabold uppercase tracking-widest" [class.text-gold-400]="m.rareza === 'academic'" [class.text-white]="m.rareza === 'comun'" [class.text-rose-400]="m.rareza === 'legendario'">{{ m.rareza === 'comun' ? 'COMÚN' : m.rareza === 'academic' ? 'ACADÉMICA' : 'LEGENDARIA' }}</span>
                          <span class="text-[0.65rem] font-bold text-marine-300">{{ m.rango }}/{{ m.maxRango }}</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
            <!-- Overlay de chequeo académico entre hordas -->
            @if (preguntaActual(); as p) {
              <div class="absolute inset-0 z-10 flex items-center justify-center bg-marine-900/80 p-3 backdrop-blur-sm">
                <div class="w-full max-w-xl space-y-3 rounded-2xl border border-brand-400/40 bg-gradient-to-br from-marine-900 to-marine-800 p-4 text-white">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-400">Chequeo académico · Horda {{ hordaActual() }}</p>
                      <h3 class="mt-1 text-base font-extrabold leading-snug">{{ p.enunciado }}</h3>
                      @if (p.tema) { <p class="mt-1 text-[0.65rem] uppercase tracking-widest text-marine-400">{{ p.tema }} · {{ p.dificultad }}</p> }
                    </div>
                    @if (!respuestaResultado()) {
                      <button type="button" class="shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-marine-400 underline underline-offset-2 hover:text-marine-200" (click)="omitirChequeo()">Omitir</button>
                    }
                  </div>
                  <div class="grid gap-2">
                    @for (op of p.opciones; track op) {
                      <button type="button" [ngClass]="claseOpcion(op)" (click)="elegirOpcion(op)">{{ op }}</button>
                    }
                  </div>
                  @if (respuestaResultado(); as r) {
                    <div class="rounded-xl border p-3 text-sm" [class.border-emerald-400/40]="r.esCorrecta" [class.bg-emerald-400/10]="r.esCorrecta" [class.border-rose-400/40]="!r.esCorrecta" [class.bg-rose-400/10]="!r.esCorrecta">
                      <p class="font-extrabold" [class.text-emerald-300]="r.esCorrecta" [class.text-rose-300]="!r.esCorrecta">{{ r.esCorrecta ? '¡Correcto! +' + r.xp + ' XP · +' + r.monedas + ' monedas' : 'Respuesta incorrecta' }}</p>
                      @if (!r.esCorrecta && r.correcta) { <p class="mt-1 text-marine-100">Respuesta correcta: <strong>{{ r.correcta }}</strong></p> }
                      @if (r.explicacion) { <p class="mt-1 text-[0.75rem] text-marine-200">{{ r.explicacion }}</p> }
                    </div>
                    <button type="button" class="btn btn-gold w-full justify-center" (click)="continuarTrasChequeo()">Continuar →</button>
                  } @else {
                    <button type="button" class="btn btn-primary w-full justify-center disabled:opacity-40" [disabled]="!respuestaElegida()" (click)="confirmarRespuesta()">Comprobar respuesta</button>
                  }
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
  protected readonly candidatosMejora = signal<readonly { id: string; nombre: string; descripcion: string; rareza: string; rango: number; maxRango: number }[]>([]);
  protected readonly preguntaActual = signal<{ preguntaId: string; enunciado: string; opciones: string[]; tema: string; dificultad: string } | null>(null);
  protected readonly respuestaElegida = signal<string | null>(null);
  protected readonly respuestaResultado = signal<{ esCorrecta: boolean; correcta?: string; explicacion?: string; xp: number; monedas: number } | null>(null);
  private preguntaExcluidas: string[] = [];
  private nivelId: string | null = null;
  private preguntaDesde = 0;

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
    this.preguntaActual.set(null); this.respuestaElegida.set(null); this.respuestaResultado.set(null); this.preguntaExcluidas = [];
    if (this.game) { this.game.destroy(true); this.game = null; }
    if (this.hudTimer) clearInterval(this.hudTimer);
    queueMicrotask(() => this.arrancar());
  }

  protected aplicarMejora(m: { id: string; nombre: string }): void {
    const scene = this.game?.scene?.getScene('Combate') as any;
    if (scene) {
      scene.applyUpgrade(m.id);
    }
    this.elegirMejora.set(false);
    // Tras la mejora: chequeo académico de la lección antes de la siguiente horda
    void this.iniciarChequeo();
  }

  private iniciarSiguienteHorda(): void {
    const scene = this.game?.scene?.getScene('Combate') as any;
    scene?.comenzarSiguienteHorda?.();
    this.hordaActual.set(scene?.hordaActual ?? 1);
  }

  private async iniciarChequeo(): Promise<void> {
    const nivelId = this.nivelId;
    if (!nivelId || !this.intentoId) { this.iniciarSiguienteHorda(); return; }
    const sb = this.supabase.client;
    try {
      const { data, error } = await sb.rpc('guardianes_pregunta_aleatoria', {
        p_nivel_id: nivelId,
        p_excluir: this.preguntaExcluidas,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : null) as any;
      if (!row) { this.iniciarSiguienteHorda(); return; }
      const opciones = Array.isArray(row.opciones) ? row.opciones.map(String) : [];
      if (opciones.length < 2) { this.iniciarSiguienteHorda(); return; }
      this.preguntaExcluidas.push(row.pregunta_id);
      this.preguntaActual.set({
        preguntaId: row.pregunta_id,
        enunciado: String(row.enunciado ?? ''),
        opciones,
        tema: String(row.tema ?? ''),
        dificultad: String(row.dificultad ?? ''),
      });
      this.respuestaElegida.set(null);
      this.respuestaResultado.set(null);
      this.preguntaDesde = Date.now();
    } catch (e) {
      console.warn('[guardianes] chequeo:', e);
      this.iniciarSiguienteHorda();
    }
  }

  protected elegirOpcion(opcion: string): void {
    if (this.respuestaResultado()) return; // ya está calificada
    this.respuestaElegida.set(opcion);
  }

  protected async confirmarRespuesta(): Promise<void> {
    const pregunta = this.preguntaActual();
    const sel = this.respuestaElegida();
    if (!pregunta || !sel || this.respuestaResultado()) return;
    const sb = this.supabase.client;
    try {
      const { data, error } = await sb.rpc('guardianes_responder_pregunta', {
        p_intento_id: this.intentoId,
        p_pregunta_id: pregunta.preguntaId,
        p_respuesta: sel,
        p_duracion_ms: Date.now() - this.preguntaDesde,
      });
      if (error) throw error;
      const res = (data ?? {}) as any;
      this.respuestaResultado.set({
        esCorrecta: Boolean(res.es_correcta),
        correcta: res.correcta ?? undefined,
        explicacion: res.explicacion ?? undefined,
        xp: res.xp ?? 0,
        monedas: res.monedas ?? 0,
      });
      if (res.es_correcta) {
        const scene = this.game?.scene?.getScene('Combate') as any;
        if (scene) scene.xp = (scene.xp ?? 0) + (res.xp ?? 0);
        this.xp.set(scene?.xp ?? this.xp());
      }
    } catch (e) {
      console.warn('[guardianes] responder chequeo:', e);
      this.respuestaResultado.set({ esCorrecta: false, explicacion: 'No se pudo calificar. Revisa tu conexión.', xp: 0, monedas: 0 });
    }
  }

  protected omitirChequeo(): void {
    this.preguntaActual.set(null);
    this.respuestaElegida.set(null);
    this.respuestaResultado.set(null);
    this.iniciarSiguienteHorda();
  }

  protected continuarTrasChequeo(): void {
    this.omitirChequeo();
  }

  protected claseOpcion(op: string): string {
    const base = 'rounded-xl border px-3 py-2 text-left text-sm transition ';
    const r = this.respuestaResultado();
    const sel = this.respuestaElegida();
    if (!r) {
      return base + (sel === op
        ? 'border-brand-400 bg-brand-400/15 text-white'
        : 'border-gold-400/25 bg-marine-900/80 text-marine-100 hover:border-brand-400 hover:text-white');
    }
    if (op === r.correcta) return base + 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200';
    if (sel === op) return base + 'border-rose-400/60 bg-rose-400/15 text-rose-200';
    return base + 'border-gold-400/10 bg-marine-900/60 text-marine-500';
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
    this.nivelId = nivelId;
    this.preguntaExcluidas = [];
    this.preguntaActual.set(null);
    this.respuestaResultado.set(null);
    this.respuestaElegida.set(null);
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
    const scene = this.game?.scene?.getScene('Combate') as any;
    this.hordaActual.set(scene?.hordaActual ?? 1);

    // Pool reutilizable por rangos: sólo ofrece lo que aún no está al máximo,
    // con Vitamina Vital como reserva ilimitada si todo está maxeado.
    const rango = (id: string): number => scene?.getRango?.(id) ?? 0;
    const disponibles = [...MEJORAS, ...MEJORAS_EXTRA].filter((m) => rango(m.id) < m.maxRango);
    const picks: typeof disponibles = [];
    const pool = [...disponibles];
    while (picks.length < 3 && pool.length) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    this.candidatosMejora.set(picks.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      rareza: m.rareza,
      rango: rango(m.id),
      maxRango: m.maxRango,
    })));
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