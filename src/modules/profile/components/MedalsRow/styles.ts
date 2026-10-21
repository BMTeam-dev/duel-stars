import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, spacing } from '../../../../configs/theme';

export const Item = styled.Pressable`
  width: 76px;
  align-items: center;
`;

export const Circle = styled.View<{ owned: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${({ owned }) => (owned ? colors.gold.main : colors.border)};
  background-color: ${({ owned }) => (owned ? colors.gold.soft : colors.surface)};
`;

export const LockBadge = styled.View`
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceRaised};
  border-width: 1px;
  border-color: ${colors.border};
`;

export const Name = styled.Text<{ owned: boolean }>`
  color: ${({ owned }) => (owned ? colors.text.primary : colors.text.secondary)};
  font-size: ${fontSize.caption}px;
  text-align: center;
  margin-top: ${spacing.sm}px;
`;
