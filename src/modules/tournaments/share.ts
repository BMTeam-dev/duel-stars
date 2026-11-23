// Classificação, rodadas, campeão e convite no formato do ShareSheet.
import { ShareContent } from '../../shared/ui/ShareSheet/content';
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
    heading: t.name,
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
    heading: t.name,
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
    heading: t.name,
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
    heading: t.name,
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
