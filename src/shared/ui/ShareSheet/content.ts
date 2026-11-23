// O que o ShareSheet compartilha: o mesmo conteúdo vira imagem (ShareCard)
// ou texto com a formatação do WhatsApp (*negrito*). Os módulos montam o
// conteúdo (tournaments/share.ts, ranking/share.ts).
export type ShareRow = {
  nick: string;
  points: number;
  wins: number;
  losses: number;
  omw: number;
};

export type ShareMatch = {
  table: number;
  players: [string | null, string | null];
  winner: 0 | 1 | null;
  status: string | null;
};

export type ShareContent =
  | {
      kind: 'standings';
      heading: string;
      title: string;
      subtitle: string;
      rows: ShareRow[];
      topCut: number | null;
    }
  | {
      kind: 'round';
      heading: string;
      title: string;
      subtitle: string;
      matches: ShareMatch[];
    }
  | {
      kind: 'champion';
      heading: string;
      title: string;
      subtitle: string;
      champion: string | null;
      podium: { label: string; nick: string }[];
      pot: number;
    }
  | {
      kind: 'ranking';
      heading: string;
      title: string;
      subtitle: string;
      podium: { nick: string; stars: number; wins: number; losses: number }[];
    }
  | {
      kind: 'invite';
      heading: string;
      title: string;
      subtitle: string;
      info: [string, string][];
      code: string;
      // Só no texto, e só quando quem compartilha é o organizador.
      password: string | null;
    };

// Na imagem cabem até tantas linhas; o texto leva todas.
export const SHARE_IMAGE_LIMIT = 24;

const MEDALS = ['🥇', '🥈', '🥉'];

export function shareText(content: ShareContent): string {
  const head = [
    `🏆 *${content.heading}*`,
    `${content.title} · ${content.subtitle}`,
    '',
  ];
  const foot = ['', '_Duel Stars · torneios de Yu-Gi-Oh! online_'];
  if (content.kind === 'champion') {
    return [
      `🏆 *${content.heading}*`,
      content.subtitle,
      '',
      `👑 Campeão: *@${content.champion ?? 'sem campeão'}*`,
      ...content.podium.map(
        (p, i) => `${i === 0 ? '🥈' : '🥉'} ${p.label}: @${p.nick}`,
      ),
      ...(content.pot ? ['', `⭐ Bolo de ${content.pot} estrelas`] : []),
      ...foot,
    ].join('\n');
  }
  if (content.kind === 'ranking') {
    return [
      `🏆 *${content.heading}*`,
      `${content.title} · ${content.subtitle}`,
      '',
      ...content.podium.map(
        (p, i) =>
          `${MEDALS[i]} *@${p.nick}* · ${p.stars} ⭐ (${p.wins}V ${p.losses}D)`,
      ),
      '',
      '_Duel Stars · ranking de Yu-Gi-Oh! por cidade_',
    ].join('\n');
  }
  if (content.kind === 'invite') {
    return [
      `🏆 *${content.heading}*`,
      `${content.title} · ${content.subtitle}`,
      '',
      ...content.info.map(([label, value]) => `${label}: *${value}*`),
      '',
      `Para entrar: abra o Duel Stars, vá em Torneios → Código e digite *${
        content.code
      }*${content.password ? `. Senha: *${content.password}*` : ''}`,
      ...foot,
    ].join('\n');
  }
  if (content.kind === 'standings') {
    const lines = content.rows.flatMap((r, i) => {
      const pos = MEDALS[i] ?? `${i + 1}.`;
      const line = `${pos} *@${r.nick}* · ${r.points} pts (${r.wins}-${
        r.losses
      }) · ${Math.round(r.omw * 100)}%`;
      const cut =
        content.topCut &&
        i === content.topCut - 1 &&
        i < content.rows.length - 1
          ? [`— corte do top ${content.topCut} —`]
          : [];
      return [line, ...cut];
    });
    return [
      ...head,
      ...lines,
      '',
      'Pts, V-D e Adv. % (desempate: aproveitamento dos adversários).',
      ...foot,
    ].join('\n');
  }
  const lines = content.matches.map(m => {
    const side = (i: 0 | 1) => {
      const nick = m.players[i];
      if (!nick) return '—';
      return m.winner === i ? `*@${nick}* ✅` : `@${nick}`;
    };
    const vs = m.players[1] ? `${side(0)} x ${side(1)}` : side(0);
    return `Mesa ${m.table}: ${vs}${m.status ? ` · ${m.status}` : ''}`;
  });
  return [...head, ...lines, ...foot].join('\n');
}
