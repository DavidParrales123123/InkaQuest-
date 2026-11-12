import { describe, expect, it } from 'vitest';

import { adaptarPerfil, PerfilBackend } from './perfil.mapper';

const baseBackend: PerfilBackend = {
  id: 'ffd6825e-3638-45cc-aec1-26a4ef33fa85',
  email: 'Test@Example.com',
  nombre: 'InkaQuest Test',
  apellido: 'Usuario',
  documento: null,
  genero: null,
  fechaNacimiento: '2000-05-01',
  telefono: null,
  avatarUrl: null,
  bio: null,
  rol: 'estudiante',
  estadoCuenta: 'activo',
  xp: 120,
  nivel: 2,
  rachaDias: 7,
  ultimaConexion: '2026-11-12T10:00:00.000Z',
  creadoEn: '2026-11-12T09:00:00.000Z',
  actualizadoEn: '2026-11-12T09:30:00.000Z',
};

describe('adaptarPerfil', () => {
  it('mapea el DTO del backend al modelo del frontend', () => {
    const perfil = adaptarPerfil(baseBackend);
    expect(perfil.id).toBe(baseBackend.id);
    expect(perfil.email).toBe(baseBackend.email);
    expect(perfil.rol).toBe('estudiante');
    expect(perfil.xp).toBe(120);
    expect(perfil.nivel).toBe(2);
    expect(perfil.racha_dias).toBe(7);
    expect(perfil.fecha_nacimiento).toBe('2000-05-01');
    expect(perfil.actualizado_en).toBe('2026-11-12T09:30:00.000Z');
  });

  it('rellena null en campos ausentes', () => {
    const sinExtras: PerfilBackend = {
      id: baseBackend.id,
      email: 'test@example.com',
      nombre: 'Kira',
      apellido: null,
      rol: 'docente',
      estadoCuenta: 'suspendido',
      creadoEn: '2026-11-12T09:00:00.000Z',
    };
    const perfil = adaptarPerfil(sinExtras);
    expect(perfil.apellido).toBeNull();
    expect(perfil.documento).toBeNull();
    expect(perfil.genero).toBeNull();
    expect(perfil.telefono).toBeNull();
    expect(perfil.avatar_url).toBeNull();
    expect(perfil.bio).toBeNull();
    expect(perfil.xp).toBe(0);
    expect(perfil.nivel).toBe(1);
    expect(perfil.racha_dias).toBe(0);
    expect(perfil.ultima_conexion).toBeNull();
  });

  it('usa creadoEn como actualizadoEn si falta', () => {
    const sinActualizado: PerfilBackend = {
      ...baseBackend,
      actualizadoEn: undefined,
    };
    expect(adaptarPerfil(sinActualizado).actualizado_en).toBe('2026-11-12T09:00:00.000Z');
  });

  it('conserva el rol administrador tal como llega', () => {
    expect(adaptarPerfil({ ...baseBackend, rol: 'administrador' }).rol).toBe('administrador');
  });

  it('conserva el estado suspendido tal como llega', () => {
    expect(adaptarPerfil({ ...baseBackend, estadoCuenta: 'suspendido' }).estado_cuenta).toBe(
      'suspendido',
    );
  });
});
