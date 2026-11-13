// @ts-nocheck
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';

import { ConfirmService } from '../../../core/services/confirm.service';

/**
 * Diálogo de confirmación in-app (reemplaza window.confirm). Se monta una
 * vez en app-root y es controlado por {@link ConfirmService}.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (confirm.state(); as state) {
      <div class="fixed inset-0 z-[80] flex items-center justify-center bg-marine-900/60 p-4" role="presentation" (click)="confirm.responder(false)">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-titulo"
          aria-describedby="confirm-mensaje"
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start gap-3">
            <span aria-hidden="true" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-600">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z" stroke-linejoin="round"/><path d="M12 10v4"/><path d="M12 17.5h.01"/></svg>
            </span>
            <div class="min-w-0">
              <h3 id="confirm-titulo" class="text-base font-bold text-marine-800">{{ state.title }}</h3>
              <p id="confirm-mensaje" class="mt-1 whitespace-pre-wrap text-sm text-marine-600">{{ state.mensaje }}</p>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn btn-outline btn-sm" (click)="confirm.responder(false)">Cancelar</button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-danger]="state.variante !== 'primario'"
              [class.btn-primary]="state.variante === 'primario'"
              (click)="confirm.responder(true)"
              autofocus
            >{{ state.textoConfirmar ?? 'Eliminar' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.confirm.state()) this.confirm.responder(false);
  }
}
