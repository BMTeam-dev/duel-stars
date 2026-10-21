import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Header = styled.View`
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
`;

export const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
`;

export const Actions = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const HeaderButton = styled.Pressable<{ primary?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-radius: ${radius.pill}px;
  background-color: ${({ primary }) => (primary ? colors.gold.main : colors.surfaceRaised)};
`;

export const HeaderButtonText = styled.Text<{ primary?: boolean }>`
  color: ${({ primary }) => (primary ? colors.gold.on : colors.text.secondary)};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;
