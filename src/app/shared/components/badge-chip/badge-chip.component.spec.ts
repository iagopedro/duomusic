import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeChipComponent } from './badge-chip.component';
import { Achievement } from '../../../core/models';

const mockAchievement: Achievement = {
  id: 'first-exercise',
  icon: '🎵',
  titleKey: 'Primeira nota',
  descriptionKey: 'Complete seu primeiro exercício.',
  condition: { type: 'exercises_done', value: 1 },
};

describe('BadgeChipComponent', () => {
  let fixture: ComponentFixture<BadgeChipComponent>;
  let component: BadgeChipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeChipComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BadgeChipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('achievement', mockAchievement);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the achievement icon', () => {
    const icon = fixture.nativeElement.querySelector('.badge-chip__icon');
    expect(icon.textContent).toContain('🎵');
  });

  it('should display the achievement title', () => {
    const name = fixture.nativeElement.querySelector('.badge-chip__name');
    expect(name.textContent).toContain('Primeira nota');
  });

  it('should add locked class when locked=true', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.badge-chip');
    expect(chip.classList.contains('badge-chip--locked')).toBe(true);
  });

  it('should NOT have locked class when locked=false', () => {
    fixture.componentRef.setInput('locked', false);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.badge-chip');
    expect(chip.classList.contains('badge-chip--locked')).toBe(false);
  });

  it('should show "conquistado" in aria-label when unlocked', () => {
    fixture.componentRef.setInput('locked', false);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.badge-chip');
    expect(chip.getAttribute('aria-label')).toContain('conquistado');
  });

  it('should show "bloqueado" in aria-label when locked', () => {
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.badge-chip');
    expect(chip.getAttribute('aria-label')).toContain('bloqueado');
  });
});
