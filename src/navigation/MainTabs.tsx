import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../configs/colors';
import { Icon, IconName } from '../shared/ui/Icon';
import { TabsTypes } from './screensTypes';

import FeedScreen from '../features/feed/FeedScreen';
import CardsScreen from '../features/cards/CardsScreen';
import ProfileScreen from '../features/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabsTypes>();

const tabIcons: Record<keyof TabsTypes, { active: IconName; inactive: IconName }> = {
  Feed: { active: 'cards-playing', inactive: 'cards-playing-outline' },
  Cards: { active: 'magnify', inactive: 'magnify' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

function renderTabIcon(routeName: keyof TabsTypes) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Icon
      name={focused ? tabIcons[routeName].active : tabIcons[routeName].inactive}
      color={color}
      size={24}
    />
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold.main,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarIcon: renderTabIcon(route.name),
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Cards" component={CardsScreen} options={{ title: 'Cartas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
