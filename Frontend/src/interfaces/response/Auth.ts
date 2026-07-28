export type Modulo = Record<string, number[]>;
export type Acceso = Record<string, Modulo[]>;
export type AreaCatalog = Record<string, number>;
export type AccessCatalog = Record<number, string>;
export type ModulesCatalog = Record<number, string>;

export interface LoginResponse {
    id: number;
    nombre: string;
    alias: string;
    correo: string;
    accesos: Acceso[];

    message?: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
}

export interface AreaResponse {
    areas: AreaCatalog;
}

export interface AccessResponse {
    access: AccessCatalog;
}

export interface ModulesResponse {
    modules: ModulesCatalog;
}