import { http } from "./http";
import type { DtoResponse } from "types/api";
import type { AuthenticationDto, CreateUserDto, UserDto, UserLoginDto } from "types/domain";

export async function register(payload: CreateUserDto): Promise<UserDto> {
  const { data } = await http.post<DtoResponse<UserDto>>("/users-auth", payload);

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel criar a conta.");
  }

  return data.data;
}

export async function login(payload: AuthenticationDto): Promise<UserLoginDto> {
  const { data } = await http.post<DtoResponse<UserLoginDto>>(
    "/users-auth/login",
    payload
  );

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel autenticar.");
  }

  return data.data;
}
