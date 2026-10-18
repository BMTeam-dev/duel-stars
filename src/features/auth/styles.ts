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
  background-color: ${colors.transparency.semiTransparent};
`;

export const BackButtonIcon = styled(Text)`
  color: ${colors.auxiliary.white};
  font-size: 20px;
`;

export const AppName = styled(Text)`
  color: ${colors.auxiliary.white};
  text-align: center;
  margin-bottom: 32px;
`;

export const Title = styled(Text)`
  color: ${colors.auxiliary.white};
  margin-bottom: 4px;
`;

export const Subtitle = styled(Text)`
  color: ${colors.auxiliary.neutral};
  margin-bottom: 24px;
`;

export const ErrorText = styled(Text)`
  color: ${colors.auxiliary.negative};
  margin-bottom: 16px;
`;

export const Field = styled(TextInput)`
  margin-bottom: 16px;
  background-color: transparent;
`;

export const DividerRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 24px;
`;

export const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${colors.transparency.semiTransparent};
`;

export const DividerLabel = styled(Text)`
  color: ${colors.auxiliary.neutral};
  margin-left: 12px;
  margin-right: 12px;
`;

export const GoogleButton = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: ${colors.auxiliary.white};
  border-radius: 8px;
  padding: 14px;
  min-height: 48px;
`;

export const GoogleButtonText = styled(Text)`
  color: ${colors.base.darkest};
  font-weight: 600;
`;

export const FooterRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
`;

export const FooterText = styled(Text)`
  color: ${colors.auxiliary.neutral};
`;

export const SkipLinkText = styled(Text)`
  color: ${colors.auxiliary.neutral};
  text-align: center;
  text-decoration: underline;
  margin-top: 32px;
`;

export const FooterLinkText = styled(Text)`
  color: ${colors.auxiliary.white};
  font-weight: 600;
  margin-left: 4px;
`;
