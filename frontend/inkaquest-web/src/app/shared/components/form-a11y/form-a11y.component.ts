import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';

/**
 * Mejora global de formularios (sin tocar cada componente).
 *
 * <p>Al enviar cualquier formulario, marca los campos inválidos con
 * {@code aria-invalid}, enfoca el primero y lo hace visible. Cuando el
 * usuario corrige un campo, limpia la marca. Así la validación deja de ser
 * silenciosa en toda la aplicación.</p>
 */
@Component({
  selector: 'app-form-a11y',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class FormA11yComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (typeof document === 'undefined') return;

    const alEnviar = (evento: Event): void => {
      const form = evento.target;
      if (!(form instanceof HTMLFormElement)) return;
      const invalidos = Array.from(form.querySelectorAll<HTMLElement>('.ng-invalid:not(form)'));
      invalidos.forEach((campo) => campo.setAttribute('aria-invalid', 'true'));
      const primero = invalidos[0];
      if (!primero) return;
      if (typeof primero.focus === 'function') primero.focus();
      if (typeof primero.scrollIntoView === 'function') {
        primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const alEditar = (evento: Event): void => {
      (evento.target as HTMLElement | null)?.removeAttribute?.('aria-invalid');
    };

    document.addEventListener('submit', alEnviar, true);
    document.addEventListener('input', alEditar, true);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('submit', alEnviar, true);
      document.removeEventListener('input', alEditar, true);
    });
  }
}
