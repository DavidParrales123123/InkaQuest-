// Generador de entidades JPA a partir del esquema real de PostgreSQL.
//
// Reglas:
//  - Cada tabla public.* produce una entidad en modules/<modulo>/entity.
//  - Las claves foraneas de una sola columna se mapean como relaciones
//    (ManyToOne o OneToOne segun si la FK es UNIQUE).
//  - Los tipos ENUM de PostgreSQL se mapean a enums Java generados.
//  - Los tipos se traducen con el mapa de abajo (verificado contra el
//    esquema real, no estimado).
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const SCHEMA = process.argv[2];
const OUT = process.argv[3];
const BASE_PKG = 'com.inkaquest';

const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));

// ---------------------------------------------------------------- utilidades
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toPascal = (s) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

function singular(w) {
  // Reglas para nombres compuestos: 'progreso_unidad' -> 'progreso_unidad'.
  // Se conserva la composicion y solo se singulariza la ultima palabra.
  const partes = w.split('_');
  const ultima = partes.pop();
  let sing = ultima;

  // Palabras que ya estan en singular o que son sufijos de la entidad.
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
    'estudiante', 'docente', 'evaluacion', 'nivel', 'modulo',
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

const RESERVED = new Set([
  'class', 'public', 'private', 'protected', 'static', 'final', 'new',
  'package', 'import', 'int', 'long', 'float', 'double', 'boolean', 'byte',
  'char', 'short', 'void', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'this', 'super', 'try', 'catch',
  'finally', 'throw', 'throws', 'instanceof', 'native', 'synchronized',
  'transient', 'volatile', 'strictfp', 'assert', 'enum', 'extends',
  'implements', 'abstract', 'default', 'const', 'goto', 'record', 'sealed',
  'permits', 'yield', 'var', 'null', 'true', 'false',
]);

const fieldName = (c) => {
  const n = toCamel(c);
  if (RESERVED.has(n)) return n + 'Value';
  if (/^[0-9]/.test(n)) return '_' + n;
  return n;
};

// ------------------------------------------------------------- mapa de tipos
const enumNames = new Set(Object.keys(schema.enums));

function mapType(tipoPg) {
  const t = tipoPg.trim();

  // ENUM
  const em = t.match(/^"?([a-z_0-9]+)"?$/);
  if (em && enumNames.has(em[1])) return { java: toPascal(em[1]), kind: 'enum' };

  if (t === 'uuid') return { java: 'UUID', kind: 'simple' };
  if (t === 'text' || t.startsWith('character varying')) return { java: 'String', kind: 'simple' };
  if (t === 'integer' || t === 'int4') return { java: 'Integer', kind: 'simple' };
  if (t === 'bigint' || t === 'int8') return { java: 'Long', kind: 'simple' };
  if (t === 'smallint' || t === 'int2') return { java: 'Short', kind: 'simple' };
  if (t === 'boolean' || t === 'bool') return { java: 'Boolean', kind: 'simple' };
  if (t === 'date') return { java: 'LocalDate', kind: 'simple' };
  if (t === 'timestamp with time zone' || t === 'timestamptz') return { java: 'Instant', kind: 'simple' };
  if (t === 'timestamp without time zone') return { java: 'LocalDateTime', kind: 'simple' };
  if (t === 'time without time zone') return { java: 'LocalTime', kind: 'simple' };
  if (t === 'jsonb' || t === 'json') return { java: 'Map<String, Object>', kind: 'json' };
  if (t === 'inet') return { java: 'String', kind: 'simple' };
  if (t === 'bytea') return { java: 'byte[]', kind: 'simple' };
  if (t.startsWith('vector(')) return { java: 'String', kind: 'vector', def: t };
  if (t.startsWith('double precision')) return { java: 'Double', kind: 'simple' };
  if (t === 'real') return { java: 'Float', kind: 'simple' };

  const num = t.match(/^numeric\((\d+),\s*(\d+)\)$/);
  if (num) {
    return { java: 'BigDecimal', kind: 'decimal', precision: Number(num[1]), scale: Number(num[2]) };
  }
  if (t === 'numeric') return { java: 'BigDecimal', kind: 'decimal' };

  throw new Error(`Tipo PostgreSQL no mapeado: "${tipoPg}"`);
}

// ------------------------------------------------------------------- modulos
const MODULOS = [
  ['identidad', ['perfil', 'solicitud_docente', 'aprobacion_docente', 'permiso',
    'rol_permiso', 'preferencia_usuario', 'auditoria_acceso']],
  ['academico', ['categoria', 'curso', 'docente_curso', 'unidad', 'modulo',
    'leccion', 'contenido', 'recurso', 'material_descargable',
    'requisito_previo', 'historial_publicacion']],
  ['matriculas', ['matricula', 'historial_matricula', 'renovacion_matricula',
    'cancelacion_matricula', 'acceso_curso']],
  ['comercio', ['carrito', 'item_carrito', 'pedido', 'detalle_pedido', 'cupon',
    'descuento', 'promocion', 'transaccion', 'intento_pago', 'webhook_pago',
    'reembolso', 'historial_financiero', 'evento_plataforma']],
  ['progreso', ['progreso_curso', 'progreso_unidad', 'progreso_leccion',
    'historial_progreso', 'actividad_completada']],
  ['evaluaciones', ['actividad', 'tarea', 'evaluacion', 'examen', 'pregunta',
    'opcion', 'criterio_evaluacion', 'intento_evaluacion',
    'respuesta_evaluacion', 'entrega', 'entrega_archivo', 'calificacion',
    'retroalimentacion']],
  ['retos', ['reto', 'lenguaje', 'caso_prueba', 'restriccion_reto', 'envio_reto',
    'resultado_caso', 'historial_ejecucion']],
  ['minijuegos', ['motor', 'version_motor', 'motor_comun', 'motor_curso', 'juego',
    'configuracion_juego', 'actividad_juego', 'intento_juego',
    'respuesta_juego', 'resultado_juego', 'puntuacion_juego', 'tiempo_juego',
    'finalizacion_juego', 'recompensa_juego']],
  ['gamificacion', ['regla_progresion', 'transaccion_xp', 'insignia',
    'requisito_insignia', 'insignia_usuario', 'racha', 'historial_racha',
    'temporada', 'ranking', 'evento_gamificacion', 'mision', 'mision_usuario',
    'monedero', 'tienda_item', 'inventario', 'compra_virtual',
    'transaccion_moneda']],
  ['certificados', ['certificado', 'certificado_titular', 'certificado_curso',
    'certificado_emision', 'certificado_revocacion']],
  ['soporte', ['notificacion', 'notificacion_destinatario',
    'preferencia_notificacion', 'mensaje', 'ticket', 'ticket_respuesta',
    'historial_soporte']],
  ['chatbot', ['chatbot_conversacion', 'chatbot_participante',
    'chatbot_mensaje', 'chatbot_historial', 'chatbot_documento',
    'chatbot_documento_version', 'chatbot_fragmento', 'chatbot_referencia',
    'chatbot_retroalimentacion', 'chatbot_derivacion', 'chatbot_consumo']],
  ['auditoria', ['evento_sistema', 'registro_accion', 'cambio_administrativo',
    'historial_modificacion', 'configuracion', 'parametro_sistema']],
];

const moduloDe = new Map();
for (const [m, ts] of MODULOS) for (const t of ts) moduloDe.set(t, m);

// ------------------------------------------------------- enums java (generar)
const enumJava = new Map();
const enumPgDeJava = new Map();   // enum Java -> nombre del tipo ENUM en PostgreSQL

/** Palabras reservadas de Java que pueden aparecer como etiqueta de ENUM. */
const PALABRAS_RESERVADAS_JAVA = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null',
  'record', 'sealed', 'permits', 'yield', 'var',
]);

for (const [pg, valores] of Object.entries(schema.enums)) {
  const java = toPascal(pg);
  enumJava.set(pg, java);
  enumPgDeJava.set(java, pg);

  const L = [];
  L.push(`package ${BASE_PKG}.shared.enums;`);
  L.push('');
  L.push(`/**`);
  L.push(` * Tipo enumerado equivalente al ENUM {@code ${pg}} de PostgreSQL.`);
  L.push(` *`);
  L.push(` * <p>Cada constante guarda la etiqueta exacta almacenada en la base de datos`);
  L.push(` * y el conversor ${java}Converter la usa al leer y escribir. Asi el valor`);
  L.push(` * persistido coincide siempre con la etiqueta del ENUM, incluso cuando la`);
  L.push(` * constante Java difiere (palabras reservadas de Java).</p>`);
  L.push(` *`);
  L.push(` * <p>Las constantes conservan la grafia de la base de datos (minusculas con`);
  L.push(` * guion bajo) en lugar de la convencion Java habitual, para que el valor`);
  L.push(` * sea legible e inequivoco respecto de lo almacenado.</p>`);
  L.push(` */`);
  L.push(`public enum ${java} {`);
  L.push('');
  valores.forEach((v, i) => {
    const nombreConst = PALABRAS_RESERVADAS_JAVA.has(v) ? `${v}_` : v;
    L.push(`    /** Valor almacenado en PostgreSQL: {@code ${v}}. */`);
    L.push(`    ${nombreConst}("${v}")${i === valores.length - 1 ? ';' : ','}`);
    if (i < valores.length - 1) L.push('');
  });
  L.push('');
  L.push(`    /** Etiqueta exacta almacenada en PostgreSQL. */`);
  L.push(`    private final String valor;`);
  L.push('');
  L.push(`    ${java}(String valor) {`);
  L.push(`        this.valor = valor;`);
  L.push(`    }`);
  L.push('');
  L.push(`    /**`);
  L.push(`     * Devuelve el valor exacto almacenado en PostgreSQL.`);
  L.push(`     */`);
  L.push(`    public String getValor() {`);
  L.push(`        return valor;`);
  L.push(`    }`);
  L.push('');
  L.push(`    /**`);
  L.push(`     * Reconstruye la constante a partir del valor de PostgreSQL.`);
  L.push(`     *`);
  L.push(`     * @param valor etiqueta almacenada en la base de datos`);
  L.push(`     * @return constante correspondiente, o {@code null} si no existe`);
  L.push(`     */`);
  L.push(`    public static ${java} fromValor(String valor) {`);
  L.push(`        for (${java} constante : values()) {`);
  L.push(`            if (constante.valor.equals(valor)) {`);
  L.push(`                return constante;`);
  L.push(`            }`);
  L.push(`        }`);
  L.push(`        return null;`);
  L.push(`    }`);
  L.push('}');

  const dir = join(OUT, 'src/main/java', BASE_PKG.replace(/\./g, '/'), 'shared/enums');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${java}.java`), L.join('\n') + '\n', 'utf8');
}


// ----------------------------------------------------------- indices del schema
const columnasPorTabla = new Map();
for (const c of schema.columnas) {
  if (!columnasPorTabla.has(c.tabla)) columnasPorTabla.set(c.tabla, []);
  columnasPorTabla.get(c.tabla).push(c);
}
const pkDe = new Map(schema.pk.map((p) => [p.tabla, p]));
const fksDe = new Map();
for (const f of schema.fk) {
  if (!fksDe.has(f.tabla)) fksDe.set(f.tabla, []);
  fksDe.get(f.tabla).push(f);
}
const uniqDe = new Map();
for (const u of schema.unique) {
  if (!uniqDe.has(u.tabla)) uniqDe.set(u.tabla, []);
  uniqDe.get(u.tabla).push(u);
}

// -------------------------------------------------------- generar entidades
const javaDir = join(OUT, 'src/main/java', BASE_PKG.replace(/\./g, '/'));
// Solo se regenera la carpeta de entidades: 'shared/enums' se escribe mas
// arriba en este mismo script y no debe borrarse.
await rm(join(javaDir, 'modules'), { recursive: true, force: true });

// 'RolPermiso' tiene clave primaria compuesta y se mantiene a mano: se
// conserva una copia antes de regenerar y se restaura despues.
const manualDir = join(javaDir, 'modules', 'identidad', 'entity');
const manualFiles = ['RolPermiso.java', 'RolPermisoId.java'];
const manualBackup = [];
for (const f of manualFiles) {
  try {
    manualBackup.push([f, await readFile(join(manualDir, f), 'utf8')]);
  } catch {
    // No existia todavia: se creara despues.
  }
}

const planRepos = [];
let nEnt = 0;

for (const [tabla, columnas] of columnasPorTabla) {
  const modulo = moduloDe.get(tabla);
  if (!modulo) throw new Error(`Tabla sin modulo asignado: ${tabla}`);

  const Ent = entityName(tabla);
  const pk = pkDe.get(tabla);
  const fks = fksDe.get(tabla) ?? [];
  const uniqs = uniqDe.get(tabla) ?? [];

  // FK de una sola columna -> relacion. Las compuestas se mapean como columna simple.
  // Las referencias a esquemas externos de Supabase (auth.users) NO son
  // entidades JPA de este dominio: se mapean como columna simple.
  const fkSimple = new Map();
  for (const f of fks) {
    if (f.columnas.length !== 1) continue;
    if (!moduloDe.has(f.tabla_ref)) continue;   // p.ej. auth.users
    fkSimple.set(f.columnas[0], f);
  }

  const imports = new Set();
  const campos = [];

  // La PK compuesta de 'rol_permiso' se genera a mano (ver
  // shared/persistence/RolPermisoId.java): el generador solo cubre PK simples.
  const pkCompuesta = pk && !pk.columnas.includes('id');
  if (pkCompuesta) {
    console.warn(`  [SKIP] ${tabla}: PK compuesta, se genera a mano.`);
    continue;
  }

  for (const col of columnas) {
    const nombre = fieldName(col.columna);
    const esPk = pk?.columnas.includes(col.columna) ?? false;
    const fk = fkSimple.get(col.columna);

    // La PK 'id' es siempre una referencia directa: si ademas es FK a otra
    // tabla del dominio se mapea como relacion, y si apunta a un esquema
    // externo (auth.users) se deja como columna simple.
    if (fk && !(esPk && pk.columnas.length === 1 && fk.tabla_ref !== tabla)) {
      const RefEnt = entityName(fk.tabla_ref);
      const RefMod = moduloDe.get(fk.tabla_ref);
      // No importar la entidad de otro paquete si ya esta en el mismo paquete.
      if (RefMod !== modulo) {
        imports.add(`${BASE_PKG}.modules.${RefMod}.entity.${RefEnt}`);
      }

      // OneToOne si la FK es UNIQUE y no es la PK.
      const esUnica = uniqs.some((u) => u.columnas.length === 1 && u.columnas[0] === col.columna);
      const unoAUno = esUnica && !(esPk && pk.columnas.length === 1);

      campos.push({ tipo: RefEnt, nombre, rel: true, oneToOne: unoAUno, pk: esPk, col: col.columna });
      continue;
    }

    const t = mapType(col.tipo);
    if (t.kind === 'enum') imports.add(`${BASE_PKG}.shared.enums.${t.java}`);
    if (t.kind === 'json') imports.add('java.util.Map');
    if (t.java === 'BigDecimal') imports.add('java.math.BigDecimal');
    if (t.java === 'UUID') imports.add('java.util.UUID');
    if (t.java === 'LocalDate') imports.add('java.time.LocalDate');
    if (t.java === 'LocalDateTime') imports.add('java.time.LocalDateTime');
    if (t.java === 'LocalTime') imports.add('java.time.LocalTime');
    if (t.java === 'Instant') imports.add('java.time.Instant');

    campos.push({
      tipo: t.java, nombre, col: col.columna, pk: esPk, kind: t.kind,
      precision: t.precision, scale: t.scale, def: t.def,
      obligatorio: col.obligatorio,
    });
  }

  // --- imports de persistencia ---
  imports.add('jakarta.persistence.Column');
  imports.add('jakarta.persistence.Entity');
  imports.add('jakarta.persistence.Id');
  imports.add('jakarta.persistence.Table');
  imports.add('java.io.Serializable');
  imports.add('java.util.Objects');

  const idEsGenerada = campos.some((c) => c.pk && c.col === 'id');
  if (idEsGenerada) imports.add('jakarta.persistence.GeneratedValue');

  if (campos.some((c) => c.rel && !c.oneToOne)) {
    imports.add('jakarta.persistence.FetchType');
    imports.add('jakarta.persistence.JoinColumn');
    imports.add('jakarta.persistence.ManyToOne');
  }
  if (campos.some((c) => c.rel && c.oneToOne)) {
    imports.add('jakarta.persistence.FetchType');
    imports.add('jakarta.persistence.JoinColumn');
    imports.add('jakarta.persistence.OneToOne');
  }
  if (campos.some((c) => c.kind === 'enum')) {
    imports.add('org.hibernate.annotations.JdbcTypeCode');
    imports.add('org.hibernate.type.SqlTypes');
  }
  if (campos.some((c) => c.col === 'creado_en' || c.col === 'actualizado_en')) {
    imports.add('org.hibernate.annotations.CreationTimestamp');
    imports.add('org.hibernate.annotations.UpdateTimestamp');
  }
  if (campos.some((c) => c.kind === 'json')) {
    imports.add('org.hibernate.annotations.JdbcTypeCode');
    imports.add('org.hibernate.type.SqlTypes');
  }
  if (campos.some((c) => c.kind === 'vector')) {
    imports.add('org.hibernate.annotations.ColumnTransformer');
  }

  // --- cuerpo ---
  const L = [];
  L.push(`/**`);
  L.push(` * Entidad JPA de la tabla {@code public.${tabla}}.`);
  L.push(` *`);
  L.push(` * <p>Mapeo derivado del esquema real de PostgreSQL (proyecto`);
  L.push(` * {@code nrfdifzechrjikrvzhdl}). La tabla pertenece al modulo`);
  L.push(` * {@code ${modulo}} y esta protegida por RLS: el acceso real depende`);
  L.push(` * del contexto de autorizacion de la transaccion.</p>`);
  L.push(` *`);
  L.push(` * <p>El esquema de la base de datos es propiedad de las migraciones SQL`);
  L.push(` * ({@code supabase/migrations}). Esta entidad NO genera el esquema: la`);
  L.push(` * propiedad {@code ddl-auto} se fija en {@code none}.</p>`);
  L.push(` */`);
  L.push(`@Entity`);
  L.push(`@Table(name = "${tabla}")`);
  L.push(`public class ${Ent} implements Serializable {`);
  L.push('');

  for (const c of campos) {
    if (c.rel) {
      L.push(`    @${c.oneToOne ? 'OneToOne' : 'ManyToOne'}(fetch = FetchType.LAZY)`);
      L.push(`    @JoinColumn(name = "${c.col}", referencedColumnName = "id")`);
      L.push(`    private ${c.tipo} ${c.nombre};`);
      L.push('');
      continue;
    }

    if (c.col === 'creado_en') {
      L.push(`    @CreationTimestamp`);
      L.push(`    @Column(name = "creado_en", nullable = false)`);
      L.push(`    private ${c.tipo} ${c.nombre};`);
      L.push('');
      continue;
    }

    if (c.col === 'actualizado_en') {
      L.push(`    @UpdateTimestamp`);
      L.push(`    @Column(name = "actualizado_en", nullable = false)`);
      L.push(`    private ${c.tipo} ${c.nombre};`);
      L.push('');
      continue;
    }

    if (c.pk && c.col === 'id') {
      L.push(`    @Id`);
      L.push(`    @GeneratedValue(strategy = GenerationType.UUID)`);
      L.push(`    @Column(name = "id")`);
      L.push(`    private ${c.tipo} ${c.nombre};`);
      L.push('');
      continue;
    }

    if (c.pk) {
      // PK que no es 'id' (tablas puente con PK compuesta).
      L.push(`    @Id`);
    }
    const partes = [`    @Column(name = "${c.col}"`];
    if (c.precision !== undefined) {
      partes.push(`precision = ${c.precision}, scale = ${c.scale}`);
    }
    if (c.kind === 'json') {
      partes.push('columnDefinition = "jsonb"');
    } else if (c.kind === 'vector') {
      partes.push(`columnDefinition = "${c.def}"`);
    }
    // La obligatoriedad se refleja exactamente como esta en PostgreSQL.
    if (!c.pk || c.col !== 'id') {
      partes.push(`nullable = ${c.obligatorio ? 'false' : 'true'}`);
    }
    partes.push(')');

    if (c.kind === 'enum') {
      const pgEnum = enumPgDeJava.get(c.tipo);
      L.push(`    @JdbcTypeCode(SqlTypes.NAMED_ENUM)`);
      L.push(`    @Column(name = "${c.col}"`
        + (pgEnum ? `, columnDefinition = "${pgEnum}"` : '')
        + `, nullable = ${c.obligatorio ? 'false' : 'true'})`);
      L.push(`    private ${c.tipo} ${c.nombre};`);
      L.push('');
      continue;
    }
    if (c.kind === 'json') {
      L.push(`    @JdbcTypeCode(SqlTypes.JSON)`);
    }
    if (c.kind === 'vector') {
      L.push(`    @ColumnTransformer(write = "?::${c.def}")`);
    }
    L.push(partes.join(', ').replace(/,\s*\)$/, ')'));
    L.push(`    private ${c.tipo} ${c.nombre};`);
    L.push('');
  }

  L.push(`    /** Constructor vacoto requerido por JPA. */`);
  L.push(`    public ${Ent}() {`);
  L.push(`        // Requerido por el framework de persistencia.`);
  L.push(`    }`);

  for (const c of campos) {
    const cap = c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1);
    const desc = c.rel ? 'la entidad relacionada' : `la columna {@code ${c.col}}`;
    L.push('');
    L.push(`    /** Obtiene ${desc}. */`);
    L.push(`    public ${c.tipo} get${cap}() {`);
    L.push(`        return ${c.nombre};`);
    L.push(`    }`);
    L.push('');
    L.push(`    /** Establece ${desc}. */`);
    L.push(`    public void set${cap}(${c.tipo} ${c.nombre}) {`);
    L.push(`        this.${c.nombre} = ${c.nombre};`);
    L.push(`    }`);
  }

  L.push('');
  L.push(`    @Override`);
  L.push(`    public boolean equals(Object o) {`);
  L.push(`        if (this == o) {`);
  L.push(`            return true;`);
  L.push(`        }`);
  L.push(`        if (!(o instanceof ${Ent} other)) {`);
  L.push(`            return false;`);
  L.push(`        }`);
  L.push(`        return Objects.equals(id, other.id);`);
  L.push(`    }`);
  L.push('');
  L.push(`    @Override`);
  L.push(`    public int hashCode() {`);
  L.push(`        return Objects.hash(id);`);
  L.push(`    }`);
  L.push('}');
  const src = [];
  src.push(`package ${BASE_PKG}.modules.${modulo}.entity;`);
  src.push('');
  for (const i of [...imports].sort()) src.push(`import ${i};`);
  if (idEsGenerada) src.push('import jakarta.persistence.GenerationType;');
  src.push('');
  src.push(...L);

  const dir = join(javaDir, 'modules', modulo, 'entity');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${Ent}.java`), src.join('\n') + '\n', 'utf8');
  nEnt++;
  planRepos.push({ modulo, Ent, tabla });
}

await writeFile(join(OUT, '.repos-plan.json'), JSON.stringify(planRepos, null, 2), 'utf8');

// Restaurar las entidades con clave primaria compuesta.
if (manualBackup.length) {
  await mkdir(manualDir, { recursive: true });
  for (const [f, contenido] of manualBackup) {
    await writeFile(join(manualDir, f), contenido, 'utf8');
  }
}

console.log(`Entidades: ${nEnt}`);
console.log(`Enums: ${Object.keys(schema.enums).length}`);
console.log(`Repositorios planificados: ${planRepos.length}`);
