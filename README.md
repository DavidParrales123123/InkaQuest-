# 🎓 InkaQuest

**Plataforma LMS gamificada de última generación**

InkaQuest es una plataforma de gestión de aprendizaje (LMS) moderna y gamificada, diseñada para ofrecer una experiencia educativa inmersiva e interactiva.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-22-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Características Principales

### 🎮 Gamificación Completa
- Sistema de XP y niveles
- Insignias y logros
- Ranking y temporadas
- Misiones y desafíos
- Rachas de actividad

### 📚 Gestión Académica
- Cursos estructurados (Unidades → Módulos → Lecciones)
- Contenido multimedia
- Evaluaciones automáticas
- Tareas con entregas
- Certificados digitales

### 💻 Retos de Programación
- Editor de código integrado
- Evaluación automática
- Múltiples lenguajes soportados
- Rankings por reto

### 💰 E-Commerce Integrado
- Pagos con Culqi
- Cupones y promociones
- Gestión de pedidos

### 🤖 Chatbot IA
- Asistente conversacional
- Integración con OpenAI
- Soporte 24/7

---

## 🏗️ Arquitectura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Angular   │─────▶│ Spring Boot │─────▶│  Supabase   │
│  Frontend   │      │   Backend   │      │ PostgreSQL  │
└─────────────┘      └─────────────┘      └─────────────┘
     (Web)              (REST API)          (Database)
```

### Stack Tecnológico

#### Backend
- **Framework**: Spring Boot 3.4.0
- **Lenguaje**: Java 21
- **Base de datos**: PostgreSQL 15 (Supabase)
- **Seguridad**: Spring Security + JWT ES256
- **ORM**: Spring Data JPA + Hibernate
- **Build**: Maven 3.9

#### Frontend
- **Framework**: Angular 22
- **Lenguaje**: TypeScript 5.7
- **UI**: Tailwind CSS
- **State**: Angular Signals
- **Build**: Vite 6

#### Infraestructura
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Backend Hosting**: Railway / Render / AWS
- **Frontend Hosting**: Vercel
- **CI/CD**: GitHub Actions

---

## 📦 Estructura del Proyecto

```
InkaQuest/
├── backend/
│   └── inkaquest-api/          # Spring Boot REST API
│       ├── src/main/java/
│       │   └── com/inkaquest/
│       │       ├── modules/    # 14 módulos de negocio
│       │       └── shared/     # Código compartido
│       └── pom.xml
│
├── frontend/
│   └── inkaquest-web/          # Angular SPA
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/       # Servicios, guards, interceptors
│       │   │   ├── features/   # Módulos por funcionalidad
│       │   │   └── shared/     # Componentes compartidos
│       │   └── environments/
│       └── package.json
│
└── docs/                       # Documentación completa
    ├── arquitectura/
    ├── backend/
    ├── frontend/
    └── base-de-datos/
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Java 21+** (JDK)
- **Maven 3.8+**
- **Node.js 20+**
- **npm 10+**
- Cuenta en **Supabase** (gratis)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/InkaQuest.git
cd InkaQuest
```

### 2. Configurar Backend

```bash
cd backend/inkaquest-api

# Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Ejecutar
.\run-local.ps1
# O: mvn spring-boot:run
```

El backend estará disponible en: `http://localhost:8080`

### 3. Configurar Frontend

```bash
cd frontend/inkaquest-web

# Copiar y configurar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Ejecutar
.\run-local.ps1
# O: npm run start
```

El frontend estará disponible en: `http://localhost:4200`

---

## 🌐 Deployment en Producción

### Frontend en Vercel

```bash
cd frontend/inkaquest-web
npm install -g vercel
vercel --prod
```

Configura las variables de entorno en Vercel Dashboard:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend en Railway

```bash
cd backend/inkaquest-api
npm install -g @railway/cli
railway login
railway init
railway up
```

Configura las variables en Railway Dashboard:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `SUPABASE_JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

Ver [guía completa de deployment](docs/deployment/DEPLOYMENT-GUIDE.md)

---

## 📚 Documentación

- **[Arquitectura General](docs/arquitectura/ARQUITECTURA-GENERAL.md)**
- **[Guía de Backend](docs/backend/RESUMEN-IMPLEMENTACION.md)**
- **[Base de Datos](docs/base-de-datos/README.md)**
- **[Seguridad](docs/seguridad/MODELO-SEGURIDAD.md)**
- **[API REST](docs/backend/MATRIZ-INTEGRACION-FRONTEND-API.md)**

---

## 🔒 Seguridad

InkaQuest implementa múltiples capas de seguridad:

1. **Autenticación**: JWT ES256 con Supabase Auth
2. **Autorización**: Spring Security + Role-Based Access Control
3. **Database**: Row Level Security (RLS) en PostgreSQL
4. **Validación**: Bean Validation en todos los endpoints
5. **CORS**: Configurado restrictivamente
6. **Rate Limiting**: Protección contra ataques
7. **Logging**: Auditoría completa de acciones

---

## 📊 Módulos Implementados

- ✅ **Académico**: Cursos, Unidades, Módulos, Lecciones
- ✅ **Evaluaciones**: Tareas, Quizzes, Exámenes
- ✅ **Gamificación**: XP, Niveles, Insignias, Ranking
- ✅ **Matrículas**: Gestión de inscripciones
- ✅ **Progreso**: Tracking de avance
- ✅ **Comercio**: Pagos, Cupones, Pedidos
- ✅ **Certificados**: Emisión y verificación
- ✅ **Retos**: Desafíos de programación
- ✅ **Soporte**: Tickets y mensajería
- ✅ **Chatbot**: Asistente IA
- ✅ **Reportes**: Analytics y estadísticas
- ✅ **Auditoría**: Logs de acciones
- ✅ **Notificaciones**: Alertas en tiempo real
- ✅ **Identidad**: Gestión de usuarios

**Total: 14 módulos, 20 controladores, 80+ endpoints REST**

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **David** - *Desarrollo completo* - [GitHub](https://github.com/tu-usuario)

---

## 🙏 Agradecimientos

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Angular](https://angular.io/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Contacto

¿Preguntas? ¿Sugerencias? Abre un [issue](https://github.com/tu-usuario/InkaQuest/issues)

---

**⭐ Si te gustó este proyecto, dale una estrella en GitHub!**
