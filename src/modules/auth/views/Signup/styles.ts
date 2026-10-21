import styled from 'styled-components/native';
import { Text } from 'react-native-paper';
import { colors } from '../../../../configs/colors';

// Base comum das telas de login e cadastro.
export * from '../../styles';

export const BackButton = styled.TouchableOpacity`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: ${colors.border};
`;

export const BackButtonIcon = styled(Text)`
  color: ${colors.text.primary};
  font-size: 20px;
`;
