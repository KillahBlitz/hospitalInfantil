import AccountsModule from '../platform/accounts/accountsModule.jsx';
import PlacesModule from '../humanResources/places/placesModules.jsx';
import PermitsModule from '../platform/permits/permitsModule.jsx';
import EmployeesModule from '../humanResources/employees/employeesModule.jsx';
import PayrollModule from '../humanResources/payroll/payrollModule.jsx';
import FomopeModule from '../humanResources/fomope/fomopeModule.jsx';
import './areaTemplate.css';

// Distribucion de modulos por id del catalogo.
const MODULE_REGISTRY = {
    1: AccountsModule,
    2: PlacesModule,
    3: PermitsModule,
    4: EmployeesModule,
    5: PayrollModule,
    6: FomopeModule,
};

export function GetAreaModules(user, catalogs, areaKey) {
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

function AreaTemplate({ user, catalogs, areaKey, selectedModuleId }) {
    const modules = GetAreaModules(user, catalogs, areaKey);
    const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;
    const ModuleComponent = selectedModule ? MODULE_REGISTRY[selectedModule.id] : null;

    if (!selectedModule) {
        return (
            <div className="area-template">
                <p className="content-placeholder">
                    {modules.length === 0
                        ? 'No tienes modulos asignados en esta area.'
                        : 'Selecciona un modulo en el menu lateral.'}
                </p>
            </div>
        );
    }

    return (
        <div className="area-template">
            {ModuleComponent ? (
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
    );
}

export default AreaTemplate;
