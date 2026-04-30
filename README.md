## Mockups de JSON — Estructuras esperadas

Este archivo incluye ejemplos (mockups) de JSON que puedo necesitar para diferentes partes del flujo: variables de entorno, parámetros de CI/Docker, payloads HTTP y la estructura de los objetos que guardamos en almacenamiento.

Si alguna estructura no encaja con lo que tienes en mente, dímelo y lo ajusto.

### 1) Variables de entorno (archivo `.env` / objeto)
Descripción: pares clave/valor que la aplicación lee en runtime o en build. No se deben commitear.

```json
{
  "NEXT_PUBLIC_BASE_PATH": "/mp-test",
  "PORT": "3000",
  "NODE_ENV": "production",
  "API_URL": "https://api.example.com",
  "SOME_FEATURE_FLAG": "true"
}
```

### 2) Parámetros de CI / Jenkins (objeto de entrada para pipeline)
Descripción: valores que Jenkins inyecta al build (ejemplo).

```json
{
  "DOCKER_TAG": "nextjs-mp-test",
  "PORT": "3000",
  "BASE_PATH": "/mp-test",
  "IMAGE_VERSION": "1.0"
}
```

### 3) Build args (JSON que se pasa al `docker build --build-arg`)

```json
{
  "BASE_PATH": "/mp-test",
  "NEXT_PUBLIC_BASE_PATH": "/mp-test"
}
```

### 4) API: Envío de código (request)
Descripción: payload simple que la SPA o un cliente pueden enviar para almacenar/mostrar código.

```json
{
  "code": "console.log(\"Hello world\")",
  "language": "javascript",
  "meta": {
    "source": "share-link",
    "author": "user123"
  }
}
```

### 5) API: Respuesta de éxito al crear/guardar código

```json
{
  "ok": true,
  "id": "abc123",
  "shortUrl": "/mp-test?p=abc123",
  "createdAt": "2026-04-30T12:34:56Z"
}
```

### 6) API: Respuesta de error

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "El campo 'code' es obligatorio"
  }
}
```

### 7) Objeto de almacenamiento (DB / storage)
Descripción: la forma en que podríamos guardar un snippet en una base de datos o almacenamiento.

```json
{
  "id": "abc123",
  "code": "console.log(\"Hello world\")",
  "language": "javascript",
  "meta": {
    "author": "user123",
    "tags": ["example","test"]
  },
  "createdAt": "2026-04-30T12:34:56Z",
  "expiresAt": null
}
```

---

Notas rápidas:
- Si tu flow no usa una API y solo lees `?code=...` en la URL, el payload mínimo es el JSON del punto 4 (sólo la propiedad `code`).
- Para CI/CD usamos el objeto del punto 2. Puedo adaptar el `Jenkinsfile` si quieres leer un JSON externo o parametrizar más campos.
- Dime si prefieres que genere un `examples/` con archivos `.json` separados en vez de tener todo en el `README.md`.
