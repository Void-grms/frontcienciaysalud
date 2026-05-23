import type { AxiosError } from 'axios';

// Formato RFC 7807 que devuelve el backend.
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly fieldErrors: Array<{ field: string; message: string }>;
  readonly raw: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || 'Error desconocido');
    this.name = 'ApiError';
    this.status = problem.status ?? 500;
    this.title = problem.title ?? 'Error';
    this.detail = problem.detail;
    this.fieldErrors = problem.errors ?? [];
    this.raw = problem;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const ax = error as AxiosError<ProblemDetails>;
  if (ax?.isAxiosError) {
    if (ax.response?.data && typeof ax.response.data === 'object') {
      return new ApiError({
        ...ax.response.data,
        status: ax.response.data.status ?? ax.response.status,
      });
    }
    return new ApiError({
      status: ax.response?.status ?? 0,
      title: 'Error de red',
      detail: ax.message,
    });
  }

  return new ApiError({
    status: 500,
    title: 'Error inesperado',
    detail: error instanceof Error ? error.message : String(error),
  });
}
