# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar el package.json, yarn.lock y package-lock.json
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

# Copiar todo el código fuente
COPY . .

# Aquí se inyecta la variable de entorno antes de la construcción
ARG VITE_MP_PUBLIC_KEY
ENV VITE_MP_PUBLIC_KEY=${VITE_MP_PUBLIC_KEY}

RUN echo "VITE_MP_PUBLIC_KEY=${VITE_MP_PUBLIC_KEY}"

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
