import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.md}px;
  margin-bottom: ${spacing.xl}px;
`;

export const Slot = styled.View<{ tone: 'gold' | 'negative' }>`
  flex: 1;
  align-items: center;
  gap: ${spacing.xs}px;
  min-height: 168px;
  padding: ${spacing.lg}px ${spacing.md}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${({ tone }) => (tone === 'gold' ? colors.gold.dark : 'rgba(255, 107, 94, 0.4)')};
  background-color: ${colors.surface};
`;

export const KindRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  margin-bottom: ${spacing.sm}px;
`;

export const Kind = styled.Text<{ color: string }>`
  color: ${({ color }) => color};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 800;
  margin-top: ${spacing.xs}px;
`;

export const RecordText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;

export const Empty = styled.Text`
  flex: 1;
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  line-height: 18px;
  text-align: center;
  text-align-vertical: center;
`;
