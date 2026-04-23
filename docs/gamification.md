# Sistema de Progresso e Gamificação

## XP e Níveis

| Ação | XP ganho |
|------|----------|
| Exercício de ritmo/intervalo (fácil) | 10–15 XP |
| Exercício de intervalo/acorde (médio) | 20 XP |
| Exercício difícil | 25 XP |
| Missão diária — 5 exercícios | 30 XP |
| Missão diária — manter streak | 20 XP |

> Exercícios errados ganham **0 XP**.

A cada **100 XP** o aluno avança um nível:

```
nível = Math.floor(xpTotal / 100) + 1
```

## Streak (Sequência)

Aumenta +1 a cada dia com pelo menos 1 exercício. Se o aluno pular um dia, o streak é **zerado**. A verificação ocorre ao abrir o app.

## Conquistas

| ID | Ícone | Condição |
|----|-------|----------|
| `first-exercise` | 🎵 | 1 exercício feito |
| `ten-exercises` | 🎶 | 10 exercícios feitos |
| `xp-100` | ⭐ | 100 XP acumulados |
| `xp-500` | 🌟 | 500 XP acumulados |
| `streak-3` | 🔥 | 3 dias seguidos |
| `streak-7` | 🚀 | 7 dias seguidos |
| `fundamentals-done` | 🎸 | Módulo Fundamentos concluído |
| `intervals-done` | 👂 | Módulo Intervalos concluído |
| `accuracy-80` | 🎯 | Precisão ≥ 80% |
