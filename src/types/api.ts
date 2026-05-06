export type DtoResponse<T> = {
  data: T | null;
  error: string | null;
};

export type PageInfo = {
  totalPages: number;
  totalElements: number;
};

export type PageResponse<T> = {
  data: T[];
  page: PageInfo | null;
  error: string | null;
};
