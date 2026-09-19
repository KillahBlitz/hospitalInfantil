---
title: Módulo Configuración de cuentas (accountsModule)
tags: [frontend, react, plataforma, cuentas, aprobacion, modal]
updated: 2026-09-18
---

# Módulo de cuentas — `accountsModule.jsx`

Ubicación: `Frontend/src/templates/platform/accounts/accountsModule.jsx` (698 líneas) + `accountsModule.css` (509 líneas).
Se monta como **ID de módulo `1`** del `MODULE_REGISTRY` ([[fe-templates-areas-modules]]).

Es el componente más grande y el único con **tres `<dialog>` nativos**, toast y cuatro llamadas distintas a la API.

> Corrección respecto a `.agent/CONTEXT.md`: allí se describía este módulo como "consultas y botones visuales sin acción". **Ya no es así**: aprobar, comentar y dar de baja persisten realmente contra la API. Lo que cambió y lo que sigue igual está en § 8.

## 1. Estado del componente

21 `useState` y 8 `useRef` (`accountsModule.jsx:7-38`). Agrupados por propósito:

| Grupo | Estados |
| --- | --- |
| Listado | `users`, `loading`, `error`, `nameFilter`, `emailFilter`, `showRegistered` |
| Baja | `selectedUser`, `deactivating`, `deactivationError` |
| Mensajería | `successMessage` (banner en la página), `toastMessage` (toast flotante) |
| Comentario | `selectedCommentUser`, `commentText`, `savingComment`, `commentError` |
| Activación | `activationUser`, `activationType`, `activationArea`, `activationModule`, `activationPermissions`, `addedPermissions` |
| Catálogos propios | `realUserTypes`, `realAllModules` |

Refs: `dialogRef` (baja), `commentDialogRef`, `activationDialogRef`, `cancelRef`, `commentCancelRef`, `activationCancelRef`, `toggleRef`, y `submittingRef` (candado de doble envío).

**`submittingRef` es un `useRef`, no estado.** Se usa como candado en las funciones (`accountsModule.jsx:118, 213, 235, 248, ...`), lo cual funciona, pero también se usa como `disabled={submittingRef.current}` en el botón de alternancia (`accountsModule.jsx:367`); ahí **no funciona**, porque mutar un ref no vuelve a renderizar. Ver [[fe-findings]].

## 2. Las dos vistas del listado

Un solo listado con dos fuentes, conmutadas por `showRegistered` (`accountsModule.jsx:12`).

| | `showRegistered === false` (por defecto) | `showRegistered === true` |
| --- | --- | --- |
| Endpoint | `GET /Platform/UserRequest` vía `getUsers(signal)` | `GET /Platform/Users` vía `getRegisteredUsers(signal)` |
| Origen de datos | tabla `SolicitudUsuarios` | tabla `Usuarios` (activos **e inactivos**) |
| Propiedad leída | `response.solicitudes` | `response.usuarios`, mapeado con `usuario: user.alias` (`accountsModule.jsx:170`) |
| Identificador mostrado | `usuario` (= `Username`) | `alias` (adaptado a `usuario`) |
| Texto de carga | "Cargando solicitudes de cuentas..." | "Cargando usuarios registrados..." |
| Texto del botón conmutador | "Cuentas activas" (vino) | "Cuentas pendientes" (verde + check) |
| Botones por registro | Activar (si `editar`), Chat (si `crear`) | Desactivar (si `eliminar`) |

El `useEffect` de carga depende de `[showRegistered]` (`accountsModule.jsx:161-190`) y usa **dos mecanismos de protección combinados**: bandera `active` para ignorar respuestas tardías y `AbortController` para cancelar la petición en curso. `toggleAccountsView()` (`accountsModule.jsx:307-314`) limpia `users`, `error` y `successMessage` y pone `loading` en true antes de conmutar, para que nunca se vean registros de la otra tabla.

> **Aviso de nomenclatura**: "Cuentas activas" / "Cuentas pendientes" son los rótulos del *destino* de la conmutación, siguiendo las referencias de diseño previas. **No** significan que se filtre por `Aprobado` ni por ausencia de permisos: cada vista trae todos los registros de su tabla, sin paginación y sin filtro de servidor ([[be-api-reference]]).

## 3. Filtros

`filteredUsers` con `useMemo` sobre `[users, nameFilter, emailFilter, user?.id]` (`accountsModule.jsx:316-328`):

1. **Excluye al propio usuario**: `if (u.id === user?.id) return false` (`accountsModule.jsx:321`).
2. Filtro por nombre: substring case-insensitive sobre `"nombre apellidoPaterno apellidoMaterno"` con `?? ''` en cada parte.
3. Filtro por correo: substring case-insensitive sobre `correo`.

Ambos filtros se aplican simultáneamente (AND) y se conservan al conmutar de vista.

**Defecto verificado en el punto 1**: en la vista de solicitudes, `u.id` es `SolicitudUsuarios.Id` mientras que `user.id` es `Usuarios.Id`. Son PK de **tablas distintas y sin FK entre ellas** ([[db-schema-acceso-usuario]]). Por tanto, una solicitud cuyo Id coincida numéricamente con el Id del administrador conectado **se oculta de la lista sin motivo**. En la vista de registrados el filtro sí es correcto y es lo que hace inalcanzable la rama de "autobaja" (§ 6). Ver [[fe-findings]].

## 4. Resolución de permisos y visibilidad de botones

```js
const permissions = new Set((module?.permisos ?? []).map((id) => catalogs?.access?.[id]?.trim().toLowerCase()));
const canEdit   = permissions.has('editar');
const canCreate = permissions.has('crear');
const canDelete = permissions.has('eliminar');
const showChat  = canCreate && !showRegistered;
```
(`accountsModule.jsx:40-46`)

| Botón | Condición de render | Acción |
| --- | --- | --- |
| **Activar** (verde, check) | `canEdit && !showRegistered` (`:403`) | abre el modal de activación |
| **Desactivar** (rojo) | `canDelete && showRegistered` (`:417`) | abre el modal de confirmación de baja |
| **Chat** (burbuja, blanco) | `showChat` → `canCreate && !showRegistered` (`:428`) | abre el modal de comentario |
| Conmutador de vista | siempre (`:361`) | ejecuta la otra consulta |

> **Cambio respecto a `.agent/CONTEXT.md`**: la baja ya **no** se rige por `editar` sino por el permiso **`eliminar`** (`canDelete`), y el botón de chat ya no es decorativo: abre el editor de comentario de la solicitud.

Detalle: los botones Activar y Desactivar se deshabilitan con `disabled={deactivating}` (`:408, :422`). En la vista de solicitudes `deactivating` nunca puede ser `true`, así que ese `disabled` es inofensivo pero engañoso al leer el código.

## 5. Modal de activación (aprobación de solicitud)

Es el flujo más elaborado. Se abre con `openActivation(account)` (`accountsModule.jsx:212-232`).

### 5.1 Apertura

1. Guardas: `if (!canEdit || showRegistered || submittingRef.current) return`.
2. Reinicia todo el estado de activación, con `activationPermissions = ['1']` — el permiso de ID `1` **preseleccionado siempre**.
3. Si `realUserTypes` está vacío, pide `GetUserTypesCatalog()` (`GET /Auth/userTypes`) y lo guarda con **lectura tolerante de casing**: `typesResp?.userTypes || typesResp?.UserTypes || {}` (`accountsModule.jsx:224`).
4. `activationDialogRef.current.showModal()`.

Sobre la tolerancia de casing: el DTO del backend es `public Dictionary<string, short> UserTypes` (`Backend/Models/Response/UserAccess/Catalogs.cs`), que con la serialización por defecto de ASP.NET Core sale como **`userTypes`**. La rama `|| typesResp?.UserTypes` es por tanto un cinturón de seguridad, no una necesidad actual. Su valor real es evitar que `Object.entries(undefined)` lance y congele el render ([[fe-interfaces]]).

### 5.2 Layout de tres columnas

`<dialog className="accounts-confirm-dialog accounts-activation-dialog">` con un `<div className="accounts-activation-dialog-wrapper">` dentro (`accountsModule.jsx:539-548`). Ese `div` envolvente existe por una razón concreta: aplicar `display:flex` directamente al `<dialog>` sobreescribe el `display:none` nativo del elemento cerrado y lo deja visible y bloqueando la pantalla. La solución fue mover el flex al hijo (`accountsModule.css:281-296`). Está documentado en `.agent/MEMORY.md` y se confirma en el CSS actual.

Grid `250px 1fr 300px` (`accountsModule.css:298-308`), colapsado a una columna bajo 900 px (`:477-481`):

| Columna | Contenido | Fuente de datos |
| --- | --- | --- |
| **1. Tipo de Usuario** | Botones verticales (`accounts-selector-btn`), uno por tipo, con check cuando está activo | `realUserTypes` (`GET /Auth/userTypes`) |
| **2. Constructor de Permisos** | Fila de píldoras de área → fila de píldoras de módulo → grid de checkboxes de permiso → botón "Añadir a la lista" | `catalogs.areas`, `realAllModules`, `catalogs.access` |
| **3. Lista de Asignaciones** | `addedPermissions` con "Área - Módulo" y nombres de permisos, cada uno con botón "X" | estado local |

### 5.3 Píldoras y el truco del evento sintético

Las píldoras son `<button>`, pero los manejadores se escribieron con forma de evento de `<select>`. Se les pasa un objeto falso:

```jsx
onClick={() => handleAreaChange({ target: { value: id.toString() } })}
```
(`accountsModule.jsx:589`, idéntico en `:603` para módulo)

Es un **residuo del rediseño**: la versión anterior usaba `<select>` (se ve literalmente en `inject_modal.cjs`, § 9). Funciona, pero acopla el manejador a una forma de evento que ya no existe.

`handleAreaChange` (`accountsModule.jsx:48-65`):
- fija `activationArea`, limpia `activationModule` y reinicia `activationPermissions` a `['1']`;
- pide `GetModulesCatalog({ areasId: [parseInt(areaId)] })` y guarda `modsResp?.modulos` en `realAllModules`;
- en error, `console.error` y `realAllModules = {}` (sin mensaje al usuario).

Nótese que aquí la clave del payload va en **minúscula** (`areasId`), mientras que `PrincipalPage` la envía en mayúscula (`AreasId`, `principalPage.jsx:66`) y la interfaz TS declara `AreasId`. Las tres formas funcionan por la tolerancia de casing del binder de ASP.NET Core ([[fe-interfaces]], [[be-dto-contracts]]).

### 5.4 La regla del permiso "Ver" forzado

```js
const togglePermission = (permId) => {
    if (permId === '1') return; // Cannot toggle "ver"
    ...
};
```
(`accountsModule.jsx:72-77`)

Y en el render (`accountsModule.jsx:614-628`):

```jsx
const isVer = id === '1';
<input type="checkbox" checked={isSelected} onChange={() => togglePermission(id)} disabled={isVer} />
```

Es decir: **el permiso con ID `1` está siempre marcado, deshabilitado y se envía en toda asignación**. Se combina con `activationPermissions` inicializado y reinicializado a `['1']` en cinco sitios (`:26, :52, :69, :114, :218`).

Consecuencias verificadas:
- La regla de negocio "todo módulo asignado incluye Ver" se implementa **por ID literal**, no por nombre. Si el permiso "Ver" no fuera el ID 1 en `Permisos`, el modal forzaría el permiso equivocado y lo pintaría como no editable. Cruzar con [[db-table-permisos]].
- El CSS marca la casilla forzada con `.accounts-perm-toggle.is-disabled` (opacidad 0.6, fondo gris) y los `<input>` llevan `pointer-events:none` (`accountsModule.css:416-424`), de modo que el clic lo captura la `<label>`.

### 5.5 Acumulación de asignaciones

`addPermissionSet()` (`accountsModule.jsx:79-102`):
- exige `activationArea` y `activationModule`;
- busca el nombre del área invirtiendo `catalogs.areas` por valor (`:82`);
- toma el nombre del módulo de `realAllModules`;
- si ya existe una entrada con ese `moduleId`, **la reemplaza**; si no, la añade (`:93-101`).

`removePermissionSet(index)` elimina por índice (`:157-159`).

Diferencia con [[fe-module-permits]]: aquí **no** se limpia la selección de módulo tras añadir; en `permitsModule` sí (`permitsModule.jsx:120-121`). Divergencia de UX entre dos modales que se presentan como el mismo.

### 5.6 Guardado — `confirmActivation()` (`accountsModule.jsx:117-155`)

```js
if (!activationType || addedPermissions.length === 0 || submittingRef.current) return;
const permisos = addedPermissions.map(p => ({
    moduloId: parseInt(p.moduleId, 10),
    permisosIds: p.permissions.map(perm => parseInt(perm, 10))
}));
await approveUser(activationUser.id, parseInt(activationType, 10), permisos, user?.accessToken);
```

| Aspecto | Realidad |
| --- | --- |
| Endpoint | `POST /Platform/Users/Approve` con `{solicitudId, tipoId, permisos}` |
| Autenticación | `Authorization: Bearer user.accessToken`; el cliente lanza antes de pedir si no hay token |
| `solicitudId` | es `activationUser.id`, o sea `SolicitudUsuarios.Id` — correcto |
| Efecto en la base | transacción que inserta en `Usuarios`, inserta filas en `UsuarioModuloPermisos` y marca la solicitud como aprobada ([[be-flows]]) |
| Éxito en la UI | `cancelActivation()` → toast "Usuario Aprobado correctamente" durante 3 s (`setTimeout`) |
| Error en la UI | `console.error` + **`alert()`** nativo (`:151`) — incoherente con el sistema de diseño |
| Refresco de la lista | **roto**: ver abajo |

El refresco intenta esto (`accountsModule.jsx:142-148`):

```js
if (toggleRef.current) {
    const event = new Event('refresh');
    toggleRef.current.dispatchEvent(event);   // nadie escucha 'refresh'
} else {
    window.location.reload();
}
```

`toggleRef` apunta al botón conmutador, que **siempre está montado**, así que se toma siempre la primera rama y **nunca se recarga nada**. La solicitud aprobada sigue visible en la lista hasta que el usuario conmute de vista dos veces o recargue. Defecto de impacto funcional directo ([[fe-findings]]).

`cancelActivation()` (`:105-115`) cierra el diálogo y hace un **reseteo profundo** de los seis estados de activación. Ese reseteo es parte del arreglo del bloqueo del `<dialog>` registrado en `.agent/MEMORY.md`.

El botón "Aprobar y Guardar" está `disabled={!activationType || addedPermissions.length === 0}` (`:675`): exige elegir tipo de usuario y al menos una asignación.

## 6. Modal de baja (desactivación)

- Apertura: `openDeactivation(account)` con guardas `!canDelete || !showRegistered || submittingRef.current` (`:234-239`).
- Apertura/cierre del `<dialog>` gestionados por `useEffect` sobre `selectedUser` (`:192-200`), que además mueve el foco al botón Cancelar (`cancelRef`).
- `onCancel` del `<dialog>` hace `preventDefault()` y llama al cierre controlado (`:457-460`), de modo que la tecla Esc pasa por la lógica de React.
- Texto de confirmación: "¿Está seguro de dar de baja al usuario {usuario}?" + "Se eliminarán su cuenta y los permisos de todos sus módulos. Sus datos se conservarán como una solicitud de acceso." (`:463-469`). **Esa descripción refleja el comportamiento real del backend** (mover a solicitud); confirmar en [[be-flows]].
- `confirmDeactivation()` (`:247-270`): llama `deactivateUser(selectedUser.id, user?.accessToken)` → `POST /Platform/Users/{id}/deactivate`. En éxito: **quita el registro de la lista en local** (`setUsers(filter)`), muestra `successMessage` con el mensaje del servidor, cierra el diálogo y devuelve el foco al conmutador.
- Rama de autobaja (`:257-259`): si el usuario dado de baja es el conectado, borra `localStorage.user` y redirige a `/`. **Inalcanzable**, porque `filteredUsers` excluye al usuario actual (§ 3).
- Errores: mensaje dentro del modal (`deactivationError`), incluyendo los textos específicos de 401 que produce el cliente ([[fe-api-clients]]).

## 7. Modal de comentario

- Apertura: `openComment(account)` con guardas `!canCreate || showRegistered || submittingRef.current` (`:272-278`); precarga `commentText` con `account.comentario || ''`.
- `useEffect` sobre `selectedCommentUser` abre/cierra y enfoca Cancelar (`:202-210`).
- UI: icono de burbuja, título "Comentario para la solicitud de {usuario}", `<textarea rows=4>` reutilizando la clase `.accounts-input`.
- `confirmComment()` (`:286-305`): `updateUserRequestComment(id, commentText, user?.accessToken)` → `PUT /Platform/UserRequest/{id}/comment` con cuerpo `{comentario}`. En éxito **actualiza el registro en la lista local** sin refetch (`:293-295`) y muestra `successMessage`.
- El comentario persiste en `SolicitudUsuarios.comentario` ([[db-schema-acceso-usuario]]). El botón sigue rotulado y estilizado como "Chat", pero **no es mensajería**: es un campo de texto único por solicitud, sin historial, sin autor y sin fecha.

## 8. Qué persiste y qué no — resumen taxativo

| Acción de la UI | Persiste en la base | Endpoint | Refresco de la lista |
| --- | --- | --- | --- |
| Conmutar Solicitudes ↔ Registrados | no (es lectura) | `GET /Platform/UserRequest` \| `GET /Platform/Users` | refetch completo |
| Filtrar por nombre / correo | no | — (filtro 100 % en cliente) | — |
| **Aprobar solicitud** ("Aprobar y Guardar") | **sí** | `POST /Platform/Users/Approve` | **no se refresca** (bug) |
| **Guardar comentario** | **sí** | `PUT /Platform/UserRequest/{id}/comment` | actualización local optimista |
| **Dar de baja** | **sí** | `POST /Platform/Users/{id}/deactivate` | eliminación local de la fila |
| Añadir/quitar asignación en el modal | no (solo estado local hasta guardar) | — | — |

Datos que el módulo **recibe y no muestra**: `aprobado` y `fechaIngreso` de las solicitudes; `tipoId`, `fechaNacimiento`, `sexo` y **`activo`** de los usuarios registrados. Que no se muestre `activo` es relevante: la lista de registrados incluye inactivos y **no hay forma de distinguirlos visualmente**. El comportamiento previo de mostrar "Desactivar" deshabilitado para cuentas ya inactivas (descrito en `.agent/CONTEXT.md`) **ya no está en el código**. Ver [[fe-findings]].

## 9. `inject_modal.cjs` — qué es y por qué no debería estar ahí

`Frontend/src/templates/platform/accounts/inject_modal.cjs` (157 líneas) es un **script de andamiaje de Node en CommonJS**, no código de producción:

```js
const file = path.join(__dirname, 'accountsModule.jsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace('    useEffect(() => {', functionsToAdd + '\n    useEffect(() => {');
content = content.replace('        </div>\n    );\n}', jsxToAdd + '\n        </div>\n    );\n}');
fs.writeFileSync(file, content);
```
(`inject_modal.cjs:4-5, 151-156`)

Hechos verificados:

- Se ejecutó **una vez** para inyectar por `String.replace` la primera versión del modal de activación dentro de `accountsModule.jsx`. Imprime "Injected modal correctly.".
- El código que inyecta es la versión **anterior y obsoleta** del modal: usa `<select>` para tipo, área y módulo, y su `confirmActivation` solo hace `console.log("Activación Mock:", payload)` (`inject_modal.cjs:15-23`). Confirma el "Activación Mock" que `.agent/MEMORY.md` daba como pendiente y que ya está resuelto.
- **Volver a ejecutarlo hoy corrompería `accountsModule.jsx`**: reinyectaría funciones duplicadas (`cancelActivation`, `confirmActivation`, `removePermissionSet` ya existen) y un segundo `<dialog>` con la UI vieja. No es idempotente y no valida nada.
- No lo referencia ningún script de `package.json`, ningún import y ningún paso de CI. No entra al bundle (Vite solo empaqueta lo alcanzable desde `main.jsx`), pero **sí se copia a la imagen Docker**, porque el `Dockerfile` hace `COPY . .` y no hay `.dockerignore` ([[fe-config-deployment]]).
- Está **versionado en Git**. Recomendación: borrarlo. Es un artefacto de un solo uso con potencial destructivo dentro del árbol de fuentes.

## 10. Diagrama del ciclo de aprobación

```mermaid
sequenceDiagram
    participant A as Admin
    participant M as AccountsModule
    participant AU as AuthApi
    participant PA as PlatformApi
    participant API as API

    A->>M: clic "Activar" en una solicitud
    M->>M: guardas canEdit && !showRegistered
    M->>AU: GetUserTypesCatalog() (solo la 1ª vez)
    AU->>API: GET /Auth/userTypes
    API-->>M: {userTypes:{nombre:id}}
    M->>M: showModal() del <dialog>

    A->>M: elige Tipo de Usuario
    A->>M: elige píldora de Área
    M->>AU: GetModulesCatalog({areasId:[id]})
    AU->>API: POST /Auth/modules
    API-->>M: {modulos:{id:nombre}}
    A->>M: elige píldora de Módulo
    M->>M: activationPermissions = ['1'] (Ver forzado)
    A->>M: marca permisos extra
    A->>M: "Añadir a la lista" → addedPermissions
    Note over A,M: repetible por módulo; re-añadir el mismo módulo lo reemplaza

    A->>M: "Aprobar y Guardar"
    M->>PA: approveUser(solicitudId, tipoId, permisos, accessToken)
    PA->>API: POST /Platform/Users/Approve (Bearer)
    API-->>PA: {success, code:'success', message}
    PA-->>M: ok
    M->>M: cancelActivation() + toast 3 s
    M--xM: dispatchEvent('refresh') → nadie escucha (lista NO se refresca)
```

## Enlaces

- Mapa: [[fe-index]] · Arquitectura: [[fe-architecture]]
- Cómo llega aquí `module.permisos`: [[fe-templates-areas-modules]]
- Módulo gemelo (mismo modal, usuarios ya activos): [[fe-module-permits]]
- Funciones HTTP usadas: [[fe-api-clients]] · Tipos: [[fe-interfaces]]
- Token que autoriza las mutaciones: [[fe-session-state]]
- Modal, píldoras, toast y CSS: [[fe-design-system]] · Defectos: [[fe-findings]]
- Contrato y transacciones del servidor: [[be-api-reference]], [[be-dto-contracts]], [[be-flows]], [[be-auth-session]], [[be-index]]
- Tablas implicadas: [[db-index]], [[db-schema-acceso-usuario]], [[db-table-modulos]], [[db-table-permisos]], [[db-table-usuario-modulo-permisos]], [[db-table-areas]]
- Visión global: [[architecture-overview]]
