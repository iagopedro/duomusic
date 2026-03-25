import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XpBarComponent } from './xp-bar.component';

describe('XpBarComponent', () => {
  let fixture: ComponentFixture<XpBarComponent>;
  let component: XpBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XpBarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(XpBarComponent);
    component = fixture.componentInstance;
  });

  it('should render', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('percentage should be 50 when current=50, max=100', () => {
    component.current = 50;
    component.max = 100;
    expect(component.percentage).toBe(50);
  });

  it('percentage should cap at 100', () => {
    component.current = 200;
    component.max = 100;
    expect(component.percentage).toBe(100);
  });

  it('percentage should be 0 when max is 0', () => {
    component.current = 50;
    component.max = 0;
    expect(component.percentage).toBe(0);
  });

  it('should have correct ARIA attributes', () => {
    component.current = 30;
    component.max = 100;
    component.ariaLabel = 'XP Progress';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(el.getAttribute('aria-valuenow')).toBe('30');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
  });
});
