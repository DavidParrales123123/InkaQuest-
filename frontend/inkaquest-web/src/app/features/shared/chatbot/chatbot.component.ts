// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ChatbotConversacion, ChatbotMensaje, ChatbotService } from '../../../core/services/chatbot.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Chatbot con IA (UI e integración preparada).
 *
 * <p>Las consultas y acciones se procesan en el backend con validación de
 * permisos/roles y sin exponer claves de IA en el cliente. Si el endpoint no
 * está disponible, se muestra un estado claro y la integración queda documentada.</p>
 */
@Component({
  selector: 'app-chatbot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ButtonComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Asistente InkaQuest"
        descripcion="Obtén ayuda sobre la plataforma, cursos y contenidos según tus permisos. La IA se ejecuta de forma segura en el backend."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <app-button variante="contorno" tamano="sm" (alPulsar)="nuevaConversacion()">Nueva conversación</app-button>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()" [deshabilitado]="cargando()">Actualizar</app-button>
        </div>
      </app-page-header>

      <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside class="card card-body h-fit">
          <h2 class="text-sm font-semibold text-marine-800">Conversaciones</h2>
          @if (cargando()) {
            <p class="mt-3 text-sm text-marine-500">Cargando historial…</p>
          } @else if (error()) {
            <p class="mt-3 text-sm text-danger-600">{{ error() }}</p>
            <p class="mt-2 text-xs text-marine-500">La integración del chatbot depende del backend/servicio de IA (endpoints protegidos). Mientras no esté disponible, puedes usar el centro de ayuda o soporte.</p>
            <a routerLink="/app/soporte" class="btn btn-outline btn-sm mt-3">Ir a soporte</a>
          } @else if (conversaciones().length === 0) {
            <p class="mt-3 text-sm text-marine-500">No hay conversaciones disponibles. Inicia una nueva cuando el servicio esté activo.</p>
          } @else {
            <ul class="mt-3 space-y-2">
              @for (c of conversaciones(); track c.id) {
                <li>
                  <button type="button" class="w-full rounded-lg border p-3 text-left text-sm transition hover:bg-surface-50" [class.border-brand-300]="c.id === conversacionId()" [class.bg-brand-50]="c.id === conversacionId()" [class.border-surface-200]="c.id !== conversacionId()" (click)="seleccionar(c.id)">
                    <p class="font-medium text-marine-800">{{ c.titulo || 'Conversación' }}</p>
                    @if (c.actualizado_en || c.creado_en) { <p class="mt-1 text-xs text-marine-500">{{ (c.actualizado_en || c.creado_en) | date:'short' }}</p> }
                  </button>
                </li>
              }
            </ul>
          }
        </aside>

        <div class="card card-body flex min-h-[28rem] flex-col">
          <div class="flex-1 space-y-3 overflow-auto pr-1" aria-live="polite">
            @if (mensajes().length === 0) {
              <div class="rounded-xl bg-surface-50 p-4 text-sm text-marine-600">
                <p class="font-semibold text-marine-800">¿En qué puedo ayudarte?</p>
                <ul class="mt-2 list-disc space-y-1 pl-5">
                  <li>Orientación sobre el uso de la plataforma y sus funcionalidades.</li>
                  <li>Ayuda para encontrar cursos y entender contenidos educativos (según acceso).</li>
                  <li>Consultas permitidas por tu rol (estudiante, docente o administrador).</li>
                </ul>
                <p class="mt-3 text-xs text-marine-500">Nota: el asistente no expone información privada de otros usuarios, no ejecuta acciones sensibles sin autorización y responde según permisos y datos disponibles en backend.</p>
              </div>
            } @else {
              @for (m of mensajes(); track m.id || $index) {
                <div class="flex" [class.justify-end]="m.rol === 'usuario'">
                  <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm" [class.bg-brand-500]="m.rol === 'usuario'" [class.text-white]="m.rol === 'usuario'" [class.bg-surface-100]="m.rol !== 'usuario'" [class.text-marine-800]="m.rol !== 'usuario'">
                    <p class="whitespace-pre-wrap">{{ m.contenido }}</p>
                    @if (m.creado_en) { <p class="mt-1 text-[11px] opacity-70">{{ m.creado_en | date:'short' }}</p> }
                  </div>
                </div>
              }
            }
            @if (enviando()) {
              <div class="flex"><div class="rounded-2xl bg-surface-100 px-4 py-3 text-sm text-marine-600">El asistente está respondiendo…</div></div>
            }
          </div>

          <form class="mt-4 border-t border-surface-200 pt-4" [formGroup]="form" (ngSubmit)="enviar()">
            @if (errorEnvio()) { <p class="mb-2 text-sm text-danger-600">{{ errorEnvio() }}</p> }
            <label class="label" for="msg">Mensaje</label>
            <textarea id="msg" class="textarea" rows="3" formControlName="contenido" placeholder="Escribe tu consulta…"></textarea>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs text-marine-500">Integración backend/IA requerida para respuestas reales. No se envían claves desde el navegador.</p>
              <app-button type="submit" variante="primario" [cargando]="enviando()" [deshabilitado]="form.invalid || enviando()">Enviar</app-button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class ChatbotComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly chatbot = inject(ChatbotService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly conversaciones = signal<ChatbotConversacion[]>([]);
  protected readonly mensajes = signal<ChatbotMensaje[]>([]);
  protected readonly conversacionId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    contenido: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(4000)]],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    if (!this.auth.usuario()) return;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const convs = await this.chatbot.listarConversaciones();
      this.conversaciones.set(Array.isArray(convs) ? convs : []);
    } catch (e) {
      // Integración pendiente: mostrar estado claro sin romper la UI
      this.conversaciones.set([]);
      this.error.set('No se pudo conectar con el servicio de chatbot en este momento.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected nuevaConversacion(): void {
    this.conversacionId.set(null);
    this.mensajes.set([]);
    this.errorEnvio.set(null);
  }

  protected async seleccionar(id: string): Promise<void> {
    this.conversacionId.set(id);
    this.errorEnvio.set(null);
    try {
      const msgs = await this.chatbot.listarMensajes(id);
      this.mensajes.set(Array.isArray(msgs) ? msgs : []);
    } catch {
      this.mensajes.set([]);
      this.errorEnvio.set('No se pudieron cargar los mensajes de esta conversación (servicio no disponible).');
    }
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid) return;
    const contenido = this.form.controls.contenido.value.trim();
    if (!contenido) return;
    this.enviando.set(true);
    this.errorEnvio.set(null);
    const userMsg: ChatbotMensaje = { rol: 'usuario', contenido, creado_en: new Date().toISOString() };
    this.mensajes.update((m) => [...m, userMsg]);
    this.form.reset({ contenido: '' });
    try {
      const res = await this.chatbot.enviarMensaje(this.conversacionId(), contenido);
      if (res?.conversacion?.id) this.conversacionId.set(res.conversacion.id);
      if (res?.respuesta) this.mensajes.update((m) => [...m, res.respuesta]);
      await this.cargar();
    } catch (e) {
      this.errorEnvio.set('No se pudo enviar el mensaje: el servicio de chatbot/IA aún no está disponible o requiere configuración de backend. Tu consulta no se procesó.');
    } finally {
      this.enviando.set(false);
    }
  }
}
