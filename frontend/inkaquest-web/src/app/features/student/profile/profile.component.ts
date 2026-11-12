import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

/**
 * Perfil del estudiante.
 */
@Component({
  selector: 'app-student-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Mi perfil" descripcion="Consulta y actualiza la información básica de tu cuenta." />

      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card etiqueta="Nivel" [valor]="auth.perfil()?.nivel ?? 1" [icono]="true" tono="gold">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.8 7.1 18.2 8 12.7 4 8.8l5.5-.8z"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="XP total" [valor]="auth.perfil()?.xp ?? 0" [icono]="true" tono="brand">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg></span>
        </app-stat-card>
        <app-stat-card etiqueta="Rol" [valor]="auth.perfil()?.rol ?? '-'" [icono]="true" tono="surface">
          <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg></span>
        </app-stat-card>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Foto de perfil</h2>
            <p class="mt-1 text-sm text-marine-500">Sube una imagen, ajústala y guárdala. Podrás cambiarla cuando quieras.</p>

            <div class="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div class="relative shrink-0">
                @if (auth.perfil()?.avatar_url) {
                  <img [src]="auth.perfil()!.avatar_url!" alt="Foto de perfil" class="h-36 w-36 rounded-full object-cover ring-4 ring-surface-200 sm:h-40 sm:w-40" />
                } @else {
                  <div class="flex h-36 w-36 items-center justify-center rounded-full bg-surface-100 text-3xl font-bold text-marine-500 ring-4 ring-surface-200 sm:h-40 sm:w-40">
                    {{ inicialesAvatar() }}
                  </div>
                }
              </div>
              <div class="flex-1 space-y-3">
                <input #inputAvatar type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="onArchivoSeleccionado($event)" />
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn btn-primary btn-sm" (click)="inputAvatar.click()" [disabled]="subiendoAvatar()">
                    {{ auth.perfil()?.avatar_url ? 'Cambiar foto' : 'Subir foto' }}
                  </button>
                  @if (auth.perfil()?.avatar_url) {
                    <button type="button" class="btn btn-outline btn-sm" (click)="quitarFoto()" [disabled]="subiendoAvatar()">Quitar foto</button>
                  }
                </div>
                <p class="text-xs text-marine-500">Formatos: JPG, PNG o WebP. Recomendado: imagen cuadrada. Se guardará en tu perfil.</p>
                @if (mensajeAvatar()) {
                  <p class="text-sm" [class.text-success-600]="exitoAvatar()" [class.text-danger-600]="!exitoAvatar()">{{ mensajeAvatar() }}</p>
                }
              </div>
            </div>

            @if (editorAbierto()) {
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-marine-900/60 p-4" (click)="cerrarEditor()">
                <div class="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6" (click)="$event.stopPropagation()">
                  <h3 class="text-lg font-semibold text-marine-800">Ajustar foto de perfil</h3>
                  <p class="mt-1 text-sm text-marine-500">Arrastra la imagen para centrarla y usa el zoom para encajarla bien dentro del círculo.</p>

                  <div class="mt-4 flex justify-center">
                    <div
                      #viewportAvatar
                      class="relative h-80 w-80 overflow-hidden rounded-full bg-surface-100 touch-none select-none ring-4 ring-white shadow-inner sm:h-96 sm:w-96"
                      (pointerdown)="iniciarArrastre($event)"
                      (pointermove)="moverArrastre($event)"
                      (pointerup)="terminarArrastre()"
                      (pointerleave)="terminarArrastre()"
                    >
                      @if (imagenEditorUrl()) {
                        <img
                          [src]="imagenEditorUrl()!"
                          alt="Vista previa"
                          class="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
                          [style.transform]="transformImagen()"
                          draggable="false"
                        />
                      }
                      <div class="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"></div>
                      <div class="pointer-events-none absolute inset-0 rounded-full" style="box-shadow: 0 0 0 9999px rgba(27,42,74,0.35)"></div>
                    </div>
                  </div>

                  <div class="mt-4 space-y-2">
                    <label class="label" for="zoom-avatar">Zoom</label>
                    <input id="zoom-avatar" type="range" min="1" max="4" step="0.01" [value]="zoom()" (input)="onZoom($event)" class="w-full" />
                    <p class="text-xs text-marine-500">Arrastra para centrar y usa el zoom. Lo que ves dentro del círculo es exactamente lo que se guardará.</p>
                  </div>

                  <div class="mt-5 flex flex-wrap justify-end gap-2">
                    <button type="button" class="btn btn-outline btn-sm" (click)="cerrarEditor()" [disabled]="subiendoAvatar()">Cancelar</button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="guardarAvatar()" [disabled]="subiendoAvatar()">
                      {{ subiendoAvatar() ? 'Guardando…' : 'Guardar foto' }}
                    </button>
                  </div>
                </div>
              </div>
            }

            <canvas #canvasAvatar class="hidden" width="512" height="512"></canvas>
          </div>

          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Datos personales</h2>
            <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
              <div class="grid sm:grid-cols-2 gap-4">
                <div><label class="label" for="nombre">Nombre</label><input id="nombre" class="input" formControlName="nombre" /></div>
                <div><label class="label" for="apellido">Apellido</label><input id="apellido" class="input" formControlName="apellido" /></div>
                <div><label class="label" for="documento">Documento / DNI</label><input id="documento" class="input" formControlName="documento" placeholder="Ej. 12345678" /></div>
                <div><label class="label" for="genero">Género</label><select id="genero" class="select" formControlName="genero"><option value="">Selecciona</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="otro">Otro</option><option value="prefiero_no_decir">Prefiero no decir</option></select></div>
                <div><label class="label" for="fecha_nacimiento">Fecha de nacimiento</label><input id="fecha_nacimiento" type="date" class="input" formControlName="fecha_nacimiento" /></div>
                <div class="sm:col-span-2"><label class="label" for="telefono">Teléfono</label><input id="telefono" type="tel" class="input" formControlName="telefono" placeholder="Ej. +51 987 654 321" /></div>
                <div class="sm:col-span-2"><label class="label" for="bio">Bio / sobre mí</label><textarea id="bio" class="textarea" rows="3" formControlName="bio" placeholder="Cuéntanos brevemente sobre ti"></textarea></div>
              </div>
              <div>
                <label class="label" for="email">Correo</label>
                <input id="email" class="input" [value]="auth.perfil()?.email ?? auth.usuario()?.email ?? ''" disabled />
              </div>
              @if (mensaje()) {
                <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p>
              }
              <app-button type="submit" variante="primario" [cargando]="guardando()" [deshabilitado]="form.invalid || guardando()">Guardar cambios</app-button>
              <p class="text-xs text-marine-400">Algunos campos (correo, rol) son gestionados por el sistema y no pueden modificarse aquí.</p>
            </form>

            <div class="mt-8 border-t border-surface-200 pt-5">
              <h2 class="text-lg font-semibold text-marine-800">Seguridad</h2>
              <p class="mt-2 text-sm text-marine-500">La gestión de contraseña se realiza desde el flujo de recuperación de cuenta.</p>
              <a routerLink="/recuperar-password" class="btn btn-outline btn-md mt-4 w-fit">Restablecer contraseña</a>
              <div class="mt-6 border-t border-surface-200 pt-4 text-sm text-marine-600">
                <p><strong>Estado de cuenta:</strong> {{ etiquetaEstadoCuenta(auth.perfil()?.estado_cuenta) }}</p>
                @if (auth.perfil()?.estado_cuenta === 'pendiente_verificacion') {
                  <p class="mt-1 text-xs text-marine-500">
                    @if (auth.usuario()?.email_confirmed_at) {
                      Tu correo ya está confirmado. Estamos actualizando el estado de tu cuenta; si continúa pendiente, recarga la página o contacta a soporte.
                    } @else {
                      Confirma tu correo desde el enlace que te enviamos para activar tu cuenta.
                    }
                  </p>
                }
                <p class="mt-2"><strong>Miembro desde:</strong> {{ formatearFecha(auth.perfil()?.creado_en) }}</p>
              </div>
              @if (auth.rol() === 'estudiante') {
                <div class="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                  <h3 class="text-sm font-semibold text-marine-800">Acceso como docente</h3>
                  <p class="mt-1 text-sm text-marine-600">Si te registraste como docente o deseas enseñar, envía o revisa tu solicitud para que un administrador la apruebe.</p>
                  <a routerLink="/solicitar-acceso-docente" class="btn btn-primary btn-sm mt-3 inline-flex">Solicitar / ver solicitud docente</a>
                </div>
              }
            </div>
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ProfileComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('canvasAvatar') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportAvatar') private viewportRef?: ElementRef<HTMLDivElement>;

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  protected readonly subiendoAvatar = signal(false);
  protected readonly mensajeAvatar = signal('');
  protected readonly exitoAvatar = signal(false);
  protected readonly editorAbierto = signal(false);
  protected readonly imagenEditorUrl = signal<string | null>(null);
  protected readonly zoom = signal(1);
  protected readonly offsetX = signal(0);
  protected readonly offsetY = signal(0);
  protected readonly imgNaturalW = signal(0);
  protected readonly imgNaturalH = signal(0);

  private arrastrando = false;
  private arrastreInicioX = 0;
  private arrastreInicioY = 0;
  private offsetInicioX = 0;
  private offsetInicioY = 0;

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: [''],
    documento: [''],
    genero: [''],
    fecha_nacimiento: [''],
    telefono: ['', [Validators.pattern(/^[0-9+()\-\s]{7,20}$/)]],
    bio: [''],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected inicialesAvatar(): string {
    const p = this.auth.perfil();
    const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ').trim() || p?.email || 'U';
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected transformImagen(): string {
    const scale = this.escalaActual();
    return `translate(calc(-50% + ${this.offsetX()}px), calc(-50% + ${this.offsetY()}px)) scale(${scale})`;
  }

  private escalaBase(): number {
    const w = this.imgNaturalW();
    const h = this.imgNaturalH();
    const viewport = this.viewportActual();
    if (!w || !h || !viewport) return 1;
    return Math.max(viewport / w, viewport / h);
  }

  private escalaActual(): number {
    return this.escalaBase() * this.zoom();
  }

  private viewportActual(): number {
    const el = this.viewportRef?.nativeElement;
    if (el?.clientWidth) return el.clientWidth;
    if (typeof window !== 'undefined' && window.innerWidth >= 640) return 384;
    return 320;
  }

  protected onZoom(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(value)) {
      this.zoom.set(value);
    }
  }

  protected onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.mensajeAvatar.set('Selecciona un archivo de imagen válido.');
      this.exitoAvatar.set(false);
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.mensajeAvatar.set('La imagen no debe superar los 5 MB.');
      this.exitoAvatar.set(false);
      input.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.imgNaturalW.set(img.naturalWidth);
      this.imgNaturalH.set(img.naturalHeight);
      this.zoom.set(1);
      this.offsetX.set(0);
      this.offsetY.set(0);
      this.imagenEditorUrl.set(url);
      this.editorAbierto.set(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.mensajeAvatar.set('No se pudo leer la imagen seleccionada.');
      this.exitoAvatar.set(false);
    };
    img.src = url;
    input.value = '';
  }

  protected cerrarEditor(): void {
    if (this.subiendoAvatar()) return;
    const url = this.imagenEditorUrl();
    if (url) URL.revokeObjectURL(url);
    this.imagenEditorUrl.set(null);
    this.imgNaturalW.set(0);
    this.imgNaturalH.set(0);
    this.editorAbierto.set(false);
    this.arrastrando = false;
  }

  protected iniciarArrastre(event: PointerEvent): void {
    if (!this.editorAbierto()) return;
    this.arrastrando = true;
    this.arrastreInicioX = event.clientX;
    this.arrastreInicioY = event.clientY;
    this.offsetInicioX = this.offsetX();
    this.offsetInicioY = this.offsetY();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected moverArrastre(event: PointerEvent): void {
    if (!this.arrastrando) return;
    const dx = event.clientX - this.arrastreInicioX;
    const dy = event.clientY - this.arrastreInicioY;
    this.offsetX.set(this.offsetInicioX + dx);
    this.offsetY.set(this.offsetInicioY + dy);
  }

  protected terminarArrastre(): void {
    this.arrastrando = false;
  }

  protected async guardarAvatar(): Promise<void> {
    const user = this.auth.usuario();
    const imgUrl = this.imagenEditorUrl();
    if (!user || !imgUrl || !this.canvasRef) return;

    this.subiendoAvatar.set(true);
    this.mensajeAvatar.set('');
    try {
      const blob = await this.exportarRecorte(imgUrl);
      if (!blob) throw new Error('No se pudo procesar la imagen.');

      const path = `${user.id}/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await this.supabase.client.storage
        .from('avatares')
        .upload(path, blob, { contentType: 'image/webp', upsert: true, cacheControl: '3600' });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: pub } = this.supabase.client.storage.from('avatares').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await this.auth.cargarPerfil();
      this.exitoAvatar.set(true);
      this.mensajeAvatar.set('Foto de perfil actualizada correctamente.');
      this.cerrarEditor();
    } catch (e) {
      this.exitoAvatar.set(false);
      this.mensajeAvatar.set(e instanceof Error ? e.message : 'No se pudo guardar la foto de perfil.');
    } finally {
      this.subiendoAvatar.set(false);
    }
  }

  private async exportarRecorte(src: string): Promise<Blob | null> {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = await this.cargarImagen(src);
    const size = 512;
    const viewport = this.viewportActual();
    const baseScale = Math.max(viewport / img.naturalWidth, viewport / img.naturalHeight);
    const scale = baseScale * this.zoom();
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (viewport - drawW) / 2 + this.offsetX();
    const dy = (viewport - drawH) / 2 + this.offsetY();
    const ratio = size / viewport;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, dx * ratio, dy * ratio, drawW * ratio, drawH * ratio);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.92);
    });
  }

  private cargarImagen(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para recortar.'));
      img.src = src;
    });
  }

  protected async quitarFoto(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) return;
    this.subiendoAvatar.set(true);
    this.mensajeAvatar.set('');
    try {
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
      await this.auth.cargarPerfil();
      this.exitoAvatar.set(true);
      this.mensajeAvatar.set('Foto de perfil eliminada. Puedes subir una nueva cuando quieras.');
    } catch (e) {
      this.exitoAvatar.set(false);
      this.mensajeAvatar.set(e instanceof Error ? e.message : 'No se pudo quitar la foto.');
    } finally {
      this.subiendoAvatar.set(false);
    }
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await this.auth.cargarPerfil();
      const p = this.auth.perfil();
      this.form.patchValue({ nombre: p?.nombre ?? '', apellido: p?.apellido ?? '', documento: p?.documento ?? '', genero: p?.genero ?? '', fecha_nacimiento: p?.fecha_nacimiento ? p.fecha_nacimiento.slice(0, 10) : '', telefono: p?.telefono ?? '', bio: p?.bio ?? '' });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected etiquetaEstadoCuenta(estado: string | null | undefined): string {
    const map: Record<string, string> = {
      pendiente_verificacion: 'Pendiente de verificación',
      activo: 'Activa',
      suspendido: 'Suspendida',
      eliminado: 'Eliminada',
    };
    return estado ? (map[estado] ?? estado) : '-';
  }

  protected formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '-';
    try {
      return new Date(fecha).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return fecha;
    }
  }

  protected async guardar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user || this.form.invalid) return;
    this.guardando.set(true);
    this.mensaje.set('');
    try {
      const v = this.form.getRawValue();
      const { error } = await this.supabase.client
        .from(this.supabase.tabla.perfil)
        .update({ nombre: v.nombre, apellido: v.apellido || null, documento: v.documento?.trim() || null, genero: v.genero?.trim() || null, fecha_nacimiento: v.fecha_nacimiento || null, telefono: v.telefono?.trim() || null, bio: v.bio?.trim() || null })
        .eq('id', user.id);
      if (error) {
        this.mensaje.set(error.message);
        this.exito.set(false);
      } else {
        await this.auth.cargarPerfil();
        this.mensaje.set('Perfil actualizado correctamente.');
        this.exito.set(true);
      }
    } catch (e) {
      this.mensaje.set(e instanceof Error ? e.message : 'No se pudo guardar.');
      this.exito.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
