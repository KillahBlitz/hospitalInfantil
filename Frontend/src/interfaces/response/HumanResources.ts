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
