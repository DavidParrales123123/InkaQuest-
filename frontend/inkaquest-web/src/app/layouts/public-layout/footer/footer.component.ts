// @ts-nocheck
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Pie de página institucional (estilo adaptado al diseño de referencia).
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  styles: [`
    .site-footer { background: #1b2a4a; color: #fff; margin-top: auto; }
    .site-footer__inner {
      max-width: 80rem; margin: 0 auto; padding: 3.5rem 1.25rem 2rem;
      display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 2rem;
    }
    .site-footer__brand { display: flex; align-items: center; gap: 0.75rem; }
    .site-footer__brand-text strong { display: block; font-family: var(--font-display);font-size: 1.25rem; font-weight: 800; color: #fff; }
    .site-footer__brand-text span { display: block; margin-top: 0.15rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; color: #ffd18a; text-transform: uppercase; }
    .site-footer__desc { margin-top: 1rem; max-width: 22rem; color: #cbd9d7; font-size: 0.9rem; line-height: 1.7; }
    .site-footer__col h2 { margin: 0 0 0.85rem; font-size: 0.9rem; font-weight: 800; color: #fff; font-family: var(--font-display);}
    .site-footer__links { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
    .site-footer__link { color: #cbd9d7; text-decoration: none; font-size: 0.88rem; transition: color 160ms ease; }
    .site-footer__link:hover { color: #ffd18a; }
    .site-footer__bottom {
      max-width: 80rem; margin: 0 auto; padding: 1.25rem 1.25rem 2rem;
      border-top: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; color: #9fb3b0; font-size: 0.8rem;
    }
    @media (max-width: 900px) {
      .site-footer__inner { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 640px) {
      .site-footer__inner { grid-template-columns: 1fr; gap: 1.5rem; }
      .site-footer__bottom { flex-direction: column; align-items: flex-start; }
    }
  `],
  template: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div>
          <div class="site-footer__brand">
            <app-logo [alto]="40" variante="sobre-oscuro" />
            <div class="site-footer__brand-text">
              <strong>InkaQuest</strong>
              <span>Aprende · Codifica · Avanza</span>
            </div>
          </div>
          <p class="site-footer__desc">
            Plataforma educativa para aprender programación de forma interactiva, con rutas claras, retos y progreso real.
          </p>
        </div>

        <nav class="site-footer__col" aria-labelledby="footer-plataforma">
          <h2 id="footer-plataforma">Plataforma</h2>
          <ul class="site-footer__links">
            <li><a routerLink="/cursos" class="site-footer__link">Catálogo de cursos</a></li>
            <li><a routerLink="/planes" class="site-footer__link">Planes y precios</a></li>
            <li><a routerLink="/faq" class="site-footer__link">Preguntas frecuentes</a></li>
          </ul>
        </nav>

        <nav class="site-footer__col" aria-labelledby="footer-institucional">
          <h2 id="footer-institucional">Institucional</h2>
          <ul class="site-footer__links">
            <li><a routerLink="/sobre-nosotros" class="site-footer__link">Sobre nosotros</a></li>
            <li><a routerLink="/docentes" class="site-footer__link">Docentes</a></li>
            <li><a routerLink="/testimonios" class="site-footer__link">Testimonios</a></li>
            <li><a routerLink="/contacto" class="site-footer__link">Contacto</a></li>
            <li><a routerLink="/verificar-certificado" class="site-footer__link">Verificar certificado</a></li>
          </ul>
        </nav>

        <nav class="site-footer__col" aria-labelledby="footer-legal">
          <h2 id="footer-legal">Legal</h2>
          <ul class="site-footer__links">
            <li><a routerLink="/terminos" class="site-footer__link">Términos y condiciones</a></li>
            <li><a routerLink="/privacidad" class="site-footer__link">Política de privacidad</a></li>
            <li><a routerLink="/pagos" class="site-footer__link">Pagos y reembolsos</a></li>
          </ul>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <p>&copy; {{ anioActual }} InkaQuest. Todos los derechos reservados.</p>
        <p>Aprende · Codifica · Avanza</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly anioActual = new Date().getFullYear();
}

