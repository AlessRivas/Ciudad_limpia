# Ciudad Limpia - Documentacion del Sistema

Fecha: 2026-03-17

Repositorio (raiz): `Ciudad_limpia-main/`

Fuentes primarias (anexos):
- `docs/fuentes/manual-modelo-2.0.pdf`
- `docs/fuentes/evidencia-final.pdf`
- `docs/fuentes/pruebas-metricas-unidad-ii.pdf`

Nota: Esta documentacion se redacta en base a la evidencia academica (PDFs) y al comportamiento real del sistema implementado en el codigo del repositorio. Cuando existe diferencia entre la teoria del documento y el codigo, se prioriza lo implementado.

## 1. Resumen ejecutivo

Ciudad Limpia es un sistema web orientado a la gestion de incidencias de recoleccion de residuos y consulta de rutas. Permite que un usuario ciudadano registre reportes (incidencias), consulte rutas de recoleccion y gestione su perfil. El rol administrador puede gestionar reportes, rutas y usuarios. El sistema utiliza Firebase para autenticacion y almacenamiento, y servicios basados en OpenStreetMap para mapa, trazado de rutas y geocodificacion.

## 2. Alcance y objetivos

### 2.1 Objetivo general

Proveer una plataforma web que facilite el registro y seguimiento basico de incidencias relacionadas con la recoleccion de residuos, asi como la consulta de rutas, centralizando la informacion y permitiendo gestion administrativa.

### 2.2 Alcance funcional (implementado)

- Autenticacion: inicio de sesion y registro de usuarios.
- Roles: usuario y administrador (segun perfil en base de datos).
- Reportes (usuario): alta de reportes ciudadanos.
- Rutas (usuario): consulta de rutas y visualizacion en mapa.
- Contacto: envio de mensajes (formulario) para contacto.
- Perfil (usuario): ver/actualizar datos, ver reportes propios, solicitar seguimiento, administrar rutas favoritas.
- Panel administrador: gestion (CRUD) de reportes, rutas, usuarios; perfil admin basico.

### 2.3 Fuera de alcance actual (no implementado o incompleto)

- Bandeja admin de mensajes de contacto (lectura/respuesta).
- Modulo admin para atender solicitudes de seguimiento (respuesta a usuario).
- Recuperacion de contrasena desde pantalla de login para usuarios.
- Edicion/eliminacion de usuarios por parte del admin (mas alla de cambio de rol).
- Historial/auditoria de cambios de reportes.

## 3. Requerimientos

Esta seccion organiza los requerimientos en formato verificable y los vincula al codigo existente.

### 3.1 Requerimientos funcionales (RF)

- RF-01 Registro de usuario: el sistema debe permitir crear una cuenta con correo y contrasena.
- RF-02 Autenticacion: el sistema debe permitir iniciar/cerrar sesion.
- RF-03 Roles: el sistema debe distinguir usuario y administrador.
- RF-04 Alta de reportes: el usuario debe registrar un reporte ciudadano con tipo, ubicacion y descripcion.
- RF-05 Consulta de rutas: el usuario debe visualizar rutas de recoleccion y consultarlas en mapa.
- RF-06 Perfil usuario: el usuario debe poder actualizar nombre, telefono y direccion.
- RF-07 Reportes del usuario: el usuario debe poder visualizar reportes propios.
- RF-08 Seguimiento (solicitud): el usuario debe poder solicitar seguimiento de un reporte.
- RF-09 Favoritos: el usuario debe poder marcar y gestionar rutas favoritas.
- RF-10 Admin reportes: el admin debe listar, filtrar, editar y eliminar reportes.
- RF-11 Admin rutas: el admin debe crear, editar y eliminar rutas.
- RF-12 Admin usuarios: el admin debe listar usuarios y cambiar el rol.
- RF-13 Contacto: el sistema debe permitir enviar un mensaje de contacto.

### 3.2 Requerimientos no funcionales (RNF)

- RNF-01 Usabilidad: interfaz responsiva y navegacion consistente (navbar comun).
- RNF-02 Seguridad: acceso a datos restringido por reglas de Firebase y autenticacion.
- RNF-03 Disponibilidad: operacion via servicios administrados (Firebase + APIs publicas).
- RNF-04 Mantenibilidad: separacion por modulos (carpetas por funcionalidad) y ES Modules.
- RNF-05 Trazabilidad: registro de operaciones principales en base de datos (RTDB/Firestore).

### 3.3 Matriz de trazabilidad (codigo)

| ID | Implementacion principal |
| --- | --- |
| RF-01 | `Login/Registro/registro.js` |
| RF-02 | `Login/login.js`, `Componentes/auth.js` |
| RF-03 | `Componentes/auth.js`, `Admin/*.js`, `Usuarios/Usuarios-perfil.js` |
| RF-04 | `Reportes/reportes.js` |
| RF-05 | `Rutas/Rutas.js`, `Rutas/Rutas.html` |
| RF-06 | `Usuarios/Usuarios-perfil.js` |
| RF-07 | `Usuarios/Usuarios-perfil.js` |
| RF-08 | `Usuarios/Usuarios-perfil.js` (crea en `seguimientoSolicitudes/`) |
| RF-09 | `Usuarios/Usuarios-perfil.js` (favoriteRoutes) |
| RF-10 | `Admin/admin-reportes.js` |
| RF-11 | `Admin/admin-rutas.js` |
| RF-12 | `Admin/admin-usuarios.js` |
| RF-13 | `Contacto/Contacto.js` |

## 4. Arquitectura

### 4.1 Tipo de arquitectura

Arquitectura web cliente-servidor con frontend estatico y servicios en la nube (Backend-as-a-Service). La logica principal se ejecuta en el navegador y consume APIs de Firebase y servicios publicos de mapas.

### 4.2 Componentes

```mermaid
flowchart LR
  U[Usuario (navegador)] -->|HTML/CSS/JS (ES Modules)| FE[Frontend Estatico]
  FE -->|Auth| FA[Firebase Authentication]
  FE -->|REST + Token| RTDB[Firebase Realtime Database]
  FE -->|SDK| FS[Firestore (mensajes_contacto)]
  FE -->|Tiles| OSM[OpenStreetMap Tiles]
  FE -->|Routing| OSRM[OSRM router.project-osrm.org]
  FE -->|Geocode| NOM[Nominatim OpenStreetMap]
```

### 4.3 Estructura del proyecto (carpetas principales)

- `Home/`: pagina de inicio.
- `Login/`: login y registro.
- `Reportes/`: modulo de reportes (usuario).
- `Rutas/`: modulo de rutas (usuario) con mapa Leaflet.
- `Usuarios/`: perfil del usuario (CRUD perfil, reportes, favoritos).
- `Admin/`: panel admin y modulos de gestion.
- `Componentes/`: navbar comun y helpers de autenticacion/contexto.
- `Contacto/`: formulario de contacto.
- `Imagenes/`: recursos estaticos (logo, icono de perfil).

## 5. Tecnologias, lenguajes y dependencias

### 5.1 Lenguajes

- HTML5
- CSS3
- JavaScript (ES Modules)

### 5.2 Servicios y APIs

- Firebase Authentication (sesiones y usuarios).
- Firebase Realtime Database (datos operativos: users, reportes, rutas, seguimiento).
- Firestore (mensajes de contacto).
- Leaflet (mapa).
- OpenStreetMap tiles (visualizacion de mapa).
- OSRM (trazado de ruta por coordenadas inicio/fin).
- Nominatim (geocodificacion direccion -> coordenadas).

### 5.3 Dependencias del repositorio

El proyecto incluye dependencia `firebase` en `package.json`. La aplicacion usa principalmente imports directos desde CDN de Firebase JS (gstatic) en los modulos del frontend.

## 6. Roles, permisos y navegacion

### 6.1 Roles

- `user`: usuario ciudadano.
- `admin`: administrador.

El rol se obtiene desde el perfil almacenado en Realtime Database en `users/{uid}.role` y se normaliza en `Componentes/auth.js`.

### 6.2 Navegacion

La barra de navegacion se renderiza dinamicamente segun sesion/rol mediante `Componentes/navbar.js`:

- Sin sesion: Inicio, Contacto, Login, Registro.
- Con sesion (user): Inicio, Reportes, Rutas, Contacto, Perfil (icono).
- Con sesion (admin): Inicio, Reportes, Rutas, Contacto, Admin, Perfil (icono a perfil admin).

## 7. Modulos y flujos funcionales

### 7.1 Registro e inicio de sesion

Pantallas:
- `Login/login.html` + `Login/login.js`
- `Login/Registro/registro.html` + `Login/Registro/registro.js`

Flujo:
- Registro crea cuenta en Firebase Auth y guarda perfil inicial en RTDB: `users/{uid}` con `role: "user"`.
- Login autentica y redirige a `Home/inicio.html` o `Admin/admin.html` segun rol.

### 7.2 Reportes (usuario)

Pantalla:
- `Reportes/reportes.html` + `Reportes/reportes.js`

Flujo:
- Usuario autenticado crea un reporte (POST) en `reportes/`.
- Se guardan campos: tipo, ubicacion, descripcion, estado, fecha y vinculos a usuario (uid/email).

### 7.3 Rutas (usuario) con mapa y trazado

Pantalla:
- `Rutas/Rutas.html` + `Rutas/Rutas.js` + `Rutas/Rutas.css`

Flujo:
- Se cargan rutas desde `rutas/` y se muestran en lista y mapa.
- Al seleccionar una ruta, se traza el recorrido (inicio -> fin) via OSRM si existen coordenadas.

### 7.4 Contacto

Pantalla:
- `Contacto/Contacto.html` + `Contacto/Contacto.js`

Flujo:
- Guarda un documento en Firestore (coleccion `mensajes_contacto`) con datos del formulario y el contexto del usuario (uid/rol si existe).

### 7.5 Perfil (usuario)

Pantalla:
- `Usuarios/Usuarios-perfil.html` + `Usuarios/Usuarios-perfil.js` + `Usuarios/Usuarios-perfil.css`

Flujo:
- Muestra informacion basica (nombre, correo, telefono, direccion).
- Permite actualizar nombre/telefono/direccion en `users/{uid}`.
- Lista reportes del usuario (filtrando por `usuarioUid`) y permite solicitar seguimiento (crea registro en `seguimientoSolicitudes/`).
- Permite administrar rutas favoritas guardadas en `users/{uid}/favoriteRoutes`.

### 7.6 Panel administrador

Pantallas:
- `Admin/admin.html` + `Admin/admin.js` (landing)
- `Admin/admin-reportes.html` + `Admin/admin-reportes.js` (CRUD reportes)
- `Admin/admin-rutas.html` + `Admin/admin-rutas.js` (CRUD rutas + geocodificacion)
- `Admin/admin-usuarios.html` + `Admin/admin-usuarios.js` (listar + cambio de rol)
- `Admin/admin-perfil.html` + `Admin/admin-perfil.js` (perfil admin y reset password)

Acceso:
- Cada modulo verifica sesion y rol `admin`. Si no corresponde, redirige.

## 8. Modelo de datos (Realtime Database y Firestore)

### 8.1 Realtime Database (RTDB)

Raiz RTDB configurada en `firebase-config.js`:
- `firebaseConfig.databaseURL`

#### 7.1.1 `users/{uid}`

Ejemplo (registro):
```json
{
  "name": "Nombre Apellido",
  "phone": "6180000000",
  "address": "",
  "email": "correo@ejemplo.com",
  "role": "user",
  "favoriteRoutes": {},
  "createdAt": "2026-03-17T00:00:00.000Z"
}
```

Notas:
- El rol se usa para navegacion y autorizacion de pantallas admin.
- `favoriteRoutes` se modela como diccionario por `routeId`.

#### 7.1.2 `reportes/{reporteId}`

Ejemplo:
```json
{
  "usuario": "Juan Perez",
  "usuarioUid": "UID_DEL_USUARIO",
  "usuarioEmail": "correo@ejemplo.com",
  "tipo": "Camion no paso",
  "ubicacion": "Col. Centro, Calle Juarez #123",
  "descripcion": "Detalle del problema",
  "estado": "Pendiente",
  "fecha": "17/03/2026, 10:30:00"
}
```

#### 7.1.3 `rutas/{rutaId}`

Ejemplo:
```json
{
  "nombre": "Ruta Centro",
  "zona": "Centro",
  "dia": "Lunes",
  "hora": "14:30",
  "creada": "2026-03-17T00:00:00.000Z",
  "startAddress": "Direccion inicio (opcional)",
  "endAddress": "Direccion fin (opcional)",
  "startLat": 24.0277,
  "startLng": -104.6532,
  "endLat": 24.0400,
  "endLng": -104.6800
}
```

#### 7.1.4 `seguimientoSolicitudes/{uid_reporteId}`

Ejemplo:
```json
{
  "reporteId": "ID_REPORTE",
  "usuarioUid": "UID_DEL_USUARIO",
  "usuarioEmail": "correo@ejemplo.com",
  "usuarioNombre": "Nombre Apellido",
  "pregunta": "Solicito informacion sobre el seguimiento de mi reporte.",
  "estadoSolicitud": "Pendiente",
  "respuesta": "",
  "fechaSolicitud": "2026-03-17T00:00:00.000Z",
  "reporteTipo": "Camion no paso",
  "reporteEstado": "Pendiente",
  "reporteFecha": "17/03/2026, 10:30:00"
}
```

### 8.2 Firestore

Coleccion:
- `mensajes_contacto`

Ejemplo:
```json
{
  "tipo": "Sugerencia",
  "email": "correo@ejemplo.com",
  "asunto": "Asunto",
  "mensaje": "Contenido",
  "fechaISO": "2026-03-17T00:00:00.000Z",
  "fechaTexto": "17/03/2026, 10:30:00",
  "usuarioUid": "UID_DEL_USUARIO (o null)",
  "usuarioRol": "user"
}
```

## 9. Integracion de mapa (sin Google)

### 9.1 Libreria de mapa

Leaflet se usa en `Rutas/Rutas.html` para renderizar el mapa.

### 9.2 Trazado de ruta (OSRM)

Al seleccionar una ruta, si existen coordenadas completas, se consulta:
- `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`

El resultado se dibuja como polyline (GeoJSON).

### 9.3 Geocodificacion (Nominatim)

En `Admin/admin-rutas.html` el admin puede escribir direccion y obtener coordenadas via:
- `https://nominatim.openstreetmap.org/search?format=json&q=...&limit=1&countrycodes=mx`

Nota operativa:
- Nominatim y OSRM publicos tienen limites de uso y no garantizan SLA. Para produccion se recomienda un proveedor con API Key (por ejemplo, OpenRouteService o LocationIQ).

## 10. Seguridad y control de acceso

### 10.1 Autorizacion en UI

Los modulos admin realizan verificacion del rol en cliente y redirigen si el rol no es `admin`. Esto es necesario para UX, pero no es suficiente para seguridad por si solo.

### 10.2 Acceso a RTDB con token

El helper `fetchWithAuth` en `Componentes/auth.js` agrega el token del usuario como query param `auth=` a la URL de RTDB. Para que esto funcione de forma segura, las reglas de Realtime Database deben validar `auth != null` y, cuando aplique, el `auth.uid`.

## 11. Instalacion y ejecucion (desarrollo)

Requisitos:
- Navegador moderno (Chrome/Edge).
- Servidor estatico local (por ejemplo, VS Code Live Server) para abrir las paginas con imports ES Modules.

Ejecucion:
- Abrir `Home/inicio.html` con Live Server.
- Para flujos autenticados, iniciar sesion en `Login/login.html`.

Configuracion:
- Credenciales Firebase estan en `firebase-config.js`. Para un fork del proyecto, reemplazar por las del proyecto Firebase propio.

## 12. Pruebas, validacion y metricas

### 12.1 Evidencia de pruebas (documento)

Las pruebas ejecutadas y sus resultados se documentan en:
- `docs/fuentes/pruebas-metricas-unidad-ii.pdf`

### 12.2 Estrategia de validacion (estado actual)

El repositorio no contiene pruebas automatizadas. La validacion se realiza mediante pruebas manuales por flujo (smoke tests) y verificacion cruzada en base de datos:

- Auth: registro, login, redireccion por rol, logout.
- Reportes: crear reporte y verificar aparicion en `reportes/` y en panel admin.
- Admin reportes: listar, filtrar, editar estado, eliminar.
- Rutas: crear/editar ruta, geocodificar direccion a coordenadas, trazar ruta en mapa.
- Perfil usuario: actualizar datos, ver reportes propios, solicitar seguimiento, favoritos.
- Contacto: enviar mensaje y verificar documento en Firestore `mensajes_contacto`.

### 12.3 Metricas basicas del repositorio (sin `node_modules/`)

Conteo de artefactos (al 2026-03-17):
- HTML: 12 archivos, 878 lineas.
- CSS: 10 archivos, 2041 lineas.
- JS: 17 archivos, 2062 lineas.

Nota: estas metricas son de tamano y no sustituyen metricas de calidad (cobertura, defectos, complejidad) cuando no hay suite automatizada.

## 13. Glosario

- RTDB: Firebase Realtime Database.
- UID: identificador unico de usuario (Firebase Auth).
- OSRM: Open Source Routing Machine (servicio de rutas).
- Nominatim: servicio de geocodificacion de OpenStreetMap.

## 14. Anexos

- Manual/Modelo: `docs/fuentes/manual-modelo-2.0.pdf`
- Evidencia final: `docs/fuentes/evidencia-final.pdf`
- Pruebas y metricas: `docs/fuentes/pruebas-metricas-unidad-ii.pdf`
- Extraccion best-effort (para apoyo de redaccion): `scripts/extract-pdf-text.js`
