import {
  getCrashlytics,
  log as crashlyticsLog,
  recordError as crashlyticsRecordError,
  setUserId as crashlyticsSetUserId,
} from '@react-native-firebase/crashlytics';

const instance = getCrashlytics();

// Camada separada do Analytics (analytics.service.ts) de propósito - eventos
// de analytics são "o que o usuário fez", isso aqui é "o que quebrou
// tecnicamente", com stack trace completo. Os dois se complementam, não se
// sobrepõem.
//
// IMPORTANTE: Crashlytics vem com a coleta DESATIVADA em build de debug a
// nível nativo (checa BuildConfig.DEBUG antes mesmo do JS carregar) - não
// dá pra contornar isso chamando setCrashlyticsCollectionEnabled(true) no
// JS, é um gate nativo. Funciona normalmente em build de release. Se
// precisar testar em debug mesmo assim, crie um `firebase.json` na raiz com
// `{"react-native": {"crashlytics_debug_enabled": true}}` e rebuilde (só
// funciona lido na inicialização nativa, não em runtime).
export const crashReportingService = {
  // Mesmo uid do Firebase Auth usado em analyticsService.setUser - permite
  // filtrar os crashes/erros de uma pessoa específica no Console.
  setUser: (uid: string | null) => crashlyticsSetUserId(instance, uid ?? ''),

  // Erro real, com stack trace - aparece no Console como "não fatal" (não
  // derruba o app, só registra).
  recordError: (error: unknown, context?: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    if (context) {
      crashlyticsLog(instance, context);
    }
    crashlyticsRecordError(instance, err);
  },

  // Trilha de "breadcrumbs" - aparece junto do próximo erro registrado,
  // ajuda a reconstruir o que aconteceu logo antes de quebrar.
  log: (message: string) => crashlyticsLog(instance, message),
};
