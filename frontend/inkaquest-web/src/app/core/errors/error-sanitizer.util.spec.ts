import { describe, expect, it } from 'vitest';

import {
  extraerMensaje,
  mensajeGlobalDeError,
  redactar,
  sanitizarErrorParaLog,
} from './error-sanitizer.util';

describe('sanitizarErrorParaLog', () => {
  it('redacta JWT completos', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJ1c2VyIn0.c2lnbmF0dXJl';
    const salida = sanitizarErrorParaLog(new Error('fallo token ' + jwt));
    expect(salida).not.toContain(jwt);
    expect(salida).toContain('[token-omitido]');
  });

  it('redacta claves estilo sk_live', () => {
    const salida = sanitizarErrorParaLog(new Error('key sk_live_1234567890abcd'));
    expect(salida).not.toContain('sk_live_1234567890abcd');
    expect(salida).toContain('[clave-omitida]');
  });

  it('redacta passwords en texto plano', () => {
    const salida = sanitizarErrorParaLog(new Error('login failed password="Secreta123!"'));
    expect(salida).not.toContain('Secreta123!');
  });

  it('redacta service_role completo', () => {
    const salida = sanitizarErrorParaLog(new Error('token service_role_abcdef123456'));
    expect(salida).not.toContain('service_role_abcdef123456');
  });

  it('redacta blobs base64 largos', () => {
    const blob = 'A'.repeat(120);
    const salida = sanitizarErrorParaLog(new Error('blob: ' + blob));
    expect(salida).not.toContain(blob);
    expect(salida).toContain('[dato-omitido]');
  });
});

describe('extraerMensaje', () => {
  it('devuelve el mensaje del Error', () => {
    expect(extraerMensaje(new Error('boom'))).toBe('boom');
  });

  it('acepta strings directamente', () => {
    expect(extraerMensaje('boom')).toBe('boom');
  });

  it('error desconocido', () => {
    expect(extraerMensaje(null)).toBe('Error desconocido');
  });

  it('serializa objetos', () => {
    expect(extraerMensaje({ codigo: 1 })).toBe('{"codigo":1}');
  });
});

describe('redactar', () => {
  it('deja texto seguro intacto', () => {
    expect(redactar('La respuesta fue 404 para el recurso X')).toBe(
      'La respuesta fue 404 para el recurso X',
    );
  });
});

describe('mensajeGlobalDeError', () => {
  it('es un mensaje amable sin detalles', () => {
    const msg = mensajeGlobalDeError();
    expect(msg.length).toBeGreaterThan(20);
    expect(msg).not.toMatch(/stack|exception|null pointer/i);
  });
});
