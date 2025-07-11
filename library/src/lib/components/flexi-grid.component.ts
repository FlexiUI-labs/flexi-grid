import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, TemplateRef, ViewEncapsulation, inject, signal, output, input, contentChildren, viewChild, linkedSignal, computed, contentChild, OnInit } from '@angular/core';
import { FilterType, FlexiGridColumnComponent, TextAlignType } from './flexi-grid-column.component';
import { FilterOperator, initialStateFilterModel, StateFilterModel, StateModel, StateSortModel } from '../models/state.model';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { FlexiGridReorderModel } from '../models/flexi-grid-reorder.model';
import { FlexiGridColumnCommandTemplateDirective } from '../directives/flexi-grid-column-command-template.directive';
import { FlexiGridCaptionCommandTemplateDirective } from '../directives/flexi-grid-caption-command-template.directive';
import { StatusChangeEvent } from '@angular/forms';

@Component({
  selector: 'flexi-grid',
  templateUrl: './flexi-grid.component.html',
  styleUrls: [
    "./css/flexi-grid-start.css",
    "./css/flexi-grid-data.css",
    "./css/flexi-grid.common.css",
    "./flexi-grid.component.css",
    "./css/flexi-grid-command.css",
    "./css/flexi-grid-dropdown.css",
    "./css/flexi-grid-filter.css",
    "./css/flexi-grid-sort.css"
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class FlexiGridComponent implements OnChanges, AfterViewInit, OnInit {
  readonly data = input.required<any[]>();
  readonly total = input<number | null>(0);
  readonly pageable = input<boolean>(true);
  readonly showIndex = input<boolean>(false);
  readonly indexTextAlign = input<TextAlignType>("center");
  readonly pageSizeList = input<number[]>([5, 10, 20, 30, 50, 100, 500, 1000]);
  readonly loading = input<boolean>(false);
  readonly sortable = input<boolean>(true);
  readonly themeClass = input<"light" | "dark">("light");
  readonly filterable = input<boolean>(true);
  readonly captionTitle = input<string>("");
  readonly footerTemplate = input<TemplateRef<any> | any>();
  readonly showColumnVisibility = input<boolean>(true);
  readonly showRefreshBtn = input<boolean>(true);
  readonly dataBinding = input<boolean>(false);
  readonly showCaption = input<boolean>(false);
  readonly showExportExcelBtn = input<boolean>(false);
  readonly height = input<string>("450px");
  readonly useMinHeight = input<boolean>(true);
  readonly minHeight = input<string>("450px");
  readonly autoHeight = input<boolean>(true);
  readonly minWidth = input<string>("1050px");
  readonly useMinWidth = input<boolean>(false);
  readonly autoWidth = input<boolean>(true);
  readonly width = input<string>("100%");
  readonly indexWidth = input<string>("45px");
  readonly exportExcelFileName = input<string>("excel-export");
  readonly exportExcelButtonClick = input<(() => void)>();
  readonly resizable = input<boolean>(true);
  readonly tbodyStyle = input<any>({});
  readonly trMinHeight = input<string>("45px");
  readonly language = input<"tr" | "en" | "bg">("en");
  readonly commandColumnTitle = input<string>("");
  readonly commandColumnWidth = input<string>("130px");
  readonly commandColumnTextAlign = input<AlignSetting>("left");
  readonly stickyCommandColumn = input<boolean>(true);
  readonly fontSize = input<string>("13px");
  readonly dataBindingExportEndpoint = input<string>('');
  readonly dataBindingExportPath = input<string>('data');
  readonly customColumns = input<any>([]);
  readonly reOrderWidth = input<string>("50px");
  readonly reOrderTextAlign = input<TextAlignType>("center");
  readonly reorderable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly selectableWidth = input<string>("50px");
  readonly selectableTextAlign = input<TextAlignType>("center");
  readonly selectableField = input<string>("");
  readonly useCommandDropdown = input<boolean>(false);
  readonly fontFamily = input<string>('');
  readonly showFilterPanel = input<boolean>(true);
  readonly groupable = input<boolean>(false);
  readonly groupableField = input<string>('');
  readonly sort = input<StateSortModel | undefined>(undefined);
  readonly filter = input<StateFilterModel[]>([]);

  readonly columnsArray = signal<FlexiGridColumnComponent[]>([]);
  readonly selectedRows = signal<Set<any>>(new Set());
  readonly timeStamp = signal<string>(
    `${new Date().getTime()}-${Math.random().toString(36).slice(2, 11)}`
  );
  readonly allSelected = signal<boolean>(false);
  readonly totalSignal = linkedSignal(() => {
    if (this.total()! > 0) {
      return this.total();
    } else if (this.prevTotal() > 0) {
      return this.prevTotal();
    }

    return this.total();
  });
  readonly dataSignal = linkedSignal(() => this.data());
  readonly commandColumnTitleSignal = linkedSignal(() => this.commandColumnTitle() ? this.commandColumnTitle() : (this.language() === "tr" ? "İşlemler" : (this.language() === "en" ? "Operations" : "Операции")));
  readonly groupedDataSignal = computed(() => {
    if (this.groupable() && this.groupableField() && this.pagedData()) {
      const grouped = this.buildTree(this.pagedData(), this.groupableField());
      const allCodes = this.collectAllGroupCodes(grouped);
      this.normalExpandedNodes = new Set(allCodes);
      return grouped;
    }

    return [];
  });
  normalExpandedNodes = new Set();
  readonly expandedNodes = linkedSignal(() => this.normalExpandedNodes);
  globalRowIndex = 0;
  readonly pageableSignal = computed(() => this.pageable() && !this.groupable());
  readonly heightSignal = computed(() => this.autoHeight() ? '100%' : this.height());

  readonly dataStateChange = output<any>();
  readonly onChange = output<any>();
  readonly onRefresh = output<void>();
  readonly onReorder = output<FlexiGridReorderModel>();
  readonly onSelected = output<any[]>();

  @Input()
  set pageSize(value: number) {
    if (value !== this._pageSize()) {
      this._pageSize.set(value);
      this.changePageSize({ target: { value: value } });
    }
  }

  get pageSize(): number {
    return this._pageSize();
  }

  readonly pageNumberCount = signal<number>(5);
  readonly pageNumbers = signal<number[]>([]);
  readonly totalPageCount = signal<number>(0);
  readonly state = signal<StateModel>(new StateModel());
  readonly pagedData = signal<any[]>([]);
  timeoutId: any;
  readonly textFilterTypes = signal<{ operator: FilterOperator, value: string }[]>([]);
  readonly numberFilterTypes = signal<{ operator: FilterOperator, value: string }[]>([]);
  readonly dateFilterTypes = signal<{ operator: FilterOperator, value: string }[]>([]);
  readonly _pageSize = signal<number>(10);
  readonly resizingColumn = signal<any>(undefined);
  readonly startX = signal<number | undefined>(undefined);
  readonly startWidth = signal<number | undefined>(undefined);
  readonly isShowMobileFilter = signal<boolean>(false);

  readonly prevData = signal<any[]>([]);
  readonly prevTotal = signal<number>(0);
  readonly noData = computed(() => {
    switch (this.language()) {
      case "tr": return "Gösterilecek veri bulunamadı!"
      case "en": return "No data to display!"
      case "bg": return "Няма данни за показване!"
      default: return ""
    }
  });
  readonly columnVisibility = computed(() => {
    switch (this.language()) {
      case "tr": return "Sütun Görünürlüğü"
      case "en": return "Column Visibility"
      case "bg": return "Видимост на колоните"
      default: return ""
    }
  });
  readonly exportExcelText = computed(() => {
    switch (this.language()) {
      case "tr": return "Excel'e Aktar"
      case "en": return "Export Excel"
      case "bg": return "Експортиране в Excel"
      default: return ""
    }
  });
  readonly selectAnOption = computed(() => {
    switch (this.language()) {
      case "tr": return "Seçim yapınız";
      case "en": return "Select an option";
      case "bg": return "Изберете опция";
      default: return "";
    }
  });
  readonly applyBtnText = computed(() => {
    switch (this.language()) {
      case "tr": return "Uygulama";
      case "en": return "Apply";
      case "bg": return "Приложи";
      default: return "";
    }
  });
  readonly openFilterBtnText = computed(() => {
    switch (this.language()) {
      case "tr": return "Filtreyi Aç";
      case "en": return "Open Filter";
      case "bg": return "Отвори филтър";
      default: return "";
    }
  });
  readonly clearBtnText = computed(() => {
    switch (this.language()) {
      case "tr": return "Temizle";
      case "en": return "Clear";
      case "bg": return "Изчисти";
      default: return "";
    }
  });
  readonly selected = computed(() => {
    switch (this.language()) {
      case "tr": return "Seçilen";
      case "en": return "Selected";
      case "bg": return "Избрани";
      default: return "";
    }
  });
  readonly refreshText = computed(() => {
    switch (this.language()) {
      case "tr": return "Yenile";
      case "en": return "Refresh";
      case "bg": return "Опресни";
      default: return "";
    }
  });
  readonly collapseAllText = computed(() => {
    switch (this.language()) {
      case "en": return "Collapse All";
      case "tr": return "Tümünü Daralt";
      case "bg": return "Свий всички";
      default: return "";
    }
  });
  readonly expandAllText = computed(() => {
    switch (this.language()) {
      case "en": return "Expand All";
      case "tr": return "Tümünü Genişlet";
      case "bg": return "Разшири всички";
      default: return "";
    }
  });
  readonly ofText = computed(() => {
    switch (this.language()) {
      case "en": return "of";
      case "tr": return "toplam";
      case "bg": return "от";
      default: return "";
    }
  });
  readonly itemsText = computed(() => {
    switch (this.language()) {
      case "en": return "items";
      case "tr": return "kayıt";
      case "bg": return "записи";
      default: return "";
    }
  });

  readonly columns = contentChildren(FlexiGridColumnComponent, { descendants: true });

  readonly columnCommandTemplate = contentChild(FlexiGridColumnCommandTemplateDirective, { read: TemplateRef });
  readonly captionCommandTemplate = contentChild(FlexiGridCaptionCommandTemplateDirective, { read: TemplateRef });

  readonly filterTr = viewChild<ElementRef<HTMLTableRowElement>>("filterTr");
  readonly tbody = viewChild<ElementRef>("tbody");

  #cdr = inject(ChangeDetectorRef);
  #http = inject(HttpClient);

  getColumns() {
    return [...this.customColumns(), ...this.columns()]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["loading"]) {
      if (!this.loading()) {
        this.prevData.set(this.data());
        this.prevTotal.set(this.total()!);
      }
    }

    if (this.dataSignal().length > 0) {
      const columns = this.getColumns();
      if (!columns || columns.length === 0) {
        this.initializeColumnsFromData();
        this.#cdr.detectChanges();
      }
    }

    if (this.pageableSignal()) {
      this.setPageNumbers();
      this.updatePagedData();
    } else {
      this.pagedData.set(this.dataSignal());
    }
  }

  ngOnInit() {
    if (this.sort()) {
      this.state.update(prev => ({ ...prev, sort: this.sort()!, filter: this.filter() }))
      this.dataStateChange.emit(this.state());
    } else {
      this.state.update(prev => ({ ...prev, filter: this.filter() }));
      this.dataStateChange.emit(this.state());
    }


    this.filter().forEach(val => {
      const column = this.columns().find(i => i.field() === val.field);
      if (column) {
        column.filterOperator.set(val.operator);
        column.filterValueSignal.set(val.value)
      }
    })
  }

  ngAfterViewInit(): void {
    const columns = this.getColumns();
    if (!columns || columns.length === 0) {
      this.initializeColumnsFromData();
      this.#cdr.detectChanges();
    }

    columns?.forEach((column: any) => {
      if (column.filterValue() != undefined) {
        this.filterMethod(column.field(), column.filterOperator(), column.filterValue(), column.filterType());
      }
    });

    this.setupFilterTypes();
  }

  setupFilterTypes() {
    switch (this.language()) {
      case "tr":
        this.textFilterTypes.set([
          { operator: "eq", value: 'Eşittir' },
          { operator: "ne", value: 'Eşit değildir' },
          { operator: "contains", value: 'İçerir' },
          { operator: "not contains", value: 'İçermez' },
          { operator: "startswith", value: 'İle başlar' },
          { operator: "endswith", value: 'İle biter' }
        ]);
        this.numberFilterTypes.set([
          { operator: "eq", value: 'Eşittir' },
          { operator: "ne", value: 'Eşit değildir' },
          { operator: "gt", value: 'Daha büyüktür' },
          { operator: "ge", value: 'Daha büyüktür ya da eşittir' },
          { operator: "lt", value: 'Daha küçüktür' },
          { operator: "le", value: 'Daha küçüktür ya da eşittir' }
        ]);
        this.dateFilterTypes.set([
          { operator: "eq", value: 'Eşittir' },
          { operator: "ne", value: 'Eşit değildir' },
          { operator: "gt", value: 'Sonraki' },
          { operator: "ge", value: 'Sonraki ya da aynı tarih' },
          { operator: "lt", value: 'Önceki' },
          { operator: "le", value: 'Önceki ya da aynı tarih' },
          { operator: "range", value: 'Belirli bir tarih aralığında' }
        ]);
        break;

      case "en":
        this.textFilterTypes.set([
          { operator: "eq", value: 'Equals' },
          { operator: "ne", value: 'Not equal' },
          { operator: "contains", value: 'Contains' },
          { operator: "not contains", value: 'Does not contain' },
          { operator: "startswith", value: 'Starts with' },
          { operator: "endswith", value: 'Ends with' }
        ]);
        this.numberFilterTypes.set([
          { operator: "eq", value: 'Equals' },
          { operator: "ne", value: 'Not equal' },
          { operator: "gt", value: 'Greater than' },
          { operator: "ge", value: 'Greater than or equal' },
          { operator: "lt", value: 'Less than' },
          { operator: "le", value: 'Less than or equal' }
        ]);
        this.dateFilterTypes.set([
          { operator: "eq", value: 'Equals' },
          { operator: "ne", value: 'Not equal' },
          { operator: "gt", value: 'Later' },
          { operator: "ge", value: 'Later or same date' },
          { operator: "lt", value: 'Earlier' },
          { operator: "le", value: 'Earlier or same date' },
          { operator: "range", value: 'Within a specific date range' }
        ]);
        break;

      case "bg":
        this.textFilterTypes.set([
          { operator: "eq", value: 'Равно на' },
          { operator: "ne", value: 'Различно от' },
          { operator: "contains", value: 'Съдържа' },
          { operator: "not contains", value: 'Не съдържа' },
          { operator: "startswith", value: 'Започва с' },
          { operator: "endswith", value: 'Завършва с' }
        ]);
        this.numberFilterTypes.set([
          { operator: "eq", value: 'Равно на' },
          { operator: "ne", value: 'Различно от' },
          { operator: "gt", value: 'По-голямо от' },
          { operator: "ge", value: 'По-голямо или равно на' },
          { operator: "lt", value: 'По-малко от' },
          { operator: "le", value: 'По-малко или равно на' }
        ]);
        this.dateFilterTypes.set([
          { operator: "eq", value: 'Равно на' },
          { operator: "ne", value: 'Различно от' },
          { operator: "gt", value: 'След дата' },
          { operator: "ge", value: 'След или на същата дата' },
          { operator: "lt", value: 'Преди дата' },
          { operator: "le", value: 'Преди или на същата дата' },
          { operator: "range", value: 'В определен период' }
        ]);
        break;
    }
  }

  buildTree(data: any[], groupField: string): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const item of data) {
      const node = { ...item, children: [] };
      map.set(item[groupField], node);
    }

    for (const item of data) {
      const parts = item[groupField].split(".");
      if (parts.length === 1) {
        roots.push(map.get(item[groupField]));
      } else {
        const parentCode = parts.slice(0, parts.length - 1).join(".");
        const parent = map.get(parentCode);
        if (parent) {
          parent.children.push(map.get(item[groupField]));
        } else {
          roots.push(map.get(item[groupField]));
        }
      }
    }

    return roots;
  }

  collectAllGroupCodes(nodes: any[]): string[] {
    const codes: string[] = [];

    const traverse = (items: any[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          codes.push(item[this.groupableField()]);
          traverse(item.children);
        }
      }
    };

    traverse(nodes);
    return codes;
  }

  expandAll() {
    const grouped = this.groupedDataSignal();
    const allCodes = this.collectAllGroupCodes(grouped);
    this.expandedNodes.set(new Set(allCodes));
  }

  collapseAll() {
    this.expandedNodes.set(new Set());
  }

  toggleNodeExpand(code: string) {
    const set = new Set(this.expandedNodes());
    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }
    this.expandedNodes.set(set);
  }

  isNodeExpanded(code: string): boolean {
    return this.expandedNodes().has(code);
  }

  resetGlobalRowIndex(): void {
    this.globalRowIndex = 0;
  }

  getNextGlobalRowIndex(): number {
    const pageNumber = this.state().pageNumber - 1;
    const pageSize = this.state().pageSize;
    const nextValue = (+this.globalRowIndex + 1) + (pageNumber * pageSize);
    this.globalRowIndex = +nextValue;
    return nextValue;
  }

  giveFilterValueByFilterType(filterType: string) {
    switch (filterType) {
      case "text":
        return this.textFilterTypes();

      case "number":
        return this.numberFilterTypes();

      case "date":
        return this.dateFilterTypes();

      default:
        return [];
    }
  }

  initializeColumnsFromData(): void {
    const data = this.dataSignal();
    if (data && data.length > 0) {
      const firstItem = data[0];
      const columnsArray = Object.keys(firstItem).map(key => {
        let column: any = {
          field: key,
          title: this.capitalizeFirstLetter(key),
          visible: true,
          hideOverflow: true,
        };
        return column;
      });

      this.columnsArray.set(columnsArray);
    }
  }

  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  changePage(pageNumber: number) {
    if (this.state().pageNumber === pageNumber) return;
    this.allSelected.set(false);

    if (pageNumber > this.totalPageCount()) {
      pageNumber = this.totalPageCount();
    } else if (pageNumber < 1) {
      pageNumber = 1;
    }

    const previousPageNumber = this.state().pageNumber;
    this.state.update(prev => ({
      ...prev,
      pageNumber: +pageNumber,
      skip: (pageNumber - 1) * +this.state().pageSize
    }));
    this.dataStateChange.emit(this.state());

    // Check if the page number crossed a 10-page boundary
    const previousGroup = Math.floor((previousPageNumber - 1) / this.pageNumberCount());
    const currentGroup = Math.floor((pageNumber - 1) / this.pageNumberCount());

    if (currentGroup > previousGroup) {
      this.nextPageGroup();
    } else if (currentGroup < previousGroup) {
      this.previousPageGroup();
    } else {
      this.setPageNumbers();
    }

    this.updatePagedData();
  }

  setPageNumbers() {
    const pageCount = Math.ceil(this.totalSignal()! / +this.state().pageSize);
    const numbers = [];

    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const startPage = currentGroup * this.pageNumberCount() + 1;
    const endPage = Math.min(startPage + (this.pageNumberCount() - 1), pageCount);

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }

    this.pageNumbers.set(numbers);
    this.totalPageCount.set(pageCount);
  }

  nextPageGroup() {
    const pageCount = Math.ceil(this.totalSignal()! / +this.state().pageSize);
    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const nextGroupStartPage = (currentGroup + 1) * this.pageNumberCount() + 1;

    if (nextGroupStartPage <= pageCount) {
      this.state.update((prev) => ({
        ...prev,
        pageNumber: nextGroupStartPage,
        skip: (nextGroupStartPage - 1) * +this.state().pageSize
      }));
    }

    this.setPageNumbers();
    if (this.dataBinding()) {
      this.dataStateChange.emit(this.state());
    } else {
      this.updatePagedData();
    }
  }

  previousPageGroup() {
    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const previousGroupStartPage = (currentGroup - 1) * this.pageNumberCount() + 1;

    if (previousGroupStartPage > 0) {
      this.state.update((prev) => ({
        ...prev,
        pageNumber: previousGroupStartPage,
        skip: (previousGroupStartPage - 1) * +this.state().pageSize
      }));
    }

    this.setPageNumbers();
    if (this.dataBinding()) {
      this.dataStateChange.emit(this.state());
    } else {
      this.updatePagedData();
    }
  }

  changePageSize(event: any) {
    const value = +event.target.value;
    this.pageSize = value;
    this.state.update(prev => ({
      ...prev,
      pageSize: value,
      pageNumber: 1,
      skip: 0
    }));
    if (this.pageableSignal() && this.dataBinding()) {
      this.dataStateChange.emit(this.state());
    } else {
      this.updatePagedData();
    }
  }

  updatePagedData() {
    let filteredData = [...this.dataSignal()];

    if (!filteredData) {
      this.pagedData.set([]);
      return;
    }

    const dataBinding = this.dataBinding();
    if (this.filterable() && this.state().filter.length > 0 && !dataBinding) {
      const filters = this.state().filter.filter(p => p.value != undefined);

      filters.forEach((filter) => {
        filteredData = filteredData.filter(item => {
          const field = filter.field;
          const value = filter.value;
          let itemValue = item[field];
          let filterValue: any = value;
          let filterValue2: any = filter.value2;

          if (filter.type !== "boolean" && filter.type !== "select" && filter.type !== "number") {
            itemValue = itemValue ? itemValue.toString().toLocaleLowerCase('tr') : '';
            filterValue = value ? value.toString().toLocaleLowerCase('tr') : '';
          } else if (filter.type === "boolean") {
            filterValue = value == "true" ? true : false;
          } else if (filter.type === "number") {
            filterValue = +value.toString().replace(",", ".");
          }

          switch (filter.operator) {
            case 'eq':
              return itemValue === filterValue;
            case 'ne':
              return itemValue !== filterValue;
            case 'contains':
              return itemValue.includes(filterValue);
            case 'not contains':
              return !itemValue.includes(filterValue);
            case 'startswith':
              return itemValue.startsWith(filterValue);
            case 'endswith':
              return itemValue.endsWith(filterValue);
            case 'gt':
              if (filter.type === "number") {
                return parseFloat(itemValue) > parseFloat(filterValue);
              } else if (filter.type === "date") {
                return new Date(itemValue) > new Date(filterValue);
              } else {
                return true;
              }
            case 'ge':
              if (filter.type === "number") {
                return parseFloat(itemValue) >= parseFloat(filterValue);
              } else if (filter.type === "date") {
                return new Date(itemValue) >= new Date(filterValue);
              } else {
                return true;
              }
            case 'lt':
              if (filter.type === "number") {
                return parseFloat(itemValue) < parseFloat(filterValue);
              } else if (filter.type === "date") {
                return new Date(itemValue) < new Date(filterValue);
              } else {
                return true;
              }
            case 'le':
              if (filter.type === "number") {
                return parseFloat(itemValue) <= parseFloat(filterValue);
              } else if (filter.type === "date") {
                return new Date(itemValue) <= new Date(filterValue);
              } else {
                return true;
              }
            case 'range':
              if (filter.type === "date") {
                const startDate = new Date(filterValue);
                const endDate = new Date(filterValue2);
                return new Date(itemValue) >= startDate && new Date(itemValue) <= endDate;
              } else if (filter.type === "number") {
                return parseFloat(itemValue) >= parseFloat(filterValue) && parseFloat(itemValue) <= parseFloat(filterValue2);
              } else {
                return true;
              }
            default:
              return true;
          }
        });
      });
    }

    if (this.sortable() && this.state().sort.field && !dataBinding) {
      filteredData = filteredData.sort((a, b) => {
        const field = this.state().sort.field;
        const dir = this.state().sort.dir === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    if (!dataBinding) {
      this.totalSignal.set(filteredData.length);
      this.setPageNumbers();
    }

    if (filteredData) {
      if (filteredData.length > +this.state().pageSize && !dataBinding && this.pageableSignal()) {
        const start = this.state().skip;
        const end = start + +this.state().pageSize;
        this.pagedData.set(filteredData.slice(start, end));
      } else {
        this.pagedData.set(filteredData);
      }
    }

    if (filteredData.length === 0 && !this.loading()) {
      this.prevData.set([]);
      this.prevTotal.set(0);
    }
  }

  sortData() {
    if (this.dataBinding()) {
      this.dataStateChange.emit(this.state());
    } else {
      this.dataSignal.set([...this.dataSignal().sort((a, b) => {
        const field = this.state().sort.field;
        const dir = this.state().sort.dir === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      })]);
      this.updatePagedData();
    }
  }

  sortMethod(sortable: boolean, column: any) {
    if (!column.sortable() || !sortable) return;

    const oldSortField = this.state().sort.field;
    const sort = this.state().sort;
    sort.field = column.field();

    this.state.update(prev => ({
      ...prev,
      sort: sort,
      pageNumber: 1
    }));

    if (this.state().sort.dir === "asc" && oldSortField === sort.field) {
      this.state.update(prev => ({
        ...prev,
        sort: { dir: "desc", field: prev.sort.field }
      }))
    } else if (this.state().sort.dir === 'desc' && oldSortField === sort.field) {
      this.state.update(prev => ({
        ...prev,
        sort: { field: '', dir: 'asc' }
      }))
    } else {
      this.state.update(prev => ({
        ...prev,
        sort: { dir: "asc", field: prev.sort.field }
      }));
    }

    this.sortData();
  }

  setTextAlignForTh(filterable: boolean, column: any) {
    let className: string = "";

    const filter: boolean = (filterable && column.filterable());
    className += filter ? 'flexi-th ' : '';
    if (column.textAlign() === "right") {
      if (filter) className += 'flexi-flex-reverse';
      else className += 'flexi-grid-right';
    }
    else if (column.textAlign() === "center" && !filter) className += "flexi-grid-center"

    return className;
  }

  setTextAlignForThTitle(filterable: boolean, column: any) {
    const filter: boolean = (filterable && column.filterable());

    if (column.textAlign() === "right") {
      if (filter) return "flexi-flex-reverse flexi-grid-justify-content-end";
      else return "flexi-grid-justify-content-end";
    }

    if (column.textAlign() === "center" && !filter) return "flexi-grid-justify-content-center"

    return ""
  }

  toggleFilterDropdown(index: number, stamp: number) {
    const el = document.getElementById(`flexi-grid-filter-dropdown-${index}-${stamp}`);
    if (!el) return;

    const isCurrentlyOpen = el.classList.contains("show");
    this.closeAllFilterDropdown();

    if (!isCurrentlyOpen) {
      // First show the dropdown to calculate its dimensions
      el.classList.add("show");

      // Calculate available space
      const dropdownRect = el.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const spaceOnRight = windowWidth - dropdownRect.right;
      const spaceOnLeft = dropdownRect.left;

      // Clear both position classes first
      el.classList.remove("flexi-grid-dropdown-menu-right");
      el.classList.remove("flexi-grid-dropdown-menu-left");

      // Decide which side has more space and apply appropriate class
      if (spaceOnRight < 50 && spaceOnLeft > dropdownRect.width) {
        // Not enough space on right, but enough on left
        el.classList.add("flexi-grid-dropdown-menu-left");
      } else if (spaceOnLeft < 50 && spaceOnRight > dropdownRect.width) {
        // Not enough space on left, but enough on right
        el.classList.add("flexi-grid-dropdown-menu-right");
      } else if (spaceOnRight < spaceOnLeft) {
        // More space on left than right
        el.classList.add("flexi-grid-dropdown-menu-left");
      } else {
        // Default or more space on right than left
        el.classList.add("flexi-grid-dropdown-menu-right");
      }
    }
  }

  closeAllFilterDropdown() {
    const els = document.querySelectorAll(".flexi-grid-filter-dropdown");
    els.forEach(el => el.classList.remove("show"));
  }

  applyFilter(column: FlexiGridColumnComponent, operator: FilterOperator) {
    column.filterOperator.set(operator);

    if (operator === "range") {
      column.showSecondDate.set(true);

      if (!column.filterValueSignal() || !column.filterValue2Signal()) {
        return;
      }
    } else {
      column.showSecondDate.set(false);
    }

    if (column.filterValueSignal() !== "") {
      this.filterMethod(column.field(), operator, column.filterValueSignal(), column.filterType(), column.filterValue2Signal());
    }
  }

  filterDateRange(column: FlexiGridColumnComponent) {
    column.filterOperator.set("range");
    column.showSecondDate.set(true);
    this.filterMethod(column.field(), column.filterOperator(), column.filterValueSignal(), column.filterType(), column.filterValue2Signal());
  }

  filterMethod(field: string, operator: FilterOperator, value: string, type: FilterType, value2?: string) {
    if (value === undefined || value.toString() === 'undefined') value = "";
    if (operator === "range" && !value2) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (value.toString() !== '') {
        this.state.update(prev => ({
          ...prev,
          pageNumber: 1,
          skip: 0
        }));
        let filterField = this.state().filter.find(p => p.field === field);
        if (filterField) {
          filterField.value = value;
          filterField.value2 = value2 ?? "";
          filterField.operator = operator;
        } else {
          filterField = { ...initialStateFilterModel };
          filterField.field = field;
          filterField.operator = operator;
          filterField.value = value;
          filterField.value2 = value2 ?? "";
          filterField.type = type
          const filter = this.state().filter;
          filter.push(filterField);
          this.state.update(prev => ({
            ...prev,
            filter: [...filter]
          }));
        }
      } else {
        const findIndex = this.state().filter.findIndex(p => p.field === field);

        if (findIndex > -1) {
          this.state.update(prev => ({
            ...prev,
            filter: prev.filter.filter((_, i) => i !== findIndex)
          }));
        }
      }

      if (this.dataBinding()) {
        this.dataStateChange.emit(this.state());
      } else {
        this.updatePagedData();
      }
    }, this.dataBinding() ? 500 : 1);
  }

  showClearFilter(column: any) {
    const filter = column.field && this.haveFilterValue(column.filterType());
    if (!filter) return false;

    if (column.filterValueSignal()) return true;
    return false;
  }

  clearFilter(field: string) {
    this.filterMethod(field, "contains", "", "text");
    const column = this.getColumns()?.find((p: any) => p.field() === field);
    if (column) {
      column.filterValueSignal.set("");
      column.filterValue2Signal.set("");
    }

    if (this.dataBinding()) {

    } else {
      this.updatePagedData();
    }
  }

  toggleColumnVisibilityDropdown() {
    const el = document.getElementById(`flexi-grid-column-visibility-dropdown-${this.timeStamp()}`);
    if (!el) return;

    if (el.classList.contains("show")) {
      el.classList.remove("show")
    } else {
      el.classList.add("show")
    }
  }

  refreshDataMethod() {
    this.onRefresh.emit();

    if (!this.dataBinding()) return;

    this.dataStateChange.emit({ ...this.state() });
  }

  onMouseDown(event: MouseEvent | any, column: any, width: any) {
    this.resizingColumn.set(column);
    this.startX.set(event.pageX);
    this.startWidth.set(+width.toString().replace("px", ""))

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove = (event: MouseEvent) => {
    if (this.resizingColumn()) {
      const offset = event.pageX - this.startX()!;
      this.resizingColumn().widthSignal.set(this.startWidth()! + offset + 'px');
    }
  }

  @HostListener('document:mouseup')
  onMouseUp = () => {
    this.resizingColumn.set(undefined);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  getFieldValue(item: any, field: string) {
    try {
      if (!field.includes(".")) {
        const value = item[field];
        const returnValue = (value !== undefined && value !== null) ? value : ""
        return returnValue;
      } else {
        const fields = field.split(".");
        let currentValue = item;

        for (const f of fields) {
          if (currentValue && f in currentValue) {
            currentValue = currentValue[f];
          } else {
            //console.warn(`Field "${f}" not found in item`, item);
            return "";
          }
        }

        return currentValue !== undefined && currentValue !== null ? currentValue : "";
      }
    } catch (error) {
      console.log(error);
    }
  }

  getBooleanInputValue(item: any, column: FlexiGridColumnComponent, event: any,) {
    const value = event.target.checked;
    const field = column.field();
    if (!field.includes(".")) {
      item[field] = value;
    } else {
      const fields = field.split(".");
      if (fields.length === 2) {
        item[fields[0]][fields[1]] = value;
      }
    }

    column.onChange.emit(item);
  }

  openMobileFilter() {
    this.filterTr()!.nativeElement.classList.add("show");
    this.isShowMobileFilter.set(true);
    this.tbody()!.nativeElement.classList.add("hide");
  }

  closeMobileFilter() {
    this.filterTr()!.nativeElement.classList.remove("show");
    this.isShowMobileFilter.set(false);
    this.tbody()!.nativeElement.classList.remove("hide");
  }

  tdTemplateClassName(column: FlexiGridColumnComponent) {
    let className: string = column.className();

    if (className !== "") className += " ";
    className += column.hideOverflow() ? 'flexi-grid-text-overflow-hidden' : ''

    return className;
  }

  getTBodyStyle() {
    const style: { [key: string]: any } = {
      ...this.tbodyStyle()
    };
    return style;
  }

  trackByFn() {
    return 'id-' + (Date.now() * Math.random());
  }

  calculateColspan(): number {
    const columns = this.getColumns();
    const columnsCount = columns ? columns.length : 0;
    const indexCount = this.showIndex() ? 1 : 0;
    const commandCount = this.columnCommandTemplate() ? 1 : 0;
    const total = columnsCount + indexCount + commandCount;
    return total > 0 ? total : 1; // En az 1 olmasını sağlar
  }

  getSortState(column: string): string {
    if (this.state().sort.field === column) {
      return this.state().sort.dir === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  }

  getSortIcon(column: any): string {
    if (this.state().sort.field === column.field()) {
      return this.state().sort.dir === 'asc' ? '↑' : '↓';
    }
    return '';
  }

  async onExportExcelButtonClick() {
    const exportExcelButtonClick = this.exportExcelButtonClick();
    if (exportExcelButtonClick) {
      exportExcelButtonClick();
    } else {
      if (this.dataBinding() && this.dataBindingExportEndpoint()) {
        await this.fetchAllData();
      }
      this.exportExcel();
    }
  }

  async fetchAllData() {
    try {
      const response: any = await this.#http.get(this.dataBindingExportEndpoint()).toPromise();

      let fetchedData: any[] = [];

      const dataBindingExportPath = this.dataBindingExportPath();
      if (dataBindingExportPath) {
        // Kullanıcının belirttiği yolu kullanarak veriyi al
        fetchedData = this.getNestedProperty(response, dataBindingExportPath);
      } else if (Array.isArray(response)) {
        // Yanıt doğrudan bir dizi ise
        fetchedData = response;
      } else if (typeof response === 'object' && response.hasOwnProperty('data') && Array.isArray(response.data)) {
        // Yanıt bir nesne ve 'data' özelliği bir dizi ise
        fetchedData = response.data;
      }

      if (Array.isArray(fetchedData) && fetchedData.length > 0) {
        this.dataSignal.set(fetchedData);
      } else {
        console.error('Geçerli veri bulunamadı');
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  async exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sayfa1');

    const visibleColumns = this.getColumns()?.filter((column: any) => column.visible()) || [];

    // Başlıkları ekle
    worksheet.addRow(visibleColumns.map((col: any) => col.title() || col.field()));

    // Verileri ekle
    this.dataSignal().forEach(row => {
      const rowData = visibleColumns.map((col: any) => {
        return this.getFieldValue(row, col.field());
      });
      worksheet.addRow(rowData);
    });

    // Stil ayarları
    worksheet.getRow(1).font = { bold: true };
    visibleColumns.forEach((col: any, index: number) => {
      const column = worksheet.getColumn(index + 1);
      column.width = 15;
      const textAlign = col.textAlign();
      if (textAlign === 'right') {
        column.alignment = { horizontal: 'right' };
      } else if (textAlign === 'center') {
        column.alignment = { horizontal: 'center' };
      }
    });

    // Excel dosyasını oluştur ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${this.exportExcelFileName()}.xlsx`);
  }

  drop(event: CdkDragDrop<string[]>) {
    const currentData = this.getPagedData();

    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex < 0 || currentIndex < 0 ||
      previousIndex >= currentData.length ||
      currentIndex >= currentData.length) {
      console.warn('Invalid drag drop indices');
      return;
    }

    const previousData = currentData[previousIndex];
    const newPositionData = currentData[currentIndex];

    const reorderData: FlexiGridReorderModel = {
      previousIndex: previousIndex,
      currentIndex: currentIndex,
      previousData: previousData,
      currentData: newPositionData
    };

    this.onReorder.emit(reorderData);
  }

  toggleRowSelection(item: any) {
    if (!this.selectable()) return;

    if (this.selectedRows().has(item)) {
      this.selectedRows().delete(item);
    } else {
      this.selectedRows().add(item);
    }

    this.onSelected.emit([...this.selectedRows()]);
  }

  selectAll(): void {
    this.selectedRows().clear();
    if (this.dataBinding()) {
      this.pagedData().forEach((item) => {
        this.selectedRows().add(item);
      });

    } else {
      this.data().forEach((item) => {
        this.selectedRows().add(item);
      });
    }

    this.allSelected.set(true);
  }

  unselectAll(): void {
    this.selectedRows().clear();
    this.allSelected.set(false);
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.unselectAll();
    } else {
      this.selectAll();
    }

    this.onSelected.emit([...this.selectedRows()]);
  }

  allSelectedWasIndeterminate(): boolean {
    const totalItems = this.dataBinding() ? this.total() ?? this.data().length : this.data().length;
    const selectedItems = this.selectedRows().size;
    return selectedItems > 0 && selectedItems < totalItems;
  }

  checked(item: any) {
    const result = this.selectedRows().has(item);
    return result
  }

  clearSelected() {
    this.selectedRows().clear();
  }

  getMaxFooterTemplateCount() {
    let maxCount = 0;
    this.getColumns().forEach(column => {
      const templateCount = column.footerTemplates().length;
      if (templateCount > maxCount) {
        maxCount = templateCount;
      }
    });

    const numbers = Array(maxCount).fill(0).map((_, i) => i);

    return numbers;
  }

  getPagedData() {
    if (this.pagedData().length > 0) return this.pagedData();

    return this.prevData();
  }

  haveFilterValue(filterType?: FilterType) {
    if (filterType) {
      if (filterType === "boolean" || filterType === "date-time" || filterType === "select") return false;
      else return true;
    }
    return false;
  }

  setDropdownInputType(column: FlexiGridColumnComponent) {
    switch (column.filterType()) {
      case "text": return "search"
      case "number": return "search"
      case "date": return "date"
      case "date-time": return "datetime-local"
      default: return "search"
    }
  }

  setDropdownInputClass(column: FlexiGridColumnComponent) {
    switch (column.filterType()) {
      case "text": return "flexi-grid-filter-dropdown-input"
      case "number": return "flexi-grid-filter-dropdown-input"
      case "date": return "flexi-grid-filter-dropdown-date"
      case "date-time": return "flexi-grid-filter-dropdown-date"
      default: return "search"
    }
  }

  autoFitColumnWidth(column: FlexiGridColumnComponent) {
    const columnField = column.field();
    if (!columnField) return;

    const cells = Array.from(document.querySelectorAll(`td[data-label="${column.title() || column.field()}"]`));
    if (cells.length === 0) return;

    let maxContentWidth = 0;
    cells.forEach(cell => {
      const content = cell.textContent || '';
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.textContent = content;
      document.body.appendChild(tempSpan);
      maxContentWidth = Math.max(maxContentWidth, tempSpan.offsetWidth);
      document.body.removeChild(tempSpan);
    });

    column.widthSignal.set(`${maxContentWidth + 5}px`);
  }
}