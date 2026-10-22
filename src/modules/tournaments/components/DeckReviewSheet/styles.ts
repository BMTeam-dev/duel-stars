import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

export const Body = styled.View`
  gap: ${spacing.md}px;
`;

export const Preview = styled.Image`
  width: 100%;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
`;

export const Loading = styled.View`
  height: 240px;
  align-items: center;
  justify-content: center;
  border-radius: ${radius.md}px;
  background-color: ${colors.surfaceRaised};
`;

export const Muted = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const Row = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

export const RowItem = styled.View`
  flex: 1;
`;
