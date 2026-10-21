import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const PermissionBody = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: ${spacing.lg}px;
  padding: ${spacing.xl}px;
`;

export const PermissionText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  text-align: center;
`;

export const CodeIntro = styled.View`
  align-items: center;
  gap: ${spacing.lg}px;
  padding: ${spacing.xxl}px ${spacing.xl}px;
`;

export const CameraBox = styled.View`
  flex: 1;
  margin: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surface};
`;

export const Viewfinder = styled.View`
  width: 240px;
  height: 240px;
  border-radius: ${radius.lg}px;
  border-width: 3px;
  border-color: ${colors.gold.main};
`;

export const Loading = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  background-color: ${colors.overlay};
`;

export const CameraHint = styled.Text`
  position: absolute;
  bottom: ${spacing.xl}px;
  color: ${colors.white};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

export const CodeBox = styled.View`
  padding: 0 ${spacing.lg}px ${spacing.lg}px;
`;

export const PreviewBody = styled.View`
  flex: 1;
  align-items: center;
  padding: ${spacing.xl}px;
`;

export const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  margin-top: ${spacing.md}px;
`;

export const Meta = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  margin-top: ${spacing.xs}px;
`;

export const Challenge = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  margin-top: ${spacing.xl}px;
`;

export const StakeCard = styled.View`
  align-self: stretch;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xl}px;
  margin: ${spacing.lg}px 0;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

export const StakeText = styled.Text`
  color: ${colors.gold.main};
  font-size: 32px;
  font-weight: 900;
`;

export const FormatText = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 600;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;
