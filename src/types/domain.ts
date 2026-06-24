export type UserRole = "USER" | "ADMIN";

export type UserLoginDto = {
  id: string;
  token: string;
  name: string;
  email: string;
  role: UserRole;
  favoritePlacesIds?: string[];
  routeIds?: string[];
};

export type AuthenticationDto = { email: string; password: string };
export type CreateUserDto = { name: string; email: string; password: string };
export type UserDto = { id: string; name: string; email: string; role: UserRole };

export type RouteStatus = "DRAFT" | "FINISHED" | "PUBLISHED";
export type RouteDto = {
  id: string;
  name: string;
  userId: string;
  placeIds: string[];
  status: RouteStatus;
  publishedAt?: string;
  finalizedAt?: string;
  minimumDistanceMeters: number;
};

export type CreateRouteDto = { name: string; minimumDistanceMeters?: number };
export type UpdateRouteDto = { name?: string };

export type CreatePlaceDto = {
  name: string;
  routeId: string;
  latitude: number;
  longitude: number;
  sequence?: number;
  capturedAt: string;
  clientPointId?: string;
  accuracyMeters?: number;
  type: "Private" | "Public";
};

export type PlaceDto = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence?: number;
  capturedAt?: string;
  clientPointId?: string;
  accuracyMeters?: number;
  neighborhood?: string;
  street?: string;
  streetNumber?: string;
  complement?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
  type: string;
  routeId: string;
  eventIds: string[];
};

export type MediaType = "Photo" | "Video" | "Audio" | "Gif";
export type CreatePostDto = {
  title?: string;
  message?: string;
  date?: string;
  placeId: string;
  mediaIds?: string[];
};
export type PostDto = {
  id: string;
  title?: string;
  message?: string;
  date: string;
  userId: string;
  userName?: string;
  placeId: string;
  mediaIds: string[];
};
export type CreateMediaDto = {
  name: string;
  url: string;
  type: MediaType;
  storageFilename?: string;
  contentType?: string;
  sizeBytes?: number;
};
export type MediaDto = CreateMediaDto & { id: string; postId: string };
export type CommentDto = {
  id: string;
  message: string;
  postId: string;
  userId: string;
  userName?: string;
  createdAt: string;
};
export type RatingDto = {
  placeId: string;
  userId?: string;
  value: number;
  average: number;
  count: number;
};
export type RouteLinkDto = {
  id: string;
  placeId: string;
  routeId: string;
  routeName: string;
  userId: string;
  createdAt: string;
};
export type PlaceSocialDto = {
  place: PlaceDto;
  posts: PostDto[];
  media: MediaDto[];
  comments: CommentDto[];
  linkedRoutes: RouteLinkDto[];
  ratingAverage: number;
  ratingCount: number;
  myRating?: number;
};
export type UploadDto = {
  url: string;
  filename: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  type: MediaType;
};
