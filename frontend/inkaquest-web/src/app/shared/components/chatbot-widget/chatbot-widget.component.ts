// @ts-nocheck
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
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
  preview?: string; // thumbnail (data URL) para imágenes
}

let nextId = 0;
const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv'];
const EXTENSIONES_OK = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.txt', '.md', '.csv'];

/**
 * Widget flotante del Asistente InkaQuest (global, panel de cualquier rol).
 *
 * <p>Botón flotante dorado bottom-right; panel chat fluido. Soporta:
 *  - Texto con Enter (Shift+Enter nueva línea)
 *  - Adjuntos: imágenes (visión), PDF (texto extraído), txt/md/csv — hasta 3 por mensaje
 *  - IA con búsqueda web (modelo OpenAI search-preview en el backend) y citación de fuentes
 *  - Historial validado por usuario (servidor) + persistencia del contexto</p>
 */
@Component({
  selector: 'app-chatbot-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <!-- FAB -->
    <button type="button"
      class="group fixed bottom-5 right-4 z-40 grid size-15 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-marine-900 shadow-[0_5px_0_#b45309,0_14px_36px_-8px_rgba(242,165,65,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_7px_0_#b45309,0_18px_44px_-8px_rgba(242,165,65,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:bottom-6 sm:right-6 sm:size-16"
      (click)="alternar()"
      [attr.aria-label]="abierto() ? 'Cerrar asistente InkaQuest' : 'Abrir asistente InkaQuest'"
      [attr.aria-expanded]="abierto()">
      @if (abierto()) {
        <svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      } @else {
        <svg viewBox="0 0 24 24" class="size-7 transition-transform duration-200 group-hover:scale-110" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.2 3.6A1 1 0 0 1 3.2 19.4V6a2 2 0 0 1 2-2z"/><circle cx="9" cy="10.5" r="1.25" fill="#3d2600"/><circle cx="12.5" cy="10.5" r="1.25" fill="#3d2600"/><circle cx="16" cy="10.5" r="1.25" fill="#3d2600"/></svg>
      }
    </button>

    <!-- Panel -->
    @if (abierto()) {
      <div class="fixed bottom-[5.25rem] right-3 z-40 flex w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-gold-500/40 bg-marine-950 text-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)] sm:bottom-24 sm:right-6"
           style="height: min(36rem, 78vh)"
           role="dialog" aria-label="Asistente InkaQuest">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-gold-500/20 bg-gradient-to-r from-marine-900 via-marine-950 to-black px-4 py-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 text-marine-900 shadow-[0_2px_0_#5c3a07]">
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.2 5.8.5-4.4 3.8 1.3 5.6L12 14.4 6.9 17l1.3-5.5-4.4-3.9 5.8-.5z"/></svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[0.8rem] font-extrabold uppercase tracking-[0.18em] text-gold-400">Asistente InkaQuest</p>
            <p class="text-[0.62rem] font-semibold uppercase tracking-widest text-marine-300">IA + búsqueda web + archivos</p>
          </div>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-lg text-marine-300 transition-colors hover:bg-white/5 hover:text-white" (click)="nuevaConversacion()" aria-label="Nueva conversación" title="Nueva conversación">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-lg text-marine-300 transition-colors hover:bg-white/5 hover:text-white" (click)="alternar()" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Mensajes -->
        <div #lista class="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
          @if (mensajes().length === 0) {
            <div class="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[0.78rem] leading-snug text-marine-100">
              <p class="font-bold text-white">¿En qué puedo ayudarte?</p>
              <ul class="space-y-1.5 text-marine-200">
                <li class="flex gap-1.5"><span class="text-gold-400">•</span>Dudas de programación, algoritmos y cursos de la plataforma.</li>
                <li class="flex gap-1.5"><span class="text-gold-400">•</span>Peeega capturas (imagen) y te explico el error/código.</li>
                <li class="flex gap-1.5"><span class="text-gold-400">•</span>Sube un PDF o .txt y te lo resumo o explico.</li>
                <li class="flex gap-1.5"><span class="text-gold-400">•</span>Respuestas actuales con búsqueda web (citando fuentes).</li>
              </ul>
            </div>
          } @else {
            @for (m of mensajes(); track m.id) {
              <div class="flex" [class.justify-end]="m.rol === 'usuario'">
                <div class="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed"
                     [class]="m.rol === 'usuario'
                       ? 'rounded-br-md bg-gold-500 text-marine-900 font-semibold'
                       : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-marine-50'">
                  @if (m.adjuntos?.length) {
                    <div class="mb-2 flex flex-wrap gap-2">
                      @for (a of m.adjuntos; track a.nombre) {
                        @if (a.preview) {
                          <img [src]="a.preview" [alt]="a.nombre" class="max-h-40 rounded-lg border border-black/20 object-cover" />
                        } @else {
                          <span class="inline-flex items-center gap-1.5 rounded-lg border border-black/20 bg-black/10 px-2 py-1 text-[0.68rem] font-bold text-marine-900">
                            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                            {{ a.nombre }}
                          </span>
                        }
                      }
                    </div>
                  }
                  <p class="whitespace-pre-wrap">{{ m.contenido }}</p>
                  <p class="mt-1 text-[0.58rem] uppercase tracking-widest" [class.text-marine-800]="m.rol === 'usuario'" [class.text-marine-500]="m.rol !== 'usuario'">{{ m.hora }}</p>
                </div>
              </div>
            }
          }
          @if (enviando()) {
            <div class="flex">
              <div class="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[0.8rem] text-marine-200">
                <span class="size-2 animate-ping rounded-full bg-gold-400"></span>El asistente está pensando…
              </div>
            </div>
          }
          @if (error()) {
            <div class="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[0.75rem] leading-snug text-rose-200" role="alert">{{ error() }}</div>
          }
        </div>

        <!-- Adjuntos en cola -->
        @if (adjuntos().length) {
          <div class="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 px-3 py-2">
            @for (a of adjuntos(); track a.ruta) {
              <span class="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/5 py-1 pl-1 pr-2 text-[0.65rem] font-bold text-gold-300">
                @if (a.preview) {
                  <img [src]="a.preview" [alt]="a.nombre" class="size-7 rounded object-cover" />
                } @else {
                  <svg viewBox="0 0 24 24" class="size-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                }
                <span class="max-w-[9rem] truncate">{{ a.nombre }}</span>
                <button type="button" class="grid size-5 shrink-0 place-items-center rounded hover:bg-white/10" (click)="quitarAdjunto(a.ruta)" aria-label="Quitar adjunto">
                  <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </span>
            }
          </div>
        }

        <!-- Input -->
        <form class="border-t border-white/10 bg-marine-950/80 p-3" (submit)="enviar($event)">
          <label class="sr-only" for="asistente-input">Mensaje para el asistente</label>
          <div class="flex items-end gap-2">
            <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-marine-300 transition-all hover:border-gold-400/50 hover:text-gold-400 disabled:opacity-40"
                    (click)="seleccionarArchivos()" [disabled]="enviando() || adjuntos().length >= 3" aria-label="Adjuntar archivo o imagen" title="Adjuntar (máx. 3)">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.4 11-9.7 9.7a6 6 0 0 1-8.5-8.5l10-10a4 4 0 0 1 5.7 5.7l-10 10a2 2 0 0 1-2.8-2.8l9.1-9.1"/></svg>
            </button>
            <textarea id="asistente-input" name="mensaje" rows="2" maxlength="4000"
              class="w-full min-w-0 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[0.85rem] text-white placeholder-marine-400 outline-none transition-colors focus:border-gold-400/60"
              placeholder="Pregunta algo… (pega una captura o adjunta un PDF)"
              [(ngModel)]="borrador" (keydown)="tecla($event)"></textarea>
            <button type="submit" class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2 text-[0.75rem] font-extrabold uppercase tracking-widest text-marine-900 transition-all hover:bg-gold-400 disabled:opacity-40"
                    [disabled]="enviando() || (!borrador.trim() && !adjuntos().length)">
              <svg viewBox="0 0 24 24" class="size-4" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              Enviar
            </button>
          </div>
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

  protected readonly abierto = signal(false);
  protected readonly enviando = signal(false);
  protected readonly mensajes = signal<MensajeUI[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly adjuntos = signal<AdjuntoLocal[]>([]);
  protected borrador = '';
  /** ID de la conversación persistida en backend (null hasta la primera respuesta). */
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

  protected alternar(): void {
    this.abierto.update((v) => !v);
    this.error.set(null);
  }

  protected nuevaConversacion(): void {
    this.conversacionId = null;
    this.mensajes.set([]);
    this.adjuntos.set([]);
    this.error.set(null);
    this.borrador = '';
  }

  protected tecla(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      void this.enviar(ev);
    }
  }

  protected seleccionarArchivos(): void {
    this.fileInput?.nativeElement.click();
  }

  protected async archivosSeleccionados(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
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
        this.error.set('No se pudo subir "' + file.name + '". Revisa tu conexión y el tamaño (< 25 MB).');
      }
    }
  }

  protected quitarAdjunto(ruta: string): void {
    this.adjuntos.update((a) => a.filter((x) => x.ruta !== ruta));
    // No borramos el objeto del bucket: puede quedar referenciado por el historial
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
      this.error.set(
        'El asistente no está disponible en este momento. El backend debe tener configurada la clave CHATBOT_API_KEY + internet en el servidor (ver .env.example). Tu pregunta no se procesó.'
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
