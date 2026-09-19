---
title: "Capa de datos: mapa de contenido"
tags: [database, moc, indice, acceso-usuario]
updated: 2026-09-18
---

# Capa de datos — Mapa de contenido (MOC)

Bóveda de documentación de la **capa de datos** del proyecto Hospital Infantil. Todo lo escrito aquí se verificó contra el código presente en el repositorio el **2026-09-18**, no contra la instancia SQL Server en ejecución: **no se ejecutó ninguna consulta contra la base de datos real** durante esta documentación.

Bóvedas hermanas: [[architecture-overview]] · [[be-index]] · [[fe-index]]

## Cómo leer esta bóveda

1. Empieza por [[db-schema-acceso-usuario]] para la visión general del esquema `acceso_usuario` y su diagrama ER.
2. Consulta [[db-relationships]] para entender la semántica del modelo de accesos (área → módulo → asignación) y qué relaciones **no** existen.
3. Usa las notas de tabla para el detalle columna por columna.
4. Usa [[db-queries-by-feature]] para saber qué SQL ejecuta cada flujo de la aplicación y sobre qué tablas.
5. Revisa [[db-infrastructure]] y [[db-scripts-and-migrations]] para aprovisionamiento.
6. Cierra con [[db-findings]]: riesgos y deuda técnica de esta capa.

## Notas de esquema

| Nota | Contenido |
| --- | --- |
| [[db-schema-acceso-usuario]] | Visión general, inventario de las 7 tablas, diagrama ER, convenciones de tipos |
| [[db-relationships]] | Las 5 claves foráneas, PK compuesta, semántica de accesos, ausencias deliberadas |

## Notas de tabla

| Nota | Tabla SQL | Entidad EF | Rol |
| --- | --- | --- | --- |
| [[db-table-usuarios]] | `acceso_usuario.Usuarios` | `Usuario` | Cuentas operativas; única tabla consultada al iniciar sesión |
| [[db-table-solicitud-usuarios]] | `acceso_usuario.SolicitudUsuarios` | `SolicitudUsuario` | Solicitudes de acceso; **también** destino de las bajas |
| [[db-table-areas]] | `acceso_usuario.Areas` | `Area` | Catálogo de áreas; su `Nombre` es contrato con el frontend |
| [[db-table-modulos]] | `acceso_usuario.Modulos` | `Modulo` | Catálogo de módulos; su `Id` es contrato con el frontend |
| [[db-table-permisos]] | `acceso_usuario.Permisos` | `Permiso` | Catálogo de permisos; su `Nombre` decide la autorización del servidor |
| [[db-table-tipo-usuario]] | `acceso_usuario.TipoUsuario` | `TipoUsuario` | Clasificación de usuarios; sin efecto en autorización |
| [[db-table-usuario-modulo-permisos]] | `acceso_usuario.UsuarioModuloPermisos` | `UsuarioModuloPermiso` | Tabla puente; **única** fuente de accesos efectivos |

## Notas de operación e infraestructura

| Nota | Contenido |
| --- | --- |
| [[db-queries-by-feature]] | Qué lee/escribe cada flujo, qué usa transacción explícita, qué usa `AsNoTracking` |
| [[db-infrastructure]] | Compose de SQL Server, volumen, proxy `nginx_sql`, variables de configuración |
| [[db-scripts-and-migrations]] | Ausencia de migraciones EF, de scripts SQL y de seed; qué implica |
| [[db-init-sql]] | **Análisis completo y anotado de `DataBase/scripts/Init.sql`**: DDL línea a línea frente al mapeo EF, identificadores deducidos del seed, sus 8 defectos y qué haría falta para poder usarlo |
| [[db-findings]] | Hallazgos, riesgos y deuda de la capa de datos con su impacto |

## Fuente de verdad del esquema, hoy

La **única** fuente de verdad **versionada** es el mapeo de Entity Framework Core:

- `Backend/Data/UserAccessDbContext.cs` — mapeo relacional completo (tablas, esquema, longitudes, índices únicos, FK con nombre explícito, valores por defecto).
- `Backend/Models/Schemas/UserAccess/` — 7 clases de entidad con tipos CLR y nulabilidad.

Existe además `DataBase/scripts/Init.sql`, un script de creación de esquemas, tablas y seed de catálogos presente en el árbol de trabajo pero **sin seguimiento en Git**. Apareció mientras se redactaba esta bóveda. Respalda muchos detalles físicos (IDENTITY, nombres de PK, defaults, ausencia de CHECK e índices no únicos) y revela **discrepancias con el mapeo EF**, la más grave que `SolicitudUsuarios` se crea sin clave primaria y que la columna `comentario` no se crea en ningún sitio. Análisis completo y anotado en **[[db-init-sql]]**; su lugar entre los artefactos de aprovisionamiento, en [[db-scripts-and-migrations]].

Los hechos derivados del mapeo EF son **inferencias sobre el SQL físico**, no una lectura de `INFORMATION_SCHEMA`; y los derivados de `Init.sql` describen una intención de aprovisionamiento, no el estado certificado de la instancia conectada. Collation, triggers, índices añadidos fuera de esos artefactos y los identificadores reales de los catálogos **no son verificables desde el repositorio**.

Detalle del mapeo desde la perspectiva del backend: [[be-dbcontext-entities]].

## Aviso sobre `.agent/CONTEXT.md`

`.agent/CONTEXT.md` (análisis del 2026-09-08) se usó como pista. Varias de sus afirmaciones **ya no son ciertas** en el código actual. Las divergencias confirmadas están registradas en [[db-findings]]; las más relevantes:

- La baja de usuarios **no** es un cambio de `Activo`: **borra la fila** de `Usuarios`.
- El script `20260908_add_comentario_solicitud_usuarios.sql` que ese documento describe **no existe** en el repositorio ni en el historial de Git. `DataBase/scripts/` contiene hoy `Init.sql`, sin versionar, que **tampoco** crea la columna `comentario`.
- `DataBase/useraccess_schema.png` **no existe** en el repositorio ni en el historial de Git.
- Ya existen tres operaciones con transacción explícita (aprobación, baja, actualización de permisos), cuando ese documento afirmaba que no había ninguna.
- La autorización **sí** se comprueba ahora contra la base, pero con el literal `ModuloId == 1` escrito a mano en el repositorio de datos.
- Según el seed de `Init.sql`, tres de los cuatro `Modulos.Id` **no corresponden** al `MODULE_REGISTRY` del frontend, y la cuenta `super_admin` no recibe permisos sobre el módulo de cuentas.

## Enlaces

- Esquema: [[db-schema-acceso-usuario]] · [[db-relationships]]
- Tablas: [[db-table-usuarios]] · [[db-table-solicitud-usuarios]] · [[db-table-areas]] · [[db-table-modulos]] · [[db-table-permisos]] · [[db-table-tipo-usuario]] · [[db-table-usuario-modulo-permisos]]
- Operación: [[db-queries-by-feature]] · [[db-infrastructure]] · [[db-scripts-and-migrations]] · [[db-init-sql]] · [[db-findings]]
- Otras bóvedas: [[architecture-overview]] · [[be-index]] · [[be-dbcontext-entities]] · [[be-repository]] · [[be-api-reference]] · [[be-auth-session]] · [[be-deployment]] · [[fe-index]] · [[fe-templates-areas-modules]] · [[fe-interfaces]]
