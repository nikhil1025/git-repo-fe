export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortModel {
  colId: string;
  sort: 'asc' | 'desc';
}

export interface FilterModel {
  [key: string]: {
    filterType: string;
    type: string;
    filter: any;
  };
}

export interface DataRequest {
  page: number;
  pageSize: number;
  sortModel?: SortModel[];
  filterModel?: FilterModel;
  searchValue?: string;
}

export interface DataResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fields?: string[];
}

export interface CollectionField {
  field: string;
  headerName: string;
  type?: string;
}
