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
    unidadId: number | null;
    denominacionPuesto?: string | null;
    cantidadPlazaHora?: number | null;
    ocupabilidad: boolean;
    fechaVacancia?: string | null;
    codigoSHCP?: string | null;
    codigoFederalPuesto?: string | null;
    clavePresupuestalActual?: string | null;
}
