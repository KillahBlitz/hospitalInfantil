import { useMemo, useState } from 'react';
import './areaTemplate.css';

// Recorre los accesos del user, encuentra el area indicada, y por cada
// modulo (la key dentro de la lista de diccionarios) obtiene su nombre
// desde el catalogo de modulos.
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

    return (
        <div className="area-template">
            {/* Menu de pestañas de modulos */}
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

            {/* Contenido del modulo seleccionado */}
            <div className="area-content">
                {selectedModule ? (
                    <>
                        <h2 className="area-module-title">{selectedModule.name}</h2>
                        <p className="content-placeholder">
                            Modulo seleccionado: {selectedModule.name} (id {selectedModule.id}).
                        </p>
                    </>
                ) : (
                    <p className="content-placeholder">
                        No tienes modulos asignados en esta area.
                    </p>
                )}
            </div>
        </div>
    );
}

export default AreaTemplate;
