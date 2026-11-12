import { describe, expect, it } from 'vitest';

import { rutaInicioPorRol } from './auth.guard';

describe('rutaInicioPorRol', () => {
  it('administrador va al panel admin', () => {
    expect(rutaInicioPorRol('administrador')).toBe('/admin/dashboard');
  });

  it('docente va al panel docente', () => {
    expect(rutaInicioPorRol('docente')).toBe('/docente/dashboard');
  });

  it('estudiante va al panel estudiante', () => {
    expect(rutaInicioPorRol('estudiante')).toBe('/estudiante/dashboard');
  });

  it('desconocido/null va al inicio público', () => {
    expect(rutaInicioPorRol(null)).toBe('/');
    expect(rutaInicioPorRol('fantasia')).toBe('/');
  });
});
