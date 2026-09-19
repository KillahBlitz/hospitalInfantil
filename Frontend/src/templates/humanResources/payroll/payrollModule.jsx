import '../humanResources.css';

function PayrollModule({ module }) {
    return (
        <div className="hr-module">
            <div className="hr-module-panel">
                <h2 className="hr-module-title">{module?.name ?? 'Registrar Nominas'}</h2>
                <p className="hr-module-summary">
                    Captura de nominas quincenales por empleado con percepciones, deducciones y neto.
                </p>
            </div>
        </div>
    );
}

export default PayrollModule;
