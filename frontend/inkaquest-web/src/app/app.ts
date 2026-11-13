// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalErrorBannerComponent } from './shared/components/global-error-banner/global-error-banner.component';

/**
 * Componente raíz de la aplicación.
 *
 * <p>Solo actúa como contenedor: la banda global de errores y el
 * RouterOutlet. La estructura visual (header, sidebar, footer) se compone en
 * los layouts.</p>
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalErrorBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-global-error-banner />\n<router-outlet />',
})
export class App {}
