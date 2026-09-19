---
title: Páginas de la SPA
tags: [frontend, react, pages, formularios]
updated: 2026-09-18
---

# Páginas

Las páginas viven en `Frontend/src/pages/<nombre>/`. Cada carpeta tiene un `.jsx` y un `.css`. Son las **únicas** piezas ligadas a una URL ([[fe-routing-guards]]) y las únicas que escriben en `localStorage`.

| Carpeta | Componente exportado | Ruta | CSS que importa |
| --- | --- | --- | --- |
| `login/` | `Login` | `/` | `./login.css` |
| `registry/` | `Registry` | `/registrar` | `../login/login.css` + `./registry.css` |
| `passwordRecuperation/` | `PasswordRecouperation` | `/recuperar` | `login.css` + `registry.css` + `./passwordRecouperation.css` |
| `principalPage/` | `PrincipalPage` | `/menu` | `./principalPage.css` |
| `notFound/` | `NotFound` | `*` | `../login/login.css` + `./notFound.css` |

El encadenamiento de CSS entre páginas es real y deliberado: `registry` y `notFound` reutilizan la tarjeta y los controles de `login`, y `passwordRecuperation` reutiliza los de ambos. Todo es CSS **global**, así que esos imports afectan a cualquier pantalla montada después. Ver [[fe-design-system]].

---

## 1. `Login` — `pages/login/login.jsx`

**Responsabilidad**: autenticar y sembrar la sesión local.

- Estado: `usuario`, `contrasena`, `message`, `loading` (`login.jsx:7-10`).
- Validación local mínima: exige que ninguno esté vacío tras `trim()` (`login.jsx:16`), pero **envía los valores sin recortar** (`login.jsx:22-23`). Un alias con espacios al final se manda tal cual y el backend lo buscará literal. *(Inferencia sobre la comparación SQL: ver [[be-flows]].)*
- Llamada: `loginUser(request)` → `POST /Auth/login` ([[fe-api-clients]]).
- Criterio de fallo: `if (UserAccess?.message || !UserAccess?.id)` (`login.jsx:28`). Es un criterio defensivo necesario porque `loginUser()` **no comprueba `response.ok`**: un 401 con `{message}` se parsea igual que un éxito.
- Éxito: `localStorage.setItem('user', JSON.stringify(UserAccess))` y `window.location.href = '/menu'` (`login.jsx:33-34`). Se guarda **el DTO completo, incluido `accessToken`** ([[fe-session-state]]).
- Fallo de red: `catch` → borra `localStorage.user` y muestra "No se pudo conectar. Intenta más tarde." (`login.jsx:36-38`).
- UI: tarjeta blanca de 560 px máx., título verde, spinner "Accediendo...", franja de cinco colores institucional, enlaces a `/recuperar` y `/registrar`.

## 2. `Registry` — `pages/registry/registry.jsx`

**Responsabilidad**: crear una **solicitud** de acceso. No crea una cuenta.

- Estado único `formData` con nombres en español, más `errors`, `loading`, `serverError`, `showSuccess` (`registry.jsx:10-25`).
- `validarFormulario()` (`registry.jsx:32-100`) — reglas verificadas:

| Campo | Regla en el cliente | Límite real en SQL |
| --- | --- | --- |
| `nombres` | obligatorio, ≤ **50**, alfabético con acentos y espacios | `varchar(30)` |
| `apellidoPaterno` / `apellidoMaterno` | obligatorio, ≤ **25**, alfabético con espacios | `varchar(20)` |
| `sexo` | debe ser `M`, `F` o `X` | `varchar(1)` |
| `fechaNacimiento` | requerida, parseable y no futura; `max` = hoy | `date` |
| `usuario` | obligatorio, ≤ 10, alfabético **sin** espacios | `varchar(10)` |
| `correo` | regex de formato; **sin límite de longitud** | `nvarchar(100)` |
| `contrasena` | 9–15 caracteres con minúscula, mayúscula, dígito y símbolo | se guarda como hash BCrypt |
| `confirmacion` | debe coincidir; **no se envía** | — |

  Las desalineaciones de longitud (50 vs 30, 25 vs 20, correo sin tope) son un defecto real: la UI acepta datos que la base rechazará. Ver [[fe-findings]] y [[db-schema-acceso-usuario]].

- Traducción a payload en `enviarFormulario()` (`registry.jsx:102-114`): `nombres→name`, `apellidoPaterno→lastName`, `apellidoMaterno→lastNameTwo`, `sexo→sex`, `fechaNacimiento→birthDate`, `usuario→user`, `correo→email`, `contrasena→password`. **La clave correcta es `name`**, no `firstName`; la interfaz TS dice `firstName` y está equivocada ([[fe-interfaces]]).
- El campo fecha bloquea el teclado (`onKeyDown={(e) => e.preventDefault()}`, `registry.jsx:229`) y fuerza el selector nativo con `showPicker()` (`registry.jsx:230-231`). Esto impide escribir la fecha a mano, lo que en escritorio es una molestia de accesibilidad. *(Inferencia.)*
- Éxito lógico: `respuesta.success` → modal "Acceso solicitado correctamente" con el texto de contactar a un administrador (`registry.jsx:329-346`); "Aceptar" navega a `/`.
- El flujo **termina en `SolicitudUsuarios`**: la cuenta operativa la crea después un administrador desde [[fe-module-accounts]].

## 3. `PasswordRecouperation` — `pages/passwordRecuperation/passwordRecuperation.jsx`

**Responsabilidad**: cambiar la contraseña conociendo el correo.

- Estado `formData {correo, contrasena, confirmacion}`, `errors`, `loading`, `modal` (`passwordRecuperation.jsx:11-19`).
- Reutiliza exactamente las mismas regex de correo y de complejidad de contraseña que `Registry` (`passwordRecuperation.jsx:28-30`) — duplicación literal, no extraída a un módulo compartido.
- Envía solo `{email, password}` (`passwordRecuperation.jsx:53-56`) a `POST /Auth/changePassword`, cuyo cuerpo de respuesta es un **booleano plano**.
- Ramas: `resultado === true` → modal de éxito con SVG de check verde y navegación a `/`; `false` → modal de error "El correo no está registrado..."; excepción → modal de error de conexión (`passwordRecuperation.jsx:58-80`).
- **Aviso funcional importante**: no hay correo de verificación, ni token temporal, ni contraseña anterior, ni prueba de titularidad. Cualquiera que conozca un correo registrado puede intentar sustituir esa contraseña. Es un defecto del flujo completo, no del frontend solo. No describir esta pantalla como "recuperación verificada". Ver [[be-flows]] y [[fe-findings]].
- El modal aquí tiene diseño propio (`modal-icon-wrapper`, `modal-svg-icon`, `modal-message` en `passwordRecouperation.css`), distinto del modal de `Registry` y distinto de los `<dialog>` de los módulos: hay **tres patrones de modal** en el proyecto ([[fe-design-system]]).

## 4. `PrincipalPage` — `pages/principalPage/principalPage.jsx`

**Responsabilidad**: shell privado. Es la pieza más cargada del frontend: lee la sesión, construye el menú, carga los tres catálogos y monta el template del área activa.

### Estado

| Estado | Inicial | Qué contiene |
| --- | --- | --- |
| `user` | `null` | objeto parseado de `localStorage.user` |
| `navModules` | `[ResolveModule('inicio')]` | **áreas** del sidebar (el nombre dice "modules") |
| `activeModule` | `'inicio'` | clave de **área** activa |
| `catalogs` | `{areas:null, access:null, modules:null}` | los tres catálogos |
| `loading` | `true` | corta el render del contenido |
| `yaCargado` | `useRef(false)` | evita doble carga bajo StrictMode (`principalPage.jsx:86-90`) |

### Secuencia de carga (`principalPage.jsx:92-108`)

1. `JSON.parse(localStorage.getItem('user'))` — **sin `try/catch`**.
2. `setUser` y `setNavModules(BuildNavModules(userData))`.
3. `await GetAreas()` → `GET /Auth/areas`.
4. `await GetAccess()` → `GET /Auth/access`. **Secuencial**, no en paralelo: dos round-trips encadenados sin necesidad.
5. `ModulesCatalog(areasPermissions, areasResp?.areas)` (`principalPage.jsx:53-68`): normaliza a minúsculas el catálogo de áreas, traduce los nombres de área del usuario a IDs y llama `GetModulesCatalog({ AreasId: [...] })`.
6. `setCatalogs({areas, access, modules})` y `setLoading(false)`.

No hay `try/catch/finally`, ni estado de error, ni cancelación, ni reintento. Cualquier fallo deja "Cargando..." para siempre. Es el defecto de mayor impacto visible de la SPA ([[fe-findings]]).

### Registro de áreas — `TEMPLATE_REGISTRY` (`principalPage.jsx:10-15`)

| Clave (minúsculas) | Etiqueta | Componente |
| --- | --- | --- |
| `inicio` | Inicio | `Start` |
| `plataforma` | Plataforma | `Platform` |
| `recursos humanos` | Recursos Humanos | `HumanResources` |
| `contabilidad` | Contabilidad | `Contability` |

`ResolveModule(key)` (`principalPage.jsx:22-29`) resuelve con `key.toLowerCase()`: **no recorta espacios ni elimina acentos**. Un área llamada `"Plataforma "` o `"Contabilidad."` en SQL no encontraría componente, aparecería en el sidebar con su nombre capitalizado y al abrirla mostraría "Error al cargar el módulo..." (`principalPage.jsx:158-163`). Detalle del acoplamiento en [[fe-templates-areas-modules]] y [[db-table-areas]].

`'inicio'` **se inyecta siempre** (`principalPage.jsx:32`): no requiere fila de acceso en la base.

### Layout

Sidebar verde fijo de 260 px con avatar de iniciales (`GetInitials`, `principalPage.jsx:70-78`, toma la primera letra de las dos primeras palabras del nombre), nombre, correo, etiqueta "NAVEGADOR", botones de área y botón de cerrar sesión. Contenido blanco con scroll propio (`principalPage.css:1-137`). No hay breakpoint móvil ni menú colapsable ([[fe-design-system]]).

## 5. `NotFound` — `pages/notFound/notFound.jsx`

29 líneas. Tarjeta con "404", título "Página no encontrada", texto de ayuda, enlace "Volver al Inicio de Sesion" y la franja de cinco colores. Sin guard, sin estado, sin fetch.

## 6. Cuadro comparativo de páginas

| Página | Hace fetch | Escribe `localStorage` | Modal propio | Responsive declarado |
| --- | --- | --- | --- | --- |
| `Login` | sí (`/Auth/login`) | **sí** (set) | no | ninguno (tarjeta fluida) |
| `Registry` | sí (`/Auth/register`) | no | sí (overlay) | `@media (max-width:600px)` |
| `PasswordRecouperation` | sí (`/Auth/changePassword`) | no | sí (overlay + SVG) | heredado |
| `PrincipalPage` | sí (3 catálogos) | **sí** (remove al salir) | no | **ninguno** |
| `NotFound` | no | no | no | `@media (max-width:480px)` |

## Enlaces

- Mapa: [[fe-index]] · Arquitectura: [[fe-architecture]]
- Rutas que las montan: [[fe-routing-guards]]
- Qué monta `PrincipalPage` a continuación: [[fe-templates-areas-modules]]
- Clientes usados: [[fe-api-clients]] · Tipos: [[fe-interfaces]]
- Sesión sembrada por `Login`: [[fe-session-state]]
- Estilos compartidos entre páginas: [[fe-design-system]] · Defectos: [[fe-findings]]
- Endpoints del lado servidor: [[be-api-reference]], [[be-dto-contracts]], [[be-flows]], [[be-auth-session]]
- Datos: [[db-index]], [[db-schema-acceso-usuario]], [[db-table-areas]]
