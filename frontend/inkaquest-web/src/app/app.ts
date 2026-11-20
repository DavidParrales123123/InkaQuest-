// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalErrorBannerComponent } from './shared/components/global-error-banner/global-error-banner.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { NavigationProgressComponent } from './shared/components/navigation-progress/navigation-progress.component';
import { FormA11yComponent } from './shared/components/form-a11y/form-a11y.component';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';

/**
 * Componente raíz de la aplicación.
 *
 * <p>Solo actúa como contenedor: la banda global de errores, el diálogo de
 * confirmación y el RouterOutlet. La estructura visual (header, sidebar,
 * footer) se compone en los layouts.</p>
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalErrorBannerComponent, ConfirmDialogComponent, NavigationProgressComponent, FormA11yComponent, OfflineBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a href="#contenido-principal" class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-marine-800 focus:shadow-lg">Saltar al contenido principal</a>
<app-navigation-progress />
<app-form-a11y />
<app-offline-banner />
<app-global-error-banner />
<app-confirm-dialog />
<router-outlet />`,
})
export class App {}
