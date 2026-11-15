// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import Phaser from 'phaser';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupabaseService } from '../../core/services/supabase.service';
import { CombateScene, MEJORAS_EXTRA, mejoresPara } from './combate-scene';
import { GUARDIANES } from './guardians-catalog';

/** Juego completo de supervivencia por hordas con mejoras entre hordas y progreso persistido. */
@Component({
  selector: 'app-guardians-jugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, NgClass],
  template: `
    <section class="relative min-h-[100dvh] w-full overflow-hidden">
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(242,165,65,0.08),transparent_60%)]"></div>
      @if (!elegido()) {
        <app-page-header
          [titulo]="'Guardianes — Elige tu guardián'"
          descripcion="Arma crítica, pasiva única: tu guardián define cómo peleas. Sin magias, sólo tijeras, acero y plomo."
          [acciones]="false">
        </app-page-header>
      }

      @if (!elegido()) {
        <!-- ═══ SELECCIÓN DE GUARDIÁN ═══ -->
        <div class="rounded-2xl border-2 border-gold-500/60 bg-gradient-to-br from-marine-900 via-marine-800 to-marine-900 p-4 shadow-[0_0_60px_-15px_rgba(242,165,65,0.45)]">
          <div class="mb-4 text-center">
            <span class="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-gold-400">Guardianes del Conocimiento · Roster</span>
            <h2 class="mt-3 font-display text-3xl font-extrabold leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">¿QUIÉN PROTEGE<br/><span class="text-gold-400">LA LECCIÓN?</span></h2>
            <p class="mt-2 text-sm text-marine-300">Cada guardián pelea distinto: sus estadísticas y su pasiva definen tu estilo.</p>
          </div>
          <div class="grid gap-4 grid-cols-2 xl:grid-cols-4 max-w-5xl mx-auto">
            @for (g of guardianesDisponibles; track g.id) {
              <button type="button" class="group flex flex-col items-center gap-2 rounded-2xl border-2 border-surface-200 bg-gradient-to-b from-marine-800 to-marine-900 p-4 text-center transition-all duration-200 hover:-translate-y-2 hover:border-gold-400 hover:shadow-[0_0_30px_-8px_rgba(242,165,65,0.5)]" (click)="elegirGuardian(g.id)">
                <div class="relative grid h-36 w-full place-items-center overflow-hidden rounded-xl border border-gold-500/20 bg-black/40">
                  <img [src]="g.sprite" [alt]="g.nombre" class="max-h-[8.5rem] max-w-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:scale-110" />
                  <span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest" [class.bg-gold-500]="g.rareza === 'comun'" [class.text-marine-900]="g.rareza === 'comun'" [class.bg-brand-500]="g.rareza === 'heroe'" [class.text-white]="g.rareza === 'heroe'" [class.bg-rose-500]="g.rareza === 'leyenda'" [class.text-white]="g.rareza === 'leyenda'">{{ g.rareza === 'comun' ? 'Común' : g.rareza === 'heroe' ? 'Héroe' : 'Leyenda' }}</span>
                </div>
                <div>
                  <p class="font-display text-base font-extrabold leading-none text-white">{{ g.nombre }}</p>
                  <p class="text-[0.65rem] font-bold uppercase tracking-widest text-gold-400">{{ g.titulo }}</p>
                </div>
                <p class="text-[0.68rem] leading-snug text-marine-300">{{ g.descripcion }}</p>
                <span class="inline-flex w-fit items-center gap-1 rounded-full border border-marine-600 bg-marine-900/60 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest" [class.text-brand-300]="g.ataque === 'rango'" [class.text-rose-300]="g.ataque === 'haz'">{{ g.ataque === 'rango' ? '◎ Rango · Gatillo' : '× Haz · Cuerpo a cuerpo' }}</span>
                <div class="grid w-full grid-cols-3 gap-1 text-[0.62rem] font-bold uppercase tracking-wider">
                  <span class="rounded border border-rose-900/50 bg-rose-950/40 p-1 text-rose-200">DMG {{ g.danoBase }}</span>
                  <span class="rounded border border-emerald-900/50 bg-emerald-950/40 p-1 text-emerald-200">VID {{ 100 + g.vidaExtra }}</span>
                  <span class="rounded border border-sky-900/50 bg-sky-950/40 p-1 text-sky-200">VEL {{ 240 + g.velocidadExtra }}</span>
                </div>
                <p class="text-[0.68rem] font-bold text-gold-300">{{ g.pasivaNombre }}</p>
                <p class="text-[0.62rem] leading-snug text-marine-200">{{ g.pasivaDescripcion }}</p>
              </button>
            }
          </div>
        </div>
      } @else {

        <!-- ─── Fullscreen immersive game shell ─── -->
        <div class="fixed inset-0 z-[40] flex h-screen flex-col bg-marine-950 overflow-hidden">
          <!-- Top ribbon -->
          <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gold-500/15 bg-marine-950/95 px-2 sm:px-4 backdrop-blur">
            <div class="flex min-w-0 items-center gap-2 sm:gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded bg-gradient-to-br from-gold-400 to-gold-600 text-marine-900 text-base font-black shadow-[0_2px_0_#5c3a07]">{{ numero() }}</span>
              <div class="min-w-0 leading-tight">
                <p class="text-[0.55rem] uppercase tracking-[0.18em] text-gold-500">Guardianes · Nivel {{ numero() }}</p>
                <p class="mt-0.5 truncate text-[0.72rem] font-bold text-marine-100">Horda {{ hordaActual() }} <span class="text-marine-400">/ 9</span>
                  @if (esEvaluacion()) { <span class="ml-2 rounded-sm bg-rose-500/20 px-1.5 py-[1px] text-[0.55rem] font-extrabold uppercase tracking-widest text-rose-300">Jefe</span> }
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              @if (enPausa()) { <button type="button" class="btn btn-gold btn-sm" (click)="reanudar()">Reanudar</button> }
              @else if (fase() === 'jugando') { <button type="button" class="btn btn-gold btn-sm" (click)="pausar()">Pausa</button> }
              <a routerLink="/estudiante/guardianes" class="inline-flex size-9 items-center justify-center rounded-lg border border-danger-600/40 bg-danger-600/80 text-white shadow-[0_2px_0_#6d0017] hover:bg-danger-600" aria-label="Abandonar nivel">
                <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </a>
            </div>
          </header>

          <main class="relative flex flex-1 min-h-0">
            <!-- Sidebar HUD on the left -->
            <aside class="hidden lg:flex w-72 xl:w-[19rem] shrink-0 flex-col gap-2 border-r border-gold-500/15 bg-gradient-to-b from-marine-900 to-marine-950 p-3 overflow-y-auto">
              <!-- Vida -->
              <div class="rounded-xl border border-rose-900/40 bg-rose-950/30 p-2.5 shadow-[0_0_16px_-8px_rgba(244,63,94,0.35)]">
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-rose-200">
                    <svg viewBox="0 0 24 24" class="size-4 fill-rose-400" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.5C.5 7.5 4 4 8 4c2.4 0 3.3 1.4 4 2.4C12.7 5.4 13.6 4 16 4c4 0 7.5 3.5 6 7.5C19.5 16.2 12 21 12 21z"/></svg>
                    Vida
                  </span>
                  <span class="font-display text-xs font-extrabold tabular-nums text-white">{{ salud() }}<span class="text-[0.65rem] text-marine-400">/{{ saludMax() }}</span></span>
                </div>
                <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-rose-950/60"><div class="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 transition-all duration-200" [style.width.%]="saludPct()"></div></div>
              </div>
              <!-- XP -->
              <div class="rounded-xl border border-gold-900/40 bg-gold-950/30 p-2.5 shadow-[0_0_16px_-8px_rgba(242,165,65,0.45)]">
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-gold-300">
                    <svg viewBox="0 0 24 24" class="size-4 fill-gold-400" aria-hidden="true"><path d="M12 2l2.6 5.6L21 9.5l-4.5 4.3 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.5l6.4-1.9L12 2z"/></svg>
                    XP
                  </span>
                  <span class="font-display text-xs font-extrabold tabular-nums text-gold-300">+{{ xp() }}</span>
                </div>
                <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gold-950/50"><div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-gold-300 transition-all duration-200" [style.width.%]="xpPct()"></div></div>
              </div>
              <!-- PODER -->
              <div class="grid grid-cols-3 gap-1.5">
                <div class="rounded-lg border border-rose-900/50 bg-black/30 p-1.5 text-center">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-rose-400">ATK</p>
                  <p class="mt-0.5 font-display text-base font-extrabold text-white">{{ guardianActual()?.danoBase ?? 0 }}</p>
                </div>
                <div class="rounded-lg border border-emerald-900/50 bg-black/30 p-1.5 text-center">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-emerald-400">VID</p>
                  <p class="mt-0.5 font-display text-base font-extrabold text-white">{{ saludMax() }}</p>
                </div>
                <div class="rounded-lg border border-sky-900/50 bg-black/30 p-1.5 text-center">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-sky-400">VEL</p>
                  <p class="mt-0.5 font-display text-base font-extrabold text-white">{{ 240 + (guardianActual()?.velocidadExtra ?? 0) }}</p>
                </div>
              </div>
              <!-- Guardián -->
              @if (guardianActual()) {
                <div class="rounded-xl border border-gold-500/25 bg-black/40 p-2 flex items-center gap-2">
                  <img [src]="guardianActual()!.sprite" alt="" class="size-12 object-contain" />
                  <div class="min-w-0 flex-1">
                      <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-gold-400">{{ guardianActual()!.titulo }}</p>
                      <p class="truncate text-xs font-bold text-white">{{ guardianActual()!.nombre }}</p>
                      <p class="truncate text-[0.6rem] text-marine-300">{{ guardianActual()!.pasivaNombre }}</p>
                  </div>
                </div>
              }
              <!-- Enemigos + Tiempo -->
              <div class="grid grid-cols-2 gap-1.5">
                <div class="rounded-lg border border-brand-900/50 bg-black/30 p-2 text-center">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-brand-400">Enemigos</p>
                  <p class="font-display text-xl font-extrabold text-white tabular-nums">{{ enemigosVivos() }}</p>
                </div>
                <div class="rounded-lg border border-sky-900/50 bg-black/30 p-2 text-center">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-sky-400">Tiempo</p>
                  <p class="font-display text-xl font-extrabold text-white tabular-nums">{{ tiempoFormateado() }}</p>
                </div>
              </div>
              <!-- Progreso de hordas -->
              <div>
                <div class="flex items-center justify-between border-b border-gold-500/10 pb-1">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-marine-500">Progreso</p>
                  <p class="text-[0.55rem] tabular-nums font-extrabold text-gold-400">{{ hordaActual() }} / 9</p>
                </div>
                <div class="mt-1.5 flex items-center justify-between gap-1">
                  @for (i of [1,2,3,4,5,6,7,8,9]; track i) {
                    <span class="size-5 rounded text-center text-[0.55rem] font-extrabold leading-5"
                          [class.bg-gold-500]="i <= hordaActual()" [class.text-marine-900]="i <= hordaActual()"
                          [class.bg-marine-800]="i > hordaActual()" [class.text-marine-500]="i > hordaActual()">{{ i }}</span>
                  }
                </div>
              </div>
              <div class="mt-auto rounded-lg border border-gold-500/10 bg-gold-500/5 p-2 text-[0.6rem] leading-snug text-marine-200">
                <span class="font-bold uppercase tracking-wider text-gold-400">Apunta con el mouse</span><br/>La pantalla muestra solo lo esencial.
              </div>
            </aside>
            <!-- Canvas fills the rest -->
            <div class="relative flex min-w-0 flex-1 flex-col">
              <div id="juego-root" class="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden bg-marine-900 [&_canvas]:max-h-full [&_canvas]:max-w-full" aria-label="Área de juego. Combate top-down.">
                <!-- Overlay de bienvenida con controles (sólo al inicio) -->
                @if (mostrarIntro()) {
                  <div class="absolute inset-0 z-20 flex items-center justify-center bg-marine-900/80 p-4 backdrop-blur-sm">
                    <div class="max-w-md w-full space-y-4 rounded-2xl border border-gold-400/60 bg-gradient-to-br from-marine-800 via-marine-900 to-black p-5 text-center text-white shadow-[0_0_60px_-10px_rgba(242,165,65,0.6)]">
                      <span class="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">Guardianes · Roster</span>
                      <h3 class="font-display text-2xl font-extrabold text-white leading-none">Protege la lección<br/><span class="text-gold-400">sobreviviendo las hordas</span></h3>
                      <ul class="space-y-1.5 rounded-xl border border-gold-500/20 bg-black/30 p-2 text-left text-xs text-marine-100">
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-gold-500/50 bg-gold-500/10 text-[0.6rem] font-extrabold text-gold-400">W</span><span><strong>WASD / Flechas</strong> — muévete</span></li>
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-brand-500/50 bg-brand-500/10 text-[0.6rem] font-extrabold text-brand-400">◎</span><span><strong>Mouse</strong> — apunta con el cursor</span></li>
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-rose-500/50 bg-rose-500/10 text-[0.6rem] font-extrabold text-rose-400">×</span><span><strong>Elimina hordas</strong> y elige una mejora</span></li>
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-sky-500/50 bg-sky-500/10 text-[0.6rem] font-extrabold text-sky-400">★</span><span><strong>Responde</strong> la pregunta y gana +15 XP</span></li>
                      </ul>
                      <button type="button" class="btn btn-gold w-full justify-center !py-3 text-base !font-extrabold" (click)="comenzarPartida()">¡Entendido, jugar!</button>
                    </div>
                  </div>
                }
                <!-- Overlay de mejoras entre hordas -->
                @if (elegirMejora()) {
                  <div class="absolute inset-0 z-30 flex items-center justify-center bg-marine-900/80 p-3 backdrop-blur-sm">
                    <div class="w-full max-w-2xl space-y-4 rounded-2xl border-2 border-gold-400/60 bg-gradient-to-br from-marine-800 via-marine-900 to-black p-4 text-white shadow-[0_0_60px_-15px_rgba(242,165,65,0.55)]">
                      <div class="text-center">
                        <span class="inline-block rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">Mejora entre hordas</span>
                        <h3 class="mt-2 text-xl font-extrabold text-gold-300 leading-none">¡HORDA {{ hordaActual() }} SUPERADA!</h3>
                        <p class="mt-1 text-[0.7rem] text-marine-200">{{ hordaActual() >= 9 ? 'Ceremonia final: elige tu última mejora y vencerás este nivel.' : 'Elige tu recompensa antes de enfrentar la siguiente horda.' }}</p>
                      </div>
                      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        @for (m of candidatosMejora(); track m.id) {
                          <button type="button" class="group flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition hover:-translate-y-1"
                                  [class.border-brand-400]="m.rareza === 'comun'" [class.bg-brand-500/10]="m.rareza === 'comun'"
                                  [class.border-gold-400]="m.rareza === 'academic'" [class.bg-gold-500/10]="m.rareza === 'academic'"
                                  [class.border-rose-400]="m.rareza === 'legendario'" [class.bg-rose-500/10]="m.rareza === 'legendario'"
                                  (click)="aplicarMejora(m)">
                            <p class="text-sm font-extrabold text-white">{{ m.nombre }}</p>
                            <p class="text-[0.62rem] leading-snug text-marine-100">{{ m.descripcion }}</p>
                            <p class="text-[0.55rem] font-bold uppercase tracking-widest text-brand-300">{{ m.rango > 0 ? 'Mejora a Nv. ' + (m.rango + 1) : 'Nueva adquisición' }}</p>
                            <div class="mt-auto flex items-center justify-between border-t border-white/10 pt-2 rounded-sm">
                              <span class="text-[0.55rem] font-extrabold uppercase tracking-widest"
                                    [class.text-brand-300]="m.rareza === 'comun'" [class.text-gold-400]="m.rareza === 'academic'" [class.text-rose-400]="m.rareza === 'legendario'">{{ m.rareza === 'comun' ? 'COMÚN' : m.rareza === 'academic' ? 'ACADÉMICA' : 'LEGENDARIA' }}</span>
                              <span class="text-[0.6rem] tabular-nums font-bold text-marine-300">{{ m.rango }}/{{ m.maxRango }}</span>
                            </div>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
                <!-- Overlay de chequeo académico entre hordas -->
                @if (preguntaActual(); as p) {
                  <div class="absolute inset-0 z-30 flex items-center justify-center bg-marine-900/80 p-3 backdrop-blur-sm">
                    <div class="w-full max-w-xl space-y-3 rounded-2xl border border-brand-400/50 bg-gradient-to-br from-marine-800 to-marine-950 p-4 text-white">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-400">Chequeo académico · Horda {{ hordaActual() }}</p>
                          <h3 class="mt-1 text-base font-extrabold leading-snug">{{ p.enunciado }}</h3>
                          @if (p.tema) { <p class="mt-1 text-[0.6rem] uppercase tracking-widest text-marine-400">{{ p.tema }} · {{ p.dificultad }}</p> }
                        </div>
                        @if (!respuestaResultado()) { <button type="button" class="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest text-marine-400 underline hover:text-marine-200" (click)="omitirChequeo()">Omitir</button> }
                      </div>
                      <div class="grid gap-2">
                        @for (op of p.opciones; track op) {
                          <button type="button" [ngClass]="claseOpcion(op)" (click)="elegirOpcion(op)">{{ op }}</button>
                        }
                      </div>
                      @if (respuestaResultado(); as r) {
                        <div class="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm">
                          <p class="font-extrabold text-emerald-300">{{ r.esCorrecta ? '¡Correcto! +' + r.xp + ' XP' : 'Respuesta incorrecta' }}</p>
                          @if (!r.esCorrecta && r.correcta) { <p class="mt-1 text-marine-100">Respuesta: <strong>{{ r.correcta }}</strong></p> }
                          @if (r.explicacion) { <p class="mt-1 text-[0.75rem] text-marine-200">{{ r.explicacion }}</p> }
                        </div>
                        <button type="button" class="btn btn-gold w-full justify-center" (click)="continuarTrasChequeo()">Continuar →</button>
                      } @else {
                        <button type="button" class="btn btn-primary w-full justify-center disabled:opacity-40" [disabled]="!respuestaElegida()" (click)="confirmarRespuesta()">Comprobar respuesta</button>
                      }
                    </div>
                  </div>
                }
                <!-- Resultado -->
                @if (fase() === 'victoria' || fase() === 'derrota') {
                  <div class="absolute inset-0 z-30 flex items-center justify-center bg-marine-900/85 backdrop-blur-sm">
                    <div class="relative w-full max-w-md p-6 text-center text-white">
                      @if (fase() === 'victoria') {
                        <svg viewBox="0 0 120 120" class="mx-auto h-28 w-28 drop-shadow-[0_0_30px_rgba(242,165,65,0.7)]" aria-hidden="true">
                          <circle cx="60" cy="60" r="52" fill="#f2a541" stroke="#3d2600" stroke-width="4"/>
                          <circle cx="60" cy="60" r="37" fill="#dd8a1f" stroke="#3d2600" stroke-width="3"/>
                          <path d="M40 62l14 14 26-30" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h2 class="mt-4 text-3xl font-extrabold text-gold-400 drop-shadow-[0_3px_0_rgba(0,0,0,0.5)]">¡NIVEL SUPERADO!</h2>
                        <p class="mt-2 text-base font-extrabold text-gold-300">+{{ xpGanado() }} XP · +{{ monedasGanadas() }} monedas</p>
                      } @else {
                        <svg viewBox="0 0 120 120" class="mx-auto h-28 w-24" aria-hidden="true">
                          <path d="M60 8L112 108H8L60 8z" fill="#b3002d" stroke="#2a0510" stroke-width="4" stroke-linejoin="round"/>
                          <text x="60" y="92" text-anchor="middle" font-size="52" font-weight="900" fill="#fff" font-family="system-ui">!</text>
                        </svg>
                        <h2 class="mt-4 text-3xl font-extrabold text-rose-400 drop-shadow-[0_3px_0_rgba(0,0,0,0.5)]">NIVEL PERDIDO</h2>
                      }
                      <p class="mt-3 text-[0.65rem] uppercase tracking-widest text-marine-400">{{ mensajeResultado() }}</p>
                      <div class="mt-5 flex flex-wrap justify-center gap-2">
                        <a routerLink="/estudiante/guardianes" class="btn btn-outline-light">Volver a la campaña</a>
                        <button type="button" class="btn btn-gold" (click)="reiniciar()">Reintentar</button>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <!-- Mobile HUD (sin sidebar) -->
              <div class="lg:hidden border-t border-gold-500/15 bg-marine-950 px-4 py-2 text-xs">
                <div class="flex items-center justify-between gap-4">
                  <span class="flex items-center gap-1.5 font-extrabold text-rose-300">VID <span class="tabular-nums">{{ salud() }}/{{ saludMax() }}</span></span>
                  <span class="flex items-center gap-1.5 font-extrabold text-gold-300">Horda <span class="tabular-nums">{{ hordaActual() }}/9</span></span>
                  <span class="flex items-center gap-1.5 font-extrabold text-brand-300">Ene <span class="tabular-nums">{{ enemigosVivos() }}</span></span>
                </div>
              </div>
            </div>
          </main>
        </div>
      }
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
  protected readonly esEvaluacion = signal(false);
  protected readonly enPausa = signal(false);
  protected readonly xpGanado = signal(0);
  protected readonly monedasGanadas = signal(0);
  protected readonly mensajeResultado = signal('');
  protected readonly elegirMejora = signal(false);
  protected readonly candidatosMejora = signal<readonly { id: string; nombre: string; descripcion: string; rareza: string; rango: number; maxRango: number }[]>([]);
  protected readonly mostrarIntro = signal(true);
  protected readonly elegido = signal<string | null>(null);
  protected readonly guardianesDisponibles = GUARDIANES;
  protected readonly guardianActual = computed(() => GUARDIANES.find((g) => g.id === this.elegido()) ?? null);
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
    this.esEvaluacion.set([6, 12, 18].includes(n));
    // ¿Ya había un guardián elegido antes?
    try {
      const prev = typeof localStorage !== 'undefined' ? localStorage.getItem('guardianes-personaje') : null;
      if (prev) this.elegido.set(prev);
    } catch { /* ignore */ }
    queueMicrotask(() => this.arrancar());
  }

  protected elegirGuardian(id: string): void {
    if (id === '__cancel__') {
      // Cambiar de guardián: destruir partida y volver al roster
      if (this.game) { this.game.destroy(true); this.game = null; }
      if (this.hudTimer) clearInterval(this.hudTimer);
      this.elegido.set(null);
      this.fase.set('intro');
      try { localStorage.removeItem('guardianes-personaje'); } catch { /* ignore */ }
      return;
    }
    try { localStorage.setItem('guardianes-personaje', id); } catch { /* ignore */ }
    if (this.game) { this.game.destroy(true); this.game = null; }
    if (this.hudTimer) clearInterval(this.hudTimer);
    this.elegido.set(id);
    this.mostrarIntro.set(true);
    this.fase.set('intro');
    queueMicrotask(() => this.arrancar());
  }

  ngOnDestroy(): void { this.limpiar(); }

  protected comenzarPartida(): void {
    this.mostrarIntro.set(false);
    this.game?.resume();
  }

  protected pausar(): void { this.enPausa.set(true); this.game?.pause(); }
  protected reanudar(): void { this.enPausa.set(false); this.game?.resume(); }

  protected reiniciar(): void {
    this.salud.set(100); this.saludMax.set(100); this.xp.set(0); this.enemigosVivos.set(0); this.tiempo.set(0); this.hordaActual.set(1);
    this.fase.set('intro'); this.xpGanado.set(0); this.monedasGanadas.set(0); this.mensajeResultado.set(''); this.intentoId = null; this.elegirMejora.set(false);
    this.preguntaActual.set(null); this.respuestaElegida.set(null); this.respuestaResultado.set(null); this.preguntaExcluidas = [];
    this.mostrarIntro.set(true);
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
    // Si aún no eligió guardián, mostrar selección en su lugar
    if (!this.elegido()) return;
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
        width: CombateScene.ARENA_W, height: CombateScene.ARENA_H,
        backgroundColor: '#0f1a33',
        physics: { default: 'arcade', arcade: { gravity: { y: 0, x: 0 }, debug: false } },
        scene: [CombateScene],
      });

      this.game.events.once('ready', () => {
        const scene = this.game?.scene?.getScene('Combate') as any;
        const nivelIdLocal = nivelId;
        // Arrancar pausado: el estudiante decide cuando empieza
        this.game?.pause();
        if (scene && nivelIdLocal) {
          scene.evaluacionMode = this.esEvaluacion();
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
    // Pool contextualizado: mejoras para arma a distancia o cuerpo a cuerpo según guardián
    const modoAtaque = (scene?.attackMode ?? this.guardianActual()?.ataque ?? 'rango') as 'rango' | 'haz';
    const disponibles = [...mejoresPara(modoAtaque), ...MEJORAS_EXTRA].filter((m) => rango(m.id) < m.maxRango);
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
    // Precisión real: aciertos / preguntas respondidas del chequeo académico
    let precision = 100;
    try {
      const { data: rs } = await sb.from('guardianes_respuesta').select('es_correcta').eq('intento_id', this.intentoId);
      const total = rs?.length ?? 0;
      const aciertos = (rs ?? []).filter((r: any) => r.es_correcta).length;
      if (total > 0) precision = Math.round((aciertos / total) * 100);
    } catch { /* sin respuestas: precisión por defecto */ }
    try {
      const { data } = await sb.rpc('guardianes_finalizar_intento', {
        p_intento_id: this.intentoId,
        p_resultado: victoria ? 'victoria' : 'derrota',
        p_matados: matados,
        p_hordas: hordasActuales,
        p_tiempo: tiempoSeg,
        p_precision: precision,
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