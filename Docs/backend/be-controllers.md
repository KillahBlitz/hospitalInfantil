---
title: Backend — Controllers
tags: [backend, aspnet, controllers, http]
updated: 2026-09-18
---

# Controllers

Cuatro controllers en `Backend/Controllers/`. Todos heredan `ControllerBase` (API, sin vistas), llevan `[ApiController]` y `[Route("[controller]")]`, y viven en el namespace `Backend.Controllers`.

| Archivo | Clase | Prefijo | Acciones | Dependencias inyectadas |
| --- | --- | --- | --- | --- |
| `AuthController.cs` | `AuthController` | `/Auth` | 7 | `AuthHandler` |
| **`PlatformControler.cs`** *(errata en el nombre del archivo)* | `PlatformController` | `/Platform` | 7 | `PlatformHandler`, `ILogger<PlatformController>` |
| `HumanResourcesController.cs` | `HumanResourcesController` | `/HumanResources` | 1 | ninguna |
| `ContabilityController.cs` | `ContabilityController` | `/Contability` | 1 | ninguna |

Rutas y contratos completos en [[be-api-reference]].

## 1. `AuthController` — `Backend/Controllers/AuthController.cs`

**[verificado]** 85 líneas. Constructor clásico con campo `readonly AuthHandler _authHandler` (`:11-16`).

### 1.1 Patrón repetido en 6 de las 7 acciones

```csharp
var response = await _authHandler.XXX(...);
if (response is null)
    return BadRequest(new { message = "Error al obtener …" });   // o Unauthorized
return Ok(response);
```

| Acción | Línea | Rama de fallo | ¿Alcanzable? |
| --- | --- | --- | --- |
| `Login` | `:18-26` | `401 {message}` | **Sí** — `Authenticate` devuelve `null` con credenciales malas |
| `Register` | `:28-36` | `400 {message}` | **No** — `AuthHandler.Register` siempre devuelve un objeto |
| `ChangePassword` | `:38-44` | ninguna: devuelve `Ok(bool)` | — |
| `UserTypes` | `:46-54` | `400 {message}` | **No** — el handler siempre construye el DTO |
| `Areas` | `:56-64` | `400 {message}` | **No** |
| `Access` | `:66-74` | `400 {message}` | **No** |
| `Modules` | `:76-84` | `400 {message}` | **No** |

**Consecuencia [verificado]:** cinco comprobaciones `is null` son **código muerto**. Los handlers declaran retorno anulable (`AreasResponse?`, etc.) pero nunca devuelven `null`. El `404`/`400` que un cliente esperaría ante un fallo real **no llega**: cualquier excepción de EF, SQL o BCrypt sale como **500 sin cuerpo controlado**.

### 1.2 Lo que `AuthController` NO hace

**[verificado]**

- **Ningún `try/catch`.** Contrasta con `PlatformController`, que envuelve las 5 acciones nuevas.
- **Ningún `[Authorize]`.** Las 7 acciones son anónimas, incluyendo `changePassword`.
- **No emite el token**: eso lo hace `AuthHandler` vía `SessionTokenService` (ver [[be-auth-session]]).
- **No lee claims**: no usa `User` en ningún punto.
- No usa `CancellationToken` en ninguna acción.
- No declara `[ProducesResponseType]`, así que el documento OpenAPI no describe los códigos reales.

## 2. `PlatformController` — `Backend/Controllers/PlatformControler.cs`

**[verificado]** 179 líneas. Es el único controller con manejo de errores y con autorización. Inyecta `PlatformHandler` y `ILogger<PlatformController>` (`:15-22`).

### 2.1 `using` que revelan acoplamiento

```csharp
// PlatformControler.cs:1-7
using Microsoft.AspNetCore.Mvc;
using Backend.Handlers;
using System.Security.Claims;                 // lectura de claims
using Microsoft.AspNetCore.Authorization;     // [Authorize]
using Microsoft.Data.SqlClient;               // SqlException por número de error
using Microsoft.EntityFrameworkCore;          // DbUpdateException
using Backend.Models.Request.Platform;
```

**[verificado]** La capa HTTP importa `Microsoft.Data.SqlClient` y `Microsoft.EntityFrameworkCore` para inspeccionar **números de error de SQL Server**. Es una fuga de la capa de datos hacia la de presentación: el controller conoce los códigos 2601, 2627, 547 y 1205.

### 2.2 Dos generaciones de acciones en el mismo archivo

| Generación | Acciones | Características |
| --- | --- | --- |
| **Antigua** (previa a este ciclo) | `GetRegisteredUsers` `:24-29`, `GetUserRequest` `:31-39` | Sin `[Authorize]`, sin `try/catch`, sin `CancellationToken`, sin validación de entrada |
| **Nueva** (commit `01f70d2`) | `DeactivateUser` `:41`, `UpdateComment` `:76`, `ApproveUser` `:101`, `GetUserPermissions` `:133`, `UpdateUserPermissions` `:152` | `[Authorize]`, `try/catch` por acción, `CancellationToken`, validación de rango, lectura de claim, log de errores |

Esta asimetría es el hallazgo de seguridad principal: los dos endpoints que **listan datos personales** son precisamente los de la generación antigua. Ver [[be-findings]].

### 2.3 Cuatro pasos comunes de las acciones protegidas

```csharp
// patrón de PlatformControler.cs:41-58 (y equivalentes en :76, :101, :152)
[Authorize]                                                          // 1. exige token válido
[HttpPost("Users/{id:int}/deactivate")]
public async Task<IActionResult> DeactivateUser(int id, CancellationToken cancellationToken)
{
    if (id <= 0) return BadRequest(new { message = "…" });            // 2. validación manual
    if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId) || actorId <= 0)
        return Unauthorized(new { message = "…" });                   // 3. identidad del actor
    try {
        var response = await _platformHandler.DeactivateUser(id, actorId, cancellationToken);
        return response.Code switch {                                 // 4. código de negocio -> HTTP
            "success"   => Ok(response),
            "not_found" => NotFound(response),
            "conflict"  => Conflict(response),
            _           => StatusCode(StatusCodes.Status403Forbidden, response)
        };
    } catch (…) { … }
}
```

**Observaciones [verificado]:**

1. `{id:int}` es una **restricción de ruta**, no validación de negocio: `/Platform/Users/abc/deactivate` da `404` (no `400`), y `/Platform/Users/0/deactivate` llega a la acción y da `400`.
2. El `actorId` **siempre** proviene del claim `NameIdentifier` del token, nunca del cuerpo. Esto es correcto y no es suplantable por el cliente.
3. El `switch` usa la rama `_ =>` para `403`. **Cualquier string desconocido devuelto por el repositorio se convierte en 403 "No tienes permiso"**, aunque la causa real sea otra. Es un `switch` sin caso por defecto significativo.
4. `catch (Exception ex) when (ex is not OperationCanceledException)` deja propagar la cancelación del cliente, lo cual es correcto; el resto se registra y sale como `500`.

### 2.4 Tabla de traducción de excepciones por acción

| Acción | `DbUpdateException` + Sql 2601/2627/547 | `SqlException` 1205 (deadlock) | Resto |
| --- | --- | --- | --- |
| `DeactivateUser` | `409` (`:60-63`) | `409` (`:64-67`) | `500` con log (`:68-73`) |
| `UpdateComment` | — | — | `500` con log; `UnauthorizedAccessException` → `403` (`:90-93`) |
| `ApproveUser` | `409` (`:122-125`) | — | `500` con log (`:126-131`) |
| `GetUserPermissions` | — | — | `500` con log (`:145-149`); **no excluye `OperationCanceledException`** |
| `UpdateUserPermissions` | **—** | — | `500` con log (`:172-176`) |

**Defectos [verificado]:**
- `UpdateUserPermissions` **no** traduce la violación de FK: enviar un `moduloId` o `permisoId` inexistente produce `500` en lugar de `409`/`400`.
- `GetUserPermissions` captura `Exception` a secas (`:145`), por lo que una cancelación del cliente se registra como error y se responde `500`.
- `UpdateComment` no captura errores de SQL específicos; un comentario que viole algo produce `500`.

### 2.5 Colisiones de ruta: por qué no hay ambigüedad

**[verificado]** Dentro de `/Platform/Users` conviven cinco plantillas. No hay conflicto porque:

| Plantilla | Método | Discriminante |
| --- | --- | --- |
| `Users` | `GET` | sin segmento extra |
| `Users/{id:int}/Permissions` | `GET` | segmento numérico + literal |
| `Users/{id:int}/deactivate` | `POST` | segmento numérico + literal |
| `Users/Approve` | `POST` | literal `Approve` — **no coincide con `{id:int}`** por la restricción |
| `Users/Permissions` | `PUT` | verbo distinto |

**[inferencia]** Si alguien retirara la restricción `:int`, `Users/Approve` pasaría a ser ambiguo con `Users/{id}/…` y el arranque fallaría con `AmbiguousMatchException`. Mantener `:int`.

### 2.6 Inconsistencias de estilo de API

**[verificado]** dentro del mismo controller:

| Inconsistencia | Ejemplo |
| --- | --- |
| Capitalización de segmentos | `Users/{id}/Permissions` (mayúscula) vs `Users/{id}/deactivate` (minúscula) |
| Ubicación del id | `GET …/Users/{id}/Permissions` (ruta) vs `PUT …/Users/Permissions` con `userId` en el cuerpo |
| Verbo para mutaciones | `POST` para aprobar y dar de baja, `PUT` para permisos y comentario |
| Idioma | `Users`, `Approve`, `Permissions`, `deactivate` (inglés) junto a `UserRequest`/`comment` y cuerpos en español (`comentario`, `permisos`) |
| Forma del cuerpo de error | unas veces el DTO completo (`{success,code,message}`), otras un anónimo `{message}` |

## 3. Controllers de prueba

```csharp
// Backend/Controllers/HumanResourcesController.cs
[ApiController]
[Route("[controller]")]
public class HumanResourcesController : ControllerBase
{
    [HttpPost]
    public string HumanResources() => "Hello from HumanResourcesController";
}
```

**[verificado]** `ContabilityController` es idéntico salvo el texto. Ambos:

- Devuelven `string`, que con `[ApiController]` se serializa como **`text/plain`**, no JSON. **[inferencia de alta confianza]**
- Son `[HttpPost]` **sin plantilla** → la ruta es el nombre del controller a secas.
- No tienen constructor, handler, DTO, persistencia ni `[Authorize]`.
- No implican ningún diseño de los futuros dominios de RH ni Contabilidad: **no existen sus entidades ni tablas**. Ver [[db-index]].

## 4. Checklist para agregar una acción

1. Elegir el controller del área; si es nueva, crear `XController : ControllerBase` con `[ApiController]` y `[Route("[controller]")]`.
2. Definir el DTO en `Models/Request/<Área>/` con `DataAnnotations` **que reflejen las longitudes de SQL** — hoy ningún DTO las declara (ver [[be-dto-contracts]]).
3. Si la operación muta datos o lee datos personales: poner `[Authorize]` **explícitamente** (no hay política global) y obtener el actor del claim `NameIdentifier`, nunca del cuerpo.
4. Delegar al handler; **nunca** inyectar `UserAccessRepository` ni `UserAccessDbContext` en el controller.
5. Añadir `CancellationToken` y propagarlo al repositorio.
6. Envolver en `try/catch` con las traducciones de `SqlException`/`DbUpdateException` que apliquen, y registrar con `ILogger`.
7. Registrar cualquier servicio nuevo en `Program.cs` (ver [[be-startup-di-config]]).

## Enlaces

- [[be-index]] · [[be-architecture]] · [[be-api-reference]] · [[be-dto-contracts]]
- [[be-handlers]] · [[be-repository]] · [[be-auth-session]] · [[be-authorization-permissions]]
- [[be-flows]] · [[be-findings]] · [[be-startup-di-config]]
- [[db-queries-by-feature]] · [[fe-api-clients]] · [[fe-interfaces]]
