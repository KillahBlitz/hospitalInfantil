import { UsersResponse } from "../interfaces/response/Platform";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/Platform`;

export async function getUsers(): Promise<UsersResponse> {
    const response = await fetch(`${API_BASE_URL}/UserRequest`);
    if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
    }
    return response.json();
}