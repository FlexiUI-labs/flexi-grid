import { FilterType } from "../components/flexi-grid-column.component";

export class StateModel{
    pageNumber: number = 1;
    pageSize: number = 10;
    skip: number = 0;
    sort: StateSortModel = {
      field: '',
      dir: 'asc'
    };
    filter: StateFilterModel[] = [];
  }

  export interface StateSortModel{
    dir: 'asc' | 'desc';
    field: string;
  }

  export interface StateFilterModel{
    field: string;
    value: any;
    value2?: string;
    operator: FilterOperator;
    type: FilterType;
  }

  export const initialStateFilterModel: StateFilterModel = {
    field: '',
    value: '',
    operator: 'contains',
    type: 'text'
  }

  export type FilterOperator =
  | 'eq'           // Equals
  | 'ne'           // Not equal
  | 'contains'     // Contains
  | 'not contains' // Does not contain
  | 'startswith'   // Starts with
  | 'endswith'     // Ends with
  | 'gt'           // Greater than
  | 'ge'           // Greater than or equal
  | 'lt'           // Less than
  | 'le'           // Less than or equal
  | 'range';       // Range (for date and number types)