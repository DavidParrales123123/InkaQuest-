// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { GameService } from '../../../core/services/game.service';
import {
  ActividadJuego,
  ConfiguracionJuego,
  Juego,
  Motor,
  PuntuacionJuego,
} from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  ContenidoGenerico,
  ContenidoJuego,
  ContenidoPares,
  ContenidoQuiz,
  ResultadoPartida,
  parsearContenido,
} from './contenido-juego.model';
import { QuizRuntimeComponent } from './quiz-runtime.component';
import { MemoriaRuntimeComponent } from './memoria-runtime.component';
import { EmparejamientoRuntimeComponent } from './emparejamiento-runtime.component';
import { GenericoRuntimeComponent } from './generico-runtime.component';

type Fase = 'cargando' | 'intro' | 'jugando' | 'terminado';

/**
 * Anfitrión del jugador de minijuegos.
 *
 * <p>Resuelve la actividad de juego asignada a una lección, carga el contenido
 * configurado por el docente ({@code configuracion_juego}, clave {@code contenido})
 * y monta el runtime adecuado. Al empezar la partida crea un
 * {@code intento_juego}; al terminar llama a la RPC {@code fn_registrar_resultado_juego}
 * (en el servidor) para registrar el resultado y la recompensa de XP.</p>
 */
@Component({
  selector: 'app-juego-jugador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    QuizRuntimeComponent,
    MemoriaRuntimeComponent,
    EmparejamientoRuntimeComponent,
    GenericoRuntimeComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header [titulo]="actividad()?.titulo || 'Minijuego'" descripcion="Juega la actividad asignada a tu aula y gana puntos y XP." [acciones]="true">
        <div acciones><a routerLink="/estudiante/minijuegos" class="btn btn-outline btn-sm">← Volver</a></div>
      </app-page-header>

      @if (error()) {
        <div class="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700" role="alert">{{ error() }}</div>
      }

      @switch (fase()) {
        @case ('cargando') {
          <p class="text-sm text-marine-500">Cargando actividad…</p>
        }

        @case ('intro') {
          <div class="card card-body space-y-4">
            <div class="flex flex-wrap items-start gap-4">
              <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-marine-800 text-3xl text-gold-400">{{ motor()?.icono || '🎮' }}</span>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-marine-400">{{ motor()?.nombre || 'Minijuego' }}</p>
                <h2 class="mt-0.5 text-lg font-extrabold text-marine-800">{{ actividad()?.titulo }}</h2>
                <p class="mt-1 text-sm text-marine-500">{{ actividad()?.descripcion || juego()?.descripcion }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-xl bg-surface-50 p-3 text-center"><p class="text-xs font-semibold text-marine-400">Dificultad</p><p class="text-sm font-bold text-marine-800">{{ textoDificultad() }}</p></div>
              <div class="rounded-xl bg-surface-50 p-3 text-center"><p class="text-xs font-semibold text-marine-400">XP en juego</p><p class="text-sm font-bold text-marine-800">+{{ actividad()?.xp_otorgado ?? juego()?.xp_otorgado ?? 0 }} XP</p></div>
              <div class="rounded-xl bg-surface-50 p-3 text-center"><p class="text-xs font-semibold text-marine-400">Tiempo</p><p class="text-sm font-bold text-marine-800">{{ textoTiempo() }}</p></div>
              <div class="rounded-xl bg-surface-50 p-3 text-center"><p class="text-xs font-semibold text-marine-400">Mejor puntaje</p><p class="text-sm font-bold text-marine-800">{{ puntuacion()?.mejor_puntaje ?? '—' }}</p></div>
            </div>

            @if (instrucciones(); as ins) {
              <div class="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Cómo jugar</p>
                <p class="mt-1 whitespace-pre-wrap text-sm text-marine-800">{{ ins }}</p>
              </div>
            }

            @if (!contenidoValido()) {
              <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800" role="alert">
                Esta actividad aún no tiene contenido válido configurado por tu docente. Vuelve más tarde.
              </div>
            } @else {
              <div class="flex items-center justify-between gap-3 border-t border-surface-100 pt-3">
                <p class="text-xs text-marine-500">{{ intentosPrevios() }} intento(s) anterior(es)</p>
                <button type="button" class="btn btn-primary" [disabled]="empezando()" (click)="empezar()">{{ empezando() ? 'Iniciando…' : 'Empezar intento' }}</button>
              </div>
            }
          </div>
        }

        @case ('jugando') {
          <div class="card card-body">
            @if (quizContenido(); as c) {
              <app-quiz-runtime [contenido]="c" [tiempoLimiteTotalSeg]="juego()?.tiempo_limite_seg ?? null" (finalizado)="alFinalizar($event)" />
            } @else if (paresContenido(); as c) {
              @if (runtimePares() === 'memoria') {
                <app-memoria-runtime [contenido]="c" [tiempoLimiteTotalSeg]="juego()?.tiempo_limite_seg ?? null" (finalizado)="alFinalizar($event)" />
              } @else {
                <app-emparejamiento-runtime [contenido]="c" [tiempoLimiteTotalSeg]="juego()?.tiempo_limite_seg ?? null" (finalizado)="alFinalizar($event)" />
              }
            } @else if (genericoContenido(); as c) {
              <app-generico-runtime [contenido]="c" (finalizado)="alFinalizar($event)" />
            }
          </div>
        }

        @case ('terminado') {
          @if (resultado(); as r) {
            <div class="card card-body space-y-4 text-center">
              <div class="text-5xl">{{ r.completado ? '🏆' : '💪' }}</div>
              <h2 class="text-2xl font-extrabold text-marine-800">{{ r.completado ? '¡Actividad completada!' : 'Casi lo logras…' }}</h2>
              <div class="flex items-center justify-center gap-1.5 text-3xl" [attr.aria-label]="r.estrellas + ' estrellas'">
                @for (s of [1, 2, 3]; track s) { <span [class.opacity-25]="s > r.estrellas">⭐</span> }
              </div>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="rounded-xl bg-surface-50 p-3"><p class="text-xs font-semibold text-marine-400">Puntaje</p><p class="text-lg font-extrabold text-marine-800">{{ r.puntaje }}<span class="text-xs text-marine-400"> / {{ r.puntajeMaximo }}</span></p></div>
                <div class="rounded-xl bg-surface-50 p-3"><p class="text-xs font-semibold text-marine-400">Precisión</p><p class="text-lg font-extrabold text-marine-800">{{ r.precision }}%</p></div>
                <div class="rounded-xl bg-surface-50 p-3"><p class="text-xs font-semibold text-marine-400">Completitud</p><p class="text-lg font-extrabold text-marine-800">{{ r.completitud }}%</p></div>
                <div class="rounded-xl bg-surface-50 p-3"><p class="text-xs font-semibold text-marine-400">XP ganado</p><p class="text-lg font-extrabold text-success-700">+{{ r.completado ? (actividad()?.xp_otorgado ?? 0) : 0 }}</p></div>
              </div>
              @if (mensajeResultado(); as msg) { <p class="text-sm text-marine-600">{{ msg }}</p> }
              <div class="flex flex-wrap justify-center gap-2">
                <a routerLink="/estudiante/minijuegos" class="btn btn-outline">Volver a minijuegos</a>
                <button type="button" class="btn btn-primary" (click)="jugarDeNuevo()">Jugar de nuevo</button>
              </div>
            </div>
          }
        }
      }
    </section>
  `,
})
export class JuegoJugadorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly gameService = inject(GameService);

  protected readonly fase = signal<Fase>('cargando');
  protected readonly error = signal<string | null>(null);
  protected readonly empezando = signal(false);
  protected readonly mensajeResultado = signal<string | null>(null);

  protected readonly actividad = signal<ActividadJuego | null>(null);
  protected readonly juego = signal<(Juego & { motor: Motor }) | null>(null);
  protected readonly motor = computed(() => this.juego()?.motor ?? null);
  protected readonly contenido = signal<ContenidoJuego | null>(null);
  protected readonly puntuacion = signal<PuntuacionJuego | null>(null);
  protected readonly intentosPrevios = signal(0);
  protected readonly resultado = signal<ResultadoPartida | null>(null);
  private intentoId: string | null = null;
  private inicioMs = 0;

  protected readonly contenidoValido = computed(() => this.contenido() !== null);
  protected readonly instrucciones = computed(() => {
    const c = this.contenido();
    if (c?.tipo === 'generico' && c.instrucciones) return c.instrucciones;
    return this.juego()?.descripcion ?? this.actividad()?.descripcion ?? null;
  });

  /** Contenido tipado listo para pasar a cada runtime (null si no aplica). */
  protected readonly quizContenido = computed<ContenidoQuiz | null>(() => {
    const c = this.contenido();
    return c?.tipo === 'quiz' ? c : null;
  });
  protected readonly paresContenido = computed<ContenidoPares | null>(() => {
    const c = this.contenido();
    return c?.tipo === 'memoria' || c?.tipo === 'emparejamiento' ? { tipo: 'emparejamiento', pares: c.pares } : null;
  });
  protected readonly genericoContenido = computed<ContenidoGenerico | null>(() => {
    const c = this.contenido();
    return c?.tipo === 'generico' ? c : null;
  });

  /** Elegimos la experiencia: memoria (cartas volteadas) o columnas de emparejamiento. */
  protected readonly runtimePares = computed<'memoria' | 'emparejamiento'>(() => {
    const cod = (this.motor()?.codigo ?? '').toLowerCase();
    return /emparejamiento|relacionar|crucigrama|seleccion|match/.test(cod) ? 'emparejamiento' : 'memoria';
  });

  ngOnInit(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    const actividadId = this.route.snapshot.paramMap.get('actividadJuegoId');
    if (!actividadId) {
      this.error.set('Actividad no especificada.');
      this.fase.set('intro');
      return;
    }
    this.fase.set('cargando');
    this.error.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) throw new Error('Debes iniciar sesión.');

      const actividad = await this.gameService.obtenerActividadJuego(actividadId);
      if (!actividad) throw new Error('No se encontró la actividad o no tienes acceso.');

      const juego = await this.gameService.obtenerJuego(actividad.juego_id);
      if (!juego) throw new Error('No se encontró el juego asociado a esta actividad.');

      const configs: ConfiguracionJuego[] = await this.gameService.listarConfiguracionJuego(actividad.juego_id);
      const contenidoRaw = configs.find((c) => c.clave.trim().toLowerCase() === 'contenido')?.valor ?? null;
      const contenido = parsearContenido(contenidoRaw);

      const intentos = await this.gameService.listarMisIntentos(user.id, [actividad.id]);
      const puntuacion = await this.gameService.obtenerPuntuacion(actividad.juego_id, user.id).catch(() => null);

      this.actividad.set(actividad);
      this.juego.set(juego);
      this.contenido.set(contenido);
      this.intentosPrevios.set(intentos.length);
      this.puntuacion.set(puntuacion);
      this.fase.set('intro');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la actividad.');
      this.fase.set('intro');
    }
  }

  protected textoDificultad(): string {
    const d = this.juego()?.dificultad ?? '';
    return ({ facil: 'Fácil', media: 'Media', dificil: 'Difícil' } as Record<string, string>)[d] ?? (d || '—');
  }

  protected textoTiempo(): string {
    const t = this.juego()?.tiempo_limite_seg;
    if (!t) return 'Sin límite';
    const m = Math.floor(t / 60);
    const s = t % 60;
    const min = m > 0 ? `${m}m ` : '';
    return `${min}${s}s`.trim();
  }

  protected async empezar(): Promise<void> {
    const user = this.auth.usuario();
    const actividad = this.actividad();
    if (!user || !actividad) return;
    this.empezando.set(true);
    this.error.set(null);
    try {
      const intentos = await this.gameService.listarMisIntentos(user.id, [actividad.id]);
      const siguienteNumero = intentos.reduce((m, i) => Math.max(m, i.numero ?? 0), 0) + 1;
      const clave = crypto.randomUUID();
      const r = await this.gameService.iniciarIntento(actividad.id, user.id, siguienteNumero, clave);
      if (!r.ok || !r.intentoId) throw new Error(r.mensaje || 'No se pudo iniciar tu intento.');
      this.intentoId = r.intentoId;
      this.inicioMs = performance.now();
      this.fase.set('jugando');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar el juego.');
    } finally {
      this.empezando.set(false);
    }
  }

  protected async alFinalizar(r: ResultadoPartida): Promise<void> {
    const intentoId = this.intentoId;
    const user = this.auth.usuario();
    const actividad = this.actividad();
    this.resultado.set(r);
    this.fase.set('terminado');

    if (!intentoId) {
      this.mensajeResultado.set('Resultado mostrado. No había un intento activo para registrar.');
      return;
    }
    // Guarda la duración real y luego el resultado (el servidor reparte XP).
    const duracion = Math.max(0, Math.round(performance.now() - this.inicioMs));
    try { await this.gameService.actualizarDuracionIntento(intentoId, duracion); } catch { /* no bloquea el registro */ }

    const registro = await this.gameService.registrarResultado(
      intentoId,
      r.puntaje,
      r.puntajeMaximo,
      r.precision,
      r.completitud,
      r.aciertos,
      r.errores,
      r.estrellas,
      r.completado,
      r.desglose,
    );
    this.mensajeResultado.set(registro.mensaje);

    if (actividad && user) {
      this.puntuacion.set(await this.gameService.obtenerPuntuacion(actividad.juego_id, user.id).catch(() => null));
    }
  }

  protected async jugarDeNuevo(): Promise<void> {
    this.resultado.set(null);
    this.mensajeResultado.set(null);
    this.fase.set('intro');
    const actividad = this.actividad();
    const user = this.auth.usuario();
    if (actividad && user) {
      const intentos = await this.gameService.listarMisIntentos(user.id, [actividad.id]).catch(() => []);
      this.intentosPrevios.set(intentos.length);
    }
  }
}
