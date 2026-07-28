import { RegisterRequest, LoginRequest, ModulesRequest } from '../interfaces/request/Auth';
import { RegisterResponse, LoginResponse, AccessResponse, AreaResponse, ModulesResponse } from "../interfaces/response/Auth";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/Auth`;

export async function registerUser(credentials: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const result: RegisterResponse = await response.json();
    return result;
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const result = await response.json();
    return result;
}

export async function GetModulesCatalog(params: ModulesRequest): Promise<ModulesResponse> {
    const response = await fetch(`${API_BASE_URL}/modules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });
    const result = await response.json();
    return result;
}

export async function GetAccessCatalog(): Promise<AccessResponse> {
    const response = await fetch(`${API_BASE_URL}/GetAccessCatalog`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json();
    return result;
}

export async function GetAccess(): Promise<AccessResponse> {
    const response = await fetch(`${API_BASE_URL}/access`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json();
    return result;
}

export async function GetAreas(): Promise<AreaResponse> {
        const response = await fetch(`${API_BASE_URL}/areas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json();
    return result;
}