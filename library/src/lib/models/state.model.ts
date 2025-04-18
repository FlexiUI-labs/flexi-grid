import { FilterType } from "../components/flexi-grid-column.component";

export class StateModel{
    pageNumber: number = 1;
    pageSize: number = 10;
    skip: number = 0;
    sort: StateOrderModel = new StateOrderModel();
    filter: StateFilterModel[] = [];
  }

  export class StateOrderModel{
    dir: string = "";
    field: string = "";
  } 

  export class StateFilterModel{
    field: string = "";
    value: string = "";
    value2: string = "";
    operator: string = "contains";
    type: FilterType = "text";
  }