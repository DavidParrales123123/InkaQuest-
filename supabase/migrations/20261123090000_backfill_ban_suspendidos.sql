-- Las suspensiones realizadas antes de añadir el ban en auth.users dejaron
-- banned_until = null. Se sincroniza el estado actual de perfil -> Auth.

begin;

update auth.users u
   set banned_until = now() + interval '100 years'
  from public.perfil p
 where p.id = u.id
   and p.estado_cuenta = 'suspendido'::public.estado_cuenta
   and (u.banned_until is null or u.banned_until < now());

commit;
