export type UsersResponse = Record<string, Users[]>;

export interface Users {
    id: number;
    usuario: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    fechaIngreso: string;
    aprobado: boolean;
}
