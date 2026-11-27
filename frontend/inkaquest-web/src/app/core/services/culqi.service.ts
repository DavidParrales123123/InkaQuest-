// @ts-nocheck
import { Injectable } from '@angular/core';

/** Opciones para abrir el checkout seguro de Culqi (v4). */
export interface CheckoutCulqiOptions {
  montoCentavos: number;
  titulo: string;
  moneda: string;
  email: string;
  /** Para "solo guardar tarjeta": oculta el importe del toolbar. */
  ocultarMonto?: boolean;
}

/**
 * Puente con Culqi Checkout v4 (SDK oficial) y el endpoint seguro de
 * confirmación 3DS.
 *
 * La tarjeta se introduce en el FORMULARIO SEGURO DE CULQI: el PAN y el CVV
 * nunca pasan por nuestro frontend ni por nuestro backend. Solo recibimos el
 * token que Culqi devuelve en el callback `culqi()`.
 */
@Injectable({ providedIn: 'root' })
export class CulqiService {
  private readonly urlSdk = 'https://checkout.culqi.com/js/v4';
  private scriptCargado = false;
  private publicKey = '';
  private resolutorToken: ((token: string) => void) | null = null;
  private rechazadorToken: ((error: Error) => void) | null = null;

  get Culqi(): any { return (window as any).Culqi; }

  /** Configura la llave pública obtenida del backend. */
  configurar(publicKey: string): void {
    this.publicKey = publicKey;
    if (this.Culqi) this.Culqi.publicKey = publicKey;
  }

  /** Carga el SDK oficial una sola vez. */
  async cargar(): Promise<void> {
    if (this.scriptCargado && this.Culqi) return;
    if (!this.Culqi) {
      await new Promise<void>((resolve, reject) => {
        const existente = document.getElementById('culqi-sdk') as HTMLScriptElement | null;
        if (existente) {
          existente.addEventListener('load', () => resolve());
          existente.addEventListener('error', () => reject(new Error('No se pudo cargar Culqi.js.')));
          return;
        }
        const script = document.createElement('script');
        script.id = 'culqi-sdk';
        script.src = this.urlSdk;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Culqi.js.'));
        document.head.appendChild(script);
      });
    }
    if (!this.Culqi) throw new Error('No se pudo cargar Culqi.js.');
    this.scriptCargado = true;
    this.Culqi.publicKey = this.publicKey;
    this.instalarCallback();
  }

  /** Instala el callback global que exige Culqi v4. */
  private instalarCallback(): void {
    (window as any).culqi = () => {
      const api = this.Culqi;
      if (api?.token?.id) {
        const token = api.token.id;
        try { api.close?.(); } catch { /* noop */ }
        this.resolutorToken?.(token);
        this.resolutorToken = null;
        this.rechazadorToken = null;
        return;
      }
      const mensaje = api?.error?.user_message
        || api?.error?.merchant_message
        || 'Culqi no pudo tokenizar la tarjeta. Revisa los datos e inténtalo de nuevo.';
      try { api?.close?.(); } catch { /* noop */ }
      this.rechazadorToken?.(new Error(mensaje));
      this.resolutorToken = null;
      this.rechazadorToken = null;
    };
  }

  /**
   * Abre el modal seguro de Culqi y resuelve con el token generado.
   * El monto se envía en centavos, como exige la API v2.
   */
  async tokenizarConModal(opciones: CheckoutCulqiOptions): Promise<string> {
    await this.cargar();
    return new Promise<string>((resolve, reject) => {
      // Si el usuario cierra el modal sin completar, Culqi no llama al callback:
      // liberamos el estado para poder reintentar.
      const temporizador = window.setTimeout(() => {
        if (this.resolutorToken) {
          this.resolutorToken = null;
          this.rechazadorToken = null;
          reject(new Error('El checkout de Culqi se cerró sin completar el pago. Puedes intentarlo de nuevo.'));
        }
      }, 5 * 60 * 1000);

      const resolver: (token: string) => void = (token) => {
        window.clearTimeout(temporizador);
        resolve(token);
      };
      const rechazar: (error: Error) => void = (error) => {
        window.clearTimeout(temporizador);
        reject(error);
      };
      this.resolutorToken = resolver;
      this.rechazadorToken = rechazar;
      try {
        this.Culqi.settings({
          title: opciones.titulo,
          currency: opciones.moneda,
          amount: opciones.montoCentavos,
        });
        this.Culqi.options({
          lang: 'es',
          installments: false,
          style: { hiddenToolBarAmount: !!opciones.ocultarMonto },
          paymentMethods: {
            tarjeta: true, yape: false, bancaMovil: false,
            agente: false, billetera: false, cuotealo: false,
          },
        });
        this.Culqi.open();
      } catch (e) {
        window.clearTimeout(temporizador);
        this.resolutorToken = null;
        this.rechazadorToken = null;
        reject(e instanceof Error ? e : new Error('No se pudo abrir el checkout de Culqi.'));
      }
    });
  }

  /**
   * Confirma el cargo autenticado con 3DS en el host seguro (llave pública).
   * Si Culqi.js ya lo confirmó, la API responde 400 y se considera exitoso.
   */
  async confirmar3DS(tokenId: string, email: string): Promise<void> {
    try {
      const respuesta = await fetch('https://secure.culqi.com/v2/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.publicKey}`,
        },
        body: JSON.stringify({ token_id: tokenId, usermail: email }),
      });
      if (!respuesta.ok && respuesta.status !== 400) {
        throw new Error('No se pudo confirmar la autenticación 3DS.');
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('No se pudo confirmar la autenticación 3DS.');
    }
  }
}
