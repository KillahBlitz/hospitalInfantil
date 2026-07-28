import AreaTemplate from '../shared/areaTemplate.jsx';

function Platform({ user, catalogs }) {
    return (
        <AreaTemplate
            user={user}
            catalogs={catalogs}
            areaKey="plataforma"
            title="Plataforma"
        />
    );
}

export default Platform;
