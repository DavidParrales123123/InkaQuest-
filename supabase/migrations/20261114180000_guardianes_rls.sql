-- Políticas RLS para las tablas del videojuego Guardianes del Conocimiento.
-- Sin estas políticas, el FORCE RLS del proyecto deja al navegador sin acceso
-- directo a las tablas (el juego quedaba vacío y sin persistencia real).
--
-- Criterios:
--   ● Catálogo (campaña, niveles, hordas, enemigos): SELECT para autenticados.
--   ● intento / respuesta / evento: SELECT para el dueño, el docente del curso
--     y el administrador. Escritura: solo vía RPCs SECURITY DEFINER (notas,
--     XP y resultados NO los escribe el cliente).
--   ● pregunta: SIN lectura directa del navegador (correcta NO debe filtrarse);
--     se sirven exclusivamente vía guardianes_pregunta_aleatoria / responder.
--   ● config: sin acceso directo (parámetros internos).

-- ── Catálogo del juego ───────────────────────────────────────────────────────
drop policy if exists pol_guardianes_campana_select on public.guardianes_campana;
create policy pol_guardianes_campana_select on public.guardianes_campana
    for select to authenticated using (true);

drop policy if exists pol_guardianes_nivel_select on public.guardianes_nivel;
create policy pol_guardianes_nivel_select on public.guardianes_nivel
    for select to authenticated using (true);

drop policy if exists pol_guardianes_horda_select on public.guardianes_nivel_horda;
create policy pol_guardianes_horda_select on public.guardianes_nivel_horda
    for select to authenticated using (true);

drop policy if exists pol_guardianes_enemy_select on public.guardianes_enemy;
create policy pol_guardianes_enemy_select on public.guardianes_enemy
    for select to authenticated using (true);

grant select on public.guardianes_campana, public.guardianes_nivel,
    public.guardianes_nivel_horda, public.guardianes_enemy
    to authenticated;

-- ── Intentos de partida ──────────────────────────────────────────────────────
drop policy if exists pol_guardianes_intento_select on public.guardianes_intento;
create policy pol_guardianes_intento_select on public.guardianes_intento
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1
              from public.guardianes_nivel n
              join public.leccion l on l.id = n.leccion_id
              join public.modulo  m on m.id = l.modulo_id
              join public.unidad  u on u.id = m.unidad_id
             where n.id = guardianes_intento.nivel_id
               and public.app_es_docente_del_curso(u.curso_id)
        )
    );

grant select on public.guardianes_intento to authenticated;

-- ── Respuestas académicas del chequeo ───────────────────────────────────────
drop policy if exists pol_guardianes_respuesta_select on public.guardianes_respuesta;
create policy pol_guardianes_respuesta_select on public.guardianes_respuesta
    for select to authenticated
    using (
        exists (
            select 1
              from public.guardianes_intento i
              join public.guardianes_nivel n on n.id = i.nivel_id
              join public.leccion l on l.id = n.leccion_id
              join public.modulo  m on m.id = l.modulo_id
              join public.unidad  u on u.id = m.unidad_id
             where i.id = guardianes_respuesta.intento_id
               and (
                   i.estudiante_id = public.efectivo_user_id()
                   or public.app_is_admin()
                   or public.app_es_docente_del_curso(u.curso_id)
               )
        )
    );

grant select on public.guardianes_respuesta to authenticated;

-- ── Eventos del juego (telemetría de partida) ───────────────────────────────
drop policy if exists pol_guardianes_evento_select on public.guardianes_evento;
create policy pol_guardianes_evento_select on public.guardianes_evento
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1
              from public.guardianes_intento i
              join public.guardianes_nivel n on n.id = i.nivel_id
              join public.leccion l on l.id = n.leccion_id
              join public.modulo  m on m.id = l.modulo_id
              join public.unidad  u on u.id = m.unidad_id
             where i.id = guardianes_evento.intento_id
               and public.app_es_docente_del_curso(u.curso_id)
        )
    );

grant select on public.guardianes_evento to authenticated;
