import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

/**
 * Barra fina de progreso durante la navegación entre rutas.
 *
 * <p>Da feedback inmediato cuando el usuario pulsa cualquier enlace del
 * panel o de la página pública, especialmente útil con rutas lazy-loaded.</p>
 */
@Component({
  selector: 'app-navigation-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5" aria-hidden="true">
      <div class="h-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-300 ease-out"
        [style.width.%]="cargando() ? 90 : 100" [style.opacity]="cargando() ? 1 : 0"></div>
    </div>
  `,
})
export class NavigationProgressComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);

  private subscripcion: { unsubscribe(): void } | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.subscripcion = this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        if (this.temporizador) clearTimeout(this.temporizador);
        this.cargando.set(true);
      } else if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError
      ) {
        if (this.temporizador) clearTimeout(this.temporizador);
        this.temporizador = setTimeout(() => this.cargando.set(false), 160);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscripcion?.unsubscribe();
    if (this.temporizador) clearTimeout(this.temporizador);
  }
}
