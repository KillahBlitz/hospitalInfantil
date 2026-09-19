import { useEffect, useMemo, useRef, useState } from 'react';
import {
    getAreas,
    getPuestos,
    getPlazas,
    getTiposContratacion,
    getUnidades,
    createPlaza,
    updatePlaza,
    deletePlaza,
    createArea,
    updateArea,
    deleteArea,
    createPuesto,
    updatePuesto,
    deletePuesto,
} from '../../../composable/HumanResourcesApi';
import './placesModules.css';

const TAMANOS_PAGINA = [10, 50, 100];

const GRUPOS = [
    { clave: 'plazas', etiqueta: 'Plazas' },
    { clave: 'areas', etiqueta: 'Areas' },
    { clave: 'puestos', etiqueta: 'Puestos' },
];

const FILTROS_INICIALES = {
    texto: '',
    tipoContratacionId: '',
    ocupabilidad: '',
    fechaVacancia: '',
    tamano: 10,
    pagina: 1,
};

function PaginasVisibles(pagina, totalPaginas, maximo = 6) {
    if (totalPaginas <= maximo) {
        return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
    }
    const mitad = Math.floor(maximo / 2);
    const fin = Math.min(totalPaginas, Math.max(pagina + mitad, maximo));
    const inicio = Math.max(1, fin - maximo + 1);
    return Array.from({ length: fin - inicio + 1 }, (_, indice) => inicio + indice);
}

function FechaCorta(valor) {
    if (!valor) return 'N/A';
    const [anio, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${anio}`;
}

const SECCIONES = {
    plazas: {
        etiqueta: 'Plazas',
        tituloAlta: 'Registrar plaza',
        tituloEdicion: 'Editar plaza',
        singular: 'plaza',
    },
    areas: {
        etiqueta: 'Areas',
        botonVer: 'Catalogo de Areas',
        botonAlta: 'Alta de Area',
        tituloListado: 'Catalogo de areas',
        tituloAlta: 'Alta de area',
        tituloEdicion: 'Editar area',
        etiquetaBusqueda: 'Buscar area por nombre',
        singular: 'area',
        errorCarga: 'No se pudo cargar el catalogo de areas.',
    },
    puestos: {
        etiqueta: 'Puestos',
        botonVer: 'Puestos Registrados',
        botonAlta: 'Alta de Puesto',
        tituloListado: 'Puestos registrados',
        tituloAlta: 'Alta de puesto',
        tituloEdicion: 'Editar puesto',
        etiquetaBusqueda: 'Buscar puesto por nombre',
        singular: 'puesto',
        errorCarga: 'No se pudieron cargar los puestos registrados.',
    },
};

function ValoresIniciales(seccion, registro) {
    if (seccion === 'plazas') {
        return {
            clavePlaza: registro?.clavePlaza ?? '',
            puestoId: registro?.puestoId ?? '',
            areaId: registro?.areaId ?? '',
            tipoContratacionId: registro?.tipoContratacionId ?? '',
            unidadId: registro?.unidadId ?? '',
            denominacionPuesto: registro?.denominacionPuesto ?? '',
            cantidadPlazaHora: registro?.cantidadPlazaHora ?? '',
            ocupabilidad: registro ? (registro.ocupabilidad ? 'ocupada' : 'vacante') : 'vacante',
            fechaVacancia: registro?.fechaVacancia ?? '',
            codigoSHCP: registro?.codigoSHCP ?? '',
            codigoFederalPuesto: registro?.codigoFederalPuesto ?? '',
            clavePresupuestalActual: registro?.clavePresupuestalActual ?? '',
        };
    }
    if (seccion === 'areas') {
        return {
            descripcion: registro?.descripcion ?? '',
            claveArea: registro?.claveArea ?? '',
        };
    }
    return {
        codigoPuesto: registro?.codigoPuesto ?? '',
        descripcion: registro?.descripcion ?? '',
        gradoSalarial: registro?.gradoSalarial ?? '',
        rangoSalarial: registro?.rangoSalarial ?? '',
    };
}

function ConstruirPeticion(seccion, valores) {
    if (seccion === 'plazas') {
        const numero = (valor) => (String(valor).trim() === '' ? null : Number(valor));
        const texto = (valor) => (valor.trim() === '' ? null : valor.trim());
        return {
            clavePlaza: valores.clavePlaza.trim(),
            puestoId: numero(valores.puestoId),
            areaId: numero(valores.areaId),
            tipoContratacionId: numero(valores.tipoContratacionId),
            unidadId: numero(valores.unidadId),
            denominacionPuesto: texto(valores.denominacionPuesto),
            cantidadPlazaHora: numero(valores.cantidadPlazaHora),
            ocupabilidad: valores.ocupabilidad === 'ocupada',
            fechaVacancia: valores.fechaVacancia === '' ? null : valores.fechaVacancia,
            codigoSHCP: texto(valores.codigoSHCP),
            codigoFederalPuesto: texto(valores.codigoFederalPuesto),
            clavePresupuestalActual: texto(valores.clavePresupuestalActual),
        };
    }
    if (seccion === 'areas') {
        const clave = valores.claveArea.trim();
        return {
            descripcion: valores.descripcion.trim(),
            claveArea: clave.length > 0 ? clave : null,
        };
    }

    const grado = valores.gradoSalarial.trim();
    const rango = String(valores.rangoSalarial).trim();
    return {
        codigoPuesto: valores.codigoPuesto.trim(),
        descripcion: valores.descripcion.trim(),
        gradoSalarial: grado.length > 0 ? grado : null,
        rangoSalarial: rango.length > 0 ? Number(rango) : null,
    };
}

function EsFormularioValido(seccion, valores) {
    if (seccion === 'plazas') {
        return valores.clavePlaza.trim().length > 0
            && String(valores.puestoId).trim() !== ''
            && String(valores.tipoContratacionId).trim() !== ''
            && String(valores.unidadId).trim() !== '';
    }
    if (seccion === 'areas') return valores.descripcion.trim().length > 0;
    return valores.codigoPuesto.trim().length > 0 && valores.descripcion.trim().length > 0;
}

function EtiquetaRegistro(seccion, registro) {
    if (!registro) return '';
    if (seccion === 'plazas') {
        return `${registro.clavePlaza} — ${registro.denominacionPuesto ?? registro.descripcionPuesto}`;
    }
    return seccion === 'areas'
        ? registro.descripcion
        : `${registro.codigoPuesto} — ${registro.descripcion}`;
}

function PlacesModule({ module, catalogs }) {
    const [seccionActiva, setSeccionActiva] = useState('plazas');
    const [listadoSeccion, setListadoSeccion] = useState(null);
    const [areas, setAreas] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [formulario, setFormulario] = useState(null);
    const [porEliminar, setPorEliminar] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [errorFormulario, setErrorFormulario] = useState('');
    const [errorEliminar, setErrorEliminar] = useState('');
    const [aviso, setAviso] = useState('');
    const [recarga, setRecarga] = useState(0);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [textoBuscado, setTextoBuscado] = useState('');
    const [plazas, setPlazas] = useState([]);
    const [paginado, setPaginado] = useState({ pagina: 1, tamano: 10, total: 0, totalPaginas: 0 });
    const [cargandoPlazas, setCargandoPlazas] = useState(false);
    const [errorPlazas, setErrorPlazas] = useState('');
    const [tiposContratacion, setTiposContratacion] = useState([]);
    const [unidades, setUnidades] = useState([]);

    const listadoRef = useRef(null);
    const formularioRef = useRef(null);
    const eliminarRef = useRef(null);
    const cancelarEliminarRef = useRef(null);

    const nombresPermiso = new Set(
        (module?.permisos ?? []).map((id) => catalogs?.access?.[id]?.trim().toLowerCase())
    );
    const idsPermiso = new Set((module?.permisos ?? []).map(Number));
    const tienePermiso = (nombre, id) => nombresPermiso.has(nombre) || idsPermiso.has(id);

    const puedeVer = tienePermiso('ver', 1);
    const puedeEditar = tienePermiso('editar', 2);
    const puedeCrear = tienePermiso('crear', 3);
    const puedeEliminar = tienePermiso('eliminar', 4);
    const sinPermisos = !puedeVer && !puedeEditar && !puedeCrear && !puedeEliminar;

    useEffect(() => {
        if (!listadoSeccion) return undefined;

        let activo = true;
        const controlador = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError('');
            try {
                if (listadoSeccion === 'areas') {
                    const respuesta = await getAreas(controlador.signal);
                    if (activo) setAreas(respuesta?.areas ?? []);
                } else {
                    const respuesta = await getPuestos(controlador.signal);
                    if (activo) setPuestos(respuesta?.puestos ?? []);
                }
            } catch {
                if (activo) setError(SECCIONES[listadoSeccion].errorCarga);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();
        return () => {
            activo = false;
            controlador.abort();
        };
    }, [listadoSeccion, recarga]);

    useEffect(() => {
        const dialogo = listadoRef.current;
        if (listadoSeccion) {
            if (!dialogo.open) dialogo.showModal();
        } else if (dialogo?.open) {
            dialogo.close();
        }
    }, [listadoSeccion]);

    useEffect(() => {
        const dialogo = formularioRef.current;
        if (formulario) {
            if (!dialogo.open) dialogo.showModal();
        } else if (dialogo?.open) {
            dialogo.close();
        }
    }, [formulario]);

    useEffect(() => {
        const dialogo = eliminarRef.current;
        if (porEliminar) {
            if (!dialogo.open) dialogo.showModal();
            cancelarEliminarRef.current?.focus();
        } else if (dialogo?.open) {
            dialogo.close();
        }
    }, [porEliminar]);

    useEffect(() => {
        if (!puedeVer) return undefined;

        const controlador = new AbortController();
        let activo = true;

        const cargar = async () => {
            try {
                const [respTipos, respUnidades, respAreas, respPuestos] = await Promise.all([
                    getTiposContratacion(controlador.signal),
                    getUnidades(controlador.signal),
                    getAreas(controlador.signal),
                    getPuestos(controlador.signal),
                ]);
                if (!activo) return;
                setTiposContratacion(respTipos?.tiposContratacion ?? []);
                setUnidades(respUnidades?.unidades ?? []);
                setAreas(respAreas?.areas ?? []);
                setPuestos(respPuestos?.puestos ?? []);
            } catch {
                if (activo) {
                    setTiposContratacion([]);
                    setUnidades([]);
                }
            }
        };

        cargar();
        return () => {
            activo = false;
            controlador.abort();
        };
    }, [puedeVer]);

    useEffect(() => {
        const temporizador = setTimeout(() => {
            setFiltros((previo) =>
                previo.texto === textoBuscado ? previo : { ...previo, texto: textoBuscado, pagina: 1 }
            );
        }, 400);
        return () => clearTimeout(temporizador);
    }, [textoBuscado]);

    useEffect(() => {
        if (!puedeVer) return undefined;

        let activo = true;
        const controlador = new AbortController();

        const cargar = async () => {
            setCargandoPlazas(true);
            setErrorPlazas('');
            try {
                const respuesta = await getPlazas(
                    {
                        pagina: filtros.pagina,
                        tamano: filtros.tamano,
                        texto: filtros.texto,
                        tipoContratacionId:
                            filtros.tipoContratacionId === '' ? null : Number(filtros.tipoContratacionId),
                        ocupabilidad: filtros.ocupabilidad === '' ? null : filtros.ocupabilidad === 'ocupada',
                        fechaVacancia: filtros.fechaVacancia === '' ? null : filtros.fechaVacancia,
                    },
                    controlador.signal
                );
                if (!activo) return;
                setPlazas(respuesta?.plazas ?? []);
                setPaginado({
                    pagina: respuesta?.pagina ?? 1,
                    tamano: respuesta?.tamano ?? filtros.tamano,
                    total: respuesta?.total ?? 0,
                    totalPaginas: respuesta?.totalPaginas ?? 0,
                });
            } catch {
                if (activo) setErrorPlazas('No se pudo cargar el listado de plazas.');
            } finally {
                if (activo) setCargandoPlazas(false);
            }
        };

        cargar();
        return () => {
            activo = false;
            controlador.abort();
        };
    }, [puedeVer, filtros, recarga]);

    useEffect(() => {
        if (!aviso) return undefined;
        const temporizador = setTimeout(() => setAviso(''), 3200);
        return () => clearTimeout(temporizador);
    }, [aviso]);

    const abrirListado = (seccion) => {
        setBusqueda('');
        setListadoSeccion(seccion);
    };

    const abrirAlta = (seccion) => {
        setErrorFormulario('');
        setFormulario({
            seccion,
            modo: 'alta',
            registro: null,
            valores: ValoresIniciales(seccion, null),
        });
    };

    const abrirEdicion = (seccion, registro) => {
        setErrorFormulario('');
        setFormulario({
            seccion,
            modo: 'edicion',
            registro,
            valores: ValoresIniciales(seccion, registro),
        });
    };

    const cambiarValor = (campo, valor) => {
        setFormulario((previo) =>
            previo ? { ...previo, valores: { ...previo.valores, [campo]: valor } } : previo
        );
    };

    const guardarFormulario = async () => {
        if (!formulario || guardando) return;

        const { seccion, modo, registro, valores } = formulario;
        if (!EsFormularioValido(seccion, valores)) return;

        setGuardando(true);
        setErrorFormulario('');
        try {
            const peticion = ConstruirPeticion(seccion, valores);
            if (modo === 'alta') {
                if (seccion === 'plazas') await createPlaza(peticion);
                else if (seccion === 'areas') await createArea(peticion);
                else await createPuesto(peticion);
            } else if (seccion === 'plazas') {
                await updatePlaza(registro.id, peticion);
            } else if (seccion === 'areas') {
                await updateArea(registro.id, peticion);
            } else {
                await updatePuesto(registro.id, peticion);
            }

            setFormulario(null);
            setAviso(modo === 'alta'
                ? `Se registro el ${SECCIONES[seccion].singular}.`
                : `Se actualizo el ${SECCIONES[seccion].singular}.`);
            setRecarga((valor) => valor + 1);
        } catch (fallo) {
            setErrorFormulario(fallo.message);
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!porEliminar || eliminando) return;

        const { seccion, registro } = porEliminar;
        setEliminando(true);
        setErrorEliminar('');
        try {
            if (seccion === 'plazas') await deletePlaza(registro.id);
            else if (seccion === 'areas') await deleteArea(registro.id);
            else await deletePuesto(registro.id);

            setPorEliminar(null);
            setAviso(`Se elimino el ${SECCIONES[seccion].singular}.`);
            setRecarga((valor) => valor + 1);
        } catch (fallo) {
            setErrorEliminar(fallo.message);
        } finally {
            setEliminando(false);
        }
    };

    const cambiarFiltro = (campo, valor) => {
        setFiltros((previo) => ({ ...previo, [campo]: valor, pagina: 1 }));
    };

    const irAPagina = (pagina) => {
        setFiltros((previo) => ({ ...previo, pagina }));
    };

    const limpiarFiltros = () => {
        setTextoBuscado('');
        setFiltros(FILTROS_INICIALES);
    };

    const registros = listadoSeccion === 'areas' ? areas : puestos;

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return registros;
        return registros.filter((registro) =>
            (registro.descripcion ?? '').toLowerCase().includes(termino)
        );
    }, [registros, busqueda]);

    const desdeRegistro = paginado.total === 0 ? 0 : (paginado.pagina - 1) * paginado.tamano + 1;
    const hastaRegistro = Math.min(paginado.pagina * paginado.tamano, paginado.total);

    const configListado = listadoSeccion ? SECCIONES[listadoSeccion] : null;
    const configFormulario = formulario ? SECCIONES[formulario.seccion] : null;
    const formularioValido = formulario
        ? EsFormularioValido(formulario.seccion, formulario.valores)
        : false;

    return (
        <div className="places-module">
            <h1 className="places-title">{module?.name ?? 'Administracion de Plazas'}</h1>

            {sinPermisos ? (
                <p className="content-placeholder">
                    No tienes permisos asignados en este modulo.
                </p>
            ) : (
                <div className="places-panel">
                    <div className="places-panel-groups" role="tablist">
                        {GRUPOS.map((grupo) => (
                            <button
                                key={grupo.clave}
                                type="button"
                                role="tab"
                                aria-selected={seccionActiva === grupo.clave}
                                className={`places-group${seccionActiva === grupo.clave ? ' is-active' : ''}`}
                                onClick={() =>
                                    setSeccionActiva(seccionActiva === grupo.clave ? null : grupo.clave)
                                }
                            >
                                {grupo.etiqueta}
                            </button>
                        ))}
                    </div>

                    <div className="places-panel-actions">
                        {!seccionActiva ? (
                            <p className="places-hint">
                            </p>
                        ) : seccionActiva === 'plazas' ? (
                            !puedeVer ? (
                                <p className="places-hint">
                                    Tus permisos no habilitan la consulta de plazas.
                                </p>
                            ) : (
                                <div className="places-toolbar">
                                    <div className="places-search-box">
                                        <span className="places-search-icon" aria-hidden="true">⌕</span>
                                        <input
                                            type="search"
                                            className="places-toolbar-input places-toolbar-search"
                                            value={textoBuscado}
                                            placeholder="Clave, puesto o area"
                                            aria-label="Buscar plaza por clave, puesto o area"
                                            onChange={(evento) => setTextoBuscado(evento.target.value)}
                                        />
                                    </div>

                                    <select
                                        className="places-toolbar-input"
                                        aria-label="Filtrar por estatus"
                                        value={filtros.ocupabilidad}
                                        onChange={(evento) => cambiarFiltro('ocupabilidad', evento.target.value)}
                                    >
                                        <option value="">Estatus: Todo</option>
                                        <option value="ocupada">Estatus: Ocupada</option>
                                        <option value="vacante">Estatus: Vacante</option>
                                    </select>

                                    <select
                                        className="places-toolbar-input"
                                        aria-label="Filtrar por tipo de contratacion"
                                        value={filtros.tipoContratacionId}
                                        onChange={(evento) =>
                                            cambiarFiltro('tipoContratacionId', evento.target.value)
                                        }
                                    >
                                        <option value="">Tipo: Todo</option>
                                        {tiposContratacion.map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>
                                                {`Tipo: ${tipo.descripcion}`}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="date"
                                        className="places-toolbar-input places-toolbar-date"
                                        aria-label="Filtrar por fecha de vacancia"
                                        value={filtros.fechaVacancia}
                                        onChange={(evento) => cambiarFiltro('fechaVacancia', evento.target.value)}
                                    />

                                    <select
                                        className="places-toolbar-input places-toolbar-size"
                                        aria-label="Registros por pagina"
                                        value={filtros.tamano}
                                        onChange={(evento) => cambiarFiltro('tamano', Number(evento.target.value))}
                                    >
                                        {TAMANOS_PAGINA.map((tamano) => (
                                            <option key={tamano} value={tamano}>
                                                {`${tamano} por pagina`}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className="places-toolbar-reset"
                                        onClick={limpiarFiltros}
                                    >
                                        Limpiar
                                    </button>

                                    <button
                                        type="button"
                                        className={`places-toolbar-create${puedeCrear ? '' : ' is-disabled'}`}
                                        disabled={!puedeCrear}
                                        onClick={() => abrirAlta('plazas')}
                                    >
                                        <span aria-hidden="true">+</span> Registrar Plaza
                                    </button>
                                </div>
                            )
                        ) : (
                            <>
                                {puedeVer && (
                                    <button
                                        type="button"
                                        className="places-action places-action-view"
                                        onClick={() => abrirListado(seccionActiva)}
                                    >
                                        {SECCIONES[seccionActiva].botonVer}
                                    </button>
                                )}
                                {puedeCrear && (
                                    <button
                                        type="button"
                                        className="places-action places-action-create"
                                        onClick={() => abrirAlta(seccionActiva)}
                                    >
                                        {SECCIONES[seccionActiva].botonAlta}
                                    </button>
                                )}
                                {!puedeVer && !puedeCrear && (
                                    <p className="places-hint">
                                        Tus permisos no habilitan acciones en esta seccion.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {puedeVer && (
                <section className="places-table-section" aria-label="Listado de plazas">
                    <p className="places-showing">
                        {cargandoPlazas
                            ? 'Consultando...'
                            : paginado.total === 0
                                ? 'Sin registros que coincidan'
                                : `Mostrando ${desdeRegistro} a ${hastaRegistro} de ${paginado.total} registros (${paginado.tamano} por pagina)`}
                    </p>

                    {errorPlazas ? (
                        <p className="places-error" role="alert">{errorPlazas}</p>
                    ) : plazas.length === 0 ? null : (
                        <div className="places-table-wrapper">
                            <table className="places-table">
                                <colgroup>
                                    <col className="places-col-clave" />
                                    <col className="places-col-puesto" />
                                    <col className="places-col-area" />
                                    <col className="places-col-codigo" />
                                    <col className="places-col-contratacion" />
                                    <col className="places-col-nivel" />
                                    <col className="places-col-fecha" />
                                    <col className="places-col-documento" />
                                    <col className="places-col-estatus" />
                                    <col className="places-col-acciones" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th scope="col">Clave de Plaza</th>
                                        <th scope="col">Puesto</th>
                                        <th scope="col">Area / Servicio</th>
                                        <th scope="col">Codigo de Puesto</th>
                                        <th scope="col">Tipo de Contratacion</th>
                                        <th scope="col">Nivel</th>
                                        <th scope="col">Fecha Vacancia</th>
                                        <th scope="col">Documento</th>
                                        <th scope="col">Estatus</th>
                                        <th scope="col">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plazas.map((plaza) => (
                                        <tr key={plaza.id}>
                                            <td className="places-cell-key">{plaza.clavePlaza}</td>
                                            <td>{plaza.denominacionPuesto ?? plaza.descripcionPuesto}</td>
                                            <td>{plaza.area ?? 'N/A'}</td>
                                            <td className="places-cell-key">{plaza.codigoPuesto}</td>
                                            <td>{plaza.tipoContratacion}</td>
                                            <td className="places-cell-key">{plaza.gradoSalarial ?? 'N/A'}</td>
                                            <td className="places-cell-key">{FechaCorta(plaza.fechaVacancia)}</td>
                                            <td className="places-cell-doc">N/A</td>
                                            <td>
                                                <span
                                                    className={`places-badge${
                                                        plaza.ocupabilidad ? ' is-ocupada' : ' is-vacante'
                                                    }`}
                                                >
                                                    {plaza.ocupabilidad ? 'Ocupada' : 'Vacante'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="places-row-actions">
                                                    {puedeEditar && (
                                                        <button
                                                            type="button"
                                                            className="places-row-icon places-row-icon-edit"
                                                            aria-label={`Editar plaza ${plaza.clavePlaza}`}
                                                            onClick={() => abrirEdicion('plazas', plaza)}
                                                        >
                                                            ✎
                                                        </button>
                                                    )}
                                                    {puedeEliminar && (
                                                        <button
                                                            type="button"
                                                            className="places-row-icon places-row-icon-delete"
                                                            aria-label={`Eliminar plaza ${plaza.clavePlaza}`}
                                                            onClick={() => {
                                                                setErrorEliminar('');
                                                                setPorEliminar({ seccion: 'plazas', registro: plaza });
                                                            }}
                                                        >
                                                            🗑
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="places-footer">
                        {paginado.total > 0 && (
                            <span className="places-found">
                                {`${paginado.total} registros encontrados`}
                            </span>
                        )}

                        {paginado.totalPaginas > 1 && (
                            <div className="places-pager" role="navigation" aria-label="Paginacion">
                                <button
                                    type="button"
                                    className="places-page places-page-step"
                                    disabled={paginado.pagina <= 1 || cargandoPlazas}
                                    onClick={() => irAPagina(paginado.pagina - 1)}
                                >
                                    ‹ Anterior
                                </button>
                                {PaginasVisibles(paginado.pagina, paginado.totalPaginas).map((numero) => (
                                    <button
                                        key={numero}
                                        type="button"
                                        className={`places-page${numero === paginado.pagina ? ' is-active' : ''}`}
                                        aria-current={numero === paginado.pagina ? 'page' : undefined}
                                        disabled={cargandoPlazas}
                                        onClick={() => irAPagina(numero)}
                                    >
                                        {numero}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="places-page places-page-step"
                                    disabled={paginado.pagina >= paginado.totalPaginas || cargandoPlazas}
                                    onClick={() => irAPagina(paginado.pagina + 1)}
                                >
                                    Siguiente ›
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <dialog
                ref={listadoRef}
                className="places-dialog places-dialog-list"
                aria-labelledby="places-list-title"
                onClose={() => setListadoSeccion(null)}
            >
                <div className="places-dialog-header">
                    <h2 id="places-list-title" className="places-dialog-title">
                        {configListado?.tituloListado ?? ''}
                    </h2>
                    <button
                        type="button"
                        className="places-dialog-close"
                        aria-label="Cerrar"
                        onClick={() => setListadoSeccion(null)}
                    >
                        ✕
                    </button>
                </div>

                <div className="places-search">
                    <label htmlFor="places-search-input" className="places-search-label">
                        {configListado?.etiquetaBusqueda ?? ''}
                    </label>
                    <input
                        id="places-search-input"
                        type="search"
                        className="places-input"
                        value={busqueda}
                        placeholder="Escribe el nombre"
                        onChange={(evento) => setBusqueda(evento.target.value)}
                    />
                </div>

                {cargando ? (
                    <p className="content-placeholder" role="status">Cargando...</p>
                ) : error ? (
                    <p className="places-error" role="alert">{error}</p>
                ) : filtrados.length === 0 ? (
                    <p className="content-placeholder">No se encontraron registros.</p>
                ) : (
                    <>
                        <p className="places-count">
                            {filtrados.length} de {registros.length} registros
                        </p>
                        <ul className="places-list">
                            {filtrados.map((registro) => (
                                <li key={registro.id} className="places-item">
                                    <div className="places-item-info">
                                        <span className="places-item-name">{registro.descripcion}</span>
                                        <span className="places-item-sub">
                                            {listadoSeccion === 'areas'
                                                ? registro.claveArea ?? 'Sin clave'
                                                : [
                                                    registro.codigoPuesto,
                                                    registro.gradoSalarial ?? 'sin grado',
                                                    `rango ${registro.rangoSalarial ?? '-'}`,
                                                ].join(' · ')}
                                        </span>
                                    </div>

                                    <div className="places-item-actions">
                                        {puedeEditar && (
                                            <button
                                                type="button"
                                                className="places-action places-action-edit"
                                                onClick={() => abrirEdicion(listadoSeccion, registro)}
                                            >
                                                Editar
                                            </button>
                                        )}
                                        {puedeEliminar && (
                                            <button
                                                type="button"
                                                className="places-action-delete"
                                                aria-label={`Eliminar ${registro.descripcion}`}
                                                onClick={() => {
                                                    setErrorEliminar('');
                                                    setPorEliminar({ seccion: listadoSeccion, registro });
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </dialog>

            <dialog
                ref={formularioRef}
                className={`places-dialog places-dialog-form${
                    formulario?.seccion === 'plazas' ? ' places-dialog-wide' : ''
                }`}
                aria-labelledby="places-form-title"
                onClose={() => setFormulario(null)}
            >
                <div className="places-dialog-header">
                    <h2 id="places-form-title" className="places-dialog-title">
                        {formulario?.modo === 'alta'
                            ? configFormulario?.tituloAlta
                            : configFormulario?.tituloEdicion}
                    </h2>
                    <button
                        type="button"
                        className="places-dialog-close"
                        aria-label="Cerrar"
                        onClick={() => setFormulario(null)}
                    >
                        ✕
                    </button>
                </div>

                {formulario?.seccion === 'plazas' ? (
                    <div className="places-form-grid">
                        <label className="places-field">
                            <span className="places-field-label">Clave de plaza</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.clavePlaza}
                                maxLength={10}
                                onChange={(evento) => cambiarValor('clavePlaza', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Puesto</span>
                            <select
                                className="places-input"
                                value={formulario.valores.puestoId}
                                onChange={(evento) => cambiarValor('puestoId', evento.target.value)}
                            >
                                <option value="">Selecciona</option>
                                {puestos.map((puesto) => (
                                    <option key={puesto.id} value={puesto.id}>
                                        {`${puesto.codigoPuesto} — ${puesto.descripcion}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Area / Servicio</span>
                            <select
                                className="places-input"
                                value={formulario.valores.areaId}
                                onChange={(evento) => cambiarValor('areaId', evento.target.value)}
                            >
                                <option value="">Sin area</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.descripcion}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Tipo de contratacion</span>
                            <select
                                className="places-input"
                                value={formulario.valores.tipoContratacionId}
                                onChange={(evento) => cambiarValor('tipoContratacionId', evento.target.value)}
                            >
                                <option value="">Selecciona</option>
                                {tiposContratacion.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.descripcion}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Unidad</span>
                            <select
                                className="places-input"
                                value={formulario.valores.unidadId}
                                onChange={(evento) => cambiarValor('unidadId', evento.target.value)}
                            >
                                <option value="">Selecciona</option>
                                {unidades.map((unidad) => (
                                    <option key={unidad.id} value={unidad.id}>
                                        {unidad.unidad}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Estatus</span>
                            <select
                                className="places-input"
                                value={formulario.valores.ocupabilidad}
                                onChange={(evento) => cambiarValor('ocupabilidad', evento.target.value)}
                            >
                                <option value="vacante">Vacante</option>
                                <option value="ocupada">Ocupada</option>
                            </select>
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Denominacion del puesto</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.denominacionPuesto}
                                maxLength={150}
                                onChange={(evento) => cambiarValor('denominacionPuesto', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Cantidad plaza / hora</span>
                            <input
                                type="number"
                                className="places-input"
                                value={formulario.valores.cantidadPlazaHora}
                                onChange={(evento) => cambiarValor('cantidadPlazaHora', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Fecha de vacancia</span>
                            <input
                                type="date"
                                className="places-input"
                                value={formulario.valores.fechaVacancia}
                                onChange={(evento) => cambiarValor('fechaVacancia', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Codigo SHCP</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.codigoSHCP}
                                maxLength={30}
                                onChange={(evento) => cambiarValor('codigoSHCP', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Codigo federal de puesto</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.codigoFederalPuesto}
                                maxLength={30}
                                onChange={(evento) => cambiarValor('codigoFederalPuesto', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Clave presupuestal</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.clavePresupuestalActual}
                                maxLength={60}
                                onChange={(evento) =>
                                    cambiarValor('clavePresupuestalActual', evento.target.value)
                                }
                            />
                        </label>
                    </div>
                ) : formulario?.seccion === 'areas' ? (
                    <div className="places-form-grid">
                        <label className="places-field">
                            <span className="places-field-label">Nombre del area</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.descripcion}
                                maxLength={150}
                                onChange={(evento) => cambiarValor('descripcion', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Clave de area (opcional)</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.claveArea}
                                maxLength={30}
                                onChange={(evento) => cambiarValor('claveArea', evento.target.value)}
                            />
                        </label>
                    </div>
                ) : formulario ? (
                    <div className="places-form-grid">
                        <label className="places-field">
                            <span className="places-field-label">Codigo de puesto</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.codigoPuesto}
                                maxLength={20}
                                onChange={(evento) => cambiarValor('codigoPuesto', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Nombre del puesto</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.descripcion}
                                maxLength={150}
                                onChange={(evento) => cambiarValor('descripcion', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Grado salarial</span>
                            <input
                                type="text"
                                className="places-input"
                                value={formulario.valores.gradoSalarial}
                                maxLength={10}
                                onChange={(evento) => cambiarValor('gradoSalarial', evento.target.value)}
                            />
                        </label>
                        <label className="places-field">
                            <span className="places-field-label">Rango salarial</span>
                            <input
                                type="number"
                                className="places-input"
                                value={formulario.valores.rangoSalarial}
                                onChange={(evento) => cambiarValor('rangoSalarial', evento.target.value)}
                            />
                        </label>
                    </div>
                ) : null}

                {errorFormulario && (
                    <p className="places-error" role="alert">{errorFormulario}</p>
                )}

                <div className="places-dialog-actions">
                    <button
                        type="button"
                        className="places-action places-action-cancel"
                        onClick={() => setFormulario(null)}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="places-action places-action-create"
                        disabled={!formularioValido || guardando}
                        onClick={guardarFormulario}
                    >
                        {guardando
                            ? 'Guardando...'
                            : formulario?.modo === 'alta' ? 'Guardar' : 'Actualizar'}
                    </button>
                </div>
            </dialog>

            <dialog
                ref={eliminarRef}
                className="places-dialog places-dialog-confirm"
                aria-labelledby="places-confirm-title"
                onClose={() => setPorEliminar(null)}
            >
                <div className="places-confirm-icon" aria-hidden="true">!</div>
                <h2 id="places-confirm-title" className="places-dialog-title">
                    ¿Eliminar {porEliminar ? SECCIONES[porEliminar.seccion].singular : ''}?
                </h2>
                <p className="places-confirm-text">
                    {EtiquetaRegistro(porEliminar?.seccion, porEliminar?.registro)}
                </p>
                {errorEliminar && (
                    <p className="places-error" role="alert">{errorEliminar}</p>
                )}

                <div className="places-dialog-actions">
                    <button
                        ref={cancelarEliminarRef}
                        type="button"
                        className="places-action places-action-cancel"
                        onClick={() => setPorEliminar(null)}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="places-action places-action-danger"
                        disabled={eliminando}
                        onClick={confirmarEliminar}
                    >
                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </dialog>

            {aviso && <div className="places-toast" role="status">{aviso}</div>}
        </div>
    );
}

export default PlacesModule;
