import AreaTemplate from '../shared/areaTemplate.jsx';

function HumanResources({ user, catalogs, selectedModuleId }) {
    return (
        <AreaTemplate
            user={user}
            catalogs={catalogs}
            areaKey="recursos humanos"
            selectedModuleId={selectedModuleId}
        />
    );
}

export default HumanResources;
