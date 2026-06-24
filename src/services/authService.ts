import axios from "axios";
import { http } from "./http";
import type { DtoResponse } from "types/api";
import type { AuthenticationDto, CreateUserDto, UserDto, UserLoginDto } from "types/domain";

export const register = (payload: CreateUserDto) =>
  requestAuth<UserDto>("/users-auth", payload, "Não foi possível criar a conta.");
export const login = (payload: AuthenticationDto) =>
  requestAuth<UserLoginDto>("/users-auth/login", payload, "Não foi possível autenticar.");

async function requestAuth<T>(url: string, payload: unknown, fallback: string): Promise<T> {
  try {
    const { data } = await http.post<DtoResponse<T>>(url, payload);
    if (!data.data) throw new Error(data.error ?? fallback);
    return data.data;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    if (axios.isAxiosError<DtoResponse<T>>(error)) {
      throw new Error(error.response?.data?.error ?? fallback);
    }
    throw new Error(fallback);
  }
}
