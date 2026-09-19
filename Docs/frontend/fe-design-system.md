---
title: Sistema de diseño y deuda de CSS
tags: [frontend, css, diseno, accesibilidad, responsive]
updated: 2026-09-18
---

# Sistema de diseño

No hay librería de componentes, ni Tailwind, ni CSS Modules, ni CSS-in-JS. Todo es **CSS global** importado desde componentes, con variables CSS como única capa de abstracción.

## 1. Inventario de hojas de estilo

| Archivo | Líneas | ¿Se importa? | Desde |
| --- | --- | --- | --- |
| `src/global.css` | 138 | **sí, primero** | `main.jsx:3` |
| `src/index.css` | 109 | **sí, segundo** | `main.jsx:4` |
| `src/App.css` | 185 | **no** — muerto | — |
| `pages/login/login.css` | 194 | sí | `login.jsx`, `registry.jsx`, `passwordRecuperation.jsx`, `notFound.jsx` |
| `pages/registry/registry.css` | 197 | sí | `registry.jsx`, `passwordRecuperation.jsx` |
| `pages/passwordRecuperation/passwordRecouperation.css` | 24 | sí | `passwordRecuperation.jsx` |
| `pages/principalPage/principalPage.css` | 147 | sí | `principalPage.jsx` |
| `pages/notFound/notFound.css` | 79 | sí | `notFound.jsx` |
| `templates/start/start.css` | 80 | sí | `start.jsx` |
| `templates/shared/areaTemplate.css` | 50 | sí | `areaTemplate.jsx` |
| `templates/platform/accounts/accountsModule.css` | 509 | sí | `accountsModule.jsx`, **y `permitsModule.jsx`** |
| `templates/platform/platform.css` | **0** | no | — |
| `templates/humanResources/humanResources.css` | **0** | no | — |
| `templates/humanResources/places/placesModules.css` | **0** | no | — |
| `templates/contability/contability.css` | **0** | no | — |

Cuatro archivos vacíos y sin import; uno muerto con 185 líneas. Como todos los imports son globales, **el orden de montaje de las páginas afecta la cascada**: entrar a `/registrar` inyecta `registry.css`, que sigue presente si luego se navega a `/` sin recargar. *(Inferencia; en la práctica las transiciones de sesión son recargas duras.)*

## 2. Tokens de `global.css`

Todos en `:root` (`global.css:6-47`).

### Paleta institucional

| Token | Valor | Uso real observado |
| --- | --- | --- |
| `--color-primary` | `#9F2241` | Vino. Franja de pestañas (`areaTemplate.css:12`), errores, botón conmutador, borde superior de `<dialog>`, títulos de columna del modal |
| `--color-secondary` | `#235B4E` | Verde. Sidebar, botones primarios, títulos de sección, borde izquierdo de tarjetas de cuenta |
| `--color-background` | `#DDC9A3` | Beige. Fondo de pantallas públicas, texto de pestañas inactivas, fondo de píldoras |
| `--color-auxiliary` | `#98989A` | Gris. Placeholders, etiqueta "NAVEGADOR", quinta barra de la franja |
| `--color-gold` | `#BC955C` | Dorado. Solo el avatar del sidebar (`principalPage.css:35`) |

Los cinco colores corresponden a la identidad gráfica del Gobierno de México / Secretaría de Salud, y se muestran juntos en la **franja de cinco barras** presente en las cuatro pantallas públicas (`login.css:121-153`): vino, verde, beige, `#b8a882` (dorado oscuro, **literal, sin token**) y gris.

### Variantes, neutros y escalas

| Grupo | Tokens |
| --- | --- |
| Opacidad | `--color-primary-light` `rgba(159,34,65,.1)`, `--color-secondary-light` `rgba(35,91,78,.1)`, `--color-background-light`, `--color-auxiliary-light` |
| Neutros | `--color-white` `#FFFFFF`, `--color-black` `#1A1A1A`, `--color-text` `#333333`, `--color-text-light` `#6B7280`, `--color-border` `#E0E0E0` |
| Tipografía | `--font-family: system-ui, 'Segoe UI', Roboto, sans-serif` — **sin webfonts**, sin descarga externa |
| Espaciado | `--spacing-xs .25rem`, `sm .5rem`, `md 1rem`, `lg 1.5rem`, `xl 2rem`, `2xl 3rem` |
| Radios | `--border-radius-sm 4px`, `md 8px`, `lg 16px` |
| Sombras | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |

### Reset y base (`global.css:49-138`)

- `box-sizing: border-box` universal.
- `body`: fuente del sistema, `16px`, `line-height 1.5`, color de texto y **fondo beige**.
- `#root`: `width:100%`, `min-height:100vh`, `flex column`.
- Encabezados con `margin:0`, `font-weight:700`, color `--color-black`.
- **`button { border:none; outline:none; }`** (`global.css:96-101`) — elimina el anillo de foco de **todos** los botones de la app. Ver § 6.
- Cinco clases utilitarias (`.text-primary`, `.text-secondary`, `.bg-primary`, `.bg-secondary`, `.bg-background`) que **no se usan en ningún componente**.

## 3. `index.css`: el conflicto con los tokens institucionales

`main.jsx` importa `global.css` **y después** `index.css` (`main.jsx:3-4`). `index.css` son los restos de la plantilla de Vite y **sobreescribe** reglas institucionales por especificidad igual y orden posterior:

| Regla de `index.css` | Qué pisa | Línea |
| --- | --- | --- |
| `:root { font: 18px/145% var(--sans); letter-spacing:.18px }` | el tamaño base y el interlineado; la abreviatura `font` **resetea también `font-weight` y `font-family`** en `:root` | `:18-19` |
| `:root { color: var(--text); background: var(--bg) }` | color de texto y fondo; define `--text:#6b6375` y `--bg:#fff` | `:2-4, 21-22` |
| `:root { color-scheme: light dark }` | habilita modo oscuro **de los controles nativos**: inputs, selects, scrollbars y el `::backdrop` de los `<dialog>` | `:20` |
| `@media (prefers-color-scheme: dark) { :root {...} }` | redefine 10 variables a valores oscuros de la plantilla | `:33-51` |
| `h1, h2 { font-weight:500; color: var(--text-h) }` | el `font-weight:700` y `--color-black` de `global.css` | `:66-71` |
| `h1 { font-size:56px; margin:32px 0 }` y `h2 { font-size:24px }` | tamaños de todos los `h1`/`h2`, incluidos los de módulos y modales | `:73-90` |
| `#root { min-height:100svh }` | el `100vh` de `global.css` | `:57-64` |
| Bloque `--accent: #aa3bff`, `--code-bg`, reglas de `code` y `#social .button-icon` | nada del proyecto: son variables y selectores de la plantilla | `:6-10, 48-50, 95-108` |

**Impacto verificado**: los tamaños y pesos de encabezado de la interfaz no son los que declara `global.css`, sino los de `index.css`, salvo donde una clase más específica los redefine (`.login-title`, `.content-title`, `.area-module-title`, `.accounts-confirm-title`). El `color-scheme: light dark` significa que **en un sistema en modo oscuro los inputs y el fondo de los `<dialog>` cambian de aspecto** sin que exista un tema oscuro institucional que lo acompañe: se obtiene una mezcla. *(Hecho verificado en el CSS; apariencia concreta inferida, no observada en navegador.)*

Arreglo de una línea: **borrar la importación de `index.css` en `main.jsx`** y eliminar el archivo, revisando después los tamaños de `h1`/`h2`.

## 4. Layouts

### Pantallas públicas

Patrón común de `login`, `registry`, `passwordRecuperation` y `notFound`: fondo beige a pantalla completa, tarjeta blanca centrada con `border-radius-lg` y `--shadow-lg`, título verde de 2 rem, subtítulo gris, formulario en columna con `gap 1.5rem`, franja de cinco colores al pie.

| Pantalla | Ancho máx. | Breakpoint |
| --- | --- | --- |
| Login | 560 px (`login.css:15`) | ninguno |
| Registro | 720 px, campos en dos columnas | `@media (max-width:600px)` → una columna |
| Recuperación | hereda login (560 px) | hereda registro |
| 404 | 520 px | `@media (max-width:480px)` |

### Shell privado (`principalPage.css`)

```
.principal-layout  display:flex; height:100vh; overflow:hidden
├── .principal-sidebar  260px fijo, verde, columna, height:100vh
│   ├── .sidebar-profile  avatar dorado 44px + nombre + correo (con ellipsis)
│   ├── .sidebar-section-label  "NAVEGADOR" en gris auxiliar
│   ├── .sidebar-nav  flex:1; overflow-y:auto
│   └── .sidebar-logout  borde blanco translúcido; hover vino
└── .principal-content  flex:1; height:100vh; overflow-y:auto; blanco; padding 3rem
```

**No hay ningún `@media` en `principalPage.css`.** En una pantalla estrecha el sidebar sigue ocupando 260 px fijos y el contenido se comprime, sin menú colapsable ni hamburguesa. Es la carencia responsive más visible. Las clases `.sidebar-empty` y `.sidebar-loading` están definidas y **no se usan** en el JSX actual.

### Pestañas de área (`areaTemplate.css`)

La franja vino recorre todo el ancho mediante **márgenes negativos que dependen del padding del contenedor padre**:

```css
.area-tabs {
  padding: 0 var(--spacing-2xl);
  margin: calc(-1 * var(--spacing-2xl)) calc(-1 * var(--spacing-2xl)) 0;
}
```
(`areaTemplate.css:13-14`)

Es un acoplamiento frágil: cambiar el `padding: var(--spacing-2xl)` de `.principal-content` **desalinea la franja**, dejando bordes blancos o desbordamiento horizontal. La misma técnica se repite en `.area-tabs-empty` (`:43`).

Pestaña activa: texto blanco y `border-bottom` beige de 3 px con `margin-bottom:-2px` para solaparse con el borde del contenedor.

## 5. Patrones de componente

### 5.1 Tres patrones de modal distintos

| Patrón | Dónde | Implementación |
| --- | --- | --- |
| **Overlay con `div`** | `Registry` (`registry.css:113-165`) | `.modal-overlay` + `.modal-card`, `role="dialog" aria-modal="true"`, animaciones `fadeIn` / `popIn` |
| **Overlay con `div` + SVG y franja** | `PasswordRecouperation` (`passwordRecouperation.css:1-24`) | reutiliza `.modal-overlay`/`.modal-card` y añade `.modal-icon-wrapper`, `.modal-svg-icon`, `.modal-message` |
| **`<dialog>` nativo** | `accountsModule` (3 diálogos) y `permitsModule` (1) | `showModal()`, `::backdrop`, `onCancel` interceptado |

No existe un componente compartido de modal. Los tres patrones difieren en marcado, en tokens y en comportamiento de teclado.

Los `<dialog>` son la parte mejor hecha: `aria-labelledby`, `aria-describedby`, `aria-busy`, `::backdrop` con `rgba(0,0,0,.5)`, `onCancel` con `preventDefault()` para que Esc pase por la lógica de React, y `useEffect` que mueve el foco al botón Cancelar al abrir (`accountsModule.jsx:192-210`).

**El diálogo de activación necesitó un envoltorio.** `display:flex` aplicado al `<dialog>` sobreescribe su `display:none` nativo y lo deja visible y bloqueante incluso cerrado; la solución fue mover el flex a `.accounts-activation-dialog-wrapper` (`accountsModule.css:290-296`). Documentado en `.agent/MEMORY.md` y confirmado en el código.

### 5.2 Tarjeta de cuenta

`.accounts-item` (`accountsModule.css:53-62`): flex horizontal, fondo blanco, `border-left: 4px solid var(--color-secondary)`, radio `md`. Bajo 600 px hace `flex-wrap` y la información pasa a ocupar la fila completa, con las acciones debajo (`:160-168`).

### 5.3 Botones de acción

| Clase | Color | Nota |
| --- | --- | --- |
| `.accounts-action` | base | `min-height:36px`, `gap xs`, `--shadow-sm`, y **`:focus-visible` con outline verde de 2 px** — recupera el foco que `global.css` eliminó |
| `.accounts-action-activate` | `#388e3c` | verde **literal**, no el token institucional |
| `.accounts-action-deactivate` | `#b91c1c` | rojo literal |
| `.accounts-view-toggle` | `--color-primary` → `--color-secondary` con `.is-registered` | `min-height:42px`, alineado al borde inferior de los filtros |
| `.accounts-confirm-cancel` | blanco con borde verde | secundario |
| Botón "Administrar" de permisos | `#3b82f6` **inline** | azul ajeno a la paleta (`permitsModule.jsx:253`) |

### 5.4 Píldoras y selectores del modal de asignación

`.accounts-pill` (`accountsModule.css:366-384`): radio 20 px, fondo beige, activa en verde con texto blanco; hover `#d0b990` literal.
`.accounts-selector-btn` (`:334-358`): botón de fila completa, activo con fondo `--color-secondary-light` y borde verde.
`.accounts-perm-toggle` (`:399-424`): `<label>` con checkbox; activa con fondo `#f0fdf4` y borde `#22c55e`; deshabilitada gris. Los `<input>` llevan `pointer-events:none` para que el clic lo capture la etiqueta.

### 5.5 Toast

`.accounts-toast-success` (`accountsModule.css:483-509`): `position:fixed` abajo a la derecha, verde claro `#f0fdf4` con borde `#22c55e`, `z-index:10000`, animación `slideInRight`. Se auto-oculta con `setTimeout(..., 3000)` en los dos módulos.

Problemas verificados del toast:
- **No tiene `role="status"` ni `aria-live`**: un lector de pantalla no anuncia "Usuario Aprobado correctamente".
- El SVG interno es **inválido**: `d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"` tiene un parámetro de más en el comando de arco (`accountsModule.jsx:687`, `permitsModule.jsx:413`).
- Coexiste con `.accounts-success`, un banner en el flujo de la página con `role="status"` (`accountsModule.jsx:379`). **Dos mecanismos de notificación** para el mismo módulo: aprobar usa toast; comentar y dar de baja usan banner.

## 6. Accesibilidad: lo que está y lo que falta

**Bien:**
- Etiquetas `<label htmlFor>` asociadas en todos los formularios de páginas y en los filtros de `accountsModule`.
- `aria-label` por registro en los botones de acción, con el alias del usuario ("Activar cuenta de jperez").
- `role="status"` en textos de carga y `role="alert"` en errores de `accountsModule`.
- `aria-hidden="true"` y `focusable="false"` en los SVG decorativos.
- `role="tab"` y `aria-selected` en las pestañas.
- `:focus-visible` explícito en `.accounts-action`.
- `<dialog>` con etiquetado ARIA y foco inicial gestionado.

**Falta:**

| Carencia | Detalle |
| --- | --- |
| `button { outline:none }` global | `global.css:100` mata el foco visible en **todos** los botones; solo `.accounts-action` lo repone. Sidebar, pestañas, píldoras y botones de formulario quedan sin indicador de foco |
| Teclado en las pestañas | Hay `role="tab"` pero no `role="tablist"` funcional con flechas, ni `tabindex` gestionado, ni `role="tabpanel"` ni `aria-controls` |
| Trampa y restauración de foco en los modales de `div` | `Registry` y `PasswordRecouperation` usan overlays sin `<dialog>`: el foco puede salir al fondo con Tab. Los `<dialog>` nativos sí atrapan el foco |
| Anuncio del toast | Sin `aria-live` |
| Filtros de `permitsModule` | Dos `<input>` **sin `<label>` ni `id`**, solo `placeholder` (`permitsModule.jsx:210-223`) |
| `lang` del documento | `index.html:2` declara `lang="en"` y toda la interfaz está en español. Afecta pronunciación de lectores de pantalla y heurísticas del navegador |
| Contraste | No se auditó. `--color-background` beige sobre blanco y el texto beige de las pestañas inactivas sobre vino son los candidatos a revisar. *(Pendiente de verificar con una herramienta de contraste.)* |
| Consistencia de acentos | Textos mezclan formas con y sin acento: "Cerrar sesion", "Sin modulos disponibles", "Configuracion de cuentas", junto a "¿Está seguro...?", "Añadir a la lista" |

## 7. Deuda de CSS — resumen

| # | Deuda | Ubicación | Coste de arreglo |
| --- | --- | --- | --- |
| 1 | `index.css` sobreescribe tokens institucionales y activa `color-scheme: light dark` | `main.jsx:4`, `index.css` completo | bajo (borrar el import) |
| 2 | `App.css` muerto, 185 líneas | `src/App.css` | trivial |
| 3 | Cuatro CSS vacíos sin import | `platform.css`, `humanResources.css`, `placesModules.css`, `contability.css` | trivial |
| 4 | `spinner` y `@keyframes spin` duplicados | `login.css:178-194` y `registry.css:82-100` | bajo |
| 5 | Tres patrones de modal sin componente común | páginas y módulos | medio |
| 6 | Dos patrones de notificación (toast + banner) | `accountsModule` | bajo |
| 7 | Colores literales fuera de la paleta | `#388e3c`, `#b91c1c`, `#3b82f6`, `#22c55e`, `#f0fdf4`, `#b8a882`, `#d0b990`, `#831b36`, `#1a4a3f`, `#999`, `#666` | medio |
| 8 | `!important` en el modal de activación | `accountsModule.css:282` | bajo |
| 9 | `margin-top` duplicado en la misma regla | `accountsModule.css:427-429` (`16px` y luego `auto`) | trivial |
| 10 | Mezcla de tokens y píxeles crudos en el modal nuevo | `accountsModule.css:280-509` usa `8px`, `12px`, `16px`, `24px` en vez de `--spacing-*` | medio |
| 11 | Estilos inline en JSX | `permitsModule.jsx:253, 275, 361, 370`, `accountsModule.jsx:597, 635, 644, 686` | bajo |
| 12 | `permitsModule` sin CSS propio, importa el de cuentas | `permitsModule.jsx:4` | medio |
| 13 | Franja de pestañas acoplada al padding del padre por márgenes negativos | `areaTemplate.css:13-14, 43` | medio |
| 14 | Sin responsive en el shell privado | `principalPage.css` (0 media queries) | alto |
| 15 | Clases definidas y no usadas | utilidades de `global.css`, `.sidebar-empty`, `.sidebar-loading`, `.checkbox-label` | trivial |
| 16 | Assets sin referencia | `src/assets/{react.svg, vite.svg, hero.png}`, `public/{favicon.svg, icons.svg}` | trivial |

## 8. Reglas al extender la interfaz

1. Usar los tokens de `global.css`; si hace falta un color nuevo, **añadir un token**, no un literal.
2. Reutilizar `.accounts-action`, `.accounts-item`, `.accounts-input` y los `<dialog>` existentes antes de crear clases nuevas.
3. Preferir `<dialog>` + `showModal()` al patrón de overlay con `div`.
4. Nunca aplicar `display:flex` directamente a un `<dialog>`: envolver el contenido.
5. Añadir `:focus-visible` explícito a cualquier botón nuevo, porque el reset global lo elimina.
6. Etiquetar todo campo con `<label htmlFor>`; `placeholder` no es etiqueta.
7. Dar `role="status"` o `aria-live` a cualquier notificación.
8. Verificar en pantalla estrecha: el shell no tiene breakpoints y cualquier grid nuevo debe traer el suyo.

## Enlaces

- Mapa: [[fe-index]] · Arquitectura: [[fe-architecture]]
- Pantallas que comparten estilos: [[fe-pages]]
- Franja de pestañas: [[fe-templates-areas-modules]]
- Modales, píldoras y toast en contexto: [[fe-module-accounts]], [[fe-module-permits]]
- Orden de importación de CSS: [[fe-config-deployment]] · Deuda consolidada: [[fe-findings]]
- Visión global: [[architecture-overview]], [[be-index]], [[db-index]]
