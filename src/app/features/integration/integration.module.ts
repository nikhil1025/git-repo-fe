import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { IntegrationPanelComponent } from './integration-panel/integration-panel.component';
import { IntegrationRoutingModule } from './integration-routing.module';

@NgModule({
  imports: [SharedModule, IntegrationRoutingModule, IntegrationPanelComponent],
})
export class IntegrationModule {}
