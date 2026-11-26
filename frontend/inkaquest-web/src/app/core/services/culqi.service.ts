// @ts-nocheck
import { Injectable } from '@angular/core';

/** Datos de tarjeta introducidos por el usuario (nunca se envían a nuestro backend). */
export interface DatosTarjeta {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  email: string;
}

/**
 * Puente con Culqi.js y el endpoint seguro de confirmación 3DS.
 *
 * La librería tokeniza en el navegador: ni el PAN ni el CVV pasan por nuestro
 * backend ni por nuestra base de datos. Solo se envía el token a nuestro API.
 */
@Injectable({ providedIn: 'root' })
export class CulqiService {
  private scriptCargado = false;
  private publicKey = '';

  get Culqi(): any { return (window as any).Culqi; }

  configurar(publicKey: string): void {
    this.publicKey = publicKey;
    if (this.Culqi) this.Culqi.publicKey = publicKey;
  }

  async cargar(): Promise<void> {
    if (this.scriptCargado && this.Culqi) return;
    if (this.Culqi) { this.scriptCargado = true; return; }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://static.culqi.com/v2/culqi.js';
      script.async = true;
      script.onload = () => { this.scriptCargado = true; resolve(); };
      script.onerror = () => reject(new Error('No se pudo cargar Culqi.js.'));
      document.head.appendChild(script);
    });
    if (!this.Culqi) throw new Error('Culqi.js no está disponible.');
    this.Culqi.publicKey = this.publicKey;
  }

  /** Tokeniza la tarjeta. Culqi.js gestiona el desafío 3DS cuando aplica. */
  async tokenizar(datos: DatosTarjeta): Promise<string> {
    await this.cargar();
    return new Promise<string>((resolve, reject) => {
      try {
        this.Culqi.token.create({
          number: datos.number.replace(/\s/g, ''),
          cvc: datos.cvc,
          exp_month: datos.expMonth,
          exp_year: datos.expYear,
          email: datos.email,
        }, (respuesta: any) => {
          if (respuesta?.error) {
            reject(new Error(respuesta.user_message || respuesta.merchant_message || 'Culqi rechazó la tarjeta.'));
            return;
          }
          const token = respuesta?.data?.id || respuesta?.id;
          if (!token) { reject(new Error('Culqi no devolvió un token.')); return; }
          resolve(token);
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error('No se pudo tokenizar la tarjeta.'));
      }
    });
  }

  /**
   * Confirma el cargo autenticado con 3DS en el host seguro (llave pública).
   * Si Culqi.js ya lo confirmó, Culqi responde 400 y se considera exitoso.
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
