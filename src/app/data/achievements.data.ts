import { Achievement } from '../core/models';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-exercise',
    icon: '🎵',
    titleKey: 'Primeira nota',
    descriptionKey: 'Complete seu primeiro exercício.',
    condition: { type: 'exercises_done', value: 1 },
  },
  {
    id: 'ten-exercises',
    icon: '🎶',
    titleKey: 'Dez exercícios',
    descriptionKey: 'Complete 10 exercícios.',
    condition: { type: 'exercises_done', value: 10 },
  },
  {
    id: 'xp-100',
    icon: '⭐',
    titleKey: '100 XP',
    descriptionKey: 'Acumule 100 XP.',
    condition: { type: 'xp', value: 100 },
  },
  {
    id: 'xp-500',
    icon: '🌟',
    titleKey: '500 XP',
    descriptionKey: 'Acumule 500 XP.',
    condition: { type: 'xp', value: 500 },
  },
  {
    id: 'streak-3',
    icon: '🔥',
    titleKey: 'Em chamas',
    descriptionKey: 'Pratique 3 dias seguidos.',
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak-7',
    icon: '🚀',
    titleKey: 'Semana inteira',
    descriptionKey: 'Pratique 7 dias seguidos.',
    condition: { type: 'streak', value: 7 },
  },
  {
    id: 'fundamentals-done',
    icon: '🎸',
    titleKey: 'Fundamentos dominados',
    descriptionKey: 'Complete o módulo Fundamentos.',
    condition: { type: 'module_complete', value: 1, moduleId: 'fundamentals' },
  },
  {
    id: 'intervals-done',
    icon: '👂',
    titleKey: 'Ouvido afinado',
    descriptionKey: 'Complete o módulo Intervalos.',
    condition: { type: 'module_complete', value: 1, moduleId: 'intervals' },
  },
  {
    id: 'accuracy-80',
    icon: '🎯',
    titleKey: 'Precisão 80%',
    descriptionKey: 'Atinja 80% de acertos.',
    condition: { type: 'accuracy', value: 80 },
  },
];
