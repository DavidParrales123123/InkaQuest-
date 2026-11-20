import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Mensaje de éxito/error con estilo y semántica consistentes en toda la app. */
@Component({
  selector: 'app-feedback-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mensaje()) {
      <p class="rounded-lg border px-3 py-2 text-sm" role="status" aria-live="polite"
        [class.border-success-500/40]="exito()" [class.bg-success-50]="exito()" [class.text-success-600]="exito()"
        [class.border-danger-200]="!exito()" [class.bg-danger-50]="!exito()" [class.text-danger-700]="!exito()">{{ mensaje() }}</p>
    }
  `,
})
export class FeedbackMessageComponent {
  readonly mensaje = input('');
  readonly exito = input(false);
}
