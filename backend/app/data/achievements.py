from ..models.achievement import Achievement, AchievementCondition

ACHIEVEMENTS: list[Achievement] = [
    Achievement(
        id="first-exercise", icon="🎵",
        title_key="Primeira nota",
        description_key="Complete seu primeiro exercício.",
        condition=AchievementCondition(type="exercises_done", value=1),
    ),
    Achievement(
        id="ten-exercises", icon="🎶",
        title_key="Dez exercícios",
        description_key="Complete 10 exercícios.",
        condition=AchievementCondition(type="exercises_done", value=10),
    ),
    Achievement(
        id="xp-100", icon="⭐",
        title_key="100 XP",
        description_key="Acumule 100 XP.",
        condition=AchievementCondition(type="xp", value=100),
    ),
    Achievement(
        id="xp-500", icon="🌟",
        title_key="500 XP",
        description_key="Acumule 500 XP.",
        condition=AchievementCondition(type="xp", value=500),
    ),
    Achievement(
        id="streak-3", icon="🔥",
        title_key="Em chamas",
        description_key="Pratique 3 dias seguidos.",
        condition=AchievementCondition(type="streak", value=3),
    ),
    Achievement(
        id="streak-7", icon="🚀",
        title_key="Semana inteira",
        description_key="Pratique 7 dias seguidos.",
        condition=AchievementCondition(type="streak", value=7),
    ),
    Achievement(
        id="fundamentals-done", icon="🎸",
        title_key="Fundamentos dominados",
        description_key="Complete o módulo Fundamentos.",
        condition=AchievementCondition(type="module_complete", value=1, module_id="fundamentals"),
    ),
    Achievement(
        id="intervals-done", icon="👂",
        title_key="Ouvido afinado",
        description_key="Complete o módulo Intervalos.",
        condition=AchievementCondition(type="module_complete", value=1, module_id="intervals"),
    ),
    Achievement(
        id="accuracy-80", icon="🎯",
        title_key="Precisão 80%",
        description_key="Atinja 80% de acertos.",
        condition=AchievementCondition(type="accuracy", value=80),
    ),
]
