import {
  getAnalytics,
  logEvent,
  logScreenView,
  setUserId,
} from '@react-native-firebase/analytics';

// Eventos mínimos pra medir ativação/engajamento/retenção. Adicione os seus
// aqui seguindo o mesmo padrão - uma função por evento, nomes de evento em
// snake_case (convenção do GA4/Firebase).
const analyticsInstance = getAnalytics();

export const analyticsService = {
  logAppOpened: () => logEvent(analyticsInstance, 'app_opened'),

  // Vincula os eventos seguintes ao uid do Firebase Auth (null desloga) -
  // sem isso, dá pra ver "screen_view" acontecendo, mas não juntar tudo numa
  // timeline de UMA pessoa (ver User Explorer no Firebase Console).
  setUser: (uid: string | null) => setUserId(analyticsInstance, uid),

  // Padrão oficial de tela vista com React Navigation + Firebase Analytics
  // (não é automático como em apps nativos puros - precisa chamar isso a
  // cada troca de rota). Ver App.tsx (NavigationContainer onStateChange).
  logScreenView: (screenName: string) =>
    logScreenView(analyticsInstance, { screen_name: screenName, screen_class: screenName }),

  // 'login'/'sign_up' são eventos padrão do GA4 (Firebase já tem relatórios
  // prontos pra eles) - por isso usam esses nomes exatos, não um customizado.
  logLoginCompleted: (method: 'email' | 'google') =>
    logEvent(analyticsInstance, 'login', { method }),
  logSignupStarted: () => logEvent(analyticsInstance, 'signup_started'),
  logSignupCompleted: (method: 'email' | 'google') =>
    logEvent(analyticsInstance, 'sign_up', { method }),
};
