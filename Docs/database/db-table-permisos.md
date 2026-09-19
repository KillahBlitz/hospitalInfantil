---
title: "Tabla acceso_usuario.Permisos"
tags: [database, tabla, catalogo, permisos, acceso-usuario]
updated: 2026-09-18
---

# `acceso_usuario.Permisos`

Entidad `Permiso` · DbSet `Permisos` · Mapeo en `Backend/Data/UserAccessDbContext.cs:58-68` · Entidad en `Backend/Models/Schemas/UserAccess/Permiso.cs`

Catálogo de permisos asignables. Es el catálogo más pequeño y, a la vez, el que **gobierna la autorización real del servidor**.

## Columnas

| Columna | Tipo SQL inferido | Nulable | Default | Restricción / propósito |
| --- | --- | --- | --- | --- |
| `Id` | `int` | No | IDENTITY (convención) | PK por convención; es lo que viaja en el JSON de `accesos` |
| `Nombre` | `varchar(15)` | No | — | Único: `UQ_Permisos_Nombre` (línea 62). `IsUnicode(false)` (línea 67). **De este texto depende la autorización** |
| `Descripcion` | `nvarchar(150)` | No | — | Requerida (C# `string` con `= null!`); ningún endpoint la devuelve |

Navegación: `UsuarioModuloPermisos` (colección).

Ausencias relevantes:

- **No tiene columna `Activo`.** No se puede desactivar un permiso: solo borrar la fila, lo que exigiría borrar antes todas sus asignaciones (ver `ClientSetNull` en [[db-relationships]]).
- **No tiene nivel, orden, peso ni padre.** No hay jerarquía: nada en el esquema dice que "editar" implique "ver".
- **No está ligado a módulos ni áreas.** Cualquier `PermisoId` puede asignarse a cualquier `ModuloId`.

## Operaciones SQL

| Método | SQL | Filtro | Seguimiento | Ubicación |
| --- | --- | --- | --- | --- |
| `GetPermisos()` | `SELECT` | **Ninguno**: devuelve todas las filas | Con seguimiento | `UserAccessRepository.cs:108-114` |
| `GetAccess(usuarioId)` | `JOIN` vía `Include(Permiso)` | — | Con seguimiento | `UserAccessRepository.cs:66` |
| Comprobaciones de permiso | `EXISTS` con `JOIN` y `LOWER(LTRIM(RTRIM(Nombre))) = 'editar' \| 'crear'` | — | — | `UserAccessRepository.cs:152, 223, 242, 313` |

**No existe ninguna escritura.** Catálogo de sólo lectura para la aplicación, poblado a mano en SQL.

## Filas según el seed de `Init.sql`

`DataBase/scripts/Init.sql:207-225` inserta cuatro permisos en un único `INSERT` de varias filas. Los `Id` se **deducen del orden de los `VALUES`** sobre `IDENTITY(1,1)`; formalmente ese orden no está garantizado, aunque en la práctica se respeta. El script no está versionado ([[db-scripts-and-migrations]]).

| `Id` probable | `Nombre` | ¿Lo usa el código? |
| --- | --- | --- |
| 1 | `ver` | El frontend lo fuerza y deshabilita al construir asignaciones nuevas; el backend no lo comprueba |
| 2 | `editar` | **Sí**: aprobación, baja y actualización de permisos |
| 3 | `crear` | **Sí**: edición de comentarios de solicitud; el frontend muestra el botón de chat |
| 4 | `eliminar` | **No**: no aparece en ninguna comprobación del backend ni del frontend. Asignable sin efecto |

Consecuencias:

- **Los literales del servidor encuentran sus filas**: existen `editar` y `crear`, que son los que buscan las cuatro comprobaciones `EXISTS`. El riesgo de renombrado descrito abajo sigue vigente, pero no está materializado.
- **La regla "Ver es el permiso 1" queda respaldada** por el orden del seed. Esa regla vivía solo en el frontend; ahora hay un catálogo coherente con ella, aunque el esquema siga sin garantizarla.

`GET /Auth/access` expone el catálogo completo sin autenticación (`Backend/Controllers/AuthController.cs:66-67`). Ese endpoint devuelve el mapa `{ idPermiso: nombrePermiso }` (`AuthHandler.cs:107-116`) y es catálogo, **no** los permisos de la sesión.

## El `Nombre` es la clave real de la autorización

Los cuatro métodos que escriben datos comparan el **texto** del permiso, no su `Id`:

```csharp
access.Permiso.Nombre.Trim().ToLower() == "editar"   // baja, aprobación, permisos
access.Permiso.Nombre.Trim().ToLower() == "crear"    // comentarios de solicitud
```

Y el frontend hace la operación inversa: resuelve los `Id` que recibe en `module.permisos` contra el catálogo `catalogs.access` y compara los nombres normalizados para decidir qué botones muestra (ver [[fe-templates-areas-modules]]).

Consecuencias verificadas:

| Cambio en `Permisos` | Efecto |
| --- | --- |
| `UPDATE Permisos SET Nombre = 'modificar' WHERE Nombre = 'editar'` | Nadie puede aprobar, dar de baja ni cambiar permisos: 403 para todos, sin error de compilación ni de ejecución. El frontend además deja de mostrar los botones |
| Insertar un segundo permiso con nombre parecido (`Editar ` con espacio) | Rechazado o aceptado según la collation y el `UQ_Permisos_Nombre`; si se acepta, el `Trim().ToLower()` del servidor lo trataría como equivalente a `editar`, concediendo privilegios por una fila duplicada. La unicidad de SQL con collation `CI` sí bloquearía `Editar`, pero **no** una variante con espacios, porque el índice no aplica `TRIM` |
| Cambiar el `Id` de `editar` | No afecta a la autorización del servidor (que usa el nombre), pero **invalida todas las filas de la tabla puente** que apuntaban al `Id` viejo |

Diseño frágil por partida doble: el servidor autoriza por nombre y el frontend por nombre resuelto desde `Id`, mientras la tabla puente almacena `Id`. Tres representaciones del mismo concepto. Ver [[db-findings]].

**No tratar los identificadores del seed como certeza.** Los valores de la tabla anterior se deducen del orden de inserción de un script **no versionado**, no de una consulta a la base. Que la instancia conectada tenga esos `Id` y esos nombres **no es verificable desde el repositorio**. Lo único que el código exige es que existan filas cuyos nombres normalizados sean `editar` y `crear`.

Nota sobre la regla "Ver": `.agent/MEMORY.md` y el frontend tratan el permiso con `Id = 1` como "Ver", forzado y deshabilitado al construir asignaciones nuevas. Esa regla **no la impone el esquema**: ninguna restricción marca un permiso como obligatorio, y el backend acepta conjuntos de permisos que no lo incluyan (`ApproveUserRequest.Permisos` no se valida contra ninguna regla; `UserAccessRepository.cs:278-289`). El seed es coherente con ella por el orden de inserción, no por diseño de la base.

## Cuidado con `varchar(15)`

`Nombre` admite como máximo 15 caracteres no Unicode. Un nombre de permiso más largo se trunca o falla al insertar, según la configuración de SQL Server. Ningún DTO valida esa longitud porque ningún endpoint escribe en esta tabla, pero conviene saberlo al poblar el catálogo a mano.

## Enlaces

- [[db-table-usuario-modulo-permisos]] — donde se usan estos `Id`
- [[db-table-modulos]] — el otro eje de la asignación; también acoplado por su `Id`
- [[db-relationships]] — cómo autoriza el servidor
- [[db-queries-by-feature]] · [[db-schema-acceso-usuario]] · [[db-findings]] · [[db-index]]
- Backend: [[be-repository]] · [[be-api-reference]] · [[be-auth-session]] · [[be-dbcontext-entities]]
- Frontend: [[fe-templates-areas-modules]] · [[fe-interfaces]]
