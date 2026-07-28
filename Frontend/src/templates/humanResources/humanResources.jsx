import AreaTemplate from '../shared/areaTemplate.jsx';

function HumanResources({ user, catalogs }) {
    return (
        <AreaTemplate
            user={user}
            catalogs={catalogs}
            areaKey="recursos humanos"
            title="Recursos Humanos"
        />
    );
}

export default HumanResources;
