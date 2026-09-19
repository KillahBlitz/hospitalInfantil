import { useEffect, useMemo, useRef, useState } from 'react';
import {
    getAreas,
    getPuestos,
    createArea,
    updateArea,
    deleteArea,
    createPuesto,
    updatePuesto,
    deletePuesto,
} from '../../../composable/HumanResourcesApi';
import './placesModules.css';

const SECCIONES = {
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
    if (seccion === 'areas') return valores.descripcion.trim().length > 0;
    return valores.codigoPuesto.trim().length > 0 && valores.descripcion.trim().length > 0;
}

function EtiquetaRegistro(seccion, registro) {
    if (!registro) return '';
    return seccion === 'areas'
        ? registro.descripcion
        : `${registro.codigoPuesto} — ${registro.descripcion}`;
}

function PlacesModule({ module, catalogs }) {
    const [seccionActiva, setSeccionActiva] = useState(null);
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
                if (seccion === 'areas') await createArea(peticion);
                else await createPuesto(peticion);
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
            if (seccion === 'areas') await deleteArea(registro.id);
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

    const registros = listadoSeccion === 'areas' ? areas : puestos;

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return registros;
        return registros.filter((registro) =>
            (registro.descripcion ?? '').toLowerCase().includes(termino)
        );
    }, [registros, busqueda]);

    const configListado = listadoSeccion ? SECCIONES[listadoSeccion] : null;
    const configFormulario = formulario ? SECCIONES[formulario.seccion] : null;
    const formularioValido = formulario
        ? EsFormularioValido(formulario.seccion, formulario.valores)
        : false;

    return (
        <div className="places-module">

            {sinPermisos ? (
                <p className="content-placeholder">
                    No tienes permisos asignados en este modulo.
                </p>
            ) : (
                <div className="places-panel">
                    <div className="places-panel-groups" role="tablist">
                        {Object.entries(SECCIONES).map(([clave, config]) => (
                            <button
                                key={clave}
                                type="button"
                                role="tab"
                                aria-selected={seccionActiva === clave}
                                className={`places-group${seccionActiva === clave ? ' is-active' : ''}`}
                                onClick={() => setSeccionActiva(seccionActiva === clave ? null : clave)}
                            >
                                {config.etiqueta}
                            </button>
                        ))}
                    </div>

                    <div className="places-panel-actions">
                        {!seccionActiva ? (
                            <p className="places-hint">
                            </p>
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
                className="places-dialog places-dialog-form"
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

                {formulario?.seccion === 'areas' ? (
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
