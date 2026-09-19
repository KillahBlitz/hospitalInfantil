---
title: Backend — Hallazgos, deuda técnica y riesgos
tags: [backend, hallazgos, deuda-tecnica, seguridad, riesgos]
updated: 2026-09-18
---

# Hallazgos, deuda técnica y riesgos

**34 hallazgos** verificados contra el código del 2026-09-18, ordenados por severidad. Cada uno con **archivo:línea** e **impacto concreto**. No hay evidencia de explotación ni de datos corruptos: son consecuencias deducidas del código leído. **No se ejecutaron pruebas contra la base ni intentos contra cuentas.**

Equivalentes en las otras bóvedas: [[db-findings]] y [[fe-findings]].

## Resumen por severidad

| Severidad | Cantidad | Temas |
| --- | --- | --- |
| **Crítica** | 4 | Toma de cuenta, exposición de datos personales (×2), borrado físico disfrazado de baja |
| **Alta** | 8 | Duplicados en registro, bloqueo administrativo, módulo `1` fijo, auto-modificación, Swagger en producción, puertos desalineados, sin auditoría, `.dockerignore` ausente |
| **Media** | 13 | Validación, transacciones, errores, CI/CD, sesiones |
| **Baja** | 9 | Código muerto, typos, inconsistencias de estilo |

---

## Críticos

### C1 · Cambio de contraseña sin ninguna prueba de titularidad
**Ubicación:** `Backend/Controllers/AuthController.cs:38-44`, `Backend/Handlers/AuthHandler.cs:73-83`, `Backend/Models/Repositories/UserAccessRepository.cs:204-216`

`POST /Auth/changePassword` es **anónimo** y solo necesita `{email, password}`. No exige token, ni contraseña anterior, ni código enviado por correo, ni filtra `Activo`.

**Impacto:** **toma de cualquier cuenta** conociendo solo su correo. Y los correos se obtienen sin autenticarse mediante `GET /Platform/Users` (hallazgo C2). La cadena C2 → C1 permite tomar la cuenta de un administrador y, desde ahí, aprobar usuarios, borrar cuentas y reescribir permisos.

**Corrección:** exigir `[Authorize]` para "cambiar mi contraseña" (con verificación de la contraseña actual) y/o implementar recuperación con token de un solo uso enviado al correo.

### C2 · `GET /Platform/Users` expone datos personales de todo el personal sin autenticación
**Ubicación:** `Backend/Controllers/PlatformControler.cs:24-29`

La acción **no tiene `[Authorize]`** mientras las cinco acciones nuevas del mismo archivo sí lo tienen.

**Impacto:** cualquiera con acceso de red a la API obtiene, de todos los usuarios: nombre completo, correo, **fecha de nacimiento**, **sexo**, alias, `tipoId` y `activo`. Es una filtración de datos personales sensibles en un contexto hospitalario.

**Corrección:** `[Authorize]` + comprobación de permiso de lectura sobre el módulo de cuentas.

### C3 · `GET /Platform/UserRequest` expone las solicitudes sin autenticación
**Ubicación:** `Backend/Controllers/PlatformControler.cs:31-39`

Mismos datos personales de todos los solicitantes, **más el `comentario` administrativo interno** (`Models/Response/Platform/UsersRequestResponse.cs:26`).

**Impacto:** además de la filtración, revela notas internas del proceso de aprobación. La rama `if (response is null) return Unauthorized(...)` de `:36-37` **no autentica a nadie** y es inalcanzable.

### C4 · "Desactivar" borra físicamente al usuario
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs:198-199`

```csharp
_context.Usuarios.Remove(usuario);
await _context.SaveChangesAsync(cancellationToken);
```

El endpoint se llama `deactivate`, el enum `UserDeactivationStatus`, el mensaje dice "dado de baja", pero la fila de `Usuarios` **se elimina**. Antes se copian los datos (incluido el hash) a `SolicitudUsuarios` y se borran las filas de `UsuarioModuloPermisos` (`:192-196`).

**Impacto:**
1. La columna `Usuario.Activo` **no se usa nunca para desactivar**: `GET /Platform/Users` devolverá casi siempre `activo: true`, y la lógica del SPA que deshabilita "Desactivar" para inactivos es inalcanzable en la práctica.
2. Se pierden el `Id`, la historia y toda posible referencia futura al usuario. Cualquier tabla futura con FK a `Usuarios` se rompería.
3. El hash de contraseña queda duplicado en `SolicitudUsuarios`; reaprobar la solicitud "revive" la cuenta con un **`Id` nuevo**.
4. Se **sobrescribe el comentario** de una solicitud coincidente con el texto fijo de `:188`.
5. Sin auditoría: no queda registro de quién ejecutó la baja.

**Corrección:** implementar el *soft delete* que el nombre promete (`Activo = false`), y decidir por separado si se desea mover la cuenta a solicitudes.

---

## Altos

### A1 · Detección de duplicados roto en el registro
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs:25-36`

```csharp
var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Alias == alias && u.Correo == correo);  // ignorado
var usuarioPeticion = await _context.SolicitudUsuarios.FirstOrDefaultAsync(u => u.Username == alias || u.Correo == correo);
if (usuarioPeticion != null || usuarioPeticion != null)   // condición duplicada
```

Dos errores: la variable `usuario` **nunca se usa**, y la primera consulta usaría `&&` donde debería `||`.

**Impacto:** se acepta una solicitud con el alias o el correo de un usuario **ya existente**. El usuario final ve "registro exitoso", pero al intentar aprobarla `ApproveUserTransactionAsync:253-256` devuelve `conflict` y la solicitud queda bloqueada para siempre. El compilador no avisa (`dotnet build`: 0 advertencias).

### A2 · Un `PUT` puede dejar el sistema sin administradores
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs:326`

`UpdateUserPermissionsTransactionAsync` hace `RemoveRange` de **todos** los permisos y escribe los enviados. `PUT /Platform/Users/Permissions` con `permisos: []` sobre el último usuario con `editar` en el módulo 1 **inhabilita permanentemente** la aprobación, la baja y la administración de permisos por API.

**Impacto:** bloqueo administrativo irrecuperable sin `INSERT` manual en SQL Server.

**Corrección:** invariante que exija conservar al menos un titular de `editar` en el módulo de cuentas.

### A3 · El actor puede modificarse a sí mismo
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs:308-349` y `:141-202`

No existe comprobación `userId != actorId` en `UpdateUserPermissionsTransactionAsync` ni en `DeactivateUser`.

**Impacto:** un usuario con `editar` en el módulo 1 puede cambiar su propio `TipoId`, quitarse o darse permisos y **borrarse a sí mismo**. Combinado con A2, un solo error de operación deja el sistema sin administración.

### A4 · La autorización depende del literal `ModuloId == 1`
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs:151`, `:222`, `:241`, `:312`

El número de módulo está escrito a mano cuatro veces, sincronizado a mano con el `MODULE_REGISTRY` **del frontend** (ver [[fe-templates-areas-modules]]).

**Impacto:** si `acceso_usuario.Modulos.Id = 1` deja de ser "Configuración de cuentas" (recreación de catálogos, restauración de respaldo, alta en otro orden), la autorización apunta a un módulo equivocado: en el mejor caso todos reciben `403`; en el peor, **quien tenga `editar` en el nuevo módulo 1 obtiene privilegios de administrador**. Detalle en [[be-authorization-permissions]].

### A5 · Swagger y OpenAPI publicados también en producción
**Ubicación:** `Backend/Program.cs:54-60`

```csharp
//if (app.Environment.IsDevelopment())
//{
app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();
//}
```

**Impacto:** `/swagger`, `/swagger/v1/swagger.json` y `/openapi/v1.json` quedan públicos en el entorno de `main`, publicando el inventario completo de rutas y esquemas —incluidos los endpoints anónimos de C1-C3— a cualquier visitante.

### A6 · Puerto de escucha desalineado con el mapeo de Compose
**Ubicación:** `Backend/Dockerfile:14`, `Backend/docker-compose.yml:9`; ausencia de variable de puerto en `Backend/.env`

Compose publica host → **`5000`**; el `Dockerfile` declara `EXPOSE 5000` (que no configura nada). **[inferencia de alta confianza]** la imagen `aspnet:10.0` escucha en **8080** salvo que se defina `ASPNETCORE_HTTP_PORTS`/`ASPNETCORE_URLS`, y ninguna de las cuatro variables de `.env` lo hace.

**Impacto:** el despliegue solo funciona si el `.env` del runner —no versionado ni documentado— fija el puerto. Ante un fallo de conexión, revisar esto **antes** de CORS o SQL. Ver [[be-deployment]] §1.3.

### A7 · Ninguna operación deja auditoría
**Ubicación:** `Backend/Models/Repositories/UserAccessRepository.cs` completo; `Backend/Data/UserAccessDbContext.cs` completo

El `actorId` se usa para autorizar y se descarta. No hay columnas ni tablas de auditoría, ni interceptores de `SaveChanges`. `ILogger` solo registra **errores** (`PlatformControler.cs:70,96,128,147,174`).

**Impacto:** es imposible saber quién aprobó a un usuario, quién lo borró, quién cambió permisos ni cuándo. Inaceptable para un sistema de control de accesos hospitalario.

### A8 · Sin `.dockerignore`: el `.env` entra en el contexto de build
**Ubicación:** ausencia de `Backend/.dockerignore`; `Backend/Dockerfile:4` (`COPY . .`)

**Impacto:** la cadena de conexión queda en una capa de la etapa `build`, que persiste en la caché del builder del runner self-hosted. También se copian `bin/` y `obj/`, inflando el contexto y anulando la caché de capas.

---

## Medios

### M1 · `DateOnly.ParseExact` sin protección → 500
`Backend/Handlers/AuthHandler.cs:61`. Cualquier `birthDate` que no sea `yyyy-MM-dd` lanza `FormatException` no capturada. **Impacto:** `500` en lugar de `400` en un endpoint público. Usar `TryParseExact`.

### M2 · Ningún DTO declara las longitudes de SQL
`Backend/Models/Request/UserAccess/RegisterRequest.cs` y el resto: solo `[Required]`. Las columnas son `varchar(30)`, `varchar(20)`, `varchar(10)`, `varchar(1)`, `nvarchar(100)`. El formulario React admite más caracteres. **Impacto:** un registro válido en pantalla produce `DbUpdateException` → **500**. Añadir `[StringLength]`.

### M3 · A `RegisterRequest.email` le falta `[EmailAddress]`
`Backend/Models/Request/UserAccess/RegisterRequest.cs:18-19`, mientras `ChangePasswordRequest.cs:8-10` sí lo tiene. **Impacto:** se admiten solicitudes con correos inválidos que nunca podrán contactarse.

### M4 · `AuthController` sin ningún `try/catch` ni middleware de errores
`Backend/Controllers/AuthController.cs` completo; `Program.cs` sin `UseExceptionHandler`. **Impacto:** toda excepción de EF, SQL o BCrypt en los 7 endpoints de `/Auth` sale como `500` genérico, sin log propio y sin cuerpo útil.

### M5 · Cinco comprobaciones `is null` muertas en `AuthController`
`AuthController.cs:33,51,61,71,81`. Los handlers nunca devuelven `null`. **Impacto:** falsa sensación de manejo de errores; el `400` "Error al obtener…" nunca se emite.

### M6 · `BCrypt.Verify` puede lanzar con un hash corrupto
`Backend/Handlers/AuthHandler.cs:25`. Si `PasswordHash` no es un hash BCrypt válido (dato migrado a mano, columna truncada), `SaltParseException` no capturada. **Impacto:** `500` en el login en lugar de `401`.

### M7 · Violación de FK no traducida en `UpdateUserPermissions`
`Backend/Controllers/PlatformControler.cs:172-176` captura solo `Exception` → `500`. El hermano `ApproveUser` sí traduce el `547` (`:122-125`). **Impacto:** enviar un `moduloId`, `permisoId` o `tipoId` inexistente da `500` en un caso y `409` en el otro.

### M8 · El `409` de aprobación miente sobre la causa
`Backend/Controllers/PlatformControler.cs:122-124`: el filtro incluye el `547` (FK) pero el mensaje habla de *"conflicto con registros únicos"*. **Impacto:** diagnóstico erróneo; el operador busca un duplicado que no existe.

### M9 · Aislamiento transaccional inconsistente y permiso comprobado fuera
`UserAccessRepository.cs:145` usa `Serializable`; `:245` y `:316` usan el aislamiento por defecto. Además el chequeo de permiso está **dentro** de la transacción en `:149` pero **fuera** en `:239` y `:310`. **Impacto [inferencia]:** dos aprobaciones concurrentes de la misma solicitud pueden pasar ambos chequeos; la integridad depende del índice único, no de la lógica. Ventana breve para operar con un permiso recién revocado.

### M10 · `GetAccess` no filtra módulos ni áreas inactivos
`Backend/Models/Repositories/UserAccessRepository.cs:61-83`, mientras `GetAreas`/`GetModulos` sí filtran `Activo`. **Impacto:** el JSON de login contiene módulos apagados que no aparecen en los catálogos; el SPA muestra una pestaña con nombre indefinido. Ver [[fe-templates-areas-modules]].

### M11 · `GET /Auth/userTypes` puede lanzar por claves duplicadas
`Backend/Handlers/AuthHandler.cs:91` hace `Add(t.NivelUsuario, t.Id)` y `UserAccessDbContext.cs:105-113` **no declara índice único** sobre `NivelUsuario`. **Impacto:** dos tipos con el mismo nombre → `ArgumentException` → `500` en un catálogo público.

### M12 · Listados sin paginación que mueven todos los hashes
`UserAccessRepository.cs:124-129` y `:131-139`. `SELECT *` de las tablas completas, incluido `PasswordHash`, que el DTO descarta después. `GetAllUsersRequest` además sin `AsNoTracking`. **Impacto:** memoria y ancho de banda crecen con la plantilla; el filtrado ocurre en el navegador.

### M13 · Cada despliegue invalida todas las sesiones
`Backend/docker-compose.yml` sin volumen para las claves de Data Protection + el pipeline recrea el contenedor en cada push. **[inferencia de alta confianza]** anillo de claves nuevo → todos los bearer tokens dejan de validar. **Impacto:** todos los usuarios ven "sesión expirada" tras cada despliegue; además impide escalar a más de una réplica. Ver [[be-auth-session]] §3.1.

---

## Bajos

### B1 · `GET /Platform/Users/{id}/Permissions` sin comprobación de permiso
`PlatformControler.cs:133-150`: lleva `[Authorize]` pero ninguna verificación de módulo. Cualquier usuario autenticado lee los permisos y el `TipoId` de cualquier otro. *(Bajo solo por la sensibilidad limitada del dato; el patrón es incorrecto.)*

### B2 · `DeactivateUserResponse` reutilizado para tres operaciones
`Backend/Models/Response/Platform/DeactivateUserResponse.cs`, usado en `PlatformHandler.cs:39,97,151`. **Impacto:** el esquema OpenAPI de aprobar y de actualizar permisos se llama "DeactivateUserResponse"; los clientes generados salen con nombres engañosos.

### B3 · Códigos de resultado como `string` mágicos
`UserAccessRepository.cs:236-349` devuelve `"success"`/`"not_found"`/`"conflict"`; `DeactivateUser` usa un `enum`. Los `switch` del controller mandan **cualquier valor desconocido a `403`** (`PlatformControler.cs:57`, `:119`, `:169`). **Impacto:** un typo se manifiesta como "No tienes permiso".

### B4 · Typo persistido en la base: `"usario previamente registrado"`
`Backend/Models/Repositories/UserAccessRepository.cs:188`. Se escribe en `SolicitudUsuarios.comentario` y **sobrescribe** el comentario previo.

### B5 · `UpdateCommentRequest` sin ninguna validación
`Backend/Models/Request/Platform/UpdateCommentRequest.cs`. Campo `string?` sin anotaciones, hacia una columna `nvarchar(max)`. **Impacto:** un cliente puede almacenar megabytes de texto por solicitud.

### B6 · `FechaIngreso` con hora local del servidor
`UserAccessRepository.cs:52`: `DateOnly.FromDateTime(DateTime.Now)`. **Impacto [inferencia]:** en un contenedor sin `TZ`, la fecha efectiva es UTC y puede desplazarse un día respecto a la hora de México.

### B7 · Código muerto y residuos de plantilla
- `UserAccessRepository.GetAreasById` (`:85-92`) — sin llamadores.
- `Backend/WeatherForecast.cs` — modelo sin endpoint.
- `Backend/Backend.http:3` — petición a `/weatherforecast/`, que devuelve `404`; inservible como prueba de humo.
- `Backend/Models/Response/Platform/UsersRequestResponse.cs:6` — `Solicitudes` declarada anulable sin necesidad.
- `PlatformHandler.cs:97` — nombre de tipo completamente cualificado teniendo el `using`.

### B8 · Inconsistencias de estilo de API y de nombres
- Archivo `Controllers/PlatformControler.cs` con errata (clase correcta `PlatformController`).
- `Users/{id}/Permissions` vs `Users/{id}/deactivate` (capitalización).
- Id en la ruta (`GET`) vs en el cuerpo (`PUT`) para la misma entidad.
- DTO de `UserAccess` en minúscula (`name`, `email`) vs DTO de `Platform` en PascalCase.
- Rutas en inglés con cuerpos en español.
- Grafía **`Contability`** en el controller de Contabilidad.

### B9 · Sin concurrencia optimista
`Backend/Data/UserAccessDbContext.cs` sin `IsRowVersion`/`IsConcurrencyToken`. Además `UpdatePassword` (`:210-216`) hace `Update(usuario)`, que reescribe **todas** las columnas. **Impacto:** dos actualizaciones simultáneas del mismo usuario se sobrescriben en silencio ("último gana").

### B10 · Sin observabilidad ni resiliencia
`Program.cs`: sin `AddHealthChecks`, sin métricas/OpenTelemetry, sin `AddRateLimiter`, sin `EnableRetryOnFailure` en `UseSqlServer` (`:47-49`). **Impacto:** Compose y el pipeline no pueden verificar que la API esté sana (ver [[be-deployment]] §4.2), `/Auth/login` admite fuerza bruta ilimitada y un fallo transitorio de SQL aborta la operación con `500`.

### B11 · Sin pruebas automatizadas
No existe proyecto de pruebas en el repositorio y el pipeline no ejecuta `dotnet build` ni `dotnet test` (`deploy-devel.yml:10-21`). **Impacto:** un commit que no compila se despliega; los cuatro defectos lógicos de este documento habrían sido detectados por una prueba unitaria del repositorio.

---

## Correcciones al contexto previo (`.agent/CONTEXT.md`, 2026-09-08)

Lo que ese documento afirma y **ya no es cierto**. Cuando difieran, prevalece esta bóveda.

| `.agent/CONTEXT.md` afirma | Realidad del 2026-09-18 | Evidencia |
| --- | --- | --- |
| *"No se configura `AddAuthentication`, `UseAuthentication`, esquema JWT/cookie ni atributos `[Authorize]`"* | **Falso.** Existe `AddAuthentication(BearerToken)` + `AddBearerToken` con 8 h, `UseAuthentication`, y **5 acciones con `[Authorize]`** | `Program.cs:32-33,65`; `PlatformControler.cs:41,76,101,133,152` |
| El login *"no establece una sesión autenticada en el servidor"* | **Falso.** Devuelve `accessToken` protegido por Data Protection | `AuthResponse.cs:9`; `AuthHandler.cs:39`; `SessionTokenService.cs` |
| *"Aprobar/rechazar solicitudes: **no existe operación**"* | **Falso.** Existe `POST /Platform/Users/Approve` transaccional | `PlatformControler.cs:101-132`; `UserAccessRepository.cs:236-298` |
| *"Administración de permisos: solo lectura del catálogo… Pendiente"* | **Falso.** Existen `GET /Platform/Users/{id}/Permissions` y `PUT /Platform/Users/Permissions` | `PlatformControler.cs:133-177`; `UserAccessRepository.cs:299-349` |
| *"Desactivación incompleta"* / botones sin acción | **Parcialmente falso.** Existe `POST /Platform/Users/{id}/deactivate`… **pero hace un DELETE**, no un cambio de `Activo` (hallazgo C4) | `UserAccessRepository.cs:141-202` |
| *"No hay transacción explícita multietapa"* en el repositorio | **Falso.** Hay **tres** transacciones explícitas | `UserAccessRepository.cs:144,245,316` |
| El repositorio tiene *13 métodos* | **Ahora 18** | [[be-repository]] §1 |
| *"Los DTO y endpoints existentes no incluyen aún el campo `comentario`"* | **Falso.** `Solicitud.Comentario` se expone en `GET /Platform/UserRequest`, y existe `PUT /Platform/UserRequest/{id}/comment` | `UsersRequestResponse.cs:26`; `PlatformHandler.cs:82`; `PlatformControler.cs:76-99` |
| *"`GET /Auth/userTypes`"* descrito sin riesgos | Sigue existiendo, pero **puede lanzar `500`** por claves duplicadas (M11) | `AuthHandler.cs:91` |
| Las consultas del repositorio *"no reciben `CancellationToken`"* | **Parcialmente falso.** Las 5 operaciones nuevas sí lo reciben y propagan | `UserAccessRepository.cs:141,218,236,308` |
| Ningún `try/catch` de traducción de errores | **Parcialmente falso.** `PlatformController` traduce `SqlException` 2601/2627/547/1205 en sus acciones nuevas | `PlatformControler.cs:60-73,122-125` |
| Handlers y repositorio *"registrados como `Scoped`"*, sin mencionar `SessionTokenService` | Correcto y **ampliado**: `SessionTokenService` también es `Scoped` | `Program.cs:35` |
| *"La API no está restringida por sesión o permisos"* (hallazgo de prioridad Alta) | **Parcialmente resuelto.** Las 5 operaciones de escritura sí lo están; **los 2 listados de datos personales siguen anónimos** (C2, C3) | `PlatformControler.cs:24,31` |

**Sigue siendo cierto de `.agent/CONTEXT.md`:** el cambio de contraseña sin prueba de identidad (C1), la validación de duplicados defectuosa (A1), la desalineación de límites UI/DTO/SQL (M2), la ausencia de migraciones y de tests, el archivo con errata `PlatformControler.cs`, `WeatherForecast.cs` y `GetAreasById` como código muerto, y la falta de `.dockerignore` (A8).

## Orden de trabajo sugerido

1. **C2, C3** — `[Authorize]` + permiso en los dos listados. Cambio de pocas líneas, corta la filtración.
2. **C1** — rediseñar el cambio de contraseña.
3. **A5** — descomentar la guarda de entorno de Swagger.
4. **C4** — convertir la "baja" en un *soft delete* real.
5. **A1** — corregir `GetUserKeyAuth`.
6. **A2, A3** — invariantes de auto-modificación y de último administrador.
7. **A6** — alinear el puerto de escucha y documentarlo.
8. **A4** — centralizar la autorización en una política, sin el literal `1`.
9. **A7** — auditoría de aprobación, baja y cambio de permisos.
10. **A8, M13** — `.dockerignore` y persistencia de claves de Data Protection.
11. **M1-M3** — validación del servidor alineada con SQL.
12. **B11** — pruebas unitarias del repositorio y `dotnet build` en el pipeline.

## Enlaces

- [[be-index]] · [[be-architecture]] · [[be-api-reference]] · [[be-controllers]] · [[be-handlers]] · [[be-repository]]
- [[be-auth-session]] · [[be-authorization-permissions]] · [[be-dto-contracts]] · [[be-dbcontext-entities]]
- [[be-flows]] · [[be-startup-di-config]] · [[be-deployment]]
- [[db-findings]] · [[db-index]] · [[db-table-usuarios]] · [[db-table-solicitud-usuarios]] · [[db-table-usuario-modulo-permisos]] · [[db-infrastructure]]
- [[fe-findings]] · [[fe-index]] · [[fe-api-clients]] · [[fe-session-state]] · [[fe-templates-areas-modules]] · [[fe-interfaces]]
- [[architecture-overview]]
