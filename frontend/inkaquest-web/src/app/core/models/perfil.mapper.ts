import { Perfil, RolUsuario } from './domain.models';

/** Forma del DTO `PerfilResponse` que devuelve Spring Boot (inmutable). */
export interface PerfilBackend {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  documento?: string | null;
  genero?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  rol: RolUsuario;
  estadoCuenta: string;
  xp?: number | null;
  nivel?: number | null;
  rachaDias?: number | null;
  ultimaConexion?: string | null;
  creadoEn: string;
  actualizadoEn?: string | null;
}

/** Adapta el DTO del backend al modelo del frontend (perfil completo). */
export function adaptarPerfil(dto: PerfilBackend): Perfil {
  return {
    id: dto.id,
    email: dto.email,
    nombre: dto.nombre ?? '',
    apellido: dto.apellido ?? null,
    documento: dto.documento ?? null,
    genero: dto.genero ?? null,
    fecha_nacimiento: dto.fechaNacimiento ?? null,
    telefono: dto.telefono ?? null,
    avatar_url: dto.avatarUrl ?? null,
    bio: dto.bio ?? null,
    rol: dto.rol,
    estado_cuenta: dto.estadoCuenta as Perfil['estado_cuenta'],
    xp: dto.xp ?? 0,
    nivel: dto.nivel ?? 1,
    racha_dias: dto.rachaDias ?? 0,
    ultima_conexion: dto.ultimaConexion ?? null,
    creado_en: dto.creadoEn,
    actualizado_en: dto.actualizadoEn ?? dto.creadoEn,
  };
}
