import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getEmpleados,
  getPlazas,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
} from '../../../composable/HumanResourcesApi';
import './employeesModule.css';

const TAMANOS_PAGINA = [10, 50, 100];

const FILTROS_INICIALES = {
  texto: '',
  sexo: '',
  activo: '',
  tamano: 10,
  pagina: 1,
};

const VALORES_FORM_INICIAL = {
  plazaId: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo: 'H',
  curp: '',
  rfc: '',
  nss: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  activo: true,
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

function TextoSexo(sexo) {
  if (sexo === 'H') return 'Hombre';
  if (sexo === 'M') return 'Mujer';
  return 'Otro';
}

function EmployeesModule({ user, catalogs, module }) {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [textoBuscado, setTextoBuscado] = useState('');
  const [aviso, setAviso] = useState('');
  const [paginado, setPaginado] = useState({
    pagina: 1,
    tamano: 10,
    total: 0,
    totalPaginas: 0,
  });

  const [dialogoAlta, setDialogoAlta] = useState(false);
  const [dialogoEdicion, setDialogoEdicion] = useState(null);
  const [dialogoBaja, setDialogoBaja] = useState(null);

  const [plazas, setPlazas] = useState([]);
  const [valoresAlta, setValoresAlta] = useState(VALORES_FORM_INICIAL);
  const [valoresEdicion, setValoresEdicion] = useState(VALORES_FORM_INICIAL);
  const [guardandoAlta, setGuardandoAlta] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [guardandoBaja, setGuardandoBaja] = useState(false);
  const [errorAlta, setErrorAlta] = useState('');
  const [errorEdicion, setErrorEdicion] = useState('');
  const [errorBaja, setErrorBaja] = useState('');

  const [recarga, setRecarga] = useState(0);

  const dialogoAltaRef = useRef(null);
  const dialogoEdicionRef = useRef(null);
  const dialogoBajaRef = useRef(null);
  const cancelarBajaRef = useRef(null);

  const nombresPermiso = new Set(
    (module?.permisos ?? []).map((id) => catalogs?.access?.[id]?.trim().toLowerCase())
  );
  const idsPermiso = new Set((module?.permisos ?? []).map(Number));
  const tienePermiso = (nombre, id) => nombresPermiso.has(nombre) || idsPermiso.has(id);

  const puedeVer = tienePermiso('ver', 1);
  const puedeEditar = tienePermiso('editar', 2);
  const puedeCrear = tienePermiso('crear', 3);
  const puedeEliminar = tienePermiso('eliminar', 4);

  const token = user?.accessToken;

  useEffect(() => {
    const d = dialogoAltaRef.current;
    if (dialogoAlta) {
      if (!d.open) d.showModal();
    } else if (d?.open) {
      d.close();
    }
  }, [dialogoAlta]);

  useEffect(() => {
    const d = dialogoEdicionRef.current;
    if (dialogoEdicion) {
      if (!d.open) d.showModal();
    } else if (d?.open) {
      d.close();
    }
  }, [dialogoEdicion]);

  useEffect(() => {
    const d = dialogoBajaRef.current;
    if (dialogoBaja) {
      if (!d.open) d.showModal();
      cancelarBajaRef.current?.focus();
    } else if (d?.open) {
      d.close();
    }
  }, [dialogoBaja]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setFiltros((previo) =>
        previo.texto === textoBuscado.trim()
          ? previo
          : { ...previo, texto: textoBuscado.trim(), pagina: 1 }
      );
    }, 400);
    return () => clearTimeout(temporizador);
  }, [textoBuscado]);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(''), 3200);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  useEffect(() => {
    if (!puedeVer) return undefined;

    let activo = true;
    const controlador = new AbortController();

    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const query = {
          pagina: filtros.pagina,
          tamano: filtros.tamano,
          texto: filtros.texto || undefined,
          sexo: filtros.sexo || undefined,
          activo: filtros.activo === 'true' ? true : filtros.activo === 'false' ? false : undefined,
        };

        const res = await getEmpleados(query, token, controlador.signal);
        if (activo) {
          setEmpleados(res.empleados || []);
          setPaginado({
            pagina: res.pagina,
            tamano: res.tamano,
            total: res.total,
            totalPaginas: res.totalPaginas,
          });
        }
      } catch (err) {
        if (activo && !(err instanceof Error && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Error al cargar empleados.');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [filtros, puedeVer, token, recarga]);

  useEffect(() => {
    if (!token) return;
    async function cargarPlazas() {
      try {
        const res = await getPlazas({ tamano: 100, ocupabilidad: false });
        setPlazas(res.plazas || []);
      } catch {
        // Silencioso
      }
    }
    cargarPlazas();
  }, [token, dialogoAlta, dialogoEdicion, recarga]);

  const plazasDisponibles = useMemo(() => {
    const lista = [...plazas];
    if (dialogoEdicion && dialogoEdicion.plazaId && !lista.some((p) => p.id === dialogoEdicion.plazaId)) {
      lista.unshift({
        id: dialogoEdicion.plazaId,
        clavePlaza: dialogoEdicion.clavePlaza,
        denominacionPuesto: dialogoEdicion.denominacionPuesto,
      });
    }
    return lista;
  }, [plazas, dialogoEdicion]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((previo) => ({ ...previo, [campo]: valor, pagina: 1 }));
  };

  const irAPagina = (pagina) => {
    if (pagina < 1 || pagina > paginado.totalPaginas) return;
    setFiltros((previo) => ({ ...previo, pagina }));
  };

  const limpiarFiltros = () => {
    setTextoBuscado('');
    setFiltros(FILTROS_INICIALES);
  };

  const handleAltaChange = (campo, valor) => {
    setValoresAlta((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleEdicionChange = (campo, valor) => {
    setValoresEdicion((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAbrirAlta = () => {
    setValoresAlta(VALORES_FORM_INICIAL);
    setErrorAlta('');
    setDialogoAlta(true);
  };

  const handleAbrirEdicion = (emp) => {
    setValoresEdicion({
      plazaId: emp.plazaId || '',
      nombres: emp.nombres,
      apellidoPaterno: emp.apellidoPaterno,
      apellidoMaterno: emp.apellidoMaterno || '',
      fechaNacimiento: emp.fechaNacimiento,
      sexo: emp.sexo,
      curp: emp.curp,
      rfc: emp.rfc,
      nss: emp.nss || '',
      fechaIngreso: emp.fechaIngreso,
      activo: emp.activo,
    });
    setErrorEdicion('');
    setDialogoEdicion(emp);
  };

  const handleAltaSubmit = async (e) => {
    e.preventDefault();
    if (!valoresAlta.plazaId) {
      setErrorAlta('Debes asociar una plaza vacante al empleado.');
      return;
    }
    setGuardandoAlta(true);
    setErrorAlta('');
    try {
      const payload = {
        ...valoresAlta,
        plazaId: Number(valoresAlta.plazaId),
        apellidoMaterno: valoresAlta.apellidoMaterno || null,
        nss: valoresAlta.nss || null,
      };

      await createEmpleado(payload, token);
      setDialogoAlta(false);
      setAviso('Se registro el empleado.');
      setRecarga((prev) => prev + 1);
    } catch (err) {
      setErrorAlta(err instanceof Error ? err.message : 'Error al registrar empleado.');
    } finally {
      setGuardandoAlta(false);
    }
  };

  const handleEdicionSubmit = async (e) => {
    e.preventDefault();
    setGuardandoEdicion(true);
    setErrorEdicion('');
    try {
      const payload = {
        ...valoresEdicion,
        plazaId: valoresEdicion.plazaId ? Number(valoresEdicion.plazaId) : null,
        apellidoMaterno: valoresEdicion.apellidoMaterno || null,
        nss: valoresEdicion.nss || null,
      };

      await updateEmpleado(dialogoEdicion.id, payload, token);
      setDialogoEdicion(null);
      setAviso('Se actualizo el empleado.');
      setRecarga((prev) => prev + 1);
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'Error al actualizar empleado.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleBajaConfirm = async () => {
    setGuardandoBaja(true);
    setErrorBaja('');
    try {
      if (dialogoBaja.activo) {
        const payload = {
          plazaId: null,
          nombres: dialogoBaja.nombres,
          apellidoPaterno: dialogoBaja.apellidoPaterno,
          apellidoMaterno: dialogoBaja.apellidoMaterno,
          fechaNacimiento: dialogoBaja.fechaNacimiento,
          sexo: dialogoBaja.sexo,
          curp: dialogoBaja.curp,
          rfc: dialogoBaja.rfc,
          nss: dialogoBaja.nss,
          fechaIngreso: dialogoBaja.fechaIngreso,
          activo: false,
        };
        await updateEmpleado(dialogoBaja.id, payload, token);
        setAviso('Se dio de baja al empleado.');
      } else {
        await deleteEmpleado(dialogoBaja.id, token);
        setAviso('Se elimino el empleado.');
      }
      setDialogoBaja(null);
      setRecarga((prev) => prev + 1);
    } catch (err) {
      setErrorBaja(err instanceof Error ? err.message : 'Error al procesar baja o eliminacion.');
    } finally {
      setGuardandoBaja(false);
    }
  };

  const desdeRegistro = paginado.total === 0 ? 0 : (paginado.pagina - 1) * paginado.tamano + 1;
  const hastaRegistro = Math.min(paginado.pagina * paginado.tamano, paginado.total);

  const filtrosActivos =
    filtros.texto !== '' || filtros.sexo !== '' || filtros.activo !== '' || filtros.tamano !== 10;

  return (
    <div className="employees-module">
      <h1 className="employees-title">{module?.name ?? 'Administracion de Empleados'}</h1>

      {!puedeVer ? (
        <p className="content-placeholder">No tienes permisos asignados en este modulo.</p>
      ) : (
        <>
          <div className="employees-panel">
            <div className="employees-panel-actions">
              <div className="employees-toolbar">
                <div className="employees-search-box">
                  <span className="employees-search-icon" aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    className="employees-toolbar-input employees-toolbar-search"
                    value={textoBuscado}
                    placeholder="Nombre, CURP, RFC o clave de plaza"
                    aria-label="Buscar empleado por nombre, CURP, RFC o clave de plaza"
                    onChange={(evento) => setTextoBuscado(evento.target.value)}
                  />
                </div>

                <select
                  className="employees-toolbar-input"
                  aria-label="Filtrar por sexo"
                  value={filtros.sexo}
                  onChange={(evento) => cambiarFiltro('sexo', evento.target.value)}
                >
                  <option value="">Sexo: Todos</option>
                  <option value="H">Sexo: Hombre</option>
                  <option value="M">Sexo: Mujer</option>
                  <option value="X">Sexo: Otro</option>
                </select>

                <select
                  className="employees-toolbar-input"
                  aria-label="Filtrar por estado"
                  value={filtros.activo}
                  onChange={(evento) => cambiarFiltro('activo', evento.target.value)}
                >
                  <option value="">Estado: Todos</option>
                  <option value="true">Estado: Activos</option>
                  <option value="false">Estado: Inactivos</option>
                </select>

                <select
                  className="employees-toolbar-input employees-toolbar-size"
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
                  className="employees-toolbar-reset"
                  disabled={!filtrosActivos}
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </button>

                {puedeCrear && (
                  <button
                    type="button"
                    className="employees-toolbar-create"
                    onClick={handleAbrirAlta}
                  >
                    <span aria-hidden="true">+</span> Registrar Empleado
                  </button>
                )}
              </div>
            </div>
          </div>

          <section className="employees-table-section" aria-label="Listado de empleados">
            <p className="employees-showing">
              {cargando
                ? 'Consultando...'
                : paginado.total === 0
                  ? 'Sin registros que coincidan'
                  : `Mostrando ${desdeRegistro} a ${hastaRegistro} de ${paginado.total} registros (${paginado.tamano} por pagina)`}
            </p>

            {error ? (
              <p className="employees-error" role="alert">{error}</p>
            ) : empleados.length === 0 ? null : (
              <div className="employees-table-wrapper">
                <table className="employees-table">
                  <colgroup>
                    <col className="employees-col-num" />
                    <col className="employees-col-nombre" />
                    <col className="employees-col-plaza" />
                    <col className="employees-col-curp" />
                    <col className="employees-col-rfc" />
                    <col className="employees-col-nss" />
                    <col className="employees-col-sexo" />
                    <col className="employees-col-fecha" />
                    <col className="employees-col-estatus" />
                    <col className="employees-col-acciones" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">No.</th>
                      <th scope="col">Nombre Completo</th>
                      <th scope="col">Plaza</th>
                      <th scope="col">CURP</th>
                      <th scope="col">RFC</th>
                      <th scope="col">NSS</th>
                      <th scope="col">Sexo</th>
                      <th scope="col">Fecha Ingreso</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((emp) => (
                      <tr key={emp.id}>
                        <td className="employees-cell-key">{emp.id}</td>
                        <td>{emp.nombreCompleto}</td>
                        <td>{emp.clavePlaza ? emp.clavePlaza : 'Sin plaza'}</td>
                        <td className="employees-cell-key">{emp.curp}</td>
                        <td className="employees-cell-key">{emp.rfc}</td>
                        <td className="employees-cell-key">{emp.nss || 'N/A'}</td>
                        <td>{TextoSexo(emp.sexo)}</td>
                        <td className="employees-cell-key">{FechaCorta(emp.fechaIngreso)}</td>
                        <td>
                          <span
                            className={`employees-badge${emp.activo ? ' is-activo' : ' is-inactivo'}`}
                          >
                            {emp.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="employees-row-actions">
                            {puedeEditar && (
                              <button
                                type="button"
                                className="employees-row-icon employees-row-icon-edit"
                                aria-label={`Editar empleado ${emp.nombreCompleto}`}
                                onClick={() => handleAbrirEdicion(emp)}
                              >
                                ✎
                              </button>
                            )}
                            {puedeEliminar && (
                              <button
                                type="button"
                                className="employees-row-icon employees-row-icon-delete"
                                aria-label={`${emp.activo ? 'Dar de baja' : 'Eliminar'} empleado ${emp.nombreCompleto}`}
                                onClick={() => {
                                  setErrorBaja('');
                                  setDialogoBaja(emp);
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

            <div className="employees-footer">
              {paginado.total > 0 && (
                <span className="employees-found">
                  {`${paginado.total} registros encontrados`}
                </span>
              )}

              {paginado.totalPaginas > 1 && (
                <div className="employees-pager" role="navigation" aria-label="Paginacion">
                  <button
                    type="button"
                    className="employees-page employees-page-step"
                    disabled={paginado.pagina <= 1 || cargando}
                    onClick={() => irAPagina(paginado.pagina - 1)}
                  >
                    ‹ Anterior
                  </button>
                  {PaginasVisibles(paginado.pagina, paginado.totalPaginas).map((numero) => (
                    <button
                      key={numero}
                      type="button"
                      className={`employees-page${numero === paginado.pagina ? ' is-active' : ''}`}
                      aria-current={numero === paginado.pagina ? 'page' : undefined}
                      disabled={cargando}
                      onClick={() => irAPagina(numero)}
                    >
                      {numero}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="employees-page employees-page-step"
                    disabled={paginado.pagina >= paginado.totalPaginas || cargando}
                    onClick={() => irAPagina(paginado.pagina + 1)}
                  >
                    Siguiente ›
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <dialog
        ref={dialogoAltaRef}
        className="employees-dialog employees-dialog-wide"
        aria-labelledby="employees-alta-title"
        onClose={() => setDialogoAlta(false)}
      >
        <div className="employees-dialog-header">
          <h2 id="employees-alta-title" className="employees-dialog-title">
            Registrar nuevo empleado
          </h2>
          <button
            type="button"
            className="employees-dialog-close"
            aria-label="Cerrar"
            onClick={() => setDialogoAlta(false)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleAltaSubmit}>
          <div className="employees-form-grid">
            <label className="employees-field">
              <span className="employees-field-label">Nombres</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresAlta.nombres}
                maxLength={50}
                onChange={(e) => handleAltaChange('nombres', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Apellido paterno</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresAlta.apellidoPaterno}
                maxLength={50}
                onChange={(e) => handleAltaChange('apellidoPaterno', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Apellido materno</span>
              <input
                type="text"
                className="employees-input"
                value={valoresAlta.apellidoMaterno}
                maxLength={50}
                onChange={(e) => handleAltaChange('apellidoMaterno', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Sexo</span>
              <select
                className="employees-input"
                value={valoresAlta.sexo}
                onChange={(e) => handleAltaChange('sexo', e.target.value)}
              >
                <option value="H">Hombre</option>
                <option value="M">Mujer</option>
                <option value="X">Otro / Sin especificar</option>
              </select>
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Fecha de nacimiento</span>
              <input
                type="date"
                required
                className="employees-input"
                value={valoresAlta.fechaNacimiento}
                onChange={(e) => handleAltaChange('fechaNacimiento', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">CURP</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresAlta.curp}
                maxLength={18}
                onChange={(e) => handleAltaChange('curp', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">RFC</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresAlta.rfc}
                maxLength={13}
                onChange={(e) => handleAltaChange('rfc', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">NSS</span>
              <input
                type="text"
                className="employees-input"
                value={valoresAlta.nss}
                maxLength={11}
                onChange={(e) => handleAltaChange('nss', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Fecha de ingreso</span>
              <input
                type="date"
                required
                className="employees-input"
                value={valoresAlta.fechaIngreso}
                onChange={(e) => handleAltaChange('fechaIngreso', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Plaza presupuestal (vacante)</span>
              <select
                className="employees-input"
                required
                value={valoresAlta.plazaId}
                onChange={(e) => handleAltaChange('plazaId', e.target.value)}
              >
                <option value="" disabled>
                  {plazas.length === 0 ? 'No hay plazas vacantes disponibles' : 'Selecciona una plaza vacante'}
                </option>
                {plazas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.clavePlaza} — ${p.denominacionPuesto || p.descripcionPuesto}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {plazas.length === 0 && (
            <p className="employees-error" role="alert">
              No hay plazas vacantes disponibles. Registra o libera una plaza antes de dar de alta un empleado.
            </p>
          )}

          {errorAlta && <p className="employees-error" role="alert">{errorAlta}</p>}

          <div className="employees-dialog-actions">
            <button
              type="button"
              className="employees-action employees-action-cancel"
              onClick={() => setDialogoAlta(false)}
              disabled={guardandoAlta}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="employees-action employees-action-create"
              disabled={guardandoAlta || plazas.length === 0}
            >
              {guardandoAlta ? 'Registrando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoEdicionRef}
        className="employees-dialog employees-dialog-wide"
        aria-labelledby="employees-edicion-title"
        onClose={() => setDialogoEdicion(null)}
      >
        <div className="employees-dialog-header">
          <h2 id="employees-edicion-title" className="employees-dialog-title">
            Editar expediente de empleado
          </h2>
          <button
            type="button"
            className="employees-dialog-close"
            aria-label="Cerrar"
            onClick={() => setDialogoEdicion(null)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleEdicionSubmit}>
          <div className="employees-form-grid">
            <label className="employees-field">
              <span className="employees-field-label">Nombres</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresEdicion.nombres}
                maxLength={50}
                onChange={(e) => handleEdicionChange('nombres', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Apellido paterno</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresEdicion.apellidoPaterno}
                maxLength={50}
                onChange={(e) => handleEdicionChange('apellidoPaterno', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Apellido materno</span>
              <input
                type="text"
                className="employees-input"
                value={valoresEdicion.apellidoMaterno}
                maxLength={50}
                onChange={(e) => handleEdicionChange('apellidoMaterno', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Sexo</span>
              <select
                className="employees-input"
                value={valoresEdicion.sexo}
                onChange={(e) => handleEdicionChange('sexo', e.target.value)}
              >
                <option value="H">Hombre</option>
                <option value="M">Mujer</option>
                <option value="X">Otro / Sin especificar</option>
              </select>
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Fecha de nacimiento</span>
              <input
                type="date"
                required
                className="employees-input"
                value={valoresEdicion.fechaNacimiento}
                onChange={(e) => handleEdicionChange('fechaNacimiento', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">CURP</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresEdicion.curp}
                maxLength={18}
                onChange={(e) => handleEdicionChange('curp', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">RFC</span>
              <input
                type="text"
                required
                className="employees-input"
                value={valoresEdicion.rfc}
                maxLength={13}
                onChange={(e) => handleEdicionChange('rfc', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">NSS</span>
              <input
                type="text"
                className="employees-input"
                value={valoresEdicion.nss}
                maxLength={11}
                onChange={(e) => handleEdicionChange('nss', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Fecha de ingreso</span>
              <input
                type="date"
                required
                className="employees-input"
                value={valoresEdicion.fechaIngreso}
                onChange={(e) => handleEdicionChange('fechaIngreso', e.target.value)}
              />
            </label>
            <label className="employees-field">
              <span className="employees-field-label">Plaza presupuestal</span>
              <select
                className="employees-input"
                value={valoresEdicion.plazaId}
                onChange={(e) => handleEdicionChange('plazaId', e.target.value)}
              >
                <option value="">Sin plaza adscrita (Vacante)</option>
                {plazasDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.clavePlaza} — ${p.denominacionPuesto || p.descripcionPuesto}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="employees-field employees-field-full">
              <span className="employees-field-label">Estado de actividad</span>
              <select
                className="employees-input"
                value={String(valoresEdicion.activo)}
                onChange={(e) => handleEdicionChange('activo', e.target.value === 'true')}
              >
                <option value="true">Activo (Vincular plaza si se asigno)</option>
                <option value="false">Inactivo (Sera liberado de su plaza de forma automatica)</option>
              </select>
            </label>
          </div>

          {errorEdicion && <p className="employees-error" role="alert">{errorEdicion}</p>}

          <div className="employees-dialog-actions">
            <button
              type="button"
              className="employees-action employees-action-cancel"
              onClick={() => setDialogoEdicion(null)}
              disabled={guardandoEdicion}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="employees-action employees-action-create"
              disabled={guardandoEdicion}
            >
              {guardandoEdicion ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoBajaRef}
        className="employees-dialog employees-dialog-confirm"
        aria-labelledby="employees-baja-title"
        onClose={() => setDialogoBaja(null)}
      >
        <div className="employees-confirm-icon" aria-hidden="true">!</div>
        <h2 id="employees-baja-title" className="employees-dialog-title">
          {dialogoBaja?.activo ? '¿Dar de baja al empleado?' : '¿Eliminar registro?'}
        </h2>
        <p className="employees-confirm-text">
          {dialogoBaja?.activo
            ? `Se inhabilitara el expediente de ${dialogoBaja?.nombreCompleto} y su plaza se liberara inmediatamente.`
            : `Se eliminara permanentemente a ${dialogoBaja?.nombreCompleto}. Esta accion es irreversible.`}
        </p>

        {errorBaja && <p className="employees-error" role="alert">{errorBaja}</p>}

        <div className="employees-dialog-actions">
          <button
            ref={cancelarBajaRef}
            type="button"
            className="employees-action employees-action-cancel"
            onClick={() => setDialogoBaja(null)}
            disabled={guardandoBaja}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="employees-action employees-action-danger"
            onClick={handleBajaConfirm}
            disabled={guardandoBaja}
          >
            {guardandoBaja
              ? 'Procesando...'
              : dialogoBaja?.activo ? 'Dar de baja' : 'Eliminar'}
          </button>
        </div>
      </dialog>

      {aviso && <div className="employees-toast" role="status">{aviso}</div>}
    </div>
  );
}

export default EmployeesModule;
