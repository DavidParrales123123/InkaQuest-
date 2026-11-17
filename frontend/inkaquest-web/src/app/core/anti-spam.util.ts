/**
 * Utilidad anti-spam ligera para formularios públicos.
 *
 * <p>Dos defensas complementarias (ninguna requiere servicios externos):
 * <ul>
 *   <li><b>Honeypot:</b> campo OCULTO de nombre believable de empresa/web;
 *       los bots lo rellenan, las personas nunca lo ven (aria-hidden + off-screen).</li>
 *   <li><b>Trampa de tiempo:</b> registra cuándo se montó el formulario y exige
 *       un mínimo de espera antes de enviar: los bots envían al instante.</li>
 * </ul>
 * Si se detecta un envío automatizado, el componente responde con el MISMO
 * mensaje de éxito que un envío real para no dar pistas al atacante.</p>
 */

/** Espera mínima en milisegundos antes de poder enviar (anti-bot instantâneo). */
export const ANTI_SPAM_MIN_MS = 1500;

export interface EstadoAntiSpam {
  /** Valor del honeypot oculto (triplicar este nombre engaña a bots genéricos). */
  honeypot: string;
  /** Epoch ms de cuando se creó el formulario. */
  creadoEn: number;
}

/** Crea el estado inicial del filtro anti-spam para un formulario. */
export function crearEstadoAntiSpam(): EstadoAntiSpam {
  return { honeypot: '', creadoEn: Date.now() };
}

/** ¿El envío parece provenir de un humano? */
export function envioHumano(estado: EstadoAntiSpam): boolean {
  if ((estado.honeypot ?? '').trim().length > 0) {
    return false;
  }
  return Date.now() - estado.creadoEn >= ANTI_SPAM_MIN_MS;
}

/** Estilo inline para ocultar el honeypot sin servir de pista visual/acccesible. */
export const ESTILO_HONEYPOT: string =
  'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
