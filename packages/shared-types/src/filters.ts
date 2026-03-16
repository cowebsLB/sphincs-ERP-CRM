export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface CommonFilters extends DateRangeFilter {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

