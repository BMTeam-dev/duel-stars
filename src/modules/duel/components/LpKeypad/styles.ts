import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

type Tone = 'neutral' | 'negative' | 'positive';

const toneColor = (tone: Tone) =>
  tone === 'negative' ? colors.feedback.negative : tone === 'positive' ? colors.feedback.positive : colors.text.primary;

const toneBackground = (tone: Tone) =>
  tone === 'negative'
    ? 'rgba(255, 107, 94, 0.14)'
    : tone === 'positive'
    ? 'rgba(75, 208, 122, 0.14)'
    : colors.surfaceRaised;

export const Current = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const AmountRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: ${spacing.xs}px 0 ${spacing.md}px;
`;

export const Amount = styled.Text<{ empty: boolean }>`
  color: ${({ empty }) => (empty ? colors.text.muted : colors.text.primary)};
  font-size: 48px;
  font-weight: 900;
  font-variant: tabular-nums;
`;

export const Backspace = styled.Pressable`
  padding: ${spacing.sm}px;
`;

export const Keys = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  row-gap: ${spacing.sm}px;
`;

export const Key = styled.Pressable`
  width: 31.5%;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
`;

export const KeyText = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title + 2}px;
  font-weight: 700;
`;

export const Actions = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
  margin-top: ${spacing.lg}px;
`;

export const Action = styled.Pressable<{ tone: Tone; disabled?: boolean }>`
  flex: ${({ tone }) => (tone === 'neutral' ? 0.7 : 1)};
  align-items: center;
  padding: ${spacing.md}px ${spacing.sm}px;
  border-radius: ${radius.md}px;
  background-color: ${({ tone }) => toneBackground(tone)};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const ActionText = styled.Text<{ tone: Tone }>`
  color: ${({ tone }) => toneColor(tone)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const ActionHint = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: 2px;
`;
