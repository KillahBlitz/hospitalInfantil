import { useMemo, useState } from 'react';
import AccountsModule from '../platform/accounts/accountsModule.jsx';
import PlacesModule from '../humanResources/places/placesModules.jsx';
import PermitsModule from '../platform/permits/permitsModule.jsx';
import './areaTemplate.css';

// Distribucion de modulos por id del catalogo.
const MODULE_REGISTRY = {
    1: AccountsModule,
    2: PlacesModule,
    3: PermitsModule,
};

function GetAreaModules(user, catalogs, areaKey) {
    const accesos = user?.accesos ?? [];
    const modulesCatalog = catalogs?.modules ?? {};
    const modules = [];

    accesos.forEach((acceso) => {
        const matchKey = Object.keys(acceso).find(
            (key) => key.toLowerCase() === areaKey.toLowerCase()
        );
        if (!matchKey) return;

        const moduleList = acceso[matchKey] ?? [];
        moduleList.forEach((moduloDict) => {
            Object.keys(moduloDict).forEach((moduleId) => {
                const id = Number(moduleId);
                modules.push({
                    id,
                    name: modulesCatalog[id],
                    permisos: moduloDict[moduleId] ?? [],
                });
            });
        });
    });

    return modules;
}

function AreaTemplate({ user, catalogs, areaKey, title }) {
    const modules = useMemo(
        () => GetAreaModules(user, catalogs, areaKey),
        [user, catalogs, areaKey]
    );

    const [selectedId, setSelectedId] = useState(modules[0]?.id ?? null);

    const selectedModule = modules.find((m) => m.id === selectedId) ?? null;
    const ModuleComponent = selectedModule ? MODULE_REGISTRY[selectedModule.id] : null;

    return (
        <div className="area-template">
            <div className="area-tabs" role="tablist">
                {modules.length === 0 ? (
                    <span className="area-tabs-empty">Sin modulos disponibles</span>
                ) : (
                    modules.map((module) => (
                        <button
                            key={module.id}
                            type="button"
                            role="tab"
                            aria-selected={selectedId === module.id}
                            className={`area-tab${selectedId === module.id ? ' is-active' : ''}`}
                            onClick={() => setSelectedId(module.id)}
                        >
                            {module.name}
                        </button>
                    ))
                )}
            </div>

            <div className="area-content">
                {!selectedModule ? (
                    <p className="content-placeholder">
                        No tienes modulos asignados en esta area.
                    </p>
                ) : ModuleComponent ? (
                    <ModuleComponent user={user} catalogs={catalogs} module={selectedModule} />
                ) : (
                    <>
                        <h2 className="area-module-title">{selectedModule.name}</h2>
                        <p className="content-placeholder">
                            Este modulo aun no tiene contenido asignado.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default AreaTemplate;
