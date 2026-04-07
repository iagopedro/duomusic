import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key]; });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => { store = {}; });

    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  afterEach(() => vi.restoreAllMocks());

  // ── método get() ──────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get() should return fallback when key is absent', () => {
    expect(service.get('missing', 42)).toBe(42);
  });

  it('get() should return parsed value when key exists', () => {
    store['myKey'] = JSON.stringify({ a: 1 });
    expect(service.get('myKey', {})).toEqual({ a: 1 });
  });

  it('get() should return fallback when stored JSON is invalid', () => {
    store['bad'] = 'not-json{{{';
    expect(service.get('bad', 'default')).toBe('default');
  });

  it('get() should handle string values', () => {
    store['str'] = JSON.stringify('hello');
    expect(service.get<string>('str', '')).toBe('hello');
  });

  it('get() should handle boolean values', () => {
    store['flag'] = JSON.stringify(true);
    expect(service.get<boolean>('flag', false)).toBe(true);
  });

  // ── método set() ──────────────────────────────────────────────────────────

  it('set() should persist a JSON-serialised value', () => {
    service.set('key', { x: 99 });
    expect(store['key']).toBe(JSON.stringify({ x: 99 }));
  });

  it('set() should silently handle localStorage errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    expect(() => service.set('key', 'val')).not.toThrow();
  });

  // ── método remove() ────────────────────────────────────────────────────────

  it('remove() should delete the key', () => {
    store['toRemove'] = '"value"';
    service.remove('toRemove');
    expect(store['toRemove']).toBeUndefined();
  });

  // ── método clear() ─────────────────────────────────────────────────────────

  it('clear() should empty all keys', () => {
    store['a'] = '"1"';
    store['b'] = '"2"';
    service.clear();
    expect(Object.keys(store).length).toBe(0);
  });
});
