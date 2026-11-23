import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Header = styled.View`
  padding: ${spacing.lg}px ${spacing.lg}px ${spacing.md}px;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
`;

export const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md}px;
`;

export const ShareChip = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px ${spacing.md}px;
  border-radius: ${radius.pill}px;
  background-color: ${colors.gold.soft};
`;

export const ShareChipText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
`;

export const ErrorBox = styled.View`
  flex: 1;
  padding: 0 ${spacing.xl}px;
`;
