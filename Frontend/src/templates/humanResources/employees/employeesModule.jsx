import '../humanResources.css';

function EmployeesModule({ module }) {
    return (
        <div className="hr-module">
            <div className="hr-module-panel">
                <h2 className="hr-module-title">{module?.name ?? 'Administrar Empleados'}</h2>
                <p className="hr-module-summary">
                    Registro de empleados, consulta de expediente y asignacion a una plaza.
                </p>
            </div>
        </div>
    );
}

export default EmployeesModule;
