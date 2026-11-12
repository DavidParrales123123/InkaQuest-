import { describe, expect, it } from 'vitest';

import {
  sanitizarNombreArchivo,
  stemDeArchivo,
} from './nombre-archivo.util';

describe('sanitizarNombreArchivo', () => {
  it('elimina caracteres ilegales (un gulpo = un guion bajo)', () => {
    expect(sanitizarNombreArchivo('mi<archivo>:name?.png')).toBe('mi_archivo_name_.png');
  });

  it('elimina caracteres ilegales al principio y final', () => {
    expect(sanitizarNombreArchivo('***file.txt')).toBe('_file.txt');
    expect(sanitizarNombreArchivo('report?.pdf')).toBe('report_.pdf');
  });

  it('conserva nombres ya sanos', () => {
    expect(sanitizarNombreArchivo('informe-final_v2.pdf')).toBe('informe-final_v2.pdf');
  });

  it('recorta a maximo 120 caracteres', () => {
    const largo = 'a'.repeat(200) + '.txt';
    expect(sanitizarNombreArchivo(largo).length).toBeLessThanOrEqual(120);
  });

  it('devuelve archivo cuando todo queda vacío', () => {
    expect(sanitizarNombreArchivo('')).toBe('archivo');
    expect(sanitizarNombreArchivo('   ')).toBe('archivo');
    expect(sanitizarNombreArchivo('\\/:*?"<>|')).toBe('_');
  });

  it('recorta el final (sufijo preservado para upload)', () => {
    const nombre = 'x'.repeat(50) + '.txt';
    expect(sanitizarNombreArchivo(nombre).endsWith('.txt')).toBe(true);
  });
});

describe('stemDeArchivo', () => {
  it('devuelve el nombre sin extension', () => {
    expect(stemDeArchivo('tarea_final.docx')).toBe('tarea_final');
  });

  it('devuelve el nombre completo si no hay extension', () => {
    expect(stemDeArchivo('README')).toBe('README');
  });

  it('respeta archivos ocultos simples', () => {
    expect(stemDeArchivo('.gitignore')).toBe('.gitignore');
  });
});
