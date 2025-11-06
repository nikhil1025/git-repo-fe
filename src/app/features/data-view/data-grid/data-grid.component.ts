import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GridApi, GridOptions } from 'ag-grid-community';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataRequest } from '../../../core/models/ag-grid';
import { GithubDataService } from '../../../core/services/github-data.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule],
})
export class DataGridComponent implements OnInit, OnDestroy {
  collections: string[] = [];
  selectedCollection: string = '';
  searchValue: string = '';
  rowData: any[] = [];
  columnDefs: any[] = [];
  gridApi!: GridApi;
  gridOptions: GridOptions;
  paginationPageSize = 100;
  cacheBlockSize = 100;
  selectedRows: any[] = [];
  totalRows = 0;
  currentPage = 1;
  detailRowData: { [key: string]: any } = {};
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private gridClickHandler: ((event: Event) => void) | null = null;

  constructor(
    private githubDataService: GithubDataService,
    private snackBar: MatSnackBar
  ) {
    this.gridOptions = {
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        sortable: true,
        resizable: true,
        floatingFilter: true,
      },
      enableRangeSelection: true,
      animateRows: true,
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      rowModelType: 'infinite',
      pagination: true,
      paginationPageSize: this.paginationPageSize,
      cacheBlockSize: this.cacheBlockSize,
      cacheOverflowSize: 2,
      maxConcurrentDatasourceRequests: 1,
      infiniteInitialRowCount: 1000,
      maxBlocksInCache: 10,
      onGridReady: (params) => this.onGridReady(params),
      onSelectionChanged: () => this.onSelectionChanged(),
      onPaginationChanged: () => this.onPaginationChanged(),
      onSortChanged: () => this.onSortChanged(),
      onFilterChanged: () => this.onFilterChanged(),
    };
  }

  ngOnInit(): void {
    this.loadCollections();

    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchValue) => {
        this.searchValue = searchValue;
        if (this.selectedCollection && this.gridApi) {
          // Refresh datasource with new search value
          this.refreshDatasource();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up event listener
    this.removePreviewButtonListener();
  }

  loadCollections(): void {
    // console.log('Loading collections...');
    this.githubDataService.getCollections().subscribe({
      next: (collections) => {
        // console.log('Collections loaded:', collections);
        this.collections = collections;
        if (collections.length === 0) {
          this.snackBar.open(
            'No collections found. Please sync data first.',
            'Close',
            {
              duration: 5000,
            }
          );
        }
      },
      error: (error) => {
        // console.error('Failed to load collections:', error);
        this.snackBar.open('Failed to load collections', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onCollectionChange(collection: string): void {
    // console.log('Collection changed to:', collection);
    this.selectedCollection = collection;
    this.searchValue = '';

    if (collection) {
      this.loadCollectionFields();
    } else {
      console.warn('No collection selected');
    }
  }

  loadCollectionFields(): void {
    // console.log('Loading fields for collection:', this.selectedCollection);
    this.githubDataService
      .getCollectionFields(this.selectedCollection)
      .subscribe({
        next: (fields) => {
          // console.log('Fields loaded:', fields);
          this.columnDefs = fields.map((field) => {
            const colDef: any = {
              field: field.field,
              headerName: this.formatHeaderName(field.field),
              filter: this.getFilterType(field.type),
              sortable: true,
              resizable: true,
            };

            if (
              field.type === 'Date' ||
              field.field.includes('_at') ||
              field.field.includes('Date')
            ) {
              colDef.valueFormatter = (params: any) => {
                return params.value
                  ? new Date(params.value).toLocaleString()
                  : '';
              };
            }

            // Handle nested objects
            if (field.field.includes('.')) {
              colDef.valueGetter = (params: any) => {
                return this.getNestedValue(params.data, field.field);
              };
            }

            // Handle arrays and objects - {Spread preview implemented}
            if (field.type === 'Array' || field.type === 'Object') {
              colDef.minWidth = 300;
              colDef.wrapText = false;
              colDef.autoHeight = false;
              colDef.cellRenderer = (params: any) => {
                const value = params.value;
                if (!value) return '';

                const container = document.createElement('div');
                container.style.cssText =
                  'display: flex; align-items: center; gap: 8px; padding: 4px 0;';

                const previewText = document.createElement('div');
                previewText.style.cssText =
                  'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #333;';

                let displayText = '';
                if (Array.isArray(value)) {
                  if (value.length === 0) {
                    displayText = '[]';
                  } else if (value.length <= 3) {
                    displayText = JSON.stringify(value);
                  } else {
                    const preview = value.slice(0, 3).map((item) => {
                      if (typeof item === 'object') {
                        return JSON.stringify(item);
                      }
                      return item;
                    });
                    displayText = `[${preview.join(', ')}, ... +${value.length - 3} more]`;
                  }
                } else if (typeof value === 'object') {
                  const keys = Object.keys(value);
                  if (keys.length === 0) {
                    displayText = '{}';
                  } else if (keys.length <= 3) {
                    displayText = JSON.stringify(value);
                  } else {
                    const preview = keys.slice(0, 3).map(key => `${key}: ${JSON.stringify(value[key])}`);
                    displayText = `{${preview.join(', ')}, ... +${keys.length - 3} more}`;
                  }
                }

                previewText.textContent = displayText;
                previewText.title = displayText; // Tooltip for hover

                const button = document.createElement('button');
                button.className = 'preview-btn';
                button.style.cssText =
                  'padding: 2px 6px; border: 1px solid #ffffff; background: #ffffff; color: white; border-radius: 3px; cursor: pointer; font-size: 11px; white-space: nowrap;';

                button.setAttribute('data-field-name', field.field);
                button.setAttribute('data-field-type', field.type || 'unknown');
                button.setAttribute(
                  'data-preview-value',
                  JSON.stringify(value)
                );

                if (Array.isArray(value)) {
                  button.innerHTML = ``;
                } else if (typeof value === 'object') {
                  const keys = Object.keys(value).length;
                  button.innerHTML = ``;
                }

                container.appendChild(previewText);
                container.appendChild(button);
                return container;
              };
            }

            return colDef;
          });

          if (this.gridApi) {
            // console.log(
            //   'Setting grid options with',
            //   this.columnDefs.length,
            //   'columns'
            // );
            this.gridApi.setGridOption('columnDefs', this.columnDefs);

            this.setupPreviewButtonListener();

            // Set up infinite datasource for server-side pagination (avoiding event clogging)
            this.setupInfiniteDatasource();
          } else {
            console.warn('Grid API not ready yet');
          }
        },
        error: (error) => {
          // console.error('Failed to load collection fields:', error);
          this.snackBar.open('Failed to load collection fields', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  setupInfiniteDatasource(): void {
    const datasource = {
      rowCount: undefined as number | undefined,
      getRows: (params: any) => {
        // console.log('Fetching rows from', params.startRow, 'to', params.endRow);

        const page = Math.floor(params.startRow / this.paginationPageSize) + 1;
        const pageSize = this.paginationPageSize;

        // Extract sort model from AG-Grid
        const sortModel = params.sortModel.map((sort: any) => ({
          colId: sort.colId,
          sort: sort.sort,
        }));

        // Extract filter model from AG-Grid
        // For infinite row model, we need to get filter model from grid API
        const filterModel = this.gridApi
          ? this.gridApi.getFilterModel()
          : params.filterModel || {};

        const request: DataRequest = {
          page: page,
          pageSize: pageSize,
          sortModel: sortModel,
          filterModel: filterModel,
          searchValue: this.searchValue || undefined,
        };

        // console.log('=== API Request Details ===');
        // console.log('Page:', page, 'PageSize:', pageSize);
        // console.log('Sort Model:', sortModel);
        // console.log('Filter Model:', filterModel);
        // console.log('Search Value:', this.searchValue);
        // console.log('Full Request:', request);

        this.githubDataService
          .getCollectionData(this.selectedCollection, request)
          .subscribe({
            next: (response) => {
              console.log('Data received:', response);
              this.totalRows = response.total;

              // Calculate last row
              let lastRow = -1;
              if (response.data.length < pageSize) {
                lastRow = params.startRow + response.data.length;
              } else if (response.total) {
                lastRow = response.total;
              }

              // Pass data back to grid
              params.successCallback(response.data, lastRow);
            },
            error: (error) => {
              console.error('Failed to load data:', error);
              this.snackBar.open('Failed to load data', 'Close', {
                duration: 3000,
              });
              params.failCallback();
            },
          });
      },
    };

    this.gridApi.setGridOption('datasource', datasource);
  }

  refreshDatasource(): void {
    if (this.gridApi && this.selectedCollection) {
      // console.log('Refreshing datasource with new filters/search');
      // re-setup the datasource to trigger fresh API calls
      this.setupInfiniteDatasource();
    }
  }

  setupPreviewButtonListener(): void {
    // remove existing listener if any
    this.removePreviewButtonListener();

    const gridElement = document.querySelector('.ag-theme-material');
    if (!gridElement) {
      // console.warn('Grid element not found for event delegation');
      return;
    }

    // Create event handler using event delegation (single listener for all buttons)
    this.gridClickHandler = (event: Event) => {
      const target = event.target as HTMLElement;

      // Check if clicked element or its parent is a preview button
      const button = target.classList.contains('preview-btn')
        ? target
        : (target.closest('.preview-btn') as HTMLElement);

      if (button) {
        event.stopPropagation();

        // Get data from attributes
        const fieldName = button.getAttribute('data-field-name');
        const valueStr = button.getAttribute('data-preview-value');

        if (fieldName && valueStr) {
          try {
            const value = JSON.parse(valueStr);
            this.showPreviewDialog(fieldName, value);
          } catch (error) {
            // console.error('Error parsing preview value:', error);
            this.snackBar.open('Error displaying preview', 'Close', {
              duration: 3000,
            });
          }
        }
      }
    };

    // Add single listener to grid container
    gridElement.addEventListener('click', this.gridClickHandler);
    // console.log('Event delegation listener added for preview buttons');
  }

  removePreviewButtonListener(): void {
    if (this.gridClickHandler) {
      const gridElement = document.querySelector('.ag-theme-material');
      if (gridElement) {
        gridElement.removeEventListener('click', this.gridClickHandler);
        // console.log('Event delegation listener removed');
      }
      this.gridClickHandler = null;
    }
  }

  showPreviewDialog(fieldName: string, data: any): void {
    const formattedName = this.formatHeaderName(fieldName);
    const jsonString = JSON.stringify(data, null, 2);

    alert(`${formattedName}:\n\n${jsonString}`);
  }

  private formatHeaderName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/\./g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  private getFilterType(type?: string): string {
    if (type === 'Number') return 'agNumberColumnFilter';
    if (type === 'Date') return 'agDateColumnFilter';
    return 'agTextColumnFilter';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;

    if (this.selectedCollection && this.columnDefs.length > 0) {
      this.setupInfiniteDatasource();
    }
  }

  onPaginationChanged(): void {
    if (this.gridApi) {
      const currentPage = this.gridApi.paginationGetCurrentPage();
      const newPageSize = this.gridApi.paginationGetPageSize();

      // Check if page size changed
      if (newPageSize !== this.paginationPageSize) {
        // console.log(
        //   'Page size changed from',
        //   this.paginationPageSize,
        //   'to',
        //   newPageSize
        // );
        this.paginationPageSize = newPageSize;
        this.cacheBlockSize = newPageSize;

        // Update grid options with new cache block size
        this.gridApi.setGridOption('cacheBlockSize', this.cacheBlockSize);

        // Refresh datasource to reload with new page size
        this.refreshDatasource();
      } else {
        console.log('Pagination changed to page:', currentPage + 1);
      }
    }
  }

  onSortChanged(): void {
    if (this.gridApi) {
      const sortModel = this.gridApi
        .getColumnState()
        .filter((col: any) => col.sort)
        .map((col: any) => ({ colId: col.colId, sort: col.sort }));
      // console.log('Sort changed:', sortModel);
      // console.log('Refreshing datasource with new sort');
      this.refreshDatasource();
    }
  }

  onFilterChanged(): void {
    if (this.gridApi) {
      const filterModel = this.gridApi.getFilterModel();
      // console.log('Filter changed:', filterModel);
      // console.log('Refreshing datasource with new filters');
      this.refreshDatasource();
    }
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onSelectionChanged(): void {
    if (this.gridApi) {
      this.selectedRows = this.gridApi.getSelectedRows();
    }
  }

  clearSelection(): void {
    if (this.gridApi) {
      this.gridApi.deselectAll();
      this.selectedRows = [];
    }
  }

  exportToCsv(): void {
    if (this.gridApi && this.selectedCollection) {
      this.gridApi.exportDataAsCsv({
        fileName: `${this.selectedCollection}_${new Date().getTime()}.csv`,
        allColumns: true,
      });
    }
  }
}
