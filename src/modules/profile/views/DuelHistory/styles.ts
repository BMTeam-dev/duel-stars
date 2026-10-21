import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;
