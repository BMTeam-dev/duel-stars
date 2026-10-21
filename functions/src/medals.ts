import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from 'firebase-admin/firestore';
import { RULES } from './config';
import { notifyUser } from './notify';

// Medalhas (catálogo no app: src/services/profile/medals.ts). Ficam em
// users.medals.<id> = nível (1; ou 1/2/3 = bronze/prata/ouro nas que têm
// degraus). Só o backend escreve - firestore.rules não deixa o app mexer.
//
// Avaliadas no fim de cada duelo, dentro da transação que mexe nas estrelas
// (applyFinalize): o resultado é só mais campos no mesmo update do usuário.

type Category = 'tcg' | 'md' | 'dl';

export const MEDAL_NAMES: Record<string, string> = {
  first_duel: 'Primeiro Duelo',
  first_win: 'Primeira Vitória',
  duelist: 'Duelista',
  on_fire: 'Em Chamas',
  underdog: 'Azarão',
  all_in: 'All-in',
  revenge: 'Vingança',
  rival: 'Rival',
  social: 'Social',
  fortune: 'Fortuna',
  phoenix: 'Fênix',
  champion: 'Campeão',
};

const TIER_NAMES = ['', 'bronze', 'prata', 'ouro'];

// Nível pelos degraus (ex.: [10, 50, 100] -> 0 a 3).
const tierOf = (value: number, steps: number[]) =>
  steps.filter(step => value >= step).length;

const DUELIST_STEPS = [10, 50, 100];
const ON_FIRE_STEPS = [3, 5, 10];
const RIVAL_DUELS = 10;
const SOCIAL_OPPONENTS = 10;
const FORTUNE_STARS = 100;
const PHOENIX_LOW = 3;
const PHOENIX_BACK = 20;

export type Unlocked = { id: string; tier: number };

type Input = {
  user: DocumentSnapshot;
  opponent: DocumentSnapshot;
  // Placar deste jogador contra o oponente, antes do duelo.
  rival: DocumentSnapshot;
  category: Category;
  won: boolean;
  stake: number;
  // Duelo casual (com aposta); partida de torneio não conta pras de aposta.
  casual: boolean;
};

// Campos extras pro update do jogador (medalhas novas e marcadores) e quais
// medalhas ele acabou de ganhar, pra notificar depois da transação.
export function evaluateMedals(input: Input): {
  fields: Record<string, unknown>;
  unlocked: Unlocked[];
} {
  const data: DocumentData = input.user.data() ?? {};
  const owned: Record<string, number> = data.medals ?? {};
  const wallets: Record<string, DocumentData> = data.wallets ?? {};
  const wallet = wallets[input.category] ?? {};
  const opponentWallet =
    (input.opponent.data()?.wallets ?? {})[input.category] ?? {};
  const rival = input.rival.data() ?? {};

  const totalDuels =
    Object.values(wallets).reduce(
      (sum, w) => sum + (w.wins ?? 0) + (w.losses ?? 0),
      0,
    ) + 1;
  const streak = input.won ? (wallet.streak ?? 0) + 1 : 0;
  const starsBefore = wallet.stars ?? 0;
  const starsAfter = starsBefore + (input.won ? input.stake : -input.stake);
  const duelsTogether = (rival.wins ?? 0) + (rival.losses ?? 0) + 1;
  const opponents = (data.opponentsCount ?? 0) + (input.rival.exists ? 0 : 1);

  const earned: Record<string, number> = {
    first_duel: 1,
    first_win: input.won ? 1 : 0,
    duelist: tierOf(totalDuels, DUELIST_STEPS),
    on_fire: tierOf(streak, ON_FIRE_STEPS),
    underdog:
      input.casual &&
      input.won &&
      (opponentWallet.stars ?? 0) >= 2 * Math.max(1, starsBefore)
        ? 1
        : 0,
    all_in: input.casual && input.won && input.stake === RULES.maxStake ? 1 : 0,
    // O oponente tinha vencido o último duelo entre vocês.
    revenge:
      input.won && rival.lastWinnerUid && rival.lastWinnerUid !== input.user.id
        ? 1
        : 0,
    rival: duelsTogether >= RIVAL_DUELS ? 1 : 0,
    social: opponents >= SOCIAL_OPPONENTS ? 1 : 0,
    fortune: starsAfter >= FORTUNE_STARS ? 1 : 0,
    phoenix: wallet.lowPoint && starsAfter >= PHOENIX_BACK ? 1 : 0,
  };

  const fields: Record<string, unknown> = {};
  const unlocked: Unlocked[] = [];
  for (const [id, tier] of Object.entries(earned)) {
    if (tier > (owned[id] ?? 0)) {
      fields[`medals.${id}`] = tier;
      unlocked.push({ id, tier });
    }
  }
  if (!input.rival.exists) fields.opponentsCount = FieldValue.increment(1);
  // Fênix: marca quando cai abaixo de 3; a volta a 20 desbloqueia e limpa.
  const lowPoint = `wallets.${input.category}.lowPoint`;
  if (input.casual && starsAfter < PHOENIX_LOW) fields[lowPoint] = true;
  else if (earned.phoenix) fields[lowPoint] = false;
  return { fields, unlocked };
}

export function medalLabel({ id, tier }: Unlocked): string {
  const name = MEDAL_NAMES[id] ?? id;
  return tier > 1 || id === 'duelist' || id === 'on_fire'
    ? `${name} (${TIER_NAMES[tier]})`
    : name;
}

export async function notifyMedals(uid: string, unlocked: Unlocked[]) {
  if (!unlocked.length) return;
  const names = unlocked.map(medalLabel);
  await notifyUser(uid, {
    title:
      unlocked.length === 1
        ? 'Medalha conquistada!'
        : `${unlocked.length} medalhas conquistadas!`,
    body: names.join(', '),
    link: '/profile',
  });
}
