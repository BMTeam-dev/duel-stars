// Classificação e rodadas em formato de compartilhar: o mesmo conteúdo vira
// imagem (ShareCard) ou texto com a formatação do WhatsApp (*negrito*).
import {
  CATEGORY_LABEL,
  FORMAT_LABEL,
  PublicProfile,
} from '../../services/duels/duels.types';
import {
  formatMoney,
  formatStart,
  swissStandings,
  Standing,
  Tournament,
  TOURNAMENT_FORMAT_LABEL,
  TournamentMatch,
  TournamentPlayer,
} from '../../services/tournaments/tournaments.types';

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
      tournament: string;
      title: string;
      subtitle: string;
      rows: ShareRow[];
      topCut: number | null;
    }
  | {
      kind: 'round';
      tournament: string;
      title: string;
      subtitle: string;
      matches: ShareMatch[];
    }
  | {
      kind: 'champion';
      tournament: string;
      title: string;
      subtitle: string;
      champion: string | null;
      podium: { label: string; nick: string }[];
      pot: number;
    }
  | {
      kind: 'invite';
      tournament: string;
      title: string;
      subtitle: string;
      info: [string, string][];
      code: string;
      // Só no texto, e só quando quem compartilha é o organizador.
      password: string | null;
    };

// Na imagem cabem até tantas linhas; o texto leva todas.
export const SHARE_IMAGE_LIMIT = 24;

type Profiles = Record<string, PublicProfile>;

const nickOf = (profiles: Profiles, uid: string | null) =>
  uid ? profiles[uid]?.nick ?? '...' : null;

// Última rodada do suíço com todas as partidas encerradas.
function lastSwissRoundDone(matches: TournamentMatch[]): number {
  const swiss = matches.filter(m => m.stage === 'swiss');
  const rounds = [...new Set(swiss.map(m => m.round))].sort((a, b) => a - b);
  let done = 0;
  for (const r of rounds) {
    if (swiss.some(m => m.round === r && m.status !== 'done')) break;
    done = r;
  }
  return done;
}

export function standingsShare(
  t: Tournament,
  table: Standing[],
  matches: TournamentMatch[],
  profiles: Profiles,
): ShareContent {
  const total = t.swissRounds ?? 0;
  const done = lastSwissRoundDone(matches);
  const subtitle =
    t.status === 'finished' || t.stage === 'top' || (total && done >= total)
      ? `Suíço encerrado · ${total} rodadas`
      : done
      ? `Parcial · após a rodada ${done} de ${total}`
      : 'Antes da 1ª rodada';
  return {
    kind: 'standings',
    tournament: t.name,
    title: 'Classificação',
    subtitle,
    topCut: t.topCut,
    rows: table.map(row => ({
      nick: nickOf(profiles, row.uid)!,
      points: row.points,
      wins: row.wins,
      losses: row.losses,
      omw: row.omw,
    })),
  };
}

function matchStatus(m: TournamentMatch): string | null {
  if (m.result === 'bye') return 'Passou direto';
  if (m.result === 'double_loss') return 'Derrota dupla';
  if (m.status === 'done') return null;
  if (m.status === 'pending') return 'A definir';
  if (m.status === 'ready') return 'Aguardando início';
  if (m.duelStatus === 'disputed') return 'Em disputa';
  if (m.duelStatus === 'awaiting') return 'Aguardando confirmação';
  return 'Em jogo';
}

export function roundShare(
  t: Tournament,
  title: string,
  group: TournamentMatch[],
  profiles: Profiles,
): ShareContent {
  const sorted = [...group].sort((a, b) => a.slot - b.slot);
  const finished = sorted.filter(m => m.status === 'done').length;
  const current =
    t.roundPhase === 'playing' &&
    !!t.roundDeadlineAt &&
    sorted.some(m => m.status === 'active');
  const parts = [
    finished === sorted.length
      ? 'Rodada encerrada'
      : `${finished} de ${sorted.length} partidas encerradas`,
    ...(current ? [`prazo até ${formatStart(t.roundDeadlineAt!)}`] : []),
  ];
  return {
    kind: 'round',
    tournament: t.name,
    title,
    subtitle: parts.join(' · '),
    matches: sorted.map((m, i) => ({
      table: i + 1,
      players: [
        nickOf(profiles, m.players[0] ?? null),
        nickOf(profiles, m.players[1] ?? null),
      ],
      winner:
        m.status === 'done' && m.winnerUid
          ? m.winnerUid === m.players[0]
            ? 0
            : 1
          : null,
      status: matchStatus(m),
    })),
  };
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function shareText(content: ShareContent): string {
  const head = [
    `🏆 *${content.tournament}*`,
    `${content.title} · ${content.subtitle}`,
    '',
  ];
  const foot = ['', '_Duel Stars · torneios de Yu-Gi-Oh! online_'];
  if (content.kind === 'champion') {
    return [
      `🏆 *${content.tournament}*`,
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
  if (content.kind === 'invite') {
    return [
      `🏆 *${content.tournament}*`,
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

// Pódio: placements do mata-mata [campeão, vice, semifinalistas]; no suíço
// sem top cut, os primeiros da classificação.
export function championShare(
  t: Tournament,
  players: TournamentPlayer[],
  profiles: Profiles,
): ShareContent {
  const order = t.placements?.length
    ? t.placements
    : swissStandings(players).map(p => p.uid);
  const labels = t.placements?.length
    ? ['Vice', 'Semifinal', 'Semifinal']
    : ['2º lugar', '3º lugar'];
  const podium = labels.flatMap((label, i) => {
    const nick = nickOf(profiles, order[i + 1] ?? null);
    return nick ? [{ label, nick }] : [];
  });
  return {
    kind: 'champion',
    tournament: t.name,
    title: 'Campeão',
    subtitle: `${CATEGORY_LABEL[t.category]} · ${
      TOURNAMENT_FORMAT_LABEL[t.format]
    } · ${t.playerCount} jogadores`,
    champion: nickOf(profiles, t.championUid),
    podium,
    pot: t.championUid ? t.pot : 0,
  };
}

export function inviteShare(
  t: Tournament,
  password: string | null,
): ShareContent {
  const open = t.status === 'open' || t.status === 'checkin';
  return {
    kind: 'invite',
    tournament: t.name,
    title: open ? 'Inscrições abertas' : 'Torneio',
    subtitle: t.startsAt
      ? `Começa ${formatStart(t.startsAt)}`
      : 'Começa quando o organizador abrir o check-in',
    info: [
      ['Jogo', CATEGORY_LABEL[t.category]],
      [
        'Formato',
        `${TOURNAMENT_FORMAT_LABEL[t.format]} · ${FORMAT_LABEL[t.matchFormat]}`,
      ],
      ['Vagas', `${t.playerCount} de ${t.maxPlayers}`],
      ['Inscrição', t.entryFeeCents ? formatMoney(t.entryFeeCents) : 'Grátis'],
      ...(t.starsEntry
        ? [['Estrelas', `${t.starsEntry} para entrar`] as [string, string]]
        : []),
    ],
    code: t.code,
    password,
  };
}
