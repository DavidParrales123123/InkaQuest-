// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService, ResultadoDocente, RespuestaDetalle } from '../../../core/services/evaluation.service';
import { EstadoCalificacion, FilaCalificacion, GradebookService } from '../../../core/services/gradebook.service';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ahoraLocalInput, errorFechaPasada, errorOrdenFechas, validarVentanaFechas } from '../../../shared/utilities/fechas.util';
import { TeacherService } from '../../../core/services/teacher.service';
import {
  Actividad,
  Curso,
  Evaluacion,
  Opcion,
  Pregunta,
} from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';



type TipoPreguntaNuevo = 'opcion_unica' | 'verdadero_falso';
type TipoEvaluacion = 'quiz' | 'examen';
type EvaluacionGestion = Evaluacion & { actividad: Actividad };
interface GrupoEvaluacion { id: string; titulo: string; items: EvaluacionGestion[]; }

/**
 * Evaluaciones del docente.
 *
 * <p>Crea y gestiona cuestionarios y exámenes de opción múltiple para una
 * lección: preguntas con opciones y una respuesta correcta, intentos, tiempo
 * límite, % de aprobación, publicación y borradores.</p>
 *
 * <p>Persiste directamente en {@code public.actividad} / {@code evaluacion} /
 * {@code pregunta} / {@code opcion}; la autorización la garantiza la RLS
 * (solo docente del curso o admin).</p>
 */
@Component({
  selector: 'app-teacher-evaluaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgClass, FormsModule, ReactiveFormsModule, RouterLink, PageHeaderComponent],
  styles: [`
    .opcion-row { display:flex; gap:.5rem; align-items:center; }
    .correcta-mark { flex: 0 0 auto; accent-color: var(--color-brand-500, #12736b); width:1.1rem; height:1.1rem; cursor:pointer; }
  `],
  template: `
    <section class="space-y-6">

      <app-page-header titulo="Evaluaciones" descripcion="Crea y gestiona cuestionarios y exámenes con preguntas de opción múltiple." />

      @if (mensaje(); as msg) {
        <p class="rounded-lg border p-3 text-sm font-medium"
          [class]="msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'"
          role="status">{{ msg.texto }}</p>
      }

      <!-- ════════════════ EVALUACIONES ════════════════ -->
      @if (cargando()) {
          <p class="text-sm text-marine-500">Cargando tus cursos…</p>
        } @else if (cursos().length === 0) {
          <div class="card card-body text-center">
            <p class="text-sm text-marine-600">No tienes cursos asignados todavía, por lo tanto no puedes crear evaluaciones.</p>
          </div>
        } @else {
          <!-- Selector de curso y lección -->
          <div class="card card-body grid gap-3 sm:grid-cols-2">
            <div>
              <label class="label" for="sel-curso">Curso</label>
              <select id="sel-curso" class="select" [value]="cursoSel()" (change)="cambiarCurso($any($event.target).value)">
                @for (c of cursos(); track c.curso.id) {
                  <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="sel-lecs">Lección</label>
              <select id="sel-lecs" class="select" [value]="leccionIdSel()" (change)="leccionIdSel.set($any($event.target).value)">
                <option value="">— Sin lección (evaluaciones se guardan ligadas a una lección) —</option>
                @for (l of lecciones(); track l.id) {
                  <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option>
                }
              </select>
              @if (lecciones().length === 0) {
                <p class="mt-1 text-xs text-warning-700">Este curso aún no tiene lecciones. Crea lecciones en <a class="underline" [routerLink]="['/docente/cursos']">gestión del curso</a> primero.</p>
              }
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-5">
            <!-- ════ CREAR EVALUACIÓN ════ -->
            <form class="card card-body space-y-3 xl:col-span-2" [formGroup]="formCrear" (ngSubmit)="crearEvaluacion()" aria-label="Nueva evaluación">
              <h2 class="text-base font-extrabold text-marine-800">Nueva evaluación</h2>

              <div>
                <label class="label" for="titulo">Título</label>
                <input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Examen parcial: Estructuras de control" />
                @if (formCrear.controls.titulo.invalid && formCrear.controls.titulo.touched) {
                  <p class="mt-1 text-xs text-danger-600">El título debe tener entre 3 y 140 caracteres.</p>
                }
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="label" for="tipo">Tipo</label>
                  <select id="tipo" class="select" formControlName="tipo">
                    <option value="quiz">Cuestionario</option>
                    <option value="examen">Examen</option>
                  </select>
                </div>
                <div>
                  <label class="label" for="xp">XP otorgado</label>
                  <input id="xp" type="number" min="0" class="input" formControlName="xp" />
                </div>
                <div>
                  <label class="label" for="tiempo">Tiempo límite (min)</label>
                  <input id="tiempo" type="number" min="0" class="input" formControlName="tiempoMin" placeholder="0 = sin límite" />
                </div>
                <div>
                  <label class="label" for="intentos">Intentos</label>
                  <input id="intentos" type="number" min="1" max="20" class="input" formControlName="intentos" />
                </div>
                <div>
                  <label class="label" for="aprob">Nota mín. (0–20)</label>
                  <input id="aprob" type="number" min="0" max="20" step="0.5" class="input" formControlName="aprobacion" />
                </div>
                <div class="flex items-end">
                  <label class="flex h-full cursor-pointer select-none items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-sm font-medium text-marine-700">
                    <input type="checkbox" class="h-4 w-4 accent-[#12736b]" formControlName="publicado" />
                    Publicada
                  </label>
                </div>
              </div>

              <fieldset class="rounded-xl border border-surface-200 bg-surface-50 p-3">
                <legend class="px-1 text-xs font-bold uppercase tracking-wider text-marine-500">Ventana de acceso</legend>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="label" for="fecha-inicio">Fecha de inicio</label>
                    <input id="fecha-inicio" type="datetime-local" class="input" formControlName="fechaInicio"
                      [attr.min]="minFecha()" (focus)="actualizarMin()" aria-describedby="ventana-ayuda"
                      [class.border-danger-500]="errInicio()" [attr.aria-invalid]="errInicio() ? true : null" />
                    <p class="mt-1 text-xs font-medium text-danger-600" aria-live="polite">{{ errInicio() || '\u00A0' }}</p>
                  </div>
                  <div>
                    <label class="label" for="fecha-limite">Límite de acceso</label>
                    <input id="fecha-limite" type="datetime-local" class="input" formControlName="fechaLimiteAcceso"
                      [attr.min]="minFecha()" (focus)="actualizarMin()" aria-describedby="ventana-ayuda"
                      [class.border-danger-500]="errLimite()" [attr.aria-invalid]="errLimite() ? true : null" />
                    <p class="mt-1 text-xs font-medium text-danger-600" aria-live="polite">{{ errLimite() || '\u00A0' }}</p>
                  </div>
                </div>
                <p id="ventana-ayuda" class="mt-2 text-[0.7rem] text-marine-400">Deja ambos vacíos para que esté siempre disponible. No se permiten fechas ni horas pasadas, y el límite debe ser posterior al inicio.</p>
              </fieldset>

              <div>
                <label class="label" for="instr">Instrucciones (opcional)</label>
                <textarea id="instr" class="textarea" rows="2" formControlName="instrucciones" placeholder="Qué verán los estudiantes justo antes de empezar."></textarea>
              </div>

              <div class="flex flex-col items-stretch gap-2 border-t border-surface-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p class="text-[0.7rem] text-marine-400">Una vez creada, agrega sus preguntas desde «Preguntas».</p>
                <button type="submit" class="btn btn-primary w-full sm:w-auto" [disabled]="formCrear.invalid || creando()">{{ creando() ? 'Creando…' : 'Crear evaluación' }}</button>
              </div>
            </form>

            <!-- ════ MIS EVALUACIONES ════ -->
            <div class="space-y-4 xl:col-span-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-base font-extrabold text-marine-800">Evaluaciones de este curso</h2>
                <div class="flex items-center gap-2">
                  <span class="badge badge-neutral">{{ evaluacionesVisibles().length }}</span>
                  <button type="button" class="btn btn-outline btn-sm" [disabled]="exportando() || evaluaciones().length === 0" (click)="exportarTodas()">{{ exportando() ? 'Generando…' : '⬇ Excel' }}</button>
                </div>
              </div>

              @if (evaluacionesVisibles().length === 0) {
                <div class="card card-body space-y-2">
                  <p class="text-sm text-marine-500">@if (leccionIdSel()) { Esta lección todavía no tiene evaluaciones. Selecciona «todas las lecciones» para ver las del resto del curso. } @else { Aún no has creado ninguna evaluación. Completa el formulario de la izquierda. }</p>
                  @if (leccionIdSel()) {
                    <button type="button" class="btn btn-outline btn-sm" (click)="leccionIdSel.set('')">Ver todas las lecciones</button>
                  }
                </div>
              } @else {
                <ul class="space-y-4">
                  @for (grupo of gruposEvaluaciones(); track grupo.id) {
                    <li class="space-y-2">
                      @if (!leccionIdSel()) {
                        <p class="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider text-marine-500">
                          {{ grupo.titulo }} <span class="badge badge-neutral">{{ grupo.items.length }}</span>
                        </p>
                      }
                      <ul class="space-y-2">
                        @for (e of grupo.items; track e.id) {
                          <li class="card card-body">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div class="w-full min-w-0 sm:w-auto">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-marine-800 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-gold-400">{{ e.actividad.tipo }}</span>
                            <p class="break-words font-semibold text-marine-800">{{ e.actividad.titulo }}</p>
                            @if (e.actividad.publicado) {
                              <span class="rounded-full bg-success-100 px-2 py-0.5 text-[0.65rem] font-bold text-success-700">PUBLICADA</span>
                            } @else {
                              <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[0.65rem] font-bold text-marine-600">BORRADOR</span>
                            }
                          </div>
                          <p class="mt-1 text-xs text-marine-500">{{ e.intentos_permitidos }} intento(s) · {{ e.porcentaje_aprobacion }}/20 para aprobar · {{ e.duracion_minutos ?? 'sin' }} min · nota máx. {{ e.nota_maxima }}</p>
                          <p class="mt-1 text-xs text-marine-500">
                            Acceso:
                            @if (e.fecha_inicio) { desde {{ e.fecha_inicio | date:'short' }} } @else { sin inicio }
                            ·
                            @if (e.fecha_limite_acceso) { hasta {{ e.fecha_limite_acceso | date:'short' }} } @else { sin límite }
                          </p>
                        </div>
                        <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1.5">
                          <span class="badge col-span-2 justify-self-start sm:col-span-1" [ngClass]="estadoVentana(e).clase">{{ estadoVentana(e).texto }}</span>
                          <button type="button" class="btn btn-outline btn-sm" [class.ring-2]="evaluacionSel()?.id === e.id" (click)="abrirEditorDePreguntas(e)">Preguntas</button>
                          <button type="button" class="btn btn-outline btn-sm" [class.ring-2]="resultadosAbiertosId() === e.id" (click)="toggleResultados(e)">Resultados</button>
                          <button type="button" class="btn btn-outline btn-sm" [class.ring-2]="calificarAbiertaId() === e.id" (click)="toggleCalificar(e)">Calificar</button>
                          <button type="button" class="btn btn-outline btn-sm" (click)="abrirEdicionVentana(e)">Fechas</button>
                          <button type="button" class="btn btn-outline btn-sm" (click)="togglePublicada(e)">{{ e.actividad.publicado ? 'Ocultar' : 'Publicar' }}</button>
                          <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminarEvaluacion(e)">Eliminar</button>
                        </div>
                      </div>

                      @if (editandoVentanaId() === e.id) {
                        <div class="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
                          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">Editar ventana de acceso</p>
                          <div class="grid gap-2 sm:grid-cols-2">
                            <label class="label" [attr.for]="'edit-ini-'+e.id">Inicio
                              <input [id]="'edit-ini-'+e.id" type="datetime-local" class="input" [attr.min]="minFecha()" (focus)="actualizarMin()"
                                [class.border-danger-500]="errEditInicio()" [ngModel]="editInicio()" (ngModelChange)="editInicio.set($event)" />
                              <span class="mt-1 block text-xs font-medium text-danger-600">{{ errEditInicio() || '' }}</span>
                            </label>
                            <label class="label" [attr.for]="'edit-fin-'+e.id">Límite
                              <input [id]="'edit-fin-'+e.id" type="datetime-local" class="input" [attr.min]="minFecha()" (focus)="actualizarMin()"
                                [class.border-danger-500]="errEditLimite()" [ngModel]="editLimite()" (ngModelChange)="editLimite.set($event)" />
                              <span class="mt-1 block text-xs font-medium text-danger-600">{{ errEditLimite() || '' }}</span>
                            </label>
                          </div>
                          <div class="mt-2 flex flex-wrap gap-2">
                            <button type="button" class="btn btn-primary btn-sm" (click)="guardarVentana(e)">Guardar fechas</button>
                            <button type="button" class="btn btn-outline btn-sm" (click)="cancelarEdicionVentana()">Cancelar</button>
                          </div>
                        </div>
                      }

                      @if (resultadosAbiertosId() === e.id) {
                        <div class="mt-3 rounded-xl border border-brand-200 bg-brand-50/40 p-3">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Resultados de los estudiantes</p>
                            <button type="button" class="btn btn-outline btn-sm" (click)="cargarResultados(e)">Actualizar</button>
                          </div>
                          @if (cargandoResultados()) {
                            <p class="mt-2 text-sm text-marine-500">Cargando resultados…</p>
                          } @else if (errorResultados(); as err) {
                            <p class="mt-2 rounded-lg border border-danger-200 bg-danger-50 p-2 text-sm text-danger-700">{{ err }}</p>
                          } @else if (resultados().length === 0) {
                            <p class="mt-2 text-sm text-marine-500">Todavía no hay intentos registrados en esta evaluación.</p>
                          } @else {
                            <!-- Tarjetas en móvil: evita una tabla de 8 columnas en pantallas pequeñas -->
                            <div class="mt-2 space-y-2 sm:hidden">
                              @for (r of resultados(); track r.id) {
                                <div class="rounded-xl border border-surface-200 bg-white p-3">
                                  <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                      <p class="break-words text-sm font-semibold text-marine-800">{{ r.estudiante?.nombre }} {{ r.estudiante?.apellido }}</p>
                                      <p class="break-all text-[0.7rem] text-marine-400">{{ r.estudiante?.email }}</p>
                                    </div>
                                    <span class="badge shrink-0" [ngClass]="r.aprobado ? 'badge-success' : 'badge-danger'">{{ r.aprobado ? 'Aprobado' : (r.aprobado === null ? 'Pendiente' : 'Desaprobado') }}</span>
                                  </div>
                                  <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                    <div><span class="block text-marine-400">Intento</span><span class="font-semibold text-marine-700">{{ r.numero }}</span></div>
                                    <div><span class="block text-marine-400">Estado</span><span class="font-semibold text-marine-700">{{ r.estado.replace('_',' ') }}</span></div>
                                    <div><span class="block text-marine-400">Puntaje</span><span class="font-semibold text-marine-700">{{ r.puntaje ?? 0 }} / {{ r.puntaje_maximo ?? 0 }} · nota {{ notaIntento(r) }}/20</span></div>
                                    <div><span class="block text-marine-400">Finalizado</span><span class="font-semibold text-marine-700">{{ r.tiempo_fin ? (r.tiempo_fin | date:'short') : '—' }}</span></div>
                                  </div>
                                  <button type="button" class="btn btn-outline btn-sm mt-3 w-full" (click)="toggleDetalle(r.id)">{{ detalleAbiertoId() === r.id ? 'Ocultar detalle' : 'Ver detalle' }}</button>
                                  @if (detalleAbiertoId() === r.id) {
                                    <div class="mt-2 rounded-lg border border-surface-200 bg-white p-2">
                                      @if (cargandoDetalle()) {
                                        <p class="text-xs text-marine-500">Cargando detalle…</p>
                                      } @else if (detalle().length === 0) {
                                        <p class="text-xs text-marine-500">Este intento no tiene respuestas registradas.</p>
                                      } @else {
                                        <ul class="space-y-1">
                                          @for (d of detalle(); track d.id) {
                                            <li class="flex items-start gap-2 text-xs">
                                              <span class="font-bold" [class.text-success-700]="d.es_correcta" [class.text-danger-700]="!d.es_correcta">{{ d.es_correcta ? '✓' : '✗' }}</span>
                                              <span class="min-w-0 flex-1 break-words">{{ d.pregunta?.enunciado ?? 'Pregunta eliminada' }}</span>
                                              <span class="shrink-0 text-marine-500">{{ d.puntaje_otorgado ?? 0 }}/{{ d.pregunta?.puntos ?? 1 }}</span>
                                            </li>
                                          }
                                        </ul>
                                      }
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                            <!-- Tabla en pantallas medianas o superiores -->
                            <div class="mt-2 hidden overflow-x-auto sm:block">
                              <table class="table min-w-[720px]">
                                <thead>
                                  <tr>
                                    <th>Estudiante</th><th>Intento</th><th>Estado</th>
                                    <th>Puntaje</th><th>Nota / 20</th><th>Resultado</th><th>Finalizado</th><th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (r of resultados(); track r.id) {
                                    <tr>
                                      <td class="font-medium text-marine-800">
                                        {{ r.estudiante?.nombre }} {{ r.estudiante?.apellido }}
                                        <span class="block text-[0.7rem] text-marine-400">{{ r.estudiante?.email }}</span>
                                      </td>
                                      <td>{{ r.numero }}</td>
                                      <td>{{ r.estado.replace('_',' ') }}</td>
                                      <td>{{ r.puntaje ?? 0 }} / {{ r.puntaje_maximo ?? 0 }}</td>
                                      <td>{{ notaIntento(r) }}</td>
                                      <td>
                                        <span class="badge" [ngClass]="r.aprobado ? 'badge-success' : 'badge-danger'">{{ r.aprobado ? 'Aprobado' : (r.aprobado === null ? 'Pendiente' : 'Desaprobado') }}</span>
                                      </td>
                                      <td>{{ r.tiempo_fin ? (r.tiempo_fin | date:'short') : '—' }}</td>
                                      <td><button type="button" class="btn btn-outline btn-sm" (click)="toggleDetalle(r.id)">{{ detalleAbiertoId() === r.id ? 'Ocultar' : 'Detalle' }}</button></td>
                                    </tr>
                                    @if (detalleAbiertoId() === r.id) {
                                      <tr>
                                        <td colspan="8">
                                          @if (cargandoDetalle()) {
                                            <p class="text-sm text-marine-500">Cargando detalle…</p>
                                          } @else if (detalle().length === 0) {
                                            <p class="text-sm text-marine-500">Este intento no tiene respuestas registradas.</p>
                                          } @else {
                                            <ul class="space-y-1">
                                              @for (d of detalle(); track d.id) {
                                                <li class="flex flex-wrap items-start gap-2 rounded-lg border border-surface-200 p-2 text-sm">
                                                  <span class="font-semibold" [class.text-success-700]="d.es_correcta" [class.text-danger-700]="!d.es_correcta">{{ d.es_correcta ? '✓' : '✗' }}</span>
                                                  <span class="min-w-0 flex-1">{{ d.pregunta?.enunciado ?? 'Pregunta eliminada' }}</span>
                                                  <span class="text-xs text-marine-500">{{ d.puntaje_otorgado ?? 0 }} / {{ d.pregunta?.puntos ?? 1 }} pts</span>
                                                </li>
                                              }
                                            </ul>
                                          }
                                        </td>
                                      </tr>
                                    }
                                  }
                                </tbody>
                              </table>
                            </div>
                          }
                          <p class="mt-2 text-xs text-marine-400">Solo lectura: las calificaciones las genera el backend y no se pueden modificar desde aquí.</p>
                        </div>
                      }

                      @if (calificarAbiertaId() === e.id) {
                        <div class="mt-3 rounded-xl border border-brand-200 bg-white p-3">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="min-w-0">
                              <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Calificar — estudiantes matriculados</p>
                              <p class="mt-0.5 text-[0.7rem] text-marine-400">Plazo de acceso: {{ e.fecha_limite_acceso ? (e.fecha_limite_acceso | date:'short') : 'sin límite' }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                              <button type="button" class="btn btn-outline btn-sm" (click)="cargarRoster(e)">Actualizar</button>
                              <button type="button" class="btn btn-outline btn-sm" [disabled]="exportando()" (click)="exportarEvaluacion(e)">Excel</button>
                            </div>
                          </div>
                          @if (cargandoRoster()) {
                            <p class="mt-2 text-sm text-marine-500">Cargando estudiantes…</p>
                          } @else if (errorRoster(); as err) {
                            <p class="mt-2 rounded-lg border border-danger-200 bg-danger-50 p-2 text-sm text-danger-700">{{ err }}</p>
                          } @else if (roster().length === 0) {
                            <p class="mt-2 text-sm text-marine-500">No hay estudiantes matriculados activos en este curso.</p>
                          } @else {
                            <ul class="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              @for (f of roster(); track f.estudianteId) {
                                <li class="rounded-xl border border-surface-200 bg-surface-50 p-3">
                                  <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                      <p class="break-words text-sm font-semibold text-marine-800">{{ f.nombre }}</p>
                                      <p class="break-all text-[0.7rem] text-marine-400">{{ f.email }}</p>
                                    </div>
                                    <span class="badge shrink-0" [ngClass]="clasesEstado[f.estado]">{{ etiquetasEstado[f.estado] }}</span>
                                  </div>
                                  <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-marine-500">
                                    @if (f.nota !== null) { <span><strong class="text-marine-700">{{ f.nota }}</strong> / {{ f.notaMaxima ?? '—' }} pts</span> }
                                    @if (f.numero !== null) { <span>Intento {{ f.numero }}</span> }
                                    @if (f.fecha) { <span>{{ f.fecha | date:'short' }}</span> }
                                  </div>
                                </li>
                              }
                            </ul>
                          }
                          <p class="mt-2 text-xs text-marine-400">«No entregado» aparece cuando el plazo ya terminó y el estudiante no dejó ningún intento.</p>
                        </div>
                      }
                          </li>
                        }
                      </ul>
                    </li>
                  }
                </ul>
              }

              <!-- ════ EDITOR DE PREGUNTAS (modal: se abre donde estés) ════ -->
              @if (evaluacionSel(); as sel) {
                <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-marine-900/70 p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" [attr.aria-label]="'Preguntas de ' + sel.actividad.titulo" (click)="cerrarEditor()">
                  <div class="relative max-h-[95vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6" (click)="$event.stopPropagation()">
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 pb-3">
                    <div>
                      <p class="text-[0.7rem] font-bold uppercase tracking-wider text-marine-400">Editando preguntas</p>
                      <h3 class="text-base font-extrabold text-marine-800">{{ sel.actividad.titulo }}</h3>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" (click)="cerrarEditor()">Cerrar ✕</button>
                  </div>

                  <!-- Preguntas existentes -->
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-marine-400">{{ preguntas().length }} pregunta(s)</p>
                    <ol class="mt-2 space-y-2">
                      @for (p of preguntas(); track p.id) {
                        <li class="rounded-xl border border-surface-200 p-3">
                          <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                              <p class="break-words text-sm font-semibold text-marine-800"><span class="mr-1 text-marine-400">{{ p.orden }}.</span>{{ p.enunciado }}</p>
                              <ul class="mt-2 space-y-1 text-sm">
                                @for (o of p.opciones; track o.id; let i = $index) {
                                  <li class="flex items-center gap-2"
                                    [class.font-semibold]="o.es_correcta"
                                    [class.text-brand-700]="o.es_correcta">
                                    <span class="flex h-6 w-6 items-center justify-center rounded-full border border-surface-200 text-[0.65rem] font-extrabold">{{ 'ABCDEF'[i] }}</span>
                                    <span class="min-w-0 break-words">{{ o.texto }}</span>
                                    @if (o.es_correcta) { <span class="text-xs font-bold text-success-700">✓ correcta</span> }
                                  </li>
                                }
                              </ul>
                            </div>
                            <button type="button" class="btn btn-outline btn-sm shrink-0 text-danger-700" [disabled]="p.id.startsWith('local-')" (click)="eliminarPregunta(p)" [title]="p.id.startsWith('local-') ? 'Guardando…' : 'Eliminar la pregunta'">Eliminar</button>
                          </div>
                        </li>
                      } @empty {
                        <p class="text-sm text-marine-500">Aún no hay preguntas. Agrega la primera.</p>
                      }
                    </ol>
                  </div>

                  <!-- Agregar pregunta (opción única / V·F) -->
                  <div class="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
                    <p class="text-sm font-extrabold text-marine-800">Nueva pregunta</p>
                    <div>
                      <label class="label" for="preg-enunciado">Enunciado</label>
                      <input id="preg-enunciado" class="input" [value]="enunciado()" (input)="enunciado.set($any($event.target).value)" placeholder="Escribe la pregunta…" />
                    </div>
                    <div class="grid gap-2 sm:grid-cols-4">
                      <div class="sm:col-span-1">
                        <label class="label" for="tipo-preg">Tipo</label>
                        <select id="tipo-preg" class="select" [value]="tipoPregunta()" (change)="cambiarTipoPregunta($any($event.target).value)">
                          <option value="opcion_unica">Opción única</option>
                          <option value="verdadero_falso">Verdadero / Falso</option>
                        </select>
                      </div>
                      <div class="sm:col-span-3">
                        <label class="label" for="retro-preg">Explicación (opcional)</label>
                        <input id="retro-preg" class="input" [value]="retroalimentacion()" (input)="retroalimentacion.set($any($event.target).value)" placeholder="Se muestra al estudiante después de responder." />
                      </div>
                    </div>
                    @if (tipoPregunta() === 'opcion_unica') {
                      <div>
                        <span class="label text-xs uppercase tracking-wider text-marine-600">Opciones (marca la correcta)</span>
                        <div class="mt-1 grid gap-2 sm:grid-cols-2">
                          @for (op of opciones(); track $index; let i = $index) {
                            <div class="opcion-row">
                              <input type="radio" class="correcta-mark" [name]="'correcta-' + $index" [checked]="respuestaCorrecta() === i" (change)="respuestaCorrecta.set(i)" [attr.aria-label]="'Opción ' + (i + 1) + ' correcta'" />
                              <input class="input" [value]="op" (input)="setOpcionTexto(i, $any($event.target).value)" [placeholder]="'Opción ' + (i + 1)" />
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div>
                        <span class="label">La respuesta correcta es</span>
                        <div class="mt-1 flex gap-2">
                          <button type="button" class="btn btn-outline" [class.ring-2]="respuestaCorrecta() === 0" [class.bg-brand-50]="respuestaCorrecta() === 0" (click)="respuestaCorrecta.set(0)">Verdadero</button>
                          <button type="button" class="btn btn-outline" [class.ring-2]="respuestaCorrecta() === 1" [class.bg-brand-50]="respuestaCorrecta() === 1" (click)="respuestaCorrecta.set(1)">Falso</button>
                        </div>
                      </div>
                    }
                    <div class="flex items-center justify-end gap-2 border-t border-brand-100 pt-3">
                      <button type="button" class="btn btn-primary" (click)="agregarPregunta()">Agregar pregunta</button>
                    </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
          <p class="text-xs text-marine-400">Las evaluaciones se guardan como actividades de lección de tipo cuestionario o examen; sus preguntas y opciones quedan archivadas y marcadas la correcta. La publicación controla si tus estudiantes las ven.</p>
      }
    </section>
  `,
})
export class EvaluationsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly gradebook = inject(GradebookService);
  private readonly excel = inject(ExcelExportService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);

  protected readonly cursos = signal<{ curso: Curso }[]>([]);
  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly mensaje = signal<{ ok: boolean; texto: string } | null>(null);
  /** Mínimo permitido en los pickers de fecha (ahora, hora local). */
  protected readonly minFecha = signal(ahoraLocalInput());
  protected actualizarMin(): void { this.minFecha.set(ahoraLocalInput()); }

  protected readonly cursoSel = signal('');
  protected readonly leccionIdSel = signal('');
  protected readonly lecciones = signal<{ id: string; titulo: string; unidadNumero: number }[]>([]);
  protected readonly evaluaciones = signal<EvaluacionGestion[]>([]);

  /** Evaluaciones agrupadas por lección; si hay una lección elegida, solo esa. */
  protected readonly gruposEvaluaciones = computed<GrupoEvaluacion[]>(() => {
    const leccionId = this.leccionIdSel();
    const items = this.evaluaciones();
    const visibles = leccionId ? items.filter((e) => e.actividad?.leccion_id === leccionId) : items;
    const tituloDe = (id: string) => {
      const l = this.lecciones().find((x) => x.id === id);
      return l ? `U${l.unidadNumero} · ${l.titulo}` : 'Sin lección asignada';
    };
    if (leccionId) {
      return [{ id: leccionId, titulo: tituloDe(leccionId), items: visibles }];
    }
    const map = new Map<string, GrupoEvaluacion>();
    for (const e of visibles) {
      const id = e.actividad?.leccion_id || 'sin-leccion';
      let grupo = map.get(id);
      if (!grupo) {
        grupo = { id, titulo: tituloDe(id), items: [] };
        map.set(id, grupo);
      }
      grupo.items.push(e);
    }
    return [...map.values()];
  });
  protected readonly evaluacionesVisibles = computed(() =>
    this.gruposEvaluaciones().flatMap((g) => g.items),
  );

  // Editor de preguntas
  protected readonly evaluacionSel = signal<(Evaluacion & { actividad: Actividad }) | null>(null);
  /** Edicion inline de la ventana de acceso (una tarjeta a la vez). */
  protected readonly editandoVentanaId = signal<string | null>(null);
  protected readonly editInicio = signal('');
  protected readonly editLimite = signal('');
  protected readonly preguntas = signal<(Pregunta & { opciones: Opcion[] })[]>([]);
  protected readonly enunciado = signal('');
  protected readonly retroalimentacion = signal('');
  protected readonly tipoPregunta = signal<TipoPreguntaNuevo>('opcion_unica');
  protected readonly opciones = signal<string[]>(['', '', '', '']);
  protected readonly respuestaCorrecta = signal(0);

  // Resultados de los estudiantes (solo lectura, autorizado por RLS)
  protected readonly resultadosAbiertosId = signal<string | null>(null);
  protected readonly resultados = signal<ResultadoDocente[]>([]);
  protected readonly cargandoResultados = signal(false);
  protected readonly errorResultados = signal<string | null>(null);
  protected readonly detalleAbiertoId = signal<string | null>(null);
  protected readonly detalle = signal<RespuestaDetalle[]>([]);
  protected readonly cargandoDetalle = signal(false);

  // Listado "Calificar" (todos los matriculados)
  protected readonly calificarAbiertaId = signal<string | null>(null);
  protected readonly roster = signal<FilaCalificacion[]>([]);
  protected readonly cargandoRoster = signal(false);
  protected readonly errorRoster = signal<string | null>(null);
  protected readonly exportando = signal(false);
  protected readonly etiquetasEstado: Record<EstadoCalificacion, string> = {
    pendiente: 'Pendiente',
    no_entregado: 'No entregado',
    en_curso: 'En curso',
    entregado: 'Entregado',
    por_calificar: 'Por calificar',
    calificada: 'Calificada',
  };
  protected readonly clasesEstado: Record<EstadoCalificacion, string> = {
    pendiente: 'badge-neutral',
    no_entregado: 'badge-danger',
    en_curso: 'badge-warning',
    entregado: 'badge-success',
    por_calificar: 'badge-warning',
    calificada: 'badge-success',
  };

  protected readonly formCrear = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    tipo: ['quiz' as TipoEvaluacion, Validators.required],
    instrucciones: [''],
    tiempoMin: [0, [Validators.min(0), Validators.max(600)]],
    intentos: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    aprobacion: [12, [Validators.required, Validators.min(0), Validators.max(20)]],
    xp: [50, [Validators.required, Validators.min(0)]],
    publicado: [true],
    fechaInicio: [''],
    fechaLimiteAcceso: [''],
  });

  private readonly valoresForm = toSignal(this.formCrear.valueChanges, { initialValue: this.formCrear.getRawValue() });
  protected readonly errInicio = computed(() =>
    errorFechaPasada(this.valoresForm().fechaInicio, 'La fecha de inicio'),
  );
  protected readonly errLimite = computed(() =>
    errorFechaPasada(this.valoresForm().fechaLimiteAcceso, 'El límite de acceso')
    ?? errorOrdenFechas(this.valoresForm().fechaInicio, this.valoresForm().fechaLimiteAcceso, 'El límite de acceso'),
  );

  // En la edición se tolera una fecha pasada si es la que ya estaba guardada.
  protected readonly errEditInicio = computed(() => {
    const e = this.evaluacionSel();
    const valor = this.editInicio();
    const sinCambiar = !!e?.fecha_inicio && this.aLocalInput(e.fecha_inicio) === valor;
    return sinCambiar ? null : errorFechaPasada(valor, 'La fecha de inicio');
  });
  protected readonly errEditLimite = computed(() => {
    const e = this.evaluacionSel();
    const valor = this.editLimite();
    const sinCambiar = !!e?.fecha_limite_acceso && this.aLocalInput(e.fecha_limite_acceso) === valor;
    return (sinCambiar ? null : errorFechaPasada(valor, 'El límite de acceso'))
      ?? errorOrdenFechas(this.editInicio(), valor, 'El límite de acceso');
  });

  ngOnInit(): void { void this.cargar(); }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.mensaje.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.cargando.set(false); return; }
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (cursos.length) {
        this.cursoSel.set(cursos[0].curso.id);
        await this.cargarEstructuraYEvaluaciones(cursos[0].curso.id);
      }
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los cursos.' });
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarCurso(cursoId: string): Promise<void> {
    if (cursoId === this.cursoSel()) return;
    this.cursoSel.set(cursoId);
    this.leccionIdSel.set('');
    this.evaluacionSel.set(null);
    this.preguntas.set([]);
    this.resultadosAbiertosId.set(null);
    this.resultados.set([]);
    this.detalleAbiertoId.set(null);
    this.detalle.set([]);
    this.errorResultados.set(null);
    this.calificarAbiertaId.set(null);
    this.roster.set([]);
    this.errorRoster.set(null);
    await this.cargarEstructuraYEvaluaciones(cursoId);
  }

  private async cargarEstructuraYEvaluaciones(cursoId: string): Promise<void> {
    try {
      const est = await this.courseService.obtenerEstructuraGestion(cursoId);
      const ls: { id: string; titulo: string; unidadNumero: number }[] = [];
      for (const u of est.unidades)
        for (const m of u.modulos)
          for (const l of m.lecciones) {
            ls.push({ id: l.id, titulo: l.titulo, unidadNumero: u.numero });
          }
      this.lecciones.set(ls);

      const items = await this.evaluationService.listarEvaluacionesGestion(cursoId);
      this.evaluaciones.set(items);
    } catch (e) {
      this.lecciones.set([]);
      this.evaluaciones.set([]);
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cargar el contenido del curso.' });
    }
  }

  protected async crearEvaluacion(): Promise<void> {
    if (this.formCrear.invalid) { this.formCrear.markAllAsTouched(); return; }
    const leccionId = this.leccionIdSel();
    const cursoId = this.cursoSel();
    if (!leccionId) { this.mensaje.set({ ok: false, texto: 'Selecciona una lección para asociar la evaluación.' }); return; }

    const v = this.formCrear.getRawValue();
    const errorFechas = validarVentanaFechas(v.fechaInicio, v.fechaLimiteAcceso, {
      etiquetaInicio: 'La fecha de inicio',
      etiquetaFin: 'El límite de acceso',
    });
    if (errorFechas) { this.mensaje.set({ ok: false, texto: errorFechas }); return; }
    const fechaInicio = this.aIso(v.fechaInicio);
    const fechaLimiteAcceso = this.aIso(v.fechaLimiteAcceso);
    this.creando.set(true);
    this.mensaje.set(null);
    try {
      const creada = await this.evaluationService.crearEvaluacion({
        cursoId,
        leccionId,
        titulo: v.titulo,
        tipo: v.tipo,
        instrucciones: v.instrucciones || null,
        tiempoLimiteMinutos: v.tiempoMin || null,
        intentosPermitidos: v.intentos,
        porcentajeAprobacion: v.aprobacion,
        xpOtorgado: v.xp,
        publicado: v.publicado,
        fechaInicio,
        fechaLimiteAcceso,
      });
      this.evaluaciones.update((arr) => [creada, ...arr]);
      await this.abrirEditorDePreguntas(creada);
      this.formCrear.reset({ tipo: v.tipo, tiempoMin: 0, intentos: 1, aprobacion: 12, xp: v.xp, publicado: true, instrucciones: '', titulo: '', fechaInicio: '', fechaLimiteAcceso: '' });
      this.mensaje.set({ ok: true, texto: 'Evaluación creada. Ahora agrega sus preguntas.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo crear la evaluación.' });
    } finally {
      this.creando.set(false);
    }
  }

  protected async abrirEditorDePreguntas(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    this.evaluacionSel.set(e);
    this.enunciado.set('');
    this.retroalimentacion.set('');
    this.tipoPregunta.set('opcion_unica');
    this.opciones.set(['', '', '', '']);
    this.respuestaCorrecta.set(0);
    this.preguntas.set(await this.evaluationService.listarPreguntasConOpciones(e.id).catch(() => []));
  }

  protected cerrarEditor(): void {
    this.evaluacionSel.set(null);
    this.preguntas.set([]);
  }

  // === RESULTADOS DE ESTUDIANTES (solo lectura) ===

  protected async toggleResultados(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    if (this.resultadosAbiertosId() === e.id) {
      this.resultadosAbiertosId.set(null);
      this.resultados.set([]);
      this.detalleAbiertoId.set(null);
      this.detalle.set([]);
      this.errorResultados.set(null);
      return;
    }
    this.resultadosAbiertosId.set(e.id);
    this.detalleAbiertoId.set(null);
    this.detalle.set([]);
    await this.cargarResultados(e);
  }

  protected async cargarResultados(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    this.cargandoResultados.set(true);
    this.errorResultados.set(null);
    try {
      this.resultados.set(await this.evaluationService.listarResultadosDocente(e.id));
    } catch (err) {
      this.resultados.set([]);
      this.errorResultados.set(err instanceof Error ? err.message : 'No se pudieron cargar los resultados.');
    } finally {
      this.cargandoResultados.set(false);
    }
  }

  protected async toggleDetalle(intentoId: string): Promise<void> {
    if (this.detalleAbiertoId() === intentoId) {
      this.detalleAbiertoId.set(null);
      this.detalle.set([]);
      return;
    }
    this.detalleAbiertoId.set(intentoId);
    this.detalle.set([]);
    this.cargandoDetalle.set(true);
    try {
      this.detalle.set(await this.evaluationService.listarRespuestasIntento(intentoId));
    } catch (err) {
      this.errorResultados.set(err instanceof Error ? err.message : 'No se pudo cargar el detalle del intento.');
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  /** Nota del intento en la escala oficial 0 a 20. */
  protected notaIntento(r: ResultadoDocente): string {
    const maximo = Number(r.puntaje_maximo ?? 0);
    if (maximo <= 0) return '—';
    return (Math.round((Number(r.puntaje ?? 0) / maximo) * 20 * 100) / 100).toFixed(2);
  }

  protected async toggleCalificar(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    if (this.calificarAbiertaId() === e.id) {
      this.calificarAbiertaId.set(null);
      this.roster.set([]);
      this.errorRoster.set(null);
      return;
    }
    this.calificarAbiertaId.set(e.id);
    await this.cargarRoster(e);
  }

  protected async cargarRoster(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    this.cargandoRoster.set(true);
    this.errorRoster.set(null);
    try {
      this.roster.set(await this.gradebook.listarRoster(this.cursoSel(), e.id, 'evaluacion'));
    } catch (err) {
      this.roster.set([]);
      this.errorRoster.set(err instanceof Error ? err.message : 'No se pudo cargar el listado de estudiantes.');
    } finally {
      this.cargandoRoster.set(false);
    }
  }

  private nombreCurso(): string {
    return this.cursos().find((c) => c.curso.id === this.cursoSel())?.curso.titulo ?? 'Curso';
  }

  protected async exportarEvaluacion(e: EvaluacionGestion): Promise<void> {
    await this.exportar([e]);
  }

  protected async exportarTodas(): Promise<void> {
    await this.exportar(this.evaluaciones());
  }

  private async exportar(items: EvaluacionGestion[]): Promise<void> {
    if (!items.length || this.exportando()) return;
    this.exportando.set(true);
    this.mensaje.set(null);
    try {
      const curso = this.nombreCurso();
      const hojas = await Promise.all(items.map(async (e) => ({
        nombre: e.actividad.titulo,
        tipo: 'Evaluación' as const,
        actividad: e.actividad.titulo,
        curso,
        fechaLimite: e.fecha_limite_acceso,
        filas: await this.gradebook.listarRoster(this.cursoSel(), e.id, 'evaluacion'),
      })));
      await this.excel.exportar(`Notas_Evaluaciones_${curso}`, hojas);
      this.mensaje.set({ ok: true, texto: `Excel generado con ${hojas.length} evaluación(es) y todos sus estudiantes.` });
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo generar el Excel.' });
    } finally {
      this.exportando.set(false);
    }
  }

  /** datetime-local (hora local) -> ISO UTC. */
  protected aIso(valor: string | null | undefined): string | null {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
  }

  /** ISO UTC -> valor de input datetime-local (hora local del docente). */
  protected aLocalInput(iso: string | null | undefined): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '';
    return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }

  /** Etiqueta y color de la ventana de acceso para el listado. */
  protected estadoVentana(e: Evaluacion): { texto: string; clase: string } {
    const inicio = e.fecha_inicio ? new Date(e.fecha_inicio).getTime() : null;
    const limite = e.fecha_limite_acceso ? new Date(e.fecha_limite_acceso).getTime() : null;
    const ahora = Date.now();
    if (inicio !== null && ahora < inicio) return { texto: 'PRÓXIMA', clase: 'badge-warning' };
    if (limite !== null && ahora > limite) return { texto: 'CERRADA', clase: 'badge-danger' };
    if (inicio === null && limite === null) return { texto: 'SIEMPRE ABIERTA', clase: 'badge-neutral' };
    return { texto: 'EN CURSO', clase: 'badge-success' };
  }

  protected abrirEdicionVentana(e: Evaluacion & { actividad: Actividad }): void {
    this.editandoVentanaId.set(e.id);
    this.editInicio.set(this.aLocalInput(e.fecha_inicio));
    this.editLimite.set(this.aLocalInput(e.fecha_limite_acceso));
  }

  protected cancelarEdicionVentana(): void {
    this.editandoVentanaId.set(null);
  }

  protected async guardarVentana(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    const errorFechas = validarVentanaFechas(this.editInicio(), this.editLimite(), {
      etiquetaInicio: 'La fecha de inicio',
      etiquetaFin: 'El límite de acceso',
      // Permite conservar fechas ya guardadas en el pasado si no se cambian.
      originalInicio: e.fecha_inicio,
      originalFin: e.fecha_limite_acceso,
    });
    if (errorFechas) { this.mensaje.set({ ok: false, texto: errorFechas }); return; }
    const inicio = this.aIso(this.editInicio());
    const limite = this.aIso(this.editLimite());
    try {
      await this.evaluationService.actualizarVentanaAcceso(e.id, inicio, limite);
      this.evaluaciones.update((arr) => arr.map((x) => x.id === e.id ? { ...x, fecha_inicio: inicio, fecha_limite_acceso: limite } : x));
      this.evaluacionSel.update((sel) => sel && sel.id === e.id ? { ...sel, fecha_inicio: inicio, fecha_limite_acceso: limite } : sel);
      this.editandoVentanaId.set(null);
      this.mensaje.set({ ok: true, texto: 'Ventana de acceso actualizada.' });
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo actualizar la ventana de acceso.' });
    }
  }

  protected async togglePublicada(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    const nuevo = !e.actividad.publicado;
    try {
      await this.evaluationService.togglePublicada(e.actividad.id, nuevo);
      this.evaluaciones.update((arr) =>
        arr.map((x) => x.id === e.id ? { ...x, actividad: { ...x.actividad, publicado: nuevo } } : x),
      );
      if (this.evaluacionSel()?.id === e.id) {
        this.evaluacionSel.update((sel) => sel ? { ...sel, actividad: { ...sel.actividad, publicado: nuevo } } : sel);
      }
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado de publicación.' });
    }
  }

  protected cambiarTipoPregunta(v: string): void {
    if (v !== 'opcion_unica' && v !== 'verdadero_falso') return;
    this.tipoPregunta.set(v);
    this.respuestaCorrecta.set(0);
    if (v === 'verdadero_falso') {
      this.opciones.set(['Verdadero', 'Falso']);
    } else if (this.opciones().length !== 4) {
      this.opciones.set(['', '', '', '']);
    }
  }

  protected setOpcionTexto(i: number, valor: string): void {
    this.opciones.update((arr) => arr.map((o, idx) => (idx === i ? valor : o)));
  }

  protected async agregarPregunta(): Promise<void> {
    const sel = this.evaluacionSel();
    if (!sel) {
      this.mensaje.set({ ok: false, texto: 'Selecciona una evaluación primero.' });
      return;
    }
    if (!this.enunciado().trim()) {
      this.mensaje.set({ ok: false, texto: 'Escribe el enunciado de la pregunta.' });
      return;
    }
    const tipo = this.tipoPregunta();
    const opcionesTodas = tipo === 'verdadero_falso'
      ? ['Verdadero', 'Falso']
      : this.opciones().map((o) => o.trim());
    if (tipo === 'opcion_unica' && opcionesTodas.some((o) => !o)) {
      this.mensaje.set({ ok: false, texto: 'Todas las opciones deben tener texto.' });
      return;
    }
    if (this.respuestaCorrecta() < 0 || this.respuestaCorrecta() >= opcionesTodas.length) {
      this.mensaje.set({ ok: false, texto: 'Marca cuál de las opciones es la correcta.' });
      return;
    }
    try {
      // Igual que el servidor: el siguiente orden es max+1 (nunca length+1,
      // porque borrar crea huecos que rompen el UNIQUE(evaluacion_id, orden)).
      const orden = this.preguntas().reduce((m, p) => Math.max(m, p.orden ?? 0), 0) + 1;
      // Optimista: la lista se actualiza en pantalla aunque el refresco
      // desde el servidor falle después.
      const nuevaPregunta: Pregunta & { opciones: Opcion[] } = {
        id: `local-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        evaluacion_id: sel.id,
        orden,
        tipo,
        enunciado: this.enunciado().trim(),
        descripcion: null,
        puntos: 1,
        es_privada: false,
        requiere_revision: false,
        retroalimentacion: this.retroalimentacion().trim() || null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        opciones: opcionesTodas.map((texto, i) => ({
          id: `local-opc-${Date.now()}-${i}`,
          pregunta_id: 'local',
          orden: i + 1,
          texto,
          es_correcta: i === this.respuestaCorrecta(),
          valor: null,
          created_en: new Date().toISOString(),
        })),
      };
      await this.evaluationService.agregarPregunta({
        evaluacionId: sel.id,
        orden,
        tipo,
        enunciado: nuevaPregunta.enunciado,
        retroalimentacion: nuevaPregunta.retroalimentacion,
        opciones: opcionesTodas,
        respuestaCorrecta: this.respuestaCorrecta(),
      });
      // Limpia el editor para el siguiente enunciado.
      this.enunciado.set('');
      this.retroalimentacion.set('');
      this.opciones.set(tipo === 'verdadero_falso' ? ['Verdadero', 'Falso'] : ['', '', '', '']);
      this.respuestaCorrecta.set(0);
      // Optimista primero; servidor después (reemplaza los ids locales por los reales).
      this.preguntas.update((arr) => [...arr, nuevaPregunta]);
      const reales = await this.evaluationService.listarPreguntasConOpciones(sel.id).catch(() => null);
      if (reales) {
        this.preguntas.set(reales);
        this.mensaje.set({ ok: true, texto: 'Pregunta agregada correctamente.' });
      } else {
        this.mensaje.set({ ok: true, texto: 'Pregunta agregada. No se pudo refrescar la lista completa; recárgala para ver los identificadores reales.' });
      }
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo agregar la pregunta.' });
    }
  }

  protected async eliminarPregunta(p: Pregunta & { opciones: Opcion[] }): Promise<void> {
    const sel = this.evaluacionSel();
    if (!sel) return;
    const confirmado = await this.confirm.ask({ title: 'Eliminar pregunta', mensaje: `¿Eliminar la pregunta "${p.enunciado.substring(0, 80)}"? Se borrarán también sus opciones y respuestas registradas.`, textoConfirmar: 'Eliminar' });
    if (!confirmado) return;
    try {
      await this.evaluationService.eliminarPregunta(p.id);
      this.preguntas.set(await this.evaluationService.listarPreguntasConOpciones(sel.id));
      this.mensaje.set({ ok: true, texto: 'Pregunta eliminada.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar la pregunta.' });
    }
  }

  protected async eliminarEvaluacion(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    const confirmado = await this.confirm.ask({ title: 'Eliminar evaluación', mensaje: `¿Eliminar la evaluación "${e.actividad.titulo}"? Esta acción no se puede deshacer y borra sus preguntas.`, textoConfirmar: 'Eliminar' });
    if (!confirmado) return;
    try {
      await this.evaluationService.eliminarEvaluacion(e.actividad.id, e.id);
      this.evaluaciones.update((arr) => arr.filter((x) => x.id !== e.id));
      if (this.evaluacionSel()?.id === e.id) this.cerrarEditor();
      this.mensaje.set({ ok: true, texto: 'Evaluación eliminada.' });
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo eliminar la evaluación.' });
    }
  }
}
