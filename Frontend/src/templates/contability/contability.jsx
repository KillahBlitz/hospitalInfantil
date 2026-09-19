import AreaTemplate from '../shared/areaTemplate.jsx';

function Contability({ user, catalogs, selectedModuleId }) {
    return (
        <AreaTemplate
            user={user}
            catalogs={catalogs}
            areaKey="contabilidad"
            selectedModuleId={selectedModuleId}
        />
    );
}

export default Contability;
