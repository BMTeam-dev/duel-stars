import * as React from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { colors } from '../../configs/colors';

export type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = colors.text.primary }: Props) {
  return <MaterialDesignIcons name={name} size={size} color={color} />;
}
