import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

type Tone = 'gold' | 'positive' | 'negative' | 'muted';
export const toneColor = (tone: Tone) =>
  tone === 'gold'
    ? colors.gold.main
    : tone === 'positive'
    ? colors.feedback.positive
    : tone === 'negative'
    ? colors.feedback.negative
    : colors.text.secondary;

export const Card = styled.View`
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const Title = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

export const Status = styled.Text<{ tone: Tone }>`
  color: ${({ tone }) => toneColor(tone)};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

export const Body = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const Thumb = styled.Image`
  width: 100%;
  height: 180px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
`;
