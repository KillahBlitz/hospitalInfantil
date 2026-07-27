import { RegisterRequest } from '../interfaces/request/Auth';
import { RegisterResponse } from "../interfaces/response/Auth";

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
