import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassPanelComponent } from './glass-panel.component';
import { Component } from '@angular/core';

@Component({
  imports: [GlassPanelComponent],
  template: `<app-glass-panel><span class="inner">content</span></app-glass-panel>`,
})
class HostComponent {}

describe('GlassPanelComponent', () => {
  let fixture: ComponentFixture<GlassPanelComponent>;
  let component: GlassPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlassPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GlassPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the glass-panel wrapper', () => {
    const el = fixture.nativeElement.querySelector('.glass-panel');
    expect(el).toBeTruthy();
  });

  it('should apply custom padding style', () => {
    fixture.componentRef.setInput('padding', '2rem');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.glass-panel') as HTMLElement;
    expect(el.style.padding).toBe('2rem');
  });

  it('should apply custom panelClass', () => {
    fixture.componentRef.setInput('panelClass', 'my-custom-class');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.glass-panel');
    expect(el.classList.contains('my-custom-class')).toBe(true);
  });

  it('should default padding to 1.25rem', () => {
    expect(component.padding).toBe('1.25rem');
  });

  it('should project slotted content via ng-content', async () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const inner = hostFixture.nativeElement.querySelector('.inner');
    expect(inner).toBeTruthy();
    expect(inner.textContent).toContain('content');
  });
});
