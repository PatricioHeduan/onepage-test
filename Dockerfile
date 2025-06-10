# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_MP_PUBLIC_KEY
ENV VITE_MP_PUBLIC_KEY=${VITE_MP_PUBLIC_KEY}

RUN echo "VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY" > .env

# Construir el proyecto
RUN npm run build

# 2. Serve stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist /app

EXPOSE 3000

CMD ["serve", "-s", ".", "-l", "3000", "--single"]
