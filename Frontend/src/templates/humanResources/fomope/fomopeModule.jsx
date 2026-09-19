import '../humanResources.css';

function FomopeModule({ module }) {
    return (
        <div className="hr-module">
            <div className="hr-module-panel">
                <h2 className="hr-module-title">{module?.name ?? 'Generar FOMOPE'}</h2>
                <p className="hr-module-summary">
                    Generacion del reporte FOMOPE a partir de las nominas registradas.
                </p>
            </div>
        </div>
    );
}

export default FomopeModule;
