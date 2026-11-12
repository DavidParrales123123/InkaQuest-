import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Reglas de contraseña exigidas por la institución:
 *
 * <ul>
 *   <li>Mínimo 8 caracteres (la regla {@code minLength(8)} se aplica aparte).</li>
 *   <li>Al menos una letra MAYÚSCULA.</li>
 *   <li>Al menos un carácter especial (símbolo / puntuación).</li>
 * </ul>
 *
 * <p>Errores emitidos: {@code mayuscula} y/o {@code especial}.</p>
 */
export function validarContrasenaSegura(control: AbstractControl): ValidationErrors | null {
  const valor: string = String(control.value ?? '');
  if (!valor) return null; // Validators.required cubre el vacío

  const errores: ValidationErrors = {};
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(valor)) errores['mayuscula'] = true;
  // Cualquier signo de puntuación/símbolo cuenta como carácter especial.
  if (!/[^\p{L}\p{N}\s]/u.test(valor)) errores['especial'] = true;

  return Object.keys(errores).length ? errores : null;
}

/** Mensaje para un error de contraseña concreta (o cadena vacía si no aplica). */
export function mensajeErrorContrasena(errorKey: string): string | null {
  switch (errorKey) {
    case 'mayuscula':
      return 'La contraseña debe incluir al menos una letra mayúscula (A–Z).';
    case 'especial':
      return 'La contraseña debe incluir al menos un carácter especial (ej. !, @, #, $, %, *, ?, _, -, .).';
    case 'minlength':
      return 'La contraseña debe tener al menos 8 caracteres.';
    default:
      return null;
  }
}
