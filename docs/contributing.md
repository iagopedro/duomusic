# Guia de Contribuição

Este guia descreve como estender o DuoMusic com novos conteúdos pedagógicos ou funcionalidades.

## Fluxo geral

1. Crie uma branch a partir da `main`
2. Faça suas alterações seguindo as convenções abaixo
3. Garanta que todos os testes passam (`npm test`)
4. Abra um Pull Request descrevendo o impacto

## Convenções

- **Código:** TypeScript estrito, componentes standalone, `ChangeDetectionStrategy.OnPush`
- **Estilos:** SCSS com padrão BEM; usar variáveis CSS do tema global em `src/styles.scss`
- **Commits:** mensagens claras e descritivas
- **Testes:** toda lógica nova deve ter cobertura de teste

## Adicionando conteúdo educacional

### Novo exercício

1. Defina o exercício em `src/app/data/exercises.data.ts`
2. Registre o ID no módulo em `src/app/data/modules.data.ts`
3. Adicione strings i18n se necessário em `src/app/core/i18n/pt-br.ts`
4. Atualize o spec do `PracticeComponent`

### Novo módulo

1. Adicione o tipo em `ModuleId` em `src/app/core/models/index.ts`
2. Registre o módulo em `src/app/data/modules.data.ts` com `requiredModuleId` e `minXpToUnlock`
3. Adicione a chave de nome em `pt-br.ts`

### Nova conquista

Em `src/app/data/achievements.data.ts`:

```typescript
{
  id: 'streak-30',
  icon: '👑',
  titleKey: 'Um mês praticando',
  descriptionKey: 'Pratique 30 dias seguidos.',
  condition: { type: 'streak', value: 30 },
}
```

O `ProgressService` verificará automaticamente essa condição após cada exercício.

## Adicionando uma nova tela

1. Crie a pasta em `src/app/features/nome-da-tela/`
2. Gere o componente, rotas e arquivo de spec
3. Registre a rota em `src/app/app.routes.ts` com lazy loading:

```typescript
{
  path: 'nome-da-tela',
  canActivate: [requireOnboardingGuard],
  loadChildren: () =>
    import('./features/nome-da-tela/nome-da-tela.routes').then(m => m.ROUTES),
}
```

## Referências úteis

- [Arquitetura](architecture.md)
- [Modelos de dados](data-models.md)
- [Serviços principais](services.md)
- [Testes](testing.md)
