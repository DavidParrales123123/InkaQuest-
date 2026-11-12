// =============================================================================
// Generador de repositorios Spring Data JPA.
//
// Lee el esquema real de PostgreSQL y produce, para cada tabla, una interfaz
// de repositorio con:
//   - los tipos Java correctos en las firmas (String, UUID, o el enum de
//     PostgreSQL cuando el campo es un ENUM);
//   - los imports exactos que necesita;
//   - solo consultas derivadas validadas contra el esquema real.
//
// No requiere post-procesado: el archivo generado es el archivo final.
// =============================================================================
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = process.argv[2];
const SCHEMA = process.argv[3];
const BASE_PKG = 'com.inkaquest';

const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));

// ----------------------------------------------------------------- utilidades
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toPascal = (s) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};
function singular(w) {
  // Se conserva la composicion del nombre: solo se singulariza la ultima
  // palabra ('progreso_unidad' -> 'progreso_unidad', 'cursos' -> 'curso').
  const partes = w.split('_');
  const ultima = partes.pop();
  let sing = ultima;

  const YA_SINGULAR = new Set([
    'curso', 'unidad', 'leccion', 'historial', 'perfil', 'permiso', 'rol',
    'material', 'certificado', 'documento', 'fragmento', 'referencia',
    'participante', 'consumo', 'derivacion', 'configuracion', 'version',
    'insignia', 'racha', 'temporada', 'ranking', 'evento', 'mision',
    'monedero', 'tienda', 'inventario', 'compra', 'pago', 'pedido',
    'carrito', 'cupon', 'descuento', 'promocion', 'webhook', 'intento',
    'reembolso', 'progreso', 'actividad', 'tarea', 'evaluacion', 'examen',
    'pregunta', 'opcion', 'criterio', 'entrega', 'calificacion',
    'retroalimentacion', 'reto', 'lenguaje', 'caso', 'restriccion', 'envio',
    'resultado', 'motor', 'juego', 'tiempo', 'finalizacion', 'recompensa',
    'puntuacion', 'notificacion', 'preferencia', 'mensaje', 'ticket',
    'respuesta', 'categoria', 'contenido', 'recurso', 'estado', 'accion',
    'solicitud', 'aprobacion', 'transaccion', 'academico', 'usuario',
    'estudiante', 'docente', 'nivel', 'modulo',
  ]);

  if (!YA_SINGULAR.has(ultima)) {
    for (const [re, rep] of [
      [/ies$/, 'y'], [/ses$/, 's'], [/xes$/, 'x'], [/zes$/, 'z'],
      [/ches$/, 'ch'], [/shes$/, 'sh'], [/([^s])s$/, '$1'],
    ]) {
      if (re.test(sing)) { sing = sing.replace(re, rep); break; }
    }
  }
  partes.push(sing);
  return partes.join('_');
}
const entityName = (t) => toPascal(singular(t));

const enumPg = new Set(Object.keys(schema.enums));

// ------------------------------------------------------- indice del esquema
const cols = new Map();
for (const c of schema.columnas) {
  if (!cols.has(c.tabla)) cols.set(c.tabla, []);
  cols.get(c.tabla).push(c);
}
const fks = new Map();
for (const f of schema.fk) {
  if (!fks.has(f.tabla)) fks.set(f.tabla, []);
  fks.get(f.tabla).push(f);
}
// Tipo de la PK de cada tabla: si no es UUID, la FK no es una relacion JPA.
const pkTipo = new Map();
for (const [t, cs] of cols) {
  const idCol = cs.find((c) => c.columna === 'id');
  if (idCol) pkTipo.set(t, idCol.tipo);
}

// ------------------------------------------------- modulos (ver documentacion)
const MODULOS = {
  identidad: ['perfil', 'solicitud_docente', 'aprobacion_docente', 'permiso',
    'rol_permiso', 'preferencia_usuario', 'auditoria_acceso'],
  academico: ['categoria', 'curso', 'docente_curso', 'unidad', 'modulo',
    'leccion', 'contenido', 'recurso', 'material_descargable',
    'requisito_previo', 'historial_publicacion'],
  matriculas: ['matricula', 'historial_matricula', 'renovacion_matricula',
    'cancelacion_matricula', 'acceso_curso'],
  comercio: ['carrito', 'item_carrito', 'pedido', 'detalle_pedido', 'cupon',
    'descuento', 'promocion', 'transaccion', 'intento_pago', 'webhook_pago',
    'reembolso', 'historial_financiero', 'evento_plataforma'],
  progreso: ['progreso_curso', 'progreso_unidad', 'progreso_leccion',
    'historial_progreso', 'actividad_completada'],
  evaluaciones: ['actividad', 'tarea', 'evaluacion', 'examen', 'pregunta',
    'opcion', 'criterio_evaluacion', 'intento_evaluacion',
    'respuesta_evaluacion', 'entrega', 'entrega_archivo', 'calificacion',
    'retroalimentacion'],
  retos: ['reto', 'lenguaje', 'caso_prueba', 'restriccion_reto', 'envio_reto',
    'resultado_caso', 'historial_ejecucion'],
  minijuegos: ['motor', 'version_motor', 'motor_comun', 'motor_curso', 'juego',
    'configuracion_juego', 'actividad_juego', 'intento_juego',
    'respuesta_juego', 'resultado_juego', 'puntuacion_juego', 'tiempo_juego',
    'finalizacion_juego', 'recompensa_juego'],
  gamificacion: ['regla_progresion', 'transaccion_xp', 'insignia',
    'requisito_insignia', 'insignia_usuario', 'racha', 'historial_racha',
    'temporada', 'ranking', 'evento_gamificacion', 'mision', 'mision_usuario',
    'monedero', 'tienda_item', 'inventario', 'compra_virtual',
    'transaccion_moneda'],
  certificados: ['certificado', 'certificado_titular', 'certificado_curso',
    'certificado_emision', 'certificado_revocacion'],
  soporte: ['notificacion', 'notificacion_destinatario',
    'preferencia_notificacion', 'mensaje', 'ticket', 'ticket_respuesta',
    'historial_soporte'],
  chatbot: ['chatbot_conversacion', 'chatbot_participante',
    'chatbot_mensaje', 'chatbot_historial', 'chatbot_documento',
    'chatbot_documento_version', 'chatbot_fragmento', 'chatbot_referencia',
    'chatbot_retroalimentacion', 'chatbot_derivacion', 'chatbot_consumo'],
  auditoria: ['evento_sistema', 'registro_accion', 'cambio_administrativo',
    'historial_modificacion', 'configuracion', 'parametro_sistema'],
};

const moduloDe = new Map();
for (const [m, ts] of Object.entries(MODULOS)) for (const t of ts) moduloDe.set(t, m);

// ------------------------------------------------------ tipo Java de columna
function tipoJavaDe(col) {
  if (!col) return { tipo: 'String' };
  const t = col.tipo.trim();
  const em = t.match(/^"?([a-z_0-9]+)"?$/);
  if (em && enumPg.has(em[1])) return { tipo: toPascal(em[1]), esEnum: true };
  if (t === 'uuid') return { tipo: 'UUID' };
  if (t === 'text' || t.startsWith('character varying')) return { tipo: 'String' };
  if (t === 'integer' || t === 'int4') return { tipo: 'Integer' };
  if (t === 'bigint' || t === 'int8') return { tipo: 'Long' };
  if (t === 'smallint' || t === 'int2') return { tipo: 'Short' };
  if (t === 'boolean' || t === 'bool') return { tipo: 'Boolean' };
  if (t === 'date') return { tipo: 'LocalDate' };
  if (t === 'timestamp with time zone' || t === 'timestamptz') return { tipo: 'Instant' };
  if (t === 'timestamp without time zone') return { tipo: 'LocalDateTime' };
  if (t === 'time without time zone') return { tipo: 'LocalTime' };
  if (t === 'jsonb' || t === 'json') return { tipo: 'Map<String, Object>' };
  if (t === 'inet') return { tipo: 'String' };
  if (t === 'bytea') return { tipo: 'byte[]' };
  if (t.startsWith('vector(')) return { tipo: 'String' };
  if (t.startsWith('double precision')) return { tipo: 'Double' };
  if (t === 'real') return { tipo: 'Float' };
  if (t.startsWith('numeric(') || t === 'numeric') return { tipo: 'BigDecimal' };
  throw new Error(`tipo no mapeado: ${t}`);
}

// ------------------------------------------- relaciones y campos de consulta
/**
 * Devuelve la clave foranea de una columna, si existe.
 */
function fkDe(tabla, columna) {
  return (fks.get(tabla) ?? []).find(
    (f) => f.columnas.length === 1 && f.columnas[0] === columna);
}

/**
 * Describe como consultar una columna:
 *   - 'campo'    -> se compara el valor directly (String, enum, etc.)
 *   - 'relacion' -> hay que navegar la relacion y comparar su id (UUID).
 */
function modoDeConsulta(tabla, columna) {
  const fk = (fks.get(tabla) ?? []).find(
    (f) => f.columnas.length === 1 && f.columnas[0] === columna);
  if (!fk) {
    const col = (cols.get(tabla) ?? []).find((c) => c.columna === columna);
    // Si la columna no existe en la tabla, la consulta no aplica.
    if (!col) return null;
    const info = tipoJavaDe(col);
    return { modo: 'campo', tipo: info.tipo, esEnum: info.esEnum };
  }
  // FK hacia otra tabla del dominio (cuya PK es UUID) -> relacion.
  if (pkTipo.get(fk.tabla_ref) === 'uuid' && moduloDe.has(fk.tabla_ref)) {
    return { modo: 'relacion', tipo: 'UUID', entidad: entityName(fk.tabla_ref) };
  }
  const col = (cols.get(tabla) ?? []).find((c) => c.columna === columna);
  if (!col) return null;
  const info = tipoJavaDe(col);
  return { modo: 'campo', tipo: info.tipo, esEnum: info.esEnum };
}

// ------------------------------------------------- consultas por modulo
// 'columna' o 'relacion.nombre'
const CANDIDATAS = {
  matriculas: [
    ['findByEstudianteIdAndCursoId', 'estudiante_id + curso_id'],
    ['findByEstudianteIdAndEstado', 'estudiante_id + estado'],
    ['findByCursoIdAndEstado', 'curso_id + estado'],
    ['findByCursoId', 'curso_id'],
  ],
  progreso: [
    ['findByEstudianteIdAndCursoId', 'estudiante_id + curso_id'],
    ['findByEstudianteId', 'estudiante_id'],
  ],
  comercio: [
    ['findByUsuarioIdAndEstado', 'usuario_id + estado'],
    ['findByUsuarioId', 'usuario_id'],
    ['findByNumero', 'numero'],
  ],
  certificados: [
    ['findByCodigo', 'codigo'],
    ['findByEstado', 'estado'],
  ],
  soporte: [
    ['findByUsuarioIdAndEstado', 'usuario_id + estado'],
    ['findByUsuarioId', 'usuario_id'],
  ],
  minijuegos: [
    ['findByEstudianteIdAndActividadJuegoId', 'estudiante_id + actividad_juego_id'],
    ['findByEstudianteId', 'estudiante_id'],
  ],
  retos: [
    ['findByRetoIdAndEstudianteId', 'reto_id + estudiante_id'],
    ['findByRetoId', 'reto_id'],
  ],
  evaluaciones: [
    ['findByEstudianteIdAndEvaluacionId', 'estudiante_id + evaluacion_id'],
    ['findByEstudianteId', 'estudiante_id'],
  ],
  gamificacion: [
    ['findByUsuarioIdAndInsigniaId', 'usuario_id + insignia_id'],
    ['findByUsuarioId', 'usuario_id'],
  ],
  identidad: [
    ['findByEmail', 'email'],
  ],
  academico: [
    ['findBySlug', 'slug'],
    ['findByEstado', 'estado'],
  ],
  auditoria: [
    ['findByCodigoEvento', 'codigo_evento'],
  ],
  chatbot: [
    ['findByUsuarioId', 'usuario_id'],
  ],
};

// ------------------------------------------------------------- generacion
const javaDir = join(OUT, 'src/main/java', BASE_PKG.replace(/\./g, '/'));
let nRepo = 0;
let nConsultas = 0;

for (const [tabla, modulo] of moduloDe.entries()) {
  const Ent = entityName(tabla);
  const repo = `${Ent}Repository`;

  // 'rol_permiso' tiene clave primaria compuesta: su repositorio se mantiene
  // a mano (ver modules/identidad/repository/RolPermisoRepository.java).
  if (tabla === 'rol_permiso') {
    console.log('  [SKIP] rol_permiso: PK compuesta, se genera a mano.');
    continue;
  }

  const metodos = [];
  const imports = new Set([
    `${BASE_PKG}.modules.${modulo}.entity.${Ent}`,
    'org.springframework.data.jpa.repository.JpaRepository',
    'org.springframework.stereotype.Repository',
    'java.util.Optional',
    'java.util.UUID',
  ]);

  for (const [nombreBase, spec] of CANDIDATAS[modulo] ?? []) {
    const partes = spec.split(' + ').map((s) => s.trim());
    const params = [];
    let valido = true;
    let usaRelacion = false;

    for (const p of partes) {
      const info = modoDeConsulta(tabla, p);
      if (!info) { valido = false; break; }
      if (info.modo === 'relacion') {
        // El atributo de la entidad lleva el sufijo 'Id' (p.ej. 'usuarioId'),
        // porque el generador lo nombra a partir de la columna. Spring Data
        // exige que el metodo use ese mismo nombre de atributo.
        const fk = fkDe(tabla, p);
        const modRef = moduloDe.get(fk.tabla_ref);
        const entidad = entityName(fk.tabla_ref);
        const attr = toCamel(p);          // usuario_id -> usuarioId
        params.push({ nombre: attr, tipo: entidad });
        imports.add(`${BASE_PKG}.modules.${modRef}.entity.${entidad}`);
        usaRelacion = true;
      } else {
        params.push({ nombre: p, tipo: info.tipo });
        if (info.esEnum) imports.add(`${BASE_PKG}.shared.enums.${info.tipo}`);
      }
      if (info.tipo === 'BigDecimal') imports.add('java.math.BigDecimal');
      if (info.tipo === 'Instant') imports.add('java.time.Instant');
      if (info.tipo === 'LocalDate') imports.add('java.time.LocalDate');
      if (info.tipo === 'LocalDateTime') imports.add('java.time.LocalDateTime');
    }
    if (!valido) continue;

    // El nombre del metodo debe usar el mismo sufijo que el atributo de la
    // entidad: 'findByUsuarioId' para el atributo 'usuarioId'.
    const nombre = usaRelacion ? nombreBase : nombreBase;

    metodos.push('');
    metodos.push(`    /**`);
    metodos.push(`     * Consulta derivada sobre la tabla {@code public.${tabla}}.`);
    metodos.push(`     */`);
    metodos.push(
      `    Optional<${Ent}> ${nombre}(${params.map((p) => `${p.tipo} ${p.nombre}`).join(', ')});`
    );
    nConsultas++;
  }

  const L = [];
  L.push(`package ${BASE_PKG}.modules.${modulo}.repository;`);
  L.push('');
  // Orden de imports: proyecto, framework, libreria, java.*
  const orden = [...imports].sort((a, b) => {
    const rango = (i) => {
      if (i.startsWith('com.inkaquest')) return 0;
      if (i.startsWith('org.springframework')) return 1;
      if (i.startsWith('java.')) return 3;
      return 2;
    };
    const ra = rango(a);
    const rb = rango(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  for (const i of orden) L.push(`import ${i};`);
  L.push('');
  L.push('/**');
  L.push(` * Repositorio JPA de la entidad {@link ${Ent}} (tabla {@code public.${tabla}}).`);
  L.push(` *`);
  L.push(` * <p>Las consultas se ejecutan bajo las politicas RLS de PostgreSQL: el`);
  L.push(` * contexto de autorizacion de la transaccion determina que filas son`);
  L.push(` * visibles. Ver {@code docs/base-de-datos/MATRIZ-RLS.md}.</p>`);
  L.push(` */`);
  L.push(`@Repository`);
  L.push(`public interface ${repo} extends JpaRepository<${Ent}, UUID> {`);
  if (metodos.length) L.push(...metodos);
  L.push('}');

  const dir = join(javaDir, 'modules', modulo, 'repository');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${repo}.java`), L.join('\n') + '\n', 'utf8');
  nRepo++;
}

console.log(`Repositorios: ${nRepo}`);
console.log(`Consultas derivadas validas: ${nConsultas}`);
