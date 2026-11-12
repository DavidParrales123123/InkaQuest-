// Extrae el esquema real de PostgreSQL a JSON UTF-8 usando el CLI de Supabase
// (Management API) o psql segun se indique.
//
// Uso:
//   SUPABASE_DB_PASSWORD=... node extraer-esquema.mjs <destino.json>
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';

const destino = process.argv[2];
if (!destino) {
  console.error('Uso: node extraer-esquema.mjs <destino.json>');
  process.exit(1);
}

// Se usa el binario psql de PostgreSQL instalado en el sistema.
const PSQL = process.env.PSQL_PATH
  || 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';

const HOST = process.env.DB_HOST
  || 'db.nrfdifzechrjikrvzhdl.supabase.co';
const PORT = process.env.DB_PORT || '5432';
const USER = process.env.DB_USERNAME || 'postgres';
const DB = process.env.DB_NAME || 'postgres';
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!PASSWORD) {
  console.error('ERROR: falta SUPABASE_DB_PASSWORD.');
  process.exit(1);
}

const sql = `
select jsonb_build_object(
  'enums', (
    select jsonb_object_agg(t.typname, (
      select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid))
    from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'),
  'columnas', (
    select jsonb_agg(x) from (
      select c.relname as tabla, a.attname as columna,
             format_type(a.atttypid, a.atttypmod) as tipo,
             a.attnotnull as obligatorio,
             pg_get_expr(d.adbin, d.adrelid) as defecto,
             a.attnum as orden
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname, a.attnum) x),
  'pk', (
    select jsonb_agg(x) from (
      select conrelid::regclass::text as tabla, conname,
        (select jsonb_agg(a.attname order by k.ord)
           from unnest(conkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = conrelid and a.attnum = k.attnum) as columnas
      from pg_constraint
      where contype = 'p' and connamespace = 'public'::regnamespace) x),
  'fk', (
    select jsonb_agg(x) from (
      select conrelid::regclass::text as tabla, conname,
        confrelid::regclass::text as tabla_ref,
        (select jsonb_agg(a.attname order by k.ord)
           from unnest(conkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = conrelid and a.attnum = k.attnum) as columnas,
        (select jsonb_agg(a.attname order by k.ord)
           from unnest(confkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = confrelid and a.attnum = k.attnum) as columnas_ref,
        case confdeltype when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'r' then 'RESTRICT' else 'NO ACTION' end as borrado
      from pg_constraint
      where contype = 'f' and connamespace = 'public'::regnamespace) x),
  'unique', (
    select jsonb_agg(x) from (
      select conrelid::regclass::text as tabla, conname,
        (select jsonb_agg(a.attname order by k.ord)
           from unnest(conkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = conrelid and a.attnum = k.attnum) as columnas
      from pg_constraint
      where contype = 'u' and connamespace = 'public'::regnamespace) x)
);
`;

const out = execFileSync(
  PSQL,
  ['-h', HOST, '-p', PORT, '-U', USER, '-d', DB, '-t', '-A', '-c', sql],
  {
    env: { ...process.env, PGPASSWORD: PASSWORD },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  },
).trim();

// Quitar el BOM si lo hubiera y parsear.
const json = JSON.parse(out.replace(/^﻿/, ''));
await writeFile(destino, JSON.stringify(json, null, 2), 'utf8');

console.log('tablas:', new Set(json.columnas.map((c) => c.tabla)).size);
console.log('enums:', Object.keys(json.enums).length);
console.log('pk:', json.pk.length, '| fk:', json.fk.length, '| unique:', json.unique.length);
