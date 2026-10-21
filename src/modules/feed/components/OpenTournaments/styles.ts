import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const Wrapper = styled.View`
  margin-bottom: ${spacing.md}px;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${spacing.lg}px ${spacing.sm}px;
`;

export const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const SeeAll = styled.Pressable``;

export const SeeAllText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;
