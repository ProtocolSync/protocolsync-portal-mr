export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ListRequest {
  pagination?: { page: number; perPage: number };
  sort?: { field: string; order: 'ASC' | 'DESC' };
  filter?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface GetOneRequest {
  id: string;
  meta?: Record<string, any>;
}

export interface CreateRequest<T> {
  data: T;
  meta?: Record<string, any>;
}

export interface UpdateRequest<T> {
  id: string;
  data: Partial<T>;
  previousData?: T;
  meta?: Record<string, any>;
}

export interface DeleteRequest {
  id: string;
  previousData?: any;
  meta?: Record<string, any>;
}

export interface DeleteManyRequest {
  ids: string[];
  meta?: Record<string, any>;
}

export interface GetListResponse<T> {
  data: T[];
  total: number;
}

export interface GetOneResponse<T> {
  data: T;
}

export interface CreateResponse<T> {
  data: T;
}

export interface UpdateResponse<T> {
  data: T;
}

export interface DeleteResponse<T> {
  data: T;
}

export interface DeleteManyResponse {
  data: string[];
}
