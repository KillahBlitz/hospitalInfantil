import type { AreaRequest, PuestoRequest } from "../interfaces/request/HumanResources";
import type {
    AreasResponse,
    PuestosResponse,
    CatalogUploadResponse,
    CatalogOperationResponse,
} from "../interfaces/response/HumanResources";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/HumanResources`;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function MensajeDeFallo(result: any, respaldo: string): string {
    const motivo = result?.detalle?.[0]?.motivo;
    if (motivo) return motivo;
    if (result?.omitidas > 0) return 'Ya existe un registro con esos datos.';
    return result?.message ?? respaldo;
}

export async function getAreas(signal?: AbortSignal): Promise<AreasResponse> {
    const response = await fetch(`${API_BASE_URL}/Areas`, { signal });
    if (!response.ok) {
        throw new Error(`Error fetching areas: ${response.statusText}`);
    }
    return response.json();
}

export async function getPuestos(signal?: AbortSignal): Promise<PuestosResponse> {
    const response = await fetch(`${API_BASE_URL}/Puestos`, { signal });
    if (!response.ok) {
        throw new Error(`Error fetching puestos: ${response.statusText}`);
    }
    return response.json();
}

export async function createArea(area: AreaRequest): Promise<CatalogUploadResponse> {
    const response = await fetch(`${API_BASE_URL}/Areas`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(area),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(MensajeDeFallo(result, 'No se pudo dar de alta el area.'));
    }
    return result;
}

export async function updateArea(id: number, area: AreaRequest): Promise<CatalogOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/Areas/${id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(area),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo actualizar el area.');
    }
    return result;
}

export async function deleteArea(id: number): Promise<CatalogOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/Areas/${id}`, { method: 'DELETE' });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo eliminar el area.');
    }
    return result;
}

export async function createPuesto(puesto: PuestoRequest): Promise<CatalogUploadResponse> {
    const response = await fetch(`${API_BASE_URL}/Puestos`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(puesto),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(MensajeDeFallo(result, 'No se pudo dar de alta el puesto.'));
    }
    return result;
}

export async function updatePuesto(id: number, puesto: PuestoRequest): Promise<CatalogOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/Puestos/${id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(puesto),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo actualizar el puesto.');
    }
    return result;
}

export async function deletePuesto(id: number): Promise<CatalogOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/Puestos/${id}`, { method: 'DELETE' });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'No se pudo eliminar el puesto.');
    }
    return result;
}
