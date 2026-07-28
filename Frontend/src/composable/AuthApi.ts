import { RegisterRequest, LoginRequest } from '../interfaces/request/Auth';
import { RegisterResponse, LoginResponse, ModulesResponse, AccessResponse } from "../interfaces/response/Auth";

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

export async function GetModulesCatalog(): Promise<ModulesResponse> {
    const response = await fetch(`${API_BASE_URL}/GetModulesCatalog`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
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