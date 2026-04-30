# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar el package.json, yarn.lock y package-lock.json
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

# Copiar todo el código fuente
COPY . .

# Construir el proyecto
RUN npm run build

# 2. Serve stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

# Copiar los archivos generados desde el contenedor de build
COPY --from=builder /app/dist /app

EXPOSE 3000

# Servir la aplicación
CMD ["serve", "-s", ".", "-l", "3000", "--single"]
