// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CURSO_PRINCIPIOS_ALGORITMOS } from '../../core/services/guardianes-acceso.service';
import { GUARDIANES, NIVEL_DESBLOQUEO, type GuardianeRareza } from './guardians-catalog';
import { GuardianesRankingComponent } from './ranking-guardianes.component';

interface NivelItem {
  numero: number;
  titulo: string;
  lekctioneId: string | null;
  bloqueada: boolean;
  completada: boolean;
  disponible: boolean;
}

/**
 * Punto de entrada del videojuego InkaQuest: Guardianes del Conocimiento.
 *
 * <p>Solo disponible para estudiantes con matrícula activa en el curso
 * Principios de Algoritmos. El catálogo de lekctiones del mismo curso se
 * muestra como 18 niveles académicos de campaña; se desbloquean en orden
 * de completion según progreso_leccion.</p>
 */
@Component({
  selector: 'app-guardians-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgClass, GuardianesRankingComponent],
  template: `
    <section class="space-y-5">
      @if (error()) {
        <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800" role="alert">{{ error() }}</div>
      }

      <!-- ══════════ HERO ══════════ -->
      <header class="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-marine-950 text-white shadow-[0_20px_60px_-25px_rgba(15,26,51,0.9)]">
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
          <div class="absolute -top-24 -left-24 size-96 rounded-full bg-gold-500/15 blur-3xl"></div>
          <div class="absolute -bottom-28 right-[-6rem] size-[26rem] rounded-full bg-brand-500/15 blur-3xl"></div>
          <div class="absolute inset-0 opacity-[0.05]" style="background-image: radial-gradient(circle, #ffffff 1px, transparent 1px); background-size: 22px 22px;"></div>
        </div>

        <div class="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:gap-8">
          <!-- Columna izquierda: mensaje + CTA -->
          <div class="flex flex-col justify-center lg:col-span-7">
            <span class="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">
              <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>
              Campaña · Principios de Algoritmos
            </span>

            <h1 class="mt-4 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl">
              Survive. Aprende.<br/>
              <span class="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 bg-clip-text text-transparent">Protege el algoritmo.</span>
            </h1>

            <p class="mt-4 max-w-xl text-sm leading-relaxed text-marine-100 sm:text-[0.95rem]">
              Supervivencia por hordas exclusiva del curso Principios de Algoritmos. Fundamentos, condicionales y repetitivas:
              cada oleada que superes refuerza lo que estás aprendiendo en clase.
            </p>

            <!-- CTA — botones uniformes -->
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a class="btn btn-gold btn-lg shadow-[0_6px_0_#b45309] hover:translate-y-[1px] hover:shadow-[0_4px_0_#b45309]" [routerLink]="['/estudiante/guardianes/nivel', primerDisponible() ?? 1]">
                <svg viewBox="0 0 24 24" class="size-5" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z"/></svg>
                Empezar partida · Nivel {{ primerDisponible() }}
              </a>
              <button type="button" class="btn btn-outline-light btn-lg" (click)="irACampana()">
                <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                Ver campaña
              </button>
            </div>

            <!-- Meta chips -->
            <dl class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-marine-100/90">
              <div class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-gold-400"></span>18 niveles</div>
              <div class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-brand-400"></span>162 hordas</div>
              <div class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-emerald-400"></span>4 guardianes</div>
              <div class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-violet-400"></span>Chequeo académico</div>
            </dl>
          </div>

          <!-- Columna derecha: escuadrón -->
          <div class="lg:col-span-5">
            <div class="flex h-full flex-col rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
              <div class="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h2 class="text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-white">Tu escuadrón</h2>
                <span class="rounded-full border border-gold-400/50 bg-gold-500/15 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-gold-300">4 guardianes</span>
              </div>
              <div class="grid flex-1 grid-cols-2 gap-2.5">
                @for (g of escuadronVista(); track g.id) {
                  <div class="group relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-marine-900/60 px-2 py-3 text-center transition-all duration-200" [ngClass]="g.desbloqueado ? 'hover:border-gold-400/50 hover:bg-marine-800/70' : ''">
                    <img [src]="g.sprite" [alt]="g.nombre" width="64" height="64" class="size-16 [image-rendering:pixelated] drop-shadow-[0_6px_10px_rgba(0,0,0,0.55)] transition-transform duration-200" [ngClass]="g.desbloqueado ? 'group-hover:-translate-y-1 group-hover:scale-110' : 'grayscale opacity-40'" loading="lazy" />
                    <p class="text-[0.78rem] font-extrabold leading-tight text-white" [class.opacity-50]="!g.desbloqueado">{{ g.nombre }}</p>
                    @if (g.desbloqueado) {
                      <span class="rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em]" [ngClass]="rarezaClass(g.rareza)">{{ rarezaLabel(g.rareza) }}</span>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-gold-400">
                        <svg viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                        Nivel {{ NIVEL_DESBLOQUEO[g.id] }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- ══════════ TU RENDIMIENTO (panel encuadrado, 4 celdas uniformes) ══════════ -->
      <section class="card overflow-hidden" aria-label="Rendimiento del jugador">
        <div class="flex items-center justify-between gap-3 border-b border-surface-200 bg-surface-50/70 px-4 py-2 sm:px-5">
          <p class="text-[0.62rem] font-extrabold uppercase tracking-[0.22em] text-marine-500">Tu rendimiento</p>
          <p class="text-[0.58rem] font-bold uppercase tracking-widest text-marine-400">Resumen de la campaña</p>
        </div>
        <div class="grid grid-cols-2 divide-x divide-y divide-surface-200 sm:grid-cols-4 sm:divide-y-0">
          <div class="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center">
            <span class="grid size-8 place-items-center rounded-lg bg-marine-100 text-marine-600">
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 20h12M8 4v6a4 4 0 0 0 8 0V4M8 20v-4a4 4 0 0 1 8 0v4"/></svg>
            </span>
            <span class="text-2xl font-extrabold leading-none tabular-nums text-marine-800">{{ totalIntentos() }}</span>
            <span class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-marine-500">Partidas</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center">
            <span class="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1"/></svg>
            </span>
            <span class="text-2xl font-extrabold leading-none tabular-nums text-emerald-600">{{ totalVictorias() }}</span>
            <span class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-marine-500">Victorias</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center">
            <span class="grid size-8 place-items-center rounded-lg bg-gold-50 text-gold-600">
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>
            </span>
            <span class="text-2xl font-extrabold leading-none tabular-nums text-gold-600">+{{ xpTotal() }}</span>
            <span class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-marine-500">XP ganada</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center">
            <span class="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
            </span>
            <span class="text-2xl font-extrabold leading-none tabular-nums text-brand-600">{{ precisionMedia() }}%</span>
            <span class="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-marine-500">Precisión</span>
          </div>
        </div>
      </section>

      <div class="grid gap-5 lg:grid-cols-12">
        <!-- ══════════ CAMPAÑA ══════════ -->
        <div id="campana" class="card card-body rounded-2xl transition-all duration-300 lg:col-span-8" [class.ring-2]="flashCampana()" [class.ring-gold-400]="flashCampana()" [class.shadow-xl]="flashCampana()">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-lg font-extrabold text-marine-900">Campaña — 18 niveles</h2>
              <p class="text-xs text-marine-500">Cada nivel corresponde a una lección del curso. Supera hordas, responde chequeos y completa la lección.</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-xs font-extrabold uppercase tracking-wider text-marine-500">Progreso</p>
                <p class="text-sm font-extrabold text-marine-800">{{ completados() }} / 18 completados</p>
              </div>
              <div class="h-2.5 w-28 overflow-hidden rounded-full border border-surface-200 bg-surface-200 sm:w-36">
                <div class="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-500 transition-all duration-500" [style.width.%]="progresoCampana()"></div>
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            @for (n of niveles(); track n.numero) {
              <a
                class="group relative flex min-h-[6.5rem] flex-col justify-between overflow-hidden rounded-xl border p-3 text-left transition-all duration-200"
                [ngClass]="tileClass(n)"
                [routerLink]="n.bloqueada ? null : ['/estudiante/guardianes/nivel', n.numero]"
                [attr.aria-disabled]="n.bloqueada ? 'true' : null"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="grid size-7 place-items-center rounded-lg text-[0.72rem] font-extrabold" [ngClass]="numeroClass(n)">{{ n.numero }}</span>
                  @if (n.completada) {
                    <svg viewBox="0 0 24 24" class="size-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  } @else if (n.bloqueada) {
                    <svg viewBox="0 0 24 24" class="size-5 text-marine-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" class="size-5 text-gold-400" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z"/></svg>
                  }
                </div>
                <span class="line-clamp-2 text-[0.78rem] font-bold leading-snug">{{ n.titulo }}</span>
                <span class="text-[0.6rem] font-bold uppercase tracking-[0.14em] opacity-80">{{ n.bloqueada ? 'Bloqueado' : (n.completada ? 'Completado' : 'Disponible') }}</span>
              </a>
            }
          </div>
        </div>

        <!-- ══════════ ASIDE ══════════ -->
        <aside class="space-y-4 lg:col-span-4">
          <!-- Siguiente objetivo -->
          <div class="relative overflow-hidden rounded-2xl border border-gold-500/40 bg-gradient-to-br from-gold-50 via-amber-50 to-gold-100 p-5">
            <div aria-hidden="true" class="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-gold-400/20 blur-2xl"></div>
            <p class="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-gold-700">Siguiente objetivo</p>
            <p class="mt-1.5 text-2xl font-extrabold text-marine-900">Nivel {{ siguienteNumero() }} <span class="text-base font-bold text-marine-500">/ 18</span></p>
            <p class="mt-1 text-sm font-semibold leading-snug text-gold-800">{{ siguienteTitulo() }}</p>
            <a class="btn btn-gold btn-md mt-4 w-full" [routerLink]="['/estudiante/guardianes/nivel', siguienteNumero()]">
              <svg viewBox="0 0 24 24" class="size-4" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z"/></svg>
              Jugar ahora
            </a>
          </div>

          <!-- Cómo jugar -->
          <div class="card card-body">
            <h3 class="text-sm font-extrabold uppercase tracking-[0.18em] text-marine-500">Cómo jugar</h3>
            <ol class="mt-3 space-y-2.5 text-sm text-marine-700">
              <li class="flex items-start gap-2.5"><span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-marine-800 text-[0.62rem] font-extrabold text-white">1</span>Elige tu guardián y supera las hordas de la lección.</li>
              <li class="flex items-start gap-2.5"><span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-marine-800 text-[0.62rem] font-extrabold text-white">2</span>Entre oleadas eliges una mejora: el chequeo académico decide si la conservas — si fallas, la pierdes.</li>
              <li class="flex items-start gap-2.5"><span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-marine-800 text-[0.62rem] font-extrabold text-white">3</span>Completa la lección en el aula para desbloquear el siguiente nivel.</li>
            </ol>
          </div>

          <!-- Curso -->
          <div class="rounded-2xl border border-marine-800 bg-marine-950 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p class="text-[0.62rem] font-extrabold uppercase tracking-[0.22em] text-gold-400">Curso vinculado</p>
            <p class="mt-1 font-extrabold leading-snug">Principios de Algoritmos</p>
            <p class="mt-0.5 text-xs text-marine-200">InkaQuest · Edición 2026</p>
          </div>
        </aside>
      </div>

      <!-- Ranking del curso: nivel más alto superado y mejores tiempos por nivel -->
      <app-ranking-guardianes />
    </section>
  `,
})
export class GuardiansComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly cursos = inject(CourseService);
  private readonly supabase = inject(SupabaseService);

  protected readonly niveles = signal<NivelItem[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly flashCampana = signal(false);
  protected readonly siguienteNumero = signal(1);
  protected readonly siguienteTitulo = signal('');
  protected readonly totalIntentos = signal(0);
  protected readonly totalVictorias = signal(0);
  protected readonly xpTotal = signal(0);
  protected readonly precisionMedia = signal(0);
  protected readonly NIVEL_DESBLOQUEO = NIVEL_DESBLOQUEO;
  /** Nivel máximo jugable (primer nivel pendiente o 18 si completó todo). */
  protected readonly maxJugable = computed(() => {
    const pen = this.niveles().find((n) => !n.completada);
    return pen?.numero ?? 18;
  });
  /** Escuadrón con bloqueo aplicado: Rambo/Maga N1 · Sasuke N7 · La Herencia N15. */
  protected readonly escuadronVista = computed(() =>
    GUARDIANES.map((g) => ({ ...g, desbloqueado: this.maxJugable() >= (NIVEL_DESBLOQUEO[g.id] ?? 1) }))
  );

  protected completados(): number {
    return this.niveles().filter((n) => n.completada).length;
  }

  protected progresoCampana(): number {
    const total = this.niveles().length || 18;
    return Math.round((this.completados() / total) * 100);
  }

  protected rarezaLabel(r: GuardianeRareza): string {
    return r === 'leyenda' ? 'Leyenda' : r === 'heroe' ? 'Héroe' : 'Común';
  }

  protected rarezaClass(r: GuardianeRareza): Record<string, boolean> {
    return {
      'border border-slate-400/40 bg-slate-500/15 text-slate-300': r === 'comun',
      'border border-brand-400/50 bg-brand-500/15 text-brand-300': r === 'heroe',
      'border border-gold-400/60 bg-gold-500/15 text-gold-300': r === 'leyenda',
    };
  }

  protected tileClass(n: NivelItem): Record<string, boolean> {
    return {
      'border-marine-800 bg-gradient-to-br from-marine-900 via-marine-800 to-marine-900 text-white hover:-translate-y-0.5 hover:border-gold-500/60 hover:shadow-[0_12px_30px_-12px_rgba(242,165,65,0.35)] cursor-pointer':
        !n.bloqueada && !n.completada,
      'border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-marine-900 to-marine-900 text-white hover:-translate-y-0.5 hover:border-emerald-400/60 cursor-pointer':
        n.completada,
      'border-surface-200 bg-surface-100 text-marine-400 cursor-not-allowed': n.bloqueada,
    };
  }

  protected numeroClass(n: NivelItem): Record<string, boolean> {
    return {
      'bg-gold-500 text-marine-900': !n.bloqueada && !n.completada,
      'bg-emerald-500 text-marine-950': n.completada,
      'bg-surface-200 text-marine-500': n.bloqueada,
    };
  }

  protected primerDisponible(): number {
    return this.niveles().find((n) => !n.bloqueada)?.numero ?? 1;
  }

  protected irACampana(): void {
    const el = typeof document !== 'undefined' ? document.getElementById('campana') : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.flashCampana.set(true);
    setTimeout(() => this.flashCampana.set(false), 1500);
  }

  ngOnInit(): void { void this.cargar(); }
  ngOnDestroy(): void { /* limpieza */ }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      // Matrícula activa de este usuario en el curso Principios de Algoritmos
      const USER = this.auth.usuario();
      if (!USER) return;
      const COURSE_ID = CURSO_PRINCIPIOS_ALGORITMOS;
      const supabase = this.supabase.client;
      const { data: matricula, error: matriculaErr } = await supabase
        .from('matricula')
        .select('id')
        .eq('estudiante_id', USER.id)
        .eq('curso_id', COURSE_ID)
        .eq('estado', 'activa')
        .maybeSingle();
      if (matriculaErr) throw new Error(matriculaErr.message);
      if (!matricula) {
        this.error.set('Necesitas matrícula activa en Principios de Algoritmos para jugar.');
        this.cargando.set(false);
        return;
      }
      const [{ data: campana }, { data: progreso }, { data: intentos }] = await Promise.all([
        supabase.from('guardianes_campana').select('id').limit(1).maybeSingle(),
        supabase.from('progreso_leccion').select('leccion_id,estado').eq('estudiante_id', USER.id),
        supabase.from('guardianes_intento').select('estado, xp_recibido, precision, hordas_completadas').eq('estudiante_id', USER.id),
      ]);
      const { data: nivelesDb, error: nivelesErr } = await supabase
        .from('guardianes_nivel')
        .select('numero, titulo, leccion_id, xp_recompensa, monedas_recompensa')
        .eq('campana_id', campana?.id ?? '')
        .order('numero');
      if (nivelesErr) throw new Error(nivelesErr.message);
      const completadas = new Set((progreso ?? []).filter((r: any) => r.estado === 'completado').map((r: any) => r.leccion_id));
      const items: NivelItem[] = (nivelesDb ?? []).map((n: any) => ({
        numero: n.numero,
        titulo: n.titulo ?? `Nivel ${n.numero}`,
        lekctioneId: n.leccion_id,
        bloqueada: false,
        completada: completadas.has(n.leccion_id),
        disponible: true,
      }));
      // Estadísticas del jugador
      this.totalIntentos.set(intentos?.length ?? 0);
      this.totalVictorias.set((intentos ?? []).filter((i: any) => i.estado === 'completado').length);
      this.xpTotal.set((intentos ?? []).reduce((s: number, i: any) => s + (i.xp_recibido ?? 0), 0));
      const precisiones = (intentos ?? []).map((i: any) => Number(i.precision ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
      this.precisionMedia.set(precisiones.length ? Math.round(precisiones.reduce((a, b) => a + b, 0) / precisiones.length) : 0);
      // Bloqueo progresivo: nivel N+1 bloqueado si el N-1 no está completado
      for (let i = 1; i < items.length; i++) {
        if (!items[i - 1].completada) items[i].bloqueada = true;
      }
      if (items[0]) items[0].bloqueada = false;
      this.niveles.set(items);
      this.siguienteNumero.set(items.find((n) => !n.completada)?.numero ?? 18);
      const next = items.find((n) => !n.completada);
      this.siguienteTitulo.set(next?.titulo ?? 'Completar niveles');

      // Si el estudiante NO está matriculado en el curso → bloquear entrada
      // (require matriculado check via progreso o matrícula)
    } catch (e) {
      console.error('[guardianes] cargar failed:', e);
    } finally {
      this.cargando.set(false);
    }
  }
}
