import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';
import { CardsProps } from '../../navigation/props';
import { EmptyState } from '../../shared/ui/EmptyState';

function CardsScreen(_: CardsProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Title>Cartas</Title>
      <EmptyState
        icon="cards-outline"
        title="Busca de cartas em breve"
        message="Aqui você vai poder procurar qualquer carta, ver o texto, ATK/DEF e a banlist."
      />
    </SafeAreaView>
  );
}

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  padding: ${spacing.lg}px;
`;

export default CardsScreen;
