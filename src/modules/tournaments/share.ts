// Classificação e rodadas em formato de compartilhar: o mesmo conteúdo vira
// imagem (ShareCard) ou texto com a formatação do WhatsApp (*negrito*).
import { PublicProfile } from '../../services/duels/duels.types';
import {
  formatStart,
  Standing,
  Tournament,
  TournamentMatch,
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
