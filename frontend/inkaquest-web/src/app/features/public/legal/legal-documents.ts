/**
 * Documentos legales (terminos, privacidad y pagos).
 * Contenido editorial estatico; el componente solo lo presenta.
 */

export interface SeccionLegal {
  /** Identificador de la seccion (ancla). */
  id: string;
  /** Titulo de la seccion. */
  titulo: string;
  /** Parrafos de la seccion. */
  parrafos: readonly string[];
  /** Lista opcional de puntos. */
  lista?: readonly string[];
}

/** Documento legal completo. */
export interface DocumentoLegal {
  /** Tipo de documento (coincide con el dato de la ruta). */
  tipo: string;
  /** Titulo principal. */
  titulo: string;
  /** Bajada introductoria. */
  resumen: string;
  /** Vigencia del documento. */
  vigencia: string;
  /** Secciones del documento. */
  secciones: readonly SeccionLegal[];
}

/** Terminos y condiciones de uso de la plataforma. */
export const TERMINOS: DocumentoLegal = {
  tipo: 'terminos',
  titulo: 'Términos y condiciones',
  resumen:
    'Las reglas que rigen el uso de InkaQuest: que puedes esperar de la plataforma y que esperamos de ti como usuario.',
  vigencia: 'Versión 1.0',
  secciones: [
    {
      id: 'aceptacion',
      titulo: 'Aceptación de los términos',
      parrafos: [
        'Estos términos y condiciones regulan el acceso y el uso de la plataforma educativa InkaQuest. Al crear una cuenta, al matricularte en un curso o al utilizar cualquier servicio de la plataforma, declaras que los has leído, los entiendes y los aceptas en su totalidad.',
        'Si no estás de acuerdo con alguno de estos términos, no utilices la plataforma. Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo desde la página de contacto.',
      ],
    },
    {
      id: 'servicios',
      titulo: 'Servicios ofrecidos',
      parrafos: [
        'InkaQuest ofrece cursos de programación con material teórico, actividades prácticas, retos evaluados automáticamente, mecanismos de seguimiento del progreso, sistema de recompensas y emisión de certificados verificables.',
        'El catálogo de cursos, sus contenidos, precios, duraciones y XP se muestran en esta plataforma y provienen del registro real de cursos. Los contenidos pueden actualizarse, ampliarse o retirarse del catálogo en cualquier momento.',
      ],
      lista: [
        'Acceso al contenido de los cursos en los que te matricules.',
        'Registro del progreso, del tiempo de estudio y de la experiencia obtenida.',
        'Emisión de certificados con código de verificación cuando cumplas los requisitos del curso.',
        'Canales de soporte para resolver dudas sobre la plataforma.',
      ],
    },
    {
      id: 'cuenta',
      titulo: 'Cuenta de usuario',
      parrafos: [
        'Para usar las funciones que requieren sesión debes crear una cuenta con un correo electrónico válido y una contraseña. Eres responsable de mantener la confidencialidad de tus credenciales y de la actividad que se realice con tu cuenta.',
        'Los datos de tu perfil se crean a partir de la informacion que proporcionas al registrarte y puedes actualizar parte de ellos desde tu panel. El rol de tu cuenta (estudiante, docente o administrador) lo concede un administrador de la plataforma; nunca se asigna de forma automática.',
      ],
    },
    {
      id: 'uso-aceptable',
      titulo: 'Uso aceptable de la plataforma',
      parrafos: [
        'Esta plataforma es un entorno de aprendizaje. No esta permitido usarla para infringir derechos de terceros, para acceder a cuentas ajenas, para eludir los controles de acceso o para introducir contenido ilecito, ofensivo o que vulnere la buena convivencia de la comunidad educativa.',
        'Tampoco esta permitido extraer el contenido de los cursos de forma masiva, revenderlo ni compartir las credenciales de acceso. El incumplimiento de estas reglas puede suponer la suspension o el cierre de la cuenta.',
      ],
    },
    {
      id: 'pagos',
      titulo: 'Pagos de los cursos de pago',
      parrafos: [
        'Los cursos de pago se cobran mediante un proveedor externo de pagos (Culqi). El proceso de compra lo completa el backend de InkaQuest, que genera el pedido, procesa la confirmación y autoriza el cobro. El navegador no puede marcar un pago como pagado por sí mismo.',
        'InkaQuest no almacena numeros de tarjeta ni codigos de seguridad (CVV). Los datos de la tarjeta se introducen directamente en el entorno seguro del proveedor de pagos.',
        'Los detalles completos de este proceso, las condiciones de reembolso y el tratamiento de facturas se describen en la política de pagos y reembolsos.',
      ],
    },
    {
      id: 'propiedad-intelectual',
      titulo: 'Propiedad intelectual',
      parrafos: [
        'Los cursos, materiales, retos, imágenes, marcas y el software de la plataforma pertenecen a InkaQuest o a los docentes que los han creado y cedido para su difusión dentro de la plataforma. El uso de la plataforma concede una licencia personal y no transferible para acceder al contenido, no para redistribuirlo.',
        'Las entregas que realizas como estudiante siguen siendo tuyas, y nos concedes el derecho de mostrarlas a los docentes del curso y de conservarlas como parte de tu historial académico.',
      ],
    },
    {
      id: 'certificados',
      titulo: 'Certificados y reconocimiento de logros',
      parrafos: [
        'La emisión de un certificado la realiza el backend cuando se cumplen los requisitos del curso. Cada certificado incluye un código único que cualquiera puede verificar desde la página pública de verificación.',
        'Un certificado acredita la superación del curso en la plataforma; no equivale a un título profesional ni a un crédito universitario, salvo que el curso lo especifique de forma expresa.',
      ],
    },
    {
      id: 'disponibilidad',
      titulo: 'Disponibilidad y modificaciones',
      parrafos: [
        'Trabajamos para mantener la plataforma disponible y con el contenido actualizado, pero no garantizamos un servicio ininterrumpido. Pueden existir ventanas de mantenimiento, incidencias del proveedor de pagos o ajustes en el catalogo.',
        'Podemos modificar estos términos para reflejar cambios en la plataforma o en la normativa aplicable. Las modificaciones se publicarán en esta página y serán aplicables desde su publicación.',
      ],
    },
    {
      id: 'responsabilidad',
      titulo: 'Limitación de responsabilidad',
      parrafos: [
        'La plataforma se ofrece en el estado en que se encuentra. No podemos garantizar que este libre de errores, de interrupciones o de que todo el contenido refleje el estado actual de la disciplina en cada momento.',
        'Nuestra responsabilidad por daños derivados del uso de la plataforma queda limitada a los casos de dolo o culpa inexcusable. Nada en estos términos limita derechos que la normativa vigente reconozca a los consumidores.',
      ],
    },
    {
      id: 'contacto',
      titulo: 'Contacto',
      parrafos: [
        'Para cualquier consulta sobre estos términos puedes usar la página de contacto de la plataforma. Si tienes cuenta, se creará un ticket de soporte a tu nombre para que puedas seguir su estado.',
      ],
    },
  ],
};

/** Politica de privacidad y tratamiento de datos personales. */
export const PRIVACIDAD: DocumentoLegal = {
  tipo: 'privacidad',
  titulo: 'Política de privacidad',
  resumen:
    'Qué datos recogemos, para qué los usamos, con quién los compartimos y cómo puedes ejercer tus derechos sobre ellos.',
  vigencia: 'Versión 1.0',
  secciones: [
    {
      id: 'responsable',
      titulo: 'Responsable del tratamiento',
      parrafos: [
        'InkaQuest es la plataforma educativa publicada por la institución que la gestiona. Puedes identificar al responsable y contactarlo a través de la página de contacto, indicando que tu consulta se refiere a la política de privacidad.',
        'Los datos de los usuarios se almacenan en la base de datos institucional de la plataforma, con los controles de acceso definidos por el equipo de seguridad de la información.',
      ],
    },
    {
      id: 'datos-recogidos',
      titulo: 'Datos que recogemos',
      parrafos: [
        'Recogemos los datos que nos facilitas al registrarte y los que se generan por el uso de la plataforma. No solicitamos datos que no sean necesarios para prestar el servicio.',
      ],
      lista: [
        'Datos de cuenta: correo electrónico, nombre, contraseña cifrada y estado de la cuenta.',
        'Datos académicos: matrículas, progreso por lección y unidad, tiempo de estudio, XP, insignias y evaluaciones realizadas.',
        'Datos de actividad: rachas, ranking, tienda de recompensas y monedas virtuales.',
        'Datos de soporte: tickets creados por ti, sus respuestas y la valoracion que registres.',
        'Datos técnicos mínimos: registros de acceso y auditoría de las acciones realizadas en la plataforma.',
      ],
    },
    {
      id: 'finalidad',
      titulo: 'Para qué usamos tus datos',
      parrafos: [
        'Usamos tus datos únicamente para prestar el servicio que contrataste y para cumplir obligaciones legales. No vendemos ni cedemos tus datos personales con fines comerciales.',
      ],
      lista: [
        'Crear y mantener tu cuenta y tu sesión activa.',
        'Calcular tu progreso, tu XP y tus insignias, y emitir certificados cuando cumplas los requisitos.',
        'Gestionar tus matrículas, pedidos y transacciones.',
        'Atender tus solicitudes de soporte y comunicarte novedades del servicio.',
        'Cumplir obligaciones legales y de seguridad, y conservar la evidencia de auditoría.',
      ],
    },
    {
      id: 'base-legal',
      titulo: 'Base legitimadora',
      parrafos: [
        'El tratamiento de tus datos se apoya en la ejecución del contrato de prestación del servicio (registro, matrícula y uso de la plataforma), en tu consentimiento para comunicaciones informativas y, cuando corresponda, en el cumplimiento de obligaciones legales.',
        'Puedes retirar tu consentimiento en cualquier momento sin que ello afecte a la licitud del tratamiento anterior a la retirada.',
      ],
    },
    {
      id: 'destinatarios',
      titulo: 'Destinatarios y transferencias',
      parrafos: [
        'Compartimos datos con los operadores tecnologicos que hacen posible el servicio, siempre bajo contrato de confidencialidad y con las medidas tecnicas y organizativas adecuadas.',
        'En concreto, los datos de pago son tratados por Culqi, proveedor externo de pagos: InkaQuest recibe el resultado de la operación, nunca los datos completos de la tarjeta.',
        'Los docentes responsables de un curso tienen acceso a los datos de sus propios estudiantes (nombre, entregas y calificaciones) para poder impartir y evaluar el curso.',
        'No realizamos transferencias internacionales de datos ni cedemos datos a terceros con fines ajenos a los descritos.',
      ],
    },
    {
      id: 'seguridad',
      titulo: 'Seguridad',
      parrafos: [
        'Aplicamos medidas técnicas y organizativas para proteger tus datos frente a accesos no autorizados, alteración o destrucción. Entre ellas se cuentan el control de acceso por rol, el cifrado de las comunicaciones y de las contraseñas, y los registros de auditoría de las operaciones sensibles.',
        'La plataforma nunca almacena numeros de tarjeta ni codigos de seguridad (CVV). Los pagos se introducen directamente en el entorno seguro del proveedor externo.',
      ],
    },
    {
      id: 'conservacion',
      titulo: 'Conservacion',
      parrafos: [
        'Conservamos los datos de la cuenta mientras esta permanezca activa. Cuando solicites su eliminación, se eliminan o anonimizan los datos que ya no sean necesarios para prestar el servicio o para cumplir obligaciones legales, conservando el registro de las operaciones exigidas por la normativa.',
      ],
      lista: [
        'Datos de cuenta y progreso: mientras la cuenta este activa y, tras su cierre, por el plazo necesario para atender responsabilidades.',
        'Transacciones y certificados: por los plazos exigidos por la normativa fiscal y de defensa del consumidor.',
        'Registros de auditoría y de acceso: por el plazo de conservación de las evidencias de seguridad.',
      ],
    },
    {
      id: 'derechos',
      titulo: 'Tus derechos',
      parrafos: [
        'Puedes ejercer los derechos de acceso, rectificación, cancelación, oposición y portabilidad sobre tus datos escribiendo a la institución desde la página de contacto. Atenderemos tu solicitud dentro del plazo legal.',
        'Si consideras que no hemos atendido correctamente tu solicitud, puedes presentar una queja ante la autoridad de protección de datos competente.',
      ],
    },
    {
      id: 'menores',
      titulo: 'Menores de edad',
      parrafos: [
        'La plataforma esta dirigida a estudiantes de educación superior y a docentes. Si un menor de edad utiliza la plataforma, el consentimiento y la responsabilidad recae en su tutor legal, que puede solicitar la eliminación de la cuenta en cualquier momento.',
      ],
    },
    {
      id: 'cookies',
      titulo: 'Cookies y almacenamiento local',
      parrafos: [
        'La plataforma puede utilizar cookies técnicas necesarias para mantener la sesión iniciada y recordar preferencias de la interfaz. No utilizamos cookies publicitarias ni de seguimiento de terceros para la versión actual del servicio.',
      ],
    },
    {
      id: 'cambios',
      titulo: 'Cambios en esta política',
      parrafos: [
        'Actualizamos esta política cuando cambien los tratamientos o la normativa aplicable. La fecha de actualización aparece al inicio del documento y los cambios relevantes se comunican por la plataforma o por correo.',
      ],
    },
  ],
};

/** Politica de pagos y reembolsos. */
export const PAGOS: DocumentoLegal = {
  tipo: 'pagos',
  titulo: 'Pagos y reembolsos',
  resumen:
    'Cómo se cobran los cursos, quién procesa el pago, qué datos de tarjeta manejamos y cómo se tramita una devolución.',
  vigencia: 'Versión 1.0',
  secciones: [
    {
      id: 'precios',
      titulo: 'Precios y moneda',
      parrafos: [
        'El precio de cada curso es el que figura en el catálogo público y se almacena en la base de datos de la plataforma. Los importes se expresan en soles (PEN).',
        'Los cursos gratuitos se activan al matricularte, sin trámite de pago. El precio final de una compra lo calcula y valida el backend en el momento de crear el pedido.',
      ],
    },
    {
      id: 'proveedor',
      titulo: 'El pago lo procesa un proveedor externo',
      parrafos: [
        'InkaQuest no recibe ni procesa directamente los datos de tu tarjeta. El cobro se realiza a través de Culqi, un proveedor externo de pagos que opera en un entorno seguro.',
        'La petición de pago la genera el backend de InkaQuest: el navegador solo envía la orden de compra y muestra el resultado que devuelve el servidor. El frontend nunca confirma un pago por sí mismo.',
      ],
      lista: [
        'Tu navegador abre el formulario de pago del proveedor en un entorno ajeno a la plataforma.',
        'El backend registra el pedido y devuelve los datos necesarios para iniciar la operación.',
        'El proveedor procesa el cobro y notifica el resultado al backend.',
        'El backend actualiza el estado de la transacción y, si el pago queda autorizado, activa la matrícula mediante la función autorizada de la base de datos.',
      ],
    },
    {
      id: 'datos-tarjeta',
      titulo: 'No almacenamos tarjetas ni CVV',
      parrafos: [
        'InkaQuest no guarda numeros de tarjeta, fecha de vencimiento ni codigos de seguridad (CVV). Esos datos se introducen directamente en la pagina del proveedor de pagos y no pasan por nuestros servidores ni por nuestra base de datos.',
        'Lo que guardamos es solo la información de la operación: identificador del pedido, importe, moneda, método de pago, estado, referencia del proveedor y código de autorización.',
      ],
    },
    {
      id: 'autorizacion',
      titulo: 'La autorización la aplica el backend',
      parrafos: [
        'La autorización del cobro es una operación exclusiva del backend de InkaQuest. Es el único componente que puede crear pedidos, autorizar transacciones, capturar importes, anularlos o emitir reembolsos.',
        'El frontend se limita a mostrar el estado que devuelve el servidor. Ninguna acción del navegador puede marcar un pago como exitoso, modificar un pedido ni conceder acceso a un curso de pago.',
      ],
    },
    {
      id: 'facturacion',
      titulo: 'Comprobantes y facturación',
      parrafos: [
        'Cada operación confirmada queda registrada con su referencia, importe, moneda y fecha en el historial de pagos de tu cuenta, donde puedes consultarla en cualquier momento.',
        'Para solicitudes de comprobante o facturación escribe desde la página de contacto indicando el número de pedido.',
      ],
    },
    {
      id: 'reembolsos',
      titulo: 'Devoluciones',
      parrafos: [
        'Puedes solicitar la devolución de un curso de pago desde la página de contacto o desde el panel de soporte, indicando el pedido y el motivo. La solicitud se registra como ticket y la revisa el equipo de soporte.',
        'Una vez aprobada, la devolución la ejecuta el backend, que es el único autorizado para anular la transacción y marcar el pedido como reembolsado. El plazo de la devolución depende de los tiempos del proveedor de pagos.',
      ],
      lista: [
        'Si solicitaste la devolucion antes de acceder al contenido del curso, se resuelve a favor del estudiante.',
        'Si el curso ya fue consumido en parte, la devolución se evalúa caso por caso según el progreso registrado.',
        'Las promociones, descuentos y cursos gratuitos no generan derecho a devolución.',
      ],
    },
    {
      id: 'cupones',
      titulo: 'Promociones y cupones',
      parrafos: [
        'Los cupones los aplica el backend al crear el pedido: su validez, límite de usos y monto de descuento se validan en ese momento. Un cupón no aplicado puede deberse a que ya venció, a que superó su límite o a que no cumple las condiciones de la promoción.',
      ],
    },
    {
      id: 'fraude',
      titulo: 'Pagos sospechosos y seguridad',
      parrafos: [
        'Podemos bloquear o anular operaciones que presenten indicios de fraude o uso indebido de medios de pago. En ese caso se te informará del estado de la operación y se conservará la evidencia correspondiente.',
        'Nunca te pediremos el número completo de tu tarjeta, el CVV, tu contraseña de la plataforma ni el código de autorización por correo o por mensaje. Ante una solicitud así, no compartas esos datos y escribe desde la página de contacto.',
      ],
    },
    {
      id: 'contacto',
      titulo: 'Consultas sobre pagos',
      parrafos: [
        'Para cualquier consulta sobre un cobro, un pedido o una devolución, escribe desde la página de contacto. Si tienes cuenta, se creará un ticket asociado a tu usuario para que puedas seguir su estado.',
      ],
    },
  ],
};
