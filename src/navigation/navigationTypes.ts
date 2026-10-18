import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ScreensTypes, TabsTypes } from './screensTypes';

export type StackScreenProps<T extends keyof ScreensTypes> = NativeStackScreenProps<
  ScreensTypes,
  T
>;

// Tela de aba: `navigation` enxerga as outras abas E as telas do stack de
// fora (ex: abrir uma tela cheia a partir do Feed).
export type TabScreenProps<T extends keyof TabsTypes> = CompositeScreenProps<
  BottomTabScreenProps<TabsTypes, T>,
  NativeStackScreenProps<ScreensTypes>
>;
