import type { IconName } from '../../shared/ui/Icon';

// Catálogo das medalhas do MVP (ver "Medalhas, conquistas e histórico" no doc
// do MVP). Quem desbloqueia é o servidor depois de cada duelo (Cloud
// Functions, fase 2); o app só mostra o catálogo e quais o jogador já tem.
export type Medal = {
  id: string;
  name: string;
  howTo: string;
  icon: IconName;
};

export const MEDALS: Medal[] = [
  { id: 'first_duel', name: 'Primeiro Duelo', howTo: 'Conclua seu primeiro duelo.', icon: 'cards-playing' },
  { id: 'first_win', name: 'Primeira Vitória', howTo: 'Vença seu primeiro duelo.', icon: 'trophy' },
  {
    id: 'duelist',
    name: 'Duelista',
    howTo: 'Conclua 10, 50 e 100 duelos (bronze, prata e ouro).',
    icon: 'sword-cross',
  },
  {
    id: 'on_fire',
    name: 'Em Chamas',
    howTo: 'Vença 3, 5 e 10 duelos seguidos (bronze, prata e ouro).',
    icon: 'fire',
  },
  {
    id: 'underdog',
    name: 'Azarão',
    howTo: 'Vença alguém que tem o dobro das suas estrelas.',
    icon: 'arm-flex',
  },
  { id: 'all_in', name: 'All-in', howTo: 'Vença apostando o máximo permitido.', icon: 'cards-diamond' },
  {
    id: 'revenge',
    name: 'Vingança',
    howTo: 'Vença quem te derrotou no último duelo entre vocês.',
    icon: 'sword',
  },
  { id: 'rival', name: 'Rival', howTo: 'Duele 10 vezes com o mesmo jogador.', icon: 'shield-sword' },
  { id: 'social', name: 'Social', howTo: 'Duele com 10 jogadores diferentes.', icon: 'account-multiple' },
  { id: 'fortune', name: 'Fortuna', howTo: 'Chegue a 100 estrelas.', icon: 'star-shooting' },
  {
    id: 'phoenix',
    name: 'Fênix',
    howTo: 'Volte a 20 estrelas depois de cair abaixo de 3.',
    icon: 'bird',
  },
  {
    id: 'top10',
    name: 'Top 10',
    howTo: 'Termine a temporada entre os 10 primeiros do geral ou em 1º na sua cidade.',
    icon: 'crown',
  },
];
