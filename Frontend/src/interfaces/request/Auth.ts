export type AreasListId = number[];
export interface LoginRequest {
  user: string;
  password: string;
}

export interface RegisterRequest {
  user: string;
  password: string;
  email: string;
  birthDate: string;
  firstName: string;
  lastName: string;
  lastNameTwo: string;
  sex: string;
}

export interface ModulesRequest{
  AreasId: AreasListId;
}

export interface ChangePasswordRequest {
  email: string;
  password: string;
}
