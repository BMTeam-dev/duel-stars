import { useEffect, useRef } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { arrayUnion, doc, updateDoc } from '@react-native-firebase/firestore';
import { ScreensTypes } from '../../navigation/screensTypes';
import { useAppSelector } from '../../redux/store';
import { toast } from '../../shared/ui/toast';
import { db } from '../firestore/db';

const messaging = getMessaging();

type Route = { screen: 'Duel'; params: { duelId: string } } | { screen: 'Tournament'; params: { tournamentId: string } };

// Rotas que o backend manda em data.link (functions/src/duels.ts e tournaments.ts).
function routeFromLink(link: unknown): Route | null {
  if (typeof link !== 'string') return null;
  const duel = /^\/duel\/([A-Za-z0-9]+)$/.exec(link);
  if (duel) return { screen: 'Duel', params: { duelId: duel[1] } };
  const tournament = /^\/tournament\/([A-Za-z0-9]+)$/.exec(link);
  return tournament ? { screen: 'Tournament', params: { tournamentId: tournament[1] } } : null;
}

function go(navigationRef: NavigationContainerRef<ScreensTypes>, route: Route) {
  if (route.screen === 'Duel') navigationRef.navigate('Duel', route.params);
  else navigationRef.navigate('Tournament', route.params);
}

// Liga as notificações ao app: tocar numa notificação abre o duelo; com o
// app aberto, a notificação vira um toast (o sistema não mostra push com o
// app em primeiro plano); e mantém o token do aparelho salvo no perfil, já
// que o FCM troca o token de tempos em tempos.
export function useNotifications(navigationRef: NavigationContainerRef<ScreensTypes>): void {
  const profile = useAppSelector(state => state.profile.profile);
  const ready = !!profile;
  const uid = profile?.uid;
  const enabled = !!profile?.notificationsEnabled;
  // Notificação que abriu o app antes do perfil carregar - navega depois.
  const pendingRef = useRef<Route | null>(null);

  useEffect(() => {
    const open = (link: unknown) => {
      const route = routeFromLink(link);
      if (!route) return;
      if (navigationRef.isReady() && ready) go(navigationRef, route);
      else pendingRef.current = route;
    };
    getInitialNotification(messaging).then(message => open(message?.data?.link));
    const unsubscribeOpened = onNotificationOpenedApp(messaging, message => open(message.data?.link));
    const unsubscribeForeground = onMessage(messaging, message => {
      if (message.notification?.title) {
        toast(message.notification.title, { description: message.notification.body });
      }
    });
    return () => {
      unsubscribeOpened();
      unsubscribeForeground();
    };
  }, [navigationRef, ready]);

  useEffect(() => {
    if (ready && pendingRef.current && navigationRef.isReady()) {
      go(navigationRef, pendingRef.current);
      pendingRef.current = null;
    }
  }, [ready, navigationRef]);

  useEffect(() => {
    if (!uid || !enabled) return;
    const save = (token: string) =>
      updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }).catch(() => undefined);
    hasPermission(messaging).then(status => {
      if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) {
        getToken(messaging).then(save).catch(() => undefined);
      }
    });
    return onTokenRefresh(messaging, save);
  }, [uid, enabled]);
}
