// Shared repository types to avoid naming conflicts

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseFilters {
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}