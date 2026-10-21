import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { Duel } from '../../../../services/duels/duels.types';
import { Icon } from '../../../../shared/ui/Icon';
import { Banner, Texts, Title, Subtitle } from './styles';

type Props = {
  duel: Duel;
  myUid: string;
  onPress: () => void;
};

// Duelo que ainda pede algo do jogador (jogar, informar ou confirmar o
// resultado) fica destacado no topo do Feed - senão ele sai da tela do
// duelo e esquece de confirmar.
export function ActiveDuelBanner({ duel, myUid, onPress }: Props) {
  const opponentReported = !!Object.keys(duel.reports).find(uid => uid !== myUid);
  const iReported = !!duel.reports[myUid];
  const text =
    duel.status === 'disputed'
      ? 'Duelo em disputa'
      : opponentReported && !iReported
      ? 'Confirme o resultado do duelo'
      : iReported
      ? 'Esperando o oponente confirmar'
      : 'Duelo em andamento';

  return (
    <Banner onPress={onPress} urgent={opponentReported && !iReported}>
      <Icon name="sword-cross" size={22} color={colors.gold.main} />
      <Texts>
        <Title>{text}</Title>
        <Subtitle>
          {duel.stake} {duel.stake === 1 ? 'estrela' : 'estrelas'} em jogo · toque para abrir
        </Subtitle>
      </Texts>
      <Icon name="chevron-right" color={colors.text.secondary} />
    </Banner>
  );
}
