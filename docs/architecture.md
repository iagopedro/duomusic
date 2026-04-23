# Arquitetura

O DuoMusic é uma **Single Page Application (SPA)** com roteamento lazy-loaded. Cada feature é um módulo independente carregado apenas quando necessário.

## Visão geral

```
Browser
  └── Angular App (standalone, sem NgModules tradicionais)
        ├── Router (lazy loading por feature)
        ├── Core (serviços singleton injetados globalmente)
        ├── Features (telas da aplicação)
        └── Shared (componentes reutilizáveis)
```

## Fluxo de navegação

```
/ (raiz)
  └── /onboarding  ← primeira visita (guard: onboardingGuard)
  └── /home        ← tela principal  (guard: requireOnboardingGuard)
  └── /practice/:moduleId  ← sessão de prática
  └── /achievements        ← conquistas
  └── /profile             ← perfil e configurações
```

## Guards de rota

Dois guards controlam o acesso:

- **`onboardingGuard`** — redireciona para `/home` se o onboarding já foi concluído (evita repetição)
- **`requireOnboardingGuard`** — redireciona para `/onboarding` se o usuário ainda não completou a introdução

## Estrutura de pastas

```
src/
├── app/
│   ├── app.config.ts          # Bootstrap da aplicação (providers globais)
│   ├── app.routes.ts          # Definição de todas as rotas
│   ├── app.ts                 # Componente raiz
│   │
│   ├── core/                  # Camada de infraestrutura (serviços, modelos, guards)
│   │   ├── guards/
│   │   │   └── onboarding.guard.ts
│   │   ├── i18n/
│   │   │   ├── i18n.service.ts    # Serviço de tradução
│   │   │   └── pt-br.ts           # Dicionário em português
│   │   ├── models/
│   │   │   └── index.ts           # Todas as interfaces TypeScript
│   │   ├── services/
│   │   │   ├── audio.service.ts   # Síntese de áudio (Web Audio API)
│   │   │   ├── progress.service.ts # Progresso, XP, conquistas
│   │   │   └── settings.service.ts # Preferências do usuário
│   │   └── storage/
│   │       └── storage.service.ts  # Abstração do localStorage
│   │
│   ├── data/                  # Dados estáticos do conteúdo educacional
│   │   ├── achievements.data.ts
│   │   ├── exercises.data.ts
│   │   └── modules.data.ts
│   │
│   ├── features/              # Telas da aplicação (cada uma lazy-loaded)
│   │   ├── achievements/
│   │   ├── home/
│   │   ├── onboarding/
│   │   ├── practice/
│   │   └── profile/
│   │
│   └── shared/                # Componentes reutilizáveis
│       └── components/
│           ├── badge-chip/        # Tag de conquista
│           ├── glass-panel/       # Card com visual de vidro fosco
│           ├── module-card/       # Card de módulo na home
│           ├── piano-keyboard/    # Teclado de piano interativo (C4–C5)
│           ├── piano-tutorial/    # Overlay de mapeamento de teclas
│           ├── primary-button/    # Botão principal da UI
│           └── xp-bar/            # Barra de progresso de XP
│
└── styles.scss                # Tema global, variáveis CSS
```
