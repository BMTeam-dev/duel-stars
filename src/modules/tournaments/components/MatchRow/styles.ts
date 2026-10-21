import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.Pressable<{ mine: boolean }>`
  gap: ${spacing.xs}px;
  padding: ${spacing.md}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ mine }) => (mine ? colors.gold.dark : colors.border)};
  background-color: ${colors.surface};
`;

export const Side = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  min-height: 28px;
`;

export const Nick = styled.Text<{ won?: boolean; muted?: boolean; mine?: boolean }>`
  flex-shrink: 1;
  color: ${({ won, muted, mine }) =>
    won ? colors.gold.main : muted ? colors.text.muted : mine ? colors.text.primary : colors.text.secondary};
  font-size: ${fontSize.body}px;
  font-weight: ${({ won, mine }) => (won || mine ? 800 : 600)};
  text-decoration-line: ${({ muted, won }) => (muted && !won ? 'line-through' : 'none')};
`;

export const Status = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${spacing.xs}px;
`;

export const StatusText = styled.Text<{ tone: 'gold' | 'negative' | 'muted' }>`
  color: ${({ tone }) =>
    tone === 'gold' ? colors.gold.main : tone === 'negative' ? colors.feedback.negative : colors.text.muted};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
`;
