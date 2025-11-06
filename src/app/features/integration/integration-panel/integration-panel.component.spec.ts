import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationPanelComponent } from './integration-panel.component';

describe('IntegrationPanelComponent', () => {
  let component: IntegrationPanelComponent;
  let fixture: ComponentFixture<IntegrationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntegrationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
