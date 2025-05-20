# Stage 1: Build the Next.js app
FROM node:18 AS builder
WORKDIR /app
COPY . .
ARG BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
RUN npm install
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html/mp-test
COPY --from=builder /app/public /usr/share/nginx/html/mp-test

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]