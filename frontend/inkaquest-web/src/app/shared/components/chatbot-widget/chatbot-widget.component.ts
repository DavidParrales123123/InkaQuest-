// @ts-nocheck
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatbotService, type ChatbotAdjunto } from '../../../core/services/chatbot.service';
import { StorageService } from '../../../core/services/storage.service';

interface MensajeUI {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
  hora: string;
  adjuntos?: { nombre: string; mime: string; preview?: string }[];
}

interface AdjuntoLocal extends ChatbotAdjunto {
  preview?: string;
}

let nextId = 0;
const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv'];
const EXTENSIONES_OK = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.txt', '.md', '.csv'];
const SUGERENCIAS = [
  { icono: '🧮', texto: 'Explícame los bucles for anidados con un ejemplo' },
  { icono: '🐞', texto: 'Tengo un error en mi código, ¿me ayudas a depurarlo?' },
  { icono: '📘', texto: 'Resúmeme los conceptos clave del curso de algoritmos' },
  { icono: '🛡️', texto: '¿Cómo puedo mejorar en Guardianes del Conocimiento?' },
];

/**
 * Asistente InkaQuest — widget flotante estilo Copilot/ChatGPT.
 *
 * <p>FAB dorado bottom-right → panel glass marine con IA + búsqueda web +
 * adjuntos (imágenes con visión, PDF/TXT/MD/CSV con texto extraído).
 * Soporta drag & drop y pegado de imágenes con Ctrl+V, autoexpansión del
 * composer, sugerencias de inicio y copiar respuestas. La conversación
 * persiste en el backend y es privada por usuario (JWT + RLS).</p>
 */
@Component({
  selector: 'app-chatbot-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styles: [`
    .chat-panel { background: linear-gradient(180deg, #0d1220 0%, #060b18 100%); }
    .chat-scroll::-webkit-scrollbar { width: 8px; }
    .chat-scroll::-webkit-scrollbar-thumb { background: #24314f; border-radius: 8px; }
    .chat-scroll::-webkit-scrollbar-thumb:hover { background: #f2a541; }
    .typing-dot { animation: typingBounce 1.25s infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes typingBounce { 0%, 60%, 100% { opacity: 0.35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-4px); } }
    .drop-overlay { animation: fadeIn 140ms ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .suggestion { transition: all 180ms ease; }
    .suggestion:hover { border-color: rgba(242, 165, 65, 0.6); transform: translateY(-2px); box-shadow: 0 10px 28px -12px rgba(242, 165, 65, 0.35); }
  `],
  template: `
    <!-- FAB -->
    <button type="button"
      class="group fixed bottom-5 right-4 z-40 grid size-15 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-marine-900 shadow-[0_6px_0_#b45309,0_18px_40px_-10px_rgba(242,165,65,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_#b45309,0_22px_48px_-10px_rgba(242,165,65,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:bottom-6 sm:right-6 sm:size-16"
      (click)="alternar()"
      [attr.aria-label]="abierto() ? 'Cerrar asistente InkaQuest' : 'Abrir asistente InkaQuest'"
      [attr.aria-expanded]="abierto()">
      @if (abierto()) {
        <svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      } @else {
        <span class="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full border-2 border-marine-950 bg-emerald-400 text-[0.55rem] font-black text-emerald-950">IA</span>
        <svg viewBox="0 0 24 24" class="size-7 transition-transform duration-200 group-hover:scale-110" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.2 3.6A1 1 0 0 1 3.2 19.4V6a2 2 0 0 1 2-2z"/><circle cx="9" cy="10.5" r="1.25" fill="#3d2600"/><circle cx="12.5" cy="10.5" r="1.25" fill="#3d2600"/><circle cx="16" cy="10.5" r="1.25" fill="#3d2600"/></svg>
      }
    </button>

    <!-- Backdrop (solo en expandido): click fuera = volver a compacto -->
    @if (abierto() && expandido()) {
      <button type="button" class="fixed inset-0 z-[58] cursor-pointer bg-marine-950/70 backdrop-blur-sm" (click)="expandido.set(false)" aria-label="Reducir asistente"></button>
    }

    <!-- Panel -->
    @if (abierto()) {
      <div class="chat-panel fixed z-[60] flex flex-col overflow-hidden border border-gold-500/30 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-300"
           [class]="expandido()
             ? 'inset-2 rounded-3xl sm:inset-4'
             : 'bottom-[5.5rem] right-3 w-[calc(100vw-1.5rem)] max-w-[30rem] rounded-3xl sm:bottom-24 sm:right-6'"
           [style.height]="expandido() ? 'auto' : 'min(40rem, 80vh)'"
           role="dialog" aria-label="Asistente InkaQuest"
           (dragenter)="sobreZona($event)" (dragover)="sobreZona($event)" (dragleave)="fueraDeZona($event)" (drop)="soltandoArchivos($event)">

        <!-- Overlay de drop -->
        @if (arrastrando()) {
          <div class="drop-overlay pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gold-400 bg-marine-900/80 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" class="size-12 text-gold-400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"/></svg>
            <p class="text-sm font-extrabold uppercase tracking-[0.22em] text-gold-300">Suelta para adjuntar</p>
            <p class="text-[0.65rem] font-bold uppercase tracking-widest text-marine-300">Imagen · PDF · txt/md · máx. 3 archivos</p>
          </div>
        }

        <!-- Header -->
        <div class="flex h-14 shrink-0 items-center gap-2.5 border-b border-gold-500/20 bg-gradient-to-r from-marine-900/60 via-transparent to-transparent px-3 sm:px-4">
          <span class="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 text-marine-900 shadow-[0_2px_0_#5c3a07]">
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.2 5.8.5-4.4 3.8 1.3 5.6L12 14.4 6.9 17l1.3-5.5-4.4-3.9 5.8-.5z"/></svg>
            <span class="absolute -bottom-1.5 -right-1.5 size-3.5 rounded-full border-2 border-marine-950 bg-emerald-400" aria-hidden="true"></span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[0.78rem] font-black uppercase tracking-[0.2em] text-gold-400">Asistente InkaQuest</p>
            <p class="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-emerald-400">En línea · solo InkaQuest y cursos</p>
          </div>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-lg text-marine-300 transition-all hover:bg-white/5 hover:text-white" (click)="expandido.update((v) => !v)" [attr.aria-label]="expandido() ? 'Reducir panel' : 'Expandir panel'" [title]="expandido() ? 'Reducir' : 'Expandir'">
            @if (expandido()) {
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9H5V5m10 0h4v4m0 10h-4v4m-14-4h4v4"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6"/></svg>
            }
          </button>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-lg text-marine-300 transition-all hover:bg-white/5 hover:text-white" (click)="nuevaConversacion()" aria-label="Nueva conversación" title="Nueva conversación">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-lg text-marine-300 transition-all hover:bg-white/5 hover:text-white" (click)="alternar()" aria-label="Cerrar" title="Esc">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Mensajes -->
        <div #lista class="chat-scroll flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4" aria-live="polite">
          @if (mensajes().length === 0) {
            <!-- Estado vacío con sugerencias -->
            <div class="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div class="relative">
                <div class="absolute inset-0 -m-4 rounded-full bg-gold-500/10 blur-2xl" aria-hidden="true"></div>
                <span class="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-marine-900 shadow-[0_6px_0_#b45309]">
                  <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.2 5.8.5-4.4 3.8 1.3 5.6L12 14.4 6.9 17l1.3-5.5-4.4-3.9 5.8-.5z"/></svg>
                </span>
              </div>
              <div>
                <h2 class="text-xl font-black tracking-tight text-white">Hola, soy tu <span class="text-gold-400">asistente</span></h2>
                <p class="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-marine-400">Pregunta · Adjunta · Aprende</p>
                <p class="mx-auto mt-2 max-w-xs text-[0.7rem] leading-relaxed text-marine-400">Solo respondo sobre el uso de InkaQuest y los temas de los cursos (programación, algoritmos, bases de datos y afines).</p>
              </div>
              <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                @for (s of sugerencias; track s.texto) {
                  <button type="button" class="suggestion flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left" (click)="usarSugerencia(s.texto)">
                    <span class="text-lg leading-none">{{ s.icono }}</span>
                    <span class="text-[0.72rem] font-semibold leading-snug text-marine-100">{{ s.texto }}</span>
                  </button>
                }
              </div>
              <p class="text-[0.62rem] font-semibold uppercase tracking-widest text-marine-500">📎 Arrastra archivos o pega capturas con Ctrl+V</p>
            </div>
          } @else {
            @for (m of mensajes(); track m.id) {
              <div class="flex gap-2" [class.justify-end]="m.rol === 'usuario'">
                <!-- Avatar solo en asistente -->
                @if (m.rol === 'asistente') {
                  <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-gold-500 text-[0.62rem] font-black text-marine-900" aria-hidden="true">IA</span>
                }
                <div class="group relative max-w-[86%]">
                  <div class="rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed"
                       [class]="m.rol === 'usuario'
                         ? 'rounded-br-md bg-gradient-to-br from-gold-400 to-amber-500 text-marine-900 font-semibold shadow-[0_4px_14px_-6px_rgba(242,165,65,0.5)]'
                         : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-marine-50'">
                    @if (m.adjuntos?.length) {
                      <div class="mb-2 grid grid-cols-2 gap-2">
                        @for (a of m.adjuntos; track a.nombre) {
                          @if (a.preview) {
                            <img [src]="a.preview" [alt]="a.nombre" class="h-32 w-full rounded-xl border border-black/20 object-cover" loading="lazy" />
                          } @else {
                            <span class="col-span-2 flex items-center gap-2 rounded-xl border border-black/15 bg-black/15 px-2.5 py-2 text-[0.68rem] font-bold" [class.text-marine-800]="m.rol === 'usuario'" [class.text-gold-300]="m.rol !== 'usuario'">
                              <svg viewBox="0 0 24 24" class="size-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                              <span class="truncate">{{ a.nombre }}</span>
                            </span>
                          }
                        }
                      </div>
                    }
                    <p class="whitespace-pre-wrap">{{ m.contenido }}</p>
                  </div>
                  <div class="mt-1 flex items-center gap-2" [class.justify-end]="m.rol === 'usuario'">
                    <span class="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-marine-500">{{ m.hora }}</span>
                    @if (m.rol === 'asistente') {
                      <button type="button" class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.18em] text-marine-400 transition-all hover:bg-white/5 hover:text-gold-400" (click)="copiar(m.contenido)" [attr.aria-label]="'Copiar respuesta'">
                        <svg viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copiar
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          }
          @if (enviando()) {
            <div class="flex gap-2">
              <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-gold-500 text-[0.62rem] font-black text-marine-900" aria-hidden="true">IA</span>
              <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3" aria-label="Escribiendo">
                <span class="typing-dot size-2 rounded-full bg-gold-400"></span>
                <span class="typing-dot size-2 rounded-full bg-gold-400"></span>
                <span class="typing-dot size-2 rounded-full bg-gold-400"></span>
              </div>
            </div>
          }
          @if (error()) {
            <div class="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-[0.74rem] leading-snug text-rose-200" role="alert">
              <p class="font-extrabold uppercase tracking-widest text-rose-300">Error</p>
              <p class="mt-1">{{ error() }}</p>
            </div>
          }
        </div>

        <!-- Adjuntos en cola -->
        @if (adjuntos().length) {
          <div class="flex flex-wrap items-center gap-2 border-t border-gold-500/15 bg-black/30 px-3 py-2">
            @for (a of adjuntos(); track a.ruta) {
              <span class="flex items-center gap-1.5 rounded-xl border border-gold-500/40 bg-gold-500/5 py-1 pl-1 pr-1.5 text-[0.65rem] font-bold text-gold-300">
                @if (a.preview) {
                  <img [src]="a.preview" [alt]="a.nombre" class="size-8 rounded-lg object-cover" />
                } @else {
                  <span class="grid size-8 place-items-center rounded-lg bg-gold-500/10">
                    <svg viewBox="0 0 24 24" class="size-4 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                  </span>
                }
                <span class="max-w-[8rem] truncate">{{ a.nombre }}</span>
                <button type="button" class="grid size-6 shrink-0 place-items-center rounded-md text-marine-300 transition-all hover:bg-white/10 hover:text-white" (click)="quitarAdjunto(a.ruta)" aria-label="Quitar adjunto">
                  <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </span>
            }
          </div>
        }

        <!-- Composer -->
        <form class="shrink-0 border-t border-white/10 bg-marine-950/80 p-2.5 sm:p-3" (submit)="enviar($event)">
          <div class="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 transition-colors focus-within:border-gold-400/50">
            <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl border border-white/5 bg-white/5 text-marine-300 transition-all hover:border-gold-400/50 hover:text-gold-400 disabled:opacity-30"
                    (click)="seleccionarArchivos()" [disabled]="enviando() || adjuntos().length >= 3" aria-label="Adjuntar archivo (máx. 3)" title="Adjuntar (máx. 3)">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.4 11-9.7 9.7a6 6 0 0 1-8.5-8.5l10-10a4 4 0 0 1 5.7 5.7l-10 10a2 2 0 0 1-2.8-2.8l9.1-9.1"/></svg>
            </button>
            <textarea #composer id="asistente-input" name="mensaje" rows="1" maxlength="4000"
              class="max-h-40 w-full min-w-0 resize-none self-center bg-transparent px-1 py-1.5 text-[0.88rem] leading-relaxed text-white placeholder-marine-400 outline-none"
              placeholder="Pregunta o escribe un mensaje…"
              [(ngModel)]="borrador" (keydown)="tecla($event)" (input)="autoExpand($event)"></textarea>
            <button type="submit" class="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 text-marine-900 shadow-[0_3px_0_#b45309] transition-all hover:brightness-110 disabled:opacity-30"
                    [disabled]="enviando() || (!borrador.trim() && !adjuntos().length)" aria-label="Enviar mensaje">
              <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
            </button>
          </div>
          <p class="mt-1.5 px-1 text-center text-[0.55rem] font-semibold uppercase tracking-widest text-marine-600">La IA puede cometer errores · verifica lo importante · Esc para cerrar</p>
          <input type="file" #fileInput multiple accept="image/*,application/pdf,.txt,.md,.csv" class="hidden" (change)="archivosSeleccionados($event)" />
        </form>
      </div>
    }
  `,
})
export class ChatbotWidgetComponent {
  private readonly chatbot = inject(ChatbotService);
  private readonly storage = inject(StorageService);
  @ViewChild('lista') private listaRef?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('composer') private composerRef?: ElementRef<HTMLTextAreaElement>;

  protected readonly abierto = signal(false);
  protected readonly expandido = signal(false);
  protected readonly enviando = signal(false);
  protected readonly arrastrando = signal(false);
  protected readonly mensajes = signal<MensajeUI[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly adjuntos = signal<AdjuntoLocal[]>([]);
  protected borrador = '';
  protected readonly sugerencias = SUGERENCIAS;
  private conversacionId: string | null = null;

  constructor() {
    effect(() => {
      this.mensajes();
      this.enviando();
      queueMicrotask(() => {
        const el = this.listaRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  /** Esc: primero reduce la expansión, luego cierra. */
  @HostListener('document:keydown.escape')
  protected escape(): void {
    if (!this.abierto()) return;
    if (this.expandido()) { this.expandido.set(false); return; }
    this.alternar();
  }

  protected alternar(): void {
    this.abierto.update((v) => !v);
    this.error.set(null);
    if (this.abierto()) {
      queueMicrotask(() => this.composerRef?.nativeElement.focus());
    }
  }

  protected nuevaConversacion(): void {
    this.conversacionId = null;
    this.mensajes.set([]);
    this.adjuntos.set([]);
    this.error.set(null);
    this.borrador = '';
    this.expandido.set(false);
    this.resetearTextarea();
  }

  protected usarSugerencia(texto: string): void {
    this.borrador = texto;
    queueMicrotask(() => {
      this.autoExpand({ target: this.composerRef?.nativeElement } as unknown as Event);
      this.composerRef?.nativeElement.focus();
    });
  }

  protected copiar(texto: string): void {
    void navigator.clipboard?.writeText(texto);
  }

  protected tecla(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      void this.enviar(ev);
    }
  }

  protected autoExpand(ev: Event): void {
    const ta = (ev.target as HTMLTextAreaElement) ?? this.composerRef?.nativeElement;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  private resetearTextarea(): void {
    const ta = this.composerRef?.nativeElement;
    if (ta) ta.style.height = 'auto';
  }

  protected seleccionarArchivos(): void {
    this.fileInput?.nativeElement.click();
  }

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  protected sobreZona(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer?.types.includes('Files')) {
      this.arrastrando.set(true);
      ev.dataTransfer.dropEffect = 'copy';
    }
  }

  protected fueraDeZona(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.relatedTarget === null || !(ev.currentTarget as HTMLElement)?.contains(ev.relatedTarget as Node)) {
      this.arrastrando.set(false);
    }
  }

  protected async soltandoArchivos(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    this.arrastrando.set(false);
    const files = Array.from(ev.dataTransfer?.files ?? []);
    await this.procesarArchivos(files);
  }

  protected async archivosSeleccionados(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    await this.procesarArchivos(files);
  }

  private async procesarArchivos(files: File[]): Promise<void> {
    for (const file of files) {
      if (this.adjuntos().length >= 3) {
        this.error.set('Máximo 3 adjuntos por mensaje.');
        return;
      }
      if (!this.archivoAceptado(file)) {
        this.error.set(`"${file.name}" no es un tipo permitido (imagen, PDF, txt/md/csv, máx. 10 MB).`);
        continue;
      }
      try {
        const up = await this.storage.subirChatAdjunto(file);
        const url = await this.storage.obtenerUrlChat(up.ruta, 30 * 60);
        let preview: string | undefined;
        if (up.mime.startsWith('image/')) {
          preview = await this.leerPreview(file);
        }
        this.adjuntos.update((a) => [...a, { ruta: up.ruta, url: url ?? '', mime: up.mime, nombre: up.nombre, tamano: up.tamano, preview }]);
      } catch (e) {
        this.error.set('No se pudo subir "' + file.name + '". Revisa tu conexión y el tamaño (< 10 MB).');
      }
    }
  }

  protected quitarAdjunto(ruta: string): void {
    this.adjuntos.update((a) => a.filter((x) => x.ruta !== ruta));
  }

  private archivoAceptado(file: File): boolean {
    const nombre = file.name.toLowerCase();
    const extOk = EXTENSIONES_OK.some((ext) => nombre.endsWith(ext));
    const mimeOk = TIPOS_ACEPTADOS.includes(file.type) || file.type.startsWith('image/');
    const tamanoOk = file.size <= 10 * 1024 * 1024;
    return (extOk || mimeOk) && tamanoOk;
  }

  private leerPreview(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }

  /** Pegado de imágenes con Ctrl+V en cualquier parte del panel. */
  @HostListener('document:paste', ['$event'])
  protected pegar(ev: ClipboardEvent): void {
    if (!this.abierto()) return;
    const files = Array.from(ev.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      ev.preventDefault();
      void this.procesarArchivos(files);
    }
  }

  protected async enviar(ev: Event): Promise<void> {
    ev.preventDefault();
    const contenido = this.borrador.trim();
    const adjuntosActuales = [...this.adjuntos()];
    if (!contenido && adjuntosActuales.length === 0) return;
    if (this.enviando()) return;

    this.error.set(null);
    this.enviando.set(true);
    const hora = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    this.mensajes.update((m) => [
      ...m,
      {
        id: `u${++nextId}`,
        rol: 'usuario',
        contenido: contenido || '[adjunto]',
        hora,
        adjuntos: adjuntosActuales.map((a) => ({ nombre: a.nombre, mime: a.mime, preview: a.preview })),
      },
    ]);
    this.borrador = '';
    this.resetearTextarea();
    this.adjuntos.set([]);

    try {
      const res = await this.chatbot.enviarMensaje(this.conversacionId, contenido, adjuntosActuales.map((a) => ({ ruta: a.ruta, url: a.url, mime: a.mime, nombre: a.nombre, tamano: a.tamano })));
      if (res?.conversacion?.id) this.conversacionId = res.conversacion.id;
      const texto = res?.respuesta?.contenido ?? 'No recibí respuesta. Inténtalo de nuevo.';
      this.mensajes.update((m) => [
        ...m,
        { id: `a${++nextId}`, rol: 'asistente', contenido: texto, hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (e) {
      const mensaje = e instanceof Error && e.message ? e.message : 'No se pudo procesar tu pregunta. Inténtalo de nuevo en un momento.';
      this.error.set(mensaje);
      this.mensajes.update((m) => [
        ...m,
        {
          id: `a${++nextId}`,
          rol: 'asistente',
          contenido: 'En este momento no fue posible procesar la consulta. Se recomienda intentar nuevamente en unos instantes.',
          hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      this.enviando.set(false);
    }
  }
}
