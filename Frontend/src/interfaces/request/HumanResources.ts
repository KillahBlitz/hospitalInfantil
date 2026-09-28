export interface AreaRequest {
    claveArea?: string | null;
    descripcion: string;
}

export interface PuestoRequest {
    codigoPuesto: string;
    descripcion: string;
    gradoSalarial?: string | null;
    rangoSalarial?: number | null;
}

export interface PlazaQuery {
    pagina?: number;
    tamano?: number;
    texto?: string;
    areaId?: number | null;
    puestoId?: number | null;
    tipoContratacionId?: number | null;
    ocupabilidad?: boolean | null;
}

export interface PlazaRequest {
    clavePlaza: string;
    puestoId: number | null;
    areaId?: number | null;
    tipoContratacionId: number | null;
    tipoPlazaId?: number | null;
    limpiarTipoPlaza?: boolean;
    unidadId: number | null;
    denominacionPuesto?: string | null;
    cantidadPlazaHora?: number | null;
    ocupabilidad: boolean;
    fechaVacancia?: string | null;
    codigoSHCP?: string | null;
    codigoFederalPuesto?: string | null;
    clavePresupuestalActual?: string | null;
}

export interface EmpleadoQuery {
    pagina?: number;
    tamano?: number;
    texto?: string;
    sexo?: string | null;
    activo?: boolean | null;
}

export interface EmpleadoRequest {
    plazaId: number | null;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    fechaNacimiento: string;
    sexo: string;
    curp: string;
    rfc: string;
    nss?: string | null;
    fechaIngreso: string;
    activo: boolean;
}
