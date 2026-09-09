const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'accountsModule.jsx');
let content = fs.readFileSync(file, 'utf8');

const functionsToAdd = `
    const cancelActivation = () => {
        if (activationDialogRef.current) {
            activationDialogRef.current.close();
        }
        setActivationUser(null);
    };

    const confirmActivation = () => {
        const payload = {
            userId: activationUser?.id,
            userType: activationType,
            assignments: addedPermissions
        };
        console.log("Activación Mock:", payload);
        cancelActivation();
    };

    const removePermissionSet = (index) => {
        setAddedPermissions(prev => prev.filter((_, i) => i !== index));
    };
`;

const jsxToAdd = `
            <dialog
                ref={activationDialogRef}
                className="accounts-confirm-dialog accounts-activation-dialog"
                aria-labelledby="accounts-activation-title"
                onCancel={(event) => {
                    event.preventDefault();
                    cancelActivation();
                }}
            >
                <div className="accounts-confirm-icon accounts-activation-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                </div>
                <h2 id="accounts-activation-title" className="accounts-confirm-title">
                    Activar usuario {activationUser?.usuario}
                </h2>
                
                <div className="accounts-activation-form">
                    <div className="accounts-filter">
                        <label className="accounts-filter-label">Tipo de Usuario</label>
                        <select className="accounts-input" value={activationType} onChange={(e) => setActivationType(e.target.value)}>
                            <option value="">Seleccione un tipo</option>
                            {Object.entries(realUserTypes).map(([name, id]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="accounts-permissions-builder">
                        <h3 className="accounts-permissions-subtitle">Asignar Permisos</h3>
                        <div className="accounts-permissions-selectors">
                            <div className="accounts-filter">
                                <label className="accounts-filter-label">Área</label>
                                <select className="accounts-input" value={activationArea} onChange={handleAreaChange}>
                                    <option value="">Seleccione un área</option>
                                    {Object.entries(catalogs?.areas || {}).map(([name, id]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="accounts-filter">
                                <label className="accounts-filter-label">Módulo</label>
                                <select className="accounts-input" value={activationModule} onChange={handleModuleChange} disabled={!activationArea}>
                                    <option value="">Seleccione un módulo</option>
                                    {Object.entries(realAllModules).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {activationModule && (
                            <div className="accounts-permissions-checkboxes">
                                <label className="accounts-filter-label">Permisos del módulo</label>
                                <div className="accounts-checkboxes-grid">
                                    {Object.entries(catalogs?.access || {}).map(([id, name]) => {
                                        const isVer = id === '1';
                                        return (
                                            <label key={id} className={\`accounts-checkbox-label \${isVer ? 'is-disabled' : ''}\`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={activationPermissions.includes(id)}
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
                        )}
                    </div>

                    {addedPermissions.length > 0 && (
                        <div className="accounts-added-permissions">
                            <label className="accounts-filter-label">Lista de Asignaciones</label>
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
                        </div>
                    )}
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
            </dialog>
`;

content = content.replace('    useEffect(() => {', functionsToAdd + '\n    useEffect(() => {');

content = content.replace('        </div>\n    );\n}', jsxToAdd + '\n        </div>\n    );\n}');

fs.writeFileSync(file, content);
console.log("Injected modal correctly.");
