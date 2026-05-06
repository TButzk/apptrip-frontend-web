export type UserLoginDto = {
  token: string;
  name: string;
  email: string;
  favoritePlacesIds: string[];
  routeIds: string[];
};

export type AuthenticationDto = {
  email: string;
  password: string;
};

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
};

export type UserDto = {
  id: string;
  name: string;
  email: string;
};

export type RouteDto = {
  id: string;
  name: string;
  userId: string;
  placeIds: string[];
  status: "DRAFT" | "PUBLISHED" | "FINISHED";
  publishedAt?: string;
  finalizedAt?: string;
};

export type PlaceDto = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence?: number;
  capturedAt?: string;
  neighborhood: string;
  street: string;
  streetNumber: string;
  complement: string;
  city: string;
  postalCode: string;
  country: string;
  state: string;
  type: string;
  routeId: string;
  eventIds: string[];
};
