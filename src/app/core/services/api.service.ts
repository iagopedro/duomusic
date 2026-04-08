import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Module, Exercise, Achievement } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private readonly _modules = signal<Module[]>([]);
  private readonly _exercises = signal<Exercise[]>([]);
  private readonly _achievements = signal<Achievement[]>([]);

  readonly modules = this._modules.asReadonly();
  readonly exercises = this._exercises.asReadonly();
  readonly achievements = this._achievements.asReadonly();

  /** Carrega todos os dados do backend. Chamado no APP_INITIALIZER. */
  async initialize(): Promise<void> {
    const [modules, exercises, achievements] = await Promise.all([
      firstValueFrom(this.http.get<Module[]>(`${environment.apiUrl}/modules`)),
      firstValueFrom(this.http.get<Exercise[]>(`${environment.apiUrl}/exercises`)),
      firstValueFrom(this.http.get<Achievement[]>(`${environment.apiUrl}/achievements`)),
    ]);
    this._modules.set(modules);
    this._exercises.set(exercises);
    this._achievements.set(achievements);
  }

  /** Retorna exercícios de um módulo específico, na ordem definida pelo módulo. */
  getExercisesForModule(moduleId: string): Exercise[] {
    const mod = this._modules().find(m => m.id === moduleId);
    if (!mod) return [];
    return this._exercises().filter(e => mod.exerciseIds.includes(e.id));
  }
}
