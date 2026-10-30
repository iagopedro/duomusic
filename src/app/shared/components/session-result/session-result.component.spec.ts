import { TestBed } from '@angular/core/testing';
import { SessionResultComponent } from './session-result.component';

describe('SessionResultComponent', () => {
  it('shows real session metrics, earned stars and an explicit continuation', async () => {
    await TestBed.configureTestingModule({ imports: [SessionResultComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SessionResultComponent);
    for (const [name, value] of Object.entries({
      accuracy: 75,
      xp: 35,
      mastered: 4,
      total: 4,
      combo: 3,
      stars: 2,
    })) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('.earned')).toHaveLength(2);
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('2 de 3 estrelas');
    expect(host.textContent).toContain('75%');
    expect(host.textContent).toContain('4 de 4 desafios dominados');
    const continued = vi.fn();
    fixture.componentInstance.continued.subscribe(continued);
    host.querySelector<HTMLButtonElement>('button')!.click();
    expect(continued).toHaveBeenCalledOnce();
    expect(host.querySelector('h2')?.getAttribute('tabindex')).toBe('-1');
  });
});
