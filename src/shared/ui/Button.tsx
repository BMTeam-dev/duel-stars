import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import styled, { css } from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { Icon, IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
};

const background: Record<ButtonVariant, string> = {
  primary: colors.gold.main,
  secondary: colors.surfaceRaised,
  ghost: 'transparent',
  danger: colors.feedback.negative,
};

const foreground: Record<ButtonVariant, string> = {
  primary: colors.gold.on,
  secondary: colors.text.primary,
  ghost: colors.text.secondary,
  danger: colors.white,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      variant={variant}
      size={size}
      inactive={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => (pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null)}
    >
      {loading ? (
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'lg' ? 24 : 20} color={foreground[variant]} />}
          <Label variant={variant} size={size} withIcon={!!icon}>
            {label}
          </Label>
        </>
      )}
    </Pressable>
  );
}

const Pressable = styled.Pressable<{
  variant: ButtonVariant;
  size: 'md' | 'lg';
  inactive: boolean;
}>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: ${({ size }) => (size === 'lg' ? 60 : 48)}px;
  padding: 0 ${spacing.xl}px;
  border-radius: ${({ size }) => (size === 'lg' ? radius.lg : radius.md)}px;
  background-color: ${({ variant }) => background[variant]};
  opacity: ${({ inactive }) => (inactive ? 0.5 : 1)};
  ${({ variant }) =>
    variant === 'secondary' &&
    css`
      border-width: 1px;
      border-color: ${colors.border};
    `}
`;

const Label = styled.Text<{ variant: ButtonVariant; size: 'md' | 'lg'; withIcon: boolean }>`
  color: ${({ variant }) => foreground[variant]};
  font-size: ${({ size }) => (size === 'lg' ? fontSize.title : fontSize.bodyLarge)}px;
  font-weight: 700;
  margin-left: ${({ withIcon }) => (withIcon ? spacing.sm : 0)}px;
`;
