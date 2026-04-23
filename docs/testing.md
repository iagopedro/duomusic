# Testes Unitários

O DuoMusic possui **184 testes unitários** distribuídos em 13 arquivos, executando com **Vitest 4.1**.

## Executar os testes

```bash
npm test                  # executa uma vez
npm run test:coverage     # executa com relatório de cobertura
```

## Cobertura

| Arquivo de spec | Testes | O que cobre |
|-----------------|--------|-------------|
| `app.spec.ts` | 6 | Criação da aplicação, roteamento |
| `audio.service.spec.ts` | 14 | Síntese de som, volume, metrônomo |
| `progress.service.spec.ts` | 19 | XP, nível, streak, conquistas, módulos |
| `settings.service.spec.ts` | 12 | Persistência e alteração de preferências |
| `storage.service.spec.ts` | 10 | Leitura, escrita e remoção no localStorage |
| `onboarding.guard.spec.ts` | 4 | Redirecionamento de rotas |
| `i18n.service.spec.ts` | 9 | Tradução, interpolação, fallback |
| `xp-bar.component.spec.ts` | 5 | Barra de progresso visual |
| `primary-button.component.spec.ts` | 10 | Variantes, estados, evento de clique |
| `badge-chip.component.spec.ts` | 7 | Tags de conquista |
| `glass-panel.component.spec.ts` | 6 | Projeção de conteúdo |
| `module-card.component.spec.ts` | 12 | Card de módulo, bloqueio, clique |
| `practice.component.spec.ts` | 70 | Fluxo completo de prática, exploração livre, gravação e scoring de melodia |

## Convenções importantes

**Componentes OnPush** exigem `setInput()` para alterar entradas em testes:

```typescript
fixture.componentRef.setInput('label', 'novo valor');
fixture.detectChanges();
```

**Mock de construtores de classe** (Vitest v4) exige `function` keyword:

```typescript
(window as any).AudioContext = vi.fn().mockImplementation(function() {
  return mockCtx;
});
```
