import { useEffect, useMemo, useRef, useState } from 'react';
import { GetAreas, GetAccess, GetModulesCatalog } from '../../composable/AuthApi.ts';
import { GetAreaModules } from '../../templates/shared/areaTemplate.jsx';
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

function BuildNavAreas(userData, catalogs) {
    return ProcessModules(userData).map((key) => ({
        ...ResolveModule(key),
        modules: GetAreaModules(userData, catalogs, key),
    }));
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
    const [activeAreaKey, setActiveAreaKey] = useState(HOME_KEY);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [expandedAreas, setExpandedAreas] = useState([]);
    const [catalogs, setCatalogs] = useState({ areas: null, access: null, modules: null });
    const [loading, setLoading] = useState(true);
    const yaCargado = useRef(false);

    useEffect(() => {
        if (yaCargado.current) return;
        yaCargado.current = true;

        const cargarCatalogos = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            setUser(userData);

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

    const navAreas = useMemo(() => BuildNavAreas(user, catalogs), [user, catalogs]);

    const home = ResolveModule(HOME_KEY);
    const activeArea = activeAreaKey === HOME_KEY
        ? home
        : navAreas.find((area) => area.key === activeAreaKey);
    const ActiveTemplate = activeArea?.component ?? null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const toggleArea = (key) => {
        setExpandedAreas((previo) =>
            previo.includes(key) ? previo.filter((k) => k !== key) : [...previo, key]
        );
    };

    const selectModule = (areaKey, moduleId) => {
        setActiveAreaKey(areaKey);
        setActiveModuleId(moduleId);
    };

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
                    <button
                        type="button"
                        className={`sidebar-item${activeAreaKey === HOME_KEY ? ' is-active' : ''}`}
                        onClick={() => selectModule(HOME_KEY, null)}
                    >
                        {home.label}
                    </button>

                    {navAreas.map((area) => {
                        const abierta = expandedAreas.includes(area.key);
                        return (
                            <div key={area.key} className="sidebar-group">
                                <button
                                    type="button"
                                    className="sidebar-group-toggle"
                                    aria-expanded={abierta}
                                    onClick={() => toggleArea(area.key)}
                                >
                                    <span className="sidebar-group-label">{area.label}</span>
                                    <span className={`sidebar-chevron${abierta ? ' is-open' : ''}`} aria-hidden="true">
                                        ⌄
                                    </span>
                                </button>

                                {abierta && (
                                    <div className="sidebar-sublist">
                                        {area.modules.length === 0 ? (
                                            <span className="sidebar-subempty">Sin modulos disponibles</span>
                                        ) : (
                                            area.modules.map((module) => (
                                                <button
                                                    key={module.id}
                                                    type="button"
                                                    className={`sidebar-subitem${
                                                        activeAreaKey === area.key && activeModuleId === module.id
                                                            ? ' is-active'
                                                            : ''
                                                    }`}
                                                    onClick={() => selectModule(area.key, module.id)}
                                                >
                                                    {module.name ?? `Modulo ${module.id}`}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <button type="button" className="sidebar-logout" onClick={handleLogout}>
                    Cerrar sesion
                </button>
            </aside>

            <main className="principal-content">
                {loading ? (
                    <p className="content-placeholder">Cargando...</p>
                ) : ActiveTemplate ? (
                    <ActiveTemplate
                        user={user}
                        catalogs={catalogs}
                        selectedModuleId={activeModuleId}
                    />
                ) : (
                    <>
                        <h1 className="content-title">{activeArea?.label}</h1>
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
