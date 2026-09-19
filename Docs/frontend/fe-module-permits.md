---
title: Módulo Administrar permisos (permitsModule)
tags: [frontend, react, plataforma, permisos, modal]
updated: 2026-09-18
---

# Módulo de permisos — `permitsModule.jsx`

Ubicación: `Frontend/src/templates/platform/permits/permitsModule.jsx` (424 líneas).
Se monta como **ID de módulo `3`** del `MODULE_REGISTRY` ([[fe-templates-areas-modules]]).

> Corrección respecto a `.agent/CONTEXT.md`: allí este módulo figuraba como "vista con título y texto, pendiente". **Está implementado y persiste contra la API.** Es el cambio más grande entre el análisis previo y el código actual.

**No tiene CSS propio**: importa `'../accounts/accountsModule.css'` (`permitsModule.jsx:4`). Todo su aspecto es prestado del módulo de cuentas, más varios estilos inline.

## 1. Alcance funcional

Administra **usuarios ya existentes en `Usuarios`**. No toca solicitudes en ningún momento.

Dos capacidades:
1. **Leer** el tipo de usuario y las asignaciones actuales de una cuenta (`GET /Platform/Users/{id}/Permissions`).
2. **Sobreescribir** ese tipo y esas asignaciones (`PUT /Platform/Users/Permissions`), que en el servidor borra las filas previas de `UsuarioModuloPermisos` y escribe las nuevas en una transacción ([[be-flows]], [[db-table-usuario-modulo-permisos]]).

Es una operación **destructiva por diseño**: lo que no esté en la lista al guardar, se pierde. El modal mitiga esto precargando el estado actual (§ 3).

## 2. Listado y búsqueda de cuentas

- Carga única al montar, sin dependencias: `useEffect(..., [])` (`permitsModule.jsx:34-52`).
- Fuente: `getRegisteredUsers()` → `GET /Platform/Users`. **Se llama sin `AbortSignal`**, aunque el cliente lo acepta; la protección es solo la bandera `mounted` (`:35, 51`). Comparar con `accountsModule`, que sí usa `AbortController` ([[fe-module-accounts]]).
- Guarda `resp?.usuarios || []`.
- Error: `setError('No se pudieron cargar los usuarios. Intente nuevamente.')` + `console.error`.
- Filtro `filteredUsers` con `useMemo` (`:54-63`): excluye al usuario conectado (`u.id === user?.id`), y filtra por nombre completo y por correo, ambos substring case-insensitive. Aquí la comparación de identidad **sí es correcta**, porque ambos IDs provienen de `Usuarios`.
- Los filtros son dos `<input>` **sin `<label>` ni `id`**, solo `placeholder` (`:210-223`) — regresión de accesibilidad respecto a `accountsModule`, que sí etiqueta sus filtros ([[fe-design-system]]).
- Cada fila muestra nombre completo y `correo - alias` (`:239-244`). Igual que en el módulo de cuentas, **no se muestra `activo`**: aparecen mezclados usuarios activos e inactivos sin distinción visual.
- Botón "Administrar" solo si `canEdit` (`:246`), con color inline `#3b82f6` (azul) que **no pertenece a la paleta institucional** (`:253`).

## 3. Modal de administración

Un único `<dialog>` (`permitsModule.jsx:265-408`), estructuralmente **copiado** del modal de activación de `accountsModule`: mismas clases `accounts-confirm-dialog accounts-activation-dialog`, mismo `accounts-activation-dialog-wrapper`, mismo grid de tres columnas, mismas píldoras, mismo truco de `{ target: { value } }`, misma regla de "Ver" forzado.

### 3.1 Apertura — `openEdit(account)` (`:128-163`)

1. Fija `editingUser` y reinicia el estado de construcción.
2. Si `realUserTypes` está vacío, pide `GetUserTypesCatalog()` con la misma **tolerancia de casing** `userTypes || UserTypes` (`:140`).
3. Pide `getUserPermissions(account.id, user?.accessToken)` y, si `success`:
   - `setActivationType(currentPerms.tipoId.toString())` — preselecciona el tipo actual;
   - mapea `currentPerms.permisos` a la forma interna (`:146-152`):

| Campo del servidor | Campo interno | Nota |
| --- | --- | --- |
| `areaId` | `areaId` (string) | |
| `areaName` | `areaName` | |
| `moduloId` | `moduleId` (string) | cambia de `modulo` a `module` |
| `moduloName` | `moduleName` | **coincide con `UserPermissionItem.ModuloName` del backend** |
| `permisosIds` | `permissions` (string[]) | |

4. `showModal()`.
5. Si algo falla: `console.error` + **`alert("No se pudieron cargar los permisos del usuario.")`** (`:161`). El modal **no se abre** en ese caso, porque `showModal()` está después del `await` que lanzó — pero `editingUser` ya quedó fijado, dejando estado inconsistente. *(Inferencia.)*

**Falta la guarda `canEdit` dentro de `openEdit`** (compárese con `openActivation`, que sí la tiene). El botón solo se pinta con `canEdit`, así que no es explotable desde la UI, pero la función queda sin su comprobación defensiva ([[fe-findings]]).

### 3.2 Constructor (idéntico a cuentas, con una diferencia)

`handleAreaChange` pide `GetModulesCatalog({ areasId: [parseInt(areaId)] })` y guarda `modulos` en `realAllModules` (`:65-82`).
`togglePermission` ignora `'1'` (`:89-94`).
`addPermissionSet` reemplaza por `moduleId` o añade (`:96-122`).

**Diferencia de UX real**: aquí, tras añadir, se limpia la selección de módulo y se reinician los permisos (`:120-121`):

```js
setActivationModule('');
setActivationPermissions(['1']);
```

`accountsModule.addPermissionSet` **no hace esto** (`accountsModule.jsx:79-102`). Dos modales que se presentan como el mismo se comportan distinto tras añadir una asignación.

### 3.3 Guardado — `confirmEdit()` (`:171-203`)

```js
if (!editingUser || submittingRef.current || !activationType || addedPermissions.length === 0) return;
const permisosPayload = addedPermissions.map(p => ({
    moduloId: parseInt(p.moduleId, 10),
    permisosIds: p.permissions.map(perm => parseInt(perm, 10))
}));
await updateUserPermissions(editingUser.id, parseInt(activationType, 10), permisosPayload, user?.accessToken);
```

| Aspecto | Realidad |
| --- | --- |
| Endpoint | `PUT /Platform/Users/Permissions`, cuerpo `{userId, tipoId, permisos}` |
| Autenticación | `Authorization: Bearer user.accessToken` |
| Efecto | reemplazo total de asignaciones + actualización de `TipoId` |
| Éxito | `cancelEdit()` + toast "Permisos actualizados correctamente" durante 3 s |
| Error | `console.error` + **`alert()`** (`:199`) |
| Refresco | ninguno, y **no es necesario**: la lista solo muestra datos de identidad, no permisos |
| Guarda de mínimos | `disabled={!activationType || addedPermissions.length === 0}` (`:401`) |

**Nota sobre el candado de doble envío**: `submittingRef.current = false` se asigna dos veces en la ruta de éxito, en `:189` y en el `finally` de `:201`. Es redundante pero inocuo. El efecto secundario real es que entre `:189` y el `cancelEdit()` de `:190` el candado ya está abierto, así que `cancelEdit` no aborta por el `if (submittingRef.current) return` de `:166`. Es probablemente intencional.

### 3.4 Limitación funcional relevante

`addedPermissions.length === 0` deshabilita el guardado. Por tanto **no se puede quitarle a un usuario todos sus permisos desde esta UI**: hay que dejarle al menos un módulo. Revocar todo requiere la baja ([[fe-module-accounts]]) o intervención directa en la base. *(Hecho verificado en `:401`; consecuencia inferida.)*

## 4. Qué persiste y qué no

| Acción de la UI | Persiste | Endpoint |
| --- | --- | --- |
| Cargar la lista de cuentas | no (lectura) | `GET /Platform/Users` |
| Filtrar por nombre / correo | no (100 % cliente) | — |
| Abrir "Administrar" | no (lectura) | `GET /Platform/Users/{id}/Permissions` |
| Elegir tipo / área / módulo / permisos | no (estado local) | — |
| "Añadir a la lista" / "X" | no (estado local) | — |
| **"Guardar Permisos"** | **sí, con reemplazo total** | `PUT /Platform/Users/Permissions` |

## 5. Efecto que no se refleja en la sesión editada

Si se modifican los permisos de un usuario **que tiene sesión abierta**, ese usuario seguirá viendo su sidebar y sus pestañas anteriores hasta cerrar y volver a iniciar sesión, porque `user.accesos` vive congelado en `localStorage` desde el login y no hay refresco ([[fe-session-state]]). El módulo no advierte de esto en ningún texto.

Además, el filtro excluye al propio administrador, así que **nadie puede editarse a sí mismo** desde esta pantalla. *(Hecho verificado en `:56`.)*

## 6. Diagrama

```mermaid
sequenceDiagram
    participant A as Admin
    participant P as PermitsModule
    participant PA as PlatformApi
    participant AU as AuthApi
    participant API as API

    P->>PA: getRegisteredUsers()  (al montar, sin signal)
    PA->>API: GET /Platform/Users
    API-->>P: {usuarios:[...]}

    A->>P: "Administrar" en una cuenta
    P->>AU: GetUserTypesCatalog() (1ª vez)
    P->>PA: getUserPermissions(id, token)
    PA->>API: GET /Platform/Users/{id}/Permissions (Bearer)
    API-->>P: {success, tipoId, permisos:[{areaId,areaName,moduloId,moduloName,permisosIds}]}
    P->>P: precarga tipo + addedPermissions; showModal()

    A->>P: ajusta tipo / añade o quita asignaciones
    A->>P: "Guardar Permisos"
    P->>PA: updateUserPermissions(userId, tipoId, permisos, token)
    PA->>API: PUT /Platform/Users/Permissions (Bearer)
    API-->>P: {success, code:'success', message}
    P->>P: cerrar modal + toast 3 s
    Note over P: la lista no se refresca (no hace falta);<br/>la sesión del usuario editado NO se actualiza
```

## 7. Duplicación con `accountsModule`

Bloques prácticamente idénticos entre los dos archivos (candidatos evidentes a extracción):

| Bloque | En cuentas | En permisos |
| --- | --- | --- |
| Cálculo de `permissions` / `canEdit` | `:40-46` | `:29-32` |
| `handleAreaChange` | `:48-65` | `:65-82` |
| `handleModuleChange` | `:67-70` | `:84-87` |
| `togglePermission` | `:72-77` | `:89-94` |
| `addPermissionSet` | `:79-102` | `:96-122` (con reset extra) |
| `removePermissionSet` | `:157-159` | `:124-126` |
| Grid de 3 columnas del modal | `:559-661` | `:285-387` |
| Toast de éxito | `:684-692` | `:410-418` |

Ambas copias del toast contienen **el mismo SVG malformado**: `d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"` (`accountsModule.jsx:687`, `permitsModule.jsx:413`). El comando de arco `a` espera 7 parámetros y aquí hay un `10` de más. Ver [[fe-findings]].

## Enlaces

- Mapa: [[fe-index]] · Arquitectura: [[fe-architecture]]
- Módulo gemelo y origen del CSS y del modal: [[fe-module-accounts]]
- De dónde viene `module.permisos`: [[fe-templates-areas-modules]]
- Clientes HTTP: [[fe-api-clients]] · Tipos (incluido el `Promise<any>`): [[fe-interfaces]]
- Sesión y token: [[fe-session-state]] · Estilos y deuda visual: [[fe-design-system]]
- Defectos: [[fe-findings]]
- Servidor: [[be-api-reference]], [[be-dto-contracts]], [[be-flows]], [[be-auth-session]], [[be-index]]
- Datos: [[db-index]], [[db-schema-acceso-usuario]], [[db-table-areas]], [[db-table-modulos]], [[db-table-permisos]], [[db-table-usuario-modulo-permisos]]
- Visión global: [[architecture-overview]]
