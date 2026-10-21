import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

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
  margin-bottom: ${spacing.md}px;
`;

export const ErrorBox = styled.View`
  flex: 1;
  padding: 0 ${spacing.xl}px;
`;
