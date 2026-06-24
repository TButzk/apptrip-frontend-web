import axios from "axios";
import { http } from "./http";
import type { DtoResponse, PageResponse } from "types/api";
import type {
  CommentDto, CreateMediaDto, CreatePlaceDto, CreatePostDto, CreateRouteDto,
  MediaDto, PlaceDto, PlaceSocialDto, PostDto, RatingDto, RouteDto, RouteLinkDto,
  UpdateRouteDto, UploadDto
} from "types/domain";

export const listRoutes = (skip = 0, take = 30) =>
  pageRequest<RouteDto>("/routes/published", { skip, take });
export const listMyRoutes = (skip = 0, take = 50) =>
  pageRequest<RouteDto>("/routes/mine", { skip, take });
export const getRouteById = (id: string) => dtoRequest<RouteDto>("get", `/routes/${id}`);
export const getPlaceById = (id: string) => dtoRequest<PlaceDto>("get", `/places/${id}`);
export const getRoutePlaces = (routeId: string) =>
  pageRequest<PlaceDto>(`/routes/${routeId}/places`, { skip: 0, take: 1000 });
export const createRoute = (payload: CreateRouteDto) =>
  dtoRequest<RouteDto>("post", "/routes", payload);
export const updateRoute = (id: string, payload: UpdateRouteDto) =>
  dtoRequest<RouteDto>("patch", `/routes/${id}`, payload);
export const createPlace = (payload: CreatePlaceDto) =>
  dtoRequest<PlaceDto>("post", "/places", payload);
export const createPost = (payload: CreatePostDto) =>
  dtoRequest<PostDto>("post", "/posts", payload);
export const createMedia = (postId: string, payload: CreateMediaDto) =>
  dtoRequest<MediaDto>("post", `/posts/${postId}/media`, payload);
export const createComment = (postId: string, message: string) =>
  dtoRequest<CommentDto>("post", `/posts/${postId}/comments`, { message });
export const deletePost = (id: string) => dtoRequest<PostDto>("delete", `/posts/${id}`);
export const deleteMedia = (postId: string, id: string) =>
  dtoRequest<MediaDto>("delete", `/posts/${postId}/media/${id}`);
export const deleteComment = (postId: string, id: string) =>
  dtoRequest<CommentDto>("delete", `/posts/${postId}/comments/${id}`);
export const getPlaceSocial = (placeId: string) =>
  dtoRequest<PlaceSocialDto>("get", `/places/${placeId}/social`);
export const setRating = (placeId: string, value: number) =>
  dtoRequest<RatingDto>("put", `/places/${placeId}/ratings/me`, { value });
export const linkRoute = (placeId: string, routeId: string) =>
  dtoRequest<RouteLinkDto>("post", `/places/${placeId}/route-links`, { routeId });
export const unlinkRoute = (id: string) =>
  dtoRequest<RouteLinkDto>("delete", `/route-links/${id}`);
export const finalizeRoute = (id: string) =>
  dtoRequest<RouteDto>("patch", `/routes/${id}/finalize`);
export const publishRoute = (id: string) =>
  dtoRequest<RouteDto>("patch", `/routes/${id}/publish`);

export async function uploadMedia(file: File): Promise<UploadDto> {
  const form = new FormData();
  form.append("file", file);
  return dtoRequest<UploadDto>("post", "/uploads", form);
}

async function pageRequest<T>(url: string, params: Record<string, number>): Promise<T[]> {
  try {
    const { data } = await http.get<PageResponse<T>>(url, { params, timeout: 10000 });
    if (!data.data) throw new Error(data.error ?? "Não foi possível carregar os dados.");
    return data.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function dtoRequest<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  payload?: unknown
): Promise<T> {
  try {
    const { data } = await http.request<DtoResponse<T>>({ method, url, data: payload, timeout: 20000 });
    if (!data.data) throw new Error(data.error ?? "Não foi possível concluir a operação.");
    return data.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error;
  if (axios.isAxiosError<DtoResponse<unknown>>(error)) {
    return new Error(error.response?.data?.error ?? (error.code === "ERR_NETWORK"
      ?"Sem conexão com o servidor."
      : "Não foi possível concluir a operação."));
  }
  return new Error("Não foi possível concluir a operação.");
}
