export type Modulo = Record<string, number[]>;
export type Acceso = Record<string, Modulo[]>;
export type ModuleCatalog = Record<number, string>;
export type AccessCatalog = Record<number, string>;
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

export interface ModulesResponse {
    modules: ModuleCatalog;
}

export interface AccessResponse {
    access: AccessCatalog;
}