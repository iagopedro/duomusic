import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const mockModules = [
    {
      id: 'fundamentals', nameKey: 'mod.fund', description: '', icon: '🎵',
      color: '#000', order: 1, minXpToUnlock: 0, exerciseIds: ['e1', 'e2'],
    },
    {
      id: 'intervals', nameKey: 'mod.int', description: '', icon: '🎶',
      color: '#111', order: 2, requiredModuleId: 'fundamentals', minXpToUnlock: 50,
      exerciseIds: ['e3'],
    },
  ];

  const mockExercises = [
    { id: 'e1', moduleId: 'fundamentals', type: 'rhythm', difficulty: 1, xpReward: 10,
      conceptKey: '', questionKey: '', bpm: 90, pattern: ['quarter'], toleranceMs: 200 },
    { id: 'e2', moduleId: 'fundamentals', type: 'rhythm', difficulty: 1, xpReward: 10,
      conceptKey: '', questionKey: '', bpm: 90, pattern: ['quarter'], toleranceMs: 200 },
    { id: 'e3', moduleId: 'intervals', type: 'interval', difficulty: 1, xpReward: 15,
      conceptKey: '', questionKey: '', rootFreq: 261.63, semitones: 4, options: [3, 4, 5, 7] },
  ];

  const mockAchievements = [
    { id: 'a1', icon: '🏅', titleKey: 'ach.1', descriptionKey: 'ach.1.d',
      condition: { type: 'xp', value: 100 } },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('signals should start empty', () => {
    expect(service.modules()).toEqual([]);
    expect(service.exercises()).toEqual([]);
    expect(service.achievements()).toEqual([]);
    expect(service.backendOffline()).toBe(false);
  });

  describe('initialize()', () => {
    it('should load modules, exercises and achievements from backend', async () => {
      const promise = service.initialize();

      httpMock.expectOne(`${environment.apiUrl}/modules`).flush(mockModules);
      httpMock.expectOne(`${environment.apiUrl}/exercises`).flush(mockExercises);
      httpMock.expectOne(`${environment.apiUrl}/achievements`).flush(mockAchievements);

      await promise;

      expect(service.modules().length).toBe(2);
      expect(service.exercises().length).toBe(3);
      expect(service.achievements().length).toBe(1);
      expect(service.backendOffline()).toBe(false);
    });

    it('should set backendOffline=true when request fails', async () => {
      const promise = service.initialize();

      httpMock.expectOne(`${environment.apiUrl}/modules`).error(new ProgressEvent('error'));
      httpMock.expectOne(`${environment.apiUrl}/exercises`).error(new ProgressEvent('error'));
      httpMock.expectOne(`${environment.apiUrl}/achievements`).error(new ProgressEvent('error'));

      await promise;

      expect(service.backendOffline()).toBe(true);
    });
  });

  describe('getExercisesForModule()', () => {
    it('should return exercises for the given module', async () => {
      const promise = service.initialize();
      httpMock.expectOne(`${environment.apiUrl}/modules`).flush(mockModules);
      httpMock.expectOne(`${environment.apiUrl}/exercises`).flush(mockExercises);
      httpMock.expectOne(`${environment.apiUrl}/achievements`).flush(mockAchievements);
      await promise;

      const result = service.getExercisesForModule('fundamentals');
      expect(result.length).toBe(2);
      expect(result.every(e => e.moduleId === 'fundamentals')).toBe(true);
    });

    it('should return empty array for unknown module', async () => {
      const promise = service.initialize();
      httpMock.expectOne(`${environment.apiUrl}/modules`).flush(mockModules);
      httpMock.expectOne(`${environment.apiUrl}/exercises`).flush(mockExercises);
      httpMock.expectOne(`${environment.apiUrl}/achievements`).flush(mockAchievements);
      await promise;

      expect(service.getExercisesForModule('nonexistent')).toEqual([]);
    });
  });
});
