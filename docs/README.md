# Documentação Técnica — DuoMusic

Este diretório reúne a documentação técnica detalhada do projeto. Para uma visão conceitual, instalação, contribuição e tecnologias, consulte o [README principal](../README.md).

## Índice

| Documento | Descrição |
|-----------|-----------|
| [architecture.md](architecture.md) | Arquitetura da SPA e do backend, estrutura de pastas, rotas, guards e fluxo de autenticação |
| [data-models.md](data-models.md) | Interfaces TypeScript (`Module`, `Exercise`, `UserProgress`, `User`, `AuthTokens`) e modelos SQLAlchemy do backend |
| [modules-and-exercises.md](modules-and-exercises.md) | Progressão de módulos e tipos de exercício (ritmo, intervalo, acorde, nota, melodia) |
| [services.md](services.md) | `AuthService`, `ApiService`, `AudioService`, `ProgressService`, `StorageService`, `I18nService` e serviços do backend |
| [features-and-screens.md](features-and-screens.md) | Telas da aplicação (login, registro, onboarding, prática, conquistas, perfil) e fluxo de prática |
| [gamification.md](gamification.md) | XP, níveis, streak e conquistas |
| [i18n.md](i18n.md) | Sistema de internacionalização |
| [testing.md](testing.md) | Estratégia de testes unitários — frontend (Vitest) e backend (pytest) |
| [contributing.md](contributing.md) | Como adicionar exercícios, módulos, conquistas e telas |
| [commit-convention.md](commit-convention.md) | Convenção de commits semânticos do projeto |
| [auth-implementation-plan.md](auth-implementation-plan.md) | Plano de implementação do sistema de autenticação |
| [auth-test-matrix.md](auth-test-matrix.md) | Matriz de casos de teste da autenticação (checklist) |
