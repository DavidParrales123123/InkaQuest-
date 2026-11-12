# Configuración de Spring Boot — InkaQuest API

Configuración del backend `backend/inkaquest-api`.

## 1. Stack

| Elemento | Versión | Motivo |
|---|---|---|
| Java | 25 | Requisito de la plataforma; compilado con `release 25` |
| Spring Boot | 3.5.16 | Última estable de la línea 3.5.x, compatible con Java 25 |
| Maven | 3.9+ | Construcción estándar y reproducible |
| Spring Security | 6.5.x (gestionada por Boot) | Autenticación y autorización |
| Spring Data JPA / Hibernate | 6.6.x (gestionada por Boot) | Persistencia sobre PostgreSQL |
| springdoc-openapi | 2.9.1 | OpenAPI 3 y Swagger UI |
| PostgreSQL Driver | 42.x (gestionado por Boot) | Acceso a Supabase PostgreSQL |

> **Nota de versionado:** Spring Boot 4.x no se usa en esta fase. La línea
> 4.1.x falló la prueba de carga de contexto en el entorno de desarrollo
> disponible, mientras que 3.5.16 compila y supera todas las pruebas con
> Java 25. Cuando el JDK de producción esté fijado, se evaluará el salto.

## 2. Java 25

```xml
<properties>
    <java.version>25</java.version>
    <maven.compiler.release>25</maven.compiler.release>
</properties>
```

`maven.compiler.release` es la propiedad clave: compila contra la API de Java
25 y genera *bytecode* versión 69, de modo que el artefacto es ejecutable en
cualquier JDK 25 o superior, aunque se construya con un JDK más reciente.

Verificación realizada:

```
[INFO] Compiling 13 source files with javac [debug parameters release 25] to target\classes
```

## 3. Dependencias

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>${springdoc.version}</version>
</dependency>
```

## 4. Arquitectura por capas

```
com.inkaquest
├── InkaQuestApplication.java
├── shared/
│   ├── configuration/   CorsConfig, OpenApiConfig, CorsProperties
│   ├── security/        SecurityConfig, SecurityProperties
│   ├── exception/       GlobalExceptionHandler + excepciones de negocio
│   └── response/        ApiResponse<T>
└── modules/             Módulos de negocio (controller/service/repository/entity/dto)
```

### Contrato de respuesta

Todas las respuestas usan `ApiResponse<T>`:

```java
public record ApiResponse<T>(
        boolean success, String message, T data, String error, Instant timestamp) { }
```

Esto da al frontend una forma única de procesar cuerpos, incluidos los errores.

### Manejo global de excepciones

`GlobalExceptionHandler` (`@RestControllerAdvice`) traduce:

| Excepción | HTTP | Código |
|---|---|---|
| `BadRequestException` | 400 | `BAD_REQUEST` |
| `ResourceNotFoundException` | 404 | `NOT_FOUND` |
| `UnauthorizedException` | 401 | `UNAUTHORIZED` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` |
| `Exception` | 500 | `INTERNAL_ERROR` |

## 5. Spring Security

La API es **stateless** (`SessionCreationPolicy.STATELESS`), sin cookies y sin
CSRF, porque el frontend consume la API por HTTPS con un token Bearer.

```java
http
    .csrf(csrf -> csrf.disable())
    .cors(Customizer.withDefaults())
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
        .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
        .anyRequest().authenticated());
```

En la siguiente fase se añadirá el filtro que valida el JWT emitido por
Supabase Auth, sustituyendo la autenticación HTTP Basic provisional.

## 6. CORS

```java
registry.addMapping("/**")
    .allowedOrigins(corsProperties.allowedOrigins().toArray(String[]::new))
    .allowedMethods(...)
    .allowedHeaders(...)
    .allowCredentials(corsProperties.allowCredentials())
    .maxAge(corsProperties.maxAge());
```

Los orígenes se configuran por variable de entorno:

```yaml
app:
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:4200}
```

En producción debe incluir el dominio de Vercel, por ejemplo
`https://inkaquest.vercel.app`.

## 7. Persistencia (JPA / Hibernate)

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

**`ddl-auto: none` es obligatorio.** El esquema de la base de datos se gestiona
con migraciones SQL versionadas en `supabase/migrations/`. Hibernate no debe
crear ni alterar tablas: eso causaría divergencias entre el esquema real y el
código.

`open-in-view: false` evita mantener la sesión de Hibernate abierta durante la
serialización de la respuesta.

Las entidades JPA se definirán cuando se diseñe el esquema definitivo; por
eso esta fase no incluye ninguna.

## 8. Perfiles de ejecución

| Perfil | Archivo | Uso |
|---|---|---|
| (base) | `application.yml` | Configuración común y valores por defecto |
| `local` | `application-local.yml` | Desarrollo local: SQL visible, logs DEBUG |
| `prod` | (variables de entorno) | Render / Railway |

```bash
mvn spring-boot:run                                              # perfil por defecto (local)
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

En el proveedor de despliegue se define `SPRING_PROFILES_ACTIVE=prod`.

## 9. Variables de entorno

| Variable | Uso | Secreto |
|---|---|---|
| `SERVER_PORT` | Puerto HTTP | No |
| `SPRING_PROFILES_ACTIVE` | Perfil activo | No |
| `DB_URL` | JDBC de Supabase | No |
| `DB_USERNAME` | Usuario de la base | No |
| `DB_PASSWORD` | Contraseña de la base | **Sí** |
| `SUPABASE_URL` | URL del proyecto | No |
| `SUPABASE_ANON_KEY` | Clave pública | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso administrativo | **Sí** |
| `SUPABASE_JWT_SECRET` | Validación de JWT | **Sí** |
| `APP_CORS_ALLOWED_ORIGINS` | Orígenes permitidos | No |

Todas están declaradas en `.env.example` en la raíz del repositorio.

## 10. OpenAPI y Actuator

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

Como `server.servlet.context-path` es `/`, las rutas de Actuator y OpenAPI no llevan `/api`. Los controladores de negocio sí declaran el prefijo `/api/v1`: 

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI: <http://localhost:8080/api-docs>
- Salud: <http://localhost:8080/actuator/health>

El endpoint de salud es el que usan las sondas de disponibilidad de Render y
Railway.

## 11. Pruebas

```bash
mvn clean verify        # compila y ejecuta las pruebas
mvn test                # solo pruebas
```

La prueba de carga de contexto excluye el auto-configuración de base de datos
para que la fase base pueda validarse sin una instancia de PostgreSQL:

```java
@SpringBootTest(properties = {
    "spring.autoconfigure.exclude="
        + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration"
})
class InkaQuestApplicationTests { }
```

> `spring.autoconfigure.exclude` acepta varios valores separados por coma.
> Repetir la clave en el array de `@SpringBootTest` hace que la última
> occurrence gane y el resto se pierde.

Estado verificado: **BUILD SUCCESS**, `Tests run: 1, Failures: 0, Errors: 0`.

## 12. Empaquetado

```bash
mvn clean package
# -> target/inkaquest-api-0.1.0.jar
```

Para ejecutar el JAR directamente:

```bash
java -jar target/inkaquest-api-0.1.0.jar --spring.profiles.active=local
```

En producción se usa la imagen de `infra/docker/Dockerfile.backend`, que
construye el JAR en una etapa previa y lo ejecuta en una imagen mínima con JRE
25.

## 13. Checklist antes de un PR

- [ ] `mvn clean verify` sin errores.
- [ ] Sin secretos en `application*.yml` (solo referencias a variables).
- [ ] Las entidades nuevas tienen su migración SQL correspondiente.
- [ ] Los endpoints nuevos están documentados con OpenAPI.
- [ ] Los módulos no acceden a las entidades de otros módulos.
