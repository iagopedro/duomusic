import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PrimaryButtonComponent } from './primary-button.component';

describe('PrimaryButtonComponent', () => {
  let fixture: ComponentFixture<PrimaryButtonComponent>;
  let component: PrimaryButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryButtonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PrimaryButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Valores padrão ──────────────────────────────────────────────────────────

  it('should default to primary variant', () => {
    expect(component.variant()).toBe('primary');
  });

  it('should default to md size', () => {
    expect(component.size()).toBe('md');
  });

  it('should default to enabled', () => {
    expect(component.disabled()).toBe(false);
  });

  // ── Entradas (inputs) ───────────────────────────────────────────────────────

  it('should apply secondary variant', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('primary-btn--secondary')).toBe(true);
  });

  it('should apply lg size', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('primary-btn--lg')).toBe(true);
  });

  it('should disable the native button when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('should set aria-label on the button when provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Confirmar resposta');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Confirmar resposta');
  });

  // ── Eventos ──────────────────────────────────────────────────────────────────

  it('should emit clicked when the button is clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    fixture.nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should NOT emit clicked when disabled', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(spy).not.toHaveBeenCalled();
  });
});
