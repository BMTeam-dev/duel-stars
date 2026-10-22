import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Card = styled.View`
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
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

export const Deadline = styled.Text<{ late?: boolean }>`
  color: ${({ late }) => (late ? colors.feedback.negative : colors.gold.main)};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const Muted = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const Notice = styled.View`
  gap: ${spacing.xs}px;
  padding: ${spacing.md}px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
`;

export const NoticeLabel = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const NoticeText = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  line-height: ${fontSize.body * 1.4}px;
`;

export const Actions = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const Action = styled.View`
  flex: 1;
`;
