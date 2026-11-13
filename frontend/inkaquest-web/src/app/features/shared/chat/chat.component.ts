// @ts-nocheck
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { MessageService, HiloResumen, MiembroCurso } from '../../../core/services/message.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { CourseService } from '../../../core/services/course.service';
import { Mensaje, Perfil, Curso } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Chat 1 a 1 estilo Messenger/WhatsApp.
 *
 * <p>Una sola pantalla para docente y estudiante:</p>
 * <ul>
 *   <li>Columna izquierda: búsqueda de contacto + conversaciones recientes
 *       con contador de no leídos.</li>
 *   <li>Columna derecha: conversación con burbujas, envío en vivo
 *       (Supabase Realtime) y marcar como leído automáticamente.</li>
 * </ul>
 */
@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <section class="flex h-[calc(100vh-5.5rem)] min-h-0 flex-col">
      <app-page-header titulo="Chat" descripcion="Conversaciones con tus estudiantes y compañeros de curso." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="refrescar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>

      <div class="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-12">
        <!-- ═════════ LISTA (oculta en móvil cuando hay hilo abierto) ═════════ -->
        <aside class="col-span-12 min-h-0 flex-col rounded-2xl border border-surface-200 bg-white shadow-card lg:col-span-4 lg:flex" [class.hidden]="hiloAbierto() && esMovil()" [class.flex]="true">
          <div class="border-b border-surface-100 p-3">
            <label class="sr-only" for="buscar-contacto">Buscar una persona</label>
            <div class="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
              <svg class="size-4 shrink-0 text-marine-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <input id="buscar-contacto" type="text" class="w-full bg-transparent text-sm text-marine-800 outline-none placeholder:text-marine-400" placeholder="Buscar por nombre, apellido o correo…" [value]="busqueda()" (input)="onBusqueda($event)" autocomplete="off" />
              @if (busqueda()) {
                <button type="button" class="text-xs font-bold text-brand-600 hover:underline" (click)="limpiarBusqueda()">Borrar</button>
              }
            </div>
            @if (misCursos().length > 0) {
              <label class="mt-2 block text-[0.68rem] font-bold uppercase tracking-wider text-marine-500" for="selector-curso">Curso</label>
              <select id="selector-curso" class="select mt-1 text-sm" [value]="cursoSel() ?? ''" (change)="onCurso($event)" aria-label="Elige el curso">
                <option value="">Todos los chats</option>
                @for (c of misCursos(); track c.id) {
                  <option [value]="c.id">{{ c.titulo }}</option>
                }
              </select>
            }
            <p class="mt-2 px-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-marine-400">{{ modoMiembros() ? (soyDocente() ? 'Estudiantes del curso' : 'Miembros del curso') : busqueda() ? 'Resultados' : 'Conversaciones' }}</p>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
            @if (error()) {
              <p class="px-2 py-4 text-xs text-danger-600">{{ error() }}</p>
            }

            <!-- Miembros del curso seleccionado -->
            @if (modoMiembros()) {
              @for (m of miembrosFiltrados(); track m.id) {
                <button type="button" class="chat-item" (click)="seleccionar(m.id, nombre(m), m.email)">
                  <span class="chat-avatar">{{ iniciales(nombre(m)) }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="block truncate text-sm font-bold text-marine-800">{{ nombre(m) }}</span>
                      <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide" [class]="claseRolTag(m.rol)">{{ etiquetaRolTag(m.rol) }}</span>
                    </span>
                    <span class="block truncate text-xs text-marine-400">{{ m.email }}</span>
                  </span>
                  <span class="shrink-0 text-[0.65rem] font-bold text-brand-600">Enviar</span>
                </button>
              } @empty {
                <p class="px-2 py-6 text-center text-xs text-marine-500">{{ busqueda() ? 'Nadie coincide con la búsqueda.' : soyDocente() ? 'No tienes estudiantes en este curso.' : 'No tienes compañeros/docentes en este curso.' }}</p>
                <p class="px-2 pb-4 text-center text-[0.68rem] text-marine-400">Diagnóstico: {{ diagnostico() }}</p>
              }
            } @else if (busqueda()) {
              @for (p of resultados(); track p.id) {
                <button type="button" class="chat-item" (click)="seleccionar(p.id, nombre(p), p.email)">
                  <span class="chat-avatar">{{ iniciales(nombre(p)) }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold text-marine-800">{{ nombre(p) }}</span>
                    <span class="block truncate text-xs text-marine-400">{{ p.email }}</span>
                  </span>
                  <span class="shrink-0 text-[0.65rem] font-bold text-brand-600">Escribir</span>
                </button>
              } @empty {
                <p class="px-2 py-6 text-center text-xs text-marine-500">Sin resultados. Prueba con otro nombre o correo.</p>
              }
            } @else {
              <!-- Hilos recientes -->
              @for (t of hilos(); track t.otroId) {
                <button type="button" class="chat-item" [class.chat-item-activo]="sel() === t.otroId" (click)="seleccionar(t.otroId, t.nombre, t.email)">
                  <span class="chat-avatar">{{ iniciales(t.nombre) }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold text-marine-800">{{ t.nombre }}</span>
                    <span class="block truncate text-xs" [class.text-marine-700]="t.noLeidos > 0" [class.font-semibold]="t.noLeidos > 0" [class.text-marine-400]="t.noLeidos === 0">{{ t.ultimoMensaje }}</span>
                  </span>
                  <span class="flex shrink-0 flex-col items-end gap-1">
                    <span class="text-[0.62rem] text-marine-400">{{ fechaCorta(t.ultimoEn) }}</span>
                    @if (t.noLeidos > 0) {
                      <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[0.65rem] font-extrabold text-white">{{ t.noLeidos > 9 ? '9+' : t.noLeidos }}</span>
                    }
                  </span>
                </button>
              } @empty {
                <div class="px-3 py-8 text-center">
                  <svg class="mx-auto size-12 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-linecap="round" /><path d="M21 12c0 4.4-4 8-9 8a9.5 9.5 0 0 1-4-.8L3 20l1.5-3.8A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" stroke-linejoin="round" /></svg>
                  <p class="mt-2 text-xs font-medium text-marine-500">Aún no tienes conversaciones. Busca a alguien arriba y empieza un chat.</p>
                </div>
              }
            }
          </div>
        </aside>

        <!-- ═════════ CONVERSACIÓN ═════════ -->
        <div class="col-span-12 flex min-h-0 flex-col rounded-2xl border border-surface-200 bg-white shadow-card lg:col-span-8" [class.hidden]="!hiloAbierto() && esMovil()" [class.flex]="true">
          @if (contacto(); as c) {
            <header class="flex items-center gap-3 border-b border-surface-100 p-3">
              <button type="button" class="mr-1 rounded-lg p-1.5 text-marine-500 hover:bg-surface-100 lg:hidden" (click)="cerrarHilo()" aria-label="Volver a la lista">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
              <span class="chat-avatar">{{ iniciales(c.nombre) }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-extrabold text-marine-800">{{ c.nombre }}</p>
                <p class="truncate text-[0.7rem] text-marine-400">{{ c.email }}</p>
              </div>
            </header>

            <div #scrollRef class="chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
              @if (mensajes().length === 0) {
                <p class="py-8 text-center text-xs text-marine-500">Aún no hay mensajes con {{ c.nombre.split(' ')[0] }}. ¡Di hola!</p>
              }
              @for (m of mensajes(); track m.id) {
                <div class="flex" [class.justify-end]="m.emisor_id === miId()">
                  <div class="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug"
                    [class.bg-brand-500]="m.emisor_id === miId()"
                    [class.text-white]="m.emisor_id === miId()"
                    [class.rounded-br-md]="m.emisor_id === miId()"
                    [class.bg-surface-100]="m.emisor_id !== miId()"
                    [class.text-marine-800]="m.emisor_id !== miId()"
                    [class.rounded-bl-md]="m.emisor_id !== miId()">
                    <p class="whitespace-pre-wrap break-words">{{ m.cuerpo }}</p>
                    <p class="mt-1 text-right text-[0.62rem] opacity-75">{{ m.creado_en | date:'HH:mm' }}</p>
                  </div>
                </div>
              }
            </div>

            <form class="flex items-end gap-2 border-t border-surface-100 p-3" [formGroup]="form" (ngSubmit)="enviar()" aria-label="Escribir mensaje">
              <textarea class="input max-h-36 min-h-11 flex-1 resize-y !py-2.5" rows="1" formControlName="cuerpo" placeholder="Escribe un mensaje…" (keydown)="onKeydown($event)"></textarea>
              <button type="submit" class="btn btn-primary btn-md shrink-0" [disabled]="form.invalid || enviando()" aria-label="Enviar mensaje">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 11.5 21 3l-8.5 18-2-8.5-7.5-1z" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </form>
          } @else {
            <div class="hidden flex-col items-center justify-center gap-3 p-10 text-center lg:flex">
              <svg class="size-20 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-linecap="round" /><path d="M21 12c0 4.4-4 8-9 8a9.5 9.5 0 0 1-4-.8L3 20l1.5-3.8A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" stroke-linejoin="round" /></svg>
              <h3 class="text-lg font-bold text-marine-700">Elige una conversación</h3>
              <p class="max-w-sm text-xs text-marine-500">Selecciona un chat de la lista o busca a un compañero o estudiante para empezar a conversar en tiempo real.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .chat-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; border-radius: 0.9rem; padding: 0.6rem 0.75rem; text-align: left; transition: background 150ms ease; cursor: pointer; }
    .chat-item:hover { background: var(--color-surface-50, #f7fbfa); }
    .chat-item-activo { background: var(--color-brand-50, #e8f6f4); }
    .chat-avatar { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; flex-shrink: 0; border-radius: 9999px; background: linear-gradient(135deg, #12736b, #0d4a45); color: #fff; font-weight: 800; font-size: 0.82rem; }
    .chat-scroll { scrollbar-width: thin; }
  `],
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);

  /** Etiqueta para el rol del miembro. */
  protected etiquetaRolTag(rol: string): string {
    switch (rol) {
      case 'docente': return 'Docente';
      case 'administrador': return 'Admin';
      default: return 'Alumno';
    }
  }
  /** Clase de estilo para la etiqueta del rol. */
  protected claseRolTag(rol: string): string {
    switch (rol) {
      case 'docente': return 'bg-gold-100 text-gold-700';
      case 'administrador': return 'bg-marine-100 text-marine-700';
      default: return 'bg-surface-100 text-marine-600';
    }
  }

  @ViewChild('scrollRef') private scrollRef?: ElementRef<HTMLElement>;

  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly resultados = signal<Perfil[]>([]);
  protected readonly hilos = signal<HiloResumen[]>([]);
  protected readonly sel = signal<string | null>(null);
  protected readonly datosSel = signal<{ nombre: string; email: string } | null>(null);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly misCursos = signal<Curso[]>([]);
  protected readonly cursoSel = signal<string | null>(null);
  protected readonly miembrosCurso = signal<MiembroCurso[]>([]);

  /** Una sola vez por apertura: si el usuario no eligió curso y tiene al menos uno, auto-seleccionarlo. */
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
  protected readonly hiloAbierto = computed(() => this.sel() !== null);
  protected readonly esMovil = () => typeof window !== 'undefined' && window.innerWidth < 1024;

  protected readonly totalNoLeidos = computed(() =>
    this.hilos().reduce((s, t) => s + t.noLeidos, 0),
  );

  /** Diagnóstico visible en pantalla sobre cursos/miembros cargados. */
  protected readonly diagnostico = computed(() => {
    const n = this.misCursos().length;
    const sel = this.cursoSel();
    if (!sel) {
      return n === 0
        ? 'Tu cuenta no detectó ninguno de tus cursos. Verifica tu matrícula.'
        : `Tu cuenta detectó ${n} curso(s). Selecciona uno en el selector y verás a los miembros aquí.`;
    }
    const titulo = this.misCursos().find((c) => c.id === sel)?.titulo ?? 'este curso';
    return `Mostrando a ${this.miembrosCurso().length} miembro(s) de «${titulo}».`;
  });

  protected readonly modoMiembros = computed(() => this.cursoSel() !== null);

  /** Vista restringida del aula: solo rol docente ve únicamente sus estudiantes. El administrador ve todo. */
  protected readonly soyDocente = computed(() => {
    return this.auth.rol() === 'docente';
  });

  protected readonly miembrosFiltrados = computed(() => {
    const m = this.miembrosCurso();
    // Rol docente: solo ve estudiantes (no se ve a sí mismo). Administrador y estudiante ven todo.
    const base = this.soyDocente() ? m.filter((x) => x.rol === 'estudiante') : m;
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return base;
    return base.filter((x) => {
      const nombre = this.nombre(x).toLowerCase();
      return nombre.includes(q) || x.email.toLowerCase().includes(q);
    });
  });

  protected readonly form = this.fb.nonNullable.group({
    cuerpo: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
  });

  /** Canales realtime abiertos para escuchar INSERTs. */
  private canal: ReturnType<typeof this.supabase.client.channel> | null = null;

  ngOnInit(): void {
    void this.cargarHilos();
    void this.cargarMisCursos();
    this.suscribirRealtime();
  }

  ngOnDestroy(): void {
    if (this.canal) {
      void this.supabase.client.removeChannel(this.canal);
      this.canal = null;
    }
  }

  protected async refrescar(): Promise<void> {
    const otro = this.sel();
    await this.cargarHilos();
    if (otro) await this.cargarMensajes(otro);
  }

  protected onBusqueda(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.busqueda.set(q);
    void this.buscar(q);
  }

  /** Cambia el curso seleccionado y carga sus miembros. */
  protected onCurso(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.cursoSel.set(id || null);
    this.busqueda.set('');
    this.resultados.set([]);
    this.miembrosCurso.set([]);
    if (id) {
      void this.cargarMiembros(id);
    }
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
      // Apertura de la página: auto-seleccionar el primer curso para que el usuario VEA a sus miembros.
      if (!this.cursoSel() && cursos.length > 0 && !this.autoSeleccionCursoHecha) {
        this.autoSeleccionCursoHecha = true;
        const id = cursos[0].id;
        this.cursoSel.set(id);
        void this.cargarMiembros(id);
      }
    } catch (e) {
      console.error('[chat] cargarMisCursos falló:', e);
      this.error.set(e instanceof Error ? `No se pudieron cargar tus cursos: ${e.message}` : 'No se pudieron cargar tus cursos.');
      this.misCursos.set([]);
    }
  }

  private async cargarMiembros(cursoId: string): Promise<void> {
    try {
      this.miembrosCurso.set(await this.messageService.listarMiembrosCurso(cursoId));
    } catch (e) {
      console.error('[chat] cargarMiembros falló:', e);
      this.error.set(e instanceof Error ? `No se pudieron cargar los miembros del curso: ${e.message}` : 'No se pudieron cargar los miembros del curso.');
      this.miembrosCurso.set([]);
    }
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
    this.resultados.set([]);
  }

  protected seleccionar(id: string, nombre: string, email: string): void {
    this.sel.set(id);
    this.datosSel.set({ nombre, email });
    this.limpiarBusqueda();
    void this.cargarMensajes(id);
  }

  protected cerrarHilo(): void {
    if (this.esMovil()) {
      this.sel.set(null);
      return;
    }
    this.sel.set(null);
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '–';
  }

  protected fechaCorta(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) {
      return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  protected async cargarHilos(): Promise<void> {
    try {
      this.hilos.set(await this.messageService.listarHilos());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los mensajes.');
    }
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
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.enviar();
    }
  }

  private async buscar(q: string): Promise<void> {
    const t = q.trim();
    if (t.length < 2) {
      this.resultados.set([]);
      return;
    }
    try {
      this.resultados.set(await this.messageService.buscarContactos(t));
    } catch {
      this.resultados.set([]);
    }
  }

  protected nombre(p: Perfil): string {
    return [p.nombre, p.apellido].filter(Boolean).join(' ').trim() || p.email;
  }

  private scrollAlFinal(): void {
    setTimeout(() => {
      const el = this.scrollRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  private suscribirRealtime(): void {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    this.canal = this.supabase.client
      .channel(`chat-${usuario.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensaje' },
        (payload) => {
          const m = payload.new as Mensaje;
          const activo = this.sel();
          const esDelHilo =
            m.emisor_id === activo || m.destinatario_id === activo;
          if (esDelHilo && activo) {
            this.mensajes.update((arr) => {
              if (arr.some((x) => x.id === m.id)) return arr;
              return [...arr, m];
            });
            if (m.emisor_id === activo) {
              void this.messageService.marcarLeidos(activo);
            }
            this.scrollAlFinal();
          }
          void this.cargarHilos();
        },
      )
      .subscribe();
  }
}
