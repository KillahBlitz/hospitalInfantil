export interface UsersResponse {
    solicitudes: Users[];
}

export interface RegisteredUsersResponse {
    usuarios: RegisteredUser[];
}

export interface DeactivateUserResponse {
    success: boolean;
    code: string;
    message: string;
}

export interface RegisteredUser {
    id: number;
    tipoId: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string;
    sexo: string;
    fechaIngreso: string;
    alias: string;
    correo: string;
    activo: boolean;
}

export interface Users {
    id: number;
    usuario: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    fechaIngreso: string;
    aprobado: boolean;
    comentario?: string;
}
