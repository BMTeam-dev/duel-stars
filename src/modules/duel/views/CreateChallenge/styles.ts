import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Label = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: ${spacing.md}px;
`;

export const StakeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md}px;
`;

export const StepButton = styled.Pressable<{ disabled?: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceRaised};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const StakeValueBox = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const StakeValue = styled.Text`
  color: ${colors.gold.main};
  font-size: 56px;
  font-weight: 900;
`;

export const Hint = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
  text-align: center;
  margin-bottom: ${spacing.xl}px;
`;

export const FormatRow = styled.View`
  flex-direction: row;
  gap: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
`;

export const FormatOption = styled.Pressable<{ selected: boolean }>`
  flex: 1;
  align-items: center;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ selected }) => (selected ? colors.gold.main : colors.border)};
  background-color: ${({ selected }) => (selected ? colors.gold.soft : colors.surface)};
`;

export const FormatText = styled.Text<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
`;

export const QrBody = styled.View`
  flex: 1;
  align-items: center;
  padding: ${spacing.xl}px;
`;

export const Summary = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.title}px;
  font-weight: 800;
  margin-bottom: ${spacing.xl}px;
`;

export const QrFrame = styled.View<{ expired: boolean }>`
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  background-color: ${colors.white};
  opacity: ${({ expired }) => (expired ? 0.2 : 1)};
  margin-bottom: ${spacing.xl}px;
`;

export const Countdown = styled.Text`
  color: ${colors.text.primary};
  font-size: 40px;
  font-weight: 800;
  margin-bottom: ${spacing.md}px;
`;

export const CodeLabel = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-bottom: ${spacing.xs}px;
`;

export const CodeValue = styled.Text`
  color: ${colors.text.primary};
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 8px;
  margin-bottom: ${spacing.xl}px;
`;

export const OnlineCode = styled.View<{ expired: boolean }>`
  align-self: stretch;
  align-items: center;
  padding: ${spacing.xl}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
  opacity: ${({ expired }) => (expired ? 0.3 : 1)};
  margin-bottom: ${spacing.xl}px;
`;

export const BigCode = styled.Text`
  color: ${colors.gold.main};
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 10px;
`;

export const ShareArea = styled.View`
  align-self: stretch;
  margin-bottom: ${spacing.xl}px;
`;

export const Waiting = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const WaitingText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;
