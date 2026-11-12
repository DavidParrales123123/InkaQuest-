begin;
insert into public.perfil (id, email, nombre, apellido, rol, estado_cuenta)
  values ('ffd6825e-3638-45cc-aec1-26a4ef33fa85',
          'inkaquest-test-052247@example.com',
          'InkaQuest Test', 'Usuario',
          'estudiante', 'activo');
commit;
