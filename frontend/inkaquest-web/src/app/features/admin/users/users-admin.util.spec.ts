import { describe, expect, it } from 'vitest';

import { filtrarUsuarios, puedeAlternarEstado, siguienteEstadoCuenta } from './users-admin.util';
import { Perfil } from '../../../core/models/domain.models';

function perfil(parcial: Partial<Perfil> & Pick<Perfil, 'id' | 'email'>): Perfil {
  return {
    nombre: 'Nombre',
    apellido: null,
    documento: null,
    genero: null,
    fecha_nacimiento: null,
    telefono: null,
    avatar_url: null,
    bio: null,
    rol: 'estudiante',
    estado_cuenta: 'activo',
    xp: 0,
    nivel: 1,
    racha_dias: 0,
    ultima_conexion: null,
    creado_en: '2026-01-01T00:00:00Z',
    actualizado_en: '2026-01-01T00:00:00Z',
    ...parcial,
  };
}

describe('siguienteEstadoCuenta', () => {
  it('suspende una cuenta activa', () => {
    expect(siguienteEstadoCuenta('activo')).toBe('suspendido');
  });

  it('reactiva una cuenta suspendida', () => {
    expect(siguienteEstadoCuenta('suspendido')).toBe('activo');
  });

  it('activa una cuenta pendiente de verificación', () => {
    expect(siguienteEstadoCuenta('pendiente_verificacion')).toBe('activo');
  });
});

describe('puedeAlternarEstado', () => {
  it('impide alternar la propia cuenta', () => {
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', rol: 'estudiante' }), 'a', 'a')).toBe(false);
  });

  it('impide alternar cuentas de administrador', () => {
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', rol: 'administrador' }), 'yo', 'a')).toBe(false);
  });

  it('impide alternar cuentas eliminadas', () => {
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', estado_cuenta: 'eliminado' }), 'yo', 'a')).toBe(false);
  });

  it('permite alternar cuentas pendientes de verificación', () => {
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', estado_cuenta: 'pendiente_verificacion' }), 'yo', 'a')).toBe(true);
  });

  it('permite alternar cuentas suspendidas y activas', () => {
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', estado_cuenta: 'activo' }), 'yo', 'a')).toBe(true);
    expect(puedeAlternarEstado(perfil({ id: 'a', email: 'a@t', estado_cuenta: 'suspendido' }), 'yo', 'a')).toBe(true);
  });
});

describe('filtrarUsuarios', () => {
  const usuarios = [
    perfil({ id: '1', email: 'ana@prueba.com', nombre: 'Ana', apellido: 'Trueno', rol: 'estudiante' }),
    perfil({ id: '2', email: 'bruno@prueba.com', nombre: 'Bruno', apellido: null, rol: 'docente' }),
    perfil({ id: '3', email: 'carla@prueba.com', nombre: 'Carla', apellido: 'Diaz', rol: 'administrador' }),
  ];

  it('devuelve todo sin filtros', () => {
    expect(filtrarUsuarios(usuarios, '', '')).toHaveLength(3);
  });

  it('filtra por rol', () => {
    expect(filtrarUsuarios(usuarios, '', 'docente').map((u) => u.id)).toEqual(['2']);
  });

  it('filtra por texto en nombre, apellido o correo', () => {
    expect(filtrarUsuarios(usuarios, 'ana', '').map((u) => u.id)).toEqual(['1']);
    expect(filtrarUsuarios(usuarios, 'bru', '').map((u) => u.id)).toEqual(['2']);
    expect(filtrarUsuarios(usuarios, 'CARLA@PRUEBA', '').map((u) => u.id)).toEqual(['3']);
  });

  it('combina búsqueda y rol', () => {
    expect(filtrarUsuarios(usuarios, 'a', 'administrador').map((u) => u.id)).toEqual(['3']);
    expect(filtrarUsuarios(usuarios, 'ana', 'docente')).toHaveLength(0);
  });

  it('ignora espacios en la búsqueda', () => {
    expect(filtrarUsuarios(usuarios, '  ana  ', '')).toHaveLength(1);
  });
});
