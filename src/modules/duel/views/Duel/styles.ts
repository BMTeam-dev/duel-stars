import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

const toneColors = {
  neutral: { border: colors.border, background: colors.surface },
  gold: { border: colors.gold.dark, background: colors.gold.soft },
  negative: { border: colors.feedback.negative, background: 'rgba(255, 107, 94, 0.1)' },
};

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

export const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  text-align: center;
  margin-top: ${spacing.sm}px;
`;

export const Versus = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const Player = styled.View`
  width: 110px;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const PlayerNick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const Stake = styled.View`
  align-items: center;
`;

export const StakeValue = styled.Text`
  color: ${colors.gold.main};
  font-size: 32px;
  font-weight: 900;
`;

export const StakeLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
`;

export const StatusCard = styled.View<{ tone: keyof typeof toneColors }>`
  flex-direction: row;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ tone }) => toneColors[tone].border};
  background-color: ${({ tone }) => toneColors[tone].background};
`;

export const StatusText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;

export const ResultCircle = styled.View<{ won: boolean }>`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  align-items: center;
  justify-content: center;
  background-color: ${({ won }) => (won ? colors.gold.soft : colors.surface)};
  border-width: 2px;
  border-color: ${({ won }) => (won ? colors.gold.main : colors.border)};
  margin-bottom: ${spacing.xl}px;
`;

export const ResultTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: 36px;
  font-weight: 900;
`;

export const ResultStars = styled.Text<{ won: boolean }>`
  color: ${({ won }) => (won ? colors.gold.main : colors.text.secondary)};
  font-size: ${fontSize.title}px;
  font-weight: 800;
  margin-top: ${spacing.sm}px;
`;

export const WinnerOptions = styled.View`
  gap: ${spacing.md}px;
`;

export const WinnerOption = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surfaceRaised};
`;

export const WinnerText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;
