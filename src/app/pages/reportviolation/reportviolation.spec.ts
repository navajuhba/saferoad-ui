import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reportviolation } from './reportviolation';

describe('Reportviolation', () => {
  let component: Reportviolation;
  let fixture: ComponentFixture<Reportviolation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reportviolation],
    }).compileComponents();

    fixture = TestBed.createComponent(Reportviolation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
