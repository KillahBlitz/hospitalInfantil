---
title: "Tabla acceso_usuario.UsuarioModuloPermisos"
tags: [database, tabla, puente, permisos, acceso-usuario]
updated: 2026-09-18
---

# `acceso_usuario.UsuarioModuloPermisos`

Entidad `UsuarioModuloPermiso` · DbSet `UsuarioModuloPermisos` · Mapeo en `Backend/Data/UserAccessDbContext.cs:149-169` · Entidad en `Backend/Models/Schemas/UserAccess/UsuarioModuloPermiso.cs`

Tabla puente de tres vías. Es la **única fuente de accesos efectivos** del sistema: si no hay fila, no hay acceso.

## Columnas

| Columna | Tipo SQL inferido | Nulable | Restricción / propósito |
| --- | --- | --- | --- |
| `UsuarioId` | `int` | No | Parte de la PK + FK `FK_UsuarioModuloPermisos_Usuarios` → [[db-table-usuarios]] |
| `ModuloId` | `int` | No | Parte de la PK + FK `FK_UsuarioModuloPermisos_Modulos` → [[db-table-modulos]] |
| `PermisoId` | `int` | No | Parte de la PK + FK `FK_UsuarioModuloPermisos_Permisos` → [[db-table-permisos]] |

Navegaciones: `Usuario`, `Modulo`, `Permiso` (las tres requeridas).

**No hay columna `Id`.** La PK es compuesta y el orden declarado en EF es exactamente:

```csharp
// Backend/Data/UserAccessDbContext.cs:151
entity.HasKey(e => new { e.UsuarioId, e.ModuloId, e.PermisoId });
```

Ese orden define el índice agrupado (si la PK es clustered, lo habitual por defecto), lo que hace eficientes las búsquedas por `UsuarioId` y por `(UsuarioId, ModuloId)` — las dos que usa la aplicación — y **ineficientes** las búsquedas por `ModuloId` o `PermisoId` sueltos, que requieren recorrido completo. No hay índices secundarios declarados. Las comprobaciones de autorización filtran por `UsuarioId = @actorId AND ModuloId = 1`, que sí aprovechan el prefijo de la clave.

**No tiene columna `Activo`**, ni fechas, ni identificador de quién concedió el acceso: no hay auditoría de permisos. Revocar es borrar la fila.

Semántica exacta: **una fila = un permiso concedido a un usuario sobre un módulo**. Varios permisos sobre el mismo módulo requieren varias filas. La PK impide duplicar exactamente la misma tripleta y permite repetir `(UsuarioId, ModuloId)` con distinto `PermisoId`.

## Operaciones SQL

| Flujo | SQL | Transacción | Ubicación |
| --- | --- | --- | --- |
| Login (`GetAccess`) | `SELECT` con `JOIN` a módulo, área y permiso | No | `UserAccessRepository.cs:61-83` |
| Comprobación de autorización (×4) | `SELECT EXISTS` con `JOIN` a usuario, módulo, área y permiso | Dentro de la transacción en la baja; **fuera** en los otros tres | `UserAccessRepository.cs:149-152, 220-223, 239-242, 310-313` |
| Lectura para administrar permisos | `SELECT` con `Include` desde `Usuarios` | No | `UserAccessRepository.cs:299-306` |
| Aprobación de solicitud | `INSERT` (n filas) | **Sí** | `UserAccessRepository.cs:278-289` |
| Actualización de permisos | `DELETE` de todas las filas del usuario + `INSERT` de las nuevas | **Sí** | `UserAccessRepository.cs:326-343` |
| Baja de usuario | `DELETE` de todas las filas del usuario | **Sí**, `Serializable` | `UserAccessRepository.cs:192-195` |

Es la tabla con más escrituras del esquema y la única que se borra en masa.

### Las asignaciones iniciales del seed están mal

`DataBase/scripts/Init.sql` inserta asignaciones para tres cuentas, con tres defectos verificados (detalle en [[db-scripts-and-migrations]]):

- La cuenta de tipo `super_admin` recibe los cuatro permisos sobre los módulos **4, 2 y 3**, pero **no sobre el `ModuloId = 1`**, pese a que el comentario del script afirma lo contrario (línea 362). Como toda la autorización de escritura exige `editar`/`crear` sobre `ModuloId == 1`, esa cuenta obtiene 403 en los cuatro endpoints de administración de cuentas.
- Una de las cuentas recibe asignaciones sobre `ModuloId = 1002`, que no existe: viola `FK_UsuarioModuloPermisos_Modulos` (error 547) y, al no haber transacción, deja esa cuenta creada sin ninguna asignación.
- Las asignaciones de la primera cuenta usan el literal `1` como `UsuarioId` en lugar de la variable `@UsuarioId` calculada con `SCOPE_IDENTITY()`.

### El login no filtra `Activo` de módulo ni de área

```csharp
// Backend/Models/Repositories/UserAccessRepository.cs:63-68
var permisos = await _context.UsuarioModuloPermisos
    .Include(ump => ump.Modulo)
        .ThenInclude(m => m.Area)
    .Include(ump => ump.Permiso)
    .Where(ump => ump.UsuarioId == usuarioId)
    .ToListAsync();
```

El único filtro es `UsuarioId`. El agrupamiento posterior (líneas 70-82) ocurre **en memoria**, no en SQL. Dos consecuencias:

1. Módulos y áreas inactivos **sí** entran en el JSON de `accesos` del login, mientras el catálogo que resuelve sus nombres **sí** los filtra. Ver [[db-table-modulos]] y [[db-table-areas]].
2. La consulta se ejecuta **con seguimiento de cambios** (no usa `AsNoTracking`) y materializa todas las filas con sus tres entidades relacionadas para luego agruparlas en el cliente. Para un usuario con muchas asignaciones es trabajo innecesario en el `ChangeTracker`. Ver [[db-findings]].

### Actualización de permisos: borrar todo y reinsertar, en una transacción

```mermaid
sequenceDiagram
    participant R as UserAccessRepository
    participant DB as SQL Server
    R->>DB: EXISTS: permiso 'editar' del actor en ModuloId 1
    Note over R,DB: la comprobación ocurre ANTES de abrir la transacción
    R->>DB: BEGIN TRANSACTION (aislamiento por defecto)
    R->>DB: SELECT de Usuarios con Include de la tabla puente
    Note over R: si el usuario no existe o no está Activo, se devuelve not_found;<br/>la transacción se deshace al liberarse el recurso
    R->>DB: DELETE de todas las filas del usuario
    R->>DB: INSERT de las filas nuevas
    R->>DB: UPDATE de Usuarios.TipoId
    Note over R,DB: un solo SaveChangesAsync: EF ordena los DELETE antes de los INSERT
    R->>DB: COMMIT
```

Detalles verificados de `UpdateUserPermissionsTransactionAsync` (líneas 308-349):

- **Sustitución total**, no diferencial: `RemoveRange(usuario.UsuarioModuloPermisos)` elimina todo y después se insertan las selecciones recibidas. Una petición con lista vacía deja al usuario **sin ningún acceso**; nada lo impide.
- **Un único `SaveChangesAsync`** contiene los `DELETE`, los `INSERT` y el `UPDATE` de `TipoId`. EF Core ordena los `DELETE` antes de los `INSERT`, por lo que reinsertar una tripleta idéntica no viola la PK.
- **No valida que `ModuloId` ni `PermisoId` existan.** Una petición con identificadores inexistentes provoca violación de FK (error 547) que **no está capturada específicamente** en este endpoint (`PlatformControler.cs:172-176`) y termina en HTTP 500.
- **No valida duplicados en la petición.** Dos veces el mismo `(ModuloId, PermisoId)` en el cuerpo provoca violación de PK (error 2627), tampoco capturada aquí → HTTP 500. En el flujo de aprobación sí se captura (`PlatformControler.cs:122`) y responde 409.
- **No impide que el actor se quite sus propios permisos.** Nada excluye `userId == actorId`: un administrador puede dejarse sin `editar` en el módulo 1 y perder de forma irreversible la capacidad de restaurarlo. Si es el único con ese permiso, **el sistema queda sin administradores** y solo se recupera con acceso directo a SQL. Ver [[db-findings]].
- Exige `usuario.Activo`; si el usuario no existe o está inactivo devuelve `not_found`.
- **No hay auditoría**: nada registra qué permisos había antes.

### Aprobación: inserción sin validación previa

`ApproveUserTransactionAsync` (líneas 278-289) recorre `request.Permisos` y por cada `ModuloId` inserta una fila por cada `PermisoId`. No comprueba existencia de módulo ni permiso, ni que el módulo pertenezca a un área activa, ni duplicados. Las violaciones de FK/PK se capturan en el controlador y se traducen a HTTP 409, dentro de una transacción que se deshace: no quedan usuarios a medio crear. Ver [[db-queries-by-feature]].

### Las transacciones se deshacen implícitamente

Los tres métodos transaccionales usan `await using var transaction = ...` y **ninguno llama a `RollbackAsync`**. Los retornos tempranos (`forbidden`, `not_found`, `conflict`) dejan la transacción abierta y confían en que su liberación la deshaga. Funciona — es el comportamiento documentado de `DbTransaction.Dispose` —, pero es implícito y frágil ante refactorizaciones. En la baja, además, la comprobación de permisos está **dentro** de la transacción `Serializable`, así que un 403 abre y deshace una transacción serializable inútilmente.

## Enlaces

- [[db-table-usuarios]] · [[db-table-modulos]] · [[db-table-permisos]] — las tres tablas padre
- [[db-table-tipo-usuario]] — se actualiza en el mismo flujo de permisos
- [[db-table-solicitud-usuarios]] — origen de las asignaciones iniciales al aprobar
- [[db-relationships]] · [[db-queries-by-feature]] · [[db-schema-acceso-usuario]] · [[db-findings]] · [[db-index]]
- Backend: [[be-repository]] · [[be-api-reference]] · [[be-auth-session]] · [[be-dbcontext-entities]]
- Frontend: [[fe-templates-areas-modules]] · [[fe-interfaces]]
