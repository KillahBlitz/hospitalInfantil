import { useEffect, useMemo, useRef, useState } from 'react';
import { getUsers, getRegisteredUsers, deactivateUser, updateUserRequestComment, approveUser } from '../../../composable/PlatformApi';
import { GetUserTypesCatalog, GetModulesCatalog } from '../../../composable/AuthApi';
import './accountsModule.css';

function AccountsModule({ user, module, catalogs }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [showRegistered, setShowRegistered] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deactivating, setDeactivating] = useState(false);
    const [deactivationError, setDeactivationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [selectedCommentUser, setSelectedCommentUser] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [activationUser, setActivationUser] = useState(null);
    const [activationType, setActivationType] = useState('');
    const [activationArea, setActivationArea] = useState('');
    const [activationModule, setActivationModule] = useState('');
    const [activationPermissions, setActivationPermissions] = useState(['1']);
    const [addedPermissions, setAddedPermissions] = useState([]);
    const [realUserTypes, setRealUserTypes] = useState({});
    const [realAllModules, setRealAllModules] = useState({});
    
    const dialogRef = useRef(null);
    const commentDialogRef = useRef(null);
    const activationDialogRef = useRef(null);
    const cancelRef = useRef(null);
    const commentCancelRef = useRef(null);
    const activationCancelRef = useRef(null);
    const toggleRef = useRef(null);
    const submittingRef = useRef(false);

    const permissions = new Set(
        (module?.permisos ?? []).map((id) => catalogs?.access?.[id]?.trim().toLowerCase())
    );
    const canEdit = permissions.has('editar');
    const canCreate = permissions.has('crear');
    const canDelete = permissions.has('eliminar');
    const showChat = canCreate && !showRegistered;

    const handleAreaChange = async (e) => {
        const areaId = e.target.value;
        setActivationArea(areaId);
        setActivationModule('');
        setActivationPermissions(['1']);
        
        if (areaId) {
            try {
                const modsResp = await GetModulesCatalog({ areasId: [parseInt(areaId)] });
                setRealAllModules(modsResp?.modulos || {});
            } catch (e) {
                console.error("Error fetching modules for area", e);
                setRealAllModules({});
            }
        } else {
            setRealAllModules({});
        }
    };

    const handleModuleChange = (e) => {
        setActivationModule(e.target.value);
        setActivationPermissions(['1']);
    };

    const togglePermission = (permId) => {
        if (permId === '1') return; // Cannot toggle "ver"
        setActivationPermissions(prev => 
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const addPermissionSet = () => {
        if (!activationArea || !activationModule) return;
        
        const areaName = Object.keys(catalogs?.areas || {}).find(key => catalogs.areas[key].toString() === activationArea);
        const moduleName = realAllModules[activationModule];
        
        const newSet = {
            areaId: activationArea,
            areaName: areaName || 'Desconocida',
            moduleId: activationModule,
            moduleName: moduleName || 'Desconocido',
            permissions: activationPermissions
        };
        
        setAddedPermissions(prev => {
            const index = prev.findIndex(s => s.moduleId === activationModule);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = newSet;
                return updated;
            }
            return [...prev, newSet];
        });
    };


    const cancelActivation = () => {
        if (activationDialogRef.current) {
            activationDialogRef.current.close();
        }
        setActivationUser(null);
        setActivationType('');
        setActivationArea('');
        setActivationModule('');
        setActivationPermissions(['1']);
        setAddedPermissions([]);
    };

    const confirmActivation = async () => {
        if (!activationType || addedPermissions.length === 0 || submittingRef.current) return;
        submittingRef.current = true;
        
        try {
            const parsedType = parseInt(activationType, 10);
            const permisos = addedPermissions.map(p => ({
                moduloId: parseInt(p.moduleId, 10),
                permisosIds: p.permissions.map(perm => parseInt(perm, 10))
            }));
            
            await approveUser(
                activationUser.id,
                parsedType,
                permisos,
                user?.accessToken
            );
            
            cancelActivation();
            setToastMessage('Usuario Aprobado correctamente');
            
            setTimeout(() => {
                setToastMessage('');
            }, 3000);
            
            // Re-fetch users
            if (toggleRef.current) {
                const event = new Event('refresh');
                toggleRef.current.dispatchEvent(event);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Error approving user", err);
            alert("No se pudo aprobar el usuario: " + err.message);
        } finally {
            submittingRef.current = false;
        }
    };

    const removePermissionSet = (index) => {
        setAddedPermissions(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        const loadUsers = async () => {
            try {
                let list;
                if (showRegistered) {
                    const response = await getRegisteredUsers(controller.signal);
                    list = response.usuarios.map((user) => ({ ...user, usuario: user.alias }));
                } else {
                    const response = await getUsers(controller.signal);
                    list = response.solicitudes;
                }
                if (active) setUsers(list);
            } catch {
                if (active) setError(showRegistered
                    ? 'No se pudieron cargar los usuarios registrados.'
                    : 'No se pudieron cargar las solicitudes de cuentas.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadUsers();
        return () => {
            active = false;
            controller.abort();
        };
    }, [showRegistered]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (selectedUser) {
            if (!dialog.open) dialog.showModal();
            cancelRef.current?.focus();
        } else if (dialog?.open) {
            dialog.close();
        }
    }, [selectedUser]);

    useEffect(() => {
        const dialog = commentDialogRef.current;
        if (selectedCommentUser) {
            if (!dialog.open) dialog.showModal();
            commentCancelRef.current?.focus();
        } else if (dialog?.open) {
            dialog.close();
        }
    }, [selectedCommentUser]);

    const openActivation = async (account) => {
        if (!canEdit || showRegistered || submittingRef.current) return;
        setActivationUser(account);
        setActivationType('');
        setActivationArea('');
        setActivationModule('');
        setActivationPermissions(['1']);
        setAddedPermissions([]);
        
        try {
            if (Object.keys(realUserTypes).length === 0) {
                const typesResp = await GetUserTypesCatalog();
                setRealUserTypes(typesResp?.userTypes || typesResp?.UserTypes || {});
            }
            if (activationDialogRef.current && !activationDialogRef.current.open) {
                activationDialogRef.current.showModal();
            }
        } catch (e) {
            console.error("Error fetching user types for activation", e);
        }
    };

    const openDeactivation = (account) => {
        if (!canDelete || !showRegistered || submittingRef.current) return;
        setDeactivationError('');
        setSuccessMessage('');
        setSelectedUser(account);
    };

    const cancelDeactivation = () => {
        if (submittingRef.current) return;
        setSelectedUser(null);
        setDeactivationError('');
    };

    const confirmDeactivation = async () => {
        if (!selectedUser || !canDelete || submittingRef.current) return;
        submittingRef.current = true;
        setDeactivating(true);
        setDeactivationError('');
        try {
            const result = await deactivateUser(selectedUser.id, user?.accessToken);
            setUsers((previous) => previous.filter((account) => account.id !== selectedUser.id));
            setSuccessMessage(result.message);
            setSelectedUser(null);
            if (selectedUser.id === user?.id) {
                localStorage.removeItem('user');
                window.location.href = '/';
            } else {
                dialogRef.current.close();
                toggleRef.current?.focus();
            }
        } catch (error) {
            setDeactivationError(error instanceof Error ? error.message : 'No se pudo completar la baja.');
        } finally {
            submittingRef.current = false;
            setDeactivating(false);
        }
    };

    const openComment = (account) => {
        if (!canCreate || showRegistered || submittingRef.current) return;
        setCommentError('');
        setSuccessMessage('');
        setCommentText(account.comentario || '');
        setSelectedCommentUser(account);
    };

    const cancelComment = () => {
        if (submittingRef.current) return;
        setSelectedCommentUser(null);
        setCommentError('');
    };

    const confirmComment = async () => {
        if (!selectedCommentUser || !canCreate || submittingRef.current) return;
        submittingRef.current = true;
        setSavingComment(true);
        setCommentError('');
        try {
            const result = await updateUserRequestComment(selectedCommentUser.id, commentText, user?.accessToken);
            setUsers((previous) => previous.map((account) => 
                account.id === selectedCommentUser.id ? { ...account, comentario: commentText } : account
            ));
            setSuccessMessage(result.message);
            setSelectedCommentUser(null);
            commentDialogRef.current.close();
        } catch (error) {
            setCommentError(error instanceof Error ? error.message : 'No se pudo actualizar el comentario.');
        } finally {
            submittingRef.current = false;
            setSavingComment(false);
        }
    };

    const toggleAccountsView = () => {
        if (submittingRef.current) return;
        setUsers([]);
        setError('');
        setSuccessMessage('');
        setLoading(true);
        setShowRegistered((previous) => !previous);
    };

    const filteredUsers = useMemo(() => {
        const name = nameFilter.trim().toLowerCase();
        const email = emailFilter.trim().toLowerCase();

        return users.filter((u) => {
            if (u.id === user?.id) return false;
            const fullName = `${u.nombre ?? ''} ${u.apellidoPaterno ?? ''} ${u.apellidoMaterno ?? ''}`
                .toLowerCase();
            const matchesName = !name || fullName.includes(name);
            const matchesEmail = !email || (u.correo ?? '').toLowerCase().includes(email);
            return matchesName && matchesEmail;
        });
    }, [users, nameFilter, emailFilter, user?.id]);

    return (
        <div className="accounts-module">
            <h2 className="area-module-title">{module?.name ?? 'Configuracion de cuentas'}</h2>

            <div className="accounts-filters">
                <div className="accounts-filter">
                    <label htmlFor="account-name" className="accounts-filter-label">
                        Buscar por nombre
                    </label>
                    <input
                        id="account-name"
                        type="text"
                        className="accounts-input"
                        placeholder="Nombre o apellidos"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                    />
                </div>
                <div className="accounts-filter">
                    <label htmlFor="account-email" className="accounts-filter-label">
                        Filtrar por correo
                    </label>
                    <input
                        id="account-email"
                        type="text"
                        className="accounts-input"
                        placeholder="correo@ejemplo.com"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                    />
                </div>
                <button
                    ref={toggleRef}
                    type="button"
                    className={`accounts-action accounts-view-toggle ${showRegistered ? 'is-registered' : ''}`}
                    aria-label={showRegistered ? 'Cuentas pendientes: ver solicitudes de cuentas' : 'Cuentas activas: ver usuarios registrados'}
                    title={showRegistered ? 'Cuentas pendientes' : 'Cuentas activas'}
                    disabled={submittingRef.current}
                    onClick={toggleAccountsView}
                >
                    {showRegistered ? 'Cuentas pendientes' : 'Cuentas activas'}
                    {showRegistered && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="m5 12 4 4L19 6" />
                        </svg>
                    )}
                </button>
            </div>

            {successMessage && <p className="accounts-success" role="status">{successMessage}</p>}

            {loading ? (
                <p className="content-placeholder" role="status">
                    {showRegistered ? 'Cargando usuarios registrados...' : 'Cargando solicitudes de cuentas...'}
                </p>
            ) : error ? (
                <p className="accounts-error" role="alert">{error}</p>
            ) : filteredUsers.length === 0 ? (
                <p className="content-placeholder">No se encontraron registros.</p>
            ) : (
                <ul className="accounts-list">
                    {filteredUsers.map((u) => (
                        <li key={u.id} className="accounts-item">
                            <div className="accounts-item-info">
                                <span className="accounts-item-name">
                                    {u.nombre} {u.apellidoPaterno} {u.apellidoMaterno}
                                </span>
                                <span className="accounts-item-sub">
                                    {u.correo} - {u.usuario}
                                </span>
                            </div>
                            {(canEdit || canDelete || showChat) && (
                                <div className="accounts-item-actions">
                                    {(canEdit && !showRegistered) && (
                                        <button
                                            type="button"
                                            className="accounts-action accounts-action-activate"
                                            aria-label={`Activar cuenta de ${u.usuario}`}
                                            disabled={deactivating}
                                            onClick={() => openActivation(u)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                                <path d="m5 12 4 4L19 6" />
                                            </svg>
                                            Activar
                                        </button>
                                    )}
                                    {(canDelete && showRegistered) && (
                                        <button
                                            type="button"
                                            className="accounts-action accounts-action-deactivate"
                                            aria-label={`Desactivar cuenta de ${u.usuario}`}
                                            disabled={deactivating}
                                            onClick={() => openDeactivation(u)}
                                        >
                                            Desactivar
                                        </button>
                                    )}
                                    {showChat && (
                                        <button
                                            type="button"
                                            className="accounts-action accounts-action-chat"
                                            aria-label={`Chat con ${u.usuario}`}
                                            title={`Chat con ${u.usuario}`}
                                            onClick={() => openComment(u)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                                <path d="M20 3H4a2 2 0 0 0-2 2v16l5-5h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                                                <circle cx="7" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
                                                <circle cx="12" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
                                                <circle cx="17" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <dialog
                ref={dialogRef}
                className="accounts-confirm-dialog"
                aria-labelledby="accounts-confirm-title"
                aria-describedby="accounts-confirm-description"
                aria-busy={deactivating}
                onCancel={(event) => {
                    event.preventDefault();
                    cancelDeactivation();
                }}
            >
                <div className="accounts-confirm-icon" aria-hidden="true">!</div>
                <h2 id="accounts-confirm-title" className="accounts-confirm-title">
                    ¿Está seguro de dar de baja al usuario {selectedUser?.usuario}?
                </h2>
                <p id="accounts-confirm-description" className="accounts-confirm-description">
                    Se eliminarán su cuenta y los permisos de todos sus módulos.
                    Sus datos se conservarán como una solicitud de acceso.
                </p>
                {deactivationError && <p className="accounts-error" role="alert">{deactivationError}</p>}
                <div className="accounts-confirm-actions">
                    <button
                        ref={cancelRef}
                        type="button"
                        className="accounts-action accounts-confirm-cancel"
                        disabled={deactivating}
                        onClick={cancelDeactivation}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="accounts-action accounts-action-deactivate"
                        disabled={deactivating || !canDelete}
                        onClick={confirmDeactivation}
                    >
                        {deactivating ? 'Dando de baja...' : 'Confirmar'}
                    </button>
                </div>
            </dialog>

            <dialog
                ref={commentDialogRef}
                className="accounts-confirm-dialog"
                aria-labelledby="accounts-comment-title"
                onCancel={(event) => {
                    event.preventDefault();
                    cancelComment();
                }}
            >
                <div className="accounts-confirm-icon accounts-comment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M20 3H4a2 2 0 0 0-2 2v16l5-5h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                    </svg>
                </div>
                <h2 id="accounts-comment-title" className="accounts-confirm-title">
                    Comentario para la solicitud de {selectedCommentUser?.usuario}
                </h2>
                <textarea
                    className="accounts-input accounts-comment-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Agrega un comentario sobre la solicitud..."
                    disabled={savingComment}
                    rows="4"
                />
                {commentError && <p className="accounts-error" role="alert">{commentError}</p>}
                <div className="accounts-confirm-actions">
                    <button
                        ref={commentCancelRef}
                        type="button"
                        className="accounts-action accounts-confirm-cancel"
                        disabled={savingComment}
                        onClick={cancelComment}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="accounts-action accounts-action-activate"
                        disabled={savingComment || !canCreate}
                        onClick={confirmComment}
                    >
                        {savingComment ? 'Guardando...' : 'Aceptar'}
                    </button>
                </div>
            </dialog>

            <dialog
                ref={activationDialogRef}
                className="accounts-confirm-dialog accounts-activation-dialog"
                aria-labelledby="accounts-activation-title"
                onCancel={(event) => {
                    event.preventDefault();
                    cancelActivation();
                }}
            >
                <div className="accounts-activation-dialog-wrapper">
                    <div className="accounts-confirm-icon accounts-activation-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                    </div>
                    <h2 id="accounts-activation-title" className="accounts-confirm-title">
                        Activar usuario {activationUser?.usuario}
                    </h2>
                
                <div className="accounts-activation-grid">
                    <div className="accounts-activation-col">
                        <h3>Tipo de Usuario</h3>
                        <div className="accounts-selector-list">
                            {Object.entries(realUserTypes).map(([name, id]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`accounts-selector-btn ${activationType === id.toString() ? 'is-active' : ''}`}
                                    onClick={() => setActivationType(id.toString())}
                                >
                                    {name}
                                    {activationType === id.toString() && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="accounts-activation-col">
                        <h3>Constructor de Permisos</h3>
                        <div className="accounts-pills-row">
                            {Object.entries(catalogs?.areas || {}).map(([name, id]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`accounts-pill ${activationArea === id.toString() ? 'is-active' : ''}`}
                                    onClick={() => handleAreaChange({ target: { value: id.toString() } })}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        {activationArea && (
                            <div className="accounts-pills-row" style={{ marginTop: '8px' }}>
                                {Object.entries(realAllModules).map(([id, name]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`accounts-pill ${activationModule === id.toString() ? 'is-active' : ''}`}
                                        onClick={() => handleModuleChange({ target: { value: id.toString() } })}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activationModule ? (
                            <div className="accounts-permissions-container">
                                <div className="accounts-permissions-grid">
                                    {Object.entries(catalogs?.access || {}).map(([id, name]) => {
                                        const isVer = id === '1';
                                        const isSelected = activationPermissions.includes(id);
                                        return (
                                            <label key={id} className={`accounts-perm-toggle ${isSelected ? 'is-active' : ''} ${isVer ? 'is-disabled' : ''}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => togglePermission(id)}
                                                    disabled={isVer}
                                                />
                                                {name}
                                            </label>
                                        );
                                    })}
                                </div>
                                <button type="button" className="accounts-action accounts-action-activate accounts-add-perm-btn" onClick={addPermissionSet}>
                                    Añadir a la lista
                                </button>
                            </div>
                        ) : (
                            <div className="accounts-permissions-container" style={{ justifyContent: 'center', alignItems: 'center', color: '#999', fontSize: '13px' }}>
                                Seleccione un módulo para asignar permisos
                            </div>
                        )}
                    </div>

                    <div className="accounts-activation-col">
                        <h3>Lista de Asignaciones</h3>
                        {addedPermissions.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#666' }}>No hay permisos añadidos.</p>
                        ) : (
                            <ul className="accounts-added-list">
                                {addedPermissions.map((set, i) => (
                                    <li key={i} className="accounts-added-item">
                                        <div className="accounts-added-info">
                                            <strong>{set.areaName} - {set.moduleName}</strong>
                                            <span>Permisos: {set.permissions.map(p => catalogs.access[p]).join(', ')}</span>
                                        </div>
                                        <button type="button" className="accounts-remove-btn" onClick={() => removePermissionSet(i)} aria-label="Remover">
                                            X
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="accounts-confirm-actions">
                    <button
                        ref={activationCancelRef}
                        type="button"
                        className="accounts-action accounts-confirm-cancel"
                        onClick={cancelActivation}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="accounts-action accounts-action-activate"
                        disabled={!activationType || addedPermissions.length === 0}
                        onClick={confirmActivation}
                    >
                        Aprobar y Guardar
                    </button>
                </div>
                </div>
            </dialog>

            {toastMessage && (
                <div className="accounts-toast-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                        <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default AccountsModule;
