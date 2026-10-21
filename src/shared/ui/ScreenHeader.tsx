import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';
import { Icon, IconName } from './Icon';

type Props = {
  title: string;
  onBack?: () => void;
  backIcon?: IconName;
};

export function ScreenHeader({ title, onBack, backIcon = 'arrow-left' }: Props) {
  return (
    <Container>
      {onBack ? (
        <IconButton onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
          <Icon name={backIcon} />
        </IconButton>
      ) : (
        <IconButton disabled />
      )}
      <Title>{title}</Title>
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
`;

const IconButton = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 700;
`;
