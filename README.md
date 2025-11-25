# Parcial III --- Sistema de Chat en Tiempo Real

Este módulo implementa la **base completa del backend** para un sistema
de chat en tiempo real. Incluye autenticación segura, gestión de salas,
historial de mensajes, validaciones robustas y endpoints adicionales
diseñados para facilitar integraciones posteriores.

------------------------------------------------------------------------

## Funcionalidades implementadas

### Autenticación

-   Registro de usuarios con contraseñas cifradas mediante `bcryptjs`.
-   Inicio de sesión mediante JWT.
-   Middleware de autorización para rutas protegidas.

### Gestión de salas

-   Creación de salas públicas y privadas.
-   Unión a salas existentes.
-   Validaciones incorporadas:
    -   Longitudes mínimas requeridas.
    -   Evitar duplicados de nombres.
    -   Contraseña obligatoria en salas privadas.
    -   Verificación de membresía para acceso a información.

### Historial de mensajes

-   Paginación real.
-   Ordenamiento por fecha.
-   Acceso restringido en salas privadas a miembros autorizados.

### Endpoints adicionales

-   **GET /rooms** --- Lista todas las salas creadas.
-   **POST /rooms/:id/messages** --- Envía mensajes vía REST (útil para
    pruebas previas a WebSockets).

### Herramientas de pruebas

-   Colección Postman con variables listas.
-   Logger profesional basado en Pino.
-   Configuración para Jest + Supertest con base de datos de testing.

------------------------------------------------------------------------

## Tecnologías principales

-   Node.js + Express\
-   PostgreSQL\
-   Docker y Docker Compose\
-   JWT\
-   bcryptjs\
-   HTML + JavaScript sencillo (para validación)\
-   Pino (logging estructurado)

------------------------------------------------------------------------

## Estructura del proyecto

    Parcial3/
    ├─ backend/
    │  ├─ index.js
    │  ├─ db.js
    │  ├─ .env
    │  ├─ .env.test
    │  ├─ logger.js
    │  ├─ routes/
    │  │  ├─ auth.js
    │  │  ├─ rooms.js
    │  │  └─ authMiddleware.js
    │  ├─ tests/
    │  │  ├─ setup.js
    │  │  └─ auth.test.js
    │  └─ db/
    │     └─ create_tables.sql
    ├─ frontend/
    │  └─ index.html
    ├─ postman/
    │  └─ parcial3_postman_collection.json
    └─ docker-compose.yml

------------------------------------------------------------------------

## Ejecución del proyecto

### Requisitos previos

-   Docker\
-   Docker Compose

### Iniciar los servicios

Desde la raíz del proyecto ejecutar:

    docker-compose up --build

Servicios levantados:

  Servicio   Descripción
  ---------- ----------------------------------------------
  **db**     PostgreSQL con migraciones ejecutadas
  **app**    API REST disponible en http://localhost:4000
  **frontend** Proyecto hecho en Vite disponible en http://localhost:5173

Cuando aparezca:

    Server listening on port 4000

La API está en funcionamiento.

------------------------------------------------------------------------

## Endpoints principales

### POST /auth/register

Registro de nuevos usuarios.\
Body:

``` json
{
  "username": "user",
  "password": "1234"
}
```

### POST /auth/login

Autenticación y retorno del token JWT.\
Body:

``` json
{
  "username": "user",
  "password": "1234"
}
```

Respuesta:

``` json
{ "token": "xxxxx.yyyyy.zzzzz" }
```

### POST /rooms/create

Creación de salas públicas o privadas.\
Headers:

    Authorization: Bearer <token>

Body:

``` json
{
  "name": "sala1",
  "is_private": false
}
```

### POST /rooms/join

Unirse a una sala existente.\
Body:

``` json
{
  "room_id": 1
}
```

### GET /rooms

Obtiene la lista completa de salas creadas.

### POST /rooms/:id/messages

Permite enviar mensajes vía REST (para pruebas sin WebSockets).

### GET /rooms/:id/history?page=1&page_size=20

Consulta del historial paginado de mensajes en una sala.

------------------------------------------------------------------------

## Pruebas con Postman

Ubicación: `/postman/parcial3_postman_collection.json`

Pasos:

1.  Abrir Postman.\
2.  Importar la colección.\
3.  Ejecutar el login.\
4.  El token se asigna automáticamente a `{{token}}`.

------------------------------------------------------------------------

## Frontend básico

Archivo: `frontend/index.html`

Incluye funcionalidades de prueba:

-   Registro\
-   Inicio de sesión\
-   Creación de salas\
-   Unión a salas\
-   Consulta del historial

Se abre directamente dando doble clic.

------------------------------------------------------------------------

## Integraciones

### Backend en tiempo real (WebSockets + Broker)

Se integró sobre:

-   Autenticación ya lista\
-   Salas y membresías funcionales\
-   Historial operativo\
-   Endpoint REST de mensajes como respaldo

### Frontend definitivo

Utilizó:

-   Login real\
-   Listado de salas\
-   Unión a salas\
-   Historial\
-   WebSockets agregados en la fase posterior

------------------------------------------------------------------------

## Notas finales

-   El backend es completamente funcional por sí mismo.\
-   Las validaciones y estructura cumplen estándares profesionales.\
-   Para todas las peticiones protegidas, usar:

```{=html}
<!-- -->
```
Authorization: Bearer <token>
