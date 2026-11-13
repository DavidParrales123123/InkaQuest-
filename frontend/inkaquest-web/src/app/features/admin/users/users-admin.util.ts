import { Perfil } from '../../../core/models/domain.models';

/**
 * Lógica pura del módulo admin de usuarios. Se extrae del componente para
 * poder probarla sin el contenedor de inyección de Angular.
 */

/** Calcula el siguiente estado al alternar una cuenta desde el panel admin. */
export function siguienteEstadoCuenta(actual: string): string {
  return actual === 'activo' ? 'suspendido' : 'activo';
}

/** Solo se puede suspender/reactivar desde estados no terminales. */
export function puedeAlternarEstado(perfil: Pick<Perfil, 'rol' | 'estado_cuenta'>, propioId: string, userId: string): boolean {
  if (propioId === userId) return false;
  if (perfil.rol === 'administrador') return false;
  return perfil.estado_cuenta !== 'eliminado';
}

/** Filtra el listado de usuarios por búsqueda de texto y rol. */
export function filtrarUsuarios(usuarios: Perfil[], busqueda: string, rol: string): Perfil[] {
  const b = busqueda.trim().toLowerCase();
  return usuarios.filter((u) => {
    if (rol && u.rol !== rol) return false;
    if (!b) return true;
    const haystack = `${u.nombre} ${u.apellido ?? ''} ${u.email}`.toLowerCase();
    return haystack.includes(b);
  });
}
