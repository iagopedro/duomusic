import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [I18nService] });
    service = TestBed.inject(I18nService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('t() should return translated string', () => {
    expect(service.t('app.title')).toBe('MúsicaTeoria');
  });

  it('t() should interpolate params', () => {
    const result = service.t('home.level', { n: 5 });
    expect(result).toBe('Nível 5');
  });

  it('t() should return key when not found', () => {
    const result = service.t('nonexistent.key' as any);
    expect(result).toBe('nonexistent.key');
  });
});
