package com.inkaquest.shared.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.LayoutBase;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Encoder JSON minimalista para los logs de producción (sin dependencias extra).
 *
 * <p>Formato: una línea JSON por evento con los campos esenciales, listos para
 * ser ingeridos por cualquier pipeline (Loki, Elasticsearch, CloudWatch…):
 * {@code timestamp, level, logger, thread, message, mdc, exception}.</p>
 *
 * <p>NUNCA se serializa la línea de mensaje tal cual si contiene secretos del
 * MDC; el sanitizador de excepciones aplica a la clase del error.</p>
 */
public class JsonStructuredLayout extends LayoutBase<ILoggingEvent> {

    private static final DateTimeFormatter ISO = DateTimeFormatter
            .ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    @Override
    public String doLayout(ILoggingEvent event) {
        StringBuilder sb = new StringBuilder(256);
        sb.append('{');
        append(sb, "timestamp", ISO.format(Instant.ofEpochMilli(event.getTimeStamp())));
        sb.append(',');
        append(sb, "level", String.valueOf(event.getLevel()));
        sb.append(',');
        append(sb, "logger", event.getLoggerName());
        sb.append(',');
        append(sb, "thread", event.getThreadName());
        sb.append(',');
        append(sb, "message", safe(event.getFormattedMessage()));
        if (event.getMDCPropertyMap() != null && !event.getMDCPropertyMap().isEmpty()) {
            sb.append(",\"mdc\":{");
            boolean first = true;
            for (Map.Entry<String, String> e : event.getMDCPropertyMap().entrySet()) {
                if (!first) {
                    sb.append(',');
                }
                append(sb, e.getKey(), safe(e.getValue()));
                first = false;
            }
            sb.append('}');
        }
        if (event.getThrowableProxy() != null) {
            sb.append(",\"exception\":{");
            append(sb, "class", event.getThrowableProxy().getClassName());
            sb.append(',');
            append(sb, "message", safe(event.getThrowableProxy().getMessage()));
            sb.append('}');
        }
        sb.append("}\n");
        return sb.toString();
    }

    private static void append(StringBuilder sb, String key, String value) {
        sb.append('"').append(key).append("\":\"").append(escape(value)).append('"');
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String escape(String value) {
        StringBuilder out = new StringBuilder(value.length() + 16);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': out.append("\\\""); break;
                case '\\': out.append("\\\\"); break;
                case '\b': out.append("\\b"); break;
                case '\f': out.append("\\f"); break;
                case '\n': out.append("\\n"); break;
                case '\r': out.append("\\r"); break;
                case '\t': out.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
            }
        }
        return out.toString();
    }
}
