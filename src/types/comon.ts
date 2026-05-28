export interface GetRolesParams {
  skip: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean | null;
}

export interface GetAllRolesParams {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
