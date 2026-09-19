---
title: Backend — Contratos DTO de petición y respuesta
tags: [backend, dto, contratos, validacion, json]
updated: 2026-09-18
---

# Contratos DTO

Inventario completo de `Backend/Models/Request/` y `Backend/Models/Response/`: **7 DTO de petición** (en 7 archivos) y **9 DTO de respuesta** (en 6 archivos). Uso por endpoint en [[be-api-reference]]; consumo desde el SPA en [[fe-interfaces]].

## 1. Reglas transversales

**[verificado]**

| Regla | Detalle |
| --- | --- |
| Serialización | camelCase para propiedades; **claves de diccionario literales**; `DateOnly` → `"yyyy-MM-dd"`; `null` se emite. Ver [[be-architecture]] §8 |
| Validación declarativa | **Solo `[Required]` y un único `[EmailAddress]`**. Ningún `[StringLength]`, `[MaxLength]`, `[RegularExpression]`, `[Range]` ni `[MinLength]` en todo el proyecto |
| Validación automática | `[ApiController]` produce `400 ValidationProblemDetails` cuando falla una anotación |
| Convención de nombres | **Inconsistente**: los DTO de `UserAccess` usan propiedades en **minúscula/camelCase** (`name`, `email`), los de `Platform` en **PascalCase** (`SolicitudId`, `TipoId`) |
| Records / inmutabilidad | No se usan `record` ni `init`: todos son `class` con `get; set;` |
| Namespaces | `Backend.Models.Request.UserAccess`, `Backend.Models.Request.Platform`, `Backend.Models.Response.UserAccess`, `Backend.Models.Response.Platform` |

## 2. DTO de petición

### 2.1 `AuthRequest` · `Models/Request/UserAccess/AuthRequest.cs`

| Propiedad | Tipo | Anotaciones | JSON |
| --- | --- | --- | --- |
| `User` | `string` | `[Required]` | `user` |
| `Password` | `string` | `[Required]` | `password` |

**[verificado]** `[Required]` rechaza `null`, `""` y cadenas de solo espacios (`RequiredAttribute` con `AllowEmptyStrings = false` aplica `Trim()` antes de medir). **[inferencia de alta confianza]** Lo que **no** rechaza es un valor con espacios alrededor (`" jmonroy "`), que llega **sin normalizar** al repositorio y se compara literalmente contra `Usuarios.Alias`. El frontend hace `trim()` solo para validar y **envía el valor original** (ver [[fe-index]]). Tampoco hay longitud máxima: un `user` de 200 caracteres pasa el DTO.

### 2.2 `RegisterRequest` · `Models/Request/UserAccess/RegisterRequest.cs`

Los 8 campos son `string` y `[Required]`. Declarados en este orden en el archivo:

| # | Propiedad | JSON | Destino en SQL | Límite SQL | ¿Validado? |
| --- | --- | --- | --- | --- | --- |
| 1 | `lastNameTwo` | `lastNameTwo` | `SolicitudUsuarios.ApellidoMaterno` | `varchar(20)` | **no** |
| 2 | `lastName` | `lastName` | `ApellidoPaterno` | `varchar(20)` | **no** |
| 3 | `password` | `password` | → hash BCrypt | `nvarchar(500)` | **no** (sin política de complejidad) |
| 4 | `email` | `email` | `Correo` | `nvarchar(100)` | **no** — ⚠ **le falta `[EmailAddress]`**, que sí tiene `ChangePasswordRequest` |
| 5 | `birthDate` | `birthDate` | `FechaNacimiento` (`date`) | — | formato validado con `ParseExact` **sin `try`** |
| 6 | `name` | `name` | `Nombre` | `varchar(30)` | **no** |
| 7 | `sex` | `sex` | `Sexo` | `varchar(1)` | **no** — sin `[StringLength(1)]` ni `[RegularExpression]` |
| 8 | `user` | `user` | `Username` | `varchar(10)` | **no** |

**[verificado]** `birthDate` está declarado `public string? birthDate` (anulable) **con `[Required]`**: la anotación gana y rechaza `null`, por lo que la comprobación adicional del handler (`AuthHandler.cs:55`) solo cubre `""`.

**Desalineación UI → DTO → SQL [verificado]:** el formulario React admite nombres de hasta 50 y apellidos de hasta 25 caracteres; SQL acepta 30 y 20. El DTO no impone nada. Resultado: un registro válido en pantalla produce **500** por truncamiento en SQL Server. Ver [[be-findings]] y [[fe-interfaces]].

### 2.3 `ChangePasswordRequest` · `Models/Request/UserAccess/ChangePasswordRequest.cs`

| Propiedad | Tipo | Anotaciones | JSON |
| --- | --- | --- | --- |
| `email` | `string` | `[Required]`, **`[EmailAddress]`** | `email` |
| `password` | `string` | `[Required]` | `password` |

**[verificado]** Es el **único** DTO del proyecto con `[EmailAddress]`. No hay campo de confirmación, ni contraseña anterior, ni token de recuperación.

### 2.4 `ModuleRequest` · `Models/Request/UserAccess/ModuleRequest.cs`

| Propiedad | Tipo | Anotaciones | JSON |
| --- | --- | --- | --- |
| `areasId` | `List<int>` | `[Required]` | `areasId` |

**[verificado]** Inicializado a `new List<int>()`. **`[Required]` sobre una colección ya instanciada nunca falla**: `{"areasId":[]}` y `{}` ambos pasan y devuelven `{"modulos":{}}`. Para exigir contenido haría falta `[MinLength(1)]`.

El frontend envía la clave como `AreasId` (PascalCase) y liga correctamente porque `PropertyNameCaseInsensitive` está activo en los defaults Web.

### 2.5 `ApproveUserRequest` + `ModulePermissionRequest` · `Models/Request/Platform/ApproveUserRequest.cs`

```csharp
public class ApproveUserRequest
{
    [Required] public int SolicitudId { get; set; }
    [Required] public short TipoId { get; set; }
    [Required] public List<ModulePermissionRequest> Permisos { get; set; } = new();
}
public class ModulePermissionRequest
{
    [Required] public int ModuloId { get; set; }
    [Required] public List<int> PermisosIds { get; set; } = new();
}
```

| Aspecto | Hecho verificado |
| --- | --- |
| `[Required]` en `int`/`short` | **No-op**: un tipo de valor no anulable siempre tiene valor (0). La validación real está en `PlatformControler.cs:105` (`<= 0`) |
| `[Required]` en `Permisos` | No-op por estar inicializada: **se acepta `permisos: []`** y se crea un usuario sin accesos |
| `ModulePermissionRequest` | Definido en el **mismo archivo** que `ApproveUserRequest`, y **reutilizado** por `UpdateUserPermissionsRequest` |
| Duplicados en `PermisosIds` | No se validan → violación de la PK compuesta (SQL 2627) → `409` |
| IDs inexistentes | No se validan → violación de FK (SQL 547) → `409` con mensaje engañoso |
| JSON emitido/aceptado | `solicitudId`, `tipoId`, `permisos[].moduloId`, `permisos[].permisosIds` |

### 2.6 `UpdateUserPermissionsRequest` · `Models/Request/Platform/UpdateUserPermissionsRequest.cs`

Idéntico a `ApproveUserRequest` salvo que el primer campo es `UserId` (`int`) en lugar de `SolicitudId`. Reutiliza `ModulePermissionRequest`.

**[verificado]** Aquí el id del usuario viaja **en el cuerpo**, mientras que el `GET` hermano lo lleva **en la ruta** (`/Platform/Users/{id:int}/Permissions`). Asimetría de diseño, no un error funcional.

### 2.7 `UpdateCommentRequest` · `Models/Request/Platform/UpdateCommentRequest.cs`

```csharp
public class UpdateCommentRequest
{
    public string? Comentario { get; set; }
}
```

**[verificado]** **Sin ninguna anotación.** `{}`, `{"comentario":null}` y un comentario de megabytes son todos válidos; el valor se escribe tal cual en la columna `nvarchar(max)`. Es el DTO con el contrato más laxo del proyecto. Ver [[be-findings]].

## 3. DTO de respuesta — `UserAccess`

### 3.1 `AuthResponse` · `Models/Response/UserAccess/AuthResponse.cs`

| Propiedad | Tipo C# | JSON | Nota |
| --- | --- | --- | --- |
| `Id` | `int` | `id` | `Usuarios.Id` |
| `Nombre` | `string` | `nombre` | solo el nombre de pila, sin apellidos |
| `Alias` | `string` | `alias` | |
| `Correo` | `string` | `correo` | |
| **`AccessToken`** | `string` | `accessToken` | **campo nuevo de este ciclo** |
| `Accesos` | `List<Dictionary<string, List<Dictionary<int, List<int>>>>>` | `accesos` | ver §3.2 |

**[verificado]** No incluye `TipoId`, `ApellidoPaterno`, `ApellidoMaterno`, `Activo`, fecha de expiración del token ni *refresh token*. El frontend serializa este objeto completo en `localStorage` (ver [[fe-session-state]]), **lo que deja el bearer token en almacenamiento persistente accesible por JavaScript**.

### 3.2 Forma de `accesos`

```json
"accesos": [
  { "Plataforma":        [ { "1": [1, 2] }, { "3": [1] } ] },
  { "Recursos Humanos":  [ { "2": [1] } ] }
]
```

**Cómo leerlo [verificado]:**
- Nivel 1: **lista** de objetos, uno por área.
- Nivel 2: clave = **nombre del área** (literal, desde `Areas.Nombre`); valor = **lista** de objetos, uno por módulo.
- Nivel 3: clave = **id de módulo como string JSON**; valor = **lista de ids de permiso**.

No es un diccionario plano. No trae nombres de módulos ni de permisos: para resolverlos el frontend necesita los catálogos `/Auth/areas`, `/Auth/access` y `/Auth/modules`. Los valores del ejemplo son ilustrativos.

### 3.3 `RegisterResponse` · `Models/Response/UserAccess/RegisterResponse.cs`

`{ "success": bool, "message": string }`. **Se devuelve con `200` también en el fracaso lógico.**

### 3.4 Catálogos · `Models/Response/UserAccess/Catalogs.cs`

Cuatro clases en un archivo:

| Clase | Propiedad | Tipo | JSON resultante |
| --- | --- | --- | --- |
| `AreasResponse` | `Areas` | `Dictionary<string, int>` | `{"areas": {"Plataforma": 1}}` — **nombre → id** |
| `ModulesResponse` | `Modulos` | `Dictionary<int, string>` | `{"modulos": {"1": "Configuración de cuentas"}}` — **id → nombre** |
| `AccessResponse` | `Permisos` | `Dictionary<int, string>` | `{"permisos": {"1": "ver"}}` — **id → nombre** |
| `UserTypesResponse` | `UserTypes` | `Dictionary<string, short>` | `{"userTypes": {"Administrador": 1}}` — **nombre → id** |

**Trampas verificadas:**
1. **La dirección del mapeo cambia según el catálogo.** Áreas y tipos van nombre→id; módulos y permisos van id→nombre.
2. Las **claves numéricas se emiten como string JSON** (`"1"`), no como número.
3. Las **claves de texto conservan la capitalización de SQL** (`"Plataforma"`, `"Recursos Humanos"` con espacio y acento donde corresponda), porque `DictionaryKeyPolicy` no se aplica.
4. **La propiedad es `userTypes` en camelCase**, no `UserTypes`. El frontend añadió un *fallback* que acepta ambas grafías; la razón real de su confusión son las **claves internas**, que sí van tal cual.
5. Las interfaces TypeScript declaran `access` y `modules` en lugar de `permisos` y `modulos`. Ver [[fe-interfaces]].

## 4. DTO de respuesta — `Platform`

### 4.1 `UsersRequestResponse` + `Solicitud` · `Models/Response/Platform/UsersRequestResponse.cs`

| Propiedad de `Solicitud` | Tipo | JSON | Origen |
| --- | --- | --- | --- |
| `Id` | `int` | `id` | `SolicitudUsuarios.Id` |
| `Usuario` | `string` | `usuario` | **`SolicitudUsuarios.Username`** (renombrado) |
| `Nombre`, `ApellidoPaterno`, `ApellidoMaterno` | `string` | idem camelCase | |
| `FechaIngreso` | `DateOnly` | `"2026-09-18"` | |
| `Correo` | `string` | `correo` | |
| `Aprobado` | `bool` | `aprobado` | |
| **`Comentario`** | `string?` | `comentario` | **campo nuevo de este ciclo** |

Contenedor: `{ "solicitudes": [ … ] }`. **[verificado]** `Solicitudes` está declarado **anulable** (`List<Solicitud>?`), aunque el handler siempre asigna una lista.

**Omitidos deliberadamente:** `PasswordHash`, `FechaNacimiento`, `Sexo`.

### 4.2 `RegisteredUsersResponse` + `RegisteredUser` · `Models/Response/Platform/RegisteredUsersResponse.cs`

Contenedor `{ "usuarios": [ … ] }`. `RegisteredUser` expone **11 de las 12 propiedades** de `Usuario`: `id`, `tipoId`, `nombre`, `apellidoPaterno`, `apellidoMaterno`, `fechaNacimiento`, `sexo`, `fechaIngreso`, `alias`, `correo`, `activo`.

**[verificado]** El único campo excluido es **`PasswordHash`**, y las navegaciones no se copian. La exclusión es **explícita por construcción del DTO**, no por `[JsonIgnore]`: cualquiera que devuelva la entidad `Usuario` directamente **filtraría el hash**.

**Nota de privacidad:** este DTO expone fecha de nacimiento y sexo de todo el personal, y el endpoint que lo sirve **es anónimo**. Ver [[be-findings]].

### 4.3 `DeactivateUserResponse` · `Models/Response/Platform/DeactivateUserResponse.cs`

```csharp
public class DeactivateUserResponse
{
    public bool Success { get; set; }
    public string Code { get; set; } = null!;
    public string Message { get; set; } = null!;
}
```

**[verificado]** Se usa como respuesta de **tres** operaciones distintas: baja, aprobación y actualización de permisos (`PlatformHandler.cs:39,97,151`). Valores de `Code`: `"success"`, `"not_found"`, `"conflict"`, `"forbidden"`.

**Impacto:** en el documento OpenAPI, `POST /Platform/Users/Approve` y `PUT /Platform/Users/Permissions` declaran devolver un esquema llamado `DeactivateUserResponse`. Un generador de cliente produce nombres engañosos. Debería dividirse en `ApproveUserResponse`, `UpdatePermissionsResponse`, etc., o unificarse en un `OperationResult` neutral.

### 4.4 `UserPermissionsResponse` + `UserPermissionItem` · `Models/Response/Platform/UserPermissionsResponse.cs`

| Propiedad | Tipo | JSON |
| --- | --- | --- |
| `Success` | `bool` | `success` |
| `Message` | `string` (default `""`) | `message` |
| `Code` | `string` (default `""`) | `code` |
| `TipoId` | `short` | `tipoId` |
| `Permisos` | `List<UserPermissionItem>` | `permisos` |

`UserPermissionItem`: `areaId` (`int`), `areaName` (`string`), `moduloId` (`int`), `moduloName` (`string`), `permisosIds` (`List<int>`).

**[verificado]** Es el **único** DTO de salida que incluye **nombres resueltos** de área y módulo; `accesos` del login no los trae. Es también el más cómodo para reconstruir una UI de permisos.

**Incoherencia [verificado]:** en el camino de error, el controller **descarta este DTO** y devuelve `{message}` (`PlatformControler.cs:142`), así que el cliente recibe dos formas distintas según el resultado.

## 5. Mapa de propiedad JSON → columna SQL

| JSON de entrada | DTO | Columna final |
| --- | --- | --- |
| `user` (login) | `AuthRequest.User` | `Usuarios.Alias` (comparación) |
| `user` (registro) | `RegisterRequest.user` | `SolicitudUsuarios.Username` |
| `name` | `RegisterRequest.name` | `SolicitudUsuarios.Nombre` |
| `lastName` | `RegisterRequest.lastName` | `SolicitudUsuarios.ApellidoPaterno` |
| `lastNameTwo` | `RegisterRequest.lastNameTwo` | `SolicitudUsuarios.ApellidoMaterno` |
| `sex` | `RegisterRequest.sex` | `SolicitudUsuarios.Sexo` |
| `birthDate` | `RegisterRequest.birthDate` | `SolicitudUsuarios.FechaNacimiento` |
| `email` | `RegisterRequest.email` / `ChangePasswordRequest.email` | `SolicitudUsuarios.Correo` / `Usuarios.Correo` |
| `password` | varios | → hash BCrypt en `PasswordHash` |
| `areasId[]` | `ModuleRequest.areasId` | filtro sobre `Modulos.AreaId` |
| `comentario` | `UpdateCommentRequest.Comentario` | `SolicitudUsuarios.comentario` |
| `solicitudId` | `ApproveUserRequest.SolicitudId` | `SolicitudUsuarios.Id` |
| `tipoId` | `ApproveUserRequest`/`UpdateUserPermissionsRequest` | `Usuarios.TipoId` |
| `permisos[].moduloId` | `ModulePermissionRequest.ModuloId` | `UsuarioModuloPermisos.ModuloId` |
| `permisos[].permisosIds[]` | `ModulePermissionRequest.PermisosIds` | `UsuarioModuloPermisos.PermisoId` |
| `userId` | `UpdateUserPermissionsRequest.UserId` | `Usuarios.Id` |

Tres nombres distintos para el mismo concepto de identificador de cuenta: **`user` / `usuario` / `alias` / `Username`**. Documentado también en [[db-table-usuarios]].

## 6. Al definir un DTO nuevo

1. Declarar las anotaciones que **reflejen las longitudes de SQL** (`[StringLength(30)]`, etc.) para convertir `500` en `400`.
2. Poner `[EmailAddress]` en todo campo de correo — hoy falta en `RegisterRequest`.
3. Para tipos de valor, **no confiar en `[Required]`**: usar `[Range(1, int.MaxValue)]` o validación explícita.
4. Para colecciones obligatorias, usar `[MinLength(1)]`, no `[Required]`.
5. Elegir **una** convención de nombres (PascalCase en C#, camelCase en JSON llega gratis) y no mezclar como hoy.
6. No reutilizar un DTO de respuesta entre operaciones semánticamente distintas.
7. Reflejar el cambio en [[fe-interfaces]] y [[fe-api-clients]] en el mismo cambio: hoy hay al menos tres desalineaciones TS/JSON.

## Enlaces

- [[be-index]] · [[be-architecture]] · [[be-api-reference]] · [[be-controllers]] · [[be-handlers]]
- [[be-dbcontext-entities]] · [[be-repository]] · [[be-auth-session]] · [[be-flows]] · [[be-findings]]
- [[db-table-usuarios]] · [[db-table-solicitud-usuarios]] · [[db-table-usuario-modulo-permisos]] · [[db-schema-acceso-usuario]]
- [[fe-interfaces]] · [[fe-api-clients]] · [[fe-session-state]]
