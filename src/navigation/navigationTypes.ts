import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreensTypes } from './screensTypes';

export type RootStackParamList = {
  RootStack: NavigatorScreenParams<ScreensTypes>;
};

type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type GlobalNavigationProps = RootStackScreenProps<
  keyof RootStackParamList
>;

export type StackScreenProps<T extends keyof ScreensTypes> = {
  navigation: CompositeScreenProps<
    GlobalNavigationProps,
    NativeStackScreenProps<ScreensTypes, T>
  >['navigation'];
  route: NativeStackScreenProps<ScreensTypes, T>['route'];
};
