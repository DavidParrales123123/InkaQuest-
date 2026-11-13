// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout de autenticación.
 *
 * <p>Contenedor mínimo: cada pantalla (login/registro) renderiza su propio
 * diseño de dos paneles con la clase {@code .auth-page} para alinearse al
 * sistema visual de referencia.</p>
 */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AuthLayoutComponent {}
