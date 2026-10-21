import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.Pressable<{ champion?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ champion }) => (champion ? colors.gold.dark : colors.border)};
  background-color: ${({ champion }) => (champion ? colors.gold.soft : colors.surface)};
`;

export const Body = styled.View`
  flex: 1;
`;

export const Line = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
`;

export const Strong = styled.Text`
  color: ${colors.text.primary};
  font-weight: 800;
`;

export const Meta = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;

export const Stars = styled.View<{ lost: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ lost }) => (lost ? 'rgba(255, 107, 94, 0.14)' : colors.gold.soft)};
`;

export const StarsText = styled.Text<{ lost: boolean }>`
  color: ${({ lost }) => (lost ? colors.feedback.negative : colors.gold.main)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;
