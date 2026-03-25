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

  it('t() should return the translated string for a known key', () => {
    expect(service.t('app.title')).toBe('MúsicaTeoria');
  });

  it('t() should interpolate numeric param', () => {
    expect(service.t('home.level', { n: 5 })).toBe('Nível 5');
  });

  it('t() should interpolate string param', () => {
    expect(service.t('home.xp', { xp: '150' })).toBe('150 XP');
  });

  it('t() should interpolate multiple params', () => {
    expect(service.t('practice.exercise.of', { n: 2, total: 5 })).toBe('Exercício 2 de 5');
  });

  it('t() should return the key itself when translation is not found', () => {
    expect(service.t('nonexistent.key' as any)).toBe('nonexistent.key');
  });

  it('tStr() should work with runtime string keys', () => {
    expect(service.tStr('chord.major')).toBe('Maior');
    expect(service.tStr('chord.minor')).toBe('Menor');
    expect(service.tStr('chord.dim')).toBe('Diminuto');
    expect(service.tStr('chord.aug')).toBe('Aumentado');
  });

  it('tStr() should return key for unknown runtime key', () => {
    expect(service.tStr('unknown.key')).toBe('unknown.key');
  });

  it('should translate all interval names correctly', () => {
    const cases: [string, string][] = [
      ['interval.unison', 'Uníssono'],
      ['interval.minor2', '2ª menor'],
      ['interval.major3', '3ª maior'],
      ['interval.perfect5', '5ª justa'],
      ['interval.octave', 'Oitava'],
    ];
    for (const [key, expected] of cases) {
      expect(service.tStr(key)).toBe(expected);
    }
  });
});
