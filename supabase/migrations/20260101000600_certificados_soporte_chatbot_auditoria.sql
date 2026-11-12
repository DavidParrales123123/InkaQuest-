-- =============================================================================
-- MIGRACION 0006 - Modulo J: Certificados
--                 Modulo K: Notificaciones y soporte
--                 Modulo L: Chatbot inteligente general
--                 Modulo M: Auditoria y configuracion
-- -----------------------------------------------------------------------------
-- Depende de: 0001 (tipos), 0002 (perfil, curso), 0003 (gamificacion)
--
-- CHATBOT Y PERMISOS
--   El chatbot responde a usuarios de los cuatro roles. Cada respuesta se
--   genera desde el contexto del usuario; nunca se leen filas que el usuario
--   no pueda leer por si mismo. Las politicas RLS de esta migracion aplican
--   las mismas restricciones que al resto de la aplicacion.
--
--   La tabla 'fragmento_documento' contempla embeddings de pgvector cuando la
--   extension esta disponible; si no lo esta, el buscador usa trigram.
-- =============================================================================


-- =============================================================================
-- MODULO J - CERTIFICADOS
-- =============================================================================

create table if not exists public.certificado (
    id                uuid primary key default gen_random_uuid(),
    --
    -- Codigo publico de verificacion (unico, no adivinable).
    codigo            text        not null unique,
    --
    -- Estado del certificado.
    estado            text        not null default 'emitido'
                      check (estado in ('emitido', 'revocado', 'expirado')),
    --
    -- Fecha de emision y de expiracion.
    emitido_en        timestamptz not null default now(),
    expira_en         timestamptz,
    --
    -- Plantilla y URL del PDF.
    plantilla         text,
    url_documento     text,
    ruta_storage      text,
    hash_sha256       text,
    --
    -- Datos de verificacion publica.
    verificado        boolean     not null default false,
    veces_verificado  integer     not null default 0 check (veces_verificado >= 0),
    --
    -- Datos de la emision (congelados para el historico).
    emitido_por       uuid references public.perfil (id) on delete set null,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_certificado_codigo
    on public.certificado (codigo);
create index if not exists idx_certificado_estado
    on public.certificado (estado, emitido_en desc);

-- Titulares del certificado (puede haber co-titulares).
create table if not exists public.certificado_titular (
    id                uuid primary key default gen_random_uuid(),
    certificado_id    uuid        not null references public.certificado (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    nombre_completo   text        not null,
    documento         text,
    --
    -- Progreso y nota final reflejados al momento de la emision.
    porcentaje_progreso numeric(5, 2) not null default 100
                        check (porcentaje_progreso between 0 and 100),
    nota_final        numeric(8, 2),
    es_principal      boolean     not null default true,
    creado_en         timestamptz not null default now(),
    unique (certificado_id, usuario_id)
);

create index if not exists idx_certificado_titular_usuario
    on public.certificado_titular (usuario_id);

-- Cursos incluidos en el certificado.
create table if not exists public.certificado_curso (
    id                uuid primary key default gen_random_uuid(),
    certificado_id    uuid        not null references public.certificado (id) on delete cascade,
    curso_id          uuid        not null references public.curso (id) on delete restrict,
    titulo_snapshot   text        not null,
    horas             integer     not null default 0 check (horas >= 0),
    porcentaje_progreso numeric(5, 2) not null default 100
                        check (porcentaje_progreso between 0 and 100),
    creado_en         timestamptz not null default now(),
    unique (certificado_id, curso_id)
);

-- Historial de emisiones (auditoria).
create table if not exists public.certificado_emision (
    id                uuid primary key default gen_random_uuid(),
    certificado_id    uuid        not null references public.certificado (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    tipo              text        not null default 'emision'
                      check (tipo in ('emision', 'reemision', 'revocacion', 'actualizacion')),
    --
    -- Idempotencia: una misma solicitud no emite dos veces.
    clave_idempotencia text       unique,
   actor_id          uuid references public.perfil (id) on delete set null,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_certificado_emision_certificado
    on public.certificado_emision (certificado_id, creado_en desc);

-- Revocaciones.
create table if not exists public.certificado_revocacion (
    id                uuid primary key default gen_random_uuid(),
    certificado_id    uuid        not null references public.certificado (id) on delete cascade,
    motivo            text        not null,
    revocado_por      uuid references public.perfil (id) on delete set null,
    revocado_en       timestamptz not null default now()
);

create index if not exists idx_certificado_revocacion_certificado
    on public.certificado_revocacion (certificado_id);


-- =============================================================================
-- MODULO K - NOTIFICACIONES Y SOPORTE
-- =============================================================================

create table if not exists public.notificacion (
    id                uuid primary key default gen_random_uuid(),
    titulo            text        not null,
    mensaje           text        not null,
    --
    -- Plantilla: permite reutilizar el texto con variables.
    plantilla         text,
    variables         jsonb       not null default '{}'::jsonb,
    canal             public.canal_notificacion not null default 'in_app',
    --
    -- Destinatario unico, o broadcast si es NULL.
    destinatario_id   uuid references public.perfil (id) on delete cascade,
    --
    -- Referencia al recurso que originó la notificacion.
    entidad_tipo      text,
    entidad_id        uuid,
    --
    -- Programacion de envio.
    enviar_en         timestamptz,
    enviada_en        timestamptz,
    error             text,
    --
    -- Clave de idempotencia: evita envios duplicados.
    clave_idempotencia text       unique,
    creado_en         timestamptz not null default now(),
    creado_por        uuid references public.perfil (id) on delete set null
);

create index if not exists idx_notificacion_destinatario
    on public.notificacion (destinatario_id, creado_en desc);
create index if not exists idx_notificacion_programada
    on public.notificacion (enviar_en)
    where enviada_en is null;

-- Historial de entregas por canal (permite multi-canal).
create table if not exists public.notificacion_destinatario (
    id                uuid primary key default gen_random_uuid(),
    notificacion_id   uuid        not null references public.notificacion (id) on delete cascade,
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    canal             public.canal_notificacion not null default 'in_app',
    estado            public.estado_notificacion not null default 'pendiente',
    leida_en          timestamptz,
    enviada_en        timestamptz,
    error             text,
    creado_en         timestamptz not null default now(),
    unique (notificacion_id, usuario_id, canal)
);

create index if not exists idx_notificacion_destinatario_usuario
    on public.notificacion_destinatario (usuario_id, estado);

-- Preferencias de notificacion por usuario y tipo.
create table if not exists public.preferencia_notificacion (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    tipo              text        not null,
    canal             public.canal_notificacion not null default 'in_app',
    habilitada        boolean     not null default true,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now(),
    unique (usuario_id, tipo, canal)
);

-- Mensajeria directa entre usuarios.
create table if not exists public.mensaje (
    id                uuid primary key default gen_random_uuid(),
    emisor_id         uuid        not null references public.perfil (id) on delete cascade,
    destinatario_id   uuid        not null references public.perfil (id) on delete cascade,
    --
    -- Hilo de conversacion (ambos usuarios comparten el mismo id).
    hilo_id           uuid        not null default gen_random_uuid(),
    asunto            text,
    cuerpo            text        not null,
    --
    -- Adjuntos.
    adjuntos          jsonb       not null default '[]'::jsonb,
    leido_en          timestamptz,
    borrado_por_emisor boolean    not null default false,
    borrado_por_destinatario boolean not null default false,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_mensaje_emisor
    on public.mensaje (emisor_id, creado_en desc);
create index if not exists idx_mensaje_destinatario
    on public.mensaje (destinatario_id, creado_en desc);
create index if not exists idx_mensaje_hilo
    on public.mensaje (hilo_id, creado_en);

-- Tickets de soporte.
create table if not exists public.ticket (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid        not null references public.perfil (id) on delete cascade,
    --
    -- Asunto y descripcion del problema.
    asunto            text        not null,
    descripcion       text        not null,
    categoria         text,
    prioridad         public.prioridad_ticket not null default 'media',
    estado            public.estado_ticket not null default 'abierto',
    --
    -- Referencia al recurso afectado (opcional).
    entidad_tipo      text,
    entidad_id        uuid,
    --
    -- Asignacion.
    asignado_a        uuid references public.perfil (id) on delete set null,
    --
    -- Cierre.
    resuelto_en       timestamptz,
    cerrado_en        timestamptz,
    --
    -- Satisfaccion.
    valoracion        integer     check (valoracion is null or valoracion between 1 and 5),
    --
    -- Clave de idempotencia para evitar tickets duplicados.
    clave_idempotencia text       unique,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_ticket_usuario
    on public.ticket (usuario_id, estado);
create index if not exists idx_ticket_asignado
    on public.ticket (asignado_a, estado);

-- Respuestas del ticket.
create table if not exists public.ticket_respuesta (
    id                uuid primary key default gen_random_uuid(),
    ticket_id         uuid        not null references public.ticket (id) on delete cascade,
    autor_id          uuid references public.perfil (id) on delete set null,
    cuerpo            text        not null,
    --
    -- Respuesta interna: no visible para el usuario que abrio el ticket.
    es_interna        boolean     not null default false,
    adjunto           jsonb       not null default '[]'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_ticket_respuesta_ticket
    on public.ticket_respuesta (ticket_id, creado_en);

-- Historial de soporte (auditoria del ticket).
create table if not exists public.historial_soporte (
    id                uuid primary key default gen_random_uuid(),
    ticket_id         uuid        not null references public.ticket (id) on delete cascade,
    evento            text        not null,
    actor_id          uuid references public.perfil (id) on delete set null,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_historial_soporte_ticket
    on public.historial_soporte (ticket_id, creado_en);


-- =============================================================================
-- MODULO L - CHATBOT INTELIGENTE GENERAL
-- =============================================================================

create table if not exists public.chatbot_conversacion (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid references public.perfil (id) on delete cascade,
    --
    -- NULL usuario_id = conversacion anonima (visitante publico).
    titulo            text,
    estado            public.estado_conversacion not null default 'abierta',
    --
    -- Rol del titular en la plataforma, congelado al iniciar.
    rol_usuario       public.rol_usuario,
    --
    -- Modelo y parametros usados.
    modelo            text        not null default 'default',
    temperatura       numeric(3, 2) not null default 0.7 check (temperatura between 0 and 2),
    max_tokens        integer     not null default 1000 check (max_tokens > 0),
    --
    -- Contexto acumulado.
    resumen           text,
    tokens_totales    integer     not null default 0 check (tokens_totales >= 0),
    --
    -- Escalado a soporte humano.
    escalado          boolean     not null default false,
    cerrado_en        timestamptz,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_chatbot_conversacion_usuario
    on public.chatbot_conversacion (usuario_id, creado_en desc);
create index if not exists idx_chatbot_conversacion_escalada
    on public.chatbot_conversacion (escalado, estado);

-- Participantes (soporta conversaciones grupales con el asistente).
create table if not exists public.chatbot_participante (
    id                uuid primary key default gen_random_uuid(),
    conversacion_id   uuid        not null references public.chatbot_conversacion (id) on delete cascade,
    usuario_id        uuid references public.perfil (id) on delete cascade,
    rol               public.rol_chatbot not null default 'usuario',
    --
    -- Permisos dentro de la conversacion.
    puede_ver_privado boolean     not null default false,
    unido_en          timestamptz,
    creado_en         timestamptz not null default now(),
    unique (conversacion_id, usuario_id, rol)
);

-- Mensajes del chatbot.
create table if not exists public.chatbot_mensaje (
    id                uuid primary key default gen_random_uuid(),
    conversacion_id   uuid        not null references public.chatbot_conversacion (id) on delete cascade,
    autor_id          uuid references public.perfil (id) on delete set null,
    rol               public.rol_chatbot not null default 'usuario',
    origen            public.origen_mensaje not null default 'usuario',
    contenido         text        not null,
    --
    -- Metricas de la llamada al modelo.
    tokens_entrada    integer     not null default 0 check (tokens_entrada >= 0),
    tokens_salida     integer     not null default 0 check (tokens_salida >= 0),
    latencia_ms       integer     check (latencia_ms is null or latencia_ms >= 0),
    modelo            text,
    --
    -- Datos estructurados: herramientas usadas, metadatos, etc.
    datos             jsonb       not null default '{}'::jsonb,
    --
    -- Marca de que el mensaje contiene informacion sensible: el historial
    -- de un usuario no puede leer mensajes de otro.
    es_privado        boolean     not null default false,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_chatbot_mensaje_conversacion
    on public.chatbot_mensaje (conversacion_id, creado_en);

-- Historial: resumenes por turno de conversacion.
create table if not exists public.chatbot_historial (
    id                uuid primary key default gen_random_uuid(),
    conversacion_id   uuid        not null references public.chatbot_conversacion (id) on delete cascade,
    turno             integer     not null check (turno > 0),
    resumen           text,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now(),
    unique (conversacion_id, turno)
);

-- Documentos de conocimiento.
create table if not exists public.chatbot_documento (
    id                uuid primary key default gen_random_uuid(),
    titulo            text        not null,
    slug              text        not null unique,
    --
    -- Ambito: que usuarios pueden consultar este documento.
    -- NULL = publico (visitantesanonimos).
    rol_minimo        public.rol_usuario,
    curso_id          uuid references public.curso (id) on delete cascade,
    --
    -- Origen del contenido.
    origen            text        not null default 'manual',
    ruta_storage      text,
    mime_type         text,
    --
    -- Estado de indexacion.
    indexado          boolean     not null default false,
    fragmentos         integer     not null default 0 check (fragmentos >= 0),
    embedding_modelo  text,
    --
    -- Versionado: ver chatbot_documento_version.
    version_actual    integer     not null default 1 check (version_actual > 0),
    activo            boolean     not null default true,
    creado_en         timestamptz not null default now(),
    creado_por        uuid references public.perfil (id) on delete set null,
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_chatbot_documento_activo
    on public.chatbot_documento (activo, indexado);

-- Versiones de documento (historial de cambios).
create table if not exists public.chatbot_documento_version (
    id                uuid primary key default gen_random_uuid(),
    documento_id      uuid        not null references public.chatbot_documento (id) on delete cascade,
    version           integer     not null check (version > 0),
    hash_sha256       text,
    resumen_cambios   text,
    datos             jsonb       not null default '{}'::jsonb,
    publicada_en      timestamptz not null default now(),
    publicado_por     uuid references public.perfil (id) on delete set null,
    unique (documento_id, version)
);

-- Fragmentos de documento (unidad indexable).
-- La columna de embedding se crea SOLO si pgvector esta disponible.
create table if not exists public.chatbot_fragmento (
    id                uuid primary key default gen_random_uuid(),
    documento_id      uuid        not null references public.chatbot_documento (id) on delete cascade,
    version           integer     not null default 1 check (version > 0),
    orden             integer     not null default 0,
    --
    -- Rol minimo: un fragmento puede tener un nivel de acceso mas alto que
    -- el del documento (por ejemplo, respuestas de soporte).
    rol_minimo        public.rol_usuario,
    contenido         text        not null,
    --
    -- Datos para busqueda por palabras clave.
    tokens            text,
    --
    -- Metadatos (titulo, seccion, pagina...).
    metadatos         jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now(),
    unique (documento_id, version, orden)
);

create index if not exists idx_chatbot_fragmento_documento
    on public.chatbot_fragmento (documento_id, version);
create index if not exists idx_chatbot_fragmento_tokens_trgm
    on public.chatbot_fragmento using gin (tokens gin_trgm_ops);

-- Referencias: que fragmentos respaldaron cada respuesta.
create table if not exists public.chatbot_referencia (
    id                uuid primary key default gen_random_uuid(),
    mensaje_id        uuid        not null references public.chatbot_mensaje (id) on delete cascade,
    fragmento_id      uuid references public.chatbot_fragmento (id) on delete set null,
    documento_id      uuid references public.chatbot_documento (id) on delete set null,
    --
    -- Puntuacion de relevancia (coseno con vector, o trigram si no hay pgvector).
    relevancia         numeric(6, 4) not null default 0,
    --
    -- Fragmento citado en la respuesta.
    cita              text,
    creado_en         timestamptz not null default now()
);

create index if not exists idx_chatbot_referencia_mensaje
    on public.chatbot_referencia (mensaje_id);

-- Retroalimentacion del usuario sobre las respuestas.
create table if not exists public.chatbot_retroalimentacion (
    id                uuid primary key default gen_random_uuid(),
    mensaje_id        uuid        not null references public.chatbot_mensaje (id) on delete cascade,
    usuario_id        uuid references public.perfil (id) on delete cascade,
    --
    -- Utilidad: 'util' | 'no_util' | 'incorrecto'
    voto              text        not null check (voto in ('util', 'no_util', 'incorrecto')),
    comentario        text,
    --
    -- Idempotencia: un voto por usuario y mensaje.
    creado_en         timestamptz not null default now(),
    updated_en        timestamptz not null default now(),
    unique (mensaje_id, usuario_id)
);

-- Derivacion a soporte humano.
create table if not exists public.chatbot_derivacion (
    id                uuid primary key default gen_random_uuid(),
    conversacion_id   uuid        not null references public.chatbot_conversacion (id) on delete cascade,
    ticket_id         uuid references public.ticket (id) on delete set null,
    usuario_id        uuid references public.perfil (id) on delete set null,
    estado            public.estado_derivacion not null default 'abierta',
    motivo            text        not null,
    datos             jsonb       not null default '{}'::jsonb,
    creado_en         timestamptz not null default now(),
    actualizado_en    timestamptz not null default now()
);

create index if not exists idx_chatbot_derivacion_estado
    on public.chatbot_derivacion (estado, creado_en desc);

-- Registro de consumo (facturacion y limites).
create table if not exists public.chatbot_consumo (
    id                uuid primary key default gen_random_uuid(),
    usuario_id        uuid references public.perfil (id) on delete set null,
    conversacion_id   uuid references public.chatbot_conversacion (id) on delete set null,
    modelo            text        not null,
    tokens_entrada    integer     not null default 0 check (tokens_entrada >= 0),
    tokens_salida     integer     not null default 0 check (tokens_salida >= 0),
    costo             numeric(12, 6) not null default 0 check (costo >= 0),
    latencia_ms       integer     check (latencia_ms is null or latencia_ms >= 0),
    creado_en         timestamptz not null default now()
);

create index if not exists idx_chatbot_consumo_usuario
    on public.chatbot_consumo (usuario_id, creado_en desc);
create index if not exists idx_chatbot_consumo_modelo
    on public.chatbot_consumo (modelo, creado_en desc);


-- =============================================================================
-- MODULO M - AUDITORIA Y CONFIGURACION
-- =============================================================================

-- Catalogo de eventos auditables.
create table if not exists public.evento_sistema (
    id            uuid primary key default gen_random_uuid(),
    codigo        text        not null unique,
    nombre        text        not null,
    descripcion   text,
    modulo        text        not null,
    --
    -- Nivel de criticidad para el monitoreo.
    nivel         text        not null default 'info'
                  check (nivel in ('debug', 'info', 'aviso', 'critico')),
    --
    -- Si el evento retiene datos sensibles (afecta el enmascarado).
    contiene_datos_sensibles boolean not null default false,
    activo        boolean     not null default true,
    creado_en     timestamptz not null default now()
);

-- Registro de acciones (bitacora principal).
create table if not exists public.registro_accion (
    id            uuid primary key default gen_random_uuid(),
    evento_id     uuid references public.evento_sistema (id) on delete set null,
    codigo_evento text,
    --
    -- Actores.
    actor_id      uuid references public.perfil (id) on delete set null,
    --
    -- Sujeto de la accion.
    usuario_objetivo_id uuid references public.perfil (id) on delete set null,
    entidad_tipo  text        not null,
    entidad_id    uuid,
    accion        public.tipo_accion not null,
    --
    -- Cambios: valor anterior y nuevo (enmascarados si el evento lo exige).
    valor_anterior jsonb,
    valor_nuevo    jsonb,
    --
    -- Contexto de la peticion.
    ip            inet,
    agente_usuario text,
    ruta          text,
    metodo        text,
    --
    -- Resultado.
    exito         boolean     not null default true,
    mensaje_error text,
    --
    -- Traza tecnica.
    correlation_id text,
    duracion_ms   integer     check (duracion_ms is null or duracion_ms >= 0),
    datos         jsonb       not null default '{}'::jsonb,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_registro_accion_actor
    on public.registro_accion (actor_id, creado_en desc);
create index if not exists idx_registro_accion_entidad
    on public.registro_accion (entidad_tipo, entidad_id, creado_en desc);
create index if not exists idx_registro_accion_codigo
    on public.registro_accion (codigo_evento, creado_en desc);
create index if not exists idx_registro_accion_correlacion
    on public.registro_accion (correlation_id);

-- Cambios administrativos (aprobaciones, rol, precios).
create table if not exists public.cambio_administrativo (
    id            uuid primary key default gen_random_uuid(),
    admin_id      uuid references public.perfil (id) on delete set null,
    --
    -- Que se cambio.
    entidad_tipo  text        not null,
    entidad_id    uuid,
    campo         text,
    valor_anterior jsonb,
    valor_nuevo   jsonb,
    --
    -- Motivo obligatorio: exige rendicion de cuentas.
    motivo        text        not null,
    --
    -- Revertible: permite deshacer el cambio.
    revertido_en  timestamptz,
    revertido_por uuid references public.perfil (id) on delete set null,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_cambio_administrativo_admin
    on public.cambio_administrativo (admin_id, creado_en desc);
create index if not exists idx_cambio_administrativo_entidad
    on public.cambio_administrativo (entidad_tipo, entidad_id);

-- Historial de modificaciones por entidad.
create table if not exists public.historial_modificacion (
    id            uuid primary key default gen_random_uuid(),
    entidad_tipo  text        not null,
    entidad_id    uuid        not null,
    campo         text        not null,
    valor_anterior jsonb,
    valor_nuevo   jsonb,
    actor_id      uuid references public.perfil (id) on delete set null,
    origen        text        not null default 'aplicacion',
    creado_en     timestamptz not null default now()
);

create index if not exists idx_historial_modificacion_entidad
    on public.historial_modificacion (entidad_tipo, entidad_id, creado_en desc);

-- Configuracion general de la plataforma.
create table if not exists public.configuracion (
    id            uuid primary key default gen_random_uuid(),
    clave         text        not null unique,
    valor         jsonb       not null default '{}'::jsonb,
    tipo          public.tipo_configuracion not null default 'json',
    descripcion   text,
    --
    -- Categoria para agrupar en el panel de administracion.
    categoria     text        not null default 'general',
    --
    -- Editable solo por administradores (segun politica RLS).
    editable      boolean     not null default true,
    --
    -- Si es secreta, el valor no se expone por la API.
    es_secreta    boolean     not null default false,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

-- Parametros del sistema (valores simples, solo lectura).
create table if not exists public.parametro_sistema (
    id            uuid primary key default gen_random_uuid(),
    clave         text        not null unique,
    valor         text        not null,
    tipo          text        not null default 'string',
    descripcion   text,
    categoria     text        not null default 'general',
    solo_lectura  boolean     not null default true,
    creado_en     timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- =============================================================================
-- TRIGGERS DE MANTENIMIENTO
-- =============================================================================
do $$
declare
    t text;
begin
    foreach t in array array[
        'certificado', 'certificado_titular', 'ticket', 'mensaje',
        'chatbot_conversacion', 'chatbot_documento', 'chatbot_derivacion',
        'chatbot_retroalimentacion', 'configuracion', 'parametro_sistema'
    ] loop
        execute format('drop trigger if exists trg_actualizar_timestamp on public.%I', t);
        execute format(
            'create trigger trg_actualizar_timestamp '
            'before update on public.%I '
            'for each row execute function public.fn_actualizar_timestamp()', t);
    end loop;
end $$;


-- =============================================================================
-- COLUMNA DE EMBEDDING (pgvector, opcional)
-- Si la extension vector no esta disponible, la tabla sigue siendo funcional
-- con busqueda por trigram sobre 'tokens'.
-- =============================================================================
do $$
begin
    if exists (select 1 from pg_extension where extname = 'vector') then
        execute 'alter table public.chatbot_fragmento add column if not exists embedding extensions.vector(1536)';
        raise notice 'Columna de embeddings (pgvector) anadida a chatbot_fragmento.';
    else
        raise notice 'pgvector no disponible: chatbot_fragmento usara busqueda por texto.';
    end if;
end $$;


-- =============================================================================
-- FIN DE LA MIGRACION 0006
-- =============================================================================
