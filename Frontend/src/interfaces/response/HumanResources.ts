export interface Area {
    id: number;
    claveArea: string | null;
    descripcion: string;
}

export interface Puesto {
    id: number;
    codigoPuesto: string;
    descripcion: string;
    gradoSalarial: string | null;
    rangoSalarial: number | null;
}

export interface AreasResponse {
    areas: Area[];
}

export interface PuestosResponse {
    puestos: Puesto[];
}

export interface CatalogUploadRejection {
    indice: number;
    clave: string;
    motivo: string;
}

export interface CatalogUploadResponse {
    code: string;
    message: string;
    recibidas: number;
    insertadas: number;
    omitidas: number;
    rechazadas: number;
    detalle: CatalogUploadRejection[];
}

export interface CatalogOperationResponse {
    success: boolean;
    code: string;
    message: string;
}

export interface Plaza {
    id: number;
    clavePlaza: string;
    codigoPuesto: string;
    descripcionPuesto: string;
    gradoSalarial: string | null;
    denominacionPuesto: string | null;
    puestoId: number;
    tipoContratacionId: number;
    tipoPlazaId: number | null;
    unidadId: number;
    areaId: number | null;
    claveArea: string | null;
    area: string | null;
    tipoContratacion: string;
    tipoPlaza: string | null;
    unidad: string;
    ocupabilidad: boolean;
    fechaVacancia: string | null;
    cantidadPlazaHora: number | null;
    codigoSHCP: string | null;
    codigoFederalPuesto: string | null;
    clavePresupuestalActual: string | null;
}

export interface PlazasResponse {
    pagina: number;
    tamano: number;
    total: number;
    totalPaginas: number;
    plazas: Plaza[];
}

export interface TipoContratacion {
    id: number;
    descripcion: string;
}

export interface TiposContratacionResponse {
    tiposContratacion: TipoContratacion[];
}

export interface Unidad {
    id: number;
    unidad: string;
    ramo: string | null;
    ze: string | null;
}

export interface UnidadesResponse {
    unidades: Unidad[];
}
