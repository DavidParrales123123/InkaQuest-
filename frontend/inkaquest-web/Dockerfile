# Usar imagen base de Node
FROM node:22-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar todo el codigo
COPY . .

# Construir la aplicacion
RUN npm run build

# Etapa de produccion
FROM node:22-alpine

WORKDIR /app

# Instalar serve
RUN npm install -g serve

# Copiar el build desde la etapa anterior
COPY --from=builder /app/dist/inkaquest-web/browser ./dist

# Exponer puerto
EXPOSE 8080

# Comando para iniciar
CMD [\"serve\", \"dist\", \"-s\", \"-l\", \"8080\"]