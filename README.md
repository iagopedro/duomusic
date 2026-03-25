# DuoMusic — Frontend MVP Prototype

A **mobile-first music theory learning system** built with Angular 21, Angular Material, and the Web Audio API.

## Purpose

- Ear training: intervals, chord qualities, rhythmic patterns
- Immediate feedback with explanations + retry
- Gamification: XP, levels, streak, daily missions, achievements, module unlocking
- No backend — `localStorage` + Web Audio API only

## How to Run

```bash
npm install
ng serve
# open http://localhost:4200
```

Tests: `ng test` · Build: `ng build --configuration production`

## Language Rule

| Layer | Language |
|---|---|
| Source code (files, vars, functions, comments) | **English** |
| User-visible UI (labels, buttons, ARIA) | **Portuguese (pt-BR)** |

Strings centralised in `src/app/core/i18n/pt-br.ts` — components use `I18nService.t('key')`.

## Architecture

```
src/app/
├── core/        guards · i18n · models · services · storage
├── data/        modules · exercises · achievements seed data
├── shared/      glass-panel · primary-button · module-card · xp-bar · badge-chip
└── features/    onboarding · home · practice · achievements · profile
```

- Angular 21 standalone components, all with `ChangeDetectionStrategy.OnPush`
- Angular Signals (`signal`, `computed`) for reactive state
- Lazy-loaded feature routes
- Glassmorphism SCSS theme (green primary, dark/light via CSS custom properties)
- Web Audio API: `AudioService.playTone/playInterval/playChord/playMetronomeTick`
- `ProgressService`: XP, levels, streak, achievement checks, module unlocking
- `SettingsService`: volume, dark theme, reduce-motion (persisted + DOM side effects)

## Modules & Gamification

| Module | Prerequisite | Min XP |
|---|---|---|
| Fundamentos | — | 0 |
| Intervalos | Fundamentos | 50 |
| Escalas | Intervalos | 150 |
| Acordes | Escalas | 300 |
| Treino misto | Acordes | 500 |

100 XP = level up. Streak resets if a day is missed.

## Next Steps (Post-MVP)

1. More exercise types (scales, melodic dictation)
2. Backend + auth, cloud sync
3. PWA (service worker, offline)
4. WebMIDI API for instrument input
5. Spaced repetition (SM-2)
6. Additional locales (I18nService is extensible)
7. Adaptive difficulty
8. SVG sheet-music renderer

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
