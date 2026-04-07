import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuleCardComponent } from './module-card.component';
import { Module } from '../../../core/models';

const mockModule: Module = {
  id: 'fundamentals',
  nameKey: 'module.fundamentals',
  description: 'Notas, ritmo básico e leitura de padrões.',
  icon: 'music_note',
  color: '#22c55e',
  order: 0,
  minXpToUnlock: 0,
  exerciseIds: ['r-1', 'r-2', 'r-3'],
};

describe('ModuleCardComponent', () => {
  let fixture: ComponentFixture<ModuleCardComponent>;
  let component: ModuleCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ModuleCardComponent);
    component = fixture.componentInstance;
    component.module = mockModule;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Nome e descrição ──────────────────────────────────────────────────────

  it('should display the translated module name', () => {
    const name = fixture.nativeElement.querySelector('.module-card__name');
    expect(name.textContent).toContain('Fundamentos');
  });

  it('should display the module description', () => {
    const desc = fixture.nativeElement.querySelector('.module-card__desc');
    expect(desc.textContent).toContain('Notas, ritmo básico');
  });

  // ── Estado bloqueado ────────────────────────────────────────────────────────

  it('should add locked CSS class when locked=true', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.module-card');
    expect(card.classList.contains('module-card--locked')).toBe(true);
  });

  it('should show locked label when locked=true', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.module-card__status');
    expect(status.textContent).toContain('Bloqueado');
  });

  it('ariaLabel should contain "Bloqueado" when locked', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    expect(component.ariaLabel).toContain('Bloqueado');
  });

  it('should NOT emit cardClicked when locked and clicked', () => {
    const spy = vi.fn();
    component.cardClicked.subscribe(spy);
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.module-card').click();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Estado concluído ────────────────────────────────────────────────────────

  it('should add completed CSS class when completed=true', () => {
    fixture.componentRef.setInput('completed', true);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.module-card');
    expect(card.classList.contains('module-card--completed')).toBe(true);
  });

  it('ariaLabel should contain "Concluído" when completed', () => {
    fixture.componentRef.setInput('completed', true);
    fixture.detectChanges();
    expect(component.ariaLabel).toContain('Concluído');
  });

  // ── Estado disponível ───────────────────────────────────────────────────────

  it('ariaLabel should contain "Disponível" when not locked and not completed', () => {
    fixture.componentRef.setInput('locked', false);
    fixture.componentRef.setInput('completed', false);
    fixture.detectChanges();
    expect(component.ariaLabel).toContain('Disponível');
  });

  it('should emit cardClicked with module when clicked and not locked', () => {
    const spy = vi.fn();
    component.cardClicked.subscribe(spy);
    fixture.componentRef.setInput('locked', false);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.module-card').click();
    expect(spy).toHaveBeenCalledWith(mockModule);
  });

  it('moduleName() should return translated name', () => {
    expect(component.moduleName()).toBe('Fundamentos');
  });
});
