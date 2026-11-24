// @ts-nocheck
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';

import { ConfirmService } from '../../../core/services/confirm.service';
import { ForoRespuesta, ForoTema, ForumService } from '../../../core/services/forum.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';

interface ForoCurso { cursoId: string; titulo: string; foroId: string | null; }

/** Panel de comunidad por curso. Reutilizable en estudiante y docente. */
@Component({
  selector: 'app-forum-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent],
  template: `
    <div class="space-y-5">
      @if (cursos().length > 1) {
        <div class="card card-body">
          <label class="label" for="foro-curso">Curso</label>
          <select id="foro-curso" class="select" [value]="cursoSel()" (change)="cambiarCurso($any($event.target).value)">
            @for (f of foros(); track f.cursoId) {
              <option [value]="f.cursoId">{{ f.titulo }}</option>
            }
          </select>
        </div>
      }

      @if (mensaje(); as msg) {
        <p class="rounded-lg border p-3 text-sm font-medium"
          [class]="msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'"
          role="status">{{ msg.texto }}</p>
      }

      <div class="card card-body space-y-3">
        <h2 class="text-base font-extrabold text-marine-800">Nuevo tema</h2>
        <div>
          <label class="label" for="tema-titulo">Título</label>
          <input id="tema-titulo" class="input" [value]="nuevoTitulo()" (input)="nuevoTitulo.set($any($event.target).value)"
            placeholder="¿De qué quieres hablar?" maxlength="160" />
        </div>
        <div>
          <label class="label" for="tema-cuerpo">Mensaje</label>
          <textarea id="tema-cuerpo" class="textarea" rows="3" [value]="nuevoCuerpo()"
            (input)="nuevoCuerpo.set($any($event.target).value)" placeholder="Explica tu duda o comparte tu aporte…" maxlength="8000"></textarea>
        </div>
        <div class="flex justify-end">
          <button type="button" class="btn btn-primary" [disabled]="creando() || !foroId()" (click)="crearTema()">
            {{ creando() ? 'Publicando…' : 'Publicar tema' }}
          </button>
        </div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="temas().length === 0"
        tituloVacio="Aún no hay temas" descripcionVacia="Sé la primera persona en iniciar una conversación en este curso."
        (alReintentar)="cargarTemas()">
        <div contenido class="space-y-3">
          @for (t of temas(); track t.id) {
            <article class="card card-body space-y-3">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    @if (t.fijado) { <span class="badge badge-warning">Fijado</span> }
                    @if (t.cerrado) { <span class="badge badge-danger">Cerrado</span> }
                    <p class="break-words font-semibold text-marine-800">{{ t.titulo }}</p>
                  </div>
                  <p class="mt-1 text-xs text-marine-500">
                    {{ autorNombre(t.autor) }} · {{ t.ultima_actividad_en | date:'medium' }} ·
                    {{ t.respuestas ?? 0 }} respuesta(s)
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <button type="button" class="btn btn-outline btn-sm" (click)="toggleRespuestas(t)">
                    {{ temaAbierto() === t.id ? 'Ocultar' : 'Ver respuestas' }}
                  </button>
                  @if (puedeModerar()) {
                    <button type="button" class="btn btn-outline btn-sm" (click)="fijar(t)">{{ t.fijado ? 'Desfijar' : 'Fijar' }}</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="cerrar(t)">{{ t.cerrado ? 'Reabrir' : 'Cerrar' }}</button>
                    <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminar(t)">Eliminar</button>
                  }
                </div>
              </div>

              <p class="whitespace-pre-wrap break-words text-sm text-marine-700">{{ t.cuerpo }}</p>

              @if (temaAbierto() === t.id) {
                <div class="space-y-2 border-t border-surface-100 pt-3">
                  @if (cargandoRespuestas()) {
                    <p class="text-sm text-marine-500">Cargando respuestas…</p>
                  } @else {
                    @for (r of respuestas(); track r.id) {
                      <div class="rounded-xl border border-surface-200 bg-surface-50 p-3">
                        <p class="text-xs font-semibold text-marine-700">{{ autorNombre(r.autor) }} · {{ r.creado_en | date:'medium' }}</p>
                        <p class="mt-1 whitespace-pre-wrap break-words text-sm text-marine-700">{{ r.cuerpo }}</p>
                      </div>
                    } @empty {
                      <p class="text-sm text-marine-500">Todavía no hay respuestas.</p>
                    }
                  }

                  @if (!t.cerrado) {
                    <div class="flex flex-col gap-2 sm:flex-row">
                      <input class="input flex-1" [value]="respuestaTexto()" (input)="respuestaTexto.set($any($event.target).value)"
                        placeholder="Escribe tu respuesta…" maxlength="8000" />
                      <button type="button" class="btn btn-primary shrink-0" [disabled]="respondiendo()"
                        (click)="responder(t)">{{ respondiendo() ? 'Enviando…' : 'Responder' }}</button>
                    </div>
                  } @else {
                    <p class="text-xs text-marine-500">Este tema fue cerrado; ya no se pueden agregar respuestas.</p>
                  }
                </div>
              }
            </article>
          }
        </div>
      </app-data-panel>
    </div>
  `,
})
export class ForumPanelComponent implements OnInit {
  readonly cursos = input.required<{ id: string; titulo: string }[]>();
  readonly usuarioId = input.required<string>();
  readonly puedeModerar = input<boolean>(false);

  private readonly forum = inject(ForumService);
  private readonly confirm = inject(ConfirmService);

  protected readonly foros = signal<ForoCurso[]>([]);
  protected readonly cursoSel = signal('');
  protected readonly foroId = computed(() => this.foros().find((f) => f.cursoId === this.cursoSel())?.foroId ?? null);

  protected readonly temas = signal<ForoTema[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<{ ok: boolean; texto: string } | null>(null);

  protected readonly nuevoTitulo = signal('');
  protected readonly nuevoCuerpo = signal('');
  protected readonly creando = signal(false);

  protected readonly temaAbierto = signal<string | null>(null);
  protected readonly respuestas = signal<ForoRespuesta[]>([]);
  protected readonly respuestaTexto = signal('');
  protected readonly cargandoRespuestas = signal(false);
  protected readonly respondiendo = signal(false);

  ngOnInit(): void { void this.cargar(); }

  protected autorNombre(autor: any): string {
    const a = Array.isArray(autor) ? autor[0] : autor;
    if (!a) return 'Usuario';
    return `${a.nombre ?? ''} ${a.apellido ?? ''}`.trim() || a.email || 'Usuario';
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const resultados = await Promise.all(this.cursos().map(async (c) => ({
        cursoId: c.id,
        titulo: c.titulo,
        foroId: await this.forum.asegurarForo(c.id).catch(() => null),
      })));
      this.foros.set(resultados);
      if (!this.cursoSel() && resultados.length) this.cursoSel.set(resultados[0].cursoId);
      await this.cargarTemas();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la comunidad.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarCurso(id: string): Promise<void> {
    this.cursoSel.set(id);
    this.temaAbierto.set(null);
    this.respuestas.set([]);
    await this.cargarTemas();
  }

  protected async cargarTemas(): Promise<void> {
    const id = this.foroId();
    if (!id) { this.temas.set([]); return; }
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.temas.set(await this.forum.listarTemas(id));
    } catch (e) {
      this.temas.set([]);
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los temas.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async crearTema(): Promise<void> {
    const id = this.foroId();
    const titulo = this.nuevoTitulo().trim();
    const cuerpo = this.nuevoCuerpo().trim();
    if (!id || titulo.length < 3 || cuerpo.length < 1) {
      this.mensaje.set({ ok: false, texto: 'Escribe un título (mín. 3 caracteres) y un mensaje.' });
      return;
    }
    this.creando.set(true);
    this.mensaje.set(null);
    try {
      await this.forum.crearTema(id, this.usuarioId(), titulo, cuerpo);
      this.nuevoTitulo.set('');
      this.nuevoCuerpo.set('');
      await this.cargarTemas();
      this.mensaje.set({ ok: true, texto: 'Tema publicado en la comunidad del curso.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo publicar el tema.' });
    } finally {
      this.creando.set(false);
    }
  }

  protected async toggleRespuestas(t: ForoTema): Promise<void> {
    if (this.temaAbierto() === t.id) {
      this.temaAbierto.set(null);
      this.respuestas.set([]);
      return;
    }
    this.temaAbierto.set(t.id);
    this.respuestaTexto.set('');
    this.cargandoRespuestas.set(true);
    try {
      this.respuestas.set(await this.forum.listarRespuestas(t.id));
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar las respuestas.' });
    } finally {
      this.cargandoRespuestas.set(false);
    }
  }

  protected async responder(t: ForoTema): Promise<void> {
    const cuerpo = this.respuestaTexto().trim();
    if (!cuerpo) return;
    this.respondiendo.set(true);
    try {
      await this.forum.crearRespuesta(t.id, this.usuarioId(), cuerpo);
      this.respuestaTexto.set('');
      this.respuestas.set(await this.forum.listarRespuestas(t.id));
      await this.cargarTemas();
      this.mensaje.set({ ok: true, texto: 'Respuesta publicada.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo publicar la respuesta.' });
    } finally {
      this.respondiendo.set(false);
    }
  }

  protected async fijar(t: ForoTema): Promise<void> {
    try {
      await this.forum.fijarTema(t.id, !t.fijado);
      await this.cargarTemas();
    } catch (e) { this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo actualizar.' }); }
  }

  protected async cerrar(t: ForoTema): Promise<void> {
    try {
      await this.forum.cerrarTema(t.id, !t.cerrado);
      await this.cargarTemas();
    } catch (e) { this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo actualizar.' }); }
  }

  protected async eliminar(t: ForoTema): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar tema',
      mensaje: `¿Eliminar el tema «${t.titulo}» y todas sus respuestas? No se puede deshacer.`,
      textoConfirmar: 'Eliminar',
    });
    if (!ok) return;
    try {
      await this.forum.eliminarTema(t.id);
      if (this.temaAbierto() === t.id) { this.temaAbierto.set(null); this.respuestas.set([]); }
      await this.cargarTemas();
      this.mensaje.set({ ok: true, texto: 'Tema eliminado.' });
    } catch (e) { this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar.' }); }
  }
}
