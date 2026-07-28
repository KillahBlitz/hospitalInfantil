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