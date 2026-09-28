---
title: Revisión de insumos de Recursos Humanos e integración de plazas
tags: [database, recursos-humanos, plazas, auditoria, insumos]
updated: 2026-09-28
---

# Revisión de insumos de Recursos Humanos

## Dictamen y alcance

El módulo de plazas está razonablemente alineado con los datos básicos del archivo usado para la carga inicial. La integración del conjunto de insumos es **parcial**: hay diferencias de identificadores y estados entre fuentes, atributos todavía no representados, ausencia de importación y conciliación desde Excel y un defecto de edición que puede borrar `TipoPlazaId`.

Se revisaron los siete archivos de `insumos/`, sus once hojas en conjunto, encabezados, tipos, claves, valores almacenados y errores de fórmula; se cruzaron sus registros y se contrastaron con entidades, mapeos EF, DTO, controller, handler, repositorio y formulario de plazas. No se modificaron los libros, el código funcional ni la base. Las cifras de esta nota proceden de los archivos, no de una consulta a SQL Server. La API local del puerto 5196 no estaba levantada. No se certifica el contenido actual de la base desplegada.

Las fórmulas se inspeccionaron con sus resultados guardados; no se recalcularon en Excel ni se actualizaron enlaces externos. La revisión de formato es estructural y de datos, no una certificación visual de impresión.

## Inventario completo

| Archivo en `insumos/` | Hojas y registros | Función y observaciones |
| --- | --- | --- |
| `NBG VALIDACION SALUD QNA JUNIO 2026 j.xlsx` | `quincena 11`: 3,192; `quincena 12`: 3,192; `ACUMULADO`: 3,192 filas con contenido | Principal referencia de la carga documentada. Q12 tiene 3,058 ocupadas y 134 vacantes, sin claves duplicadas. Q11 tiene 3,059 y 133. No sumar ambos cortes. `ACUMULADO` tiene `#N/A` en las 3,192 claves de plaza de O y en otras cuatro columnas; no es una fuente utilizable tal como está. |
| `12 NBG VALIADCION SALUD.xlsx` | `Hoja1`: 3,195 registros, 3,194 claves únicas; `Resumen`: 16 filas | Versión de validación con comentarios y columnas auxiliares. 3,069 ocupadas y 126 vacantes. La plaza 468 aparece en filas 1789 y 2042 con distinta fecha de vacancia. El resumen calcula conteos, no constituye otro padrón. |
| `FORMATO DE VALIDACION.xlsx` | `Hoja1`: 3,195 registros | No es una plantilla vacía. Solo 3,022 claves de plaza numéricas; 173 filas llevan `-` en N: las 126 vacantes y 47 ocupadas. Contiene 51,135 fórmulas y cinco enlaces externos. No sirve para una carga directa basada en N. |
| `QNA 12 Ocupadas 2.xlsx` | `RSLIST002(1)`: 3,055; `PLAZAS SIN SUPLENCIAS`: 3,048 | Fuente de adscripción, empleado, puesto, jornada, clasificación, titular y vigencias. La segunda hoja excluye siete suplencias; no sumar ambas. |
| `Qna 12 Vacantes.xlsx` | `RSLIST009(1)`: 136 | Fuente de vacantes y adscripción. Incluye 102 definitivas, 23 reservadas y 11 temporales. Dos filas carecen de adscripción. No equivale exactamente a las 134 vacantes de la validación Q12. |
| `QNA 12 2026 NOMINA.xlsx` | `GRRSNOM005`: 3,055 registros de personas, 135 columnas | Encabezados en fila 3, detalle en 4:3058 y totales en 3059. Combina identidad, plaza, adscripción, NSS, fecha de ingreso, jornada, puesto, neto y conceptos. |
| `QNA 12 2026 NOMINA.xls` | `GRRSNOM005`: mismo contenido | Archivo binario XLS válido. Comparadas las 3,059 × 135 posiciones con XLSX: mismos valores guardados, normalizando fechas, números y blancos. No cargar ambos como dos nóminas. Esto no afirma identidad de formato ni de fórmulas internas. |

Todos los archivos corresponden al formato indicado por su extensión y pudieron abrirse. Ninguna hoja XLSX contiene tablas estructuradas de Excel ni reglas de validación de datos. Hay encabezados repetidos, columnas auxiliares y rangos con formato más extensos que los registros reales; no se debe usar `max_row` como número de registros ni importar por posición fija entre archivos distintos.

## Lo que encaja con el módulo de plazas

Referencia de columnas: `NBG VALIDACION SALUD QNA JUNIO 2026 j.xlsx`, hoja `quincena 12`, filas 2:3193.

| Origen | Representación actual | Evaluación |
| --- | --- | --- |
| C:E, ramo/unidad/zona | `Unidad.Ramo`, `Unidad.Nombre`, `Unidad.ZE` | Compatible: un solo conjunto de valores en las 3,192 filas. |
| F:H y J, nivel/código/descripción/rango | `Puesto.GradoSalarial`, `CodigoPuesto`, `Descripcion`, `RangoSalarial` | Compatible: 96 códigos distintos; cada código determina un único nivel, descripción y rango en este corte. |
| I, denominación del puesto | `Plaza.DenominacionPuesto` | Correcto mantenerla en la plaza. Tres códigos de puesto presentan más de una denominación. |
| K, cantidad de plaza/hora | `Plaza.CantidadPlazaHora` | Compatible con este archivo: las 3,192 filas contienen 1. No equivale a la jornada `hrspla` de otros reportes. |
| L, contratación | `TipoContratacion` | 2,944 permanentes, 239 eventuales y nueve suplencias. El catálogo admite esta distinción. |
| M, ocupada/vacante | `Plaza.Ocupabilidad` | Un booleano representa estos dos estados, pero no todas las clasificaciones de vacantes ni sus vigencias. |
| N, inicio de vacancia | `Plaza.FechaVacancia` | Las 134 vacantes tienen fecha; las ocupadas llevan un marcador textual. El marcador debe convertirse en nulo, no en fecha. |
| P, clave de plaza | `Plaza.ClavePlaza` | Las 3,192 claves son únicas y caben en los diez caracteres del modelo. B coincide con P en todas ellas. |
| Q, código federal o identificador SHCP | `CodigoFederalPuesto` y `CodigoSHCP` | El origen ofrece un campo alternativo, no dos identificadores independientes. No inventar un segundo valor. Hay 46 vacíos y siete marcadores `SIN CODIGO EVENTUAL`. |
| R, clave presupuestal | `ClavePresupuestalActual` | Compatible; longitud máxima observada 35 frente al límite 60. |
| Adscripción en nómina/ocupadas/vacantes | `Plaza.AreaId` | La relación área–plaza es adecuada. Faltan equivalencias de códigos y conciliación de la carga. |

El recorrido de lectura y escritura está conectado: `HumanResourcesController` → `HumanResourcesHandler` → `HumanResourcesRepository` → `HumanResourcesDbContext`; el frontend utiliza `HumanResourcesApi.ts`. Hay alta, edición, baja, filtros y paginación. El handler valida las referencias a catálogos y la unicidad de clave; la baja comprueba empleados e histórico de código federal dependientes. Esto se verificó por lectura del código, no mediante escrituras de prueba.

## Hallazgos de conciliación

### 1. Las 536 áreas faltantes no significan 536 plazas sin fuente

La documentación histórica indica que quedaron 536 plazas sin área al cruzar literalmente la clave con nómina. El cruce exacto entre P de validación y B de nómina reproduce esa cifra: 2,656 coincidencias y 536 faltantes.

Pero los reportes de ocupadas y vacantes reúnen 3,191 claves distintas, todas presentes en las 3,192 de validación. Hay adscripción no vacía para **3,189**. Por ello, **533 de las 536 ausencias del cruce original tienen adscripción disponible** en estos insumos. Quedan las plazas 341, 2220 y 4553 sin cobertura de adscripción en ese cruce.

Los códigos de área no son iguales: ocupadas/vacantes usan claves numéricas; nómina usa claves jerárquicas `NBG-…`. Al separar código y descripción, los nombres coinciden en las 2,656 plazas comunes. Las 133 descripciones de nómina tienen una sola clave jerárquica cada una y cubren todas las descripciones no vacías de ocupadas/vacantes. Existe evidencia suficiente para preparar una tabla de equivalencias; debe contrastarse con el catálogo vivo antes de actualizar `AreaId`.

Fuentes: ocupadas `A2:B3056`; vacantes `A2:B137`; nómina `B4:C3058`; validación Q12 `P2:P3193`.

### 2. Las 399 claves con sufijos no son necesariamente plazas adicionales

Nómina contiene 2,656 claves numéricas y **399 con sufijos**, por ejemplo `2095/001`. Las 3,055 personas de nómina se encuentran en la validación Q12 por CURP; sus percepciones, deducciones y neto también coinciden, con tolerancia de un centavo.

No es seguro quitar lo que sigue a `/`: se obtendrían 3,054 claves para 3,055 registros, con una colisión. En la fila 343 de nómina, `270/001` corresponde por identidad a la plaza 7000 de validación. Se necesita una equivalencia explícita y validada, conservando la clave original del archivo. No dar de alta automáticamente 399 plazas nuevas ni sobrescribir las existentes por prefijo.

### 3. Los números de empleado pertenecen a dos sistemas

En los 3,055 cruces por identidad, `Empleado` de nómina coincide con `numemppl` de ocupadas, mientras `NÚMERO EMPLEADO` de validación coincide con `noempant`. Los dos números no coinciden entre sí en ninguno de esos cruces. El esquema actual `Empleado` no representa ninguno de estos identificadores de negocio.

Además, 17 celdas de la columna O de validación Q12 contienen la fecha 2026-06-16 en lugar de un número de empleado. Hay 17 errores `#N/A` en AA, fecha de ingreso. Estas filas deben quedar como incidencias, no convertirse automáticamente en empleados.

### 4. Hay estados y fechas que requieren una fuente autorizada

- Ocupadas y vacantes son conjuntos disjuntos, pero contradicen el estado de validación Q12 en **30 plazas**: 14 figuran ocupadas en el reporte y vacantes en validación; otras 16 presentan el caso inverso.
- Validación Q12 tiene 17 plazas ocupadas sin CURP y 14 vacantes con identidad de empleado. No usar la sola presencia de la persona para sobrescribir el estado.
- `12 NBG VALIADCION SALUD.xlsx` comparte 3,187 claves con la validación original; tiene siete adicionales y le faltan cinco. Hay 48 diferencias de estado entre las claves comunes, además del duplicado 468.
- `movvigini` del reporte de vacantes y `FECHA INICIO VACANCIA` no deben tratarse como sinónimos: entre 136 coincidencias, solo diez valores son iguales. Son campos con semántica pendiente de confirmar.

No se infiere cuál archivo es la versión autorizada por su nombre, fecha de modificación o número de filas. RH debe fijar el corte y la precedencia antes de una sincronización.

## Defectos y cobertura pendiente del software

### Pérdida de `TipoPlazaId` al editar

`Frontend/src/templates/humanResources/places/placesModules.jsx:115` construye la petición sin `tipoPlazaId`; tampoco lo conserva en los valores iniciales. `Backend/Models/Request/HumanResources/PlazaRequest.cs:13` lo recibe como nullable y `Backend/Handlers/HumanResourcesHandler.cs:487` asigna directamente ese valor al registro. Por tanto, editar desde la interfaz una plaza cuyo tipo ya esté asignado lo borra. Es un defecto verificable del contrato; no implica que ya haya ocurrido en la base.

Los reportes sí aportan clasificaciones: siete valores en `cveesppl` de ocupadas (base, confianza, interino, provisional, etc.) y tres en vacantes (definitiva, reservada, temporal). Debe decidirse cuáles corresponden a tipo de plaza, nombramiento o condición de vacancia. No mezclarlas automáticamente con `PERMANENTE`, `EVENTUAL` y `SUPLENCIA`.

### Jornada y cantidad de plaza son magnitudes distintas

`CANTIDAD DE PLAZA/HORA` vale 1 en toda la validación. `hrspla` de ocupadas toma 6, 6.5, 7 y 8; vacantes toma 7 y 8. `CantidadPlazaHora` es `short?`, así que tampoco puede representar 6.5. Si se integra jornada, requiere una definición y representación separadas que admitan decimales; no reemplazar el 1 por las horas.

### Historial y validación administrativa

La versión revisada incluye partida, clave presupuestal anterior y comentarios vinculados con plazas; las hojas de conciliación incluyen oficio de autorización y fecha de aplicación. No están cubiertos integralmente por `Plaza`.

`RegistroCodFedPuesto` permite código federal y fecha, pero la edición de plaza no agrega una entrada a ese histórico. `Comentario` exige `EmpleadoId`; no resuelve comentarios de una plaza vacante. La relación actual `Empleado.PlazaId` representa una asignación vigente, sin intervalos ni historial de titular/suplente.

### No existe un importador de estos libros

El controller ofrece cargas JSON para áreas y puestos; no hay endpoint de importación Excel, carga masiva de plazas, conciliación por archivo, procedencia por fila ni control de duplicación por periodo. El formulario de plazas permite captura manual. La carga inicial descrita en Docs fue un proceso externo, no una integración recurrente de los siete archivos.

### Seguridad de las operaciones

`HumanResourcesController` no tiene `[Authorize]` y las operaciones de plazas no verifican permisos del actor en servidor. Los permisos visibles en React no protegen las operaciones HTTP. No se comprobó la existencia de un gateway externo en el despliegue.

## Encaje con Empleados, Nóminas y FOMOPE

- **Empleados:** los archivos sí traen identidad, ingreso y NSS. Nómina aporta 3,017 NSS no vacíos: 3,015 de once caracteres, uno de diez y otro de doce, además de 38 vacíos. Deben conservarse como texto y revisarse los dos casos de longitud distinta; no truncarlos ni completar ceros por suposición. El modelo limita NSS a once caracteres. Los nombres llegan completos y la entidad exige separación; faltan reglas de captura y ambos números de empleado. Durante la revisión aparecieron DTO y métodos de repositorio locales de Empleados en desarrollo; no equivalen por sí solos a una integración completa de estos insumos.
- **Nóminas:** hay **121 columnas de conceptos**, no 125: 33 en L:AR, 76 en AS:DP y doce en DQ:EB. Estas últimas son conceptos de aportaciones/impuesto patronal según los encabezados. Las sumas L:AR y AS:DP coinciden con EC y ED en las 3,055 filas; EC−ED coincide con EE y con K. Los totales EC3059, ED3059 y EE3059 coinciden con el detalle. La entidad `Nomina` solo conserva agregados, no los 121 conceptos. Necesita detalle si se espera reproducir el archivo.
- **FOMOPE:** estos archivos no especifican por sí solos el formato, los campos obligatorios ni las reglas de generación del documento. No basta asumir que es un resumen de nómina.

## Calidad de los formatos para importar

1. Leer por encabezados y perfil de archivo, distinguiendo los encabezados duplicados; por ejemplo, `numplaza` aparece dos veces en ocupadas/vacantes.
2. Excluir títulos, totales y columnas `textbox*`; no convertir el resumen en registros.
3. Mantener identificadores como texto y conservar la versión original de claves y códigos.
4. Tratar fechas Excel usando el calendario del libro. Los XLSX revisados usan la época 1899-12-30; no aplicar conversiones por longitud de texto.
5. No importar `#N/A`, `-`, marcadores de ausencia ni resultados externos fallidos como valores de negocio. En `FORMATO DE VALIDACION` hay 166 errores guardados en F; en el acumulado de NBG hay 15,960 errores guardados en cinco columnas.
6. Bloquear duplicados e inconsistencias para revisión antes de escribir. Conservar procedencia, periodo, equivalencias usadas y resultado por fila.
7. Exigir un corte autorizado: Q12 de la validación indica periodo 2026-06-16 a 2026-06-30 y fecha de pago 2026-06-25. Compartir quincena no asegura que todos los reportes reflejen los mismos movimientos.

## Prioridad de trabajo

1. Corregir la pérdida de `TipoPlazaId` y definir la clasificación y jornada que debe conservar Plazas.
2. Preparar una conciliación revisable de áreas, claves con sufijos, números de empleado y las 30 discrepancias de ocupación. Resolver el duplicado 468 antes de usar la versión alternativa.
3. Contrastar esa conciliación con SQL en modo de solo lectura. Las 3,192 plazas y 536 áreas faltantes de Docs son una fotografía histórica, no una medición actual.
4. Implementar importación con validación previa, trazabilidad e idempotencia, una vez fijadas las reglas de precedencia.
5. Completar Empleados y detalle de Nóminas según los datos observados, sin forzar esos campos dentro del catálogo de plazas.

## Enlaces

- [[db-schema-recursos-humanos]]
- [[fe-module-places]]
- [[be-api-reference]]
