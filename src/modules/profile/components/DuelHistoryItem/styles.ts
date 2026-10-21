import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';
import type { Outcome } from '.';

const accent = (outcome: Outcome) =>
  outcome === 'won' ? colors.gold.main : outcome === 'lost' ? colors.feedback.negative : colors.text.muted;

const accentSoft = (outcome: Outcome) =>
  outcome === 'won'
    ? colors.gold.soft
    : outcome === 'lost'
    ? 'rgba(255, 107, 94, 0.14)'
    : colors.surfaceRaised;

export const Card = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Result = styled.View<{ outcome: Outcome }>`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  background-color: ${({ outcome }) => accentSoft(outcome)};
`;

export const ResultText = styled.Text<{ outcome: Outcome }>`
  color: ${({ outcome }) => accent(outcome)};
  font-size: ${fontSize.body}px;
  font-weight: 900;
`;

export const Body = styled.View`
  flex: 1;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Meta = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;

export const Stars = styled.View<{ outcome: Outcome }>`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ outcome }) => accentSoft(outcome)};
`;

export const StarsText = styled.Text<{ outcome: Outcome }>`
  color: ${({ outcome }) => accent(outcome)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

export const NoteRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${spacing.xs}px;
  margin-top: ${spacing.xs}px;
`;

export const NoteText = styled.Text`
  flex: 1;
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-style: italic;
  line-height: 16px;
`;
