import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
`;

export const IconButton = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 700;
`;

export const PickerBody = styled.View`
  flex: 1;
  padding: ${spacing.lg}px ${spacing.xl}px 0;
`;

export const AvatarWrapper = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
`;

export const Locked = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surface};
  margin-bottom: ${spacing.lg}px;
`;

export const LockedText = styled.Text`
  flex: 1;
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
`;

export const Hint = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-bottom: ${spacing.xl}px;
`;

export const FieldLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: ${spacing.sm}px;
`;

export const CityButton = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const CityButtonText = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
`;
