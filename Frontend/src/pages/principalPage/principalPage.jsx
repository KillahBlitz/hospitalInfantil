import { useEffect, useRef, useState } from 'react';
import { GetAreas, GetAccess, GetModulesCatalog } from '../../composable/AuthApi.ts';

function ProcessModules(userData) {
    const modules = [];
    const accesos = userData?.accesos ?? [];
    accesos.forEach((acceso) => {
        Object.keys(acceso).forEach((key) => {
            modules.push(key);
        });
    });
    return modules;
}

const ModulesCatalog = async (areas, areasCatalog) => {
    const areasId = [];
    const catalog = areasCatalog ?? {};
    areas.forEach((area) => {
        if (area in catalog) {
            areasId.push(catalog[area]);
        }
    });
    const response = await GetModulesCatalog({ AreasId: areasId });
    return response;
};

function PrincipalPage() {
    const [modulesCatalog, setModulesCatalog] = useState(null);
    const yaCargado = useRef(false);

    useEffect(() => {
        if (yaCargado.current) return;
        yaCargado.current = true;

        const cargarCatalogos = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            const areasResp = await GetAreas();
            const accessResp = await GetAccess();
            const areasPermissions = ProcessModules(userData);
            const modulos = await ModulesCatalog(areasPermissions, areasResp?.areas);
            setModulesCatalog(modulos);
        };

        cargarCatalogos();
    }, []);

    return (
        <div>
            <h1>Principal Page</h1>
        </div>
    );
}

export default PrincipalPage;
