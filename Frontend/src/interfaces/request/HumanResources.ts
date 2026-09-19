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
