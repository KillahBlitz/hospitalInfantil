import './start.css';

const PURPOSE_CARDS = [
    {
        title: 'Centraliza la informacion',
        description:
            'Reune en un solo lugar los portales, documentos y areas del Hospital Infantil de Mexico Federico Gomez para consultarlos con rapidez.',
    },
    {
        title: 'Mejora la gestion',
        description:
            'Digitaliza y ordena los procesos de plataforma, recursos humanos y contabilidad para reducir tiempos y errores.',
    },
    {
        title: 'Facilita el acceso',
        description:
            'Cada usuario ve unicamente los modulos que le corresponden segun sus permisos, con una navegacion clara y directa.',
    },
];

const INSTITUTIONAL_PAGES = [
    {
        title: 'Portal principal del HIMFG',
        summary:
            'Es el punto central. Presenta mision, vision, autoridades, datos de contacto y accesos hacia atencion medica, especialidades, ensenanza, investigacion, normatividad, voluntariado y patronato.',
    },
    {
        title: 'Atencion de primera vez',
        summary:
            'Explica quien puede recibir atencion: pacientes desde recien nacidos hasta 17 anos y 11 meses, sin seguridad social y con referencia de una institucion publica. Incluye documentos, horario, ubicacion y proceso de valoracion y admision.',
    },
    {
        title: 'Especialidades y estructura medica',
        summary:
            'Funciona como directorio de areas medicas y administrativas. Incluye pediatria ambulatoria, asistencia medica y quirurgica, diagnostico, investigacion, ensenanza, administracion y planeacion, ademas de multiples departamentos y especialidades pediatricas.',
    },
    {
        title: 'Convocatoria academica 2027',
        summary:
            'Documento para aspirantes a residencias, especialidades y posgrados. Contiene requisitos, calendarios, procesos de seleccion y oferta academica para medicos mexicanos y extranjeros.',
    },
    {
        title: 'Educacion Medica Continua',
        summary:
            'Describe los programas de actualizacion para personal medico y paramedico, asi como la coordinacion de sesiones clinico-patologicas y actividades academicas.',
    },
    {
        title: 'Direccion de Investigacion',
        summary:
            'Presenta la investigacion basica, clinica, biomedica y traslacional del hospital. Tambien enlaza con convocatorias, laboratorios, unidades de investigacion y gestion de protocolos.',
    },
    {
        title: 'Boletin Medico del HIMFG',
        summary:
            'Revista cientifica pediatrica asociada con el hospital. Publica investigaciones, articulos clinicos y produccion academica especializada.',
    },
    {
        title: 'Historia del hospital',
        summary:
            'Resume su creacion e inauguracion en 1943, la evolucion de sus instalaciones y aportaciones historicas en pediatria, investigacion, trasplantes, cirugia y formacion medica.',
    },
    {
        title: 'Programa Institucional 2025-2030',
        summary:
            'Documento estrategico oficial. Incluye diagnostico institucional, objetivos, estrategias, lineas de accion, indicadores y metas para atencion medica, investigacion, ensenanza, infraestructura y administracion.',
    },
    {
        title: 'Voluntariado',
        summary:
            'Explica la historia y actividades del cuerpo de voluntarios "Ana Munguia de Gomez", que apoya a pacientes y familiares mediante proyectos y actividades asistenciales.',
    },
    {
        title: 'Patronato',
        summary:
            'Describe a la Fundacion Amigos Historicos del Hospital, que obtiene recursos para equipamiento, becas, investigacion, ensenanza y asistencia medica.',
    },
    {
        title: 'Perfil institucional en gob.mx',
        summary:
            'Pagina gubernamental complementaria del hospital, integrada al portal de la Secretaria de Salud.',
    },
];

function Start({ user }) {
    return (
        <div className="template-start">
            <section className="start-hero">
                <p className="start-eyebrow">Plataforma HIMFG</p>
                <h1 className="start-title">
                    Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}
                </h1>
                <p className="start-lead">
                    Esta plataforma busca mejorar y modernizar la gestion del Hospital Infantil
                    de Mexico Federico Gomez, centralizando la informacion institucional y
                    ofreciendo herramientas digitales para cada area. Su objetivo es facilitar
                    el trabajo diario y el acceso a los recursos del hospital.
                </p>
            </section>

            <section className="start-section">
                <div className="start-cards">
                    {PURPOSE_CARDS.map((card) => (
                        <article key={card.title} className="start-card start-card--purpose">
                            <h3 className="start-card-title">{card.title}</h3>
                            <p className="start-card-text">{card.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="start-section">
                <h2 className="start-section-title">Recursos institucionales</h2>
                <p className="start-section-subtitle">
                    Un vistazo a las principales paginas y documentos del hospital.
                </p>
                <div className="start-cards">
                    {INSTITUTIONAL_PAGES.map((page) => (
                        <article key={page.title} className="start-card">
                            <h3 className="start-card-title">{page.title}</h3>
                            <p className="start-card-text">{page.summary}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Start;
