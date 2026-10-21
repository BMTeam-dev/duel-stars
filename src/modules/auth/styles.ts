import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { Text, TextInput } from 'react-native-paper';
import { colors } from '../../configs/colors';

export const GradientContainer = styled(LinearGradient)`
  flex: 1;
`;

export const Container = styled.View`
  flex: 1;
  padding: 24px;
  padding-top: 96px;
  justify-content: center;
`;

export const AppName = styled(Text)`
  color: ${colors.text.primary};
  text-align: center;
  margin-bottom: 32px;
`;

export const Title = styled(Text)`
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

export const Subtitle = styled(Text)`
  color: ${colors.text.secondary};
  margin-bottom: 24px;
`;

export const ErrorText = styled(Text)`
  color: ${colors.feedback.negative};
  margin-bottom: 16px;
`;

export const Field = styled(TextInput)`
  margin-bottom: 16px;
  background-color: transparent;
`;

export const FooterRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
`;

export const FooterText = styled(Text)`
  color: ${colors.text.secondary};
`;

export const FooterLinkText = styled(Text)`
  color: ${colors.text.primary};
  font-weight: 600;
  margin-left: 4px;
`;
