import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { APP_CONFIG } from '../config/app-config';

/**
 * Cliente de Supabase.
 *
 * <p>Se usa la clave <b>publica</b> (anon / publishable). Los datos estan
 * protegidos por las politicas RLS de PostgreSQL: el cliente decide que puede
 * ver, la base de datos lo impone.</p>
 *
 * <p>Nunca debe usarse aqui la clave {@code service_role}: saltaria la RLS y
 * expondría todos los datos.</p>
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly config = inject(APP_CONFIG);

  readonly client: SupabaseClient = createClient(
    this.config.supabaseUrl,
    this.config.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => localStorage.setItem(key, value),
          removeItem: (key: string) => localStorage.removeItem(key),
        },
      },
    },
  );

  /**
   * Tablas de la base de datos expuestas por PostgREST.
   *
   * <p>Los nombres son los reales del esquema {@code public}.</p>
   */
  readonly tabla = {
    // Identidad
    perfil: 'perfil',
    permiso: 'permiso',
    rolPermiso: 'rol_permiso',
    solicitudDocente: 'solicitud_docente',

    // Catalogo
    categoria: 'categoria',
    curso: 'curso',
    docenteCurso: 'docente_curso',
    unidad: 'unidad',
    modulo: 'modulo',
    leccion: 'leccion',
    contenido: 'contenido',
    recurso: 'recurso',
    materialDescargable: 'material_descargable',

    // Actividades
    actividad: 'actividad',
    tarea: 'tarea',
    entrega: 'entrega',
    entregaArchivo: 'entrega_archivo',
    tareaArchivo: 'tarea_archivo',
    calificacion: 'calificacion',
    evaluacion: 'evaluacion',
    pregunta: 'pregunta',
    opcion: 'opcion',
    intentoEvaluacion: 'intento_evaluacion',
    respuestaEvaluacion: 'respuesta_evaluacion',

    // Matriculas y progreso
    matricula: 'matricula',
    progresoCurso: 'progreso_curso',
    progresoUnidad: 'progreso_unidad',
    progresoLeccion: 'progreso_leccion',
    historialProgreso: 'historial_progreso',

    // Gamificacion
    insignia: 'insignia',
    insigniaUsuario: 'insignia_usuario',
    transaccionXp: 'transaccion_xp',
    transaccionMoneda: 'transaccion_moneda',
    monedero: 'monedero',
    racha: 'racha',
    ranking: 'ranking',
    temporada: 'temporada',
    mision: 'mision',
    misionUsuario: 'mision_usuario',
    eventoGamificacion: 'evento_gamificacion',
    reglaProgresion: 'regla_progresion',
    insigniaCatalogo: 'insignia',

    // Tienda
    tiendaItem: 'tienda_item',
    inventario: 'inventario',
    compraVirtual: 'compra_virtual',

    // Minijuegos
    motor: 'motor',
    versionMotor: 'version_motor',
    motorCurso: 'motor_curso',
    motorComun: 'motor_comun',
    juego: 'juego',
    actividadJuego: 'actividad_juego',
    intentoJuego: 'intento_juego',
    resultadoJuego: 'resultado_juego',
    puntuacionJuego: 'puntuacion_juego',
    configuracionJuego: 'configuracion_juego',

    // Retos
    reto: 'reto',
    casoPrueba: 'caso_prueba',
    lenguaje: 'lenguaje',
    envioReto: 'envio_reto',
    restriccionReto: 'restriccion_reto',

    // Pagos
    pedido: 'pedido',
    detallePedido: 'detalle_pedido',
    transaccion: 'transaccion',
    reembolso: 'reembolso',
    cupon: 'cupon',
    itemCarrito: 'item_carrito',
    carrito: 'carrito',

    // Certificados
    certificado: 'certificado',
    certificadoTitular: 'certificado_titular',
    certificadoCurso: 'certificado_curso',

    // Notificaciones y soporte
    anuncio: 'anuncio',
    notificacion: 'notificacion',
    notificacionDestinatario: 'notificacion_destinatario',
    preferenciaNotificacion: 'preferencia_notificacion',
    ticket: 'ticket',
    ticketRespuesta: 'ticket_respuesta',
    historialSoporte: 'historial_soporte',
    mensaje: 'mensaje',

    // Chatbot
    chatbotConversacion: 'chatbot_conversacion',
    chatbotMensaje: 'chatbot_mensaje',

    // Administracion
    registroAccion: 'registro_accion',
    auditoriaAcceso: 'auditoria_acceso',
    configuracion: 'configuracion',
    parametroSistema: 'parametro_sistema',
    eventoSistema: 'evento_sistema',
  } as const;
}
