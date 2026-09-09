import { useEffect, useRef, useState, useMemo } from 'react';
import { getRegisteredUsers, getUserPermissions, updateUserPermissions } from '../../../composable/PlatformApi';
import { GetUserTypesCatalog, GetModulesCatalog } from '../../../composable/AuthApi';
import '../accounts/accountsModule.css';

function PermitsModule({ user, catalogs, module }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    
    const [editingUser, setEditingUser] = useState(null);
    const [activationType, setActivationType] = useState('');
    const [activationArea, setActivationArea] = useState('');
    const [activationModule, setActivationModule] = useState('');
    const [activationPermissions, setActivationPermissions] = useState(['1']);
    const [addedPermissions, setAddedPermissions] = useState([]);
    
    const [realUserTypes, setRealUserTypes] = useState({});
    const [realAllModules, setRealAllModules] = useState({});
    
    const [toastMessage, setToastMessage] = useState('');
    const submittingRef = useRef(false);
    
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    const permissions = new Set(
        (module?.permisos ?? []).map((id) => catalogs?.access?.[id]?.trim().toLowerCase())
    );
    const canEdit = permissions.has('editar');

    useEffect(() => {
        let mounted = true;
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const resp = await getRegisteredUsers();
                if (mounted) {
                    setUsers(resp?.usuarios || []);
                }
            } catch (err) {
                if (mounted) setError('No se pudieron cargar los usuarios. Intente nuevamente.');
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchUsers();
        return () => { mounted = false; };
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            if (u.id === user?.id) return false;
            const matchesName = nameFilter === '' || 
                `${u.nombre} ${u.apellidoPaterno} ${u.apellidoMaterno}`.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesEmail = emailFilter === '' || 
                u.correo.toLowerCase().includes(emailFilter.toLowerCase());
            return matchesName && matchesEmail;
        });
    }, [users, nameFilter, emailFilter, user?.id]);

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
        
        setActivationModule('');
        setActivationPermissions(['1']);
    };

    const removePermissionSet = (index) => {
        setAddedPermissions(prev => prev.filter((_, i) => i !== index));
    };

    const openEdit = async (account) => {
        if (submittingRef.current) return;
        setEditingUser(account);
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

            const currentPerms = await getUserPermissions(account.id, user?.accessToken);
            if (currentPerms.success) {
                setActivationType(currentPerms.tipoId.toString());
                const mappedPerms = currentPerms.permisos.map(p => ({
                    areaId: p.areaId.toString(),
                    areaName: p.areaName,
                    moduleId: p.moduloId.toString(),
                    moduleName: p.moduloName,
                    permissions: p.permisosIds.map(id => id.toString())
                }));
                setAddedPermissions(mappedPerms);
            }

            if (dialogRef.current && !dialogRef.current.open) {
                dialogRef.current.showModal();
            }
        } catch (e) {
            console.error("Error fetching user permissions", e);
            alert("No se pudieron cargar los permisos del usuario.");
        }
    };

    const cancelEdit = () => {
        if (submittingRef.current) return;
        setEditingUser(null);
        if (dialogRef.current) dialogRef.current.close();
    };

    const confirmEdit = async () => {
        if (!editingUser || submittingRef.current || !activationType || addedPermissions.length === 0) return;
        submittingRef.current = true;
        
        try {
            const parsedType = parseInt(activationType, 10);
            const permisosPayload = addedPermissions.map(p => ({
                moduloId: parseInt(p.moduleId, 10),
                permisosIds: p.permissions.map(perm => parseInt(perm, 10))
            }));
            
            await updateUserPermissions(
                editingUser.id,
                parsedType,
                permisosPayload,
                user?.accessToken
            );
            
            submittingRef.current = false;
            cancelEdit();
            setToastMessage('Permisos actualizados correctamente');
            
            setTimeout(() => {
                setToastMessage('');
            }, 3000);
            
        } catch (err) {
            console.error("Error updating permissions", err);
            alert("No se pudieron actualizar los permisos: " + err.message);
        } finally {
            submittingRef.current = false;
        }
    };

    return (
        <div className="accounts-module">
            <h2 className="area-module-title">{module?.name ?? 'Administrar Permisos'}</h2>
            
            <div className="accounts-filters">
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre" 
                    className="accounts-input"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Filtrar por correo" 
                    className="accounts-input"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="content-placeholder" role="status">
                    Cargando usuarios...
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
                                    {u.correo} - {u.alias}
                                </span>
                            </div>
                            {canEdit && (
                                <div className="accounts-item-actions">
                                    <button
                                        type="button"
                                        className="accounts-action"
                                        aria-label={`Administrar cuenta de ${u.alias}`}
                                        title={`Administrar permisos de ${u.alias}`}
                                        style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
                                        onClick={() => openEdit(u)}
                                    >
                                        Administrar
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <dialog
                ref={dialogRef}
                className="accounts-confirm-dialog accounts-activation-dialog"
                aria-labelledby="accounts-activation-title"
                onCancel={(event) => {
                    event.preventDefault();
                    cancelEdit();
                }}
            >
                <div className="accounts-activation-dialog-wrapper">
                    <div className="accounts-confirm-icon accounts-activation-icon" aria-hidden="true" style={{color: 'var(--color-primary-light)', backgroundColor: 'var(--color-background-elevated)', borderColor: 'var(--color-primary-light)'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                    </div>
                    <h2 id="accounts-activation-title" className="accounts-confirm-title">
                        Administrar permisos de {editingUser?.alias}
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
                        ref={cancelRef}
                        type="button"
                        className="accounts-action accounts-confirm-cancel"
                        onClick={cancelEdit}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="accounts-action accounts-action-activate"
                        disabled={!activationType || addedPermissions.length === 0}
                        onClick={confirmEdit}
                    >
                        Guardar Permisos
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

export default PermitsModule;
