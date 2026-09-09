import type { UsersResponse, RegisteredUsersResponse, DeactivateUserResponse } from "../interfaces/response/Platform";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/Platform`;

export async function getUsers(signal?: AbortSignal): Promise<UsersResponse> {
    const response = await fetch(`${API_BASE_URL}/UserRequest`, { signal });
    if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
    }
    return response.json();
}

export async function getRegisteredUsers(signal?: AbortSignal): Promise<RegisteredUsersResponse> {
    const response = await fetch(`${API_BASE_URL}/Users`, { signal });
    if (!response.ok) {
        throw new Error(`Error fetching registered users: ${response.statusText}`);
    }
    return response.json();
}

export async function deactivateUser(userId: number, accessToken?: string): Promise<DeactivateUserResponse> {
    if (!accessToken) {
        throw new Error('Inicia sesión nuevamente para habilitar la baja de usuarios.');
    }

    const response = await fetch(`${API_BASE_URL}/Users/${userId}/deactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401) {
        throw new Error('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo completar la baja. Consulta la lista antes de reintentar.');
    }
    return result;
}

export async function updateUserRequestComment(userId: number, comment: string | undefined, accessToken?: string): Promise<{ success: boolean; message: string }> {
    if (!accessToken) {
        throw new Error('Inicia sesión nuevamente para habilitar la actualización de comentarios.');
    }

    const response = await fetch(`${API_BASE_URL}/UserRequest/${userId}/comment`, {
        method: 'PUT',
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comentario: comment })
    });
    if (response.status === 401) {
        throw new Error('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo actualizar el comentario. Consulta la lista antes de reintentar.');
    }
    return result;
}

export async function approveUser(
    solicitudId: number, 
    tipoId: number, 
    permisos: { moduloId: number, permisosIds: number[] }[], 
    accessToken?: string
): Promise<{ success: boolean; message: string }> {
    if (!accessToken) {
        throw new Error('Inicia sesión nuevamente para aprobar usuarios.');
    }

    const response = await fetch(`${API_BASE_URL}/Users/Approve`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solicitudId, tipoId, permisos })
    });

    if (response.status === 401) {
        throw new Error('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    }
    
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo completar la aprobación del usuario.');
    }
    return result;
}

export async function getUserPermissions(
    userId: number,
    accessToken?: string
): Promise<any> {
    if (!accessToken) {
        throw new Error('Inicia sesión nuevamente.');
    }

    const response = await fetch(`${API_BASE_URL}/Users/${userId}/Permissions`, {
        method: 'GET',
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401) {
        throw new Error('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    }
    
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo obtener los permisos del usuario.');
    }
    return result;
}

export async function updateUserPermissions(
    userId: number, 
    tipoId: number, 
    permisos: { moduloId: number, permisosIds: number[] }[], 
    accessToken?: string
): Promise<{ success: boolean; message: string }> {
    if (!accessToken) {
        throw new Error('Inicia sesión nuevamente.');
    }

    const response = await fetch(`${API_BASE_URL}/Users/Permissions`, {
        method: 'PUT',
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, tipoId, permisos })
    });

    if (response.status === 401) {
        throw new Error('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    }
    
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo actualizar los permisos.');
    }
    return result;
}
