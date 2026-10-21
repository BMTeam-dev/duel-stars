import { NavigatorScreenParams } from '@react-navigation/native';

// Uma entrada por tela, com os parâmetros de navegação dela (ou `undefined`
// se não recebe nenhum). Toda vez que criar uma tela nova (ver CLAUDE.md,
// seção "como adicionar um módulo"), registre ela aqui - telas de aba vão
// em TabsTypes, o resto em ScreensTypes.
export type TabsTypes = {
  Feed: undefined;
  Ranking: undefined;
  Cards: undefined;
  Profile: undefined;
};

export type ScreensTypes = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<TabsTypes>;
  EditProfile: undefined;
  CreateChallenge: undefined;
  // 'code': só o campo do código, sem câmera (categorias online).
  ScanChallenge: { mode?: 'camera' | 'code' } | undefined;
  Duel: { duelId: string };
};
