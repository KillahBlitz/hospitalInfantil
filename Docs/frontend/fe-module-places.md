---
title: "Módulo Administrar Plazas"
tags: [frontend, react, recursos-humanos, plazas, permisos]
updated: 2026-09-19
---

# `placesModules.jsx` — Administrar Plazas

Volver al índice: [[fe-index]]

Módulo `Id = 2` del área `recursos humanos`, registrado en `MODULE_REGISTRY` (ver [[fe-templates-areas-modules]]). Es el **primero de los cuatro módulos de Recursos Humanos** y el único con funcionalidad completa; los otros tres —`Administrar Empleados`, `Registrar Nominas`, `Generar FOMOPE`— son andamios.

Archivos: `templates/humanResources/places/placesModules.jsx` y `.css`. Cliente: `composable/HumanResourcesApi.ts` ([[fe-api-clients]]). Esquema: [[db-schema-recursos-humanos]]. Endpoints: [[be-api-reference]] §4.

## Anatomía de la pantalla

```
Administrar Plazas                            <- h1, module.name

 Plazas | Areas | Puestos                     <- tira de grupos, a sangre completa

 [buscar] [Estatus] [Tipo] [fecha] [10 v] [Limpiar]      [+ Registrar Plaza]

 Mostrando 1 a 10 de 3192 registros (10 por pagina)

 Clave | Puesto | Area/Servicio | Codigo | Contratacion | Nivel | Fecha | Documento | Estatus | Acciones

 3192 registros encontrados        ‹ Anterior  1 2 3 4 5 6  Siguiente ›
```

**La tabla de plazas se pinta siempre**, con cualquier grupo seleccionado e incluso con ninguno. Lo que cambia según el grupo es el contenido de la fila de acciones del panel:

| Grupo | Qué muestra el panel |
| --- | --- |
| `Plazas` | Los filtros y `Registrar Plaza` |
| `Areas` | «Catalogo de Areas» y «Alta de Area» |
| `Puestos` | «Puestos Registrados» y «Alta de Puesto» |

## Permisos

El patrón es el de `accountsModule.jsx`, con una diferencia: acepta **nombre o id**, para que el módulo siga funcionando si `catalogs.access` llega nulo.

```js
const tienePermiso = (nombre, id) => nombresPermiso.has(nombre) || idsPermiso.has(id);
```

| Permiso | Efecto |
| --- | --- |
| `ver` (1) | Habilita **toda** la sección de plazas: la tabla, los filtros y el paginado. Sin él, el panel dice que los permisos no habilitan la consulta y la tabla no se renderiza |
| `crear` (3) | `Registrar Plaza` en verde. **Sin el permiso sigue visible, en gris y deshabilitado** |
| `editar` (2) | Icono verde de lápiz por fila. **Sin el permiso no se renderiza** |
| `eliminar` (4) | Icono rojo de papelera por fila. **Sin el permiso no se renderiza** |

> **Los tres controles de escritura no siguen la misma regla.** `Registrar Plaza` se queda visible y deshabilitado; los iconos de fila desaparecen. Son dos instrucciones distintas del usuario, no un descuido. Si se unifica, hacerlo en los tres.

## Filtros y paginado

Todo el filtrado y el paginado ocurren **en el servidor**: la tabla nunca tiene más de 100 filas en memoria aunque haya 3 192 plazas.

| Control | Parámetro | Nota |
| --- | --- | --- |
| Buscador | `texto` | *Debounce* de **400 ms** en `textoBuscado` antes de pasar a `filtros.texto`. Busca en clave, código y descripción de puesto, denominación, nombre de área, código federal y clave presupuestal |
| Estatus | `ocupabilidad` | `ocupada` → `true`, `vacante` → `false`, vacío → ausente |
| Tipo | `tipoContratacionId` | Opciones de `GET /HumanResources/TiposContratacion` |
| Fecha | `fechaVacancia` | Igualdad exacta. Solo las 134 plazas vacantes tienen ese dato |
| Por página | `tamano` | 10, 50 o 100. El servidor rechaza cualquier otro valor cayendo a 10 |

Cambiar cualquier filtro **vuelve a la página 1** (`cambiarFiltro` lo fuerza); solo `irAPagina` conserva los filtros. Una página fuera de rango la acota el servidor a la última.

**No hay desplegable de área.** El maquetado busca el área por texto y el buscador ya cubre el nombre de área, así que un `select` de 133 opciones sobraba.

## Columnas y lo que no tiene origen en la base

| Columna | Origen | Nota |
| --- | --- | --- |
| Clave de Plaza | `clavePlaza` | |
| Puesto | `denominacionPuesto ?? descripcionPuesto` | La denominación es la del cargo real; la descripción, la tabular |
| Area / Servicio | `area` | `N/A` en **536 de 3 192** plazas ([[db-schema-recursos-humanos]]) |
| Codigo de Puesto | `codigoPuesto` | |
| Tipo de Contratacion | `tipoContratacion` | |
| Nivel | `gradoSalarial` | |
| Fecha | `fechaVacancia` | Poblada solo en las 134 vacantes |
| **Documento** | — | **Siempre `N/A`**: no hay almacenamiento de archivos. Decisión explícita del usuario |
| Estatus | `ocupabilidad` | **Solo dos estados.** El maquetado mostraba un tercero, `Inactiva`, que no tiene origen: la columna es `bit` |
| Acciones | — | Editar y eliminar |

El maquetado también traía **«Fecha de Alta»**, que no existe en el esquema, y **«Exportar a Excel»**, que se descartó. La columna de fecha quedó con la de vacancia por decisión del usuario, y el lugar del botón de exportar lo ocupa `Registrar Plaza`.

## Diálogos

Cuatro `<dialog>` nativos, **hermanos en la raíz del módulo** y controlados por estado, no anidados. Eso permite abrir el formulario o la confirmación encima del listado de áreas o puestos.

| Diálogo | Estado que lo abre | Para |
| --- | --- | --- |
| Listado | `listadoSeccion` | Catálogo de áreas o puestos, con buscador por nombre |
| Formulario | `formulario` | Alta y edición de área, puesto **y plaza**. Tres ramas de campos; con `places-dialog-wide` para los 12 campos de plaza |
| Confirmación | `porEliminar` | Baja de los tres, con el nombre del registro |

Cada uno lleva `onClose` que limpia su estado, para que cerrar con `Escape` no deje la interfaz inconsistente.

El formulario de plaza precarga sus tres desplegables obligatorios desde `PlazaItem`, que expone `puestoId`, `tipoContratacionId`, `tipoPlazaId` y `unidadId` además de los nombres resueltos. **Sin esos ids la edición abriría los selects vacíos**; fue un defecto real que se corrigió antes de probar la interfaz.

`TipoPlaza` **no aparece en el formulario**: la columna es nullable y su catálogo está vacío, así que siempre se envía nulo.

Tras cualquier alta, edición o baja: se cierra el diálogo, aparece un aviso flotante que se borra a los 3.2 s, y **la lista se recarga** mediante un contador `recarga` en las dependencias del efecto.

## Escalado a distintos monitores

La plataforma es **solo para ordenador**; no hay diseño para móvil ni *media queries* de móvil. El problema real era que en un monitor de alta densidad el viewport CSS al 100 % ronda los 1 000 px y la tabla pedía 1 100.

La solución **no es un zoom fijo** —eso dejaría los monitores grandes con letra diminuta— sino que todo lo que ocupa espacio escala con el viewport:

| Propiedad | Valor |
| --- | --- |
| Barra lateral | `clamp(190px, 14vw, 250px)` |
| Padding del contenido, del panel y de la tabla | `clamp(--spacing-lg, 2.2vw, --spacing-2xl)` |
| Título | `clamp(1.3rem, 1.6vw, 1.8rem)` |
| Letra de la tabla | `clamp(0.7rem, 0.62vw, 0.82rem)` |
| Ancho mínimo de la tabla | `800px`, con scroll horizontal por debajo |

El ancho disponible para la tabla es `viewport − barra lateral`, porque la sección cancela el padding con margen negativo. Con esos valores **cabe sin scroll desde 1 000 px de viewport CSS**. Los encabezados ya no llevan `white-space: nowrap`: envuelven en dos líneas en lugar de truncarse.

Lo que **no** se puede lograr: que 1 000 px muestre lo mismo que 1 250 px sin comprimir. En pantallas estrechas «Puesto» y «Area» ocupan dos líneas.

## Qué falta en este módulo

1. **`Documento` no hace nada.** Requiere almacenamiento de archivos y una columna en `Plazas`.
2. **No hay tercer estado `Inactiva`.** Exigiría cambiar `Ocupabilidad bit` por un catálogo de estados.
3. **No hay `Fecha de Alta`.** Habría que añadir la columna; las 3 192 existentes quedarían en nulo porque el archivo de origen no la trae.
4. **536 plazas sin área.** Ver [[db-schema-recursos-humanos]]: el archivo de nómina solo cubre las plazas pagadas.
5. **Ningún endpoint de `/HumanResources` lleva `[Authorize]`.** Los permisos solo se pintan en el cliente. Ver [[be-findings]].

## Enlaces

- [[fe-index]] · [[fe-templates-areas-modules]] · [[fe-api-clients]] · [[fe-session-state]] · [[fe-design-system]] · [[fe-findings]]
- Backend: [[be-api-reference]] · [[be-findings]]
- Datos: [[db-schema-recursos-humanos]] · [[db-table-modulos]]
- Módulos hermanos: [[fe-module-accounts]] · [[fe-module-permits]]
