export interface PaginationMetaData {
  page: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  total_pages: number;
}

export interface ApiResponseDto<T = any> {
  code?: number;
  message?: string;
  data?: T;
  metadata?: PaginationMetaData;
}
