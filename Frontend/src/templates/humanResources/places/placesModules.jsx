function PlacesModule({ user, catalogs, module }) {
    return (
        <div className="places-module">
            <h2 className="area-module-title">{module?.name ?? 'Administrar Plazas'}</h2>
            <p className="content-placeholder">Modulo de administracion de plazas.</p>
        </div>
    );
}

export default PlacesModule;
