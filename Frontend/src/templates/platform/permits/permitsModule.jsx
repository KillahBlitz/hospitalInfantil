function PermitsModule({ user, catalogs, module }) {
    return (
        <div className="permits-module">
            <h2 className="area-module-title">{module?.name ?? 'Administrar Permisos'}</h2>
            <p className="content-placeholder">Modulo de administracion de permisos.</p>
        </div>
    );
}

export default PermitsModule;
