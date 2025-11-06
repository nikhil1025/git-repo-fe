import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DataGridComponent } from './data-grid/data-grid.component';
import { DataViewRoutingModule } from './data-view-routing.module';

@NgModule({
  imports: [SharedModule, DataViewRoutingModule, DataGridComponent],
})
export class DataViewModule {}
