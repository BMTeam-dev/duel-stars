import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { Duel } from '../../services/duels/duels.types';
import { Icon } from '../../shared/ui/Icon';

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

const Banner = styled.Pressable<{ urgent: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  margin: 0 ${spacing.lg}px ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ urgent }) => (urgent ? colors.gold.main : colors.gold.dark)};
  background-color: ${colors.gold.soft};
`;

const Texts = styled.View`
  flex: 1;
`;

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

const Subtitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;
