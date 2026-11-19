import { describe, expect, it } from 'vitest';

import { esPdfRecurso } from './es-pdf-recurso.util';

function recurso(parcial: Record<string, unknown>): Record<string, unknown> {
  return { id: 'r1', leccion_id: 'l1', nombre: 'archivo.pdf', tipo: 'archivo', url: null, ...parcial };
}

describe('esPdfRecurso', () => {
  it('detecta PDF por mime_type', () => {
    expect(esPdfRecurso(recurso({ mime_type: 'application/pdf' }) as any)).toBe(true);
  });

  it('detecta PDF por tipo', () => {
    expect(esPdfRecurso(recurso({ tipo: 'pdf' }) as any)).toBe(true);
  });

  it('detecta PDF por extension del nombre', () => {
    expect(esPdfRecurso(recurso({ nombre: 'Sesi_n 1_ Presentacion.pdf', mime_type: null, tipo: 'archivo' }) as any)).toBe(true);
    expect(esPdfRecurso(recurso({ nombre: 'DOCUMENTO.PDF' }) as any)).toBe(true);
  });

  it('no detecta PDF si no cumple ningun criterio', () => {
    expect(esPdfRecurso(recurso({ nombre: 'guia.docx', mime_type: 'application/word', tipo: 'word' }) as any)).toBe(false);
    expect(esPdfRecurso(recurso({ nombre: 'video.mp4', mime_type: 'video/mp4', tipo: 'video' }) as any)).toBe(false);
    expect(esPdfRecurso(recurso({ nombre: 'sin extension' }) as any)).toBe(false);
  });

  it('maneja valores nulos sin romper', () => {
    expect(esPdfRecurso({} as any)).toBe(false);
    expect(esPdfRecurso({ nombre: null, mime_type: null, tipo: null } as any)).toBe(false);
  });
});
