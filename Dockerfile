# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# 2. Serve stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist /app

EXPOSE 3000

# Servimos desde el root (/) y Nginx lo montará en /live-vote/
CMD ["serve", "-s", ".", "-l", "3000", "--single"]
