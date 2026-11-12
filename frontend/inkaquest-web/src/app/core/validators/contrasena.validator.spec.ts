import { AbstractControl, FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import {
  validarContrasenaSegura,
  mensajeErrorContrasena,
} from './contrasena.validator';

function control(valor: string): AbstractControl {
  return new FormControl(valor);
}

describe('validarContrasenaSegura', () => {
  it('acepta una contraseña con mayúscula y carácter especial', () => {
    expect(validarContrasenaSegura(control('InkaQuest2024!'))).toBeNull();
  });

  it('rechaza sin mayúsculas', () => {
    const errores = validarContrasenaSegura(control('inkaquest2024!'));
    expect(errores).toEqual({ mayuscula: true });
  });

  it('rechaza sin carácter especial', () => {
    const errores = validarContrasenaSegura(control('InkaQuest2024'));
    expect(errores).toEqual({ especial: true });
  });

  it('rechaza sin mayúscula ni especial', () => {
    const errores = validarContrasenaSegura(control('inkaquest2024'));
    expect(errores).toEqual({ mayuscula: true, especial: true });
  });

  it('devuelve null para valor vacío (lo cubre Validators.required)', () => {
    expect(validarContrasenaSegura(control(''))).toBeNull();
    expect(validarContrasenaSegura(new FormControl(null))).toBeNull();
  });

  it('acepta mayúsculas acentuadas', () => {
    expect(validarContrasenaSegura(control('ÁRBOL$verde1'))).toBeNull();
  });
});

describe('mensajeErrorContrasena', () => {
  it('devuelve mensaje para mayuscula', () => {
    expect(mensajeErrorContrasena('mayuscula')).toMatch(/mayúscula/i);
  });

  it('devuelve mensaje para especial', () => {
    expect(mensajeErrorContrasena('especial')).toMatch(/especial/i);
  });

  it('devuelve mensaje para minlength', () => {
    expect(mensajeErrorContrasena('minlength')).toMatch(/8 caracteres/i);
  });

  it('devuelve null para clave desconocida', () => {
    expect(mensajeErrorContrasena('otra')).toBeNull();
  });
});
