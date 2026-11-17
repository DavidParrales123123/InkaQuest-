// @ts-nocheck
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import Phaser from 'phaser';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { RewardService } from '../../core/services/reward.service';
import { CombateScene, MEJORAS_EXTRA, mejoresPara } from './combate-scene';
import { GUARDIANES, NIVEL_DESBLOQUEO } from './guardians-catalog';

interface ItemMochila {
  tienda_item_id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  tipo: string;
}

/** Juego completo de supervivencia por hordas con mejoras entre hordas y progreso persistido. */
@Component({
  selector: 'app-guardians-jugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, NgClass],
  template: `
    <section class="relative min-h-[100dvh] w-full overflow-x-hidden">
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(242,165,65,0.08),transparent_60%)]"></div>
      @if (!elegido()) {
        <app-page-header
          [titulo]="'Guardianes — Elige tu guardián'"
          descripcion="Arma crítica, pasiva única: tu guardián define cómo peleas. Sin magias, sólo tijeras, acero y plomo."
          [acciones]="false">
        </app-page-header>
      }

      @if (!elegido()) {
        <!-- Volver al layout del estudiante -->
        <a routerLink="/estudiante/guardianes" class="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border border-gold-500/40 bg-marine-900/80 px-3 py-2 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gold-300 backdrop-blur-sm transition-all duration-150 hover:border-gold-400 hover:text-white hover:shadow-[0_0_20px_-6px_rgba(242,165,65,0.45)] sm:right-4 sm:top-4" aria-label="Volver a la campaña">
          <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Volver a la campaña
        </a>
        <!-- ═══ SELECCIÓN DE GUARDIÁN ═══ -->
        <div class="rounded-2xl border-2 border-gold-500/60 bg-gradient-to-br from-marine-900 via-marine-800 to-marine-900 p-4 shadow-[0_0_60px_-15px_rgba(242,165,65,0.45)]">
          <div class="mb-4 text-center">
            <span class="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-gold-400">Guardianes del Conocimiento · Roster</span>
            <h2 class="mt-3 font-display text-3xl font-extrabold leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">¿QUIÉN PROTEGE<br/><span class="text-gold-400">LA LECCIÓN?</span></h2>
            <p class="mt-2 text-sm text-marine-300">Cada guardián pelea distinto: sus estadísticas y su pasiva definen tu estilo.</p>
            <p class="mt-2 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-marine-400">Nivel 1: <span class="text-gold-400">Rambo y Maga</span> · Nivel 7: <span class="text-brand-300">Sasuke</span> · Nivel 15: <span class="text-rose-300">La Herencia</span></p>
          </div>
          <div class="grid gap-4 grid-cols-2 xl:grid-cols-4 max-w-5xl mx-auto">
            @for (g of guardianesVista(); track g.id) {
              <button type="button" class="group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200"
                [ngClass]="g.desbloqueado
                  ? 'border-surface-200 bg-gradient-to-b from-marine-800 to-marine-900 hover:-translate-y-2 hover:border-gold-400 hover:shadow-[0_0_30px_-8px_rgba(242,165,65,0.5)] cursor-pointer'
                  : 'border-white/5 bg-marine-950/60 cursor-not-allowed'"
                [disabled]="!g.desbloqueado"
                [attr.aria-disabled]="!g.desbloqueado ? 'true' : null"
                (click)="elegirGuardian(g.id)">
                <div class="relative grid h-36 w-full place-items-center overflow-hidden rounded-xl border" [ngClass]="g.desbloqueado ? 'border-gold-500/20 bg-black/40' : 'border-white/5 bg-black/60'">
                  <img [src]="g.sprite" [alt]="g.nombre" class="max-h-[8.5rem] max-w-full object-contain transition-all duration-200" [ngClass]="g.desbloqueado ? 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] group-hover:scale-110' : 'grayscale opacity-45'" />
                  @if (g.id === ultimoUsado() && g.desbloqueado) {
                    <span class="absolute left-2 top-2 rounded-full border border-gold-400/70 bg-gold-500 px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-widest text-marine-900 shadow-[0_2px_6px_rgba(0,0,0,0.45)]">Último</span>
                  }
                  @if (!g.desbloqueado) {
                    <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45">
                      <svg viewBox="0 0 24 24" class="size-6 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                      <p class="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">Nivel {{ nivelRequerido(g.id) }}</p>
                      <p class="text-[0.55rem] font-bold uppercase tracking-wider text-marine-300">Se desbloquea</p>
                    </div>
                  }
                  <span class="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest" [class.bg-gold-500]="g.rareza === 'comun'" [class.text-marine-900]="g.rareza === 'comun'" [class.bg-brand-500]="g.rareza === 'heroe'" [class.text-white]="g.rareza === 'heroe'" [class.bg-rose-500]="g.rareza === 'leyenda'" [class.text-white]="g.rareza === 'leyenda'">{{ g.rareza === 'comun' ? 'Común' : g.rareza === 'heroe' ? 'Héroe' : 'Leyenda' }}</span>
                </div>
                <div [class.opacity-55]="!g.desbloqueado">
                  <p class="font-display text-base font-extrabold leading-none text-white">{{ g.nombre }}</p>
                  <p class="text-[0.65rem] font-bold uppercase tracking-widest text-gold-400">{{ g.titulo }}</p>
                </div>
                <p class="text-[0.68rem] leading-snug text-marine-300" [class.opacity-60]="!g.desbloqueado">{{ g.descripcion }}</p>
                <span class="inline-flex w-fit items-center gap-1 rounded-full border border-marine-600 bg-marine-900/60 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-widest" [class.text-brand-300]="g.ataque === 'rango'" [class.text-rose-300]="g.ataque === 'haz'" [class.opacity-60]="!g.desbloqueado">{{ g.ataque === 'rango' ? '◎ Rango · Gatillo' : '× Haz · Cuerpo a cuerpo' }}</span>
                <div class="grid w-full grid-cols-3 overflow-hidden rounded-lg border border-white/10 text-[0.62rem] font-extrabold uppercase tracking-wider" [class.opacity-60]="!g.desbloqueado">
                  <span class="flex items-center justify-center gap-1.5 border-r border-white/10 bg-white/[0.04] px-1 py-1 text-rose-300">DMG <b class="tabular-nums text-white">{{ g.danoBase }}</b></span>
                  <span class="flex items-center justify-center gap-1.5 border-r border-white/10 bg-white/[0.04] px-1 py-1 text-emerald-300">VID <b class="tabular-nums text-white">{{ 100 + g.vidaExtra }}</b></span>
                  <span class="flex items-center justify-center gap-1.5 bg-white/[0.04] px-1 py-1 text-sky-300">VEL <b class="tabular-nums text-white">{{ 240 + g.velocidadExtra }}</b></span>
                </div>
                <p class="text-[0.68rem] font-bold text-gold-300" [class.opacity-60]="!g.desbloqueado">{{ g.pasivaNombre }}</p>
                <p class="text-[0.62rem] leading-snug text-marine-200" [class.opacity-60]="!g.desbloqueado">{{ g.pasivaDescripcion }}</p>
              </button>
            }
          </div>
        </div>
      } @else {

        <!-- ─── Fullscreen immersive game shell ─── -->
        <div class="fixed inset-0 z-[40] flex h-screen flex-col bg-marine-950 overflow-hidden">
          <!-- Top ribbon + HUD -->
          <header class="shrink-0 border-b border-gold-500/25 bg-marine-950/95 backdrop-blur">
            <div class="flex h-12 items-center justify-between gap-3 px-2 sm:px-4">
              <div class="flex min-w-0 items-center gap-2.5">
                <span class="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 text-sm font-black text-marine-900 shadow-[0_2px_0_#5c3a07]">{{ numero() }}</span>
                <div class="leading-none">
                  <p class="text-[0.52rem] font-extrabold uppercase tracking-[0.22em] text-gold-500">Nivel {{ numero() }} · Guardianes</p>
                  <p class="mt-1 flex items-center gap-1.5 text-[0.78rem] font-extrabold text-white">Horda {{ hordaActual() }}<span class="text-marine-500">/ 9</span>
                    @if (esEvaluacion()) { <span class="rounded-sm bg-rose-500/20 px-1 py-[1px] text-[0.52rem] font-extrabold uppercase tracking-widest text-rose-300">Jefe</span> }
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
            </div>
            <!-- Pods: vida · XP · poder · enemigos · tiempo -->
            <div class="grid grid-cols-2 gap-1.5 border-t border-white/5 bg-black/35 px-2 py-1.5 sm:grid-cols-4 sm:px-3 md:grid-cols-5 md:px-4" role="status" aria-label="Estado de la partida">
              <!-- Vida -->
              <div class="flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-rose-900/50 bg-rose-950/25 px-2" title="Vida">
                <svg viewBox="0 0 24 24" class="size-3.5 shrink-0 fill-rose-400" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.5C.5 7.5 4 4 8 4c2.4 0 3.3 1.4 4 2.4C12.7 5.4 13.6 4 16 4c4 0 7.5 3.5 6 7.5C19.5 16.2 12 21 12 21z"/></svg>
                <span class="whitespace-nowrap text-[0.72rem] font-extrabold tabular-nums text-rose-100">{{ salud() }}<span class="text-rose-400/70">/{{ saludMax() }}</span></span>
                <div class="h-1.5 w-full min-w-8 max-w-28 flex-1 overflow-hidden rounded-full bg-rose-950"><div class="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-200" [style.width.%]="saludPct()"></div></div>
              </div>
              <!-- XP -->
              <div class="flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-gold-900/50 bg-gold-950/25 px-2" title="Experiencia ganada">
                <svg viewBox="0 0 24 24" class="size-3.5 shrink-0 fill-gold-400" aria-hidden="true"><path d="M12 2l2.6 5.6L21 9.5l-4.5 4.3 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.5l6.4-1.9L12 2z"/></svg>
                <span class="whitespace-nowrap text-[0.72rem] font-extrabold tabular-nums text-gold-200">+{{ xp() }}</span>
                <div class="h-1.5 w-full min-w-6 max-w-24 flex-1 overflow-hidden rounded-full bg-gold-950"><div class="h-full rounded-full bg-gradient-to-r from-amber-500 to-gold-300 transition-all duration-200" [style.width.%]="xpPct()"></div></div>
              </div>
              <!-- Poder -->
              <div class="hidden h-7 min-w-0 items-stretch justify-center overflow-hidden rounded-lg border border-white/10 md:flex" aria-label="Poder del guardián">
                <span class="flex min-w-0 flex-1 items-center justify-center gap-1 border-r border-white/10 bg-rose-950/25 px-1 text-[0.58rem] font-extrabold uppercase tracking-wider text-rose-300 lg:text-[0.6rem]">ATK <b class="tabular-nums text-white">{{ guardianActual()?.danoBase ?? 0 }}</b></span>
                <span class="flex min-w-0 flex-1 items-center justify-center gap-1 border-r border-white/10 bg-emerald-950/25 px-1 text-[0.58rem] font-extrabold uppercase tracking-wider text-emerald-300 lg:text-[0.6rem]">VID <b class="tabular-nums text-white">{{ saludMax() }}</b></span>
                <span class="flex min-w-0 flex-1 items-center justify-center gap-1 bg-sky-950/25 px-1 text-[0.58rem] font-extrabold uppercase tracking-wider text-sky-300 lg:text-[0.6rem]">VEL <b class="tabular-nums text-white">{{ 240 + (guardianActual()?.velocidadExtra ?? 0) }}</b></span>
              </div>
              <!-- Enemigos -->
              <div class="flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-brand-800/60 bg-brand-900/25 px-2" title="Enemigos vivos">
                <svg viewBox="0 0 24 24" class="size-3.5 shrink-0 text-brand-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
                <span class="text-[0.72rem] font-extrabold tabular-nums text-brand-200">{{ enemigosVivos() }}</span>
                <span class="hidden text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-brand-400/70 xl:inline">Ene</span>
              </div>
              <!-- Tiempo -->
              <div class="flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-sky-900/50 bg-sky-950/25 px-2" title="Tiempo de partida">
                <svg viewBox="0 0 24 24" class="size-3.5 shrink-0 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span class="text-[0.72rem] font-extrabold tabular-nums text-sky-200">{{ tiempoFormateado() }}</span>
              </div>
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
              <div class="grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 text-center" aria-label="Poder del guardián">
                <div class="border-r border-white/10 bg-white/[0.04] py-1.5">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-rose-300">ATK</p>
                  <p class="mt-0.5 font-display text-lg font-extrabold tabular-nums text-white">{{ guardianActual()?.danoBase ?? 0 }}</p>
                </div>
                <div class="border-r border-white/10 bg-white/[0.04] py-1.5">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-emerald-300">VID</p>
                  <p class="mt-0.5 font-display text-lg font-extrabold tabular-nums text-white">{{ saludMax() }}</p>
                </div>
                <div class="bg-white/[0.04] py-1.5">
                  <p class="text-[0.55rem] font-extrabold uppercase tracking-widest text-sky-300">VEL</p>
                  <p class="mt-0.5 font-display text-lg font-extrabold tabular-nums text-white">{{ 240 + (guardianActual()?.velocidadExtra ?? 0) }}</p>
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
              <div id="juego-root" class="relative flex flex-1 min-h-0 w-full touch-none select-none items-center justify-center overflow-hidden bg-marine-900 [&_canvas]:max-h-full [&_canvas]:max-w-full" aria-label="Área de juego. Combate top-down.">
                <!-- Joystick táctil (mitad izquierda, solo táctil y en partida) -->
                @if (esTouch() && fase() === 'jugando') {
                  <div class="absolute inset-y-0 left-0 z-20 w-[58%] touch-none select-none"
                       (pointerdown)="zonaPointerDown($event)"
                       (pointermove)="zonaPointerMove($event)"
                       (pointerup)="zonaPointerUp($event)"
                       (pointercancel)="zonaPointerUp($event)"
                       role="application" aria-label="Joystick táctil para moverte"></div>
                }
                @if (esTouch() && joy().vis) {
                  <div class="pointer-events-none fixed z-30 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-400/60 bg-gold-400/10 backdrop-blur-[2px]"
                       [style.left.px]="joy().x" [style.top.px]="joy().y" aria-hidden="true">
                    <div class="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/80 bg-gradient-to-br from-gold-400 to-amber-600 shadow-[0_2px_0_#5c3a07]"
                         [style.transform]="'translate(calc(-50% + ' + joy().kx + 'px), calc(-50% + ' + joy().ky + 'px))'"></div>
                  </div>
                }
                <!-- Aviso sutil en vertical (no bloquea el juego) -->
                @if (esTouch() && esRetrato()) {
                  <div class="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full border border-gold-500/40 bg-black/70 px-3 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-gold-300 backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="20" rx="2"/><path d="M12 6v2"/></svg>
                    Gira el dispositivo
                  </div>
                }
                <!-- Píldora de ayuda táctil -->
                @if (esTouch() && fase() === 'jugando') {
                  <div class="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.18em] text-marine-200 backdrop-blur-sm">
                    <span class="size-1.5 rounded-full bg-gold-400"></span>Joystick para moverte · disparo automático
                  </div>
                }
                <!-- Mochila: botón flotante con los consumibles del inventario -->
                @if (fase() === 'jugando' && itemsMochila().length > 0) {
                  <button type="button" class="absolute right-2 top-14 z-20 flex items-center gap-2 rounded-xl border border-gold-500/40 bg-marine-900/85 px-3 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-gold-300 shadow-sm backdrop-blur-sm" (click)="mochilaAbierta.update((v) => !v)" aria-label="Abrir mochila">
                    🎒 Mochila
                    <span class="rounded-full bg-gold-500 px-2 py-0.5 text-[0.62rem] font-extrabold text-marine-900">{{ itemsMochila().reduce((a, b) => a + b.cantidad, 0) }}</span>
                  </button>
                  @if (mochilaAbierta()) {
                    <div class="absolute right-2 top-[6.5rem] z-30 w-80 space-y-1.5 rounded-2xl border border-gold-400/50 bg-marine-900/95 p-3 shadow-xl">
                      <p class="px-1 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-gold-400">Mochila</p>
                      @for (i of itemsMochila(); track i.tienda_item_id) {
                        <div class="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-2.5 py-2">
                          <div class="min-w-0">
                            <p class="text-xs font-bold text-white">{{ i.nombre }} <span class="text-gold-400">×{{ i.cantidad }}</span></p>
                            <p class="text-[0.6rem] leading-snug text-marine-300">{{ i.descripcion }}</p>
                          </div>
                          @if (i.codigo === 'bomba_total' || i.codigo === 'congelar_tiempo') {
                            <button type="button" class="btn btn-gold btn-xs shrink-0" (click)="i.codigo === 'bomba_total' ? usarBombaTotal() : usarCongelarTiempo()">Usar</button>
                          } @else if (i.codigo === 'pista' || i.codigo === 'cincuenta_cincuenta' || i.codigo === 'segunda_oportunidad') {
                            <span class="shrink-0 text-[0.55rem] font-bold uppercase tracking-widest text-marine-400">En chequeo</span>
                          } @else if (i.codigo === 'vida_extra') {
                            <span class="shrink-0 text-[0.55rem] font-bold uppercase tracking-widest text-marine-400">Al morir</span>
                          }
                        </div>
                      } @empty {
                        <p class="px-1 text-xs text-marine-400">Vacía. Compra con tus monedas en la tienda.</p>
                      }
                    </div>
                  }
                }
                <!-- Overlay de bienvenida con controles (sólo al inicio) -->
                @if (mostrarIntro()) {
                  <div class="absolute inset-0 z-20 flex items-center justify-center bg-marine-900/80 p-4 backdrop-blur-sm">
                    <div class="max-w-md w-full space-y-4 rounded-2xl border border-gold-400/60 bg-gradient-to-br from-marine-800 via-marine-900 to-black p-5 text-center text-white shadow-[0_0_60px_-10px_rgba(242,165,65,0.6)]">
                      <span class="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">Guardianes · Roster</span>
                      <h3 class="font-display text-2xl font-extrabold text-white leading-none">Protege la lección<br/><span class="text-gold-400">sobreviviendo las hordas</span></h3>
                      <ul class="space-y-1.5 rounded-xl border border-gold-500/20 bg-black/30 p-2 text-left text-xs text-marine-100">
                        @if (esTouch()) {
                          <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-gold-500/50 bg-gold-500/10 text-[0.6rem] font-extrabold text-gold-400">◉</span><span><strong>Joystick izquierdo</strong> — arrastra para moverte</span></li>
                          <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-brand-500/50 bg-brand-500/10 text-[0.6rem] font-extrabold text-brand-400">◎</span><span><strong>Disparo automático</strong> — apunta solo al enemigo más cercano</span></li>
                        } @else {
                          <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-gold-500/50 bg-gold-500/10 text-[0.6rem] font-extrabold text-gold-400">W</span><span><strong>WASD / Flechas</strong> — muévete</span></li>
                          <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-brand-500/50 bg-brand-500/10 text-[0.6rem] font-extrabold text-brand-400">◎</span><span><strong>Mouse</strong> — apunta con el cursor</span></li>
                        }
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-rose-500/50 bg-rose-500/10 text-[0.6rem] font-extrabold text-rose-400">♥</span><span><strong>Al limpiar una horda</strong> tu vida se restaura al máximo</span></li>
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-rose-500/50 bg-rose-500/10 text-[0.6rem] font-extrabold text-rose-400">×</span><span><strong>Elimina hordas</strong> y elige una mejora</span></li>
                        <li class="flex items-center gap-2"><span class="grid size-5 shrink-0 place-items-center rounded border border-sky-500/50 bg-sky-500/10 text-[0.6rem] font-extrabold text-sky-400">★</span><span><strong>Responde</strong> la pregunta y gana +15 XP</span></li>
                      </ul>
                      @if (juegoListo()) {
                        <button type="button" class="btn btn-gold w-full justify-center !py-3 text-base !font-extrabold" (click)="comenzarPartida()">¡Entendido, jugar!</button>
                      } @else {
                        <div class="flex w-full items-center justify-center gap-3 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm font-bold text-gold-300" role="status" aria-live="polite">
                          <span class="size-4 animate-spin rounded-full border-2 border-gold-400/30 border-t-gold-400"></span>
                          Cargando la arena…
                        </div>
                      }
                    </div>
                  </div>
                }
                <!-- Overlay: Caíste en combate — Vida Extra -->
                @if (muertoEntra() && fase() === 'jugando') {
                  <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 text-center backdrop-blur-sm">
                    <div class="w-full max-w-sm space-y-4 rounded-2xl border-2 border-rose-500/60 bg-marine-950 p-6 text-white shadow-[0_0_60px_-15px_rgba(244,63,94,0.4)]">
                      <svg viewBox="0 0 24 24" class="mx-auto size-12 text-rose-400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="10" width="18" height="10" rx="2"/><path d="M12 14v-4M10 11.5h4"/><circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none"/></svg>
                      <h2 class="text-2xl font-extrabold leading-tight text-rose-300">¡Caíste en combate!</h2>
                      <p class="text-sm leading-snug text-marine-200">Puedes levantarte justo aquí. Tu Vida Extra te revive con la salud máxima, donde estabas, conservando la horda y tus mejoras.</p>
                      @if (contarItem('vida_extra') > 0) {
                        <p class="text-xs font-bold uppercase tracking-widest text-gold-400">{{ contarItem('vida_extra') }} Vida Extra disponible</p>
                        <button type="button" class="btn btn-gold w-full justify-center" (click)="usarVidaExtra()">🔋 Usar Vida Extra</button>
                      } @else {
                        <p class="text-xs text-marine-400">No tienes Vida Extra. Compra una en la tienda por 200 monedas y úsala aquí la próxima vez.</p>
                      }
                      <button type="button" class="btn btn-outline-light w-full justify-center" (click)="aceptarMuerte()">Aceptar derrota</button>
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
                  <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
                    <div class="w-full max-w-xl space-y-3 rounded-2xl border-2 border-gold-500/50 bg-gradient-to-br from-marine-900 via-marine-950 to-black p-5 text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <span class="inline-flex items-center gap-1.5 rounded-full border border-gold-500/50 bg-gold-500/15 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-gold-300">
                            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 10v5c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5"/></svg>
                            Chequeo académico · Horda {{ hordaActual() }}
                          </span>
                          <h3 class="mt-2 text-lg font-extrabold leading-snug tracking-tight text-white">{{ p.enunciado }}</h3>
                          @if (p.tema) { <p class="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-marine-300">{{ p.tema }} · {{ p.dificultad }}</p> }
                          @if (mejoraEnJuego()) { <p class="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-gold-300"><svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>Tu mejora está en juego: acierta para conservarla</p> }
                        </div>
                        @if (!respuestaResultado()) { <button type="button" class="shrink-0 text-[0.62rem] font-bold uppercase tracking-widest text-marine-300 underline underline-offset-2 transition-colors hover:text-white" (click)="omitirChequeo()">{{ mejoraEnJuego() ? 'Omitir (pierdes la mejora)' : 'Omitir' }}</button> }
                      </div>
                      <!-- Acciones con ítems de la mochila (solo en este chequeo) -->
                      @if (!respuestaResultado()) {
                        <div class="flex flex-wrap items-center gap-2">
                          @if (tieneItem('pista') && !pistaActual()) {
                            <button type="button" class="rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-widest text-gold-300 transition-colors hover:border-gold-400 hover:text-white" (click)="usarPistaPregunta()">💡 Pista ({{ contarItem('pista') }})</button>
                          }
                          @if (tieneItem('cincuenta_cincuenta') && eliminadas().length === 0) {
                            <button type="button" class="rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-widest text-gold-300 transition-colors hover:border-gold-400 hover:text-white" (click)="usarCincuentaYCincuenta()">✂️ 50/50 ({{ contarItem('cincuenta_cincuenta') }})</button>
                          }
                        </div>
                      }
                      @if (pistaActual(); as pista) {
                        <p class="rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-xs leading-snug text-sky-200">💡 Pista: <strong>{{ pista }}</strong></p>
                      }
                      <div class="grid gap-2">
                        @for (op of p.opciones; track op; let i = $index) {
                          <button type="button" [ngClass]="claseOpcion(op)" [disabled]="esOpcionEliminada(op)" (click)="elegirOpcion(op)">
                            <span class="mr-2 inline-grid size-6 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-[0.7rem] font-extrabold text-gold-300">{{ ['A','B','C','D'][i] }}</span>
                            {{ op }}
                          </button>
                        }
                      </div>
                      @if (respuestaResultado(); as r) {
                        <div class="rounded-xl border p-3 text-sm" [ngClass]="r.esCorrecta ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-rose-400/40 bg-rose-400/10'">
                          <p class="font-extrabold" [ngClass]="r.esCorrecta ? 'text-emerald-300' : 'text-rose-300'">{{ r.esCorrecta ? '¡Correcto! +' + r.xp + ' XP · +' + r.monedas + ' monedas' : 'Respuesta incorrecta' }}</p>
                          @if (mejoraEnJuego()) { <p class="mt-1 font-bold" [ngClass]="(r.esCorrecta || r.error) ? 'text-gold-300' : 'text-rose-300'">{{ r.error ? 'Error al calificar: conservas tu mejora.' : (r.esCorrecta ? '¡Conservas la mejora que elegiste!' : 'Perdiste la mejora que elegiste.') }}</p> }
                          @if (!r.esCorrecta && r.correcta) { <p class="mt-1 text-marine-100">Respuesta correcta: <strong class="text-emerald-300">{{ r.correcta }}</strong></p> }
                          @if (r.explicacion) { <p class="mt-1 text-[0.8rem] leading-snug text-marine-200">{{ r.explicacion }}</p> }
                          @if (!r.esCorrecta && tieneItem('segunda_oportunidad')) {
                            <button type="button" class="btn btn-outline-light btn-sm mt-2 w-full justify-center" (click)="usarSegundaOportunidad()">🔁 Segunda Oportunidad ({{ contarItem('segunda_oportunidad') }})</button>
                          }
                        </div>
                        <button type="button" class="btn btn-gold w-full justify-center" (click)="continuarTrasChequeo()">{{ (r.esCorrecta || r.error) ? 'Continuar con tu mejora →' : 'Continuar sin la mejora →' }}</button>
                      } @else {
                        <button type="button" class="btn btn-gold w-full justify-center text-marine-900 disabled:opacity-40" [disabled]="!respuestaElegida()" (click)="confirmarRespuesta()">Comprobar respuesta</button>
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
                        @if (numero() < 18) {
                          <button type="button" class="btn btn-gold mt-4 inline-flex w-full justify-center gap-2" (click)="irSiguienteNivel()">
                            Siguiente nivel
                            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                          </button>
                        }
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
            </div>
          </main>
        </div>
      }
    </section>
  `,
})
export class GuardiansJugarComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly rewards = inject(RewardService);

  /** Consumibles del inventario del jugador (mochila). */
  protected readonly itemsMochila = signal<ItemMochila[]>([]);
  protected readonly mochilaAbierta = signal(false);
  /** Overlay "caíste en combate": decide usar Vida Extra o aceptar derrota. */
  protected readonly muertoEntra = signal(false);
  /** Pista de la pregunta de chequeo actual. */
  protected readonly pistaActual = signal<string | null>(null);
  /** Opciones incorrectas eliminadas con el ítem 50/50. */
  protected readonly eliminadas = signal<string[]>([]);

  /** Dispositivo táctil real (pointer coarse / maxTouchPoints>0). */
  protected readonly esTouch = signal(false);
  /** Retrato + táctil: sugerir girar el dispositivo (sin bloquear el juego). */
  protected readonly esRetrato = signal(false);
  /** Estado del joystick virtual: visibilidad + base + offset del knob. */
  protected readonly joy = signal({ vis: false, x: 0, y: 0, kx: 0, ky: 0 });
  private joyId: number | null = null;
  private readonly joyBase = { x: 0, y: 0 };
  private readonly joyVec = { x: 0, y: 0 };

  private detectarTouch(): void {
    try {
      const mm = (q: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
      const tactil = mm('(pointer: coarse)') || mm('(any-pointer: coarse)') || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
      this.esTouch.set(tactil);
      this.esRetrato.set(tactil && mm('(orientation: portrait)'));
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mql = window.matchMedia('(orientation: portrait)');
        mql.addEventListener?.('change', () => this.esRetrato.set(this.esTouch() && mql.matches));
      }
    } catch { /* ignore */ }
  }

  /** Pointer down en la mitad izquierda: crea el joystick en ese punto. */
  protected zonaPointerDown(ev: PointerEvent): void {
    if (this.joyId !== null) return;
    const el = ev.currentTarget as HTMLElement;
    el.setPointerCapture?.(ev.pointerId);
    this.joyId = ev.pointerId;
    this.joyBase.x = ev.clientX;
    this.joyBase.y = ev.clientY;
    this.joyVec.x = 0;
    this.joyVec.y = 0;
    this.joy.set({ vis: true, x: this.joyBase.x, y: this.joyBase.y, kx: 0, ky: 0 });
    this.empujarMovimiento();
  }

  protected zonaPointerMove(ev: PointerEvent): void {
    if (ev.pointerId !== this.joyId) return;
    const dx = ev.clientX - this.joyBase.x;
    const dy = ev.clientY - this.joyBase.y;
    const len = Math.hypot(dx, dy);
    const max = 56;
    if (len > max) {
      this.joyVec.x = dx / len;
      this.joyVec.y = dy / len;
    } else {
      this.joyVec.x = dx / max;
      this.joyVec.y = dy / max;
    }
    this.joy.set({ vis: true, x: this.joyBase.x, y: this.joyBase.y, kx: this.joyVec.x * max, ky: this.joyVec.y * max });
    this.empujarMovimiento();
  }

  protected zonaPointerUp(ev: PointerEvent): void {
    if (ev.pointerId !== this.joyId) return;
    this.joyId = null;
    this.joyVec.x = 0;
    this.joyVec.y = 0;
    this.joy.set({ vis: false, x: 0, y: 0, kx: 0, ky: 0 });
    this.empujarMovimiento();
  }

  /** Pasa el vector analógico del joystick (-1..1) al motor del juego. */
  private empujarMovimiento(): void {
    const scene = this.game?.scene?.getScene('Combate') as any;
    if (scene?.virtualMove) {
      scene.virtualMove.x = this.joyVec.x;
      scene.virtualMove.y = this.joyVec.y;
    }
  }

  /** Esc: en la elección vuelve a la campaña; en partida pausa/reanuda. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.elegido()) {
      if (this.enPausa()) { this.reanudar(); return; }
      if (this.fase() === 'jugando') { this.pausar(); }
      return;
    }
    void this.router.navigate(['/estudiante/guardianes']);
  }

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
  protected readonly ultimoUsado = signal<string | null>(null);
  /** true mientras la mejora elegida está "en el aire" esperando el chequeo. */
  protected readonly mejoraEnJuego = signal(false);
  /** Mejora elegida por el estudiante, aún NO aplicada al motor (el chequeo decide). */
  private mejoraPendiente: { id: string; nombre: string } | null = null;
  protected readonly candidatosMejora = signal<readonly { id: string; nombre: string; descripcion: string; rareza: string; rango: number; maxRango: number }[]>([]);
  protected readonly mostrarIntro = signal(true);
  /** true cuando Phaser disparó 'ready' — el juego está listo para reanudar. */
  protected readonly juegoListo = signal(false);
  protected readonly elegido = signal<string | null>(null);
  protected readonly guardianActual = computed(() => GUARDIANES.find((g) => g.id === this.elegido()) ?? null);
  /** Nivel máximo que el estudiante puede jugar según su progreso (bloqueo progresivo). */
  protected readonly nivelMaximoAlcanzado = signal(1);
  /** Roster con estado de bloqueo aplicado: Rambo/Maga N1 · Sasuke N7 · La Herencia N15. */
  protected readonly guardianesVista = computed(() =>
    GUARDIANES.map((g) => ({ ...g, desbloqueado: this.nivelMaximoAlcanzado() >= (NIVEL_DESBLOQUEO[g.id] ?? 1) }))
  );
  protected readonly preguntaActual = signal<{ preguntaId: string; enunciado: string; opciones: string[]; tema: string; dificultad: string } | null>(null);
  protected readonly respuestaElegida = signal<string | null>(null);
  protected readonly respuestaResultado = signal<{ esCorrecta: boolean; error?: boolean; correcta?: string; explicacion?: string; xp: number; monedas: number } | null>(null);
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
  private subsNivel: { unsubscribe(): void } | null = null;
  private hudTimer: any;
  private arrancarseMs = 0;
  private intentoId: string | null = null;

  ngOnInit(): void {
    void this.cargarMochila();
    // Carga el nivel de la URL (primera vez)
    this.inicializarNivel(Number(this.route.snapshot.paramMap.get('numero')) || 1);
    // Angular REUTILIZA este mismo componente al navegar de /nivel/1 a /nivel/2
    // (misma ruta): ngOnInit no vuelve a dispararse, así que escuchamos los
    // cambios del parámetro para re-inicializar el nuevo nivel en el sitio.
    this.subsNivel = this.route.paramMap.subscribe((p) => {
      const n = Number(p.get('numero')) || 1;
      if (n !== this.numero()) this.inicializarNivel(n);
    });
  }

  /** Arranca (o reinicia) el combate para el nivel indicado. */
  private inicializarNivel(n: number): void {
    if (this.hudTimer) clearInterval(this.hudTimer);
    if (this.game) { this.game.destroy(true); this.game = null; }
    this.numero.set(n);
    this.esEvaluacion.set([6, 12, 18].includes(n));
    this.detectarTouch();
    // No auto-elegir: el jugador siempre pasa por el roster y elige su guardián.
    // Guardamos el último elegido solo para mostrar la insignia "Último".
    try {
      const prev = typeof localStorage !== 'undefined' ? localStorage.getItem('guardianes-personaje') : null;
      if (prev) this.ultimoUsado.set(prev);
    } catch { /* ignore */ }
    // Estado limpio para el combate
    this.salud.set(100);
    this.saludMax.set(100);
    this.xp.set(0);
    this.enemigosVivos.set(0);
    this.tiempo.set(0);
    this.hordaActual.set(1);
    this.fase.set('intro');
    this.xpGanado.set(0);
    this.monedasGanadas.set(0);
    this.mensajeResultado.set('');
    this.intentoId = null;
    this.elegirMejora.set(false);
    this.preguntaActual.set(null);
    this.respuestaElegida.set(null);
    this.respuestaResultado.set(null);
    this.preguntaExcluidas = [];
    this.mostrarIntro.set(true);
    this.juegoListo.set(false);
    this.pistaActual.set(null);
    this.eliminadas.set([]);
    this.muertoEntra.set(false);
    void this.cargarMochila();
    void this.cargarProgresoRoster();
    queueMicrotask(() => this.arrancar());
  }

  /** Calcula hasta qué nivel puede jugar el estudiante (misma regla que campaña). */
  private async cargarProgresoRoster(): Promise<void> {
    try {
      const user = this.auth.usuario();
      if (!user) return;
      const supabase = this.supabase.client;
      const { data: campana } = await supabase.from('guardianes_campana').select('id').limit(1).maybeSingle();
      const [{ data: progreso }, { data: nivelesDb }] = await Promise.all([
        supabase.from('progreso_leccion').select('leccion_id,estado').eq('estudiante_id', user.id),
        supabase
          .from('guardianes_nivel')
          .select('numero, leccion_id')
          .eq('campana_id', campana?.id ?? '')
          .order('numero'),
      ]);
      const completadas = new Set(
        (progreso ?? []).filter((r: any) => r.estado === 'completado').map((r: any) => r.leccion_id),
      );
      let max = 1;
      for (const n of nivelesDb ?? []) {
        if (!completadas.has((n as any).leccion_id)) break;
        max = (n as any).numero + 1;
      }
      this.nivelMaximoAlcanzado.set(Math.min(max, 18));
    } catch (e) {
      console.warn('[guardianes] progreso roster:', e);
    }
  }

  protected nivelRequerido(id: string): number {
    return NIVEL_DESBLOQUEO[id] ?? 1;
  }

  protected elegirGuardian(id: string): void {
    // Bloqueo defensivo: no se puede elegir un guardián aún bloqueado
    if (this.nivelMaximoAlcanzado() < (NIVEL_DESBLOQUEO[id] ?? 1)) return;
    if (id === '__cancel__') {
      // Cambiar de guardián: destruir partida y volver al roster
      if (this.game) { this.game.destroy(true); this.game = null; }
      if (this.hudTimer) clearInterval(this.hudTimer);
      this.elegido.set(null);
      this.ultimoUsado.set(null);
      this.fase.set('intro');
      try { localStorage.removeItem('guardianes-personaje'); } catch { /* ignore */ }
      return;
    }
    try { localStorage.setItem('guardianes-personaje', id); } catch { /* ignore */ }
    if (this.game) { this.game.destroy(true); this.game = null; }
    if (this.hudTimer) clearInterval(this.hudTimer);
    this.elegido.set(id);
    this.mostrarIntro.set(true);
    this.juegoListo.set(false);
    this.fase.set('intro');
    queueMicrotask(() => this.arrancar());
  }

  /** Recoge el inventario actual del jugador (la mochila se hidrata aquí). */
  private async cargarMochila(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.itemsMochila.set([]); return; }
    try {
      const inv = await this.rewards.listarInventario(user.id).catch(() => [] as any[]);
      this.itemsMochila.set(
        ((inv ?? []) as any[])
          .map((r: any) => {
            const item = r?.item ?? r?.tienda_item ?? {};
            return {
              tienda_item_id: String(r?.tienda_item_id ?? ''),
              codigo: String(item?.codigo ?? ''),
              nombre: String(item?.nombre ?? 'Ítem'),
              descripcion: String(item?.descripcion ?? ''),
              cantidad: Number(r?.cantidad ?? 0),
              tipo: String(item?.tipo ?? 'item'),
            };
          })
          .filter((x) => x.cantidad > 0),
      );
    } catch {
      this.itemsMochila.set([]);
    }
  }

  protected contarItem(codigo: string): number {
    return this.itemsMochila().filter((i) => i.codigo === codigo).reduce((a, b) => a + b.cantidad, 0);
  }

  protected tieneItem(codigo: string): boolean { return this.contarItem(codigo) > 0; }

  /** Consume 1 unidad de un ítem del inventario (vía RPC transaccional). */
  private async consumirItemCodigo(codigo: string): Promise<{ ok: boolean; mensaje: string }> {
    const fila = this.itemsMochila().find((i) => i.codigo === codigo && i.cantidad > 0);
    if (!fila) return { ok: false, mensaje: 'No tienes este ítem.' };
    const ok = await this.rewards.consumirItem(fila.tienda_item_id);
    await this.cargarMochila();
    return ok;
  }

  /** Bomba Total: elimina a todos los enemigos en pantalla. */
  protected async usarBombaTotal(): Promise<void> {
    const ok = await this.consumirItemCodigo('bomba_total');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    (this.game?.scene?.getScene('Combate') as any)?.usarBomba?.();
  }

  /** Congelar tiempo: clava a los enemigos 4 segundos. */
  protected async usarCongelarTiempo(): Promise<void> {
    const ok = await this.consumirItemCodigo('congelar_tiempo');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    (this.game?.scene?.getScene('Combate') as any)?.congelarEnemigos?.(4000);
  }

  /** Muerte con Vida Extra: el motor congela la partida y espera tu decisión. */
  protected manejarMuertePorVida(): void { this.muertoEntra.set(true); }

  protected async usarVidaExtra(): Promise<void> {
    const ok = await this.consumirItemCodigo('vida_extra');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    (this.game?.scene?.getScene('Combate') as any)?.reviveConVida?.();
    this.muertoEntra.set(false);
  }

  protected aceptarMuerte(): void {
    this.muertoEntra.set(false);
    (this.game?.scene?.getScene('Combate') as any)?.finalizarMuerte?.();
  }

  /** Pista de la pregunta (ítem: Pista). */
  protected async usarPistaPregunta(): Promise<void> {
    const p = this.preguntaActual();
    if (!p) return;
    const ok = await this.consumirItemCodigo('pista');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    const sb = this.supabase.client;
    const { data, error } = await sb.rpc('guardianes_pista_pregunta', { p_pregunta_id: p.preguntaId });
    this.pistaActual.set(error ? 'Sigue el algoritmo dominante del tema.' : String(data ?? 'Sigue el algoritmo dominante del tema.'));
  }

  /** 50/50: marca 2 opciones incorrectas (ítem: 50/50). */
  protected async usarCincuentaYCincuenta(): Promise<void> {
    const p = this.preguntaActual();
    if (!p) return;
    const ok = await this.consumirItemCodigo('cincuenta_cincuenta');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    const sb = this.supabase.client;
    const { data, error } = await sb.rpc('guardianes_eliminar_dos', { p_pregunta_id: p.preguntaId });
    const opciones = (data as { opciones?: unknown } | null)?.opciones;
    this.eliminadas.set(error ? [] : Array.isArray(opciones) ? opciones.map(String) : []);
  }

  /** Segunda oportunidad: te permite volver a responder la pregunta (ítem: Segunda oportunidad). */
  protected async usarSegundaOportunidad(): Promise<void> {
    const ok = await this.consumirItemCodigo('segunda_oportunidad');
    if (!ok.ok) { this.mensajeResultado.set(ok.mensaje); return; }
    this.respuestaResultado.set(null);
    this.respuestaElegida.set(null);
  }

  protected esOpcionEliminada(op: string): boolean { return this.eliminadas().includes(op); }

  ngOnDestroy(): void { this.subsNivel?.unsubscribe(); this.limpiar(); }

  protected comenzarPartida(): void {
    // El juego aún no está listo: no ocultamos el intro ni reanudamos un juego inexistente
    if (!this.juegoListo()) return;
    this.mostrarIntro.set(false);
    this.enPausa.set(false);
    this.game?.resume();
  }

  protected pausar(): void { this.enPausa.set(true); this.game?.pause(); }
  protected reanudar(): void { this.enPausa.set(false); this.game?.resume(); }

  protected irSiguienteNivel(): void {
    // Navegación directa (igual que reiniciar): el routerLink dinámico
    // resultaba inerte dentro de esta pantalla de victoria.
    const siguiente = Math.min(18, Math.max(1, this.numero() + 1));
    void this.router.navigate(['/estudiante/guardianes/nivel', siguiente]);
  }

  protected reiniciar(): void {
    this.inicializarNivel(this.numero());
  }

  protected aplicarMejora(m: { id: string; nombre: string }): void {
    // La mejora queda PENDIENTE: se aplica sólo si el estudiante acierta el chequeo;
    // si falla (o lo omite), la perderá.
    this.mejoraPendiente = m;
    this.mejoraEnJuego.set(true);
    this.elegirMejora.set(false);
    // Tras elegir mejora: chequeo académico de la lección antes de la siguiente horda
    void this.iniciarChequeo();
  }

  private iniciarSiguienteHorda(): void {
    const scene = this.game?.scene?.getScene('Combate') as any;
    scene?.comenzarSiguienteHorda?.();
    this.hordaActual.set(scene?.hordaActual ?? 1);
  }

  /** Resuelve la mejora pendiente según el resultado del chequeo. */
  private resolverMejoraTrasChequeo(conservada: boolean): void {
    if (conservada && this.mejoraPendiente) {
      const scene = this.game?.scene?.getScene('Combate') as any;
      scene?.applyUpgrade?.(this.mejoraPendiente.id);
    }
    this.mejoraPendiente = null;
    this.mejoraEnJuego.set(false);
  }

  private async iniciarChequeo(): Promise<void> {
    const nivelId = this.nivelId;
    if (!nivelId || !this.intentoId) { this.resolverMejoraTrasChequeo(true); this.iniciarSiguienteHorda(); return; }
    const sb = this.supabase.client;
    try {
      const { data, error } = await sb.rpc('guardianes_pregunta_aleatoria', {
        p_nivel_id: nivelId,
        p_excluir: this.preguntaExcluidas,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : null) as any;
      if (!row) { this.resolverMejoraTrasChequeo(true); this.iniciarSiguienteHorda(); return; }
      const opciones = Array.isArray(row.opciones) ? row.opciones.map(String) : [];
      if (opciones.length < 2) { this.resolverMejoraTrasChequeo(true); this.iniciarSiguienteHorda(); return; }
      this.preguntaExcluidas.push(row.pregunta_id);
      this.pistaActual.set(null);
      this.eliminadas.set([]);
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
      this.resolverMejoraTrasChequeo(true);
      this.iniciarSiguienteHorda();
    }
  }

  protected elegirOpcion(opcion: string): void {
    if (this.respuestaResultado()) return; // ya está calificada
    if (this.esOpcionEliminada(opcion)) return; // opción eliminada con 50/50
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
      this.respuestaResultado.set({ esCorrecta: false, error: true, explicacion: 'No se pudo calificar. Revisa tu conexión.', xp: 0, monedas: 0 });
    }
  }

  protected omitirChequeo(): void {
    this.preguntaActual.set(null);
    this.respuestaElegida.set(null);
    this.respuestaResultado.set(null);
    // Omitir el chequeo también implica perder la mejora pendiente
    this.resolverMejoraTrasChequeo(false);
    this.iniciarSiguienteHorda();
  }

  protected continuarTrasChequeo(): void {
    const r = this.respuestaResultado();
    this.preguntaActual.set(null);
    this.respuestaElegida.set(null);
    this.respuestaResultado.set(null);
    // La mejora pendiente se conserva sólo si el chequeo fue correcto;
    // un error técnico de calificación no cuesta la mejora.
    const conservada = Boolean(r && (r.esCorrecta || r.error));
    this.resolverMejoraTrasChequeo(conservada);
    this.iniciarSiguienteHorda();
  }

  protected claseOpcion(op: string): string {
    const base = 'flex items-center rounded-xl border px-3 py-2.5 text-left text-sm font-semibold leading-snug transition ';
    const r = this.respuestaResultado();
    const sel = this.respuestaElegida();
    if (this.esOpcionEliminada(op)) {
      return base + 'cursor-not-allowed opacity-30 border-white/5 bg-white/[0.02] text-marine-500 line-through';
    }
    if (!r) {
      return base + (sel === op
        ? 'border-gold-400/80 bg-gold-500/15 text-gold-200 shadow-[0_0_0_1px_#f2a54166]'
        : 'border-white/10 bg-white/[0.04] text-marine-100 hover:border-gold-400/50 hover:bg-white/[0.07] hover:text-white');
    }
    if (op === r.correcta) return base + 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200';
    if (sel === op) return base + 'border-rose-400/60 bg-rose-400/15 text-rose-200';
    return base + 'border-white/5 bg-white/[0.02] text-marine-500';
  }

  private limpiar(): void {
    if (this.hudTimer) clearInterval(this.hudTimer);
    if (this.game) { this.game.destroy(true); this.game = null; }
  }

  /** Espera hasta que Angular renderice #juego-root en el DOM (polling con timeout). */
  private async waitForJuegoRoot(timeoutMs: number): Promise<HTMLElement | null> {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      if (typeof document !== 'undefined') {
        const el = document.getElementById('juego-root');
        if (el) return el as HTMLElement;
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    return null;
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

    // Esperar a que el componente renderice el @else y #juego-root exista en el DOM
    const host = await this.waitForJuegoRoot(1500);
    if (!host) {
      console.error('[guardianes] no se pudo localizar #juego-root en el DOM');
      this.fase.set('derrota');
      this.mensajeResultado.set('No se pudo iniciar el juego. Refresca (Ctrl+Shift+R) e inténtalo de nuevo.');
      return;
    }

    setTimeout(() => {
      if (!host) return;
      this.game = new Phaser.Game({
        type: Phaser.AUTO, parent: host,
        width: CombateScene.ARENA_W, height: CombateScene.ARENA_H,
        backgroundColor: '#0f1a33',
        physics: { default: 'arcade', arcade: { gravity: { y: 0, x: 0 }, debug: false } },
        callbacks: {
          preBoot: (game) => {
            game.registry.set('mapaArena', this.numero() <= 5 ? '1-5' : this.numero() <= 9 ? '6-9' : this.numero() <= 15 ? '10-15' : '16-18');
            game.registry.set('nivel', this.numero());
          },
        },
        scene: [CombateScene],
      });


      this.game.events.once('ready', () => {
        const scene = this.game?.scene?.getScene('Combate') as any;
        const nivelIdLocal = nivelId;
        // Arrancar pausado: el estudiante decide cuando empieza
        this.game?.pause();
        // El botón "¡Entendido, jugar!" solo aparece cuando Phaser confirma ready
        this.juegoListo.set(true);
        if (scene && nivelIdLocal) {
          scene.evaluacionMode = this.esEvaluacion();
          scene.emitHud = () => this.crearTickHud(scene);
          scene.emitUpgradePick = () => this.abrirMenuMejoras();
          scene.emitDestroy = (victoria: boolean, matados: number, tiempoSeg: number) => {
            void this.persistirIntento(nivelIdLocal, victoria, matados, tiempoSeg);
          };
          scene.emitVidaExtra = () => { this.manejarMuertePorVida(); };
        }
      });

      this.hudTimer = setInterval(() => this.crearTickHud(), 150);
      this.fase.set('jugando');
      this.arrancarseMs = performance.now();
    }, 120);
  }

  private abrirMenuMejoras(): void {
    // La escena ya queda congelada con pickingUpgrade; mostramos el overlay
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