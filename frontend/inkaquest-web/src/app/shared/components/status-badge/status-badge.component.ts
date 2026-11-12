import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Insignia de estado reutilizable.
 *
 * <p>Traduce los estados del dominio (matricula, pago, entrega, etc.) a una
 * etiqueta visual coherente en toda la aplicacion.</p>
 */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="clases()">
      @if (punto()) {
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      }
      {{ texto() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  /** Estado del dominio. */
  readonly estado = input<string>('');
  /** Si se muestra el punto de color. */
  readonly punto = input(true);

  /** Etiqueta legible. */
  protected readonly texto = computed(() => ETIQUETAS[this.estado()] ?? this.estado());

  /** Clases CSS del estado. */
  protected readonly clases = computed(() => {
    const base = 'badge';
    const estilos: Record<string, string> = {
      // Matricula
      activa: 'badge-success',
      completada: 'badge-success',
      pendiente_pago: 'badge-warning',
      cancelada: 'badge-danger',
      reembolsada: 'badge-info',
      vencida: 'badge-danger',
      // Pago
      capturado: 'badge-success',
      autorizado: 'badge-info',
      requiere_accion: 'badge-warning',
      fallido: 'badge-danger',
      anulado: 'badge-neutral',
      iniciado: 'badge-neutral',
      // Entrega
      borrador: 'badge-neutral',
      enviado: 'badge-info',
      en_revision: 'badge-warning',
      revisada: 'badge-success',
      devuelta: 'badge-danger',
      // Curso
      publicado: 'badge-success',
      archivado: 'badge-neutral',
      // Cuenta
      pendiente_verificacion: 'badge-warning',
      activo: 'badge-success',
      suspendido: 'badge-danger',
      eliminado: 'badge-neutral',
    };
    return `${base} ${estilos[this.estado()] ?? 'badge-neutral'}`;
  });
}

/** Etiquetas legibles por estado. */
const ETIQUETAS: Record<string, string> = {
  activa: 'Activa',
  completada: 'Completada',
  pendiente_pago: 'Pago pendiente',
  cancelada: 'Cancelada',
  reembolsada: 'Reembolsada',
  vencida: 'Vencida',
  capturado: 'Pagado',
  autorizado: 'Autorizado',
  requiere_accion: 'Requiere acción',
  fallido: 'Fallido',
  anulado: 'Anulado',
  iniciado: 'Iniciado',
  borrador: 'Borrador',
  enviado: 'Enviado',
  en_revision: 'En revisión',
  revisada: 'Revisada',
  devuelta: 'Devuelta',
  publicado: 'Publicado',
  archivado: 'Archivado',
  pendiente_verificacion: 'Por verificar',
  activo: 'Activo',
  suspendido: 'Suspendido',
  eliminado: 'Eliminado',
};
