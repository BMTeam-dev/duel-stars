import { useEffect } from 'react';
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
import { ScreensTypes, TournamentTab } from '../../navigation/screensTypes';
import { useAppSelector } from '../../redux/store';
import { toast } from '../../shared/ui/toast';
import { db } from '../firestore/db';

const messaging = getMessaging();

const TABS: TournamentTab[] = ['info', 'players', 'rounds', 'standings'];

type Route =
  | { screen: 'Duel'; params: { duelId: string } }
  | {
      screen: 'Tournament';
      params: { tournamentId: string; tab?: TournamentTab };
    }
  | { screen: 'Profile' };

// Rotas que o backend manda em data.link (functions/src: duels, tournaments,
// medals); data.tab, quando vem, é a aba do torneio (ver functions/src/notify.ts).
function routeFromData(
  data: Record<string, unknown> | undefined,
): Route | null {
  const link = data?.link;
  if (typeof link !== 'string') return null;
  if (link === '/profile') return { screen: 'Profile' };
  const duel = /^\/duel\/([A-Za-z0-9]+)$/.exec(link);
  if (duel) return { screen: 'Duel', params: { duelId: duel[1] } };
  const tournament = /^\/tournament\/([A-Za-z0-9]+)$/.exec(link);
  if (!tournament) return null;
  const tab = TABS.find(value => value === data?.tab);
  return { screen: 'Tournament', params: { tournamentId: tournament[1], tab } };
}

// Só dá pra navegar depois que as telas do app (com perfil) estão montadas:
// antes disso o navigator está vazio (carregando) ou em Login/Onboarding.
function canNavigate(navigationRef: NavigationContainerRef<ScreensTypes>) {
  return (
    navigationRef.isReady() &&
    !!navigationRef.getRootState()?.routeNames.includes('Tournament')
  );
}

function go(navigationRef: NavigationContainerRef<ScreensTypes>, route: Route) {
  if (route.screen === 'Duel') navigationRef.navigate('Duel', route.params);
  else if (route.screen === 'Tournament')
    navigationRef.navigate('Tournament', route.params);
  else navigationRef.navigate('MainTabs', { screen: 'Profile' });
}

// Liga as notificações ao app: tocar numa notificação abre a tela dela (o
// duelo, ou o torneio já na aba certa); com o app aberto, a notificação vira
// um toast com "Ver" (o sistema não mostra push com o app em primeiro plano);
// e mantém o token do aparelho salvo no perfil, já que o FCM troca o token
// de tempos em tempos.
export function useNotifications(
  navigationRef: NavigationContainerRef<ScreensTypes>,
): void {
  const profile = useAppSelector(state => state.profile.profile);
  const uid = profile?.uid;
  const enabled = !!profile?.notificationsEnabled;

  useEffect(() => {
    // Notificação que abriu o app antes das telas montarem (app fechado:
    // login e perfil ainda carregando) - navega quando o navigator mudar.
    let pending: Route | null = null;
    const flush = () => {
      if (pending && canNavigate(navigationRef)) {
        go(navigationRef, pending);
        pending = null;
      }
    };
    const open = (data: Record<string, unknown> | undefined) => {
      pending = routeFromData(data);
      flush();
    };
    getInitialNotification(messaging).then(message => open(message?.data));
    const unsubscribeOpened = onNotificationOpenedApp(messaging, message =>
      open(message.data),
    );
    // 'ready': o navigator montou pela primeira vez; 'state': trocou de grupo
    // de telas (ex.: terminou o cadastro).
    const unsubscribeReady = navigationRef.addListener('ready', flush);
    const unsubscribeState = navigationRef.addListener('state', flush);
    const unsubscribeForeground = onMessage(messaging, message => {
      if (!message.notification?.title) return;
      const route = routeFromData(message.data);
      toast(message.notification.title, {
        description: message.notification.body,
        action: route
          ? { label: 'Ver', onClick: () => open(message.data) }
          : undefined,
      });
    });
    return () => {
      unsubscribeOpened();
      unsubscribeReady();
      unsubscribeState();
      unsubscribeForeground();
    };
  }, [navigationRef]);

  useEffect(() => {
    if (!uid || !enabled) return;
    const save = (token: string) =>
      updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }).catch(
        () => undefined,
      );
    hasPermission(messaging).then(status => {
      if (
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL
      ) {
        getToken(messaging)
          .then(save)
          .catch(() => undefined);
      }
    });
    return onTokenRefresh(messaging, save);
  }, [uid, enabled]);
}
