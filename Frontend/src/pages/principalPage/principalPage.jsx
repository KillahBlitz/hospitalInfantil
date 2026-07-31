import { useEffect, useRef, useState } from 'react';
import { GetAreas, GetAccess, GetModulesCatalog } from '../../composable/AuthApi.ts';
import Start from '../../templates/start/start.jsx';
import Platform from '../../templates/platform/platform.jsx';
import HumanResources from '../../templates/humanResources/humanResources.jsx';
import Contability from '../../templates/contability/contability.jsx';
import './principalPage.css';

const HOME_KEY = 'inicio';
const TEMPLATE_REGISTRY = {
    inicio: { label: 'Inicio', component: Start },
    plataforma: { label: 'Plataforma', component: Platform },
    'recursos humanos': { label: 'Recursos Humanos', component: HumanResources },
    contabilidad: { label: 'Contabilidad', component: Contability },
};

function Capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function ResolveModule(key) {
    const entry = TEMPLATE_REGISTRY[key.toLowerCase()];
    return {
        key,
        label: entry?.label ?? Capitalize(key),
        component: entry?.component ?? null,
    };
}

function BuildNavModules(userData) {
    const modules = [ResolveModule(HOME_KEY)];
    const accesos = userData?.accesos ?? [];
    accesos.forEach((acceso) => {
        Object.keys(acceso).forEach((key) => {
            modules.push(ResolveModule(key));
        });
    });
    return modules;
}

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
    const catalogByLower = {};
    Object.keys(catalog).forEach((name) => {
        catalogByLower[name.toLowerCase()] = catalog[name];
    });
    areas.forEach((area) => {
        const id = catalogByLower[area.toLowerCase()];
        if (id !== undefined) {
            areasId.push(id);
        }
    });
    const response = await GetModulesCatalog({ AreasId: areasId });
    return response;
};

function GetInitials(nombre) {
    if (!nombre) return '';
    return nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
}

function PrincipalPage() {
    const [user, setUser] = useState(null);
    const [navModules, setNavModules] = useState([ResolveModule(HOME_KEY)]);
    const [activeModule, setActiveModule] = useState(HOME_KEY);
    const [catalogs, setCatalogs] = useState({ areas: null, access: null, modules: null });
    const [loading, setLoading] = useState(true);
    const yaCargado = useRef(false);

    useEffect(() => {
        if (yaCargado.current) return;
        yaCargado.current = true;

        const cargarCatalogos = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            setUser(userData);
            setNavModules(BuildNavModules(userData));

            const areasResp = await GetAreas();
            const accessResp = await GetAccess();
            const areasPermissions = ProcessModules(userData);
            const modulos = await ModulesCatalog(areasPermissions, areasResp?.areas);

            setCatalogs({
                areas: areasResp?.areas ?? null,
                access: accessResp?.permisos ?? null,
                modules: modulos?.modulos ?? null,
            });
            setLoading(false);
        };

        cargarCatalogos();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const active = navModules.find((m) => m.key === activeModule);
    const ActiveTemplate = active?.component ?? null;

    return (
        <div className="principal-layout">
            <aside className="principal-sidebar">
                <div className="sidebar-profile">
                    <div className="profile-avatar">{GetInitials(user?.nombre)}</div>
                    <div className="profile-info">
                        <span className="profile-name">{user?.nombre}</span>
                        <span className="profile-email">{user?.correo}</span>
                    </div>
                </div>

                <p className="sidebar-section-label">NAVEGADOR</p>

                <nav className="sidebar-nav">
                    {navModules.map((module) => (
                        <button
                            key={module.key}
                            type="button"
                            className={`sidebar-item${activeModule === module.key ? ' is-active' : ''}`}
                            onClick={() => setActiveModule(module.key)}
                        >
                            {module.label}
                        </button>
                    ))}
                </nav>

                <button type="button" className="sidebar-logout" onClick={handleLogout}>
                    Cerrar sesion
                </button>
            </aside>

            <main className="principal-content">
                {loading ? (
                    <p className="content-placeholder">Cargando...</p>
                ) : ActiveTemplate ? (
                    <ActiveTemplate user={user} catalogs={catalogs} />
                ) : (
                    <>
                        <h1 className="content-title">{active?.label}</h1>
                        <p className="content-placeholder">
                            Error al cargar el módulo. Por favor, contacte al administrador del sistema.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}

export default PrincipalPage;
