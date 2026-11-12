/**
 * Modelos de dominio del frontend.
 *
 * <p>Cada interfaz refleja <b>exactamente</b> las columnas de la tabla real
 * de PostgreSQL (121 tablas, 38 ENUM nativos). Las propiedades mantienen la
 * grafia de la base de datos porque los servicios acceden a traves de
 * PostgREST, que devuelve las columnas tal cual.</p>
 *
 * <p>Regla de oro: el frontend <b>lee</b> estos datos; nunca los modifica
 * fuera de las funciones autorizadas de la base de datos
 * ({@code fn_registrar_completado_leccion}, {@code fn_registrar_xp},
 * {@code fn_otorgar_insignia}, {@code fn_activar_matricula_tras_pago}).</p>
 *
 * <p>Ver: docs/base-de-datos/DICCIONARIO-DE-DATOS.md</p>
 */

/* =============================================================================
   Identidad y seguridad
   ========================================================================== */

/** Roles de usuario. ENUM {@code public.rol_usuario}. */
export type RolUsuario = 'estudiante' | 'docente' | 'administrador';

/** Estados de cuenta. ENUM {@code public.estado_cuenta}. */
export type EstadoCuenta =
  | 'pendiente_verificacion'
  | 'activo'
  | 'suspendido'
  | 'eliminado';

/** Estados de solicitud docente. ENUM {@code public.estado_solicitud_docente}. */
export type EstadoSolicitudDocente =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada';

/** Tabla {@code public.perfil}. */
export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  documento: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  avatar_url: string | null;
  bio: string | null;
  rol: RolUsuario;
  estado_cuenta: EstadoCuenta;
  xp: number;
  nivel: number;
  racha_dias: number;
  ultima_conexion: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.solicitud_docente}. */
export interface SolicitudDocente {
  id: string;
  usuario_id: string;
  estado: EstadoSolicitudDocente;
  institucion: string | null;
  especialidad: string | null;
  codigo_docente: string | null;
  motivo: string;
  documentos_adjuntos: unknown;
  revisado_por: string | null;
  revisado_en: string | null;
  motivo_revision: string | null;
  creado_en: string;
}

/** Tabla {@code public.permiso}. */
export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string | null;
  creado_en: string;
}

/* =============================================================================
   Catalogo academico
   ========================================================================== */

/** Estados de curso. ENUM {@code public.estado_curso}. */
export type EstadoCurso = 'borrador' | 'en_revision' | 'publicado' | 'archivado';

/** Tabla {@code public.categoria}. */
export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.curso}. */
export interface Curso {
  id: string;
  categoria_id: string | null;
  titulo: string;
  slug: string;
  descripcion: string | null;
  contenido: string | null;
  portada_url: string | null;
  estado: EstadoCurso;
  precio: number;
  moneda: string;
  xp_total: number;
  duracion_minutos: number;
  creado_por: string | null;
  publicado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.docente_curso}. */
export interface DocenteCurso {
  id: string;
  curso_id: string;
  docente_id: string;
  es_responsable: boolean;
  activo: boolean;
  asignado_por: string | null;
  asignado_en: string;
}

/** Tabla {@code public.unidad}. */
export interface Unidad {
  id: string;
  curso_id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  xp_otorgado: number;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.modulo}. */
export interface Modulo {
  id: string;
  unidad_id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  xp_otorgado: number;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.leccion}. */
export interface Leccion {
  id: string;
  modulo_id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  tipo_contenido: string;
  duracion_minutos: number;
  xp_otorgado: number;
  publicado: boolean;
  requerido_aprobacion: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.contenido}. */
export interface Contenido {
  id: string;
  leccion_id: string;
  orden: number;
  tipo: string;
  titulo: string | null;
  cuerpo: string | null;
  datos: Record<string, unknown>;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.recurso}. */
export interface Recurso {
  id: string;
  leccion_id: string;
  contenido_id: string | null;
  nombre: string;
  tipo: string;
  url: string | null;
  ruta_storage: string | null;
  tamano_bytes: number | null;
  mime_type: string | null;
  descargable: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.material_descargable}. */
export interface MaterialDescargable {
  id: string;
  recurso_id: string;
  nombre: string;
  ruta_storage: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  hash_sha256: string | null;
  max_descargas: number | null;
  descargas: number;
  requiere_matricula: boolean;
  expira_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Matriculas y progreso
   ========================================================================== */

/** Estados de matricula. ENUM {@code public.estado_matricula}. */
export type EstadoMatricula =
  | 'pendiente_pago'
  | 'activa'
  | 'completada'
  | 'cancelada'
  | 'reembolsada'
  | 'vencida';

/** Tabla {@code public.matricula}. */
export interface Matricula {
  id: string;
  estudiante_id: string;
  curso_id: string;
  estado: EstadoMatricula;
  precio_pagado: number;
  moneda: string;
  porcentaje_progreso: number;
  xp_ganado: number;
  matriculado_en: string | null;
  completado_en: string | null;
  cancelado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Estados de progreso. ENUM {@code public.estado_progreso}. */
export type EstadoProgreso = 'no_iniciado' | 'en_progreso' | 'completado';

/** Tabla {@code public.progreso_curso}. */
export interface ProgresoCurso {
  id: string;
  matricula_id: string;
  estudiante_id: string;
  curso_id: string;
  estado: EstadoProgreso;
  porcentaje: number;
  lecciones_completadas: number;
  minutos_estudio: number;
  iniciado_en: string | null;
  completado_en: string | null;
  ultima_actividad_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.progreso_unidad}. */
export interface ProgresoUnidad {
  id: string;
  progreso_curso_id: string;
  unidad_id: string;
  estudiante_id: string;
  estado: EstadoProgreso;
  porcentaje: number;
  lecciones_completadas: number;
  iniciado_en: string | null;
  completado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.progreso_leccion}. */
export interface ProgresoLeccion {
  id: string;
  progreso_curso_id: string;
  leccion_id: string;
  estudiante_id: string;
  estado: EstadoProgreso;
  porcentaje: number;
  minutos_estudio: number;
  iniciado_en: string | null;
  completado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Actividades, tareas y evaluaciones
   ========================================================================== */

/** Tipos de actividad. ENUM {@code public.tipo_actividad}. */
export type TipoActividad =
  | 'lectura'
  | 'video'
  | 'tarea'
  | 'quiz'
  | 'examen'
  | 'reto'
  | 'minijuego'
  | 'foro';

/** Tabla {@code public.actividad}. */
export interface Actividad {
  id: string;
  leccion_id: string;
  curso_id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string | null;
  instrucciones: string | null;
  puntos: number;
  xp_otorgado: number;
  tiempo_limite_minutos: number | null;
  intentos_permitidos: number;
  requiere_publicacion: boolean;
  publicado: boolean;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.tarea}. */
export interface Tarea {
  id: string;
  actividad_id: string;
  fecha_entrega: string | null;
  fecha_apertura: string | null;
  permite_entrega_tardia: boolean;
  penalizacion_tardia: number;
  nota_maxima: number;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.tarea_archivo}. Adjuntos (Word/PDF/Excel/PowerPoint/ZIP) que el docente publica como complemento de una tarea. */
export interface TareaArchivo {
  id: string;
  tarea_id: string;
  nombre: string;
  ruta_storage: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  creado_en: string;
}

/** Tabla {@code public.entrega_archivo}. Archivos entregados por el estudiante. */
export interface EntregaArchivo {
  id: string;
  entrega_id: string;
  nombre: string;
  ruta_storage: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  creado_en: string;
}

/** Estados de entrega. ENUM {@code public.estado_entrega}. */export type EstadoEntrega =
  | 'borrador'
  | 'enviado'
  | 'en_revision'
  | 'revisada'
  | 'devuelta';

/** Tabla {@code public.entrega}. */
export interface Entrega {
  id: string;
  tarea_id: string;
  estudiante_id: string;
  estado: EstadoEntrega;
  contenido: string | null;
  nota: number | null;
  enviada_en: string | null;
  revisada_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.calificacion}. */
export interface Calificacion {
  id: string;
  entrega_id: string | null;
  intento_id: string | null;
  estudiante_id: string;
  docente_id: string | null;
  nota: number;
  nota_maxima: number;
  aprobado: boolean | null;
  comentario: string | null;
  calificado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.evaluacion}. */
export interface Evaluacion {
  id: string;
  actividad_id: string;
  titulo: string;
  descripcion: string | null;
  nota_maxima: number;
  porcentaje_aprobacion: number;
  intentos_permitidos: number;
  aleatorizar_preguntas: boolean;
  mostrar_resultado_inmediato: boolean;
  duracion_minutos: number | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tipos de pregunta. ENUM {@code public.tipo_pregunta}. */
export type TipoPregunta =
  | 'opcion_unica'
  | 'opcion_multiple'
  | 'verdadero_falso'
  | 'respuesta_libre'
  | 'codigo'
  | 'orden_multiple';

/** Tabla {@code public.pregunta}. */
export interface Pregunta {
  id: string;
  evaluacion_id: string;
  orden: number;
  tipo: TipoPregunta;
  enunciado: string;
  descripcion: string | null;
  puntos: number;
  es_privada: boolean;
  requiere_revision: boolean;
  retroalimentacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.opcion}. Contiene la solucion: acceso restringido. */
export interface Opcion {
  id: string;
  pregunta_id: string;
  orden: number;
  texto: string;
  es_correcta: boolean;
  valor: string | null;
  created_en: string;
}

/** Tabla {@code public.intento_evaluacion}. */
export interface IntentoEvaluacion {
  id: string;
  evaluacion_id: string;
  examen_id: string | null;
  estudiante_id: string;
  numero: number;
  estado: string;
  puntaje: number | null;
  puntaje_maximo: number | null;
  aprobado: boolean | null;
  tiempo_inicio: string | null;
  tiempo_fin: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.respuesta_evaluacion}. */
export interface RespuestaEvaluacion {
  id: string;
  intento_id: string;
  pregunta_id: string;
  opcion_id: string | null;
  texto_respuesta: string | null;
  es_correcta: boolean | null;
  puntaje_otorgado: number | null;
  retroalimentacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Gamificacion
   ========================================================================== */

/** Conceptos de XP. ENUM {@code public.concepto_xp}. */
export type ConceptoXp =
  | 'leccion_completada'
  | 'actividad_completada'
  | 'examen_aprobado'
  | 'reto_resuelto'
  | 'minijuego_terminado'
  | 'insignia'
  | 'racha_diaria'
  | 'asistencia'
  | 'curso_completado'
  | 'mision'
  | 'admin'
  | 'ajuste';

/** Tabla {@code public.insignia}. */
export interface Insignia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  xp_otorgado: number;
  rareza: string;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.insignia_usuario}. */
export interface InsigniaUsuario {
  id: string;
  usuario_id: string;
  insignia_id: string;
  progreso: number;
  obtenida_en: string | null;
  creado_en: string;
}

/** Tabla {@code public.transaccion_xp}. */
export interface TransaccionXp {
  id: string;
  usuario_id: string;
  xp: number;
  concepto: ConceptoXp;
  referencia_tipo: string | null;
  referencia_id: string | null;
  descripcion: string | null;
  creado_en: string;
}

/** Tabla {@code public.transaccion_moneda}. */
export interface TransaccionMoneda {
  id: string;
  usuario_id: string;
  monedas: number;
  saldo_resultante: number;
  concepto: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  creado_en: string;
}

/** Tabla {@code public.monedero}. */
export interface Monedero {
  id: string;
  usuario_id: string;
  saldo: number;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.racha}. */
export interface Racha {
  id: string;
  usuario_id: string;
  racha_actual: number;
  mejor_racha: number;
  ultima_actividad: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.temporada}. */
export interface Temporada {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.ranking}. */
export interface Ranking {
  id: string;
  temporada_id: string;
  usuario_id: string;
  puntos: number;
  posicion: number | null;
  actualizado_en: string;
}

/** Tabla {@code public.mision}. */
export interface Mision {
  id: string;
  evento_id: string | null;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  objetivo_tipo: string;
  objetivo_cantidad: number;
  xp_recompensa: number;
  monedas_recompensa: number;
  insignia_id: string | null;
  curso_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.mision_usuario}. */
export interface MisionUsuario {
  id: string;
  mision_id: string;
  usuario_id: string;
  progreso: number;
  estado: string;
  recompensa_otorgada: boolean;
  completado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.evento_gamificacion}. */
export interface EventoGamificacion {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Tienda virtual
   ========================================================================== */

/** Tabla {@code public.tienda_item}. */
export interface TiendaItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  precio_monedas: number;
  precio_xp: number;
  imagen_url: string | null;
  datos: Record<string, unknown>;
  stock: number | null;
  limite_por_usuario: number | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.inventario}. */
export interface Inventario {
  id: string;
  usuario_id: string;
  tienda_item_id: string;
  cantidad: number;
  clave_idempotencia: string | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  adquirido_en: string;
}

/** Tabla {@code public.compra_virtual}. */
export interface CompraVirtual {
  id: string;
  usuario_id: string;
  tienda_item_id: string;
  cantidad: number;
  monedas_gastadas: number;
  xp_gastado: number;
  clave_idempotencia: string | null;
  creado_en: string;
}

/* =============================================================================
   Minijuegos y retos
   ========================================================================== */

/** Tabla {@code public.motor}. */
export interface Motor {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  version_actual: string | null;
  estado: string;
  es_comun: boolean;
  familia: string | null;
  icono: string | null;
  documentacion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.version_motor}. */
export interface VersionMotor {
  id: string;
  motor_id: string;
  version: string;
  notas: string | null;
  compatibilidad: string | null;
  publicada_en: string | null;
  activa: boolean;
  creado_en: string;
}

/** Tabla {@code public.motor_curso}. */
export interface MotorCurso {
  id: string;
  motor_id: string;
  curso_id: string;
  es_comun: boolean;
  version_motor_id: string | null;
  activo: boolean;
  asignado_por: string | null;
  asignado_en: string | null;
  actualizado_en: string;
}

/**
 * Tabla {@code public.configuracion_juego}.
 *
 * <p>Contenido configurable de un juego. Permite al docente ajustar lo que se
 * ofrece sin alterar la implementacion del motor.</p>
 */
export interface ConfiguracionJuego {
  id: string;
  juego_id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.juego}. */
export interface Juego {
  id: string;
  motor_id: string;
  version_motor_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  version_juego: string;
  dificultad: string;
  xp_otorgado: number;
  monedas_otorgadas: number;
  tiempo_limite_seg: number | null;
  creado_por: string | null;
  publicado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.actividad_juego}. */
export interface ActividadJuego {
  id: string;
  juego_id: string;
  leccion_id: string;
  curso_id: string;
  actividad_id: string | null;
  titulo: string;
  descripcion: string | null;
  orden: number;
  puntos: number;
  xp_otorgado: number;
  intentos_permitidos: number;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.intento_juego}. */
export interface IntentoJuego {
  id: string;
  actividad_juego_id: string;
  estudiante_id: string;
  numero: number;
  estado: string;
  clave_idempotencia: string | null;
  duracion_ms: number | null;
  iniciado_en: string | null;
  finalizado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.resultado_juego}. */
export interface ResultadoJuego {
  id: string;
  intento_juego_id: string;
  puntaje: number;
  puntaje_maximo: number;
  precision: number | null;
  completitud: number | null;
  aciertos: number | null;
  errores: number | null;
  estrellas: number | null;
  completado: boolean;
  desglose: Record<string, unknown> | null;
  creado_en: string;
}

/** Tabla {@code public.puntuacion_juego}. */
export interface PuntuacionJuego {
  id: string;
  juego_id: string;
  usuario_id: string;
  mejor_puntaje: number;
  partidas: number;
  victorias: number;
  mejor_tiempo_ms: number | null;
  actualizado_en: string;
}

/** Tabla {@code public.reto}. */
export interface Reto {
  id: string;
  leccion_id: string;
  curso_id: string;
  titulo: string;
  enunciado: string;
  descripcion: string | null;
  dificultad: string;
  tiempo_limite_seg: number | null;
  memoria_limite_mb: number | null;
  xp_otorgado: number;
  intentos_maximos: number;
  published: boolean;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.caso_prueba}. */
export interface CasoPrueba {
  id: string;
  reto_id: string;
  orden: number;
  entrada: string | null;
  salida_esperada: string | null;
  es_oculto: boolean;
  es_ejemplo: boolean;
  tiempo_limite_seg: number | null;
  memoria_limite_mb: number | null;
  peso: number;
  creado_en: string;
}

/** Tabla {@code public.restriccion_reto}. */
export interface RestriccionReto {
  id: string;
  reto_id: string;
  tipo: string;
  valor: string;
  descripcion: string | null;
  creado_en: string;
}

/** Tabla {@code public.lenguaje}. */
export interface Lenguaje {
  id: string;
  codigo: string;
  nombre: string;
  version: string | null;
  plantilla: string | null;
  activo: boolean;
  creado_en: string;
}

/** Tabla {@code public.envio_reto}. */
export interface EnvioReto {
  id: string;
  reto_id: string;
  estudiante_id: string;
  lenguaje_id: string | null;
  codigo: string;
  estado: string;
  puntaje: number | null;
  puntaje_maximo: number | null;
  aprobado: boolean | null;
  tiempo_total_ms: number | null;
  clave_idempotencia: string | null;
  error_mensaje: string | null;
  ejecucion_externa_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Pagos, certificados, notificaciones y soporte
   ========================================================================== */

/** Estados de pago. ENUM {@code public.estado_pago}. */
export type EstadoPago =
  | 'iniciado'
  | 'requiere_accion'
  | 'autorizado'
  | 'capturado'
  | 'fallido'
  | 'reembolsado'
  | 'anulado';

/** Tabla {@code public.pedido}. */
export interface Pedido {
  id: string;
  usuario_id: string;
  numero: string;
  estado: string;
  subtotal: number;
  descuento: number;
  total: number;
  moneda: string;
  cupon_id: string | null;
  clave_idempotencia: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.detalle_pedido}. */
export interface DetallePedido {
  id: string;
  pedido_id: string;
  curso_id: string;
  titulo_snapshot: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  creado_en: string;
}

/** Tabla {@code public.transaccion}. */
export interface Transaccion {
  id: string;
  pedido_id: string;
  usuario_id: string;
  estado: EstadoPago;
  metodo: string;
  monto: number;
  moneda: string;
  proveedor: string;
  referencia: string | null;
  codigo_autorizacion: string | null;
  clave_idempotencia: string | null;
  datos: Record<string, unknown> | null;
  autorizado_en: string | null;
  capturado_en: string | null;
  anulado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.reembolso}. */
export interface Reembolso {
  id: string;
  transaccion_id: string;
  pedido_id: string;
  usuario_id: string;
  estado: string;
  monto: number;
  moneda: string;
  motivo: string | null;
  solicitado_por: string | null;
  referencia_proveedor: string | null;
  procesado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.cupón} ({@code public.cupon}). */
export interface Cupon {
  id: string;
  codigo: string;
  descripcion: string | null;
  tipo: string;
  valor: number;
  porcentaje_maximo: number | null;
  usos_maximos: number | null;
  usos_actuales: number;
  limite_por_usuario: number | null;
  valido_desde: string | null;
  valido_hasta: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.certificado}. */
export interface Certificado {
  id: string;
  codigo: string;
  estado: string;
  emitido_en: string;
  expira_en: string | null;
  plantilla: string | null;
  url_documento: string | null;
  ruta_storage: string | null;
  hash_sha256: string | null;
  verificado: boolean;
  veces_verificado: number;
  emitido_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.certificado_titular}. */
export interface CertificadoTitular {
  id: string;
  certificado_id: string;
  usuario_id: string;
  curso_id: string | null;
  emitido_en: string;
  expira_en: string | null;
  creado_en: string;
}

/** Tabla {@code public.certificado_curso}. */
export interface CertificadoCurso {
  id: string;
  certificado_id: string;
  curso_id: string;
  titulo_snapshot: string;
  horas: number | null;
  porcentaje_progreso: number | null;
  creado_en: string;
}

/** Tabla {@code public.notificacion}. */
export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  plantilla: string | null;
  variables: Record<string, unknown> | null;
  canal: string;
  destinatario_id: string | null;
  entidad_tipo: string | null;
  entidad_id: string | null;
  enviar_en: string | null;
  enviada_en: string | null;
  error: string | null;
  clave_idempotencia: string | null;
  creado_en: string;
  creado_por: string | null;
}

/** Tabla {@code public.notificacion_destinatario}. */
export interface NotificacionDestinatario {
  id: string;
  notificacion_id: string;
  usuario_id: string;
  canal: string;
  estado: string;
  leida_en: string | null;
  enviada_en: string | null;
  error: string | null;
  creado_en: string;
}

/** Tabla {@code public.ticket}. */
export interface Ticket {
  id: string;
  usuario_id: string;
  asunto: string;
  descripcion: string;
  categoria: string | null;
  prioridad: string;
  estado: string;
  entidad_tipo: string | null;
  entidad_id: string | null;
  asignado_a: string | null;
  resuelto_en: string | null;
  cerrado_en: string | null;
  valoracion: number | null;
  clave_idempotencia: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.ticket_respuesta}. */
export interface TicketRespuesta {
  id: string;
  ticket_id: string;
  autor_id: string;
  cuerpo: string;
  es_interna: boolean;
  adjunto: string | null;
  creado_en: string;
}

/** Tabla {@code public.mensaje}. */
export interface Mensaje {
  id: string;
  emisor_id: string;
  destinatario_id: string;
  hilo_id: string;
  asunto: string | null;
  cuerpo: string;
  adjuntos: unknown;
  leido_en: string | null;
  borrado_por_emisor: boolean;
  borrado_por_destinatario: boolean;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Chatbot
   ========================================================================== */

/** Tabla {@code public.chatbot_conversacion}. */
export interface ChatbotConversacion {
  id: string;
  usuario_id: string | null;
  titulo: string | null;
  estado: string;
  rol_usuario: RolUsuario | null;
  modelo: string;
  temperatura: number | null;
  max_tokens: number | null;
  resumen: string | null;
  tokens_totales: number | null;
  escalado: boolean;
  cerrado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.chatbot_mensaje}. */
export interface ChatbotMensaje {
  id: string;
  conversacion_id: string;
  autor_id: string | null;
  rol: string;
  origen: string;
  contenido: string;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  latencia_ms: number | null;
  modelo: string | null;
  datos: Record<string, unknown> | null;
  es_privado: boolean;
  creado_en: string;
}

/* =============================================================================
   Administracion
   ========================================================================== */

/** Tabla {@code public.auditoria_acceso}. */
export interface AuditoriaAcceso {
  id: string;
  usuario_id: string | null;
  email: string | null;
  evento: string;
  exito: boolean;
  ip: string | null;
  agente_usuario: string | null;
  metadatos: Record<string, unknown> | null;
  creado_en: string;
}

/** Tabla {@code public.registro_accion} (auditoria). */
export interface RegistroAccion {
  id: string;
  evento_id: string | null;
  codigo_evento: string;
  actor_id: string | null;
  usuario_objetivo_id: string | null;
  entidad_tipo: string | null;
  entidad_id: string | null;
  accion: string;
  valor_anterior: unknown;
  valor_nuevo: unknown;
  ip: string | null;
  agente_usuario: string | null;
  ruta: string | null;
  metodo: string | null;
  exito: boolean;
  mensaje_error: string | null;
  correlation_id: string | null;
  duracion_ms: number | null;
  datos: Record<string, unknown> | null;
  creado_en: string;
}

/** Tabla {@code public.configuracion}. */
export interface Configuracion {
  id: string;
  clave: string;
  valor: string;
  tipo: string;
  descripcion: string | null;
  categoria: string | null;
  editable: boolean;
  es_secreta: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.parametro_sistema}. */
export interface ParametroSistema {
  id: string;
  clave: string;
  valor: string;
  tipo: string;
  descripcion: string | null;
  categoria: string | null;
  solo_lectura: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla {@code public.regla_progresion}. */
export interface ReglaProgresion {
  id: string;
  tipo: string;
  nombre: string;
  xp_requerido: number;
  valor: number;
  descripcion: string | null;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
}

/* =============================================================================
   Tipos auxiliares de la aplicacion
   ========================================================================== */

/** Respuesta paginada de PostgREST. */
export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

/** Filtros de listados del catalogo publico. */
export interface FiltrosCurso {
  busqueda?: string;
  categoriaId?: string;
  docenteId?: string;
  estado?: EstadoCurso;
  precioMaximo?: number;
  soloGratis?: boolean;
  orden?: 'relevancia' | 'precio_asc' | 'precio_desc' | 'recientes' | 'popularidad';
  pagina: number;
  tamanoPagina: number;
}

/** Estado de carga de una operacion asincrona. */
export type EstadoCarga = 'idle' | 'loading' | 'success' | 'error';

/** Resultado de una operacion que puede fallar. */
export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; error: string };

/**
 * Contrato de los endpoints del backend que aun no existen.
 *
 * <p>El backend Spring Boot todavia no expone controladores REST. Estas
 * interfaces definen el contrato necesario para que los servicios puedan
 * invocarlos sin inventar comportamiento. Ver
 * {@code docs/frontend-integracion-backend.md}.</p>
 */
export interface ContratoBackendPendiente {
  /** Ruta base relativa, por ejemplo {@code /api/chatbot/mensajes}. */
  readonly ruta: string;
  /** Metodo HTTP previsto. */
  readonly metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Descripcion de lo que el endpoint debe resolver. */
  readonly proposito: string;
}

/** Estados de los anuncios del docente. */
export type EstadoAnuncio = 'borrador' | 'publicado' | 'archivado';

/** Tabla {@code public.anuncio}. */
export interface Anuncio {
  id: string;
  curso_id: string;
  docente_id: string;
  titulo: string;
  contenido: string;
  fijado: boolean;
  estado: EstadoAnuncio;
  creado_en: string;
  actualizado_en: string;
}
