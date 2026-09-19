---
title: Documentación del Hospital Infantil — Índice general
tags: [moc, indice, documentacion]
updated: 2026-09-18
---

# Documentación del proyecto Hospital Infantil

Bóveda de documentación estilo Obsidian del sistema administrativo del **Hospital Infantil de México Federico Gómez**. Todas las notas se enlazan con wikilinks de Obsidian; abre esta carpeta como vault para navegar el grafo.

## Empieza aquí

- **[[architecture-overview]]** — cómo está armado el sistema completo: capas, límites, ciclo de vida de una petición, modelo de autenticación y topología de despliegue. **Lee esto primero.**

## Las tres bóvedas

| Bóveda | Índice | Qué cubre |
| --- | --- | --- |
| Base de datos | **[[db-index]]** | Esquema SQL `acceso_usuario`, 7 tablas, relaciones, consultas por flujo, infraestructura SQL Server, migraciones |
| Backend | **[[be-index]]** | API ASP.NET Core: controllers, handlers, repositorio, EF Core, DTO, autenticación, despliegue |
| Frontend | **[[fe-index]]** | SPA React + Vite: routing, páginas, templates de área/módulo, clientes API, sesión, sistema de diseño |

## Rutas de lectura sugeridas

**Quiero entender el sistema en general**
[[architecture-overview]] → [[db-schema-acceso-usuario]] → [[be-architecture]] → [[fe-architecture]]

**Voy a agregar un endpoint**
[[be-architecture]] → [[be-api-reference]] → [[be-repository]] → [[db-queries-by-feature]] → [[fe-api-clients]]

**Voy a agregar un módulo de interfaz**
[[fe-templates-areas-modules]] → [[db-table-modulos]] → [[fe-api-clients]] → [[fe-design-system]]

**Voy a tocar el esquema de base de datos**
[[db-schema-acceso-usuario]] → [[db-relationships]] → [[be-dbcontext-entities]] → [[db-scripts-and-migrations]]

**Quiero entender permisos y accesos**
[[db-table-usuario-modulo-permisos]] → [[be-auth-session]] → [[fe-session-state]] → [[fe-module-permits]]

**Voy a desplegar o configurar entornos**
[[be-deployment]] → [[fe-config-deployment]] → [[db-infrastructure]]

## Hallazgos y deuda técnica

Cada bóveda mantiene su propia lista de defectos, riesgos y deuda con archivo y línea:

- [[db-findings]] — capa de datos
- [[be-findings]] — backend
- [[fe-findings]] — frontend

## Convenciones de esta bóveda

- Prefijos de archivo por bóveda: `db-` base de datos, `be-` backend, `fe-` frontend. Garantizan que los wikilinks sean únicos entre carpetas.
- Cada nota abre con frontmatter YAML (`title`, `tags`, `updated`) y cierra con una sección `## Enlaces`.
- Los diagramas son Mermaid, renderizables en Obsidian y GitHub.
- Las ubicaciones de código se citan como `ruta/archivo.ext:línea`.
- Se distingue explícitamente **hecho verificado en el código** de **inferencia**.
- **Ningún documento contiene secretos**: las variables de entorno se mencionan solo por nombre, nunca por valor.

## Relación con `.agent/`

`.agent/CONTEXT.md` y `.agent/MEMORY.md` son la bitácora de trabajo con agentes y el análisis del 2026-09-08. Esta bóveda es la documentación de referencia verificada contra el código del **2026-09-18** y en varios puntos **corrige** ese contexto anterior (notablemente: ya existe autenticación por token bearer, y los flujos de aprobación, desactivación y administración de permisos ya están implementados). Cuando ambos difieran, prevalece esta bóveda.

## Enlaces

- [[architecture-overview]]
- [[db-index]] · [[be-index]] · [[fe-index]]
