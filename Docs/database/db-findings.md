---
title: "Hallazgos, riesgos y deuda de la capa de datos"
tags: [database, hallazgos, riesgos, deuda-tecnica]
updated: 2026-09-18
---

# Hallazgos, riesgos y deuda de la capa de datos

Volver al índice: [[db-index]]

Todos los hallazgos se derivan de la **lectura del código del 2026-09-18**. No se ejecutó ninguna consulta contra la base de datos real, no se intentó ninguna conexión y no hay evidencia de explotación, corrupción de datos ni fallo en producción: son consecuencias deducidas del código.

> **Nota**: los hallazgos 25 a 29 provienen de `DataBase/scripts/Init.sql`, un script de creación y seed que apareció en el árbol de trabajo durante la redacción de esta bóveda y que **no está versionado en Git**. Describe una intención de aprovisionamiento; no certifica el estado de la instancia conectada. Ver [[db-scripts-and-migrations]].

## Resumen priorizado

| # | Prioridad | Hallazgo | Nuevo respecto a `.agent/CONTEXT.md` |
| --- | --- | --- | --- |
| 1 | **Crítica** | La "desactivación" de usuarios **borra físicamente** la fila de `Usuarios` | **Sí** |
| 2 | **Crítica** | La base de datos no se puede recrear desde el repositorio; `comentario` es deriva de esquema sin script | Parcialmente |
| 25 | **Crítica** | Según el seed, la cuenta `super_admin` **no tiene permisos sobre `ModuloId = 1`**: nadie puede administrar cuentas | **Sí** |
| 26 | **Crítica** | `Init.sql` contiene un hash BCrypt real reutilizado en 3 cuentas y datos personales reales, a un `git add` de entrar en el historial | **Sí** |
| 27 | **Alta** | `SolicitudUsuarios` se crea **sin clave primaria**, mientras EF declara una | **Sí** |
| 28 | **Alta** | El `MODULE_REGISTRY` del frontend está desalineado con los `Modulos.Id` del seed: 3 de 4 módulos abren el componente equivocado | **Sí** |
| 29 | Media | `Init.sql` no es transaccional ni idempotente, y contiene un `ModuloId` inexistente que hace fallar un lote | **Sí** |
| 3 | **Crítica** | Contraseña de `sa` literal en un archivo versionado | No, pero sigue vigente |
| 4 | **Crítica** | Cambio de contraseña sin prueba de titularidad, escribiendo `PasswordHash` | No |
| 5 | **Alta** | Endpoints de lectura de datos personales **sin `[Authorize]`**, mientras los de escritura sí lo llevan | **Sí** (asimetría nueva) |
| 6 | **Alta** | `ModuloId == 1` escrito a mano en la capa de datos gobierna toda la autorización | **Sí** |
| 7 | **Alta** | La autorización depende del **texto** de `Permisos.Nombre` | **Sí** |
| 8 | **Alta** | Arranque en frío imposible: no hay primer administrador ni seed | **Sí** |
| 9 | **Alta** | La comprobación de duplicados del registro sigue ignorando `Usuarios` (bug `\|\|` duplicado) | No |
| 10 | Media | La actualización de permisos puede dejar al sistema sin administradores | **Sí** |
| 11 | Media | `SolicitudUsuarios` mezcla tres poblaciones distinguibles solo por un texto libre | **Sí** |
| 12 | Media | Errata almacenada en los datos: `"usario previamente registrado"` | **Sí** |
| 13 | Media | Sin auditoría de ningún tipo en todo el esquema | Ampliado |
| 14 | Media | Sin paginación, sin orden estable y con filtrado en cliente | No |
| 15 | Media | Hashes de contraseña duplicados en dos tablas | **Sí** |
| 16 | Media | Asimetría del filtro `Activo` entre login, catálogos y autorización | Ampliado |
| 17 | Media | `TipoUsuario.NivelUsuario` sin índice único rompe `GET /Auth/userTypes` | **Sí** |
| 18 | Media | Nombres de área y `Modulos.Id` acoplados al frontend | No |
| 19 | Baja | `AsNoTracking` en un solo método de 17; catálogos con seguimiento | Ampliado |
| 20 | Baja | Sin `CancellationToken` en 13 de 17 métodos | Ampliado |
| 21 | Baja | Transacciones sin `RollbackAsync` explícito y con aislamiento inconsistente | **Sí** |
| 22 | Baja | Sin índices sobre las columnas FK; comparaciones no-sargables | **Sí** |
| 23 | Baja | Nombres y apellidos en `varchar` no Unicode; límites UI/DTO/SQL distintos | Ampliado |
| 24 | Baja | Código muerto: `GetAreasById` sin llamadores; `Usuarios.Activo` sin escritor | Ampliado |

## Detalle

### 1. La baja borra la fila: `Activo` nunca se escribe · Crítica

`UserAccessRepository.cs:141-202`. `DeactivateUser` copia los datos del usuario a `SolicitudUsuarios`, borra sus filas de la tabla puente y ejecuta `_context.Usuarios.Remove(usuario)`.

Impacto:

- **Pérdida irreversible de datos** sin copia de seguridad: no hay borrado lógico, ni tabla histórica, ni forma de revertir.
- **Se pierde el `Id`**: ninguna referencia externa (histórica, de auditoría futura, de otro módulo) puede resolverse. Una reincorporación produce un `Id` nuevo.
- **`Usuarios.Activo` es efectivamente código muerto**: ninguna ruta lo pone a `0`, así que los filtros `Activo` del login y de las comprobaciones de permiso nunca descartan nada.
- **Tokens colgantes**: el bearer token lleva el `Id` en la claim y vive 8 horas sin validarse contra la base (`Backend/Program.cs:33`, `Backend/Handlers/SessionTokenService.cs`). Tras una baja, ese token sigue siendo válido apuntando a un usuario inexistente; las escrituras fallarán por falta de permisos, pero los endpoints de lectura sin `[Authorize]` seguirán respondiendo (ver #5).
- **Inconsistencia de interfaz**: el frontend muestra "Desactivar" deshabilitado para cuentas con `Activo = false`, un estado que la aplicación nunca produce.

Detalle en [[db-table-usuarios]] y [[db-queries-by-feature]].

### 2. La base no se puede recrear; `comentario` es deriva de esquema · Crítica

Sin migraciones EF, sin script de creación, sin seed y sin `Database.Migrate()`. `DataBase/scripts/` está vacía y nunca fue versionada.

El caso agudo: `SolicitudUsuarios.comentario` está mapeada en `UserAccessDbContext.cs:76-78` y se proyecta en la API, pero **nada en el repositorio la crea**. En una base creada de cero, toda consulta a `SolicitudUsuarios` falla con "Invalid column name". El script que la habría creado, documentado en `.agent/CONTEXT.md` §15, no existe ni en el historial de Git.

Agravantes: el volumen `sqlserver_data` es el único almacén y no hay copia de seguridad; el CI/CD no despliega `DataBase/` ni aplica cambios de esquema. Detalle en [[db-scripts-and-migrations]] y [[db-infrastructure]].

### 3. Contraseña de `sa` versionada · Crítica

`DataBase/docker-compose.yml:8` contiene `MSSQL_SA_PASSWORD` con valor literal, en un patrón trivial de adivinar. Tratar como credencial comprometida: rotar en la instancia real y externalizar. Rotar no la elimina del historial de Git. Detalle en [[db-infrastructure]].

### 4. Cambio de contraseña sin prueba de titularidad · Crítica

`POST /Auth/changePassword` no lleva `[Authorize]` (`Backend/Controllers/AuthController.cs:38-39`), no envía correo, no usa token temporal y no pide la contraseña anterior. Conocer un correo registrado basta para intentar sustituir su `PasswordHash` (`UserAccessRepository.cs:204-216`). Además devuelve el booleano crudo, lo que permite **enumerar correos registrados**. El `UPDATE` reescribe todas las columnas de la fila por usar `Update(entidad)`. Detalle en [[db-table-usuarios]].

### 5. Lecturas de datos personales sin autorización · Alta

Asimetría nueva y llamativa. Los cinco endpoints de **escritura** de `PlatformController` llevan `[Authorize]` y comprueban permisos en la base. Los dos de **lectura** no llevan nada:

```csharp
// Backend/Controllers/PlatformControler.cs:24 y 31
[HttpGet("Users")]        // sin [Authorize]
[HttpGet("UserRequest")]  // sin [Authorize]
```

Cualquiera con acceso de red descarga la lista completa de usuarios registrados (nombre, apellidos, fecha de nacimiento, sexo, alias, correo, tipo, estado) y de solicitudes (nombre, apellidos, correo, usuario, fecha, aprobado, comentario). Los DTO excluyen `PasswordHash`, pero son datos personales de un hospital. Los seis endpoints de `AuthController` (incluidos los cuatro catálogos) también son públicos. Ver [[db-queries-by-feature]] y [[be-api-reference]].

### 6. `ModuloId == 1` escrito a mano en la capa de datos · Alta

Cuatro veces en el repositorio (`UserAccessRepository.cs:151, 222, 241, 312`), con un comentario que reconoce que el valor viene del `MODULE_REGISTRY` del frontend. Un identificador de fila de catálogo, no controlado por el repositorio, gobierna **toda** la autorización de escritura.

| Si en la base real… | Entonces… |
| --- | --- |
| el módulo de cuentas no tiene `Id = 1` | nadie puede aprobar, dar de baja ni comentar: 403 permanente pese a los permisos correctos |
| otro módulo, de cualquier área, tiene `Id = 1` | quien tenga `editar` en **ese** módulo puede aprobar y borrar usuarios: **escalada de privilegios entre áreas** |

Que el `Id` 1 sea el módulo correcto **no es verificable desde el repositorio**. Detalle en [[db-table-modulos]].

### 7. La autorización depende del texto de `Permisos.Nombre` · Alta

`LOWER(LTRIM(RTRIM(Permisos.Nombre))) = 'editar'` / `'crear'`. Un `UPDATE` de esa columna desactiva silenciosamente las escrituras del sistema. El seed de `Init.sql` **sí** inserta filas `editar` y `crear` (junto a `ver` y `eliminar`), así que hoy los literales encuentran su fila; la fragilidad persiste. Además, al aplicar funciones sobre la columna, la comparación es no-sargable e ignora `UQ_Permisos_Nombre`. El mismo concepto se representa de tres formas distintas: `Id` en la tabla puente, `Nombre` en el servidor, `Id → Nombre` en el frontend. Detalle en [[db-table-permisos]].

### 8. Arranque en frío imposible · Alta

Aprobar una solicitud exige que el actor ya tenga `editar` sobre `ModuloId 1`. **No existe ninguna vía de crear el primer administrador desde la aplicación**: hace falta insertar a mano en SQL el usuario, su tipo y sus asignaciones.

`DataBase/scripts/Init.sql` intenta cubrir este paso creando catálogos y tres cuentas iniciales, pero **no lo resuelve**: le falta `CREATE DATABASE`, le falta la columna `comentario`, y sobre todo su cuenta `super_admin` no recibe permisos sobre `ModuloId = 1` (ver #25). Un entorno levantado con ese script sigue sin poder administrar cuentas. Detalle en [[db-scripts-and-migrations]].

### 9. Comprobación de duplicados del registro defectuosa · Alta

`UserAccessRepository.cs:31`: `if (usuarioPeticion != null || usuarioPeticion != null)`. La misma variable dos veces; el resultado de la consulta a `Usuarios` se descarta y esa consulta se ejecuta inútilmente. Además usa `&&` (alias **y** correo) frente al `||` de la consulta de solicitudes.

Efecto: se puede solicitar acceso con el alias o el correo de una cuenta existente. La solicitud se inserta (los índices únicos son por tabla) y el conflicto aparece al aprobar, donde `ApproveUserTransactionAsync` sí comprueba correctamente (líneas 253-254) y devuelve `conflict`. **La solicitud queda atascada de forma permanente: no se puede aprobar y no existe operación de rechazo ni de borrado.** Detalle en [[db-queries-by-feature]].

### 10. Quedarse sin administradores · Media

`UpdateUserPermissionsTransactionAsync` (líneas 308-349) sustituye **todas** las asignaciones del usuario por las recibidas, sin excluir el caso `userId == actorId` y sin exigir un mínimo. Un administrador puede quitarse su propio `editar` sobre el módulo 1; si era el único, la capacidad de administrar cuentas se pierde de forma irreversible desde la aplicación y solo se recupera con acceso directo a SQL. Una lista de permisos vacía es válida. Detalle en [[db-table-usuario-modulo-permisos]].

### 11. `SolicitudUsuarios` mezcla tres poblaciones · Media

Desde que la baja escribe en esta tabla, contiene: solicitudes nuevas pendientes (`Aprobado = 0`, `comentario` `NULL`), solicitudes ya aprobadas (`Aprobado = 1`) y personas dadas de baja (`Aprobado = 0`, comentario con el literal fijo). **Ninguna columna distingue la tercera de la primera**: el único discriminador es el texto del comentario, un campo libre editable por cualquiera con permiso `crear`. Un estado de negocio depende de una cadena de texto modificable. `GET /Platform/UserRequest` las devuelve todas mezcladas y sin orden. Detalle en [[db-table-solicitud-usuarios]].

### 12. Errata almacenada en los datos · Media

`UserAccessRepository.cs:188`: `solicitud.Comentario = "usario previamente registrado";` — falta la `u`. Al ser un valor escrito en la base, corregir el código no corrige las filas ya guardadas: hará falta un `UPDATE` de saneamiento. Si además se usa como discriminador (ver #11), cambiar el literal rompe cualquier consulta que lo busque.

### 13. Sin auditoría en todo el esquema · Media

Ninguna tabla registra quién creó, modificó, aprobó, dio de baja o cambió permisos, ni cuándo. Concretamente no se guarda: fecha de aprobación, identificador del aprobador, fecha de baja, quién dio de baja, permisos anteriores a un cambio, fecha de cambio de contraseña ni último acceso. El `actorId` se usa para autorizar y se descarta. `Usuarios.FechaIngreso` se copia de la solicitud, así que **ni siquiera la fecha de alta real de una cuenta existe**. Para un sistema que gestiona accesos en un hospital, es la carencia funcional más importante. Ver [[db-relationships]].

### 14. Sin paginación ni orden estable · Media

`GetAllUsersRequest` devuelve la tabla completa **sin `ORDER BY`** (el orden puede variar entre ejecuciones y la lista "salta" en la interfaz). `GetAllRegisteredUsers` ordena pero tampoco pagina. El filtrado por nombre y correo es **totalmente del cliente**: la API transfiere todas las filas para mostrar unas pocas. El coste crece linealmente con el número de cuentas, y cada respuesta expone el censo completo a quien la pida (ver #5).

### 15. Hashes de contraseña duplicados · Media

`PasswordHash` existe en `Usuarios` y en `SolicitudUsuarios`. La aprobación copia el hash y **no borra el de la solicitud**, así que queda en las dos. La baja lo copia de vuelta y persiste en solicitudes tras el borrado de la cuenta. Resultado: los hashes de credenciales de personas ya dadas de baja permanecen indefinidamente en una tabla que nadie purga. Duplicar material de credenciales multiplica la superficie de exposición y complica cualquier política de retención. Ver [[db-table-solicitud-usuarios]].

### 16. Asimetría del filtro `Activo` · Media

| Consulta | ¿Filtra `Usuario.Activo`? | ¿`Modulo.Activo`? | ¿`Area.Activo`? |
| --- | --- | --- | --- |
| Login (`GetUserAuth`) | **Sí** | — | — |
| Accesos del login (`GetAccess`) | — | **No** | **No** |
| Catálogo de módulos (`GetModulos`) | — | **Sí** | **No** |
| Catálogo de áreas (`GetAreas`) | — | — | **Sí** |
| Comprobaciones de permiso | **Sí** | **Sí** | **Sí** |
| Cambio de contraseña (`GetUserByEmail`) | **No** | — | — |
| Listado de usuarios | **No** (intencionado) | — | — |

Efecto de desactivar un área o un módulo: la pestaña **sigue apareciendo** (viene del JSON de accesos, que no filtra), su nombre puede quedar indefinido (el catálogo sí filtra) y todas las escrituras quedan denegadas (las comprobaciones sí filtran). Desactivar el área Plataforma o el módulo 1 bloquearía a todos los administradores de cuentas sin quitarles la pestaña. Ver [[db-table-areas]] y [[db-table-modulos]].

### 17. `NivelUsuario` sin índice único rompe un endpoint · Media

`TipoUsuario.NivelUsuario` no tiene índice único (a diferencia de `Areas.Nombre` y `Permisos.Nombre`), pero `AuthHandler.cs:91` lo usa como **clave de diccionario**. Dos filas con el mismo nivel hacen que `Dictionary.Add` lance `ArgumentException` → HTTP 500 en `GET /Auth/userTypes`, lo que impide elegir tipo al aprobar usuarios. Es un defecto de integridad de datos que se manifiesta como caída de API. Detalle en [[db-table-tipo-usuario]].

### 18. Nombres de área y `Modulos.Id` acoplados al frontend · Media

`Areas.Nombre` es la clave del `TEMPLATE_REGISTRY` y `Modulos.Id` la del `MODULE_REGISTRY`. Un `UPDATE` de un nombre de área (incluso añadir un espacio) deja el área sin vista; reordenar identificadores de módulo renderiza componentes equivocados. El JSON de accesos agrupa por nombre de área, no por `Id`, lo que convierte una columna de texto en clave de integración. Ver [[db-table-areas]], [[db-table-modulos]] y [[fe-templates-areas-modules]].

### 19. `AsNoTracking` en 1 de 17 métodos · Baja

Solo `GetAllRegisteredUsers` (línea 134). Los cinco catálogos de sólo lectura, el listado de solicitudes, `GetAccess` y `GetUserPermissionsAdminAsync` cargan el `ChangeTracker` sin necesidad. `GetUserPermissionsAdminAsync` además materializa la entidad `Usuario` completa (con `PasswordHash`) cuando el handler solo proyecta permisos: una proyección habría evitado leer la columna sensible.

### 20. Sin `CancellationToken` en la mayoría de consultas · Baja

Lo aceptan los cuatro métodos nuevos. Los trece originales, incluidos los dos listados completos sin paginación, no lo propagan: una petición HTTP abandonada por el cliente deja su consulta ejecutándose hasta el final.

### 21. Transacciones inconsistentes · Baja

- Ninguna de las tres llama a `RollbackAsync`: se confía en la liberación del recurso. Funciona, pero es implícito.
- La baja usa `Serializable` y comprueba permisos **dentro** de la transacción; aprobación y permisos usan el aislamiento por defecto y comprueban **fuera**. Dos operaciones equivalentes, dos patrones distintos.
- La baja mantiene bloqueos de rango serializables a lo largo de tres `SaveChangesAsync`, con riesgo real de interbloqueo (el error 1205 está previsto en `PlatformControler.cs:64`).
- El manejo de errores SQL es desigual: aprobación y baja capturan 2601/2627/547, pero la actualización de permisos no, así que un `ModuloId`, `PermisoId` o `TipoId` inexistente o duplicado devuelve HTTP 500 en lugar de 409.

Ver [[db-table-usuario-modulo-permisos]].

### 22. Sin índices sobre las FK; comparaciones no-sargables · Baja

EF declara 7 índices únicos y **ningún** índice no único. SQL Server no indexa automáticamente las columnas FK, así que no hay índice sobre `Usuarios.TipoId`, ni sobre `UsuarioModuloPermisos.ModuloId`/`PermisoId` de forma utilizable (la PK compuesta solo sirve como prefijo desde `UsuarioId`). Las comprobaciones de permiso filtran por `UsuarioId` + `ModuloId`, que sí aprovechan el prefijo. El problema aparecería en consultas por módulo o por permiso, que hoy no existen. Añádase el `LOWER(LTRIM(RTRIM(...)))` sobre `Permisos.Nombre`, no-sargable. Con catálogos pequeños el coste es despreciable: se documenta por corrección, no por rendimiento actual.

### 23. Tipos y límites incoherentes · Baja

- **`varchar` no Unicode** para `Nombre`, `ApellidoPaterno`, `ApellidoMaterno`, `Sexo`, `Alias`/`Username`, frente a `nvarchar` para `Correo` y `PasswordHash`. Un apellido con caracteres fuera de la code page de la collation puede almacenarse con pérdida.
- **Límites distintos en tres capas**: la interfaz admite nombres de 50 y apellidos de 25; el DTO no valida longitud; las columnas son `varchar(30)` y `varchar(20)`. Un valor demasiado largo produce un error de truncamiento en SQL, no un 400 con mensaje.
- `DateOnly.ParseExact` sin `try/catch` en `AuthHandler.cs:61`: una fecha con otro formato produce HTTP 500.
- `Sexo` es `varchar(1)` sin CHECK declarado; si existe en SQL, **no es verificable desde el repositorio**.
- `comentario` es `nvarchar(max)` y su DTO no declara longitud máxima.
- `NULL` y `''` coexisten como "sin comentario" según el origen de la fila.

### 24. Código muerto en la capa de datos · Baja

- `GetAreasById` (líneas 85-92): **sin ningún llamador**.
- `Usuarios.Activo`: **sin ningún escritor** (ver #1).
- El `SELECT` a `Usuarios` de `GetUserKeyAuth`: se ejecuta y su resultado se descarta (ver #9).
- `HasDefaultValue(true)` en `Areas.Activo`, `Modulos.Activo` y `Usuarios.Activo`: EF trata `false` como "no asignado" y puede omitir la columna, dejando que SQL aplique el default `1`. Hoy no se materializa porque no hay `INSERT` en esos catálogos y el único `INSERT` de `Usuarios` fija `true`, pero es una trampa activa para cualquier código futuro que intente insertar una fila inactiva.

### 25. La cuenta de superadministrador del seed no puede administrar cuentas · Crítica

`DataBase/scripts/Init.sql:362-402`. El comentario del script dice "Asignar los 4 permisos al ModuloId 1", pero las tres sentencias insertan los identificadores literales `4`, `2` y `3`. La cuenta de tipo `super_admin` **no recibe ninguna fila sobre `ModuloId = 1`** (`configuracion de cuentas`).

Como las cuatro comprobaciones de autorización del repositorio exigen `editar`/`crear` sobre `ModuloId == 1` (ver #6), esa cuenta obtiene **403 en los cuatro endpoints de escritura**: aprobar solicitudes, dar de baja, editar comentarios y actualizar permisos. Combinado con #8, el sistema queda sin ninguna vía de administrar cuentas desde la aplicación: solo se recupera insertando filas a mano en `UsuarioModuloPermisos`.

Agravantes del mismo bloque: las asignaciones usan el literal `1` como `UsuarioId` en lugar de la variable `@UsuarioId` que el script calcula con `SCOPE_IDENTITY()` (líneas 359, 371, 384, 397), así que dependen de que esa cuenta sea la primera fila insertada.

Ver [[db-scripts-and-migrations]] y [[db-table-usuario-modulo-permisos]].

### 26. Credenciales y datos personales reales en `Init.sql` · Crítica

El script asigna un **hash BCrypt literal** a la variable `@PasswordHash` y lo reutiliza en las **tres** cuentas que inserta, una de ellas de tipo `super_admin`: una sola contraseña conocida abre las tres. Además contiene nombres y direcciones de correo aparentemente reales, una de un dominio público.

Hoy el archivo **no está versionado** (`git status` lo reporta como `?? DataBase/scripts/`), lo que evita el daño permanente. Pero `.gitignore` solo contiene `.agent/`, así que nada impide que un `git add DataBase/` introduzca el hash y los datos personales en el historial de forma irreversible. Antes de versionar: extraer las credenciales fuera del script, sustituir los datos personales por valores de ejemplo y rotar la contraseña de esas cuentas. Ver [[db-scripts-and-migrations]] y, para la credencial de `sa` que **sí** está versionada, [[db-infrastructure]].

### 27. `SolicitudUsuarios` sin clave primaria en SQL · Alta

`Init.sql:424-438` crea la tabla con `Id INT IDENTITY(1,1) NOT NULL` y solo dos restricciones `UNIQUE`: **no declara `PRIMARY KEY`**. Es la única tabla del esquema sin PK. EF, en cambio, sí declara `HasKey(e => e.Id)` (`Backend/Data/UserAccessDbContext.cs:72`), muy probablemente porque el scaffolding no encontró clave y hubo que añadirla al modelo a mano.

Impacto:

- **EF opera sobre una clave que la base no garantiza.** `FindAsync` funciona porque construye el `WHERE` desde el modelo, pero la unicidad de `Id` no está impuesta.
- Sin PK ni índice sobre `Id`, cada búsqueda y cada `UPDATE` por `Id` (aprobación, edición de comentario) implica recorrido completo de la tabla.
- Con `IDENTITY_INSERT ON` podrían crearse identificadores duplicados, y entonces `FindAsync` devolvería una fila arbitraria.

Si la instancia real recibió después un `ALTER TABLE ... ADD CONSTRAINT PRIMARY KEY`, **no es verificable desde el repositorio**. Ver [[db-table-solicitud-usuarios]].

### 28. `MODULE_REGISTRY` desalineado con los `Modulos.Id` del seed · Alta

Contraste entre el orden de inserción de `Init.sql:259-315` y `Frontend/src/templates/shared/areaTemplate.jsx:8-12`:

| `Modulos.Id` | Módulo del seed | Componente que renderiza el frontend | ¿Correcto? |
| --- | --- | --- | --- |
| 1 | `configuracion de cuentas` (plataforma) | `AccountsModule` | **Sí** |
| 2 | `Administrar Permisos` (plataforma) | `PlacesModule` (plazas) | **No** |
| 3 | `Complemento de Pago` (contabilidad) | `PermitsModule` (permisos) | **No** |
| 4 | `Administrar Plazas` (recursos humanos) | ninguno → "sin contenido" | **No** |

**Tres de cuatro módulos abren el componente equivocado o ninguno.** La pestaña "Administrar Permisos" de Plataforma mostraría la vista de plazas, y la pestaña de plazas de Recursos Humanos aparecería vacía. Es el riesgo #18 materializado, no una hipótesis.

Matización importante: **`Modulos.Id = 1` sí es `configuracion de cuentas` de `plataforma`**, luego el literal `ModuloId == 1` del repositorio (#6) apunta al módulo correcto. El acoplamiento sigue siendo frágil, pero no está desalineado en ese punto concreto.

Los `Id` se deducen del orden de inserción sobre columnas `IDENTITY(1,1)`: no son lecturas de la base. Ver [[db-table-modulos]] y [[fe-templates-areas-modules]].

### 29. `Init.sql` no es transaccional ni idempotente · Media

- **Sin transacción y sin `SET XACT_ABORT ON`**: cualquier lote que falle deja la base a medias. Ya ocurre: el `INSERT` de la línea 543 usa `ModuloId = 1002`, que no existe (solo hay módulos 1 a 4), y viola `FK_UsuarioModuloPermisos_Modulos` (error 547). El usuario `Contab` queda creado **sin ninguna asignación**.
- **Sin comprobaciones de existencia**: reejecutarlo falla en el primer `CREATE SCHEMA`.
- **Falta `CREATE DATABASE`**: empieza con `USE [hospital_infantil]`, así que la base debe existir antes. El Compose no la crea ([[db-infrastructure]]).
- **Falta la columna `comentario`** (ver #2): una base creada con este script rompe toda consulta a `SolicitudUsuarios`.
- **Contiene sentencias `select *` de depuración** (líneas 301, 404-405) y arrastra `ALTER COLUMN` correctivos sobre tablas que acaba de crear (líneas 159-169) en lugar de declarar el estado final.
- Crea tres esquemas (`core`, `recursos_humanos`, `contabilidad`) que quedan **vacíos** y que ninguna entidad EF referencia.

Ver [[db-scripts-and-migrations]].

## Fortalezas que conviene no perder

Para equilibrar: la capa de datos ha mejorado claramente desde el análisis del 2026-09-08.

- **Las tres operaciones multietapa son transaccionales.** La aprobación no puede dejar usuarios a medio crear ni solicitudes marcadas sin cuenta.
- **La autorización se comprueba en el servidor y contra la base**, no confiando en que el frontend haya ocultado un botón. Era el hueco más grave del análisis previo.
- **La detección de conflictos de la baja es cuidadosa**: la bandera `SameIdentity` cubre exactamente el caso que los dos índices únicos independientes no pueden cubrir (`UserAccessRepository.cs:160-169`).
- **Las comparaciones se delegan a SQL**, con un comentario explícito del autor ("Comparar con la collation de SQL, no con una comparación distinta en memoria"): evita la clase de error de comparar en memoria con semántica distinta a la del motor.
- **Los DTO de respuesta nunca exponen `PasswordHash`**, ni en listados ni en la administración de permisos.
- **Los errores SQL específicos se traducen a códigos HTTP** en aprobación y baja (2601/2627/547/1205), en lugar de propagar 500 genéricos.

## Enlaces

- [[db-init-sql]] — origen de los hallazgos 25 a 29
- [[db-index]] · [[db-schema-acceso-usuario]] · [[db-relationships]] · [[db-queries-by-feature]] · [[db-infrastructure]] · [[db-scripts-and-migrations]]
- Tablas: [[db-table-usuarios]] · [[db-table-solicitud-usuarios]] · [[db-table-usuario-modulo-permisos]] · [[db-table-areas]] · [[db-table-modulos]] · [[db-table-permisos]] · [[db-table-tipo-usuario]]
- Backend: [[be-repository]] · [[be-api-reference]] · [[be-auth-session]] · [[be-dbcontext-entities]] · [[be-deployment]] · [[be-index]]
- Frontend: [[fe-templates-areas-modules]] · [[fe-interfaces]] · [[fe-index]]
- Arquitectura: [[architecture-overview]]
