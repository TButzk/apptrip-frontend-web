import { http } from "./http";
import type { DtoResponse, PageResponse } from "types/api";
import type { PlaceDto, RouteDto } from "types/domain";

export async function listRoutes(skip = 0, take = 20): Promise<RouteDto[]> {
  const { data } = await http.get<PageResponse<RouteDto>>("/routes/published", {
    params: { skip, take }
  });

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel carregar rotas.");
  }

  return data.data;
}

export async function getRouteById(id: string): Promise<RouteDto> {
  const { data } = await http.get<DtoResponse<RouteDto>>(`/routes/${id}`);

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel carregar rota.");
  }

  return data.data;
}

export async function getPlaceById(id: string): Promise<PlaceDto> {
  const { data } = await http.get<DtoResponse<PlaceDto>>(`/places/${id}`);

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel carregar ponto/lugar.");
  }

  return data.data;
}

export async function getRoutePlaces(routeId: string): Promise<PlaceDto[]> {
  const { data } = await http.get<PageResponse<PlaceDto>>(
    `/routes/${routeId}/places`,
    {
      params: { skip: 0, take: 500 }
    }
  );

  if (!data.data) {
    throw new Error(data.error ?? "Nao foi possivel carregar pontos da rota.");
  }

  return data.data;
}
