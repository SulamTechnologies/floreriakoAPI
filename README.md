# Floreria KO — API

API REST del sistema de comercio electronico de Floreria KO. Este repositorio contiene exclusivamente el servidor backend: una aplicacion Next.js 14 configurada en modo API-only, sin renderizado de paginas, que expone endpoints consumidos por el cliente web del repositorio `floreriako`.

---

## Descripcion general

El backend gestiona la logica de negocio del sistema: consulta y filtracion del catalogo de productos, administracion del carrito de compras por usuario, procesamiento de pagos mediante Stripe y verificacion de identidad a traves de los tokens JWT emitidos por Supabase. Todos los datos se almacenan en una base de datos PostgreSQL alojada en Supabase, con politicas de Row Level Security activas en todas las tablas.

---

## Stack tecnologico

| Capa          | Tecnologia                             |
| ------------- | -------------------------------------- |
| Framework     | Next.js 14 (App Router, API-only)      |
| Lenguaje      | TypeScript 6 (strict)                  |
| Base de datos | PostgreSQL via Supabase                |
| Autenticacion | Supabase Auth — verificacion JWT local |
| Pagos         | Stripe                                 |
| Validacion    | Zod                                    |
| Despliegue    | Vercel (output: standalone)            |

---

## Estructura del proyecto

```
src/
  app/
    api/
      health/        # GET /api/health — verificacion de estado
      products/      # GET /api/products, GET /api/products/:slug
      cart/          # GET y POST /api/cart
        items/[id]/  # PATCH y DELETE /api/cart/items/:id
        merge/       # POST /api/cart/merge — fusion de carrito invitado
  domain/
    products.ts      # Logica de consulta y mapeo de productos
    cart.ts          # Logica de carrito: crear, leer, actualizar, eliminar, fusionar
  lib/
    cors.ts          # Headers CORS y handler OPTIONS por ruta
    errors.ts        # Clase ApiError y wrapper withErrorHandling
    supabase/
      server.ts      # Cliente Supabase con service_role key
      auth.ts        # Verificacion de JWT y extraccion de usuario
    validation/
      schemas.ts     # Esquemas Zod reutilizables
  types/
    api.ts           # DTOs de respuesta compartidos con el frontend
    supabase.ts      # Tipos de base de datos
```

---

## Endpoints disponibles

| Metodo | Ruta                | Descripcion                                 | Auth requerida |
| ------ | ------------------- | ------------------------------------------- | -------------- |
| GET    | /api/health         | Estado del servidor                         | No             |
| GET    | /api/products       | Listado paginado con filtros                | No             |
| GET    | /api/products/:slug | Detalle de producto                         | No             |
| GET    | /api/cart           | Carrito del usuario autenticado             | Si             |
| POST   | /api/cart           | Agregar producto al carrito                 | Si             |
| PATCH  | /api/cart/items/:id | Actualizar cantidad de un item              | Si             |
| DELETE | /api/cart/items/:id | Eliminar item del carrito                   | Si             |
| POST   | /api/cart/merge     | Fusionar carrito invitado al iniciar sesion | Si             |

---
