---
title: Backend — Mapa de contenido
tags: [backend, aspnet, api, moc, indice]
updated: 2026-09-18
---

# Backend — Mapa de contenido (MOC)

Documentación de referencia del proyecto **`Backend/`**: una API HTTP en **ASP.NET Core sobre `net10.0`**, monolítica, con un único proyecto `.csproj`, sin solución `.sln`, sin tests y sin migraciones EF. Persiste en **SQL Server**, esquema `acceso_usuario`.

Toda esta bóveda se verificó contra el código del **2026-09-18** y **corrige** en varios puntos a `.agent/CONTEXT.md` (análisis del 2026-09-08). Ver [[be-findings]] §"Correcciones al contexto previo".

> **Convención de certeza.** Cada afirmación es **[verificado]** si se leyó directamente en el código citado, o **[inferencia]** si se deduce del comportamiento de ASP.NET Core / EF Core / Docker sin haberse ejecutado.

## Lo esencial en 10 líneas

| Hecho | Detalle | Fuente |
| --- | --- | --- |
| Framework | ASP.NET Core, `net10.0`, nullable + implicit usings | `Backend/Backend.csproj:4` |
| Capas reales | Controllers → Handlers → Repository → DbContext → SQL Server | [[be-architecture]] |
| Controllers | 4: `Auth`, `Platform`, `HumanResources`, `Contability` | [[be-controllers]] |
| Servicios | 2 handlers + 1 servicio de token, todos clases concretas `Scoped` | [[be-handlers]] |
| Persistencia | 1 repositorio, 1 DbContext, 7 entidades, 0 migraciones | [[be-repository]] · [[be-dbcontext-entities]] |
| Endpoints | **16 en total**; 5 exigen token, 11 son anónimos | [[be-api-reference]] |
| Autenticación | Bearer token opaco de ASP.NET Core (`AddBearerToken`), 8 h, claim único `NameIdentifier` | [[be-auth-session]] |
| Autorización | Consulta ad-hoc a `UsuarioModuloPermisos` con **`ModuloId == 1` fijo en código** | [[be-authorization-permissions]] |
| Transacciones | 3 operaciones transaccionales: aprobar, "desactivar", reescribir permisos | [[be-flows]] |
| Despliegue | Dockerfile multietapa + Compose + GitHub Actions en runner self-hosted | [[be-deployment]] |

## Notas de esta bóveda

### Arquitectura y arranque
- **[[be-architecture]]** — documento central: capas, responsabilidades, dependencias concretas, fugas de responsabilidad, patrones ausentes, diagramas.
- **[[be-startup-di-config]]** — `Program.cs` línea por línea: DI y lifetimes, CORS, Swagger/OpenAPI, orden del pipeline, configuración y variables de entorno por nombre.

### Superficie HTTP
- **[[be-api-reference]]** — tabla maestra de los 16 endpoints con ruta exacta, DTO, forma JSON y códigos de estado.
- **[[be-controllers]]** — los 4 controllers, atributos, mapeo de códigos y validaciones manuales.
- **[[be-dto-contracts]]** — todos los DTO de Request y Response con sus `DataAnnotations` y su serialización JSON real.

### Lógica y datos
- **[[be-handlers]]** — `AuthHandler`, `PlatformHandler`, `SessionTokenService`.
- **[[be-repository]]** — los 18 métodos de `UserAccessRepository`, uno por uno.
- **[[be-dbcontext-entities]]** — `UserAccessDbContext`, 7 DbSets, mapeo Fluent API, 7 entidades.

### Comportamiento transversal
- **[[be-auth-session]]** — qué hace exactamente `SessionTokenService`, qué está protegido y qué no.
- **[[be-authorization-permissions]]** — el patrón de verificación de permisos duplicado 4 veces en el repositorio.
- **[[be-flows]]** — 8 flujos end-to-end con `sequenceDiagram`: login, registro, cambio de contraseña, catálogos, listados, aprobación, permisos, baja.

### Operación y calidad
- **[[be-deployment]]** — Dockerfile, Compose, CI/CD, puertos y sus limitaciones.
- **[[be-findings]]** — 30+ defectos, deudas y riesgos con archivo:línea e impacto.

## Rutas de lectura

**Entender el backend desde cero**
[[be-architecture]] → [[be-startup-di-config]] → [[be-api-reference]] → [[be-flows]]

**Agregar un endpoint**
[[be-controllers]] → [[be-dto-contracts]] → [[be-handlers]] → [[be-repository]] → [[db-queries-by-feature]]

**Tocar autenticación o permisos**
[[be-auth-session]] → [[be-authorization-permissions]] → [[db-table-usuario-modulo-permisos]] → [[fe-session-state]]

**Tocar el esquema**
[[be-dbcontext-entities]] → [[db-schema-acceso-usuario]] → [[db-relationships]]

**Desplegar**
[[be-startup-di-config]] → [[be-deployment]] → [[db-infrastructure]]

## Fuera del alcance de esta bóveda

- El SPA React: ver [[fe-index]], [[fe-api-clients]], [[fe-interfaces]], [[fe-session-state]], [[fe-templates-areas-modules]].
- El esquema SQL físico, índices y datos: ver [[db-index]], [[db-schema-acceso-usuario]].
- La vista de conjunto de los tres componentes: ver [[architecture-overview]].
- **Ningún archivo de esta bóveda contiene valores de `.env`, cadenas de conexión, contraseñas ni hashes.** Solo nombres de variables.

## Enlaces

- [[architecture-overview]] · [[be-architecture]] · [[be-startup-di-config]]
- [[be-api-reference]] · [[be-controllers]] · [[be-dto-contracts]]
- [[be-handlers]] · [[be-repository]] · [[be-dbcontext-entities]]
- [[be-auth-session]] · [[be-authorization-permissions]] · [[be-flows]]
- [[be-deployment]] · [[be-findings]]
- [[db-index]] · [[fe-index]]
