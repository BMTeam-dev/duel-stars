import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Section = styled.View`
  gap: ${spacing.sm}px;
  margin-top: ${spacing.lg}px;
`;

export const Label = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
`;

export const Hint = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  line-height: 18px;
`;

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.md}px;
`;

export const RowItem = styled.View`
  flex: 1;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
`;
