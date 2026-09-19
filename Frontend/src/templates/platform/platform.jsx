import AreaTemplate from '../shared/areaTemplate.jsx';

function Platform({ user, catalogs, selectedModuleId }) {
    return (
        <AreaTemplate
            user={user}
            catalogs={catalogs}
            areaKey="plataforma"
            selectedModuleId={selectedModuleId}
        />
    );
}

export default Platform;
