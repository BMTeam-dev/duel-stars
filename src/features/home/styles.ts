import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { Text } from 'react-native-paper';
import { colors } from '../../configs/colors';

export const GradientContainer = styled(LinearGradient)`
  flex: 1;
`;

export const Container = styled.View`
  flex: 1;
  padding: 24px;
  align-items: center;
  justify-content: center;
`;

export const Title = styled(Text)`
  color: ${colors.auxiliary.white};
  text-align: center;
  margin-bottom: 8px;
`;

export const Subtitle = styled(Text)`
  color: ${colors.auxiliary.neutral};
  text-align: center;
`;
