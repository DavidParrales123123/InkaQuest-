/**
 * Servicios "core": singletons de aplicación (HTTP, Supabase, auth, config).
 *
 * Reglas:
 *  - Un servicio por responsabilidad, inyectado con `providedIn: 'root'`.
 *  - No deben importar nada de `features/` ni de `shared/`.
 *  - No contienen lógica de negocio.
 */
