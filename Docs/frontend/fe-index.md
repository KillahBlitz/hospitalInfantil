---
title: Frontend — Mapa de contenido (MOC)
tags: [frontend, react, vite, moc, hospital-infantil]
updated: 2026-09-18
---

# Frontend — Mapa de contenido

Bóveda de documentación del **frontend** del proyecto Hospital Infantil de México Federico Gómez.
Ámbito: todo lo que vive bajo `Frontend/` (React 19 + Vite, JSX para vistas, TypeScript solo para clientes HTTP y contratos).

> **Criterio de veracidad usado en toda esta bóveda.** Cada afirmación es de una de estas tres clases y se marca cuando hay riesgo de confusión:
> - **Hecho verificado**: leído directamente en el código de `Frontend/` (o en `Backend/` cuando se trata del contrato que consume el frontend) en la fecha de este documento, con archivo y línea.
> - **Inferencia**: consecuencia lógica del código, no observada en ejecución (no se abrió la app en el navegador ni se golpeó la API).
> - **Pendiente de verificar**: depende de datos reales de SQL o del entorno desplegado.
>
> El análisis previo `.agent/CONTEXT.md` (2026-09-08) se usó como pista, **no** como verdad. Las correcciones al mismo están listadas en [[fe-findings]] § "Desviaciones respecto a .agent/CONTEXT.md".

## Notas de esta bóveda

| Nota | Qué responde |
| --- | --- |
| [[fe-architecture]] | **Documento central.** Capas, composición de componentes, flujo de datos, por qué no hay estado global |
| [[fe-routing-guards]] | Rutas reales, `PublicRoute` / `PrivateRoute`, por qué los guards no son autorización |
| [[fe-pages]] | Las 5 páginas: login, registro, recuperación, shell privado, 404 |
| [[fe-templates-areas-modules]] | `TEMPLATE_REGISTRY`, `MODULE_REGISTRY`, `areaTemplate.jsx` y el acoplamiento con los catálogos SQL |
| [[fe-module-accounts]] | `accountsModule.jsx`: solicitudes vs registrados, modal de activación, comentarios, baja |
| [[fe-module-permits]] | `permitsModule.jsx`: búsqueda de cuentas, lectura y sobreescritura de permisos y tipo |
| [[fe-module-places]] | `placesModules.jsx`: **Administrar Plazas**. Listado paginado de 3 192 plazas, filtros en servidor, CRUD de plazas, áreas y puestos, y el escalado por viewport |
| [[fe-api-clients]] | `AuthApi.ts`, `PlatformApi.ts`, `HumanResourcesApi.ts` función por función |
| [[fe-interfaces]] | Interfaces TS y sus desalineaciones reales con el JSON del backend |
| [[fe-session-state]] | `localStorage.user`, `accessToken`, qué falta y qué riesgos implica |
| [[fe-design-system]] | Tokens, paleta institucional, layout, modales, toasts, accesibilidad y deuda CSS |
| [[fe-config-deployment]] | npm scripts, Vite, Nginx, Docker, CI/CD, ausencia de tsconfig/tests |
| [[fe-findings]] | Defectos, deuda y riesgos con archivo/línea e impacto |

## Resumen ejecutivo en 10 puntos (hechos verificados)

1. Es una **SPA de una sola ruta privada**: `main.jsx` → `App.jsx` → 5 rutas → `PrincipalPage` → template de área → módulo. Ver [[fe-architecture]].
2. **No hay estado global**: ni Context, ni Redux, ni Zustand, ni React Query. El estado viaja por props (`user`, `catalogs`, `module`) y por `localStorage`.
3. `src/composable/` **no contiene hooks de React**: son funciones `async` que envuelven `fetch`. El nombre es prestado de Vue. Ver [[fe-api-clients]].
4. La navegación por áreas/módulos es **estado de React, no rutas**: `/menu` es la única URL privada; recargar devuelve a Inicio y no hay enlace profundo.
5. El área se resuelve por **nombre normalizado** (`plataforma`, `recursos humanos`, ...) y el módulo por **ID numérico** (`1` al `6`) codificados en el frontend. Ver [[fe-templates-areas-modules]].
6. `isAuthenticated()` solo comprueba que `localStorage.user` no sea `null`, `'undefined'` ni `''`. Es navegación de UI, no autorización. Ver [[fe-routing-guards]].
7. El login **ya devuelve y guarda un `accessToken`** (bearer opaco de ASP.NET, expiración 8 h). Todas las mutaciones de Plataforma lo envían en `Authorization: Bearer`. Los dos `GET` de listados **no** lo envían y el backend no lo exige. Ver [[fe-session-state]].
8. Acciones que **persisten de verdad** en la base: aprobar solicitud, guardar comentario de solicitud, dar de baja usuario, sobreescribir permisos+tipo de usuario. Ver detalle en [[fe-module-accounts]], [[fe-module-permits]] y [[fe-module-places]].
9. Acciones que siguen siendo **solo visuales**: nada de Recursos Humanos (`placesModules.jsx`) ni de Contabilidad (`contability.jsx`); ambas son placeholders de texto.
10. No hay `tsconfig.json`, ni script de typecheck, ni una sola prueba. `npm run lint` (oxlint) pasa con **5 advertencias** de parámetros sin usar. Ver [[fe-config-deployment]].

## Enlaces

- Notas hermanas de esta bóveda: [[fe-architecture]], [[fe-routing-guards]], [[fe-pages]], [[fe-templates-areas-modules]], [[fe-module-accounts]], [[fe-module-permits]], [[fe-module-places]], [[fe-api-clients]], [[fe-interfaces]], [[fe-session-state]], [[fe-design-system]], [[fe-config-deployment]], [[fe-findings]]
- Visión global del sistema: [[architecture-overview]]
- Bóveda de backend: [[be-index]], [[be-api-reference]], [[be-dto-contracts]], [[be-auth-session]], [[be-flows]], [[be-deployment]]
- Bóveda de base de datos: [[db-index]], [[db-schema-acceso-usuario]], [[db-table-areas]], [[db-table-modulos]], [[db-table-permisos]], [[db-table-usuario-modulo-permisos]]
