// Nível do duelista = experiência, separado das estrelas: estrelas são a
// moeda (sobem e descem nas apostas), o nível só sobe - todo mundo começa no
// 1 e ele nunca cai, mesmo perdendo. Sem teto: o número continua subindo, e
// os títulos marcam as faixas, até "Rei dos Jogos".
//
// XP vem das vitórias e derrotas que já estão no perfil (sem campo novo no
// Firestore). Derrota também dá XP: jogar conta, e isso incentiva a duelar.
export const XP_PER_WIN = 3;
export const XP_PER_LOSS = 1;

// XP total pra chegar no nível n: 2 × (n-1) × n / 2 - cada nível pede 2 XP a
// mais que o anterior (2, 4, 6...). Nível 5 = 20 XP (~7 vitórias), nível 10
// = 90, nível 50 = 2.450. Primeira calibragem, ajustar com uso real.
const XP_STEP = 2;

export function xpForLevel(level: number): number {
  return (XP_STEP * (level - 1) * level) / 2;
}

export function xpFromRecord(wins: number, losses: number): number {
  return wins * XP_PER_WIN + losses * XP_PER_LOSS;
}

export type LevelProgress = {
  level: number;
  xp: number;
  // XP já feito dentro do nível atual e quanto o nível atual exige.
  xpIntoLevel: number;
  xpToNext: number;
};

export function levelProgress(wins: number, losses: number): LevelProgress {
  const xp = xpFromRecord(wins, losses);
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  const start = xpForLevel(level);
  return { level, xp, xpIntoLevel: xp - start, xpToNext: xpForLevel(level + 1) - start };
}

export type LevelTitle = {
  minLevel: number;
  title: string;
};

export const LEVEL_TITLES: LevelTitle[] = [
  { minLevel: 1, title: 'Novato' },
  { minLevel: 5, title: 'Duelista' },
  { minLevel: 10, title: 'Duelista de Elite' },
  { minLevel: 15, title: 'Ás' },
  { minLevel: 25, title: 'Mestre' },
  { minLevel: 35, title: 'Lenda' },
  { minLevel: 50, title: 'Rei dos Jogos' },
];

export function levelTitle(level: number): string {
  let title = LEVEL_TITLES[0].title;
  LEVEL_TITLES.forEach(item => {
    if (level >= item.minLevel) title = item.title;
  });
  return title;
}
