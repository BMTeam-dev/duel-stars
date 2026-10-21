import styled from 'styled-components/native';
import { Text } from 'react-native-paper';
import { colors } from '../../../../configs/colors';

// Base comum das telas de login e cadastro.
export * from '../../styles';

export const DividerRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 24px;
`;

export const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${colors.border};
`;

export const DividerLabel = styled(Text)`
  color: ${colors.text.secondary};
  margin-left: 12px;
  margin-right: 12px;
`;

export const GoogleButton = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: ${colors.text.primary};
  border-radius: 12px;
  padding: 14px;
  min-height: 48px;
`;

export const GoogleButtonText = styled(Text)`
  color: ${colors.background};
  font-weight: 600;
`;
