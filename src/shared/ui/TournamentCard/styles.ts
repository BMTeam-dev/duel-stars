import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';

export const Card = styled.Pressable<{ width?: number }>`
  ${({ width }) => (width ? `width: ${width}px;` : '')}
  gap: ${spacing.xs}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const Top = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const Meta = styled.Text`
  flex-shrink: 1;
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;

export const Name = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const Footer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${spacing.xs}px;
`;

export const Slots = styled.View<{ full: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const SlotsText = styled.Text<{ full: boolean }>`
  color: ${({ full }) => (full ? colors.feedback.negative : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const Badges = styled.View`
  flex-direction: row;
  gap: ${spacing.xs}px;
`;

export const Badge = styled.View<{ gold?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 2px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ gold }) => (gold ? colors.gold.soft : colors.surfaceRaised)};
`;

export const BadgeText = styled.Text<{ gold?: boolean }>`
  color: ${({ gold }) => (gold ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
`;
