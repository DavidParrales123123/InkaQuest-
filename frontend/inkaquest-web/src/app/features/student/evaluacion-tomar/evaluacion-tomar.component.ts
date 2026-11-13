// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthService } from '../../../core/services/auth.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface OpcionJuego { id: string; texto: string; orden: number }
interface PreguntaJuego {
  id: string;
  orden: number;
  tipo: string;
  enunciado: string;
  descripcion: string | null;
  puntos: number;
  opciones: OpcionJuego[];
}
interface IntentoJuego {
  intentoId: string;
  numero: number;
  tiempoInicio: string;
  tiempoLimite: string | null;
  puntajeMaximo: number;
  preguntas: PreguntaJuego[];
}
interface ResultadoPregunta {
  preguntaId: string;
  enunciado: string;
  tipo: string;
  puntos: string | number;
  puntajeObtenido: string | number;
  correcta: boolean;
  respuestaEstudiante: string;
  respuestaCorrecta: string | null;
  retroalimentacion: string | null;
}
interface ResultadoIntento {
  intentoId: string;
  estado: string;
  puntaje: string | number;
  puntajeMaximo: string | number;
  porcentaje: string | number;
  aprobado: boolean;
  tiempoInicio: string;
  tiempoFin: string;
  respuestas: ResultadoPregunta[];
}
interface ResumenEvaluacion {
  id: string;
  actividadId: string;
  titulo: string;
  descripcion: string | null;
  notaMaxima: number;
  intentosPermitidos: number;
  duracionMinutos: number | null;
  aleatorizarPreguntas: boolean;
  mostrarResultadoInmediato: boolean;
  totalPreguntas: number;
  misIntentos: number;
}

type Fase = 'cargando' | 'intro' | 'jugando' | 'enviando' | 'resultado';

/**
 * Tomar evaluación (quiz / examen) del estudiante.
 *
 * <ol>
 *   <li>Resumen (descripción, intentos permitidos/hechos, duración, nº preguntas)</li>
 *   <li>Iniciar intento (POST /evaluaciones/{id}/iniciar)</li>
 *   <li>Juego de una pregunta a la vez con navegador numerado y temporizador</li>
 *   <li>Envío (POST /intentos/{id}/responder) con calificación automática
 *       (opción única / verdadero-falso se puntúan, abierta queda para revisión)</li>
 *   <li>Resultado (puntaje, porcentaje y aprobado/desaprobado)</li>
 * </ol>
 */
@Component({
  selector: 'app-evaluacion-tomar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        [titulo]="resumenEval()?.titulo ?? 'Evaluación'"
        descripcion="Responde cada pregunta dentro del tiempo disponible. El puntaje se calcula automáticamente al enviar."
        [acciones]="true">
        <div acciones><a routerLink="/estudiante/evaluaciones" class="btn btn-outline btn-sm">← Mis evaluaciones</a></div>
      </app-page-header>

      @if (error()) {
        <div class="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700" role="alert">{{ error() }}</div>
      }

      <!-- ======= FASE: cargando ======= -->
      @if (fase() === 'cargando') {
        <p class="py-16 text-center text-sm font-medium text-marine-500">Cargando evaluación…</p>
      }

      <!-- ======= FASE: introducción ======= -->
      @if (resumenEval(); as r) {
        @if (fase() === 'intro') {
          <div class="card card-body space-y-4">
            @if (r.descripcion) {
              <p class="whitespace-pre-wrap text-sm text-marine-600">{{ r.descripcion }}</p>
            }
            <dl class="grid gap-3 rounded-xl bg-surface-50 p-4 text-sm text-marine-700 sm:grid-cols-2">
              <div><dt class="text-xs uppercase tracking-wide text-marine-400">Preguntas</dt><dd class="font-semibold">{{ r.totalPreguntas }}</dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-marine-400">Intentos permitidos</dt><dd class="font-semibold">{{ r.intentosPermitidos }}</dd></div>
              <div><dt class="text-xs uppercase tracking-wide text-marine-400">Intentos realizados</dt><dd class="font-semibold">{{ r.misIntentos }}</dd></div>
              @if (r.duracionMinutos) { <div><dt class="text-xs uppercase tracking-wide text-marine-400">Duración</dt><dd class="font-semibold">{{ r.duracionMinutos }} minuto(s)</dd></div> }
            </dl>
            @if (r.misIntentos >= r.intentosPermitidos) {
              <p class="rounded-lg border border-warning-500 bg-warning-50 p-3 text-sm font-medium text-marine-700">Has agotado tus intentos permitidos para esta evaluación.</p>
            }
            <div class="flex items-center justify-end gap-2 border-t border-surface-100 pt-3">
              <a routerLink="/estudiante/evaluaciones" class="btn btn-outline btn-sm">Cancelar</a>
              <button type="button" class="btn btn-primary" [disabled]="cargandoIntento() || r.misIntentos >= r.intentosPermitidos" (click)="iniciarIntento()">
                {{ cargandoIntento() ? 'Iniciando…' : (r.misIntentos > 0 ? 'Reintentar evaluación' : 'Iniciar evaluación') }}
              </button>
            </div>
          </div>
        }
      }

      <!-- ======= FASE: jugando ======= -->
      @if (fase() === 'jugando' || fase() === 'enviando') {
        @let p = preguntaActual();
        @if (p) {
          <div class="card card-body space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <span class="badge badge-neutral">Pregunta {{ indice() + 1 }} de {{ preguntas().length }}</span>
                <span class="text-xs font-semibold text-marine-500">{{ p.puntos }} {{ p.puntos === 1 ? 'punto' : 'puntos' }}</span>
              </div>
              @if (restanteTexto(); as rt) {
                <span class="rounded-full px-3 py-1 text-sm font-bold tabular-nums" [class]="restanteUrgente() ? 'bg-danger-50 text-danger-700' : 'bg-brand-50 text-brand-800'">⏱ {{ rt }}</span>
              }
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-100"><div class="h-full rounded-full bg-brand-500 transition-all" [style.width.%]="((indice() + 1) / preguntas().length) * 100"></div></div>

            <div>
              <h2 class="text-base font-semibold text-marine-800">{{ p.enunciado }}</h2>
              @if (p.descripcion) { <p class="mt-1 whitespace-pre-wrap text-sm text-marine-500">{{ p.descripcion }}</p> }
            </div>

            <fieldset class="space-y-2" [attr.aria-label]="'Pregunta ' + (indice() + 1)">
              @if (p.tipo === 'respuesta_libre' || p.tipo === 'codigo') {
                <textarea class="textarea min-h-40" placeholder="Escribe tu respuesta aquí…" [value]="respuestaTextoActual()" (input)="setRespuesta(p, $any($event.target).value)"></textarea>
              } @else {
                @for (op of p.opciones; track op.id) {
                  <label class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors hover:border-brand-400 hover:bg-brand-50/60" [class]="respuestaSeleccionada(p) === op.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-400' : 'border-surface-200'">
                    <input type="radio" class="mt-0.5 accent-[#12736b]" [name]="'pregunta-' + p.id" [value]="op.id" [checked]="respuestaSeleccionada(p) === op.id" (change)="setRespuesta(p, op.id)" />
                    <span class="text-marine-700">{{ op.texto }}</span>
                  </label>
                }
              }
            </fieldset>

            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-3">
              <button type="button" class="btn btn-outline btn-sm" (click)="anterior()" [disabled]="indice() === 0 || fase() === 'enviando'">← Anterior</button>
              <div class="flex flex-wrap items-center gap-1.5">
                @for (_ of preguntas(); track $index) {
                  <button type="button" class="size-7 rounded-md text-xs font-bold" [class]="indice() === $index ? 'bg-brand-600 text-white' : respondidas()[$index] ? 'bg-brand-100 text-brand-800' : 'bg-surface-100 text-marine-500'" (click)="irA($index)" [attr.aria-label]="'Pregunta ' + ($index + 1)">{{ $index + 1 }}</button>
                }
              </div>
              @if (indice() < preguntas().length - 1) {
                <button type="button" class="btn btn-primary btn-sm" (click)="siguiente()" [disabled]="fase() === 'enviando'">Siguiente →</button>
              } @else {
                <button type="button" class="btn btn-primary" (click)="enviar()" [disabled]="fase() === 'enviando'">{{ fase() === 'enviando' ? 'Enviando…' : 'Enviar evaluación' }}</button>
              }
            </div>
          </div>
        }
      }

      <!-- ======= FASE: resultado ======= -->
      @if (fase() === 'resultado') {
        @if (resultado(); as r) {
          <div class="card card-body space-y-4">
            <div class="text-center">
              <p class="text-sm font-semibold uppercase tracking-widest text-marine-400">Evaluación enviada</p>
              <p class="mt-1 text-4xl font-extrabold text-marine-800">{{ r.puntaje }} <span class="text-xl text-marine-500">/ {{ r.puntajeMaximo }}</span></p>
              <p class="mt-1 text-sm font-medium text-marine-500">{{ porcentajeTexto(r.porcentaje) }}%</p>
              <div class="mt-3 flex justify-center"><app-status-badge [estado]="r.aprobado ? 'aprobado' : 'reprobado'" /></div>
              <p class="mt-2 text-xs text-marine-400">{{ r.aprobado ? 'Has aprobado la evaluación. ¡Felicitaciones!' : 'No aprobaste esta vez. Revisa las preguntas y vuelve cuando tu docente lo permita.' }}</p>
            </div>
            @if (r.respuestas?.length) {
              <div>
                <h3 class="text-base font-semibold text-marine-800">Revisión</h3>
                <ul class="mt-2 space-y-2">
                  @for (resp of r.respuestas; track resp.preguntaId) {
                    <li class="rounded-lg border p-3 text-sm" [class]="resp.correcta ? 'border-success-500 bg-success-50' : 'border-danger-200 bg-danger-50'">
                      <p class="font-semibold text-marine-800">{{ resp.enunciado }}</p>
                      @if (resp.respuestaEstudiante) { <p class="mt-1 text-xs text-marine-500">Tu respuesta: {{ resp.respuestaEstudiante }}</p> }
                      <p class="mt-1 text-xs font-semibold" [class]="resp.correcta ? 'text-success-600' : 'text-danger-600'">{{ resp.correcta ? 'Correcta' : 'Incorrecta' }} · {{ resp.puntajeObtenido }} / {{ resp.puntos }} pts</p>
                      @if (resp.retroalimentacion) { <p class="mt-1 text-xs text-marine-500">{{ resp.retroalimentacion }}</p> }
                    </li>
                  }
                </ul>
              </div>
            }
            <div class="flex justify-end gap-2 border-t border-surface-100 pt-3">
              <a routerLink="/estudiante/evaluaciones" class="btn btn-primary btn-sm">Volver a mis evaluaciones</a>
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class EvaluacionTomarComponent implements OnInit, OnDestroy {
  protected readonly resumenEval = signal<ResumenEvaluacion | null>(null);
  protected readonly fase = signal<Fase>('cargando');
  protected readonly error = signal<string | null>(null);
  protected readonly cargandoIntento = signal(false);
  protected readonly indice = signal(0);
  protected readonly preguntas = signal<PreguntaJuego[]>([]);
  protected readonly respuestas = signal<Record<string, string>>({});
  protected readonly intentoId = signal<string | null>(null);
  protected readonly resultado = signal<ResultadoIntento | null>(null);
  protected readonly restanteTexto = signal<string | null>(null);
  private restanteSegundos = signal(0);

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly preguntaActual = computed(() => this.preguntas()[this.indice()] ?? null);
  protected readonly respondidas = computed(() => this.preguntas().map((p) => this.respuestas()[p.id] !== undefined));

  ngOnInit(): void { void this.cargarResumen(); }
  ngOnDestroy(): void { this.detenerTimer(); }

  private async cargarResumen(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; message: string; data: ResumenEvaluacion }>(`${this.evaluationServiceBase()}/evaluaciones/${id}`),
      );
      const data = res?.data;
      if (!data) throw new Error('Respuesta vacía del servidor.');
      this.resumeEval(data);
      this.fase.set('intro');
    } catch (e: any) {
      this.error.set(this.mensajeDeError(e, 'No se pudo cargar la evaluación.'));
      this.fase.set('intro');
    }
  }

  private resumeEval(data: ResumenEvaluacion): void {
    this.resumenEval.set({
      ...data,
      titulo: data.titulo ?? 'Evaluación',
      descripcion: data.descripcion ?? null,
      duracionMinutos: data.duracionMinutos ?? null,
    });
  }

  protected async iniciarIntento(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.cargandoIntento.set(true); this.error.set(null);
    try {
      const intento = await this.evaluationService.iniciarIntento(id) as unknown as {
        intentoId: string; numero: number; tiempoInicio: string; tiempoLimite: string | null;
        puntajeMaximo: number; preguntas: PreguntaJuego[];
      };
      if (!intento?.intentoId) throw new Error('No se recibió el intento del servidor.');
      this.intentoId.set(intento.intentoId);
      this.preguntas.set(intento.preguntas ?? []);
      this.respuestas.set({});
      this.indice.set(0);
      this.fase.set('jugando');
      if (intento.tiempoLimite) this.iniciarTimer(new Date(intento.tiempoLimite));
      else this.restanteTexto.set(null);
    } catch (e: any) {
      this.error.set(this.mensajeDeError(e, 'No se pudo iniciar el intento.'));
    } finally {
      this.cargandoIntento.set(false);
    }
  }

  protected setRespuesta(p: PreguntaJuego, valor: string): void {
    this.respuestas.update((m) => ({ ...m, [p.id]: valor }));
  }

  protected respuestaTextoActual(): string {
    const p = this.preguntaActual();
    return p ? this.respuestas()[p.id] ?? '' : '';
  }

  protected respuestaSeleccionada(p: PreguntaJuego): string | undefined {
    return this.respuestas()[p.id];
  }

  protected irA(i: number): void {
    if (i >= 0 && i < this.preguntas().length) this.indice.set(i);
  }
  protected anterior(): void { this.irA(this.indice() - 1); }
  protected siguiente(): void { this.irA(this.indice() + 1); }

  protected restanteUrgente(): boolean { return this.restanteSegundos() > 0 && this.restanteSegundos() <= 60; }

  protected async enviar(): Promise<void> {
    if (this.fase() === 'enviando') return;
    const sinResponder = this.preguntas().filter((p) => this.respuestas()[p.id] === undefined).length;
    if (sinResponder > 0) {
      const ok = await this.confirm.ask({
        title: 'Preguntas sin responder',
        mensaje: `Faltan ${sinResponder} pregunta(s) por responder. ¿Enviar de todos modos?`,
        textoConfirmar: 'Enviar',
        variante: 'primario',
      });
      if (!ok) return;
    }
    this.fase.set('enviando');
    this.error.set(null);
    try {
      const intentoId = this.intentoId();
      const body = {
        respuestas: this.preguntas()
          .filter((p) => this.respuestas()[p.id] !== undefined)
          .map((p) => p.tipo === 'respuesta_libre' || p.tipo === 'codigo'
            ? { preguntaId: p.id, respuestaTexto: this.respuestas()[p.id] ?? '' }
            : { preguntaId: p.id, opcionesSeleccionadas: [this.respuestas()[p.id]] }),
      };
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; data: ResultadoIntento }>(
          `${this.evaluationServiceBase()}/intentos/${intentoId}/responder`,
          body,
        ),
      );
      this.resultado.set(res?.data ?? null);
      this.detenerTimer();
      this.fase.set('resultado');
    } catch (e: any) {
      this.error.set(this.mensajeDeError(e, 'No se pudo enviar la evaluación.'));
      this.fase.set('jugando');
    }
  }

  protected porcentajeTexto(p: string | number): string {
    const n = Number(p);
    return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : String(p);
  }

  private evaluationServiceBase(): string {
    return environment.apiUrl;
  }

  private mensajeDeError(e: any, porDefecto: string): string {
    const body = e?.error;
    const msg = body?.message || e?.message;
    return typeof msg === 'string' && msg.trim() ? msg : porDefecto;
  }

  private iniciarTimer(limite: Date): void {
    this.detenerTimer();
    const tick = () => {
      const restante = Math.max(0, Math.floor((limite.getTime() - Date.now()) / 1000));
      this.restanteSegundos.set(restante);
      this.restanteTexto.set(this.formatearTiempo(restante));
      if (restante === 0) {
        this.detenerTimer();
        void this.enviarAuto();
      }
    };
    tick();
    this.timerId = setInterval(tick, 1000);
  }

  private formatearTiempo(seg: number): string {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  private detenerTimer(): void {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  private async enviarAuto(): Promise<void> {
    // Tiempo agotado: envío silencioso sin confirmación.
    this.fase.set('enviando');
    this.error.set(null);
    try {
      const intentoId = this.intentoId();
      const body = {
        respuestas: this.preguntas()
          .filter((p) => this.respuestas()[p.id] !== undefined)
          .map((p) => p.tipo === 'respuesta_libre' || p.tipo === 'codigo'
            ? { preguntaId: p.id, respuestaTexto: this.respuestas()[p.id] ?? '' }
            : { preguntaId: p.id, opcionesSeleccionadas: [this.respuestas()[p.id]] }),
      };
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; data: ResultadoIntento }>(
          `${this.evaluationServiceBase()}/intentos/${intentoId}/responder`,
          body,
        ),
      );
      this.resultado.set(res?.data ?? null);
      this.detenerTimer();
      this.fase.set('resultado');
    } catch (e: any) {
      this.error.set(this.mensajeDeError(e, 'No se pudo enviar tras agotar el tiempo.'));
      this.fase.set('jugando');
    }
  }
}
