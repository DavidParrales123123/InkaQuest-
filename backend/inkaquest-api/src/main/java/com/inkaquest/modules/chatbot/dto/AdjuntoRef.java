package com.inkaquest.modules.chatbot.dto;

/**
 * Referencia a un archivo que el usuario adjuntó al chat (subido antes al
 * bucket privado 'chat' de Supabase Storage). El backend firma una URL
 * temporal usando la URL ya firmada por el frontend (vigencia ~1 h), porque
 * los buckets son privados.
 *
 * <p>Reglas: máx. 3 adjuntos por mensaje, 25 MB por archivo (límite del
 * bucket), tipos permitidos: imágenes (visión), PDF (texto extraíble),
 * texto plano/md/csv.</p>
 */
public record AdjuntoRef(
        /** Ruta en el bucket 'chat' (p. ej. "<uid>/abc-archivo.pdf"). */
        String ruta,
        /** URL firmada temporal creada por el frontend (vigente ~1 h). */
        String url,
        /** MIME declarado por el navegador (image/png, application/pdf, text/plain…). */
        String mime,
        /** Nombre limpio del archivo. */
        String nombre,
        /** Tamaño en bytes. */
        Long tamano
) { }
