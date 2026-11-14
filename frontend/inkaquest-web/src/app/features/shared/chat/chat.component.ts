// @ts-nocheck
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MessageService, HiloResumen, MiembroCurso } from '../../../core/services/message.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { CourseService } from '../../../core/services/course.service';
import { Mensaje, Perfil, Curso } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type Tab = 'conversaciones' | 'miembros';

const COLORES_AVATAR = ['#12736b', '#f2a541', '#d6143f', '#2b6cb0', '#1b2a4a', '#17915b', '#8b5cf6', '#475569'];

/**
 * Chat 1 a 1 estilo Messenger para alumno ↔ docente y miembros del curso.
 *
 * <p>Diseño de dos columnas:</p>
 * <ul>
 *   <li>Izquierda: pestañas Conversaciones/Miembros con búsqueda en vivo,
 *       selector de curso, marcas de no leídos y avatar con iniciales.</li>
 *   <li>Derecha: conversación con separadores por día, burbujas agrupadas,
 *       ticks de enviado/leído y envío en vivo (Supabase Realtime).</li>
 * </ul>
 */
@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <section class="flex h-[calc(100vh-6.5rem)] min-h-[480px] flex-col gap-3">
      <app-page-header titulo="Mensajes" descripcion="Habla con tu docente o con tus compañeros del curso. Todo queda entre tú y el destinatario." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          @if (totalNoLeidos() > 0) {
            <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-extrabold text-brand-700">
              <span class="flex size-4 items-center justify-center rounded-full bg-brand-500 text-[0.6rem] text-white">{{ totalNoLeidos() > 9 ? '9+' : totalNoLeidos() }}</span>
              {{ totalNoLeidos() === 1 ? 'sin leer' : 'sin leer' }}
            </span>
          }
          @if (soyDocente() && cursoSel()) {
            <button type="button" class="btn btn-gold btn-sm" (click)="toggleGrupo()" [attr.aria-expanded]="enviarGrupoAbierto()" aria-controls="panel-grupo">Enviar al grupo</button>
          }
          <button type="button" class="btn btn-outline btn-sm" (click)="refrescar()" [disabled]="cargando()" aria-label="Actualizar conversaciones">Actualizar</button>
        </div>
      </app-page-header>

      @if (enviarGrupoAbierto() && soyDocente() && cursoSel(); as _sc) {
        <div id="panel-grupo" class="card card-body space-y-3 border-gold-400/60">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-bold uppercase tracking-wide text-marine-700">Mensaje a todo el curso</h2>
            <span class="rounded-full bg-gold-100 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-gold-700">Este mensaje lo recibirán TODOS los estudiantes activos del curso</span>
          </div>
          <textarea class="input min-h-[100px]" maxlength="2000" placeholder="Escribe el anuncio para el grupo..." [value]="cuerpoGrupo()" (input)="cuerpoGrupo.set($any($event.target).value)" aria-label="Palabra al grupo"></textarea>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-marine-500">{{ cuerpoGrupo().trim().length }}/2000 · Envío auditable.</p>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="btn btn-outline btn-sm" (click)="toggleGrupo()" [disabled]="enviandoGrupo()">Cancelar</button>
              <button type="button" class="btn btn-gold btn-sm" (click)="enviarGrupo()" [disabled]="enviandoGrupo() || cuerpoGrupo().trim().length < 1">{{ enviandoGrupo() ? 'Enviando…' : 'Enviar al grupo' }}</button>
            </div>
          </div>
          @if (resultadoGrupo(); as r) {
            <p class="rounded-lg p-2.5 text-sm" [class.bg-success-50]="r.ok" [class.text-success-600]="r.ok" [class.bg-danger-50]="!r.ok" [class.text-danger-700]="!r.ok" role="status">{{ r.mensaje }}</p>
          }
        </div>
      }

      <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-12">
        <!-- ================= LISTA (oculta en móvil cuando hay hilo abierto) ================= -->
        <aside class="col-span-12 min-h-0 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card lg:col-span-4 lg:flex" [class.hidden]="hiloAbierto() && esMovil()" [class.flex]="!hiloAbierto() || !esMovil()">
          <div class="space-y-2 border-b border-surface-100 p-3">
            <!-- Selector de curso -->
            @if (misCursos().length > 1) {
              <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-marine-500" for="selector-curso">Curso</label>
              <select id="selector-curso" class="select text-sm" [value]="cursoSel() ?? ''" (change)="onCurso($event)" aria-label="Elige el curso">
                <option value="">Todos los chats</option>
                @for (c of misCursos(); track c.id) {
                  <option [value]="c.id">{{ c.titulo }}</option>
                }
              </select>
            } @else if (cursoActual(); as c) {
              <p class="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-marine-700">
                <svg class="size-4 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h8l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>
                <span class="truncate">{{ c.titulo }}</span>
              </p>
            }

            <!-- Pestañas Conversaciones / Miembros -->
            <div class="grid grid-cols-2 gap-1 rounded-xl bg-surface-100 p-1" role="tablist" aria-label="Vista de la lista">
              <button type="button" role="tab" [attr.aria-selected]="tab() === 'conversaciones'" class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors" [class.bg-white]="tab() === 'conversaciones'" [class.text-marine-800]="tab() === 'conversaciones'" [class.shadow-sm]="tab() === 'conversaciones'" [class.text-marine-500]="tab() !== 'conversaciones'" (click)="tab.set('conversaciones')">Conversaciones @if (hilos().length > 0) { <span class="ml-1 text-[0.6rem] font-extrabold text-marine-400">({{ hilos().length }})</span> }</button>
              <button type="button" role="tab" [attr.aria-selected]="tab() === 'miembros'" class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors" [class.bg-white]="tab() === 'miembros'" [class.text-marine-800]="tab() === 'miembros'" [class.shadow-sm]="tab() === 'miembros'" [class.text-marine-500]="tab() !== 'miembros'" (click)="tab.set('miembros')">Miembros @if (miembrosFiltrados().length > 0) { <span class="ml-1 text-[0.6rem] font-extrabold text-marine-400">({{ miembrosFiltrados().length }})</span> }</button>
            </div>

            <!-- Buscador -->
            <div class="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
              <svg class="size-4 shrink-0 text-marine-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 21l-4.3-4.3" /><circle cx="11" cy="11" r="7" /></svg>
              <input id="buscar-contacto" type="text" class="w-full bg-transparent text-sm text-marine-800 outline-none placeholder:text-marine-400" placeholder="Buscar persona..." [value]="busqueda()" (input)="onBusqueda($event)" autocomplete="off" aria-label="Buscar una persona" />
              @if (busqueda()) {
                <button type="button" class="text-xs font-bold text-brand-600 hover:underline" (click)="limpiarBusqueda()">Borrar</button>
              }
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            @if (error()) {
              <p class="mb-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700" role="alert">{{ error() }}</p>
            }

            <!-- ========= Conversaciones recientes ========= -->
            @if (tab() === 'conversaciones' && !busqueda()) {
              @for (t of hilos(); track t.otroId) {
                <button type="button" class="chat-item" [class.chat-item-activo]="sel() === t.otroId" (click)="seleccionar(t.otroId, t.nombre, t.email)" [attr.aria-current]="sel() === t.otroId ? 'true' : null">
                  <span class="chat-avatar" [style.background]="colorAvatar(t.otroId)">{{ iniciales(t.nombre) }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-baseline justify-between gap-2">
                      <span class="truncate text-sm font-bold text-marine-800">{{ t.nombre }}</span>
                      <span class="shrink-0 text-[0.65rem] font-medium text-marine-400">{{ fechaCorta(t.ultimoEn) }}</span>
                    </span>
                    <span class="mt-0.5 flex items-center justify-between gap-2">
                      <span class="truncate text-xs" [class.font-semibold]="t.noLeidos > 0" [class.text-marine-700]="t.noLeidos > 0" [class.text-marine-500]="t.noLeidos === 0">{{ t.ultimoMensaje }}</span>
                      @if (t.noLeidos > 0) {
                        <span class="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[0.65rem] font-extrabold text-white">{{ t.noLeidos > 9 ? '9+' : t.noLeidos }}</span>
                      }
                    </span>
                  </span>
                </button>
              } @empty {
                <div class="px-4 py-10 text-center">
                  <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                    <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" /><path d="M21 12c0 4.4-4 8-9 8a9.5 9.5 0 0 1-4-.8L3 20l1.5-3.8A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>
                  </div>
                  <p class="mt-3 text-sm font-bold text-marine-700">Aún no hay conversaciones</p>
                  <p class="mt-1 text-xs leading-relaxed text-marine-500">Escribe a alguien de tu curso. Tus mensajes quedan entre ustedes dos.</p>
                  <button type="button" class="btn btn-primary btn-sm mt-4" (click)="tab.set('miembros')">Ver miembros del curso</button>
                </div>
              }
            } @else if (miembrosOBusqueda().length) {

              <!-- ========= Resultados / Miembros ========= -->
              @for (p of miembrosOBusqueda(); track p.id) {
                <button type="button" class="chat-item" (click)="seleccionar(p.id, nombre(p), p.email)">
                  <span class="chat-avatar" [style.background]="colorAvatar(p.id)">{{ iniciales(nombre(p)) }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-sm font-bold text-marine-800">{{ nombre(p) }}</span>
                      <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wide" [class]="claseRolTag(rolMiembro(p))">{{ etiquetaRolTag(rolMiembro(p)) }}</span>
                    </span>
                    <span class="block truncate text-xs text-marine-400">{{ p.email }}</span>
                  </span>
                  <svg class="size-4 shrink-0 text-marine-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              }
            } @else {
              <div class="px-4 py-10 text-center">
                <p class="text-xs text-marine-500">{{ busqueda() ? 'Nadie coincide con la búsqueda.' : soyDocente() ? 'No tienes estudiantes en este curso todavía.' : 'Aún no hay compañeros en este curso.' }}</p>
              </div>
            }
          </div>
        </aside>

        <!-- ================= CONVERSACIÓN ================= -->
        <div class="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card lg:col-span-8" [class.hidden]="!hiloAbierto() && esMovil()" [class.flex]="true">
          @if (contacto(); as c) {
            <header class="flex items-center gap-3 border-b border-surface-100 bg-surface-50/50 px-3 py-2.5">
              <button type="button" class="rounded-lg p-1.5 text-marine-500 transition-colors hover:bg-surface-200 lg:hidden" (click)="cerrarHilo()" aria-label="Volver a la lista">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span class="chat-avatar" [style.background]="colorAvatar(selId() ?? '')">{{ iniciales(c.nombre) }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-extrabold text-marine-800">{{ c.nombre }}</p>
                <p class="truncate text-[0.7rem] text-marine-400">{{ c.email }}</p>
              </div>
              <button type="button" class="hidden rounded-lg px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-marine-400 hover:text-marine-600 lg:block" (click)="marcarConversacionLeida()">Marcar leída</button>
            </header>

            <div #scrollRef class="chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
              @if (mensajes().length === 0) {
                <div class="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div class="flex size-14 items-center justify-center rounded-2xl bg-surface-100 text-marine-400">
                    <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12c0 4.4-4 8-9 8a9.5 9.5 0 0 1-4-.8L3 20l1.5-3.8A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>
                  </div>
                  <p class="text-sm font-semibold text-marine-700">Aún no hay mensajes</p>
                  <p class="text-xs text-marine-500">Saluda a {{ c.nombre.split(' ')[0] }} para empezar la conversación.</p>
                </div>
              }
              @for (m of mensajesConSeparadores(); track m.id) {
                @if (m.tipo === 'separador') {
                  <div class="flex items-center gap-3 py-2" role="separator">
                    <div class="h-px flex-1 bg-surface-200"></div>
                    <span class="rounded-full bg-surface-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-marine-500">{{ m.etiqueta }}</span>
                    <div class="h-px flex-1 bg-surface-200"></div>
                  </div>
                } @else {
                  <div class="flex" [class.justify-end]="m.emisor_id === miId()">
                    <div class="flex max-w-[80%] flex-col" [class.items-end]="m.emisor_id === miId()" [class.items-start]="m.emisor_id !== miId()">
                      <div class="rounded-2xl px-3.5 py-2 text-sm leading-snug"
                        [class.bg-brand-600]="m.emisor_id === miId()"
                        [class.text-white]="m.emisor_id === miId()"
                        [class.rounded-br-md]="m.emisor_id === miId()"
                        [class.bg-surface-100]="m.emisor_id !== miId()"
                        [class.text-marine-800]="m.emisor_id !== miId()"
                        [class.rounded-bl-md]="m.emisor_id !== miId()">
                        <p class="whitespace-pre-wrap break-words">{{ m.cuerpo }}</p>
                      </div>
                      <span class="mt-0.5 flex items-center gap-1.5 px-1 text-[0.62rem] font-medium text-marine-400">
                        {{ m.creado_en | date:'HH:mm' }}
                        @if (m.emisor_id === miId()) {
                          @if (m.leido_en) {
                            <svg class="size-3.5 text-info-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-label="Leído"><path d="M20 6L9 17l-5-5" /></svg>
                          } @else {
                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Enviado"><path d="M20 6L9 17l-5-5" /></svg>
                          }
                        }
                      </span>
                    </div>
                  </div>
                }
              }
            </div>

            <form class="flex items-end gap-2 border-t border-surface-100 p-3" [formGroup]="form" (ngSubmit)="enviar()" aria-label="Escribir mensaje">
              <textarea class="input max-h-36 min-h-11 flex-1 resize-y !py-2.5" rows="1" formControlName="cuerpo" placeholder="Escribe un mensaje..." (keydown)="onKeydown($event)" aria-label="Mensaje"></textarea>
              <button type="submit" class="btn btn-primary btn-md shrink-0" [disabled]="form.invalid || enviando()" aria-label="Enviar mensaje">
                @if (enviando()) {
                  <svg class="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path></svg>
                } @else {
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 21 3l-8.5 18-2-8.5-7.5-1z" /></svg>
                }
              </button>
            </form>
          } @else {
            <div class="hidden h-full flex-col items-center justify-center gap-4 p-10 text-center lg:flex">
              <div class="flex size-24 items-center justify-center rounded-3xl bg-brand-50 text-brand-500">
                <svg class="size-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" /><path d="M21 12c0 4.4-4 8-9 8a9.5 9.5 0 0 1-4-.8L3 20l1.5-3.8A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>
              </div>
              <h3 class="text-lg font-extrabold text-marine-800">Tus conversaciones viven aquí</h3>
              <p class="max-w-sm text-xs leading-relaxed text-marine-500">Elige un contacto de la lista o busca a alguien de tu curso para empezar a hablar. Las conversaciones quedan entre ustedes dos.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .chat-item { display: flex; align-items: center; gap: 0.7rem; width: 100%; border-radius: 0.9rem; padding: 0.55rem 0.65rem; text-align: left; transition: background 140ms ease; border: 1px solid transparent; cursor: pointer; }
    .chat-item:hover { background: #f4f8f7; border-color: #dfe9e7; }
    .chat-item-activo { background: #e8f6f4; border-color: #12736b; box-shadow: inset 0 0 0 1px #12736b; }
    .chat-avatar { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; flex-shrink: 0; border-radius: 9999px; color: #fff; font-weight: 800; font-size: 0.78rem; letter-spacing: 0.02em; }
    .chat-scroll { scrollbar-width: thin; scroll-padding-bottom: 1rem; }
  `],
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);
  private readonly confirm = inject(ConfirmService);

  /** Etiqueta de rol con texto visible. */
  protected etiquetaRolTag(rol: string): string {
    switch (rol) {
      case 'docente': return 'Docente';
      case 'administrador': return 'Admin';
      default: return 'Alumno';
    }
  }

  /** Clases del badge de rol. */
  protected claseRolTag(rol: string): string {
    switch (rol) {
      case 'docente': return 'bg-gold-100 text-gold-700';
      case 'administrador': return 'bg-marine-100 text-marine-700';
      default: return 'bg-surface-100 text-marine-600';
    }
  }

  /** Avatar con color determinista a partir del id. */
  protected colorAvatar(id: string): string {
    let h = 0;
    for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return COLORES_AVATAR[h % COLORES_AVATAR.length];
  }

  @ViewChild('scrollRef') private scrollRef?: ElementRef<HTMLElement>;

  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly hilos = signal<HiloResumen[]>([]);
  protected readonly sel = signal<string | null>(null);
  protected readonly datosSel = signal<{ nombre: string; email: string } | null>(null);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly misCursos = signal<Curso[]>([]);
  protected readonly cursoSel = signal<string | null>(null);
  protected readonly miembrosCurso = signal<MiembroCurso[]>([]);
  protected readonly tab = signal<Tab>('conversaciones');

  private autoSeleccionCursoHecha = false;

  protected readonly contacto = computed(() => {
    const id = this.sel();
    if (!id) return null;
    const hilo = this.hilos().find((h) => h.otroId === id);
    const d = this.datosSel();
    if (hilo) return { nombre: hilo.nombre, email: hilo.email };
    if (d) return d;
    return { nombre: 'Usuario', email: '' };
  });

  protected readonly miId = computed(() => this.auth.usuario()?.id ?? '');
  protected readonly selId = computed(() => this.sel());
  protected readonly hiloAbierto = computed(() => this.sel() !== null);
  protected readonly esMovil = () => typeof window !== 'undefined' && window.innerWidth < 1024;
  protected readonly totalNoLeidos = computed(() => this.hilos().reduce((s, t) => s + t.noLeidos, 0));
  protected readonly soyDocente = computed(() => this.auth.rol() === 'docente');
  protected readonly cursoActual = computed(() => this.misCursos().find((c) => c.id === this.cursoSel()) ?? null);

  protected readonly miembrosFiltrados = computed(() => {
    const m = this.miembrosCurso();
    const base = this.soyDocente() ? m.filter((x) => x.rol === 'estudiante') : m;
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return base;
    return base.filter((x) => {
      const nombre = this.nombre(x).toLowerCase();
      return nombre.includes(q) || x.email.toLowerCase().includes(q);
    });
  });

  /** Devuelve miembros visibles cuando la pestaña Miembros está activa o hay búsqueda. */
  protected readonly miembrosOBusqueda = computed<MiembroCurso[]>(() => {
    if (this.tab() === 'miembros' || this.busqueda()) {
      return this.miembrosFiltrados();
    }
    return [];
  });

  /** Lista plana de mensajes con separadores por día intercalados. */
  protected readonly mensajesConSeparadores = computed(() => {
    const salida: Array<{ id: string; tipo: 'mensaje' | 'separador'; etiqueta?: string; emisor_id?: string; cuerpo?: string; creado_en?: string; leido_en?: string | null }> = [];
    let diaActual = '';
    for (const m of this.mensajes()) {
      const dia = new Date(m.creado_en).toDateString();
      if (dia !== diaActual) {
        diaActual = dia;
        salida.push({ id: `sep-${dia}`, tipo: 'separador', etiqueta: this.etiquetaDia(m.creado_en) });
      }
      salida.push({ id: m.id, tipo: 'mensaje', emisor_id: m.emisor_id, cuerpo: m.cuerpo, creado_en: m.creado_en, leido_en: m.leido_en ?? null });
    }
    return salida;
  });

  protected readonly form = this.fb.nonNullable.group({
    cuerpo: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
  });

  protected readonly enviarGrupoAbierto = signal(false);
  protected readonly cuerpoGrupo = signal('');
  protected readonly enviandoGrupo = signal(false);
  protected readonly resultadoGrupo = signal<{ ok: boolean; mensaje: string } | null>(null);

  private canal: ReturnType<typeof this.supabase.client.channel> | null = null;

  ngOnInit(): void {
    void this.cargarTodo();
    this.suscribirRealtime();
  }

  /** Alterna el panel de envío grupal para el curso activo. */
  protected toggleGrupo(): void {
    this.enviarGrupoAbierto.update((abierto) => !abierto);
    this.resultadoGrupo.set(null);
  }

  /** Docente: envía el mensaje al chat de cada estudiante activo del curso vía RPC segura + auditoría. */
  protected async enviarGrupo(): Promise<void> {
    const texto = this.cuerpoGrupo().trim();
    const curso = this.cursoSel();
    if (!curso) return;
    const cursos = this.misCursos();
    const titulo = cursos.find((c) => c.id === curso)?.titulo ?? 'este curso';
    const confirmar = await this.confirm.ask({
      title: 'Enviar al grupo',
      mensaje: `¿Enviar este mensaje a todos los estudiantes activos de «${titulo}»? Se registrará quién lo envió y reciberás una copia por cada estudiante.`,
      textoConfirmar: 'Enviar al grupo',
      variante: 'primario',
    });
    if (!confirmar) return;

    this.enviandoGrupo.set(true);
    this.resultadoGrupo.set(null);
    const { data, error } = await this.supabase.client.rpc('chat_enviar_grupo', {
      p_curso_id: curso,
      p_cuerpo: texto,
    });
    if (error) {
      this.resultadoGrupo.set({ ok: false, mensaje: error.message ?? 'No se pudo enviar al grupo.' });
    } else {
      const n = Number(data ?? 0);
      this.resultadoGrupo.set({ ok: true, mensaje: `Mensaje entregado a ${n} estudiante(s) y registrado en auditoría.` });
      this.cuerpoGrupo.set('');
      await this.cargarHilos();
    }
    this.enviandoGrupo.set(false);
  }

  ngOnDestroy(): void {
    if (this.canal) {
      void this.supabase.client.removeChannel(this.canal);
      this.canal = null;
    }
  }

  protected async refrescar(): Promise<void> {
    await this.cargarTodo();
  }

  protected onBusqueda(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.busqueda.set(q);
  }

  protected onCurso(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.cursoSel.set(id || null);
    this.miembrosCurso.set([]);
    if (id) void this.cargarMiembros(id);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  protected seleccionar(id: string, nombre: string, email: string): void {
    this.sel.set(id);
    this.datosSel.set({ nombre, email });
    this.limpiarBusqueda();
    void this.cargarMensajes(id);
  }

  protected cerrarHilo(): void {
    this.sel.set(null);
  }

  protected async marcarConversacionLeida(): Promise<void> {
    const otro = this.sel();
    if (!otro) return;
    await this.messageService.marcarLeidos(otro);
    await this.cargarHilos();
  }

  protected iniciales(nombre: string): string {
    return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '–';
  }

  protected nombre(p: Perfil): string {
    return [p.nombre, p.apellido].filter(Boolean).join(' ').trim() || p.email;
  }

  protected rolMiembro(p: MiembroCurso): string {
    return p.rol;
  }

  protected fechaCorta(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  /** Etiqueta del separador por día: Hoy, Ayer o fecha completa. */
  protected etiquetaDia(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return 'Hoy';
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /** Carga inicial completa: hilos + cursos (y miembros del curso activo). */
  private async cargarTodo(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await Promise.all([this.cargarHilos(), this.cargarMisCursos()]);
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarHilos(): Promise<void> {
    try { this.hilos.set(await this.messageService.listarHilos()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los mensajes.'); }
  }

  private async cargarMisCursos(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) return;
    const rol = this.auth.rol();
    try {
      let cursos: Curso[] = [];
      if (rol === 'docente') {
        const list = await this.teacherService.listarMisCursos(user.id);
        cursos = list.map((c) => c.curso);
      } else if (rol === 'estudiante') {
        cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      }
      this.misCursos.set(cursos);
      if (!this.cursoSel() && cursos.length > 0 && !this.autoSeleccionCursoHecha) {
        this.autoSeleccionCursoHecha = true;
        this.cursoSel.set(cursos[0].id);
        await this.cargarMiembros(cursos[0].id);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? `No se pudieron cargar tus cursos: ${e.message}` : 'No se pudieron cargar tus cursos.');
      this.misCursos.set([]);
    }
  }

  private async cargarMiembros(cursoId: string): Promise<void> {
    try { this.miembrosCurso.set(await this.messageService.listarMiembrosCurso(cursoId)); }
    catch (e) { this.miembrosCurso.set([]); this.error.set(e instanceof Error ? `No se pudieron cargar los miembros: ${e.message}` : 'No se pudieron cargar los miembros.'); }
  }

  protected async cargarMensajes(otroId: string): Promise<void> {
    this.cargando.set(true);
    try {
      const msgs = await this.messageService.listarMensajes(otroId);
      this.mensajes.set(msgs);
      void this.messageService.marcarLeidos(otroId).then(() => this.cargarHilos());
      this.scrollAlFinal();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los mensajes.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid || !this.sel()) return;
    this.enviando.set(true);
    const otro = this.sel()!;
    const texto = this.form.getRawValue().cuerpo.trim();
    try {
      const enviado = await this.messageService.enviar(otro, texto);
      this.mensajes.update((m) => [...m, enviado]);
      this.form.reset();
      await this.cargarHilos();
      this.scrollAlFinal();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo enviar el mensaje.');
    } finally {
      this.enviando.set(false);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void this.enviar();
    }
  }

  private scrollAlFinal(): void {
    setTimeout(() => {
      const el = this.scrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  private suscribirRealtime(): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.canal = this.supabase.client
      .channel(`chat-${usuario.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensaje' }, (payload) => {
        const m = payload.new as Mensaje;
        const activo = this.sel();
        const esDelHilo = m.emisor_id === activo || m.destinatario_id === activo;
        if (esDelHilo && activo) {
          this.mensajes.update((arr) => arr.some((x) => x.id === m.id) ? arr : [...arr, m]);
          if (m.emisor_id === activo) void this.messageService.marcarLeidos(activo);
          this.scrollAlFinal();
        }
        void this.cargarHilos();
      })
      .subscribe();
  }
}
